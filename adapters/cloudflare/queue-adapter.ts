/**
 * Cloudflare Queues Adapter
 * Implements IQueuePort using Cloudflare Queues (managed message queue).
 */

import type {
  IQueuePort,
  QueueMessage,
  QueueHandler,
  QueueConsumeOptions,
  QueueMetadata,
} from "../../ports/index";
import type { CloudflareEnv } from "./index";

export class CloudflareQueueAdapter implements IQueuePort {
  private env: CloudflareEnv;
  private consumers: Map<string, QueueHandler> = new Map();

  constructor(env: CloudflareEnv) {
    this.env = env;
  }

  async send(queue: string, message: QueueMessage): Promise<void> {
    const q = this.resolveQueue(queue);
    await q.send({
      body: message.body,
      contentType: message.contentType ?? "application/json",
      delaySeconds: message.delaySeconds,
    });
  }

  async sendBatch(queue: string, messages: QueueMessage[]): Promise<void> {
    const q = this.resolveQueue(queue);
    await q.sendBatch(
      messages.map((msg) => ({
        body: msg.body,
        contentType: msg.contentType ?? "application/json",
        delaySeconds: msg.delaySeconds,
      }))
    );
  }

  consume(queue: string, handler: QueueHandler, options?: QueueConsumeOptions): void {
    this.consumers.set(queue, handler);
    // In Workers, consumers are registered via the queue event handler in the worker
    // The actual dispatch happens in the queue() export function
  }

  async getMetadata(queue: string): Promise<QueueMetadata> {
    // Cloudflare Queues do not expose depth metadata via the Workers API
    // This is a known limitation — we return best-effort data
    return {
      name: queue,
      approximateDepth: -1, // not available
    };
  }

  /**
   * Process incoming queue messages — called from the Worker's queue() handler.
   * This bridges the Cloudflare Queue message format to our internal QueueMessage.
   */
  async handleMessage(queueName: string, batch: MessageBatch<unknown>): Promise<void> {
    const handler = this.consumers.get(queueName);
    if (!handler) {
      console.error(`No consumer registered for queue: ${queueName}`);
      return;
    }

    const messages: QueueMessage[] = batch.messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      contentType: "application/json",
      metadata: msg.headers as Record<string, string>,
    }));

    const ack = (ids: string[]) => {
      for (const msg of batch.messages) {
        if (ids.includes(msg.id)) {
          msg.ack();
        }
      }
    };

    const retry = (ids: string[], delaySeconds?: number) => {
      for (const msg of batch.messages) {
        if (ids.includes(msg.id)) {
          msg.retry({ delaySeconds: delaySeconds ?? 60 });
        }
      }
    };

    await handler(messages, ack, retry);
  }

  private resolveQueue(queue: string): Queue {
    switch (queue) {
      case "audit":
        return this.env.AUDIT_QUEUE;
      case "ingestion":
        return this.env.INGESTION_QUEUE;
      default:
        throw new Error(`Unknown queue: ${queue}`);
    }
  }
}

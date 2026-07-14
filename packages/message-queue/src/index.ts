/**
 * MyCodexVantaOS Message Queue
 * Provides reliable message queuing and processing
 */

export interface Message {
  id: string;
  queue: string;
  payload: any;
  priority: number;
  attemptCount: number;
  maxAttempts: number;
}

export class MessageQueue {
  private queues: Map<string, Message[]> = new Map();
  private processors: Map<string, (message: Message) => Promise<void>> = new Map();

  async enqueue(queue: string, message: Omit<Message, 'id' | 'attemptCount'>): Promise<string> {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      attemptCount: 0,
    };

    if (!this.queues.has(queue)) {
      this.queues.set(queue, []);
    }
    this.queues.get(queue)!.push(fullMessage);
    return fullMessage.id;
  }

  async dequeue(queue: string): Promise<Message | undefined> {
    const messages = this.queues.get(queue);
    return messages?.shift();
  }

  registerProcessor(queue: string, processor: (message: Message) => Promise<void>): void {
    this.processors.set(queue, processor);
  }

  async process(queue: string): Promise<void> {
    const processor = this.processors.get(queue);
    if (!processor) return;

    const message = await this.dequeue(queue);
    if (message) {
      try {
        await processor(message);
      } catch (error) {
        if (message.attemptCount < message.maxAttempts) {
          message.attemptCount++;
          await this.enqueue(queue, message);
        }
      }
    }
  }
}

export default MessageQueue;

/**
 * MyCodeXvantaOS — Queue Port
 * Abstracts message queue operations for async processing.
 *
 * Cloudflare implementation: Queues
 * Portable alternatives: RabbitMQ, Kafka, Bull, SQS
 *
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Queue Port Interface ───────────────────────────────────────────────

export interface IQueuePort {
  /** Send a message to a queue */
  send(queue: string, message: QueueMessage): Promise<void>;

  /** Send a batch of messages to a queue */
  sendBatch(queue: string, messages: QueueMessage[]): Promise<void>;

  /** Register a consumer for a queue */
  consume(queue: string, handler: QueueHandler, options?: QueueConsumeOptions): void;

  /** Get queue metadata (depth, etc.) */
  getMetadata(queue: string): Promise<QueueMetadata>;
}

// ── Supporting Types ───────────────────────────────────────────────────

export interface QueueMessage {
  id?: string;
  body: unknown;
  contentType?: string;
  delaySeconds?: number;
  metadata?: Record<string, string>;
}

export type QueueHandler = (
  messages: QueueMessage[],
  ack: (ids: string[]) => void,
  retry: (ids: string[], delaySeconds?: number) => void
) => Promise<void>;

export interface QueueConsumeOptions {
  maxBatchSize?: number;
  maxBatchTimeoutMs?: number;
  maxRetries?: number;
  deadLetterQueue?: string;
}

export interface QueueMetadata {
  name: string;
  approximateDepth: number;
  createdAt?: string;
}

// ── Job Queue Port (higher-level, domain-specific) ─────────────────────
// Typed job queue for platform operations: ingestion, indexing, repair.

export type JobType =
  | "document-ingest"
  | "document-chunk"
  | "document-embed"
  | "collection-reindex"
  | "knowledge-repair"
  | "audit-verify"
  | "usage-aggregate";

export interface JobPayload {
  jobId: string;
  jobType: JobType;
  workspaceId: string;
  data: Record<string, unknown>;
  priority?: number;
  maxRetries?: number;
}

export interface IJobQueuePort {
  /** Enqueue a job */
  enqueue(job: JobPayload): Promise<string>;

  /** Lease a job for processing (mark as in-progress) */
  lease(queue: JobType, workerId: string, leaseDurationMs: number): Promise<JobPayload | null>;

  /** Mark a job as completed */
  complete(jobId: string, result?: Record<string, unknown>): Promise<void>;

  /** Mark a job as failed (with retry logic) */
  fail(jobId: string, error: string, retry?: boolean): Promise<void>;
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MyCodexVantaOS — Port Interfaces (平台中立接口層)                    ║
 * ║  Platform-neutral abstractions that define HOW the core and         ║
 * ║  application layers interact with infrastructure. No cloud-vendor   ║
 * ║  types leak through these interfaces.                               ║
 * ║  Version: 1.0.0-constitution                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Architecture Principle:
 *   core/      → defines platform models, depends on NOTHING
 *   ports/     → defines interfaces, depends on core/ types only
 *   application/ → defines service logic, depends on ports/ + core/
 *   adapters/  → implements ports/ for specific providers (Cloudflare, Docker, etc.)
 *
 * Port = "what the platform needs" (interface)
 * Adapter = "how a specific provider satisfies that need" (implementation)
 */

// ─── Storage Port ─────────────────────────────────────────────────────
// Abstracts blob/object storage operations.
// Cloudflare implementation: R2
// Portable alternatives: S3, MinIO, local-fs

export interface IStoragePort {
  /** Store a blob and return its key */
  put(
    bucket: string,
    key: string,
    data: Uint8Array,
    options?: StoragePutOptions
  ): Promise<StoragePutResult>;

  /** Retrieve a blob by key */
  get(bucket: string, key: string): Promise<Uint8Array | null>;

  /** Delete a blob by key */
  delete(bucket: string, key: string): Promise<void>;

  /** Check if a blob exists */
  exists(bucket: string, key: string): Promise<boolean>;

  /** Get metadata for a blob */
  getMetadata(bucket: string, key: string): Promise<StorageMetadata | null>;

  /** List blobs with optional prefix filter */
  list(bucket: string, options?: StorageListOptions): Promise<StorageListResult>;

  /** Generate a presigned URL for temporary access */
  getPresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
}

export interface StoragePutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface StoragePutResult {
  key: string;
  etag: string;
  sizeBytes: number;
}

export interface StorageMetadata {
  key: string;
  sizeBytes: number;
  contentType: string;
  lastModified: string;
  etag: string;
  customMetadata: Record<string, string>;
}

export interface StorageListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface StorageListResult {
  keys: string[];
  cursor?: string;
  truncated: boolean;
}

// ─── Database Port ────────────────────────────────────────────────────
// Abstracts relational database operations.
// Cloudflare implementation: D1 (SQLite)
// Portable alternatives: PostgreSQL, SQLite

export interface IDatabasePort {
  /** Execute a write query (INSERT, UPDATE, DELETE) */
  execute(query: string, params?: unknown[]): Promise<DatabaseResult>;

  /** Execute a read query (SELECT) */
  query<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>;

  /** Execute a read query returning a single row */
  queryFirst<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null>;

  /** Execute multiple statements in a transaction */
  batch<T = Record<string, unknown>>(statements: DatabaseStatement[]): Promise<T[][]>;

  /** Run a migration */
  migrate(migrationFile: string): Promise<void>;

  /** Get database metadata for health checks */
  getMetadata(): Promise<DatabaseMetadata>;
}

export interface DatabaseStatement {
  query: string;
  params?: unknown[];
}

export interface DatabaseResult {
  rowsAffected: number;
  lastInsertRowid?: number;
}

export interface DatabaseMetadata {
  provider: string;
  version: string;
  databaseSizeBytes?: number;
  tableCount?: number;
}

// ─── Cache Port ───────────────────────────────────────────────────────
// Abstracts key-value cache operations.
// Cloudflare implementation: KV
// Portable alternatives: Redis, in-memory Map

export interface ICachePort {
  /** Get a value by key */
  get<T = string>(key: string): Promise<T | null>;

  /** Set a value with optional TTL */
  put(key: string, value: unknown, options?: CachePutOptions): Promise<void>;

  /** Delete a key */
  delete(key: string): Promise<void>;

  /** List keys with optional prefix filter */
  list(options?: CacheListOptions): Promise<CacheListResult>;

  /** Atomic compare-and-set */
  atomicSet(
    key: string,
    expectedValue: unknown,
    newValue: unknown,
    options?: CachePutOptions
  ): Promise<boolean>;
}

export interface CachePutOptions {
  expirationTtl?: number; // seconds
  metadata?: Record<string, string>;
}

export interface CacheListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface CacheListResult {
  keys: string[];
  cursor?: string;
  list_complete: boolean;
}

// ─── Search Port ──────────────────────────────────────────────────────
// Abstracts vector search and full-text search operations.
// Cloudflare implementation: Vectorize + D1 FTS
// Portable alternatives: Qdrant, pgvector, Typesense

export interface ISearchPort {
  /** Insert vectors into the index */
  upsert(vectors: SearchVector[]): Promise<void>;

  /** Query vectors by similarity */
  query(vector: number[], options?: SearchQueryOptions): Promise<SearchResult[]>;

  /** Delete vectors by ID */
  deleteByIds(ids: string[]): Promise<void>;

  /** Get index metadata */
  getIndexMetadata(): Promise<SearchIndexMetadata>;

  /** Full-text search (if supported) */
  fulltextSearch(query: string, options?: FulltextSearchOptions): Promise<SearchResult[]>;
}

export interface SearchVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
  namespace?: string;
}

export interface SearchQueryOptions {
  topK?: number;
  filter?: Record<string, unknown>;
  namespace?: string;
  returnMetadata?: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  values?: number[];
}

export interface SearchIndexMetadata {
  dimension: number;
  vectorCount: number;
  indexType: string;
  lastUpdated: string;
}

export interface FulltextSearchOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
}

// ─── Model Port ───────────────────────────────────────────────────────
// Abstracts LLM invocation operations.
// Implementations: OpenAI, Anthropic, Google, Ollama, custom OpenAI-compatible

export interface IModelPort {
  /** Invoke a model with a prompt and return the full response */
  invoke(request: ModelRequest): Promise<ModelResponse>;

  /** Invoke a model with streaming response */
  invokeStream(request: ModelRequest): AsyncIterable<ModelChunk>;

  /** Generate embeddings for input texts */
  embed(input: EmbedRequest): Promise<EmbedResponse>;

  /** Health check the model endpoint */
  healthCheck(): Promise<ModelHealthStatus>;
}

export interface ModelRequest {
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ModelResponse {
  id: string;
  content: string;
  model: string;
  usage: ModelUsage;
  finishReason: string;
  created: string;
}

export interface ModelChunk {
  id: string;
  content: string;
  model: string;
  usage?: Partial<ModelUsage>;
  finishReason?: string;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface EmbedRequest {
  model: string;
  input: string[];
  dimensions?: number;
}

export interface EmbedResponse {
  model: string;
  embeddings: number[][];
  usage: { totalTokens: number };
}

export interface ModelHealthStatus {
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

// ─── Queue Port ───────────────────────────────────────────────────────
// Abstracts message queue operations for async processing.
// Cloudflare implementation: Queues
// Portable alternatives: RabbitMQ, Kafka, Bull

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

// ─── Identity Port ────────────────────────────────────────────────────
// Abstracts authentication and authorization checks.
// This is an internal port — the identity service exposes it.

export interface IIdentityPort {
  /** Validate an access token and return claims */
  validateToken(accessToken: string): Promise<TokenClaims>;

  /** Check if a subject has a specific permission in a workspace */
  checkPermission(
    subjectId: string,
    workspaceId: string,
    action: string,
    resourceKind: string
  ): Promise<boolean>;

  /** Get subject details */
  getSubject(subjectId: string): Promise<SubjectInfo>;

  /** Resolve role for a subject in a workspace */
  resolveRole(subjectId: string, workspaceId: string): Promise<Role>;
}

export interface TokenClaims {
  subjectId: string;
  workspaceId?: string;
  role?: string;
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
}

export interface SubjectInfo {
  id: string;
  email: string;
  displayName: string;
  mfaEnabled: boolean;
  status: string;
}

export type Role =
  | 'platform-admin'
  | 'workspace-owner'
  | 'workspace-member'
  | 'workspace-viewer'
  | 'agent-service'
  | 'auditor';

// ─── Audit Port ───────────────────────────────────────────────────────
// Abstracts audit event emission and querying.

export interface IAuditPort {
  /** Emit an audit event */
  emitEvent(event: AuditEventInput): Promise<void>;

  /** Emit a batch of audit events */
  emitBatch(events: AuditEventInput[]): Promise<void>;

  /** Query audit events */
  queryEvents(filter: AuditFilter): Promise<AuditEventOutput[]>;

  /** Verify integrity chain */
  verifyIntegrity(fromTimestamp: string, toTimestamp: string): Promise<IntegrityReport>;
}

export interface AuditEventInput {
  eventType: string;
  category: string;
  severity: string;
  subjectId: string;
  workspaceId?: string;
  resourceKind?: string;
  resourceId?: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
  parentEventId?: string;
}

export interface AuditEventOutput extends AuditEventInput {
  eventId: string;
  timestamp: string;
  hash: string;
  previousHash: string;
  chainIndex: number;
  closedLoopStatus: string;
}

export interface AuditFilter {
  eventType?: string;
  category?: string;
  severity?: string;
  subjectId?: string;
  workspaceId?: string;
  resourceKind?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

export interface IntegrityReport {
  verified: boolean;
  violationsDetected: number;
  violations: Array<{
    chainIndex: number;
    expectedHash: string;
    actualHash: string;
  }>;
  checkedRange: { from: number; to: number };
}

// ─── Usage Port ───────────────────────────────────────────────────────
// Abstracts usage metering and rate limit checking.

export interface IUsagePort {
  /** Record a usage event */
  record(metric: UsageMetric): Promise<void>;

  /** Check if an action is within rate limits */
  checkRateLimit(workspaceId: string, action: string): Promise<RateLimitStatus>;

  /** Get current usage for a workspace */
  getUsage(workspaceId: string, period: string): Promise<UsageReport>;
}

export interface UsageMetric {
  workspaceId: string;
  serviceId: string;
  metricType: 'api_calls' | 'tokens' | 'storage_bytes' | 'compute_ms';
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  retryAfterMs?: number;
}

export interface UsageReport {
  workspaceId: string;
  period: string;
  metrics: Record<string, number>;
  limits: Record<string, number>;
  percentageUsed: Record<string, number>;
}

/**
 * MyCodexVantaOS — Ports Package
 * Platform-neutral interface layer.
 *
 * Architecture Principle:
 *   core/       → defines platform models, depends on NOTHING
 *   ports/      → defines interfaces, depends on core/ types only
 *   application/→ defines service logic, depends on ports/ + core/
 *   adapters/   → implements ports/ for specific providers
 *
 * Port = "what the platform needs" (interface)
 * Adapter = "how a specific provider satisfies that need" (implementation)
 */

// ── Database ───────────────────────────────────────────────────────────
export type {
  IDatabasePort,
  DatabaseStatement,
  DatabaseResult,
  DatabaseMetadata,
  IRepository,
} from './database';

// ── Object Storage ─────────────────────────────────────────────────────
export type {
  IObjectStoragePort,
  StoragePutOptions,
  StoragePutResult,
  StorageMetadata,
  StorageListOptions,
  StorageListResult,
} from './object-storage';

// ── Search ─────────────────────────────────────────────────────────────
export type {
  ISearchPort,
  SearchVector,
  SearchQueryOptions,
  SearchResult,
  SearchIndexMetadata,
  FulltextSearchOptions,
  IKnowledgeSearchPort,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  IndexableChunk,
} from './search';

// ── Model Provider ─────────────────────────────────────────────────────
export type {
  IChatModelPort,
  IEmbeddingModelPort,
  IModelPort,
  ModelRequest,
  ModelMessage,
  ModelResponse,
  ModelChunk,
  ModelUsage,
  EmbedRequest,
  EmbedResponse,
  ModelHealthStatus,
} from './model-provider';

// ── Queue ──────────────────────────────────────────────────────────────
export type {
  IQueuePort,
  QueueMessage,
  QueueHandler,
  QueueConsumeOptions,
  QueueMetadata,
  JobType,
  JobPayload,
  IJobQueuePort,
} from './queue';

// ── Auth ───────────────────────────────────────────────────────────────
export type {
  IAuthPort,
  TokenClaims,
  TokenPair,
  Role,
  CredentialType,
  CredentialRef,
  SubjectInfo,
  SessionInfo,
  PermissionCheck,
  PermissionResult,
} from './auth';

/**
 * MyCodeXvantaOS — Core Package
 * Platform constitution: the divine models that define what IS.
 *
 * Five Constitutional Models:
 *   1. Service Catalog  — 所有能力必須被服務化
 *   2. Resource Model   — 所有服務必須有資源模型
 *   3. Policy Model     — 所有資源必須受政策治理
 *   4. Audit Model      — 所有行為必須可審計
 *   5. Knowledge Model  — 所有知識必須可追蹤、可使用、可演化
 *
 * Dependency rule: core/ depends on NOTHING external.
 */

// ── Shared Utilities ───────────────────────────────────────────────────
export {
  generateId,
  generateUrn,
  isValidKebabCase,
  PLATFORM_NAMESPACE,
  URN_SCHEME,
} from './shared';

export type { ResourceMetadata, ResourceCondition, OwnerReference } from './shared';
export type { PaginationRequest, PaginationResponse } from './shared';
export type { PlatformError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, QuotaExceededError, ConflictError } from './shared';
export { ok, err, isOk, isErr } from './shared';
export type { Result } from './shared';
export { nowISO, parseISO, isExpired, addDays, daysBetween } from './shared';
export { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from './shared';

// ── Service Catalog ────────────────────────────────────────────────────
export type {
  ServiceDefinition,
  ServiceCategory,
  ServicePhase,
  ServiceRuntime,
  ServicePort,
  ServiceCatalog,
  DependencyGraph,
  RuntimeProfile,
  GovernanceOverlay,
} from './service-catalog';

export type {
  ServiceCategoryDefinition,
  CategoryServiceRef,
} from './service-catalog';

export { MVP_SERVICE_CATEGORIES } from './service-catalog';

// ── Resource Model ─────────────────────────────────────────────────────
export type {
  Resource,
  ResourcePhase,
  ResourceReference,
  PlatformResourceKind,
} from './resource-model';

export { resourceUri } from './resource-model';

// ── Policy Model ───────────────────────────────────────────────────────
export type {
  PolicyRule,
  PolicyEffect,
  PolicySubject,
  PolicyAction,
  PolicyResource,
  PolicyCondition,
  PolicyDecision,
  PolicyEvaluationContext,
} from './policy-model';

export { STANDARD_ACTIONS } from './policy-model';

// ── Audit Model ────────────────────────────────────────────────────────
export type {
  AuditEvent,
  AuditEventCategory,
  AuditActor,
  AuditResourceRef,
  AuditContext,
  IntegrityReport,
  ClosedLoopStatus,
} from './audit-model';

export { STANDARD_AUDIT_EVENTS } from './audit-model';

// ── Knowledge Model ────────────────────────────────────────────────────
export type {
  DocumentSpec,
  DocumentStatus,
  DocumentFormat,
  DocumentPhase,
  ChunkMetadata,
  DocumentChunkSpec,
  CollectionPhase,
  ChunkStrategy,
  KnowledgeCollectionSpec,
  KnowledgeCollectionStatus,
  FreshnessMetrics,
  SearchType,
  EvidenceLevel,
  SearchOptions,
  SearchResultItem,
  SourceTrace,
  RetrievalReceiptSpec,
  RetrievalReceiptStatus,
  AnswerTraceSpec,
  AnswerTraceStatus,
  KnowledgeIndexStats,
  MemoryType,
  MemoryPhase,
  MemoryItemSpec,
  MemoryItemStatus,
  KnowledgeIssueType,
  KnowledgeIssueSeverity,
  KnowledgeIssuePhase,
  KnowledgeIssueSpec,
  KnowledgeIssueStatus,
  KnowledgeRepairType,
  KnowledgeRepairPhase,
  KnowledgeRepairSpec,
  KnowledgeRepairStatus,
  DerivedArtifactType,
  DerivedArtifactPhase,
  DerivedArtifactSpec,
  DerivedArtifactStatus,
} from './knowledge-model';

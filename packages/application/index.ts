/**
 * MyCodeXvantaOS — Application Package
 * Service orchestration logic that depends on ports/ and core/.
 *
 * Architecture Principle:
 *   - application/ knows about ports/ (what it needs) and core/ (types it uses)
 *   - application/ does NOT know about adapters/ (how ports are implemented)
 *   - application/ does NOT import any cloud-vendor SDK
 *
 * 8 Service Categories:
 *   identity    → security
 *   workspace   → workspace
 *   knowledge   → knowledge
 *   agent       → agent
 *   model       → model
 *   audit       → security
 *   usage       → security
 *   automation  → automation
 */

// ── Identity (security) ────────────────────────────────────────────────
export { IdentityService } from "./identity";
export type {
  IdentityServiceDeps,
  RegisterSubjectInput,
  AuthenticateInput,
  CreateSessionInput,
  SubjectPhase,
  SubjectResource,
  IdentityAuditEvent,
} from "./identity";

// ── Workspace (workspace) ──────────────────────────────────────────────
export { WorkspaceService } from "./workspace";
export type {
  WorkspaceServiceDeps,
  WorkspacePhase,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  QuotaSpec,
  QuotaUsage,
  WorkspaceResource,
  MembershipResource,
  WorkspaceAuditEvent,
} from "./workspace";

// ── Knowledge (knowledge) ──────────────────────────────────────────────
export { KnowledgeService } from "./knowledge";
export type {
  KnowledgeServiceDeps,
  DocumentFormat,
  DocumentPhase,
  IngestDocumentInput,
  DocumentResource,
  CollectionPhase,
  ChunkStrategy,
  CreateCollectionInput,
  CollectionResource,
  SearchType,
  EvidenceLevel,
  SearchKnowledgeInput,
  SearchResultItem,
  KnowledgeIssueType,
  KnowledgeAuditEvent,
} from "./knowledge";

// ── Agent (agent) ──────────────────────────────────────────────────────
export { AgentService } from "./agent";
export type {
  AgentServiceDeps,
  ChatSessionPhase,
  CreateSessionInput as CreateAgentSessionInput,
  ChatSessionResource,
  ChatMessage,
  SendMessageInput,
  AgentSearchResult,
  AgentAuditEvent,
} from "./agent";

// ── Model (model) ──────────────────────────────────────────────────────
export { ModelService } from "./model";
export type {
  ModelServiceDeps,
  ModelProvider,
  ModelEndpointPhase,
  RegisterEndpointInput,
  ModelEndpointResource,
  CallChatModelInput,
  CallEmbeddingModelInput,
  ModelAuditEvent,
} from "./model";

// ── Audit (security) ───────────────────────────────────────────────────
export { AuditService } from "./audit";
export type {
  AuditServiceDeps,
  AuditEventCategory,
  AuditEventSeverity,
  ClosedLoopStatus,
  WriteAuditEventInput,
  AuditEventResource,
  ListAuditEventsInput,
  IntegrityVerificationResult,
} from "./audit";

// ── Usage (security) ───────────────────────────────────────────────────
export { UsageService } from "./usage";
export type {
  UsageServiceDeps,
  Tier,
  MeterDimension,
  MeterUsageInput,
  QuotaStatus,
  UsageRecord,
  UsageReport,
  UsageAuditEvent,
} from "./usage";

// ── Automation (automation) ────────────────────────────────────────────
export { AutomationService } from "./automation";
export type {
  AutomationServiceDeps,
  JobPhase,
  EnqueueJobInput,
  JobResource,
  AutomationAuditEvent,
} from "./automation";

// ── Service Dependency Map ─────────────────────────────────────────────

export const SERVICE_DEPENDENCIES = {
  identity: ["database", "queue", "audit"] as const,
  workspace: ["database", "audit", "auth"] as const,
  knowledge: ["database", "object-storage", "search", "queue", "auth", "audit"] as const,
  agent: ["database", "chat-model", "queue", "auth", "search", "audit", "usage"] as const,
  model: ["database", "chat-model", "embedding-model", "auth", "audit", "usage"] as const,
  audit: ["database", "queue"] as const,
  usage: ["database", "cache", "audit"] as const,
  automation: ["database", "queue", "audit"] as const,
} as const;

export type ServiceId = keyof typeof SERVICE_DEPENDENCIES;

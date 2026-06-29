/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MyCodeXvantaOS — Core Models (平台核心模型)                         ║
 * ║  Defines platform models that depend on NO cloud vendor.           ║
 * ║  These types are the "divine constitution" of the platform —       ║
 * ║  they define what IS, not HOW it runs.                             ║
 * ║  Version: 1.0.0-constitution                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ─── Universal Resource ───────────────────────────────────────────────
// Every entity in the platform is a resource with this structure.

export interface Resource<TSpec = Record<string, unknown>, TStatus = Record<string, unknown>> {
  apiVersion: string;
  kind: string;
  metadata: ResourceMetadata;
  spec: TSpec;
  status?: TStatus;
}

export interface ResourceMetadata {
  id: string;
  urn: string;
  kind: string;
  workspaceId: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdBy: string;
  version: string;
  resourceVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: string;
}

// ─── Identity Models ──────────────────────────────────────────────────

export interface IdentitySubjectSpec {
  email: string;
  displayName: string;
  mfaEnabled: boolean;
  credentials: CredentialRef[];
  roles: Record<string, Role>;
}

export interface IdentitySubjectStatus {
  phase: SubjectPhase;
  conditions: ResourceCondition[];
  authProvider: string;
  lastAuthenticatedAt: string | null;
  mfaVerifiedAt: string | null;
  activeSessions: number;
}

export type SubjectPhase = 'unregistered' | 'active' | 'suspended' | 'deactivated';

export type Role =
  | 'platform-admin'
  | 'workspace-owner'
  | 'workspace-member'
  | 'workspace-viewer'
  | 'agent-service'
  | 'auditor';

export interface CredentialRef {
  id: string;
  type: 'password' | 'oauth' | 'mfa-totp' | 'mfa-webauthn' | 'api-key';
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TokenClaims {
  subjectId: string;
  workspaceId?: string;
  role?: Role;
  scopes: string[];
  iat: number;
  exp: number;
  sid: string; // session ID
}

// ─── Workspace Models ─────────────────────────────────────────────────

export interface WorkspaceSpec {
  displayName: string;
  description: string;
  ownerId: string;
  settings: WorkspaceSettings;
  quotas: QuotaSpec;
}

export interface WorkspaceStatus {
  phase: WorkspacePhase;
  conditions: ResourceCondition[];
  memberCount: number;
  resourceCount: number;
  quotaUsage: QuotaUsage;
  suspended: boolean;
}

export type WorkspacePhase = 'creating' | 'active' | 'suspended' | 'deleting' | 'deleted';

export interface WorkspaceSettings {
  dataResidency: string;
  defaultLanguage: string;
  mfaRequired: boolean;
  retentionPolicy: RetentionPolicy;
}

export interface RetentionPolicy {
  documents: number; // days
  chatSessions: number; // days
  auditEvents: number; // days
}

export interface QuotaSpec {
  maxMembers: number;
  maxResources: number;
  maxCollections: number;
  maxModelEndpoints: number;
  maxStorageMb: number;
}

export interface QuotaUsage {
  members: number;
  resources: number;
  collections: number;
  modelEndpoints: number;
  storageMb: number;
}

export interface Membership {
  subjectId: string;
  workspaceId: string;
  role: Role;
  addedAt: string;
  addedBy: string;
}

// ─── Knowledge Models ─────────────────────────────────────────────────

export interface DocumentSpec {
  title: string;
  format: DocumentFormat;
  collectionId: string;
  sourceUri: string | null;
  language: string;
}

export type DocumentFormat = 'pdf' | 'txt' | 'md' | 'html' | 'json' | 'csv' | 'docx';

export interface DocumentStatus {
  phase: DocumentPhase;
  conditions: ResourceCondition[];
  chunkCount: number;
  totalTokens: number;
  fileSizeBytes: number;
  verificationStatus: 'passed' | 'failed' | 'pending' | 'skipped';
}

export type DocumentPhase =
  'uploaded' | 'ingesting' | 'ready' | 'failed' | 'stale' | 'archived' | 'deleted';

export interface DocumentChunkSpec {
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding: number[] | null;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  pageNumber?: number;
  sectionTitle?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface KnowledgeCollectionSpec {
  name: string;
  description: string;
  embeddingModel: string;
  chunkStrategy: 'fixed' | 'semantic' | 'sentence';
  language: string;
}

export interface KnowledgeCollectionStatus {
  phase: CollectionPhase;
  conditions: ResourceCondition[];
  documentCount: number;
  totalChunks: number;
  totalTokens: number;
  lastIndexBuiltAt: string | null;
  freshness: FreshnessMetrics;
}

export type CollectionPhase = 'creating' | 'empty' | 'indexing' | 'ready' | 'degraded' | 'deleted';

export interface FreshnessMetrics {
  avgDocumentAgeDays: number;
  staleDocumentCount: number;
  lastIngestedAt: string | null;
}

export interface KnowledgeIssueSpec {
  issueType: 'stale' | 'contradiction' | 'gap' | 'hallucination' | 'broken-reference';
  affectedResourceIds: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  autoRepairEligible: boolean;
}

export interface KnowledgeRepairSpec {
  issueId: string;
  repairType: 're-ingest' | 're-embed' | 're-chunk' | 'delete' | 'merge' | 'supplement';
  automated: boolean;
  repairData: Record<string, unknown>;
}

// ─── Search & Retrieval Models ────────────────────────────────────────

export interface SearchOptions {
  topK: number;
  minScore: number;
  searchType: 'semantic' | 'fulltext' | 'hybrid';
  filters?: Record<string, unknown>;
  collectionIds?: string[];
}

export interface SearchResultItem {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  evidenceLevel: EvidenceLevel;
}

export type EvidenceLevel = 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded';

export interface SourceTrace {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  collectionId: string;
  relevanceScore: number;
}

// ─── AI Chat Models ───────────────────────────────────────────────────

export interface ChatSessionSpec {
  subjectId: string;
  modelEndpointId: string;
  systemPrompt: string | null;
  knowledgeCollectionIds: string[];
  temperature: number;
}

export interface ChatSessionStatus {
  phase: ChatSessionPhase;
  conditions: ResourceCondition[];
  messageCount: number;
  totalTokensUsed: number;
  lastMessageAt: string | null;
}

export type ChatSessionPhase = 'created' | 'active' | 'idle' | 'closed';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  evidenceLevel: EvidenceLevel | null;
  sourceTraces: SourceTrace[];
  tokensUsed: number;
  createdAt: string;
}

export interface AnswerTraceSpec {
  sessionId: string;
  messageId: string;
  retrievalReceiptIds: string[];
  modelEndpointId: string;
}

export interface MemoryItemSpec {
  sessionId: string;
  content: string;
  memoryType: 'short-term' | 'long-term' | 'episodic' | 'semantic';
  importance: number;
}

// ─── Model Endpoint Models ────────────────────────────────────────────

export interface ModelEndpointSpec {
  provider: ModelProvider;
  modelId: string;
  apiEndpoint: string;
  credentialRef: string; // encrypted reference — never plaintext
  parameters: ModelParameters;
  failoverEndpointId: string | null;
}

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';

export interface ModelParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface ModelEndpointStatus {
  phase: ModelEndpointPhase;
  conditions: ResourceCondition[];
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  totalInvocations: number;
  totalTokensUsed: number;
  lastInvokedAt: string | null;
  lastHealthCheckAt: string | null;
}

export type ModelEndpointPhase = 'registering' | 'active' | 'degraded' | 'revoked';

// ─── Governance Models ────────────────────────────────────────────────

export interface AuditEventSpec {
  eventType: string;
  category: EventCategory;
  severity: EventSeverity;
  subjectId: string;
  workspaceId: string | null;
  resourceKind: string | null;
  resourceId: string | null;
  action: string;
  data: Record<string, unknown>;
}

export type EventCategory = 'identity' | 'workspace' | 'knowledge' | 'ai' | 'model' | 'governance';
export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditEventStatus {
  hash: string;
  previousHash: string;
  chainIndex: number;
  closedLoopStatus: 'open' | 'completed' | 'timeout' | 'violated';
  closedAt: string | null;
}

export interface UsageRecordSpec {
  serviceId: string;
  metric: 'api_calls' | 'tokens' | 'storage_bytes' | 'compute_ms';
  quantity: number;
  tier: Tier;
  billingPeriod: string;
}

export type Tier = 'free' | 'pro' | 'enterprise';

// ─── Pipeline Models ──────────────────────────────────────────────────

export type IngestionPhase = 'validate' | 'extract' | 'chunk' | 'embed' | 'index' | 'verify';

export interface IngestionResult {
  documentId: string;
  phase: IngestionPhase;
  chunksCreated: number;
  tokensGenerated: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface VerificationReport {
  collectionId: string;
  checksRun: number;
  issuesFound: number;
  issues: KnowledgeIssueSpec[];
  passed: boolean;
  verifiedAt: string;
}

// ─── Policy Decision ──────────────────────────────────────────────────

export interface PolicyDecision {
  allowed: boolean;
  matchedPolicies: string[];
  deniedBy: string | null;
  conditions: Record<string, unknown>;
  evaluatedAt: string;
}

export interface PolicyEvaluationContext {
  subjectId: string;
  workspaceId: string;
  role: Role;
  action: string;
  resourceKind: string;
  resourceScope: 'workspace' | 'platform';
  tier: Tier;
}

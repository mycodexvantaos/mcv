/**
 * Governance Event Stream - Event Schema Definition
 *
 * CloudEvents-compliant event schema for mandatory governance event propagation.
 * Every governance-relevant action MUST emit an event through this schema,
 * ensuring closed-loop compliance verification and immutable audit trails.
 *
 * Based on:
 * - platform-governance-spec.yaml Section C (namespace governance coding)
 * - naming-spec-v1.md 15.2 (exception expiry and audit)
 * - CloudEvents CNCF specification v1.0
 */

// =============================================================================
// Event Type Registry
// =============================================================================

/**
 * Canonical governance event types.
 * Each type maps to a specific governance domain and action.
 * Format: mycodexvantaos.<domain>.<action>.<version>
 */
export const GovernanceEventTypes = {
  // AI Ethics events
  AI_ETHICS_BIAS_DETECTED: 'mycodexvantaos.ai-ethics.bias-detected.v1',
  AI_ETHICS_FAIRNESS_AUDIT: 'mycodexvantaos.ai-ethics.fairness-audit.v1',
  AI_ETHICS_COMPLIANCE_CHECK: 'mycodexvantaos.ai-ethics.compliance-check.v1',
  AI_ETHICS_MODEL_REVIEW: 'mycodexvantaos.ai-ethics.model-review.v1',
  AI_ETHICS_REMEDIATION: 'mycodexvantaos.ai-ethics.remediation.v1',

  // Blockchain / Ledger events
  BLOCKCHAIN_LEDGER_ANCHOR: 'mycodexvantaos.blockchain.ledger-anchor.v1',
  BLOCKCHAIN_CONTRACT_DEPLOY: 'mycodexvantaos.blockchain.contract-deploy.v1',
  BLOCKCHAIN_CONSENSUS_VERIFY: 'mycodexvantaos.blockchain.consensus-verify.v1',
  BLOCKCHAIN_PROOF_GENERATE: 'mycodexvantaos.blockchain.proof-generate.v1',

  // Governance policy events
  GOVERNANCE_POLICY_CREATED: 'mycodexvantaos.governance.policy-created.v1',
  GOVERNANCE_POLICY_UPDATED: 'mycodexvantaos.governance.policy-updated.v1',
  GOVERNANCE_POLICY_VIOLATION: 'mycodexvantaos.governance.policy-violation.v1',
  GOVERNANCE_EXCEPTION_GRANTED: 'mycodexvantaos.governance.exception-granted.v1',
  GOVERNANCE_EXCEPTION_EXPIRED: 'mycodexvantaos.governance.exception-expired.v1',
  GOVERNANCE_NAMING_VIOLATION: 'mycodexvantaos.governance.naming-violation.v1',

  // Event stream lifecycle events (meta)
  EVENT_STREAM_OPENED: 'mycodexvantaos.event-stream.opened.v1',
  EVENT_STREAM_CLOSED: 'mycodexvantaos.event-stream.closed.v1',
  EVENT_STREAM_VERIFIED: 'mycodexvantaos.event-stream.verified.v1',
  EVENT_STREAM_MERKLE_ANCHORED: 'mycodexvantaos.event-stream.merkle-anchored.v1',

  // CI/CD pipeline events
  PIPELINE_GATE_PASSED: 'mycodexvantaos.pipeline.gate-passed.v1',
  PIPELINE_GATE_FAILED: 'mycodexvantaos.pipeline.gate-failed.v1',
  PIPELINE_EVIDENCE_PRODUCED: 'mycodexvantaos.pipeline.evidence-produced.v1',

  // Capability/Provider registry events
  CAPABILITY_REGISTERED: 'mycodexvantaos.capability.registered.v1',
  PROVIDER_REGISTERED: 'mycodexvantaos.provider.registered.v1',
} as const;

export type GovernanceEventType = (typeof GovernanceEventTypes)[keyof typeof GovernanceEventTypes];

// =============================================================================
// Event Severity Levels
// =============================================================================

export enum EventSeverity {
  CRITICAL = 'critical', // Mandatory halt, requires human intervention
  HIGH = 'high', // Compliance violation, auto-remediation attempted
  MEDIUM = 'medium', // Warning, policy deviation detected
  LOW = 'low', // Informational, no action required
  INFO = 'info', // Audit trail entry, normal operation
}

// =============================================================================
// Closed-Loop States
// =============================================================================

export enum ClosedLoopState {
  EMITTED = 'emitted', // Event has been emitted
  ACKNOWLEDGED = 'acknowledged', // Consumer has acknowledged receipt
  PROCESSING = 'processing', // Consumer is processing the event
  VERIFIED = 'verified', // Compliance verification passed
  REMEDIATED = 'remediated', // Auto-remediation applied
  ANCHORED = 'anchored', // Event anchored to blockchain/ledger
  CLOSED = 'closed', // Closed-loop completed successfully
  FAILED = 'failed', // Closed-loop failed, requires escalation
  ESCALATED = 'escalated', // Escalated to human governance
}

// =============================================================================
// Governance Event Interface (CloudEvents v1.0 compliant)
// =============================================================================

export interface GovernanceEvent {
  // CloudEvents required attributes
  specversion: string; // Always "1.0"
  type: GovernanceEventType; // Event type from registry
  source: string; // URN of the emitting service
  id: string; // Unique event identifier (UUID)
  time: string; // ISO 8601 timestamp

  // CloudEvents optional attributes
  datacontenttype: string; // Always "application/json"
  dataschema: string; // Schema URI for validation

  // MyCodeXvantaOS governance extensions
  mycodexvantaosorgseverity: EventSeverity;
  mycodexvantaosorgclosedloopstate: ClosedLoopState;
  mycodexvantaosorgcorrelationid: string; // Correlates related events
  mycodexvantaosorgcapability: string; // Emitting capability
  mycodexvantaosorgprovider: string; // Emitting provider
  mycodexvantaosorgeracode: string; // Era namespace code
  mycodexvantaosorgmerkleroothash?: string; // Merkle root if anchored

  // Event payload
  data: GovernanceEventData;
}

// =============================================================================
// Event Data Payload
// =============================================================================

export interface GovernanceEventData {
  // Common fields
  description: string;
  actor: string; // Service or user that triggered the event
  affectedResources: AffectedResource[];

  // Compliance context
  complianceContext?: ComplianceContext;

  // AI Ethics specific
  ethicsContext?: EthicsContext;

  // Blockchain specific
  blockchainContext?: BlockchainContext;

  // Custom extensions
  extensions?: Record<string, unknown>;
}

export interface AffectedResource {
  urn: string; // URN of the affected resource
  type: string; // Resource type
  name: string; // Human-readable name
  changeType: 'created' | 'updated' | 'deleted' | 'violated' | 'verified';
}

export interface ComplianceContext {
  policyId: string; // Governance policy that applies
  ruleFile: string; // CI rule file reference
  enforceLevel: 'hard' | 'soft'; // Enforcement level
  passed: boolean; // Whether compliance check passed
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  rule: string;
  expected: string;
  actual: string;
  severity: EventSeverity;
  remediation: string;
}

export interface EthicsContext {
  modelId: string; // AI model being audited
  datasetId?: string; // Dataset used for training/evaluation
  biasMetrics: BiasMetric[];
  fairnessScore: number; // 0.0 to 1.0
  auditDecision: 'pass' | 'fail' | 'conditional';
  remediationSteps: string[];
}

export interface BiasMetric {
  metric: string; // e.g., "demographic_parity", "equalized_odds"
  value: number;
  threshold: number;
  passed: boolean;
}

export interface BlockchainContext {
  ledgerType: string; // e.g., "hyperledger", "native-ledger"
  transactionId?: string;
  blockNumber?: number;
  merkleRootHash?: string;
  merkleProof?: string[];
  consensusStatus: 'pending' | 'committed' | 'finalized';
}

// =============================================================================
// Closed-Loop Verification Result
// =============================================================================

export interface ClosedLoopVerificationResult {
  eventId: string;
  eventType: GovernanceEventType;
  correlationId: string;
  currentState: ClosedLoopState;
  previousState: ClosedLoopState;
  transitionTime: string;
  verificationPassed: boolean;
  anchorHash?: string;
  failureReason?: string;
  escalationTarget?: string;
}

// =============================================================================
// Event Stream Summary
// =============================================================================

export interface EventStreamSummary {
  streamId: string;
  openedAt: string;
  closedAt?: string;
  totalEvents: number;
  eventCounts: Record<string, number>;
  closedLoopCompletionRate: number; // 0.0 to 1.0
  merkleRootHash?: string;
  anchoredToLedger: boolean;
  ledgerTransactionId?: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
  severityBreakdown: Record<EventSeverity, number>;
}

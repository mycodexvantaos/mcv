/**
 * Governance Event Stream Module
 *
 * Mandatory closed-loop governance event stream for MyCodexVantaOS.
 * Every governance-relevant action MUST emit an event through this module,
 * ensuring immutable audit trails, AI ethics compliance, and blockchain anchoring.
 *
 * Architecture:
 * - Event Schema: CloudEvents v1.0 compliant with platform extensions
 * - Closed-Loop Engine: State machine ensuring every event reaches terminal state
 * - Built-in Consumers: AI Ethics, Blockchain, Governance Policy
 *
 * Usage:
 * ```typescript
 * import { createClosedLoopEngine } from './governance/event-stream';
 *
 * const engine = createClosedLoopEngine();
 * await engine.openStream();
 *
 * // Emit governance events
 * await engine.emitBiasDetected('model-xyz', [...], 0.72, 'conditional');
 * await engine.emitLedgerAnchor(merkleRoot, 'native-ledger');
 * await engine.emitPolicyViolation('naming-spec', 'service-id', 'mycodexvantaos-...', 'invalid-...');
 *
 * // Close stream (verifies all events reached terminal states)
 * const summary = await engine.closeStream();
 * ```
 */

// Re-export schema types
export { GovernanceEventTypes, EventSeverity, ClosedLoopState } from './event-schema';

export type {
  GovernanceEvent,
  GovernanceEventType,
  GovernanceEventData,
  AffectedResource,
  ComplianceContext,
  ComplianceViolation,
  EthicsContext,
  BiasMetric,
  BlockchainContext,
  ClosedLoopVerificationResult,
  EventStreamSummary,
} from './event-schema';

// Re-export engine
export {
  ClosedLoopEngine,
  createClosedLoopEngine,
  AiEthicsAuditConsumer,
  BlockchainAnchorConsumer,
  GovernancePolicyConsumer,
} from './closed-loop-engine';

export type { ClosedLoopEngineConfig, EventConsumer } from './closed-loop-engine';

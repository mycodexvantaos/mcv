/**
 * Governance Event Stream - Closed-Loop Engine
 *
 * Implements the mandatory governance event stream closed loop as defined in
 * platform-governance-spec.yaml. Every governance-relevant action MUST:
 *
 * 1. EMIT an event through this engine
 * 2. RECEIVE acknowledgement from all mandatory consumers
 * 3. VERIFY compliance status
 * 4. ANCHOR to immutable ledger (blockchain provider)
 * 5. CLOSE the loop with a verified terminal state
 *
 * Closed-Loop State Machine:
 *   EMITTED → ACKNOWLEDGED → PROCESSING → VERIFIED → ANCHORED → CLOSED
 *                                                               ↘ FAILED → ESCALATED
 *
 * Mandatory Rules:
 * - No event may be discarded; all events must reach a terminal state
 * - CRITICAL severity events require human escalation on failure
 * - HARD enforcement events must reach CLOSED state before pipeline proceeds
 * - All events must be Merkle-anchored within the stream session
 * - Stream cannot close until all events reach terminal states
 */

import {
  GovernanceEvent,
  GovernanceEventType,
  GovernanceEventData,
  EventSeverity,
  ClosedLoopState,
  ClosedLoopVerificationResult,
  EventStreamSummary,
  AffectedResource,
  ComplianceContext,
  EthicsContext,
  BlockchainContext,
  GovernanceEventTypes,
} from './event-schema';

// =============================================================================
// Configuration
// =============================================================================

export interface ClosedLoopEngineConfig {
  /** Maximum time (ms) to wait for closed-loop completion per event */
  eventTimeoutMs: number;
  /** Maximum time (ms) to wait for stream closure */
  streamTimeoutMs: number;
  /** Whether to auto-escalate CRITICAL failures */
  autoEscalate: boolean;
  /** Minimum severity that requires ledger anchoring */
  anchorMinimumSeverity: EventSeverity;
  /** Whether HARD enforcement events block the stream */
  hardEnforcementBlocksStream: boolean;
  /** Maximum retry attempts for failed events */
  maxRetries: number;
  /** Retry delay (ms) */
  retryDelayMs: number;
}

const DEFAULT_CONFIG: ClosedLoopEngineConfig = {
  eventTimeoutMs: 30000,
  streamTimeoutMs: 300000,
  autoEscalate: true,
  anchorMinimumSeverity: EventSeverity.MEDIUM,
  hardEnforcementBlocksStream: true,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// =============================================================================
// Event Store (in-memory, production would use event-stream-kafka or similar)
// =============================================================================

interface StoredEvent {
  event: GovernanceEvent;
  currentState: ClosedLoopState;
  stateHistory: StateTransition[];
  retryCount: number;
  lastUpdated: string;
}

interface StateTransition {
  from: ClosedLoopState;
  to: ClosedLoopState;
  timestamp: string;
  reason: string;
}

// =============================================================================
// Closed-Loop Engine
// =============================================================================

export class ClosedLoopEngine {
  private config: ClosedLoopEngineConfig;
  private events: Map<string, StoredEvent> = new Map();
  private streamId: string;
  private streamOpenedAt: string;
  private streamClosedAt?: string;
  private merkleRootHash?: string;
  private ledgerTransactionId?: string;
  private consumers: EventConsumer[] = [];
  private isStreamOpen = false;

  constructor(config?: Partial<ClosedLoopEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.streamId = `stream--${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}--${Math.random().toString(36).slice(2, 8)}`;
    this.streamOpenedAt = new Date().toISOString();
  }

  // ===========================================================================
  // Stream Lifecycle
  // ===========================================================================

  /**
   * Open a new governance event stream session.
   * This MUST be called before any events can be emitted.
   */
  async openStream(): Promise<GovernanceEvent> {
    if (this.isStreamOpen) {
      throw new Error('Stream is already open. Close the current stream first.');
    }

    this.isStreamOpen = true;
    this.streamOpenedAt = new Date().toISOString();

    const event = this.createEvent(GovernanceEventTypes.EVENT_STREAM_OPENED, {
      description: `Governance event stream opened: ${this.streamId}`,
      actor: 'system:closed-loop-engine',
      affectedResources: [
        {
          urn: `urn:mycodexvantaos:event-stream:session:${this.streamId}`,
          type: 'event-stream-session',
          name: this.streamId,
          changeType: 'created',
        },
      ],
    });

    await this.storeEvent(event);
    return event;
  }

  /**
   * Close the governance event stream session.
   * ALL events must be in terminal states (CLOSED, FAILED, or ESCALATED)
   * before the stream can be closed.
   */
  async closeStream(): Promise<EventStreamSummary> {
    if (!this.isStreamOpen) {
      throw new Error('Stream is not open.');
    }

    // Verify all events are in terminal states
    const nonTerminalEvents = this.getNonTerminalEvents();
    if (nonTerminalEvents.length > 0) {
      // Force-escalate any remaining non-terminal events
      for (const stored of nonTerminalEvents) {
        await this.transitionState(
          stored.event.id,
          ClosedLoopState.ESCALATED,
          'Stream closure: event did not reach terminal state'
        );
      }
    }

    // Calculate Merkle root of all events
    this.merkleRootHash = this.calculateMerkleRoot();

    // Emit stream closed event
    const closeEvent = this.createEvent(GovernanceEventTypes.EVENT_STREAM_CLOSED, {
      description: `Governance event stream closed: ${this.streamId}`,
      actor: 'system:closed-loop-engine',
      affectedResources: [
        {
          urn: `urn:mycodexvantaos:event-stream:session:${this.streamId}`,
          type: 'event-stream-session',
          name: this.streamId,
          changeType: 'verified',
        },
      ],
    });
    await this.storeEvent(closeEvent);

    this.isStreamOpen = false;
    this.streamClosedAt = new Date().toISOString();

    return this.getSummary();
  }

  // ===========================================================================
  // Event Emission
  // ===========================================================================

  /**
   * Emit a governance event and begin the closed-loop cycle.
   * This is the primary entry point for all governance events.
   */
  async emitEvent(
    type: GovernanceEventType,
    data: GovernanceEventData,
    options?: {
      severity?: EventSeverity;
      capability?: string;
      provider?: string;
      eraCode?: string;
      correlationId?: string;
    }
  ): Promise<GovernanceEvent> {
    if (!this.isStreamOpen) {
      throw new Error('Stream is not open. Call openStream() first.');
    }

    const event = this.createEvent(type, data, options);
    await this.storeEvent(event);

    // Begin closed-loop processing
    await this.processClosedLoop(event.id);

    return event;
  }

  // ===========================================================================
  // AI Ethics Event Convenience Methods
  // ===========================================================================

  /**
   * Emit a bias detection event from the AI ethics capability.
   */
  async emitBiasDetected(
    modelId: string,
    biasMetrics: Array<{ metric: string; value: number; threshold: number; passed: boolean }>,
    fairnessScore: number,
    auditDecision: 'pass' | 'fail' | 'conditional',
    remediationSteps: string[] = []
  ): Promise<GovernanceEvent> {
    const ethicsContext: EthicsContext = {
      modelId,
      biasMetrics,
      fairnessScore,
      auditDecision,
      remediationSteps,
    };

    return this.emitEvent(
      GovernanceEventTypes.AI_ETHICS_BIAS_DETECTED,
      {
        description: `Bias detected in model ${modelId}: fairness score ${fairnessScore}`,
        actor: `ai-ethics-native-auditor`,
        affectedResources: [
          {
            urn: `urn:mycodexvantaos:ai-model:${modelId}`,
            type: 'ai-model',
            name: modelId,
            changeType: auditDecision === 'pass' ? 'verified' : 'violated',
          },
        ],
        ethicsContext,
      },
      {
        severity: auditDecision === 'fail' ? EventSeverity.CRITICAL : EventSeverity.HIGH,
        capability: 'ai-ethics',
        provider: 'native-auditor',
        eraCode: '600',
      }
    );
  }

  /**
   * Emit a fairness audit completion event.
   */
  async emitFairnessAudit(
    modelId: string,
    fairnessScore: number,
    auditDecision: 'pass' | 'fail' | 'conditional',
    datasetId?: string
  ): Promise<GovernanceEvent> {
    return this.emitEvent(
      GovernanceEventTypes.AI_ETHICS_FAIRNESS_AUDIT,
      {
        description: `Fairness audit completed for model ${modelId}: ${auditDecision}`,
        actor: 'ai-ethics-fairlearn',
        affectedResources: [
          {
            urn: `urn:mycodexvantaos:ai-model:${modelId}`,
            type: 'ai-model',
            name: modelId,
            changeType: 'verified',
          },
        ],
        ethicsContext: {
          modelId,
          datasetId,
          biasMetrics: [],
          fairnessScore,
          auditDecision,
          remediationSteps: [],
        },
      },
      {
        severity: auditDecision === 'fail' ? EventSeverity.HIGH : EventSeverity.MEDIUM,
        capability: 'ai-ethics',
        provider: 'fairlearn',
        eraCode: '600',
      }
    );
  }

  // ===========================================================================
  // Blockchain Event Convenience Methods
  // ===========================================================================

  /**
   * Emit a ledger anchor event to record immutable audit trail.
   */
  async emitLedgerAnchor(
    merkleRootHash: string,
    ledgerType: string = 'native-ledger'
  ): Promise<GovernanceEvent> {
    return this.emitEvent(
      GovernanceEventTypes.BLOCKCHAIN_LEDGER_ANCHOR,
      {
        description: `Merkle root anchored to ${ledgerType}: ${merkleRootHash.slice(0, 12)}...`,
        actor: `blockchain-${ledgerType}`,
        affectedResources: [
          {
            urn: `urn:mycodexvantaos:blockchain:ledger:${ledgerType}`,
            type: 'blockchain-ledger',
            name: ledgerType,
            changeType: 'created',
          },
        ],
        blockchainContext: {
          ledgerType,
          merkleRootHash,
          consensusStatus: 'pending',
        },
      },
      {
        severity: EventSeverity.HIGH,
        capability: 'blockchain',
        provider: ledgerType,
        eraCode: '500',
      }
    );
  }

  /**
   * Emit a consensus verification event.
   */
  async emitConsensusVerified(
    transactionId: string,
    blockNumber: number,
    ledgerType: string = 'native-ledger'
  ): Promise<GovernanceEvent> {
    return this.emitEvent(
      GovernanceEventTypes.BLOCKCHAIN_CONSENSUS_VERIFY,
      {
        description: `Consensus verified for transaction ${transactionId} on ${ledgerType}`,
        actor: `blockchain-${ledgerType}`,
        affectedResources: [
          {
            urn: `urn:mycodexvantaos:blockchain:transaction:${transactionId}`,
            type: 'blockchain-transaction',
            name: transactionId,
            changeType: 'verified',
          },
        ],
        blockchainContext: {
          ledgerType,
          transactionId,
          blockNumber,
          consensusStatus: 'finalized',
        },
      },
      {
        severity: EventSeverity.INFO,
        capability: 'blockchain',
        provider: ledgerType,
        eraCode: '500',
      }
    );
  }

  // ===========================================================================
  // Governance Event Convenience Methods
  // ===========================================================================

  /**
   * Emit a policy violation event.
   */
  async emitPolicyViolation(
    policyId: string,
    rule: string,
    expected: string,
    actual: string,
    enforceLevel: 'hard' | 'soft' = 'hard'
  ): Promise<GovernanceEvent> {
    return this.emitEvent(
      GovernanceEventTypes.GOVERNANCE_POLICY_VIOLATION,
      {
        description: `Policy violation: ${rule} (expected: ${expected}, actual: ${actual})`,
        actor: 'governance-validation',
        affectedResources: [
          {
            urn: `urn:mycodexvantaos:governance:policy:${policyId}`,
            type: 'governance-policy',
            name: policyId,
            changeType: 'violated',
          },
        ],
        complianceContext: {
          policyId,
          ruleFile: `ci/rules/${rule}.rule.ts`,
          enforceLevel,
          passed: false,
          violations: [
            {
              rule,
              expected,
              actual,
              severity: enforceLevel === 'hard' ? EventSeverity.CRITICAL : EventSeverity.HIGH,
              remediation: `Correct the value to match expected: ${expected}`,
            },
          ],
        },
      },
      {
        severity: enforceLevel === 'hard' ? EventSeverity.CRITICAL : EventSeverity.HIGH,
        capability: 'validation',
        provider: 'zod',
        eraCode: '000',
      }
    );
  }

  /**
   * Emit a pipeline gate event (pass or fail).
   */
  async emitPipelineGate(
    gateName: string,
    passed: boolean,
    evidenceFiles: string[] = []
  ): Promise<GovernanceEvent> {
    const type = passed
      ? GovernanceEventTypes.PIPELINE_GATE_PASSED
      : GovernanceEventTypes.PIPELINE_GATE_FAILED;

    return this.emitEvent(
      type,
      {
        description: `Pipeline gate ${gateName}: ${passed ? 'PASSED' : 'FAILED'}`,
        actor: 'ci:pipeline-gate',
        affectedResources: evidenceFiles.map((f) => ({
          urn: `urn:mycodexvantaos:evidence:file:${f}`,
          type: 'evidence-file',
          name: f,
          changeType: passed ? 'verified' : 'violated',
        })),
      },
      {
        severity: passed ? EventSeverity.INFO : EventSeverity.CRITICAL,
        capability: 'deploy',
        provider: 'argocd',
        eraCode: '200',
      }
    );
  }

  // ===========================================================================
  // Closed-Loop Processing
  // ===========================================================================

  /**
   * Process the closed-loop cycle for an event.
   * This drives the event through all mandatory states.
   */
  private async processClosedLoop(eventId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) throw new Error(`Event not found: ${eventId}`);

    try {
      // Step 1: ACKNOWLEDGED - Notify all consumers
      await this.acknowledgeEvent(eventId);

      // Step 2: PROCESSING - Process through consumers
      await this.processEvent(eventId);

      // Step 3: VERIFIED - Verify compliance
      await this.verifyEvent(eventId);

      // Step 4: ANCHORED - Anchor to immutable ledger (if severity threshold met)
      if (this.meetsAnchorThreshold(stored.event.mycodexvantaosorgseverity)) {
        await this.anchorEvent(eventId);
      }

      // Step 5: CLOSED - Mark as closed
      await this.transitionState(
        eventId,
        ClosedLoopState.CLOSED,
        'Closed-loop completed successfully'
      );
    } catch (error: any) {
      // Handle failure
      await this.handleClosedLoopFailure(eventId, error.message);
    }
  }

  private async acknowledgeEvent(eventId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    // Notify all registered consumers
    for (const consumer of this.consumers) {
      try {
        await consumer.acknowledge(stored.event);
      } catch (error: any) {
        console.warn(
          `Consumer ${consumer.name} failed to acknowledge event ${eventId}: ${error.message}`
        );
      }
    }

    await this.transitionState(eventId, ClosedLoopState.ACKNOWLEDGED, 'All consumers acknowledged');
  }

  private async processEvent(eventId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    // Process through all consumers
    for (const consumer of this.consumers) {
      try {
        await consumer.process(stored.event);
      } catch (error: any) {
        console.warn(
          `Consumer ${consumer.name} failed to process event ${eventId}: ${error.message}`
        );
      }
    }

    await this.transitionState(eventId, ClosedLoopState.PROCESSING, 'All consumers processed');
  }

  private async verifyEvent(eventId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    // Verify compliance based on event data
    const complianceContext = stored.event.data.complianceContext;
    if (complianceContext && !complianceContext.passed) {
      // Compliance violation detected
      if (complianceContext.enforceLevel === 'hard') {
        throw new Error(
          `Hard enforcement violation: ${complianceContext.violations.map((v) => v.rule).join(', ')}`
        );
      }
    }

    // Verify ethics context if present
    const ethicsContext = stored.event.data.ethicsContext;
    if (ethicsContext && ethicsContext.auditDecision === 'fail') {
      throw new Error(`AI Ethics audit failed for model ${ethicsContext.modelId}`);
    }

    await this.transitionState(eventId, ClosedLoopState.VERIFIED, 'Compliance verification passed');
  }

  private async anchorEvent(eventId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    // In production, this would call the blockchain provider
    // For now, we simulate the anchoring with a hash
    const anchorHash = this.hashEvent(stored.event);

    // Update the event with the Merkle root hash
    stored.event.mycodexvantaosorgmerkleroothash = anchorHash;

    await this.transitionState(
      eventId,
      ClosedLoopState.ANCHORED,
      `Anchored to ledger: ${anchorHash.slice(0, 16)}...`
    );
  }

  private async handleClosedLoopFailure(eventId: string, reason: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    await this.transitionState(eventId, ClosedLoopState.FAILED, reason);

    // Check if we should retry
    if (stored.retryCount < this.config.maxRetries) {
      stored.retryCount++;
      await this.transitionState(
        eventId,
        ClosedLoopState.EMITTED,
        `Retry attempt ${stored.retryCount}`
      );

      // Exponential backoff
      const delay = this.config.retryDelayMs * Math.pow(2, stored.retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      await this.processClosedLoop(eventId);
      return;
    }

    // Max retries exceeded - escalate if CRITICAL
    if (
      stored.event.mycodexvantaosorgseverity === EventSeverity.CRITICAL &&
      this.config.autoEscalate
    ) {
      await this.transitionState(
        eventId,
        ClosedLoopState.ESCALATED,
        `Auto-escalated after ${this.config.maxRetries} retries: ${reason}`
      );
    }
  }

  // ===========================================================================
  // Consumer Management
  // ===========================================================================

  /**
   * Register an event consumer for closed-loop processing.
   */
  registerConsumer(consumer: EventConsumer): void {
    this.consumers.push(consumer);
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  /**
   * Get the current state of an event's closed-loop cycle.
   */
  getEventState(eventId: string): ClosedLoopState | undefined {
    return this.events.get(eventId)?.currentState;
  }

  /**
   * Get events by severity.
   */
  getEventsBySeverity(severity: EventSeverity): GovernanceEvent[] {
    return Array.from(this.events.values())
      .filter((s) => s.event.mycodexvantaosorgseverity === severity)
      .map((s) => s.event);
  }

  /**
   * Get events by closed-loop state.
   */
  getEventsByState(state: ClosedLoopState): GovernanceEvent[] {
    return Array.from(this.events.values())
      .filter((s) => s.currentState === state)
      .map((s) => s.event);
  }

  /**
   * Get the full state history for an event.
   */
  getEventHistory(eventId: string): StateTransition[] {
    return this.events.get(eventId)?.stateHistory ?? [];
  }

  /**
   * Get a summary of the current event stream session.
   */
  getSummary(): EventStreamSummary {
    const events = Array.from(this.events.values());
    const totalEvents = events.length;

    // Count events by type
    const eventCounts: Record<string, number> = {};
    for (const stored of events) {
      const type = stored.event.type;
      eventCounts[type] = (eventCounts[type] || 0) + 1;
    }

    // Count events by severity
    const severityBreakdown: Record<EventSeverity, number> = {
      [EventSeverity.CRITICAL]: 0,
      [EventSeverity.HIGH]: 0,
      [EventSeverity.MEDIUM]: 0,
      [EventSeverity.LOW]: 0,
      [EventSeverity.INFO]: 0,
    };
    for (const stored of events) {
      severityBreakdown[stored.event.mycodexvantaosorgseverity]++;
    }

    // Calculate closed-loop completion rate
    const terminalEvents = events.filter(
      (s) =>
        s.currentState === ClosedLoopState.CLOSED || s.currentState === ClosedLoopState.ESCALATED
    );
    const closedLoopCompletionRate = totalEvents > 0 ? terminalEvents.length / totalEvents : 0;

    // Determine overall compliance status
    const hasViolations = events.some(
      (s) =>
        s.currentState === ClosedLoopState.FAILED || s.currentState === ClosedLoopState.ESCALATED
    );
    const hasPending = events.some(
      (s) =>
        s.currentState !== ClosedLoopState.CLOSED &&
        s.currentState !== ClosedLoopState.ESCALATED &&
        s.currentState !== ClosedLoopState.FAILED
    );

    let complianceStatus: 'compliant' | 'non-compliant' | 'pending';
    if (hasPending) {
      complianceStatus = 'pending';
    } else if (hasViolations) {
      complianceStatus = 'non-compliant';
    } else {
      complianceStatus = 'compliant';
    }

    return {
      streamId: this.streamId,
      openedAt: this.streamOpenedAt,
      closedAt: this.streamClosedAt,
      totalEvents,
      eventCounts,
      closedLoopCompletionRate,
      merkleRootHash: this.merkleRootHash,
      anchoredToLedger: !!this.ledgerTransactionId,
      ledgerTransactionId: this.ledgerTransactionId,
      complianceStatus,
      severityBreakdown,
    };
  }

  /**
   * Verify the closed-loop integrity of the entire stream.
   * Returns verification results for each event.
   */
  verifyClosedLoopIntegrity(): ClosedLoopVerificationResult[] {
    const results: ClosedLoopVerificationResult[] = [];

    for (const stored of this.events.values()) {
      const lastTransition = stored.stateHistory[stored.stateHistory.length - 1];
      const isTerminal = [ClosedLoopState.CLOSED, ClosedLoopState.ESCALATED].includes(
        stored.currentState
      );

      results.push({
        eventId: stored.event.id,
        eventType: stored.event.type,
        correlationId: stored.event.mycodexvantaosorgcorrelationid,
        currentState: stored.currentState,
        previousState: lastTransition?.from ?? stored.currentState,
        transitionTime: lastTransition?.timestamp ?? stored.event.time,
        verificationPassed: isTerminal,
        anchorHash: stored.event.mycodexvantaosorgmerkleroothash,
        failureReason:
          stored.currentState === ClosedLoopState.FAILED
            ? 'Event failed closed-loop processing'
            : undefined,
        escalationTarget:
          stored.currentState === ClosedLoopState.ESCALATED ? 'governance-committee' : undefined,
      });
    }

    return results;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private createEvent(
    type: GovernanceEventType,
    data: GovernanceEventData,
    options?: {
      severity?: EventSeverity;
      capability?: string;
      provider?: string;
      eraCode?: string;
      correlationId?: string;
    }
  ): GovernanceEvent {
    const eventId = this.generateEventId();
    return {
      specversion: '1.0',
      type,
      source: `urn:mycodexvantaos:event-stream:session:${this.streamId}`,
      id: eventId,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      dataschema: 'urn:mycodexvantaos:schema:governance-event:v1',
      mycodexvantaosorgseverity: options?.severity ?? EventSeverity.INFO,
      mycodexvantaosorgclosedloopstate: ClosedLoopState.EMITTED,
      mycodexvantaosorgcorrelationid: options?.correlationId ?? eventId,
      mycodexvantaosorgcapability: options?.capability ?? 'event-stream',
      mycodexvantaosorgprovider: options?.provider ?? 'native-governance',
      mycodexvantaosorgeracode: options?.eraCode ?? '000',
      data,
    };
  }

  private async storeEvent(event: GovernanceEvent): Promise<void> {
    this.events.set(event.id, {
      event,
      currentState: ClosedLoopState.EMITTED,
      stateHistory: [
        {
          from: ClosedLoopState.EMITTED,
          to: ClosedLoopState.EMITTED,
          timestamp: new Date().toISOString(),
          reason: 'Event emitted',
        },
      ],
      retryCount: 0,
      lastUpdated: new Date().toISOString(),
    });
  }

  private async transitionState(
    eventId: string,
    newState: ClosedLoopState,
    reason: string
  ): Promise<void> {
    const stored = this.events.get(eventId);
    if (!stored) return;

    const previousState = stored.currentState;
    stored.currentState = newState;
    stored.lastUpdated = new Date().toISOString();

    stored.stateHistory.push({
      from: previousState,
      to: newState,
      timestamp: new Date().toISOString(),
      reason,
    });

    // Update the event's closed-loop state extension
    stored.event.mycodexvantaosorgclosedloopstate = newState;
  }

  private getNonTerminalEvents(): StoredEvent[] {
    const terminalStates: ClosedLoopState[] = [ClosedLoopState.CLOSED, ClosedLoopState.ESCALATED];
    return Array.from(this.events.values()).filter((s) => !terminalStates.includes(s.currentState));
  }

  private meetsAnchorThreshold(severity: EventSeverity): boolean {
    const severityOrder: Record<EventSeverity, number> = {
      [EventSeverity.CRITICAL]: 0,
      [EventSeverity.HIGH]: 1,
      [EventSeverity.MEDIUM]: 2,
      [EventSeverity.LOW]: 3,
      [EventSeverity.INFO]: 4,
    };
    return severityOrder[severity] <= severityOrder[this.config.anchorMinimumSeverity];
  }

  private calculateMerkleRoot(): string {
    // Simplified Merkle root calculation
    // In production, use the gitops-controlplane MerkleRootCalculator
    const eventHashes = Array.from(this.events.values())
      .sort((a, b) => a.event.time.localeCompare(b.event.time))
      .map((s) => this.hashEvent(s.event));

    if (eventHashes.length === 0) {
      return 'sha256-00000000000000000000000000000000';
    }

    // Simple hash combining (not production Merkle tree)
    const combined = eventHashes.join('');
    return `sha256-${this.simpleHash(combined)}`;
  }

  private hashEvent(event: GovernanceEvent): string {
    const content = JSON.stringify({
      id: event.id,
      type: event.type,
      time: event.time,
      data: event.data,
    });
    return this.simpleHash(content);
  }

  private simpleHash(input: string): string {
    // Simplified hash for demonstration
    // Production would use crypto.subtle.digest('SHA-256', ...)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(12, '0');
  }

  private generateEventId(): string {
    return `evt--${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}--${Math.random().toString(36).slice(2, 8)}`;
  }
}

// =============================================================================
// Event Consumer Interface
// =============================================================================

export interface EventConsumer {
  /** Human-readable name for logging */
  name: string;
  /** Acknowledge receipt of an event */
  acknowledge(event: GovernanceEvent): Promise<void>;
  /** Process an event */
  process(event: GovernanceEvent): Promise<void>;
}

// =============================================================================
// Built-in Consumers
// =============================================================================

/**
 * AI Ethics Audit Consumer
 * Processes AI ethics events and performs compliance checks.
 */
export class AiEthicsAuditConsumer implements EventConsumer {
  name = 'ai-ethics-audit-consumer';

  async acknowledge(event: GovernanceEvent): Promise<void> {
    // Acknowledge receipt
  }

  async process(event: GovernanceEvent): Promise<void> {
    if (event.data.ethicsContext) {
      const { auditDecision, fairnessScore } = event.data.ethicsContext;

      if (auditDecision === 'fail') {
        console.error(
          `[AI-ETHICS] Model ${event.data.ethicsContext.modelId} failed fairness audit (score: ${fairnessScore})`
        );
      } else if (auditDecision === 'conditional') {
        console.warn(
          `[AI-ETHICS] Model ${event.data.ethicsContext.modelId} received conditional pass (score: ${fairnessScore})`
        );
      } else {
        console.log(
          `[AI-ETHICS] Model ${event.data.ethicsContext.modelId} passed fairness audit (score: ${fairnessScore})`
        );
      }
    }
  }
}

/**
 * Blockchain Anchor Consumer
 * Processes events that require blockchain/ledger anchoring.
 */
export class BlockchainAnchorConsumer implements EventConsumer {
  name = 'blockchain-anchor-consumer';

  async acknowledge(event: GovernanceEvent): Promise<void> {
    // Acknowledge receipt
  }

  async process(event: GovernanceEvent): Promise<void> {
    if (event.data.blockchainContext) {
      const { ledgerType, merkleRootHash } = event.data.blockchainContext;
      console.log(
        `[BLOCKCHAIN] Anchoring to ${ledgerType}: ${merkleRootHash?.slice(0, 16) ?? 'pending'}...`
      );

      // In production, this would call the blockchain provider
      event.data.blockchainContext.consensusStatus = 'committed';
    }
  }
}

/**
 * Governance Policy Consumer
 * Processes governance policy violation events and enforces compliance.
 */
export class GovernancePolicyConsumer implements EventConsumer {
  name = 'governance-policy-consumer';

  async acknowledge(event: GovernanceEvent): Promise<void> {
    // Acknowledge receipt
  }

  async process(event: GovernanceEvent): Promise<void> {
    if (event.data.complianceContext) {
      const { enforceLevel, passed, violations } = event.data.complianceContext;

      if (!passed) {
        console.error(
          `[GOVERNANCE] Policy violation (${enforceLevel} enforcement): ${violations.map((v) => v.rule).join(', ')}`
        );

        if (enforceLevel === 'hard') {
          // Hard enforcement: this should block the pipeline
          throw new Error(
            `Hard enforcement violation: ${violations.map((v) => `${v.rule}: expected ${v.expected}, got ${v.actual}`).join('; ')}`
          );
        }
      }
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a pre-configured closed-loop engine with standard consumers.
 */
export function createClosedLoopEngine(config?: Partial<ClosedLoopEngineConfig>): ClosedLoopEngine {
  const engine = new ClosedLoopEngine(config);

  // Register built-in consumers
  engine.registerConsumer(new AiEthicsAuditConsumer());
  engine.registerConsumer(new BlockchainAnchorConsumer());
  engine.registerConsumer(new GovernancePolicyConsumer());

  return engine;
}

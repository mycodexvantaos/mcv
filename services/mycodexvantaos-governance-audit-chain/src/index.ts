/**
 * MyCodexVantaOS Governance Audit Chain Service
 *
 * Service ID: mycodexvantaos-governance-audit-chain
 * Foundation: Governance Foundation
 * Capability: Immutable audit chain with SHA-256 hash linking
 *
 * Machine Identity: mycodexvantaos
 */

import { createHash } from 'node:crypto';

export const SERVICE_ID = 'mycodexvantaos-governance-audit-chain';
export const SERVICE_VERSION = '1.0.0';

export type AuditEventType =
  | 'governance-policy-change'
  | 'identity-policy-change'
  | 'exception-grant'
  | 'exception-revoke'
  | 'provider-registration'
  | 'module-registration'
  | 'gate-evaluation-complete'
  | 'gate-evaluation-fail'
  | 'release-promoted'
  | 'release-rolled-back'
  | 'security-scan-complete'
  | 'vulnerability-detected'
  | 'user-login'
  | 'api-key-created'
  | 'permission-change';

export interface AuditActor {
  id: string;
  type: 'user' | 'service' | 'ci-pipeline' | 'governance-engine';
  displayName?: string;
}

export interface AuditResource {
  id: string;
  type: string;
  path?: string;
}

export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  timestamp: Date;
  actor: AuditActor;
  resource: AuditResource;
  payload?: Record<string, unknown>;
  hash: string;
  previousHash?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditChain {
  chainId: string;
  platform: 'mycodexvantaos';
  createdAt: Date;
  events: AuditEvent[];
  headHash: string;
  eventCount: number;
  integrityVerified: boolean;
}

/**
 * Compute SHA-256 hash of an audit event's content.
 */
function computeEventHash(event: Omit<AuditEvent, 'hash'>, previousHash?: string): string {
  const content = JSON.stringify({
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp.toISOString(),
    actor: event.actor,
    resource: event.resource,
    payload: event.payload,
    previousHash,
  });

  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

/**
 * Generate a unique event ID.
 */
function generateEventId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `evt-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Governance Audit Chain Manager
 * Maintains an immutable, cryptographically-linked chain of audit events.
 */
export class AuditChainManager {
  private chain: AuditChain;

  constructor(chainId?: string) {
    this.chain = {
      chainId: chainId ?? `chain-${Date.now()}`,
      platform: 'mycodexvantaos',
      createdAt: new Date(),
      events: [],
      headHash: '',
      eventCount: 0,
      integrityVerified: true,
    };
  }

  /**
   * Append a new event to the audit chain.
   * The event is linked to the previous event via SHA-256 hash.
   */
  appendEvent(
    eventType: AuditEventType,
    actor: AuditActor,
    resource: AuditResource,
    options?: {
      payload?: Record<string, unknown>;
      severity?: AuditEvent['severity'];
    }
  ): AuditEvent {
    const eventId = generateEventId();
    const previousHash = this.chain.headHash || undefined;

    const partialEvent: Omit<AuditEvent, 'hash'> = {
      eventId,
      eventType,
      timestamp: new Date(),
      actor,
      resource,
      payload: options?.payload,
      previousHash,
      severity: options?.severity ?? 'info',
    };

    const hash = computeEventHash(partialEvent, previousHash);
    const event: AuditEvent = { ...partialEvent, hash };

    this.chain.events.push(event);
    this.chain.headHash = hash;
    this.chain.eventCount++;

    return event;
  }

  /**
   * Verify the integrity of the entire audit chain.
   * Returns true if all hashes are valid and the chain is unbroken.
   */
  verifyIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < this.chain.events.length; i++) {
      const event = this.chain.events[i];
      const previousHash = i > 0 ? this.chain.events[i - 1].hash : undefined;

      // Recompute hash
      const { hash, ...eventWithoutHash } = event;
      const expectedHash = computeEventHash(eventWithoutHash, previousHash);

      if (hash !== expectedHash) {
        errors.push(
          `Event ${event.eventId} at index ${i}: hash mismatch. Expected ${expectedHash}, got ${hash}`
        );
      }

      // Verify chain linkage
      if (i > 0 && event.previousHash !== this.chain.events[i - 1].hash) {
        errors.push(
          `Event ${event.eventId} at index ${i}: previousHash mismatch. ` +
            `Expected ${this.chain.events[i - 1].hash}, got ${event.previousHash}`
        );
      }
    }

    this.chain.integrityVerified = errors.length === 0;
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get the current chain state.
   */
  getChain(): Readonly<AuditChain> {
    return this.chain;
  }

  /**
   * Get events filtered by type.
   */
  getEventsByType(eventType: AuditEventType): AuditEvent[] {
    return this.chain.events.filter((e) => e.eventType === eventType);
  }

  /**
   * Get events in a time range.
   */
  getEventsByTimeRange(from: Date, to: Date): AuditEvent[] {
    return this.chain.events.filter((e) => e.timestamp >= from && e.timestamp <= to);
  }

  /**
   * Export chain as JSON for storage.
   */
  exportChain(): string {
    return JSON.stringify(
      {
        ...this.chain,
        events: this.chain.events.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })),
        createdAt: this.chain.createdAt.toISOString(),
      },
      null,
      2
    );
  }
}

// Default audit chain instance
export const auditChain = new AuditChainManager('mycodexvantaos-main-chain');

/**
 * @mycodexvantaos/service-audit-log — Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  recordEvent,
  queryEvents,
  getEvent,
  verifyIntegrity,
  clearEvents,
  getAuditEventDefinitions,
  type CreateAuditEventRequest,
} from '../index.js';

const sampleEvent: CreateAuditEventRequest = {
  eventType: 'audit.event-recorded',
  category: 'audit',
  severity: 'info',
  actor: { type: 'user', id: 'user-1', name: 'Test User' },
  resource: { type: 'audit-event', id: 'res-1' },
  context: { tenantId: 'tenant-1', workspaceId: 'ws-1' },
  data: { action: 'test' },
};

describe('audit-log runtime', () => {
  beforeEach(() => {
    clearEvents();
  });

  describe('recordEvent', () => {
    it('should record an audit event with integrity chain', () => {
      const result = recordEvent(sampleEvent);
      assert.ok(result.event, 'Expected event to be created');
      assert.ok(result.event.eventId, 'Expected eventId');
      assert.equal(result.event.eventType, 'audit.event-recorded');
      assert.equal(result.event.category, 'audit');
      assert.ok(result.event.hash, 'Expected hash');
      assert.equal(result.event.chainIndex, 0);
      assert.equal(result.event.closedLoopStatus, 'open');
    });

    it('should chain events with previousHash', () => {
      const first = recordEvent(sampleEvent);
      const second = recordEvent(sampleEvent);

      assert.equal(second.event.chainIndex, 1);
      assert.equal(second.event.previousHash, first.event.hash);
    });

    it('should default severity to info', () => {
      const result = recordEvent({ ...sampleEvent, severity: undefined });
      assert.equal(result.event.severity, 'info');
    });

    it('should support pairId for closed-loop pairing', () => {
      const result = recordEvent({ ...sampleEvent, pairId: 'pair-123' });
      assert.equal(result.event.pairId, 'pair-123');
    });
  });

  describe('queryEvents', () => {
    it('should return empty list when no events', () => {
      const result = queryEvents();
      assert.equal(result.total, 0);
      assert.deepEqual(result.events, []);
    });

    it('should return all events', () => {
      recordEvent(sampleEvent);
      recordEvent(sampleEvent);
      const result = queryEvents();
      assert.equal(result.total, 2);
    });

    it('should filter by eventType', () => {
      recordEvent(sampleEvent);
      recordEvent({ ...sampleEvent, eventType: 'audit.chain-verified' });
      const result = queryEvents({ eventType: 'audit.event-recorded' });
      assert.equal(result.total, 1);
    });

    it('should filter by category', () => {
      recordEvent(sampleEvent);
      recordEvent({ ...sampleEvent, category: 'security' });
      const result = queryEvents({ category: 'audit' });
      assert.equal(result.total, 1);
    });

    it('should filter by tenantId', () => {
      recordEvent(sampleEvent);
      recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, tenantId: 'tenant-2' } });
      const result = queryEvents({ tenantId: 'tenant-1' });
      assert.equal(result.total, 1);
    });

    it('should support pagination', () => {
      for (let i = 0; i < 5; i++) {
        recordEvent(sampleEvent);
      }
      const result = queryEvents({ limit: 2, offset: 0 });
      assert.equal(result.events.length, 2);
      assert.equal(result.total, 5);
    });

    it('should return events sorted by timestamp descending', () => {
      recordEvent(sampleEvent);
      recordEvent(sampleEvent);
      const result = queryEvents();
      assert.ok(result.events[0].timestamp >= result.events[1].timestamp);
    });
  });

  describe('getEvent', () => {
    it('should return an event by ID', () => {
      const created = recordEvent(sampleEvent);
      const found = getEvent(created.event.eventId);
      assert.ok(found, 'Expected event to be found');
      assert.equal(found!.eventId, created.event.eventId);
    });

    it('should return null for unknown event ID', () => {
      const found = getEvent('non-existent');
      assert.equal(found, null);
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify empty chain as valid', () => {
      const result = verifyIntegrity();
      assert.ok(result.valid);
      assert.equal(result.totalEvents, 0);
    });

    it('should verify single event chain as valid', () => {
      recordEvent(sampleEvent);
      const result = verifyIntegrity();
      assert.ok(result.valid, 'Expected chain to be valid');
      assert.equal(result.totalEvents, 1);
    });

    it('should verify multi-event chain as valid', () => {
      recordEvent(sampleEvent);
      recordEvent(sampleEvent);
      recordEvent(sampleEvent);
      const result = verifyIntegrity();
      assert.ok(result.valid, 'Expected chain to be valid');
      assert.equal(result.totalEvents, 3);
    });
  });

  describe('getAuditEventDefinitions', () => {
    it('should return audit event definitions from contracts', () => {
      const defs = getAuditEventDefinitions();
      assert.ok(Array.isArray(defs), 'Expected array of event definitions');
      assert.ok(defs.length > 0, 'Expected at least one audit event definition');
      assert.ok(
        defs.includes('audit.event-recorded'),
        `Expected audit.event-recorded, got: ${defs.join(', ')}`
      );
    });
  });
});

// ── Audit Enforcement Middleware - trace_id propagation ──────────────

describe('audit-log runtime - trace_id propagation', () => {
  beforeEach(() => {
    clearEvents();
  });

  it('should include traceId in audit event context when provided', () => {
    const traceId = '550e8400-e29b-41d4-a716-446655440000';
    const result = recordEvent({
      ...sampleEvent,
      context: { ...sampleEvent.context, traceId },
    });
    assert.equal(result.event.context.traceId, traceId);
  });

  it('should record events without traceId (backward compatible)', () => {
    const result = recordEvent(sampleEvent);
    assert.equal(result.event.context.traceId, undefined);
  });

  it('should include traceId in audit event data field', () => {
    const traceId = 'abc-123-def-456';
    const result = recordEvent({
      ...sampleEvent,
      context: { ...sampleEvent.context, traceId },
      data: { ...sampleEvent.data, traceId },
    });
    assert.equal(result.event.context.traceId, traceId);
    assert.equal((result.event.data as any).traceId, traceId);
  });

  it('should propagate different traceIds across sequential events', () => {
    const traceId1 = 'trace-001';
    const traceId2 = 'trace-002';
    recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, traceId: traceId1 } });
    recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, traceId: traceId2 } });

    const result = queryEvents({ limit: 2 });
    assert.equal(result.total, 2);
    // Both traceIds should be present (order may vary due to identical timestamps)
    const traceIds = result.events.map((e) => e.context.traceId);
    assert.ok(traceIds.includes(traceId1), `Expected traceId1 (${traceId1}) in results`);
    assert.ok(traceIds.includes(traceId2), `Expected traceId2 (${traceId2}) in results`);
  });

  it('should maintain integrity chain with traceId present', () => {
    const traceId = 'integrity-trace-001';
    recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, traceId } });
    recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, traceId: 'trace-002' } });
    recordEvent({ ...sampleEvent, context: { ...sampleEvent.context, traceId } });

    const result = verifyIntegrity();
    assert.ok(result.valid, 'Expected chain to remain valid with traceIds');
    assert.equal(result.totalEvents, 3);
  });
});

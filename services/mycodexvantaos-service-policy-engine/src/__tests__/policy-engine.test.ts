/**
 * Tests for @mycodexvantaos/service-policy-engine
 * Verifies policy loading from contracts, evaluation, and enforcement.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  PolicyEngine,
  resetPolicyEngine,
  evaluatePolicy,
  type PolicyEvaluateRequest,
  type PolicyEvaluateResult,
} from '../index.js';

import type { PolicyDefinition, PolicySubject, PolicyResource } from '@mycodexvantaos/policy-model';

// ── Contract-based policy loading ────────────────────────────────────────

describe('Policy Engine - Contract Loading', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('loads policies from contracts directory', () => {
    const policies = engine.listPolicies();
    assert.ok(policies.length > 0, 'Should load at least one policy from contracts');
  });

  it('loads the memory-dream-policy', () => {
    const policy = engine.getPolicy('memory-dream-policy');
    assert.ok(policy, 'memory-dream-policy should be loaded');
    assert.equal(policy!.id, 'memory-dream-policy');
    assert.ok(policy!.rules.length > 0, 'Should have at least one rule');
  });

  it('loads the audit-retention-policy', () => {
    const policy = engine.getPolicy('audit-retention-policy');
    assert.ok(policy, 'audit-retention-policy should be loaded');
  });

  it('loads the default-access-policy', () => {
    const policy = engine.getPolicy('default-access-policy');
    assert.ok(policy, 'default-access-policy should be loaded');
  });

  it('loads the knowledge-access-policy', () => {
    const policy = engine.getPolicy('knowledge-access-policy');
    assert.ok(policy, 'knowledge-access-policy should be loaded');
  });

  it('loads the model-byok-policy', () => {
    const policy = engine.getPolicy('model-byok-policy');
    assert.ok(policy, 'model-byok-policy should be loaded');
  });

  it('has total rule count matching all policies', () => {
    const ruleCount = engine.getRuleCount();
    assert.ok(ruleCount >= 8, `Should have at least 8 rules across all policies, got ${ruleCount}`);
  });
});

// ── Policy Evaluation - Default Access Policy ────────────────────────────

describe('Policy Engine - Default Access Policy', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('platform-admin can perform any action', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'admin-1', roles: ['platform-admin'] },
      action: 'anything',
      resource: { type: 'anything' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });

  it('workspace-owner can perform any action on workspace resources', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'owner-1', roles: ['workspace-owner'] },
      action: 'workspace:configure',
      resource: { type: 'workspace/config' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });

  it('workspace-member can read and write workspace resources', () => {
    const readResult = engine.evaluate({
      subject: { type: 'user', id: 'member-1', roles: ['workspace-member'] },
      action: 'read',
      resource: { type: 'workspace/data' },
    });
    assert.equal(readResult.effect, 'allow');

    const writeResult = engine.evaluate({
      subject: { type: 'user', id: 'member-1', roles: ['workspace-member'] },
      action: 'write',
      resource: { type: 'workspace/data' },
    });
    assert.equal(writeResult.effect, 'allow');
  });

  it('workspace-viewer can only read workspace resources', () => {
    const readResult = engine.evaluate({
      subject: { type: 'user', id: 'viewer-1', roles: ['workspace-viewer'] },
      action: 'read',
      resource: { type: 'workspace/data' },
    });
    assert.equal(readResult.effect, 'allow');

    const writeResult = engine.evaluate({
      subject: { type: 'user', id: 'viewer-1', roles: ['workspace-viewer'] },
      action: 'write',
      resource: { type: 'workspace/data' },
    });
    // write is not in the viewer's allowed actions (read only)
    assert.equal(writeResult.effect, 'deny');
  });

  it('unknown role gets denied', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'unknown-1', roles: ['unknown-role'] },
      action: 'read',
      resource: { type: 'workspace/data' },
    });
    assert.equal(result.effect, 'deny');
    assert.equal(result.allowed, false);
  });
});

// ── Policy Evaluation - Audit Retention Policy ──────────────────────────

describe('Policy Engine - Audit Retention Policy', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('audit:delete is denied for everyone', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'admin-1', roles: ['platform-admin'] },
      action: 'audit:delete',
      resource: { type: 'audit-event' },
    });
    assert.equal(result.effect, 'deny');
    assert.equal(result.allowed, false);
  });

  it('platform-admin can query and verify audit events', () => {
    const queryResult = engine.evaluate({
      subject: { type: 'user', id: 'admin-1', roles: ['platform-admin'] },
      action: 'audit:query',
      resource: { type: 'audit-event' },
    });
    assert.equal(queryResult.effect, 'allow');

    const verifyResult = engine.evaluate({
      subject: { type: 'user', id: 'admin-1', roles: ['platform-admin'] },
      action: 'audit:verify',
      resource: { type: 'audit-event' },
    });
    assert.equal(verifyResult.effect, 'allow');
  });
});

// ── Policy Evaluation - Memory Dream Policy (CRITICAL for PR 44) ────────

describe('Policy Engine - Memory Dream Policy (Architecture Decision Review)', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('architecture decision memory merge requires review', () => {
    const result = engine.evaluate({
      subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
      action: 'memory-item-merge',
      resource: { type: 'memory-item', id: 'mem-1' },
      context: { memory_type: 'decision', tags: ['architecture', 'backend'] },
    });
    assert.equal(result.effect, 'require-review');
    assert.equal(result.allowed, false);
    assert.ok(result.matchedPolicyId?.includes('memory-dream'));
  });

  it('architecture decision memory deprecate requires review', () => {
    const result = engine.evaluate({
      subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
      action: 'memory-item-deprecate',
      resource: { type: 'memory-item' },
      context: { memory_type: 'decision', tags: ['architecture'] },
    });
    assert.equal(result.effect, 'require-review');
    assert.equal(result.allowed, false);
  });

  it('non-architecture memory merge does not require review', () => {
    const result = engine.evaluate({
      subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
      action: 'memory-item-merge',
      resource: { type: 'memory-item' },
      context: { memory_type: 'observation', tags: ['frontend'] },
    });
    // This should NOT match the require-review rule (condition fails)
    // It may match a different policy or fall through to deny
    assert.notEqual(result.effect, 'require-review');
  });

  it('workspace-owner can run dream', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'owner-1', roles: ['workspace-owner'] },
      action: 'dream:run',
      resource: { type: 'dream-run' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });

  it('dream execute allowed in proposal mode', () => {
    const result = engine.evaluate({
      subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
      action: 'dream:execute',
      resource: { type: 'dream-run' },
      context: { mode: 'proposal' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });

  it('dream execute denied in execute mode (condition not met)', () => {
    const result = engine.evaluate({
      subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
      action: 'dream:execute',
      resource: { type: 'dream-run' },
      context: { mode: 'execute' },
    });
    // The policy only allows dream:execute when mode=proposal
    assert.equal(result.effect, 'deny');
    assert.equal(result.allowed, false);
  });
});

// ── Programmatic policy addition ────────────────────────────────────────

describe('Policy Engine - Programmatic Policy Addition', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    // Don't load from contracts - test with programmatic policies only
  });

  it('can add a policy programmatically and evaluate against it', () => {
    engine.addPolicy({
      id: 'test-policy',
      description: 'Test policy for programmatic addition',
      rules: [
        {
          effect: 'allow',
          subject: { roles: ['test-role'] },
          action: 'test:action',
          resource: 'test-resource',
        },
      ],
    });

    const result = engine.evaluate({
      subject: { type: 'user', id: 'test-1', roles: ['test-role'] },
      action: 'test:action',
      resource: { type: 'test-resource' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });

  it('dry-run-only effect is returned correctly', () => {
    engine.addPolicy({
      id: 'dry-run-policy',
      rules: [
        {
          effect: 'dry-run-only',
          subject: { roles: ['developer'] },
          action: 'dangerous:action',
          resource: 'production-resource',
        },
      ],
    });

    const result = engine.evaluate({
      subject: { type: 'user', id: 'dev-1', roles: ['developer'] },
      action: 'dangerous:action',
      resource: { type: 'production-resource' },
    });
    assert.equal(result.effect, 'dry-run-only');
    assert.equal(result.allowed, false);
  });

  it('audit-required effect is returned correctly', () => {
    engine.addPolicy({
      id: 'audit-policy',
      rules: [
        {
          effect: 'audit-required',
          subject: '*',
          action: 'sensitive:read',
          resource: 'classified-data',
        },
      ],
    });

    const result = engine.evaluate({
      subject: { type: 'user', id: 'user-1', roles: ['viewer'] },
      action: 'sensitive:read',
      resource: { type: 'classified-data' },
    });
    assert.equal(result.effect, 'audit-required');
    assert.equal(result.allowed, true); // audit-required allows the action but flags it
  });
});

// ── Default deny behavior ───────────────────────────────────────────────

describe('Policy Engine - Default Deny', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('unknown action on unknown resource is denied', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'stranger', roles: ['no-role'] },
      action: 'unknown:action',
      resource: { type: 'unknown-resource' },
    });
    assert.equal(result.effect, 'deny');
    assert.equal(result.allowed, false);
    assert.ok(result.reason.includes('No matching policy'));
  });
});

// ── Singleton convenience function ──────────────────────────────────────

describe('Policy Engine - Singleton', () => {
  beforeEach(() => {
    resetPolicyEngine();
  });

  it('evaluatePolicy uses the singleton engine', () => {
    const result = evaluatePolicy({
      subject: { type: 'user', id: 'admin-1', roles: ['platform-admin'] },
      action: 'anything',
      resource: { type: 'anything' },
    });
    assert.equal(result.effect, 'allow');
    assert.equal(result.allowed, true);
  });
});

// ── Knowledge access policy ─────────────────────────────────────────────

describe('Policy Engine - Knowledge Access Policy', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    resetPolicyEngine();
    engine = new PolicyEngine();
    engine.loadPolicies();
  });

  it('workspace-member can ingest knowledge', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'member-1', roles: ['workspace-member'] },
      action: 'knowledge:ingest',
      resource: { type: 'knowledge/collections/docs' },
    });
    assert.equal(result.effect, 'allow');
  });

  it('workspace-viewer can search knowledge', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'viewer-1', roles: ['workspace-viewer'] },
      action: 'knowledge:search',
      resource: { type: 'knowledge/collections/docs' },
    });
    assert.equal(result.effect, 'allow');
  });

  it('viewer cannot ingest knowledge', () => {
    const result = engine.evaluate({
      subject: { type: 'user', id: 'viewer-1', roles: ['workspace-viewer'] },
      action: 'knowledge:ingest',
      resource: { type: 'knowledge/collections/docs' },
    });
    // viewer only has search, not ingest
    assert.equal(result.effect, 'deny');
  });
});

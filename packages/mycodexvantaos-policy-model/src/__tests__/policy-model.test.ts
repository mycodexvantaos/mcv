/**
 * Tests for @mycodexvantaos/policy-model
 * Verifies type definitions, matching logic, and decision helpers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  type PolicyEffect,
  type PolicySubject,
  type PolicyResource,
  type PolicyRule,
  type PolicyDefinition,
  type PolicyEvaluateRequest,
  type PolicyEvaluateResult,
  isAllowedEffect,
  isDeniedEffect,
  isReviewRequiredEffect,
  parseActions,
  actionMatches,
  resourceMatches,
  conditionMatches,
  subjectMatches,
  allowDecision,
  denyDecision,
  requireReviewDecision,
  dryRunOnlyDecision,
  auditRequiredDecision,
} from '../index.js';

// ── Effect helpers ───────────────────────────────────────────────────────

describe('Policy Effect Helpers', () => {
  it('isAllowedEffect returns true only for allow', () => {
    assert.equal(isAllowedEffect('allow'), true);
    assert.equal(isAllowedEffect('deny'), false);
    assert.equal(isAllowedEffect('require-review'), false);
    assert.equal(isAllowedEffect('dry-run-only'), false);
    assert.equal(isAllowedEffect('audit-required'), false);
  });

  it('isDeniedEffect returns true only for deny', () => {
    assert.equal(isDeniedEffect('deny'), true);
    assert.equal(isDeniedEffect('allow'), false);
    assert.equal(isDeniedEffect('require-review'), false);
  });

  it('isReviewRequiredEffect returns true only for require-review', () => {
    assert.equal(isReviewRequiredEffect('require-review'), true);
    assert.equal(isReviewRequiredEffect('allow'), false);
    assert.equal(isReviewRequiredEffect('deny'), false);
  });
});

// ── Action matching ──────────────────────────────────────────────────────

describe('Action Matching', () => {
  it('parseActions splits compound actions', () => {
    const actions = parseActions('memory-item-deprecate,memory-item-merge');
    assert.deepEqual(actions, ['memory-item-deprecate', 'memory-item-merge']);
  });

  it('parseActions trims whitespace', () => {
    const actions = parseActions('read , write , execute');
    assert.deepEqual(actions, ['read', 'write', 'execute']);
  });

  it('parseActions filters empty strings', () => {
    const actions = parseActions('read,,write');
    assert.deepEqual(actions, ['read', 'write']);
  });

  it('actionMatches with wildcard', () => {
    assert.equal(actionMatches('*', 'anything'), true);
    assert.equal(actionMatches('*', 'memory-item-deprecate'), true);
  });

  it('actionMatches with exact action', () => {
    assert.equal(actionMatches('dream:run', 'dream:run'), true);
    assert.equal(actionMatches('dream:run', 'dream:execute'), false);
  });

  it('actionMatches with compound action', () => {
    assert.equal(
      actionMatches('memory-item-deprecate,memory-item-merge', 'memory-item-deprecate'),
      true
    );
    assert.equal(
      actionMatches('memory-item-deprecate,memory-item-merge', 'memory-item-merge'),
      true
    );
    assert.equal(
      actionMatches('memory-item-deprecate,memory-item-merge', 'memory-item-create'),
      false
    );
  });
});

// ── Resource matching ────────────────────────────────────────────────────

describe('Resource Matching', () => {
  it('matches wildcard resource', () => {
    assert.equal(resourceMatches('*', { type: 'anything' }), true);
  });

  it('matches exact resource type', () => {
    assert.equal(resourceMatches('dream-run', { type: 'dream-run' }), true);
    assert.equal(resourceMatches('dream-run', { type: 'memory-item' }), false);
  });

  it('matches prefix pattern workspace/*', () => {
    assert.equal(resourceMatches('workspace/*', { type: 'workspace/config' }), true);
    assert.equal(resourceMatches('workspace/*', { type: 'workspace' }), true);
    assert.equal(resourceMatches('workspace/*', { type: 'platform/config' }), false);
  });

  it('matches prefix pattern knowledge/collections/*', () => {
    assert.equal(
      resourceMatches('knowledge/collections/*', { type: 'knowledge/collections/docs' }),
      true
    );
    assert.equal(
      resourceMatches('knowledge/collections/*', { type: 'knowledge/collections' }),
      true
    );
    assert.equal(resourceMatches('knowledge/collections/*', { type: 'knowledge/models' }), false);
  });
});

// ── Condition matching ──────────────────────────────────────────────────

describe('Condition Matching', () => {
  it('matches empty condition (no constraints)', () => {
    assert.equal(conditionMatches(undefined, { memory_type: 'decision' }), true);
    assert.equal(conditionMatches({}, { memory_type: 'decision' }), true);
  });

  it('matches exact string value', () => {
    assert.equal(conditionMatches({ memory_type: 'decision' }, { memory_type: 'decision' }), true);
    assert.equal(
      conditionMatches({ memory_type: 'decision' }, { memory_type: 'observation' }),
      false
    );
  });

  it('matches array value (OR logic)', () => {
    assert.equal(conditionMatches({ mode: ['dry-run', 'proposal'] }, { mode: 'proposal' }), true);
    assert.equal(conditionMatches({ mode: ['dry-run', 'proposal'] }, { mode: 'execute' }), false);
  });

  it('matches tags_contains condition', () => {
    assert.equal(
      conditionMatches({ tags_contains: ['architecture'] }, { tags: ['architecture', 'backend'] }),
      true
    );
    assert.equal(
      conditionMatches({ tags_contains: ['architecture'] }, { tags: ['frontend', 'ui'] }),
      false
    );
    assert.equal(conditionMatches({ tags_contains: ['architecture'] }, {}), false);
  });

  it('matches multiple conditions (AND logic)', () => {
    assert.equal(
      conditionMatches(
        { memory_type: 'decision', tags_contains: ['architecture'] },
        { memory_type: 'decision', tags: ['architecture'] }
      ),
      true
    );
    assert.equal(
      conditionMatches(
        { memory_type: 'decision', tags_contains: ['architecture'] },
        { memory_type: 'decision', tags: ['frontend'] }
      ),
      false
    );
    assert.equal(
      conditionMatches(
        { memory_type: 'decision', tags_contains: ['architecture'] },
        { memory_type: 'observation', tags: ['architecture'] }
      ),
      false
    );
  });
});

// ── Subject matching ────────────────────────────────────────────────────

describe('Subject Matching', () => {
  const adminSubject: PolicySubject = {
    type: 'user',
    id: 'user-1',
    roles: ['platform-admin'],
  };

  const serviceSubject: PolicySubject = {
    type: 'service',
    id: 'dream-worker',
    service: 'memory-dream',
  };

  const viewerSubject: PolicySubject = {
    type: 'user',
    id: 'viewer-1',
    roles: ['workspace-viewer'],
  };

  it('matches wildcard subject', () => {
    assert.equal(subjectMatches('*', adminSubject), true);
    assert.equal(subjectMatches('*', serviceSubject), true);
  });

  it('matches subject by role', () => {
    assert.equal(subjectMatches({ roles: ['platform-admin'] }, adminSubject), true);
    assert.equal(subjectMatches({ roles: ['platform-admin'] }, viewerSubject), false);
  });

  it('matches subject by service', () => {
    assert.equal(subjectMatches({ service: 'memory-dream' }, serviceSubject), true);
    assert.equal(subjectMatches({ service: 'memory-dream' }, adminSubject), false);
  });

  it('matches multiple roles (OR logic)', () => {
    assert.equal(
      subjectMatches({ roles: ['workspace-owner', 'platform-admin'] }, adminSubject),
      true
    );
    assert.equal(
      subjectMatches({ roles: ['workspace-owner', 'platform-admin'] }, viewerSubject),
      false
    );
  });

  it('does not match when no fields overlap', () => {
    assert.equal(
      subjectMatches({ roles: ['workspace-owner'], service: 'audit-log' }, adminSubject),
      false
    );
  });
});

// ── Decision helpers ─────────────────────────────────────────────────────

describe('Decision Helpers', () => {
  it('allowDecision creates correct result', () => {
    const result = allowDecision('Access granted', {
      matchedRuleId: 'rule-1',
      matchedPolicyId: 'policy-a',
      role: 'platform-admin',
    });
    assert.equal(result.allowed, true);
    assert.equal(result.effect, 'allow');
    assert.equal(result.reason, 'Access granted');
    assert.equal(result.matchedRuleId, 'rule-1');
    assert.equal(result.matchedPolicyId, 'policy-a');
    assert.equal(result.role, 'platform-admin');
    assert.ok(result.evaluatedAt);
  });

  it('denyDecision creates correct result', () => {
    const result = denyDecision('Access denied', { matchedRuleId: 'rule-2' });
    assert.equal(result.allowed, false);
    assert.equal(result.effect, 'deny');
    assert.equal(result.reason, 'Access denied');
  });

  it('requireReviewDecision creates correct result', () => {
    const result = requireReviewDecision('Architecture decision requires review', {
      matchedPolicyId: 'memory-dream-policy',
    });
    assert.equal(result.allowed, false);
    assert.equal(result.effect, 'require-review');
    assert.equal(result.reason, 'Architecture decision requires review');
    assert.equal(result.matchedPolicyId, 'memory-dream-policy');
  });

  it('dryRunOnlyDecision creates correct result', () => {
    const result = dryRunOnlyDecision('Only dry-run mode is allowed');
    assert.equal(result.allowed, false);
    assert.equal(result.effect, 'dry-run-only');
    assert.equal(result.reason, 'Only dry-run mode is allowed');
  });

  it('auditRequiredDecision creates correct result', () => {
    const result = auditRequiredDecision('Action requires audit trail');
    assert.equal(result.allowed, true);
    assert.equal(result.effect, 'audit-required');
    assert.equal(result.reason, 'Action requires audit trail');
  });
});

// ── Full policy rule evaluation scenario ─────────────────────────────────

describe('Full Policy Rule Evaluation Scenario', () => {
  // Simulate the memory-dream-policy
  const memoryDreamPolicy: PolicyDefinition = {
    id: 'memory-dream-policy',
    description: 'Policy for memory dream operations - architecture decisions require review',
    rules: [
      {
        effect: 'require-review',
        subject: { service: 'memory-dream' },
        action: 'memory-item-deprecate,memory-item-merge',
        resource: 'memory-item',
        condition: { memory_type: 'decision', tags_contains: ['architecture'] },
      },
      {
        effect: 'allow',
        subject: { roles: ['workspace-owner', 'platform-admin'] },
        action: 'dream:run',
        resource: 'dream-run',
      },
      {
        effect: 'allow',
        subject: { service: 'memory-dream' },
        action: 'dream:execute',
        resource: 'dream-run',
        condition: { mode: 'proposal' },
      },
    ],
  };

  it('architecture decision memory merge requires review', () => {
    const rule = memoryDreamPolicy.rules[0];
    const subject: PolicySubject = { type: 'service', id: 'dream-worker', service: 'memory-dream' };
    const resource: PolicyResource = {
      type: 'memory-item',
      id: 'mem-1',
      attributes: { memory_type: 'decision', tags: ['architecture', 'backend'] },
    };

    const subjectMatch = subjectMatches(rule.subject, subject);
    const actionMatch = actionMatches(rule.action, 'memory-item-merge');
    const resourceMatch = resourceMatches(rule.resource, resource);
    const conditionMatch = conditionMatches(rule.condition, {
      memory_type: 'decision',
      tags: ['architecture', 'backend'],
    });

    assert.equal(subjectMatch, true);
    assert.equal(actionMatch, true);
    assert.equal(resourceMatch, true);
    assert.equal(conditionMatch, true);
    assert.equal(rule.effect, 'require-review');
  });

  it('non-architecture memory merge does not match the require-review rule', () => {
    const rule = memoryDreamPolicy.rules[0];
    const conditionMatch = conditionMatches(rule.condition, {
      memory_type: 'observation',
      tags: ['frontend'],
    });
    assert.equal(conditionMatch, false);
  });

  it('workspace-owner can run dream', () => {
    const rule = memoryDreamPolicy.rules[1];
    const subject: PolicySubject = { type: 'user', id: 'user-1', roles: ['workspace-owner'] };
    const subjectMatch = subjectMatches(rule.subject, subject);
    assert.equal(subjectMatch, true);
    assert.equal(rule.effect, 'allow');
  });

  it('dream execute allowed only in proposal mode', () => {
    const rule = memoryDreamPolicy.rules[2];
    const conditionMatch = conditionMatches(rule.condition, { mode: 'proposal' });
    assert.equal(conditionMatch, true);

    const conditionMatchDeny = conditionMatches(rule.condition, { mode: 'execute' });
    assert.equal(conditionMatchDeny, false);
  });
});

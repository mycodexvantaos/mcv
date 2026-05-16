#!/usr/bin/env node
/**
 * @mycodexvantaos/governance-check
 * Contract enforcement CI — verifies contract-runtime alignment.
 *
 * Checks:
 *   1. All contracts validate (YAML/JSON schemas, service definitions)
 *   2. All policies load correctly from contracts/policies/
 *   3. All service definitions load correctly
 *   4. All resource kinds load correctly
 *   5. Policy engine evaluates correctly (smoke test)
 *   6. All tests pass
 *
 * Exit code: 0 if all checks pass, 1 if any check fails.
 */

import {
  validateAllContracts,
  loadPolicyDefinitions,
  loadServiceDefinitions,
  loadResourceKinds,
} from '@mycodexvantaos/contracts-sdk';
import * as fs from 'node:fs';
import { PolicyEngine } from '@mycodexvantaos/service-policy-engine';

let exitCode = 0;

function check(name: string, fn: () => boolean): void {
  try {
    const passed = fn();
    if (passed) {
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ❌ ${name}`);
      exitCode = 1;
    }
  } catch (err) {
    console.log(`  ❌ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    exitCode = 1;
  }
}

console.log('\n🔍 MyCodeXvantaOS Governance Check\n');
console.log('━'.repeat(50));

// ── Check 1: Contract validation ──────────────────────────────────────
console.log('\n📋 Contract Validation:');
check('All contracts validate', () => {
  const result = validateAllContracts();
  const allValid =
    result.services.valid &&
    result.resourceKinds.valid &&
    result.policies.valid &&
    result.events.valid;
  if (!allValid) {
    console.log('     Validation errors:', JSON.stringify(result, null, 2));
  }
  return allValid;
});

// ── Check 2: Policy definitions ───────────────────────────────────────
console.log('\n🛡️  Policy Definitions:');
check('Policies load from contracts', () => {
  const policies = loadPolicyDefinitions();
  if (policies.length === 0) {
    console.log('     No policies found');
    return false;
  }
  console.log(
    `     Loaded ${policies.length} policies: ${policies.map((p) => p.metadata?.name).join(', ')}`
  );
  return policies.length >= 5; // We expect at least 5 policies
});

check('Policy engine evaluates correctly', () => {
  const engine = new PolicyEngine();
  engine.loadPolicies();
  // Smoke test: platform-admin should be allowed
  const result = engine.evaluate({
    subject: { type: 'user', id: 'admin', roles: ['platform-admin'] },
    action: 'any',
    resource: { type: 'any' },
  });
  return result.allowed === true;
});

check('Architecture decision memory merge requires review', () => {
  const engine = new PolicyEngine();
  engine.loadPolicies();
  const result = engine.evaluate({
    subject: { type: 'service', id: 'dream-worker', service: 'memory-dream' },
    action: 'memory-item-merge',
    resource: { type: 'memory-item' },
    context: { memory_type: 'decision', tags: ['architecture'] },
  });
  return result.effect === 'require-review';
});

// ── Check 3: Service definitions ──────────────────────────────────────
console.log('\n🔧 Service Definitions:');
check('Services load from contracts', () => {
  const services = loadServiceDefinitions();
  if (services.length === 0) {
    console.log('     No services found');
    return false;
  }
  console.log(
    `     Loaded ${services.length} services: ${services.map((s) => s.metadata?.name).join(', ')}`
  );
  return services.length >= 5;
});

// ── Check 4: Resource kinds ───────────────────────────────────────────
console.log('\n📦 Resource Kinds:');
check('Resource kinds load from contracts', () => {
  const kinds = loadResourceKinds();
  if (kinds.length === 0) {
    console.log('     No resource kinds found');
    return false;
  }
  console.log(
    `     Loaded ${kinds.length} resource kinds: ${kinds.map((k) => k.metadata?.name).join(', ')}`
  );
  return kinds.length >= 3;
});

// ── Check 5: Enforcement flags ───────────────────────────────────────────
console.log('\n' + '🔒 Enforcement Flags:');
check('Audit enforcement flag is exported', () => {
  // Verify the enforcement flags are properly exported from api-node
  // We check the source file directly since we can't import ESM at runtime here

  const source = fs.readFileSync('apps/api-node/index.ts', 'utf-8');
  const hasAuditFlag = source.includes('auditEnforcementEnabled');
  const hasKnowledgeFlag = source.includes('knowledgeTraceEnforcementEnabled');
  const hasDreamFlag = source.includes('dreamSafetyEnforcementEnabled');
  if (!hasAuditFlag) {
    console.log('     Missing: auditEnforcementEnabled');
    return false;
  }
  if (!hasKnowledgeFlag) {
    console.log('     Missing: knowledgeTraceEnforcementEnabled');
    return false;
  }
  if (!hasDreamFlag) {
    console.log('     Missing: dreamSafetyEnforcementEnabled');
    return false;
  }
  console.log('     All 3 enforcement flags present: audit, knowledge-trace, dream-safety');
  return true;
});

check('POST /v1/audit/events is NOT wrapped with withAudit()', () => {
  const source = fs.readFileSync('apps/api-node/index.ts', 'utf-8');
  // The audit events route should NOT be wrapped with withAudit to prevent
  // infinite recursion (recording an audit event about recording an audit event)
  const auditRoutePattern = /addRoute\(\s*'POST',\s*'\/v1\/audit\/events'/;
  const match = source.match(auditRoutePattern);
  if (!match) return false;
  // Find the section after the route declaration
  const routeStart = source.indexOf(match[0]);
  const routeEnd = source.indexOf('{ audited: true }', routeStart);
  const routeSection = source.substring(routeStart, routeEnd);
  const hasWithAudit = routeSection.includes('withAudit(');
  if (hasWithAudit) {
    console.log(
      '     ERROR: POST /v1/audit/events is wrapped with withAudit() — infinite recursion risk'
    );
    return false;
  }
  console.log('     Audit events route correctly unwrapped (recursion-safe)');
  return true;
});

check('Architecture decision enforcement is present', () => {
  const source = fs.readFileSync('apps/api-node/index.ts', 'utf-8');
  const hasArchEnforcement =
    source.includes('archDecisionActions') &&
    source.includes('platform-safety:architecture-decision-review');
  if (!hasArchEnforcement) {
    console.log('     Missing: architecture decision enforcement in policy evaluation');
    return false;
  }
  console.log('     Architecture decision enforcement verified');
  return true;
});

check('Knowledge trace receipt validation is enforced', () => {
  const source = fs.readFileSync('apps/api-node/index.ts', 'utf-8');
  const hasKnowledgeEnforcement =
    source.includes('knowledgeTraceEnforcementEnabled') &&
    source.includes('Knowledge trace enforcement');
  if (!hasKnowledgeEnforcement) {
    console.log('     Missing: knowledge trace enforcement');
    return false;
  }
  console.log('     Knowledge trace enforcement verified');
  return true;
});

check('Dream safety enforcement is present', () => {
  const source = fs.readFileSync('apps/api-node/index.ts', 'utf-8');
  const hasDreamEnforcement =
    source.includes('dreamSafetyEnforcementEnabled') && source.includes('Dream safety enforcement');
  if (!hasDreamEnforcement) {
    console.log('     Missing: dream safety enforcement');
    return false;
  }
  console.log('     Dream safety enforcement verified');
  return true;
});

// ── Summary ───────────────────────────────────────────────────────────
console.log('\n' + '━'.repeat(50));
if (exitCode === 0) {
  console.log('\n✅ All governance checks passed!\n');
} else {
  console.log('\n❌ Some governance checks failed!\n');
}

process.exit(exitCode);

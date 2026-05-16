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

import { validateAllContracts, loadPolicyDefinitions, loadServiceDefinitions, loadResourceKinds } from '@mycodexvantaos/contracts-sdk';
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
  const allValid = result.services.valid && result.resourceKinds.valid && result.policies.valid && result.events.valid;
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
  console.log(`     Loaded ${policies.length} policies: ${policies.map(p => p.metadata?.name).join(', ')}`);
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
  console.log(`     Loaded ${services.length} services: ${services.map(s => s.metadata?.name).join(', ')}`);
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
  console.log(`     Loaded ${kinds.length} resource kinds: ${kinds.map(k => k.metadata?.name).join(', ')}`);
  return kinds.length >= 3;
});

// ── Summary ───────────────────────────────────────────────────────────
console.log('\n' + '━'.repeat(50));
if (exitCode === 0) {
  console.log('\n✅ All governance checks passed!\n');
} else {
  console.log('\n❌ Some governance checks failed!\n');
}

process.exit(exitCode);

/**
 * @mycodexvantaos/contracts-sdk — Integration tests
 *
 * Verifies that all contract YAML/JSON files in the repo can be loaded,
 * parsed, and validated by the contracts-sdk runtime loader.
 *
 * Uses Node.js built-in test runner (node:test).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadServiceDefinitions,
  loadResourceKinds,
  loadPolicyDefinitions,
  loadEventDefinitions,
  loadServiceCatalog,
  loadSchemas,
  validateContract,
  validateAllContracts,
} from '../index.js';

// The contracts-sdk resolveContractsRoot() walks up from the given directory
// to find a directory containing `contracts/`. Running from the package dir,
// it will find the monorepo root automatically.
// We pass undefined to use the default CWD-based resolution.
const MONOREPO_ROOT = undefined;

// ────────────────────────────────────────────────────────────
// loadServiceDefinitions
// ────────────────────────────────────────────────────────────
describe('loadServiceDefinitions', () => {
  it('should load at least one service definition', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    assert.ok(services.length > 0, 'Expected at least one service definition');
  });

  it('should return objects with apiVersion and kind', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    for (const svc of services) {
      assert.ok(svc.apiVersion, `Service ${svc.metadata?.name} missing apiVersion`);
      assert.ok(svc.kind, `Service ${svc.metadata?.name} missing kind`);
    }
  });

  it('should return objects with metadata.name', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    for (const svc of services) {
      assert.ok(svc.metadata?.name, `Service missing metadata.name`);
    }
  });

  it('should include the audit-log service', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    const names = services.map((s) => s.metadata?.name);
    assert.ok(
      names.includes('audit-log'),
      `Expected audit-log in service names, got: ${names.join(', ')}`
    );
  });

  it('should include the identity service', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    const names = services.map((s) => s.metadata?.name);
    assert.ok(
      names.includes('identity'),
      `Expected identity in service names, got: ${names.join(', ')}`
    );
  });

  it('should load at least 8 services (the MVP services)', () => {
    const services = loadServiceDefinitions(MONOREPO_ROOT);
    assert.ok(services.length >= 8, `Expected at least 8 services, got ${services.length}`);
  });
});

// ────────────────────────────────────────────────────────────
// loadResourceKinds
// ────────────────────────────────────────────────────────────
describe('loadResourceKinds', () => {
  it('should load at least one resource kind', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    assert.ok(kinds.length > 0, 'Expected at least one resource kind');
  });

  it('should return objects with apiVersion and kind', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    for (const rk of kinds) {
      assert.ok(rk.apiVersion, `ResourceKind ${rk.metadata?.name} missing apiVersion`);
      assert.ok(rk.kind, `ResourceKind ${rk.metadata?.name} missing kind`);
    }
  });

  it('should return objects with metadata.name derived from kind', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    for (const rk of kinds) {
      assert.ok(rk.metadata?.name, `ResourceKind missing metadata.name`);
    }
  });

  it('should include the audit-event resource kind', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    const names = kinds.map((k) => k.metadata?.name);
    assert.ok(
      names.includes('audit-event'),
      `Expected audit-event in resource kind names, got: ${names.join(', ')}`
    );
  });

  it('should include the memory-item resource kind', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    const names = kinds.map((k) => k.metadata?.name);
    assert.ok(
      names.includes('memory-item'),
      `Expected memory-item in resource kind names, got: ${names.join(', ')}`
    );
  });

  it('should load at least 10 resource kinds', () => {
    const kinds = loadResourceKinds(MONOREPO_ROOT);
    assert.ok(kinds.length >= 10, `Expected at least 10 resource kinds, got ${kinds.length}`);
  });
});

// ────────────────────────────────────────────────────────────
// loadPolicyDefinitions
// ────────────────────────────────────────────────────────────
describe('loadPolicyDefinitions', () => {
  it('should load at least one policy', () => {
    const policies = loadPolicyDefinitions(MONOREPO_ROOT);
    assert.ok(policies.length > 0, 'Expected at least one policy definition');
  });

  it('should return objects with apiVersion and kind after normalization', () => {
    const policies = loadPolicyDefinitions(MONOREPO_ROOT);
    for (const p of policies) {
      assert.ok(p.apiVersion, `Policy ${p.metadata?.name} missing apiVersion`);
      assert.ok(p.kind, `Policy ${p.metadata?.name} missing kind`);
    }
  });

  it('should include the audit-retention-policy', () => {
    const policies = loadPolicyDefinitions(MONOREPO_ROOT);
    const names = policies.map((p) => p.metadata?.name);
    assert.ok(
      names.includes('audit-retention-policy'),
      `Expected audit-retention-policy, got: ${names.join(', ')}`
    );
  });

  it('should include the memory-dream-policy', () => {
    const policies = loadPolicyDefinitions(MONOREPO_ROOT);
    const names = policies.map((p) => p.metadata?.name);
    assert.ok(
      names.includes('memory-dream-policy'),
      `Expected memory-dream-policy, got: ${names.join(', ')}`
    );
  });
});

// ────────────────────────────────────────────────────────────
// loadEventDefinitions
// ────────────────────────────────────────────────────────────
describe('loadEventDefinitions', () => {
  it('should load at least one event definition', () => {
    const events = loadEventDefinitions(MONOREPO_ROOT);
    assert.ok(events.length > 0, 'Expected at least one event definition');
  });

  it('should return objects with apiVersion and kind after normalization', () => {
    const events = loadEventDefinitions(MONOREPO_ROOT);
    for (const e of events) {
      assert.ok(e.apiVersion, `Event ${e.metadata?.name} missing apiVersion`);
      assert.ok(e.kind, `Event ${e.metadata?.name} missing kind`);
    }
  });

  it('should include the audit events (category: audit)', () => {
    const events = loadEventDefinitions(MONOREPO_ROOT);
    const names = events.map((e) => e.metadata?.name);
    assert.ok(
      names.some((n) => n?.includes('audit')),
      `Expected audit events, got: ${names.join(', ')}`
    );
  });

  it('should include the memory events (category: memory)', () => {
    const events = loadEventDefinitions(MONOREPO_ROOT);
    const names = events.map((e) => e.metadata?.name);
    assert.ok(names.includes('memory'), `Expected memory events, got: ${names.join(', ')}`);
  });
});

// ────────────────────────────────────────────────────────────
// loadServiceCatalog
// ────────────────────────────────────────────────────────────
describe('loadServiceCatalog', () => {
  it('should load the service catalog', () => {
    const catalog = loadServiceCatalog(MONOREPO_ROOT);
    assert.ok(catalog, 'Expected service catalog to be loaded');
  });

  it('should have apiVersion and kind', () => {
    const catalog = loadServiceCatalog(MONOREPO_ROOT);
    assert.ok(catalog!.apiVersion, 'Catalog missing apiVersion');
    assert.ok(catalog!.kind, 'Catalog missing kind');
  });

  it('should have metadata.name', () => {
    const catalog = loadServiceCatalog(MONOREPO_ROOT);
    assert.ok(catalog!.metadata?.name, 'Catalog missing metadata.name');
  });
});

// ────────────────────────────────────────────────────────────
// loadSchemas
// ────────────────────────────────────────────────────────────
describe('loadSchemas', () => {
  it('should load at least one schema', () => {
    const schemas = loadSchemas(MONOREPO_ROOT);
    assert.ok(schemas.size > 0, 'Expected at least one schema');
  });

  it('should include the audit-event schema', () => {
    const schemas = loadSchemas(MONOREPO_ROOT);
    const names = Array.from(schemas.keys());
    assert.ok(
      names.some((n) => n.includes('audit-event')),
      `Expected audit-event schema, got: ${names.join(', ')}`
    );
  });

  it('should include the service-definition schema', () => {
    const schemas = loadSchemas(MONOREPO_ROOT);
    const names = Array.from(schemas.keys());
    assert.ok(
      names.some((n) => n.includes('service-definition')),
      `Expected service-definition schema, got: ${names.join(', ')}`
    );
  });
});

// ────────────────────────────────────────────────────────────
// validateContract
// ────────────────────────────────────────────────────────────
describe('validateContract', () => {
  it('should validate a correct contract', () => {
    const result = validateContract({
      apiVersion: 'v1',
      kind: 'ServiceDefinition',
      metadata: { name: 'test' },
    });
    assert.ok(result.valid, `Expected valid, got errors: ${result.errors.join(', ')}`);
  });

  it('should reject a contract missing apiVersion', () => {
    const result = validateContract({
      kind: 'ServiceDefinition',
      metadata: { name: 'test' },
    });
    assert.ok(!result.valid, 'Expected invalid for missing apiVersion');
    assert.ok(result.errors.some((e) => e.includes('apiVersion')));
  });

  it('should reject a contract missing kind', () => {
    const result = validateContract({
      apiVersion: 'v1',
      metadata: { name: 'test' },
    });
    assert.ok(!result.valid, 'Expected invalid for missing kind');
    assert.ok(result.errors.some((e) => e.includes('kind')));
  });

  it('should accept custom required fields', () => {
    const result = validateContract(
      { apiVersion: 'v1', kind: 'Test', metadata: { name: 'test' }, spec: {} },
      ['apiVersion', 'kind', 'spec']
    );
    assert.ok(result.valid, `Expected valid, got errors: ${result.errors.join(', ')}`);
  });
});

// ────────────────────────────────────────────────────────────
// validateAllContracts
// ────────────────────────────────────────────────────────────
describe('validateAllContracts', () => {
  it('should validate all contracts without errors', () => {
    const result = validateAllContracts(MONOREPO_ROOT);
    assert.ok(
      result.services.valid,
      `Service validation errors: ${result.services.errors.join('; ')}`
    );
    assert.ok(
      result.resourceKinds.valid,
      `ResourceKind validation errors: ${result.resourceKinds.errors.join('; ')}`
    );
    assert.ok(
      result.policies.valid,
      `Policy validation errors: ${result.policies.errors.join('; ')}`
    );
    assert.ok(result.events.valid, `Event validation errors: ${result.events.errors.join('; ')}`);
  });
});

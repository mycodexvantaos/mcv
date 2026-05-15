/**
 * @mycodexvantaos/service-resource-registry — Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { listResourceKinds, getResourceKind, clearCache } from '../index.js';

describe('resource-registry runtime', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('listResourceKinds', () => {
    it('should return a non-empty list of resource kinds', () => {
      const result = listResourceKinds();
      assert.ok(result.total > 0, 'Expected at least one resource kind');
      assert.ok(result.resourceKinds.length > 0);
      assert.equal(result.resourceKinds.length, result.total);
    });

    it('should include audit-event resource kind', () => {
      const result = listResourceKinds();
      const names = result.resourceKinds.map((rk) => rk.name);
      assert.ok(names.includes('audit-event'), `Expected audit-event, got: ${names.join(', ')}`);
    });

    it('should include memory-item resource kind', () => {
      const result = listResourceKinds();
      const names = result.resourceKinds.map((rk) => rk.name);
      assert.ok(names.includes('memory-item'), `Expected memory-item, got: ${names.join(', ')}`);
    });

    it('should have all required fields on each resource kind', () => {
      const result = listResourceKinds();
      for (const rk of result.resourceKinds) {
        assert.ok(rk.name, 'Resource kind missing name');
        assert.ok(rk.kind, `ResourceKind ${rk.name} missing kind`);
        assert.ok(rk.apiVersion, `ResourceKind ${rk.name} missing apiVersion`);
      }
    });
  });

  describe('getResourceKind', () => {
    it('should return a resource kind by name', () => {
      const rk = getResourceKind('audit-event');
      assert.ok(rk, 'Expected audit-event resource kind');
      assert.equal(rk!.name, 'audit-event');
    });

    it('should return null for unknown resource kind', () => {
      const rk = getResourceKind('non-existent-kind');
      assert.equal(rk, null);
    });

    it('should include lifecycle and permissions', () => {
      const rk = getResourceKind('audit-event');
      assert.ok(rk, 'Expected audit-event resource kind');
      assert.ok(rk!.lifecycle, 'Expected lifecycle');
      assert.ok(rk!.lifecycle!.length > 0, 'Expected at least one lifecycle phase');
      assert.ok(rk!.permissions, 'Expected permissions');
      assert.ok(rk!.permissions!.length > 0, 'Expected at least one permission');
    });

    it('should include metadata_schema', () => {
      const rk = getResourceKind('audit-event');
      assert.ok(rk, 'Expected audit-event resource kind');
      assert.ok(rk!.metadata_schema, 'Expected metadata_schema');
    });
  });
});

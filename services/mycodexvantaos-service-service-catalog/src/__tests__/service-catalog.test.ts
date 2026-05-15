/**
 * @mycodexvantaos/service-service-catalog — Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { listServices, getService, getCatalog, clearCache } from '../index.js';

describe('service-catalog runtime', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('listServices', () => {
    it('should return a non-empty list of services', () => {
      const result = listServices();
      assert.ok(result.total > 0, 'Expected at least one service');
      assert.ok(result.services.length > 0, 'Expected services array to be non-empty');
      assert.equal(result.services.length, result.total);
    });

    it('should include audit-log service', () => {
      const result = listServices();
      const names = result.services.map((s) => s.name);
      assert.ok(names.includes('audit-log'), `Expected audit-log, got: ${names.join(', ')}`);
    });

    it('should include identity service', () => {
      const result = listServices();
      const names = result.services.map((s) => s.name);
      assert.ok(names.includes('identity'), `Expected identity, got: ${names.join(', ')}`);
    });

    it('should have all required fields on each service', () => {
      const result = listServices();
      for (const svc of result.services) {
        assert.ok(svc.name, `Service missing name`);
        assert.ok(svc.apiVersion, `Service ${svc.name} missing apiVersion`);
        assert.ok(svc.kind, `Service ${svc.name} missing kind`);
      }
    });
  });

  describe('getService', () => {
    it('should return a service by name', () => {
      const svc = getService('audit-log');
      assert.ok(svc, 'Expected audit-log service');
      assert.equal(svc!.name, 'audit-log');
    });

    it('should return null for unknown service', () => {
      const svc = getService('non-existent-service');
      assert.equal(svc, null);
    });

    it('should include spec details for a service', () => {
      const svc = getService('audit-log');
      assert.ok(svc, 'Expected audit-log service');
      assert.ok(svc!.spec, 'Expected spec to be present');
    });

    it('should return identity service with capabilities', () => {
      const svc = getService('identity');
      assert.ok(svc, 'Expected identity service');
      assert.ok(svc!.spec.capabilities, 'Expected identity to have capabilities');
      assert.ok(svc!.spec.capabilities!.length > 0, 'Expected at least one capability');
    });
  });

  describe('getCatalog', () => {
    it('should return the service catalog', () => {
      const catalog = getCatalog();
      assert.ok(catalog, 'Expected service catalog');
      assert.ok(catalog!.metadata?.name, 'Expected catalog to have metadata.name');
    });
  });
});

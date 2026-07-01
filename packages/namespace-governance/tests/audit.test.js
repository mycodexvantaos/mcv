import { describe, test, expect } from '@jest/globals';
import { buildAuditRecord } from '../src/audit.js';

describe('buildAuditRecord', () => {
  const base = {
    actor: 'dev',
    action: 'evaluate-closure',
    resource: 'mycodexvantaos',
    passed: true,
    violations: 0,
  };

  test('produces a complete tamper-evident record', () => {
    const rec = buildAuditRecord(base);
    expect(rec).toMatchObject({ actor: 'dev', result: 'pass', violations: 0 });
    expect(rec.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(rec.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(rec.correlationId).toBe(rec.requestId);
    expect(Date.parse(rec.timestamp)).not.toBeNaN();
  });

  test('result reflects failure', () => {
    expect(buildAuditRecord({ ...base, passed: false, violations: 3 }).result).toBe('fail');
  });

  test('uses provided correlationId', () => {
    expect(buildAuditRecord({ ...base, correlationId: 'abc' }).correlationId).toBe('abc');
  });

  test('distinct requests get distinct ids and hashes', () => {
    const a = buildAuditRecord(base);
    const b = buildAuditRecord(base);
    expect(a.requestId).not.toBe(b.requestId);
    expect(a.hash).not.toBe(b.hash);
  });
});

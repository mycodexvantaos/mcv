/**
 * api-node CORS security policy tests — MyCodexVantaOS v1.0.0
 *
 * Tests:
 * - No wildcard CORS outside development
 * - Localhost only in development allowlist
 * - Production allowlist includes canonical application origins
 *
 * Rationale: Uses Reflect.deleteProperty to circumvent TypeScript's
 * readonly annotation on process.env.NODE_ENV, enabling deterministic
 * environment simulation without side effects between test cases.
 *
 * Document ID: IM-API-001
 */

import { describe, expect, it, vi } from 'vitest';

describe('api-node CORS security policy', () => {
  it('does not use wildcard CORS outside development', async () => {
    vi.resetModules();
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    process.env.NODE_ENV = 'production';

    const domains = await import('../../../packages/core/src/config/domains');

    const allowlist = domains.getCorsAllowlist(domains.resolveEnvironment());

    expect(allowlist).not.toContain('*');
    expect(allowlist.length).toBeGreaterThan(0);
    expect(allowlist.every((origin) => origin.startsWith('https://'))).toBe(true);
  });

  it('allows localhost only in development allowlist', async () => {
    vi.resetModules();
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    process.env.NODE_ENV = 'development';

    const domains = await import('../../../packages/core/src/config/domains');

    const allowlist = domains.getCorsAllowlist(domains.resolveEnvironment());

    expect(allowlist.some((origin) => origin.includes('localhost'))).toBe(true);
  });

  it('production allowlist includes canonical application origins', async () => {
    vi.resetModules();
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    process.env.NODE_ENV = 'production';

    const domains = await import('../../../packages/core/src/config/domains');

    const allowlist = domains.getCorsAllowlist('production');

    expect(allowlist).toContain('https://mycodexvantaos.com');
    expect(allowlist).toContain('https://www.mycodexvantaos.com');
    expect(allowlist).toContain('https://app.mycodexvantaos.com');
  });
});

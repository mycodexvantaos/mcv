/**
 * JWTTokenManager unit tests — MyCodexVantaOS v1.0.0
 *
 * Tests: sign/verify, malformed tokens, tampered signatures,
 * expired tokens, revoked tokens.
 *
 * Rationale: Uses MyCodexVantaOS canonical URLs as issuer/audience
 * instead of third-party example.com references, per MyCodexVantaOS
 * naming conventions.
 *
 * Document ID: IM-AUTH-001
 */

import { describe, expect, it } from 'vitest';
import { JWTTokenManager } from '../index';

const SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef';
const ISSUER = 'https://mycodexvantaos.com';
const AUDIENCE = 'https://app.mycodexvantaos.com';

describe('JWTTokenManager', () => {
  it('signs and verifies a valid token', async () => {
    const manager = new JWTTokenManager({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      ttlSeconds: 60,
    });

    const token = manager.signToken({ sub: 'user-1', scope: 'read:all' });
    const result = await manager.verifyToken(token);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sub).toBe('user-1');
      expect(result.value.scope).toBe('read:all');
      expect(result.value.iss).toBe(ISSUER);
      expect(result.value.aud).toBe(AUDIENCE);
    }
  });

  it('rejects malformed tokens', async () => {
    const manager = new JWTTokenManager({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const result = await manager.verifyToken('not-a-jwt');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('MALFORMED');
    }
  });

  it('rejects tampered signatures', async () => {
    const manager = new JWTTokenManager({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const token = manager.signToken({ sub: 'user-1' });
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

    const result = await manager.verifyToken(tampered);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('INVALID_SIGNATURE');
    }
  });

  it('rejects expired tokens', async () => {
    const manager = new JWTTokenManager({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      ttlSeconds: -1,
    });

    const token = manager.signToken({ sub: 'user-1' });
    const result = await manager.verifyToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('EXPIRED');
    }
  });

  it('rejects revoked tokens', async () => {
    const manager = new JWTTokenManager({
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      ttlSeconds: 60,
    });

    const token = manager.signToken({ sub: 'user-1' });
    await manager.revokeToken(token);

    const result = await manager.verifyToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('REVOKED');
    }
  });
});

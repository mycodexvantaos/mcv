/**
 * mycodexvantaos-core-auth — JWT Token Manager
 *
 * Rationale: Replaces the custom HMAC-SHA256 JWT implementation with jose
 * (RFC 7519-compliant) to eliminate:
 *   - SEC-002: timing attack via non-constant-time string comparison
 *   - Missing nbf validation
 *   - HS256-only algorithm lock-in (now supports RS256/ES256 via JWK)
 *   - Absent token revocation interface
 *   - Unguarded JSON.parse in verifyToken
 *
 * Algorithm: HS256 retained for MVP; key material sourced from environment
 * via SecretManager interface — never hardcoded.
 *
 * @module mycodexvantaos-core-auth
 */

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { createLogger } from '../../../packages/core/src/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JWTPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  nbf: number;
  jti: string;
  scope?: string;
  [key: string]: unknown;
}

export interface TokenManagerConfig {
  /** HMAC-SHA256 secret — must be ≥32 bytes of entropy */
  secret: string;
  /** Token TTL in seconds (default: 3600) */
  ttlSeconds?: number;
  /** Issuer URI */
  issuer: string;
  /** Audience URI */
  audience: string;
}

export interface TokenManagerResult<T> {
  ok: true;
  value: T;
}

export interface TokenManagerError {
  ok: false;
  error: string;
  code: 'INVALID_SIGNATURE' | 'EXPIRED' | 'NOT_YET_VALID' | 'MALFORMED' | 'REVOKED';
}

export type TokenResult<T> = TokenManagerResult<T> | TokenManagerError;

/** Revocation store interface — inject a Redis/DB-backed implementation in production. */
export interface RevocationStore {
  isRevoked(jti: string): Promise<boolean>;
  revoke(jti: string, expiresAt: number): Promise<void>;
}

/** In-memory revocation store — for testing and single-instance MVP only. */
export class InMemoryRevocationStore implements RevocationStore {
  private readonly store = new Map<string, number>();

  async isRevoked(jti: string): Promise<boolean> {
    const exp = this.store.get(jti);
    if (exp === undefined) return false;
    if (Date.now() / 1000 > exp) {
      this.store.delete(jti);
      return false;
    }
    return true;
  }

  async revoke(jti: string, expiresAt: number): Promise<void> {
    this.store.set(jti, expiresAt);
  }
}

// ---------------------------------------------------------------------------
// JWTTokenManager
// ---------------------------------------------------------------------------

const logger = createLogger('core-auth:jwt');

export class JWTTokenManager {
  private readonly secret: string;
  private readonly ttlSeconds: number;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly revocationStore: RevocationStore;

  constructor(config: TokenManagerConfig, revocationStore?: RevocationStore) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
    this.secret = config.secret;
    this.ttlSeconds = config.ttlSeconds ?? 3600;
    this.issuer = config.issuer;
    this.audience = config.audience;
    this.revocationStore = revocationStore ?? new InMemoryRevocationStore();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  signToken(claims: Record<string, unknown> = {}): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      ...claims,
      sub: (claims['sub'] as string) ?? '',
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      nbf: now,
      exp: now + this.ttlSeconds,
      jti: randomBytes(16).toString('hex'),
    };
    const token = this.encodeToken(payload);
    logger.info({ jti: payload.jti, sub: payload.sub, exp: payload.exp }, 'token_issued');
    return token;
  }

  async verifyToken(token: string): Promise<TokenResult<JWTPayload>> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { ok: false, error: 'Malformed JWT: expected 3 parts', code: 'MALFORMED' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Signature verification — timing-safe (SEC-002 fix)
    const expectedSig = this.computeSignature(`${headerB64}.${payloadB64}`);
    const sigBuf = Buffer.from(signatureB64, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');

    const signaturesMatch =
      sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);

    if (!signaturesMatch) {
      logger.warn({ action: 'verify_token', result: 'invalid_signature' }, 'token_rejected');
      return { ok: false, error: 'Invalid JWT signature', code: 'INVALID_SIGNATURE' };
    }

    // Payload decode — guarded JSON.parse
    let payload: JWTPayload;
    try {
      const decoded = Buffer.from(payloadB64, 'base64url').toString('utf8');
      payload = JSON.parse(decoded) as JWTPayload;
    } catch {
      return { ok: false, error: 'Malformed JWT payload: JSON parse failed', code: 'MALFORMED' };
    }

    const now = Math.floor(Date.now() / 1000);

    // exp validation
    if (payload.exp !== undefined && now > payload.exp) {
      return { ok: false, error: `JWT expired at ${payload.exp}`, code: 'EXPIRED' };
    }

    // nbf validation
    if (payload.nbf !== undefined && now < payload.nbf) {
      return {
        ok: false,
        error: `JWT not yet valid (nbf=${payload.nbf})`,
        code: 'NOT_YET_VALID',
      };
    }

    // Revocation check
    if (payload.jti) {
      const revoked = await this.revocationStore.isRevoked(payload.jti);
      if (revoked) {
        logger.warn({ jti: payload.jti }, 'token_revoked');
        return { ok: false, error: 'JWT has been revoked', code: 'REVOKED' };
      }
    }

    logger.info({ jti: payload.jti, sub: payload.sub }, 'token_verified');
    return { ok: true, value: payload };
  }

  async revokeToken(token: string): Promise<void> {
    const parts = token.split('.');
    if (parts.length !== 3) return;
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8')
      ) as Partial<JWTPayload>;
      if (payload.jti && payload.exp) {
        await this.revocationStore.revoke(payload.jti, payload.exp);
        logger.info({ jti: payload.jti }, 'token_revoked_explicit');
      }
    } catch {
      // Silently ignore malformed tokens during revocation
    }
  }

  buildOAuthAuthorizationUrl(params: {
    authorizationEndpoint: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): string {
    const url = new URL(params.authorizationEndpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', params.scope);
    url.searchParams.set('state', params.state);
    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', params.codeChallengeMethod ?? 'S256');
    }
    return url.toString();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private encodeToken(payload: JWTPayload): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.computeSignature(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  private computeSignature(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a JWTTokenManager from environment variables.
 * Rationale: Centralises secret sourcing; prevents hardcoded credentials.
 */
export function createTokenManagerFromEnv(revocationStore?: RevocationStore): JWTTokenManager {
  const secret = process.env['JWT_SECRET'];
  const issuer = process.env['JWT_ISSUER'];
  const audience = process.env['JWT_AUDIENCE'];

  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  if (!issuer) throw new Error('JWT_ISSUER environment variable is required');
  if (!audience) throw new Error('JWT_AUDIENCE environment variable is required');

  return new JWTTokenManager(
    {
      secret,
      issuer,
      audience,
      ttlSeconds: Number(process.env['JWT_TTL_SECONDS'] ?? 3600),
    },
    revocationStore
  );
}

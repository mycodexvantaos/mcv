/**
 * MyCodexVantaOS Core Auth Service
 *
 * Service ID: mycodexvantaos-core-auth
 * Foundation: Governance Foundation
 * Capability: Authentication, authorization, JWT, OAuth
 *
 * Production OAuth redirect URIs MUST use https://mycodexvantaos.com
 * Machine Identity: mycodexvantaos
 */

import { createHmac, randomBytes } from "node:crypto";

export const SERVICE_ID = "mycodexvantaos-core-auth";
export const SERVICE_VERSION = "1.0.0";

// Production OAuth callback URLs — MUST use canonical domain
export const PRODUCTION_OAUTH_CALLBACKS = {
  github: "https://mycodexvantaos.com/api/auth/callback/github",
  google: "https://mycodexvantaos.com/api/auth/callback/google",
  microsoft: "https://mycodexvantaos.com/api/auth/callback/microsoft",
  slack: "https://mycodexvantaos.com/api/auth/callback/slack",
} as const;

export type OAuthProvider = keyof typeof PRODUCTION_OAUTH_CALLBACKS;
export type UserRole = "admin" | "developer" | "viewer" | "billing" | "governance";

export interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  roles: UserRole[];
  workspaceId: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string[];
}

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  workspaceId: string;
  provider: OAuthProvider | "local";
  createdAt: Date;
  lastLoginAt: Date;
}

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * JWT Token Manager
 * Issues and validates JWT tokens for the MyCodexVantaOS platform.
 */
export class JWTTokenManager {
  private readonly issuer = "https://mycodexvantaos.com";
  private readonly audience = "https://api.mycodexvantaos.com";
  private readonly accessTokenTtl = 3600; // 1 hour
  private readonly refreshTokenTtl = 86400 * 30; // 30 days

  constructor(private readonly secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters");
    }
  }

  /**
   * Issue an access token for a user.
   */
  issueAccessToken(user: AuthUser): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: user.userId,
      iss: this.issuer,
      aud: this.audience,
      exp: now + this.accessTokenTtl,
      iat: now,
      jti: randomBytes(16).toString("hex"),
      roles: user.roles,
      workspaceId: user.workspaceId,
    };

    return this.signJwt(payload);
  }

  /**
   * Issue a refresh token for a user.
   */
  issueRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: userId,
      iss: this.issuer,
      type: "refresh",
      exp: now + this.refreshTokenTtl,
      iat: now,
      jti: randomBytes(16).toString("hex"),
    };

    return this.signJwt(payload);
  }

  /**
   * Verify and decode a JWT token.
   */
  verifyToken(token: string): JWTPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = this.computeSignature(`${headerB64}.${payloadB64}`);

    if (signatureB64 !== expectedSignature) {
      throw new Error("Invalid JWT signature");
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      throw new Error("JWT token has expired");
    }

    if (payload.iss !== this.issuer) {
      throw new Error(`Invalid JWT issuer: ${payload.iss}`);
    }

    if (payload.aud !== this.audience) {
      throw new Error(`Invalid JWT audience: ${payload.aud}`);
    }

    return payload;
  }

  private signJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.computeSignature(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  private computeSignature(data: string): string {
    return createHmac("sha256", this.secret).update(data).digest("base64url");
  }
}

/**
 * OAuth URL Builder
 * Builds OAuth authorization URLs with production-safe redirect URIs.
 */
export class OAuthUrlBuilder {
  /**
   * Get the OAuth callback URL for a provider.
   * MUST use production canonical domain in production.
   */
  getCallbackUrl(provider: OAuthProvider, env: string = "production"): string {
    if (env === "production") {
      return PRODUCTION_OAUTH_CALLBACKS[provider];
    }
    if (env === "staging") {
      return `https://staging.mycodexvantaos.com/api/auth/callback/${provider}`;
    }
    return `http://localhost:3000/api/auth/callback/${provider}`;
  }

  /**
   * Build GitHub OAuth authorization URL.
   */
  buildGitHubAuthUrl(config: { clientId: string; state: string; env?: string }): string {
    const callbackUrl = this.getCallbackUrl("github", config.env);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      scope: "user:email read:org",
      state: config.state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  /**
   * Build Google OAuth authorization URL.
   */
  buildGoogleAuthUrl(config: { clientId: string; state: string; env?: string }): string {
    const callbackUrl = this.getCallbackUrl("google", config.env);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state: config.state,
      access_type: "offline",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
}

export const oauthUrlBuilder = new OAuthUrlBuilder();

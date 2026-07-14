/**
 * MyCodexVantaOS — Auth Port
 * Abstracts authentication, authorization, and identity verification.
 *
 * This port is the gatekeeper: every request must pass through auth
 * before reaching any service logic.
 *
 * Implementations: JWT-based, OAuth2, Cloudflare Access, etc.
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Auth Port Interface ────────────────────────────────────────────────

export interface IAuthPort {
  /** Validate an access token and return claims */
  validateToken(accessToken: string): Promise<TokenClaims>;

  /** Check if a subject has a specific permission in a workspace */
  checkPermission(
    subjectId: string,
    workspaceId: string,
    action: string,
    resourceKind: string
  ): Promise<boolean>;

  /** Get subject details */
  getSubject(subjectId: string): Promise<SubjectInfo>;

  /** Resolve role for a subject in a workspace */
  resolveRole(subjectId: string, workspaceId: string): Promise<Role>;

  /** Create a new session for a subject */
  createSession(subjectId: string, workspaceId: string): Promise<SessionInfo>;

  /** Revoke a session */
  revokeSession(sessionId: string): Promise<void>;
}

// ── Token Types ────────────────────────────────────────────────────────

export interface TokenClaims {
  subjectId: string;
  workspaceId?: string;
  role?: Role;
  scopes: string[];
  iat: number;
  exp: number;
  sid: string; // session ID
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// ── Identity Types ─────────────────────────────────────────────────────

export type Role =
  | 'platform-admin'
  | 'workspace-owner'
  | 'workspace-member'
  | 'workspace-viewer'
  | 'agent-service'
  | 'auditor';

export type CredentialType = 'password' | 'oauth' | 'mfa-totp' | 'mfa-webauthn' | 'api-key';

export interface CredentialRef {
  id: string;
  type: CredentialType;
  createdAt: string;
}

export interface SubjectInfo {
  id: string;
  email: string;
  displayName: string;
  mfaEnabled: boolean;
  status: 'active' | 'suspended' | 'deactivated';
  roles: Record<string, Role>; // workspaceId → role
}

export interface SessionInfo {
  sessionId: string;
  subjectId: string;
  workspaceId: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
}

// ── Permission Types ───────────────────────────────────────────────────

export interface PermissionCheck {
  subjectId: string;
  workspaceId: string;
  action: string;
  resourceKind: string;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  matchedPolicies?: string[];
}

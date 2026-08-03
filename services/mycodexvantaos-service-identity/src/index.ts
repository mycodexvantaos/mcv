/**
 * @mycodexvantaos/service-identity
 * Identity Service Runtime — platform-wide identity, authentication, and authorization.
 *
 * Level 0 service: zero hard dependencies on other services. This is the root of the
 * dependency graph. Every higher-level service (workspace, knowledge, etc.) depends on
 * the IIdentityPort exposed here.
 *
 * MVP (Sprint 1): In-memory Native mode storage with SHA-256 hash-chained audit.
 *   - Password hashing: Web Crypto API PBKDF2 (Cloudflare Workers compatible)
 *   - Token signing:   Web Crypto API HMAC-SHA256 (Cloudflare Workers compatible)
 *   - Storage:         in-memory Map (Local-first invariant; no external DB)
 * Production: Cloudflare Workers + D1 (database) + KV (cache) via Provider adapter.
 *
 * Contract source: contracts/service-definitions/identity.yaml
 * Resource model:  contracts/resource-kinds/user.yaml
 *
 * Architecture invariants:
 *   - Local-first:        in-memory is the default; no network calls to boot
 *   - Provider-agnostic:  no SDK coupling; Cloudflare/Node runtimes interchangeable
 *   - Contract-first:     every capability maps 1:1 to a contract entry
 *   - Governance-enforced: all actions audit-logged with integrity chain
 */

// ─────────────────────────────────────────────────────────────────────────────
// Contract-derived constants (mirror contracts/service-definitions/identity.yaml)
// Kept inline to preserve the zero-dependency (Level 0) invariant — the service
// does NOT import @mycodexvantaos/contracts-sdk at runtime. These constants are
// documented against the contract and must be updated in lock-step with it.
// ─────────────────────────────────────────────────────────────────────────────

/** All capabilities declared in identity.yaml, in canonical order. */
export const IDENTITY_CAPABILITIES = [
  'auth.register',
  'auth.authenticate',
  'auth.validate-token',
  'auth.revoke-session',
  'auth.check-permission',
  'auth.resolve-role',
  'auth.get-subject',
] as const;

/** Events emitted by the Identity Service (identity.yaml → spec.events.emitted). */
export const IDENTITY_EVENTS = {
  SUBJECT_REGISTERED: 'identity.subject.registered',
  SUBJECT_AUTHENTICATED: 'identity.subject.authenticated',
  SUBJECT_AUTHENTICATION_FAILED: 'identity.subject.authentication-failed',
  SESSION_CREATED: 'identity.session.created',
  SESSION_REVOKED: 'identity.session.revoked',
} as const;

/** Role enum (identity.yaml → auth.resolve-role output + user.yaml permissions). */
export const IDENTITY_ROLES = [
  'platform-admin',
  'workspace-owner',
  'workspace-member',
  'workspace-viewer',
  'agent-service',
  'auditor',
] as const;

/** Subject lifecycle states (user.yaml → lifecycle). */
export const SUBJECT_LIFECYCLE = [
  'creating',
  'active',
  'updating',
  'degraded',
  'suspended',
  'deleting',
  'deleted',
] as const;

/** Default token expiry in seconds (15 minutes). */
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
/** Default refresh token expiry in seconds (7 days). */
export const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// ─────────────────────────────────────────────────────────────────────────────
// Types — aligned with contracts/resource-kinds/user.yaml + identity.yaml
// ─────────────────────────────────────────────────────────────────────────────

/** Role a subject may hold (RBAC). */
export type IdentityRole = (typeof IDENTITY_ROLES)[number];

/** Subject lifecycle state machine (user.yaml lifecycle). */
export type SubjectStatus = (typeof SUBJECT_LIFECYCLE)[number];

/**
 * IdentitySubject — the core resource managed by this service.
 * Mirrors contracts/resource-kinds/user.yaml metadata_schema + spec_schema.
 * Sensitive credential material (password hash + salt) is intentionally NOT
 * exposed via this type; it lives only in internal storage.
 */
export interface IdentitySubject {
  id: string;
  urn: string;
  email: string;
  displayName: string;
  role: IdentityRole;
  status: SubjectStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** Workspace-scoped role overrides: workspaceId → role. */
  workspaceRoles: Record<string, IdentityRole>;
}

/**
 * Internal credential record — never exported. Holds the PBKDF2 hash + salt +
 * iteration count used to verify a password without storing the plaintext.
 */
interface CredentialRecord {
  subjectId: string;
  hash: string; // hex-encoded PBKDF2 digest
  salt: string; // hex-encoded salt
  iterations: number;
  algorithm: 'PBKDF2-SHA256';
  createdAt: string;
}

/**
 * Session — an active authentication session. A subject may have many sessions.
 * The access/refresh tokens reference the sessionId for revocation.
 */
export interface Session {
  sessionId: string;
  subjectId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  refreshTokenId: string;
  /** Workspace context the session was issued for, if any. */
  workspaceId: string | null;
}

/**
 * TokenClaims — the decoded payload of a valid access token.
 * Returned by auth.validate-token. Maps to urn:mycodexvantaos:core:type:TokenClaims.
 */
export interface TokenClaims {
  subjectId: string;
  email: string;
  role: IdentityRole;
  workspaceId: string | null;
  sessionId: string;
  issuedAt: number; // unix seconds
  expiresAt: number; // unix seconds
}

/**
 * PolicyDecision — the result of an authorization check.
 * Maps to urn:mycodexvantaos:core:type:PolicyDecision.
 */
export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  subjectId: string;
  action: string;
  resourceUrn: string;
  workspaceId: string | null;
  resolvedRole: IdentityRole | null;
}

/** A signed access + refresh token pair issued on register/authenticate. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until accessToken expires
}

/** A single entry in the tamper-evident audit chain (SHA-256 hash-chain). */
export interface AuditEntry {
  entryId: string;
  action: string; // capability id or internal action
  actorId: string;
  subjectId: string | null;
  timestamp: string;
  data: Record<string, unknown>;
  hash: string;
  previousHash: string;
  chainIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Port interfaces — Contract-first. IIdentityPort mirrors identity.yaml ports[0].
// IEventBusPort is a minimal publish-only seam reserved for Sprint 3 integration.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IIdentityPort — the contract surface other services depend on.
 * Source: contracts/service-definitions/identity.yaml → spec.ports[0]
 *   interface: IIdentityPort
 *   methods: [validateToken, checkPermission, getSubject, resolveRole]
 *
 * Sprint 4's Workspace service hard-depends on this port.
 */
export interface IIdentityPort {
  validateToken(accessToken: string): Promise<TokenClaims>;
  checkPermission(
    subjectId: string,
    action: string,
    resourceUrn: string,
    workspaceId?: string | null,
  ): Promise<PolicyDecision>;
  getSubject(subjectId: string): Promise<IdentitySubject | null>;
  resolveRole(subjectId: string, workspaceId: string): Promise<IdentityRole>;
}

/**
 * IEventBusPort — minimal publish-only seam. The Identity Service emits 5 events
 * (IDENTITY_EVENTS.*) through this port when wired. In Sprint 1 the port defaults
 * to a no-op emitter; Sprint 3 will inject the real in-memory EventBus / Provider.
 */
export interface IEventBusPort {
  publish(event: {
    type: string;
    payload: Record<string, unknown>;
    source: string;
  }): Promise<void>;
}

/** Internal event payload shape emitted by the service. */
export interface EmittedEvent {
  type: string;
  payload: Record<string, unknown>;
  source: 'identity-service';
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response types for each capability
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  metadata?: Record<string, unknown>;
  role?: IdentityRole;
}

export interface RegisterResponse {
  subject: IdentitySubject;
  tokenPair: TokenPair;
}

export interface AuthenticateRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthenticateResponse {
  tokenPair: TokenPair;
  subjectId: string;
}

export interface ValidateTokenRequest {
  accessToken: string;
}

export interface RevokeSessionRequest {
  sessionId: string;
}

export interface RevokeSessionResponse {
  revoked: boolean;
}

export interface CheckPermissionRequest {
  subjectId: string;
  action: string;
  resourceUrn: string;
  workspaceId?: string;
}

export interface ResolveRoleRequest {
  subjectId: string;
  workspaceId: string;
}

export interface GetSubjectRequest {
  subjectId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory storage — Local-first, zero external dependencies.
// Module-level state mirrors the service-audit-log pattern. A `reset()` helper
// is provided for deterministic unit testing.
// ─────────────────────────────────────────────────────────────────────────────

const subjects = new Map<string, IdentitySubject>();
const credentials = new Map<string, CredentialRecord>();
const sessions = new Map<string, Session>();
const auditChain: AuditEntry[] = [];
let chainIndex = 0;
let lastHash =
  '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Pluggable event bus port. Defaults to a no-op emitter so the service boots
 * with zero wiring. Sprint 3 will inject a real IEventBusPort implementation.
 */
let eventBus: IEventBusPort = {
  async publish() {
    /* no-op until wired by the runtime */
  },
};

/** HMAC signing key for tokens. In production this comes from a secret manager. */
let tokenSigningKey = 'identity-service-dev-signing-key-do-not-use-in-prod';

/**
 * Internal accessor for the token signing key. Used by the HMAC-SHA256 token
 * signing/verification helpers (Story 1B-S2). Exported for testability.
 */
export function _getSigningKey(): string {
  return tokenSigningKey;
}

/**
 * Configure the service at runtime.
 * - setEventBus: inject an IEventBusPort (Sprint 3 integration point)
 * - setSigningKey: inject a token signing secret (production secret manager)
 */
export function configure(opts: {
  eventBus?: IEventBusPort;
  signingKey?: string;
}): void {
  if (opts.eventBus) {
    eventBus = opts.eventBus;
  }
  if (opts.signingKey) {
    tokenSigningKey = opts.signingKey;
  }
}

/**
 * Reset all in-memory state. Intended for unit tests only.
 */
export function reset(): void {
  subjects.clear();
  credentials.clear();
  sessions.clear();
  auditChain.length = 0;
  chainIndex = 0;
  lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  eventBus = {
    async publish() {
      /* no-op */
    },
  };
  tokenSigningKey = 'identity-service-dev-signing-key-do-not-use-in-prod';
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit hash-chain helpers (mirrors service-audit-log SHA-256 pattern)
// Uses node:crypto via ESM import for the hash-chain (audit integrity is a
// server-side concern; the Web Crypto requirement applies to password/token
// operations that must run on Cloudflare Workers).
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Append a tamper-evident audit entry to the in-memory hash-chain.
 */
function appendAudit(
  action: string,
  actorId: string,
  subjectId: string | null,
  data: Record<string, unknown>,
): AuditEntry {
  const entryId = generateId('aud');
  const timestamp = new Date().toISOString();
  const idx = chainIndex++;
  const previousHash = lastHash;
  const payload = JSON.stringify({
    entryId,
    action,
    actorId,
    subjectId,
    timestamp,
    previousHash,
    chainIndex: idx,
  });
  const hash = createHash('sha256').update(payload).digest('hex');
  const entry: AuditEntry = {
    entryId,
    action,
    actorId,
    subjectId,
    timestamp,
    data,
    hash,
    previousHash,
    chainIndex: idx,
  };
  auditChain.push(entry);
  lastHash = hash;
  return entry;
}

/**
 * Verify the integrity of the audit chain. Returns the number of chain breaks.
 */
export function verifyAuditIntegrity(): {
  valid: boolean;
  chainBreaks: number;
  totalEntries: number;
} {
  if (auditChain.length === 0) {
    return { valid: true, chainBreaks: 0, totalEntries: 0 };
  }
  let chainBreaks = 0;
  for (let i = 0; i < auditChain.length; i++) {
    const entry = auditChain[i];
    if (entry.chainIndex !== i) {
      chainBreaks++;
      continue;
    }
    const expectedPrev =
      i === 0
        ? '0000000000000000000000000000000000000000000000000000000000000000'
        : auditChain[i - 1].hash;
    if (entry.previousHash !== expectedPrev) {
      chainBreaks++;
    }
    const payload = JSON.stringify({
      entryId: entry.entryId,
      action: entry.action,
      actorId: entry.actorId,
      subjectId: entry.subjectId,
      timestamp: entry.timestamp,
      previousHash: entry.previousHash,
      chainIndex: entry.chainIndex,
    });
    const expectedHash = createHash('sha256').update(payload).digest('hex');
    if (entry.hash !== expectedHash) {
      chainBreaks++;
    }
  }
  return {
    valid: chainBreaks === 0,
    chainBreaks,
    totalEntries: auditChain.length,
  };
}

/** Return a copy of the audit chain (read-only inspection). */
export function getAuditChain(): AuditEntry[] {
  return [...auditChain];
}

/**
 * Internal audit helper — exported so capability implementations (Story 1B-S2/S3)
 * and tests can append entries. Not part of the public IIdentityPort surface.
 */
export const _appendAuditEntry = appendAudit;

// ─────────────────────────────────────────────────────────────────────────────
// Event emission helper — routes through the pluggable IEventBusPort.
// Exported as an internal helper so capability implementations (Story 1B-S2/S3)
// and tests can emit events without duplicating the routing logic.
// ─────────────────────────────────────────────────────────────────────────────

export async function emitEvent(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const event: EmittedEvent = {
    type,
    payload,
    source: 'identity-service',
  };
  await eventBus.publish(event);
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Crypto API helpers — PBKDF2 password hashing + HMAC-SHA256 token signing.
// Using the global Web Crypto API (crypto.subtle) ensures Cloudflare Workers
// compatibility. These are implemented in Story 1B-S2; stubs throw here.
// ─────────────────────────────────────────────────────────────────────────────

class NotImplementedError extends Error {
  constructor(capability: string) {
    super(`Capability '${capability}' is not implemented yet (Story 1B-S2/S3)`);
    this.name = 'NotImplementedError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.register (1B-05) — implemented in Story 1B-S2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a new identity subject.
 * Contract: identity.yaml → capabilities[0] auth.register
 */
export async function registerSubject(
  req: RegisterRequest,
): Promise<RegisterResponse> {
  void req;
  throw new NotImplementedError('auth.register');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.authenticate (1B-06) — implemented in Story 1B-S2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate a subject and issue a token pair.
 * Contract: identity.yaml → capabilities[1] auth.authenticate
 */
export async function authenticateSubject(
  req: AuthenticateRequest,
): Promise<AuthenticateResponse> {
  void req;
  throw new NotImplementedError('auth.authenticate');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.validate-token (1B-07) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an access token and return its claims.
 * Contract: identity.yaml → capabilities[2] auth.validate-token
 * Port:     IIdentityPort.validateToken
 */
export async function validateToken(
  accessToken: string,
): Promise<TokenClaims> {
  void accessToken;
  throw new NotImplementedError('auth.validate-token');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.revoke-session (1B-08) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revoke a session by session ID.
 * Contract: identity.yaml → capabilities[3] auth.revoke-session
 */
export async function revokeSession(
  sessionId: string,
): Promise<RevokeSessionResponse> {
  void sessionId;
  throw new NotImplementedError('auth.revoke-session');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.check-permission (1B-09) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a subject may perform an action on a resource (RBAC).
 * Contract: identity.yaml → capabilities[4] auth.check-permission
 * Port:     IIdentityPort.checkPermission
 */
export async function checkPermission(
  req: CheckPermissionRequest,
): Promise<PolicyDecision> {
  void req;
  throw new NotImplementedError('auth.check-permission');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.resolve-role (1B-10) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the effective role for a subject within a workspace.
 * Contract: identity.yaml → capabilities[5] auth.resolve-role
 * Port:     IIdentityPort.resolveRole
 */
export async function resolveRole(
  subjectId: string,
  workspaceId: string,
): Promise<IdentityRole> {
  void subjectId;
  void workspaceId;
  throw new NotImplementedError('auth.resolve-role');
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.get-subject (1B-11) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get subject details by ID. Does NOT return credential material.
 * Contract: identity.yaml → capabilities[6] auth.get-subject
 * Port:     IIdentityPort.getSubject
 */
export async function getSubject(
  subjectId: string,
): Promise<IdentitySubject | null> {
  void subjectId;
  throw new NotImplementedError('auth.get-subject');
}

// ─────────────────────────────────────────────────────────────────────────────
// Subject lifecycle state machine (1B-12) — implemented in Story 1B-S3
// ─────────────────────────────────────────────────────────────────────────────

/** Valid forward transitions per user.yaml lifecycle ordering. */
const VALID_TRANSITIONS: Record<SubjectStatus, SubjectStatus[]> = {
  creating: ['active', 'deleting'],
  active: ['updating', 'degraded', 'suspended', 'deleting'],
  updating: ['active', 'degraded', 'suspended', 'deleting'],
  degraded: ['active', 'suspended', 'deleting'],
  suspended: ['active', 'deleting'],
  deleting: ['deleted'],
  deleted: [],
};

/**
 * Transition a subject's lifecycle status. Throws on invalid transitions.
 * Contract: contracts/resource-kinds/user.yaml → lifecycle
 */
export async function transitionSubjectStatus(
  subjectId: string,
  target: SubjectStatus,
): Promise<IdentitySubject> {
  void subjectId;
  void target;
  void VALID_TRANSITIONS;
  throw new NotImplementedError('subject-lifecycle-transition');
}

// ─────────────────────────────────────────────────────────────────────────────
// IIdentityPort adapter — exposes the 4 port methods as a single object so
// downstream services (e.g. Sprint 4 Workspace) can depend on a stable seam.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The IIdentityPort implementation, backed by the capability functions above.
 * Downstream services import `identityPort` and program against IIdentityPort.
 */
export const identityPort: IIdentityPort = {
  validateToken,
  checkPermission: (subjectId, action, resourceUrn, workspaceId) =>
    checkPermission({
      subjectId,
      action,
      resourceUrn,
      workspaceId: workspaceId ?? undefined,
    }),
  getSubject,
  resolveRole,
};

// ─────────────────────────────────────────────────────────────────────────────
// Introspection — exposes loaded contract metadata for diagnostics / tests.
// ─────────────────────────────────────────────────────────────────────────────

/** Return the list of capability ids this service implements. */
export function getCapabilities(): readonly string[] {
  return IDENTITY_CAPABILITIES;
}

/** Return the list of events this service may emit. */
export function getEmittedEvents(): readonly string[] {
  return Object.values(IDENTITY_EVENTS);
}

/** Return the current in-memory subject count (diagnostics / tests). */
export function getSubjectCount(): number {
  return subjects.size;
}

/** Return the current in-memory session count (diagnostics / tests). */
export function getSessionCount(): number {
  return sessions.size;
}

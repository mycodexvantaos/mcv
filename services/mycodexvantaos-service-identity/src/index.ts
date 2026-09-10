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
// compatibility. No Node.js-specific crypto module is used for these operations.
// ─────────────────────────────────────────────────────────────────────────────

/** PBKDF2 iteration count (OWASP 2023 recommendation ≥ 600,000 for PBKDF2-SHA256). */
const PBKDF2_ITERATIONS = 600_000;
/** Salt length in bytes (NIST SP 800-132 recommends ≥ 16 bytes). */
const SALT_BYTES = 16;
/** PBKDF2 derived key length in bits. */
const PBKDF2_KEY_BITS = 256;

/** Hex encoding/decoding helpers (works in both Node and Workers). */
function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Base64 URL encoding (no padding) — for token payloads/signatures. */
function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const b of view) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2-SHA256 via the Web Crypto API.
 * Returns { hash, salt, iterations } all hex-encoded.
 */
async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PBKDF2_KEY_BITS,
  );
  return {
    hash: toHex(derivedBits),
    salt: toHex(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Verify a password against a stored PBKDF2 hash + salt.
 * Constant-time comparison via timing-safe equal on equal-length buffers.
 */
async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  iterations: number,
): Promise<boolean> {
  const salt = fromHex(storedSalt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    PBKDF2_KEY_BITS,
  );
  const computed = toHex(derivedBits);
  if (computed.length !== storedHash.length) {
    return false;
  }
  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Sign a token payload using HMAC-SHA256 via the Web Crypto API.
 * Returns a compact JWT-like string: base64url(payload).base64url(signature).
 */
async function signToken(
  payload: TokenClaims & { type: 'access' | 'refresh' },
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(_getSigningKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payloadB64 = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64),
  );
  return `${payloadB64}.${toBase64Url(signature)}`;
}

/**
 * Verify a token's signature and return its decoded payload, or null if
 * the signature is invalid. Expiry is checked by the caller (validateToken).
 * Exported so Story 1B-S3's validateToken can reuse it.
 */
export async function verifyTokenSignature(
  token: string,
): Promise<(TokenClaims & { type: 'access' | 'refresh' }) | null> {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [payloadB64, signatureB64] = parts;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(_getSigningKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signatureB64),
    new TextEncoder().encode(payloadB64),
  );
  if (!valid) {
    return null;
  }
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64)),
    ) as TokenClaims & { type: 'access' | 'refresh' };
    return payload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: create a session + token pair for a subject.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a new session with access + refresh tokens for a subject.
 * Records the session, appends an audit entry, and emits session.created.
 */
async function issueSession(
  subject: IdentitySubject,
  workspaceId: string | null,
): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = generateId('ses');
  const refreshTokenId = generateId('rft');
  const accessExpiresAt = now + DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  const refreshExpiresAt = now + DEFAULT_REFRESH_TOKEN_TTL_SECONDS;

  const baseClaims = {
    subjectId: subject.id,
    email: subject.email,
    role: subject.role,
    workspaceId,
    sessionId,
    issuedAt: now,
  };

  const accessToken = await signToken({
    ...baseClaims,
    expiresAt: accessExpiresAt,
    type: 'access',
  });
  const refreshToken = await signToken({
    ...baseClaims,
    expiresAt: refreshExpiresAt,
    type: 'refresh',
  });

  const session: Session = {
    sessionId,
    subjectId: subject.id,
    createdAt: new Date(now * 1000).toISOString(),
    expiresAt: new Date(refreshExpiresAt * 1000).toISOString(),
    revokedAt: null,
    refreshTokenId,
    workspaceId,
  };
  sessions.set(sessionId, session);

  _appendAuditEntry(
    'auth.session-created',
    subject.id,
    subject.id,
    { sessionId, workspaceId, accessExpiresAt },
  );

  await emitEvent(IDENTITY_EVENTS.SESSION_CREATED, {
    subjectId: subject.id,
    sessionId,
    workspaceId,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.register (1B-05)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a new identity subject.
 * Contract: identity.yaml → capabilities[0] auth.register
 *
 * Flow:
 *   1. Validate email format + password length (≥ 8) + display name.
 *   2. Reject duplicate email.
 *   3. Hash password with PBKDF2-SHA256 (Web Crypto API).
 *   4. Create subject in 'creating' → 'active' lifecycle.
 *   5. Issue session + token pair.
 *   6. Audit-log + emit identity.subject.registered.
 */
export async function registerSubject(
  req: RegisterRequest,
): Promise<RegisterResponse> {
  // Validate inputs
  if (!req.email || !req.email.includes('@')) {
    throw new Error('auth.register: invalid email');
  }
  if (!req.password || req.password.length < 8) {
    throw new Error('auth.register: password must be at least 8 characters');
  }
  if (!req.displayName || req.displayName.length < 1) {
    throw new Error('auth.register: displayName is required');
  }
  if (req.displayName.length > 128) {
    throw new Error('auth.register: displayName must be ≤ 128 characters');
  }

  // Check for duplicate email (case-insensitive)
  const emailLower = req.email.toLowerCase();
  for (const subject of subjects.values()) {
    if (subject.email.toLowerCase() === emailLower) {
      throw new Error('auth.register: email already registered');
    }
  }

  // Hash password
  const { hash, salt, iterations } = await hashPassword(req.password);

  // Create subject
  const subjectId = generateId('sub');
  const now = new Date().toISOString();
  const role: IdentityRole = req.role ?? 'workspace-viewer';
  const subject: IdentitySubject = {
    id: subjectId,
    urn: `urn:mycodexvantaos:core:resource:identity-subject:${subjectId}`,
    email: req.email,
    displayName: req.displayName,
    role,
    status: 'creating',
    metadata: req.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    workspaceRoles: {},
  };
  subjects.set(subjectId, subject);

  // Store credential
  const credential: CredentialRecord = {
    subjectId,
    hash,
    salt,
    iterations,
    algorithm: 'PBKDF2-SHA256',
    createdAt: now,
  };
  credentials.set(subjectId, credential);

  // Transition creating → active
  subject.status = 'active';
  subject.updatedAt = new Date().toISOString();

  // Audit + emit
  _appendAuditEntry('auth.register', subjectId, subjectId, {
    email: req.email,
    displayName: req.displayName,
    role,
  });
  await emitEvent(IDENTITY_EVENTS.SUBJECT_REGISTERED, {
    subjectId,
    email: req.email,
    displayName: req.displayName,
    role,
  });

  // Issue session + token pair
  const tokenPair = await issueSession(subject, null);

  return { subject, tokenPair };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.authenticate (1B-06)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate a subject and issue a token pair.
 * Contract: identity.yaml → capabilities[1] auth.authenticate
 *
 * Flow:
 *   1. Look up subject by email (case-insensitive).
 *   2. Verify password against stored PBKDF2 hash.
 *   3. Reject if subject not found, password wrong, or status not active.
 *   4. Issue session + token pair.
 *   5. Audit-log + emit identity.subject.authenticated or authentication-failed.
 */
export async function authenticateSubject(
  req: AuthenticateRequest,
): Promise<AuthenticateResponse> {
  if (!req.email || !req.password) {
    throw new Error('auth.authenticate: email and password are required');
  }

  // Look up subject by email (case-insensitive)
  const emailLower = req.email.toLowerCase();
  let subject: IdentitySubject | undefined;
  for (const s of subjects.values()) {
    if (s.email.toLowerCase() === emailLower) {
      subject = s;
      break;
    }
  }

  // Subject not found → emit auth-failed (do not leak existence)
  if (!subject) {
    _appendAuditEntry(
      'auth.authenticate-failed',
      'unknown',
      null,
      { email: req.email, reason: 'subject-not-found' },
    );
    await emitEvent(IDENTITY_EVENTS.SUBJECT_AUTHENTICATION_FAILED, {
      email: req.email,
      reason: 'subject-not-found',
    });
    throw new Error('auth.authenticate: invalid credentials');
  }

  // Verify password
  const credential = credentials.get(subject.id);
  if (!credential) {
    _appendAuditEntry(
      'auth.authenticate-failed',
      subject.id,
      subject.id,
      { email: req.email, reason: 'missing-credential' },
    );
    await emitEvent(IDENTITY_EVENTS.SUBJECT_AUTHENTICATION_FAILED, {
      subjectId: subject.id,
      email: req.email,
      reason: 'missing-credential',
    });
    throw new Error('auth.authenticate: invalid credentials');
  }

  const passwordValid = await verifyPassword(
    req.password,
    credential.hash,
    credential.salt,
    credential.iterations,
  );

  if (!passwordValid) {
    _appendAuditEntry(
      'auth.authenticate-failed',
      subject.id,
      subject.id,
      { email: req.email, reason: 'wrong-password' },
    );
    await emitEvent(IDENTITY_EVENTS.SUBJECT_AUTHENTICATION_FAILED, {
      subjectId: subject.id,
      email: req.email,
      reason: 'wrong-password',
    });
    throw new Error('auth.authenticate: invalid credentials');
  }

  // Check subject is in an active-like state
  if (subject.status !== 'active' && subject.status !== 'updating') {
    _appendAuditEntry(
      'auth.authenticate-failed',
      subject.id,
      subject.id,
      { email: req.email, reason: `status-${subject.status}` },
    );
    await emitEvent(IDENTITY_EVENTS.SUBJECT_AUTHENTICATION_FAILED, {
      subjectId: subject.id,
      email: req.email,
      reason: `status-${subject.status}`,
    });
    throw new Error(`auth.authenticate: subject status is '${subject.status}'`);
  }

  // Success → issue session + token pair
  const tokenPair = await issueSession(subject, null);

  _appendAuditEntry('auth.authenticate', subject.id, subject.id, {
    email: req.email,
    sessionId: tokenPair.accessToken,
  });
  await emitEvent(IDENTITY_EVENTS.SUBJECT_AUTHENTICATED, {
    subjectId: subject.id,
    email: req.email,
  });

  return { tokenPair, subjectId: subject.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.validate-token (1B-07)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an access token and return its claims.
 * Contract: identity.yaml → capabilities[2] auth.validate-token
 * Port:     IIdentityPort.validateToken
 *
 * Flow:
 *   1. Verify HMAC-SHA256 signature (via verifyTokenSignature).
 *   2. Check token type is 'access'.
 *   3. Check expiry (expiresAt > now).
 *   4. Check session is not revoked.
 *   5. Return TokenClaims.
 */
export async function validateToken(
  accessToken: string,
): Promise<TokenClaims> {
  const payload = await verifyTokenSignature(accessToken);
  if (!payload) {
    throw new Error('auth.validate-token: invalid token signature');
  }
  if (payload.type !== 'access') {
    throw new Error('auth.validate-token: not an access token');
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt <= now) {
    throw new Error('auth.validate-token: token expired');
  }
  // Check session not revoked
  const session = sessions.get(payload.sessionId);
  if (session && session.revokedAt !== null) {
    throw new Error('auth.validate-token: session revoked');
  }
  // Strip the internal 'type' field before returning
  const { type: _type, ...claims } = payload;
  void _type;
  return claims;
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.revoke-session (1B-08)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revoke a session by session ID.
 * Contract: identity.yaml → capabilities[3] auth.revoke-session
 *
 * Marks the session as revoked (sets revokedAt) rather than deleting it, so the
 * audit trail is preserved. Subsequent validateToken calls for this session fail.
 */
export async function revokeSession(
  sessionId: string,
): Promise<RevokeSessionResponse> {
  const session = sessions.get(sessionId);
  if (!session) {
    _appendAuditEntry('auth.revoke-session-failed', 'system', null, {
      sessionId,
      reason: 'session-not-found',
    });
    return { revoked: false };
  }
  if (session.revokedAt !== null) {
    // Already revoked — idempotent
    return { revoked: true };
  }
  session.revokedAt = new Date().toISOString();
  sessions.set(sessionId, session);

  _appendAuditEntry('auth.revoke-session', session.subjectId, session.subjectId, {
    sessionId,
  });
  await emitEvent(IDENTITY_EVENTS.SESSION_REVOKED, {
    subjectId: session.subjectId,
    sessionId,
  });

  return { revoked: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.check-permission (1B-09)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Role hierarchy: higher index = more permissions.
 * platform-admin > workspace-owner > workspace-member > workspace-viewer
 * agent-service and auditor are specialized roles.
 */
const ROLE_PRECEDENCE: Record<IdentityRole, number> = {
  'workspace-viewer': 1,
  'workspace-member': 2,
  'auditor': 2,
  'workspace-owner': 3,
  'agent-service': 2,
  'platform-admin': 4,
};

/**
 * RBAC permission matrix derived from contracts/resource-kinds/user.yaml
 * permissions. Maps action → minimum role required.
 * platform-admin implicitly satisfies all actions.
 */
const ACTION_MIN_ROLE: Record<string, IdentityRole> = {
  read: 'workspace-viewer',
  write: 'workspace-member',
  delete: 'workspace-owner',
  admin: 'platform-admin',
};

/**
 * Check whether a subject may perform an action on a resource (RBAC).
 * Contract: identity.yaml → capabilities[4] auth.check-permission
 * Port:     IIdentityPort.checkPermission
 *
 * Resolution:
 *   1. Resolve the subject's effective role (platform role or workspace override).
 *   2. Look up the minimum role required for the action.
 *   3. Compare role precedence — allowed if subject role ≥ required role.
 *   4. platform-admin is always allowed.
 */
export async function checkPermission(
  req: CheckPermissionRequest,
): Promise<PolicyDecision> {
  const subject = subjects.get(req.subjectId);
  if (!subject) {
    return {
      allowed: false,
      reason: 'subject not found',
      subjectId: req.subjectId,
      action: req.action,
      resourceUrn: req.resourceUrn,
      workspaceId: req.workspaceId ?? null,
      resolvedRole: null,
    };
  }

  // Resolve effective role
  const effectiveRole = resolveEffectiveRole(subject, req.workspaceId ?? null);

  // platform-admin bypasses all checks
  if (effectiveRole === 'platform-admin') {
    _appendAuditEntry(
      'auth.check-permission',
      req.subjectId,
      req.subjectId,
      { action: req.action, resourceUrn: req.resourceUrn, allowed: true, role: effectiveRole },
    );
    return {
      allowed: true,
      reason: 'platform-admin access',
      subjectId: req.subjectId,
      action: req.action,
      resourceUrn: req.resourceUrn,
      workspaceId: req.workspaceId ?? null,
      resolvedRole: effectiveRole,
    };
  }

  // Check subject is in an active-like state
  if (subject.status !== 'active' && subject.status !== 'updating') {
    return {
      allowed: false,
      reason: `subject status is '${subject.status}'`,
      subjectId: req.subjectId,
      action: req.action,
      resourceUrn: req.resourceUrn,
      workspaceId: req.workspaceId ?? null,
      resolvedRole: effectiveRole,
    };
  }

  // Look up minimum role for the action
  const minRole = ACTION_MIN_ROLE[req.action];
  if (!minRole) {
    // Unknown action — default deny with explicit reason
    return {
      allowed: false,
      reason: `unknown action '${req.action}'`,
      subjectId: req.subjectId,
      action: req.action,
      resourceUrn: req.resourceUrn,
      workspaceId: req.workspaceId ?? null,
      resolvedRole: effectiveRole,
    };
  }

  const allowed = ROLE_PRECEDENCE[effectiveRole] >= ROLE_PRECEDENCE[minRole];
  const reason = allowed
    ? `role '${effectiveRole}' satisfies minimum '${minRole}' for action '${req.action}'`
    : `role '${effectiveRole}' below minimum '${minRole}' for action '${req.action}'`;

  _appendAuditEntry('auth.check-permission', req.subjectId, req.subjectId, {
    action: req.action,
    resourceUrn: req.resourceUrn,
    allowed,
    role: effectiveRole,
    minRole,
  });

  return {
    allowed,
    reason,
    subjectId: req.subjectId,
    action: req.action,
    resourceUrn: req.resourceUrn,
    workspaceId: req.workspaceId ?? null,
    resolvedRole: effectiveRole,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.resolve-role (1B-10)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the effective role for a subject within a workspace.
 * Contract: identity.yaml → capabilities[5] auth.resolve-role
 * Port:     IIdentityPort.resolveRole
 *
 * Resolution order:
 *   1. If subject has a workspace-scoped role override for this workspace, use it.
 *   2. Otherwise use the subject's platform-level role.
 */
export async function resolveRole(
  subjectId: string,
  workspaceId: string,
): Promise<IdentityRole> {
  const subject = subjects.get(subjectId);
  if (!subject) {
    throw new Error(`auth.resolve-role: subject '${subjectId}' not found`);
  }
  return resolveEffectiveRole(subject, workspaceId);
}

/**
 * Internal: resolve the effective role without throwing (used by checkPermission).
 * Falls back to platform role if no workspace override exists.
 */
function resolveEffectiveRole(
  subject: IdentitySubject,
  workspaceId: string | null,
): IdentityRole {
  if (workspaceId && subject.workspaceRoles[workspaceId]) {
    return subject.workspaceRoles[workspaceId];
  }
  return subject.role;
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability: auth.get-subject (1B-11)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get subject details by ID. Does NOT return credential material.
 * Contract: identity.yaml → capabilities[6] auth.get-subject
 * Port:     IIdentityPort.getSubject
 *
 * Returns a copy of the subject (minus credential data, which is never stored
 * on the IdentitySubject type). Returns null if not found.
 */
export async function getSubject(
  subjectId: string,
): Promise<IdentitySubject | null> {
  const subject = subjects.get(subjectId);
  if (!subject) {
    return null;
  }
  // Return a defensive copy
  return {
    ...subject,
    metadata: { ...subject.metadata },
    workspaceRoles: { ...subject.workspaceRoles },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Subject lifecycle state machine (1B-12)
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
 * Check whether a transition between two lifecycle states is valid.
 * Exported for testability.
 */
export function isValidTransition(
  from: SubjectStatus,
  to: SubjectStatus,
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Transition a subject's lifecycle status. Throws on invalid transitions.
 * Contract: contracts/resource-kinds/user.yaml → lifecycle
 *
 * Lifecycle: creating → active → updating → degraded → suspended → deleting → deleted
 */
export async function transitionSubjectStatus(
  subjectId: string,
  target: SubjectStatus,
): Promise<IdentitySubject> {
  const subject = subjects.get(subjectId);
  if (!subject) {
    throw new Error(
      `subject-lifecycle: subject '${subjectId}' not found`,
    );
  }
  if (subject.status === target) {
    // No-op if already in target state
    return { ...subject, metadata: { ...subject.metadata }, workspaceRoles: { ...subject.workspaceRoles } };
  }
  if (!isValidTransition(subject.status, target)) {
    throw new Error(
      `subject-lifecycle: invalid transition '${subject.status}' → '${target}'`,
    );
  }
  subject.status = target;
  subject.updatedAt = new Date().toISOString();
  subjects.set(subjectId, subject);

  _appendAuditEntry('subject.lifecycle-transition', subjectId, subjectId, {
    from: subject.status,
    to: target,
  });

  return {
    ...subject,
    metadata: { ...subject.metadata },
    workspaceRoles: { ...subject.workspaceRoles },
  };
}

/**
 * Assign a workspace-scoped role override for a subject.
 * This is the mechanism by which a subject becomes a workspace-owner/member/etc.
 * for a specific workspace, independent of their platform role.
 */
export async function assignWorkspaceRole(
  subjectId: string,
  workspaceId: string,
  role: IdentityRole,
): Promise<IdentitySubject> {
  const subject = subjects.get(subjectId);
  if (!subject) {
    throw new Error(`assignWorkspaceRole: subject '${subjectId}' not found`);
  }
  subject.workspaceRoles[workspaceId] = role;
  subject.updatedAt = new Date().toISOString();
  subjects.set(subjectId, subject);

  _appendAuditEntry('subject.workspace-role-assigned', subjectId, subjectId, {
    workspaceId,
    role,
  });

  return {
    ...subject,
    metadata: { ...subject.metadata },
    workspaceRoles: { ...subject.workspaceRoles },
  };
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

/**
 * Identity Service — Application Layer
 *
 * Foundation authentication and authorization service.
 * Manages subjects, credentials, sessions, and workspace-scoped role assignments.
 * Zero external dependencies — the root of the service DAG.
 */

import type {
  IDatabasePort,
  ICachePort,
  IAuditPort,
  IQueuePort,
  IIdentityPort,
  TokenClaims,
  Role,
} from '../ports/index';
import type {
  IdentitySubjectSpec,
  IdentitySubjectStatus,
  TokenPair,
  SubjectPhase,
  Resource,
  PolicyDecision,
  PolicyEvaluationContext,
} from '../core/index';

export interface IdentityServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  audit: IAuditPort;
  queue: IQueuePort;
}

export class IdentityService implements IIdentityPort {
  private deps: IdentityServiceDeps;

  constructor(deps: IdentityServiceDeps) {
    this.deps = deps;
  }

  // ─── Subject Management ─────────────────────────────────────────────

  async registerSubject(input: {
    email: string;
    displayName: string;
    password: string;
    mfaEnabled?: boolean;
  }): Promise<Resource<IdentitySubjectSpec, IdentitySubjectStatus>> {
    // 1. Check if email already exists
    const existing = await this.deps.database.queryFirst(
      'SELECT id FROM identity_subjects WHERE email = ?',
      [input.email]
    );
    if (existing) {
      throw new IdentityError('SUBJECT_ALREADY_EXISTS', `Subject with email ${input.email} already exists`);
    }

    // 2. Hash password (argon2id — adapter handles the implementation)
    const passwordHash = await this.hashPassword(input.password);

    // 3. Create subject record
    const subjectId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:core:identity-subject:${subjectId}`;
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO identity_subjects (id, urn, email, display_name, password_hash, mfa_enabled, phase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [subjectId, urn, input.email, input.displayName, passwordHash, input.mfaEnabled ?? false, now, now]
    );

    // 4. Emit audit event
    await this.deps.audit.emitEvent({
      eventType: 'identity.subject.registered',
      category: 'identity',
      severity: 'medium',
      subjectId,
      action: 'register',
      data: { email: input.email, displayName: input.displayName, mfaEnabled: input.mfaEnabled },
      correlationId: crypto.randomUUID(),
    });

    // 5. Return the created subject resource
    return {
      apiVersion: 'platform.mycodevantaos/v1',
      kind: 'identity-subject',
      metadata: {
        id: subjectId,
        urn,
        kind: 'identity-subject',
        workspaceId: '',
        labels: {},
        annotations: {},
        createdBy: subjectId,
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        email: input.email,
        displayName: input.displayName,
        mfaEnabled: input.mfaEnabled ?? false,
        credentials: [],
        roles: {},
      },
      status: {
        phase: 'active',
        conditions: [{ type: 'Ready', status: 'True', reason: 'Registered', message: 'Subject registered successfully', lastTransitionTime: now }],
        authProvider: 'native',
        lastAuthenticatedAt: null,
        mfaVerifiedAt: null,
        activeSessions: 0,
      },
    };
  }

  async authenticateSubject(input: {
    email: string;
    password: string;
    mfaCode?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<TokenPair> {
    // 1. Look up subject
    const subject = await this.deps.database.queryFirst<{
      id: string;
      email: string;
      password_hash: string;
      mfa_enabled: boolean;
      phase: string;
    }>(
      'SELECT id, email, password_hash, mfa_enabled, phase FROM identity_subjects WHERE email = ?',
      [input.email]
    );

    if (!subject) {
      await this.deps.audit.emitEvent({
        eventType: 'identity.subject.authentication-failed',
        category: 'identity',
        severity: 'medium',
        subjectId: 'anonymous',
        action: 'authenticate',
        data: { email: input.email, reason: 'subject_not_found', ipAddress: input.ipAddress },
        correlationId: crypto.randomUUID(),
      });
      throw new IdentityError('AUTHENTICATION_FAILED', 'Invalid credentials');
    }

    // 2. Check subject phase
    if (subject.phase !== 'active') {
      throw new IdentityError('SUBJECT_INACTIVE', `Subject is ${subject.phase}`);
    }

    // 3. Verify password
    const passwordValid = await this.verifyPassword(input.password, subject.password_hash);
    if (!passwordValid) {
      await this.deps.audit.emitEvent({
        eventType: 'identity.subject.authentication-failed',
        category: 'identity',
        severity: 'medium',
        subjectId: subject.id,
        action: 'authenticate',
        data: { reason: 'invalid_password', ipAddress: input.ipAddress },
        correlationId: crypto.randomUUID(),
      });
      throw new IdentityError('AUTHENTICATION_FAILED', 'Invalid credentials');
    }

    // 4. MFA check (if enabled)
    if (subject.mfa_enabled && !input.mfaCode) {
      await this.deps.audit.emitEvent({
        eventType: 'identity.subject.mfa-challenged',
        category: 'identity',
        severity: 'info',
        subjectId: subject.id,
        action: 'mfa-challenge',
        data: { challengeMethod: 'totp' },
        correlationId: crypto.randomUUID(),
      });
      throw new IdentityError('MFA_REQUIRED', 'MFA code is required');
    }

    // 5. Issue token pair
    const tokenPair = await this.issueToken(subject.id, []);

    // 6. Emit success event
    await this.deps.audit.emitEvent({
      eventType: 'identity.subject.authenticated',
      category: 'identity',
      severity: 'info',
      subjectId: subject.id,
      action: 'authenticate',
      data: { authMethod: input.mfaCode ? 'mfa' : 'password', ipAddress: input.ipAddress, userAgent: input.userAgent },
      correlationId: crypto.randomUUID(),
    });

    return tokenPair;
  }

  // ─── Token Operations ───────────────────────────────────────────────

  async issueToken(subjectId: string, scopes: string[]): Promise<TokenPair> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // In production, sign with RS256/JWT
    // For constitution, we define the structure
    const accessToken = `access_${sessionId}_${subjectId}_${now}`;
    const refreshToken = `refresh_${sessionId}_${subjectId}_${now}`;

    // Cache the session
    await this.deps.cache.put(`session:${sessionId}`, {
      subjectId,
      scopes,
      createdAt: now,
      expiresAt: now + 3600,
    }, { expirationTtl: 3600 });

    await this.deps.audit.emitEvent({
      eventType: 'identity.session.created',
      category: 'identity',
      severity: 'info',
      subjectId,
      action: 'session-create',
      data: { sessionType: 'user', expiresIn: 3600 },
      correlationId: crypto.randomUUID(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }

  async validateToken(accessToken: string): Promise<TokenClaims> {
    // Parse and validate the token
    // In production, verify RS256 signature and claims
    const parts = accessToken.split('_');
    if (parts.length < 4 || parts[0] !== 'access') {
      throw new IdentityError('INVALID_TOKEN', 'Token format is invalid');
    }

    const sessionId = parts[1];
    const subjectId = parts[2];

    const cached = await this.deps.cache.get<{ subjectId: string; scopes: string[]; createdAt: number; expiresAt: number }>(
      `session:${sessionId}`
    );

    if (!cached || cached.subjectId !== subjectId) {
      throw new IdentityError('TOKEN_EXPIRED', 'Token has expired or been revoked');
    }

    return {
      subjectId: cached.subjectId,
      scopes: cached.scopes,
      iat: cached.createdAt,
      exp: cached.expiresAt,
      sid: sessionId,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.deps.cache.delete(`session:${sessionId}`);
    await this.deps.audit.emitEvent({
      eventType: 'identity.session.revoked',
      category: 'identity',
      severity: 'medium',
      subjectId: 'system',
      action: 'session-revoke',
      data: { reason: 'user-request', sessionId },
      correlationId: crypto.randomUUID(),
    });
  }

  // ─── Authorization ──────────────────────────────────────────────────

  async checkPermission(subjectId: string, workspaceId: string, action: string, resourceKind: string): Promise<boolean> {
    const role = await this.resolveRole(subjectId, workspaceId);
    // Simplified permission check — in production, evaluate against policy-model.yaml
    const permissionMap: Record<Role, string[]> = {
      'platform-admin': ['*'],
      'workspace-owner': ['workspace:*', 'knowledge:*', 'ai:*', 'model:*'],
      'workspace-member': ['knowledge:document:*', 'knowledge:search:*', 'ai:chat-session:*', 'model:invoke'],
      'workspace-viewer': ['knowledge:document:read', 'knowledge:collection:read', 'ai:chat-session:read', 'workspace:read'],
      'agent-service': ['knowledge-search:execute', 'model:invoke', 'audit:event:write'],
      'auditor': ['governance:audit:read', 'governance:usage:read'],
    };

    const permissions = permissionMap[role] ?? [];
    return permissions.some((p) => p === '*' || p === action || action.startsWith(p.replace('*', '')));
  }

  async resolveRole(subjectId: string, workspaceId: string): Promise<Role> {
    const membership = await this.deps.database.queryFirst<{ role: string }>(
      'SELECT role FROM workspace_memberships WHERE subject_id = ? AND workspace_id = ?',
      [subjectId, workspaceId]
    );

    if (!membership) {
      // Check if platform admin
      const admin = await this.deps.database.queryFirst<{ role: string }>(
        'SELECT role FROM platform_roles WHERE subject_id = ?',
        [subjectId]
      );
      return (admin?.role as Role) ?? 'workspace-viewer';
    }

    return membership.role as Role;
  }

  async getSubject(subjectId: string): Promise<{ id: string; email: string; displayName: string; mfaEnabled: boolean; status: string }> {
    const subject = await this.deps.database.queryFirst<{
      id: string;
      email: string;
      display_name: string;
      mfa_enabled: boolean;
      phase: string;
    }>('SELECT id, email, display_name, mfa_enabled, phase FROM identity_subjects WHERE id = ?', [subjectId]);

    if (!subject) {
      throw new IdentityError('SUBJECT_NOT_FOUND', `Subject ${subjectId} not found`);
    }

    return {
      id: subject.id,
      email: subject.email,
      displayName: subject.display_name,
      mfaEnabled: subject.mfa_enabled,
      status: subject.phase,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private async hashPassword(password: string): Promise<string> {
    // In production: argon2id via WebCrypto or Workers ABI
    // For constitution: use a placeholder encoding
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return `argon2id$${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computed = await this.hashPassword(password);
    return computed === hash;
  }
}

// ─── Domain Errors ────────────────────────────────────────────────────

export class IdentityError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'IdentityError';
  }
}

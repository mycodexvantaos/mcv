/**
 * MyCodeXvantaOS — Identity Application Service
 * Category: security
 *
 * Foundation authentication and authorization service.
 * Manages subjects, credentials, sessions, and workspace-scoped role assignments.
 * Zero external service dependencies — the root of the service DAG.
 *
 * Use cases:
 *   - register-subject
 *   - authenticate
 *   - create-session
 *   - resolve-actor
 *   - validate-token
 *   - check-permission
 */

import type { IDatabasePort } from '../../ports/database';
import type { IObjectStoragePort } from '../../ports/object-storage';
import type { IQueuePort } from '../../ports/queue';
import type { IAuthPort, TokenClaims, Role, SubjectInfo, SessionInfo } from '../../ports/auth';
import type { Result } from '../../core/shared';

// ── Service Dependencies ───────────────────────────────────────────────

export interface IdentityServiceDeps {
  database: IDatabasePort;
  queue: IQueuePort;
  audit: {
    emitEvent(event: IdentityAuditEvent): Promise<void>;
  };
}

// ── Input / Output Types ───────────────────────────────────────────────

export interface RegisterSubjectInput {
  email: string;
  displayName: string;
  password: string;
  mfaEnabled?: boolean;
}

export interface AuthenticateInput {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface CreateSessionInput {
  subjectId: string;
  workspaceId: string;
}

export interface ResolveActorInput {
  accessToken: string;
}

export type SubjectPhase = 'unregistered' | 'active' | 'suspended' | 'deactivated';

export interface SubjectResource {
  id: string;
  urn: string;
  spec: {
    email: string;
    displayName: string;
    mfaEnabled: boolean;
    roles: Record<string, Role>;
  };
  status: {
    phase: SubjectPhase;
    authProvider: string;
    lastAuthenticatedAt: string | null;
    activeSessions: number;
  };
}

export interface IdentityAuditEvent {
  eventType: string;
  category: 'security';
  severity: string;
  subjectId: string;
  workspaceId?: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class IdentityService implements IAuthPort {
  private deps: IdentityServiceDeps;

  constructor(deps: IdentityServiceDeps) {
    this.deps = deps;
  }

  async registerSubject(input: RegisterSubjectInput): Promise<SubjectResource> {
    const subjectId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:security:subject:${subjectId}`;
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO subjects (id, urn, email, display_name, mfa_enabled, phase, auth_provider, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 'local', ?, ?)`,
      [subjectId, urn, input.email, input.displayName, input.mfaEnabled ?? false, now, now]
    );

    await this.deps.audit.emitEvent({
      eventType: 'security.subject.registered',
      category: 'security',
      severity: 'info',
      subjectId,
      action: 'register-subject',
      correlationId: crypto.randomUUID(),
    });

    return {
      id: subjectId,
      urn,
      spec: {
        email: input.email,
        displayName: input.displayName,
        mfaEnabled: input.mfaEnabled ?? false,
        roles: {},
      },
      status: {
        phase: 'active',
        authProvider: 'local',
        lastAuthenticatedAt: null,
        activeSessions: 0,
      },
    };
  }

  async validateToken(accessToken: string): Promise<TokenClaims> {
    // JWT validation — implementation delegated to adapter
    throw new Error('Not implemented: validateToken requires adapter');
  }

  async checkPermission(subjectId: string, workspaceId: string, action: string, resourceKind: string): Promise<boolean> {
    // Policy evaluation — delegates to policy model
    throw new Error('Not implemented: checkPermission requires policy evaluation');
  }

  async getSubject(subjectId: string): Promise<SubjectInfo> {
    const row = await this.deps.database.queryFirst<Record<string, unknown>>(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    if (!row) throw new Error(`Subject not found: ${subjectId}`);
    return {
      id: row.id as string,
      email: row.email as string,
      displayName: row.display_name as string,
      mfaEnabled: row.mfa_enabled as boolean,
      status: row.phase as 'active' | 'suspended' | 'deactivated',
      roles: {},
    };
  }

  async resolveRole(subjectId: string, workspaceId: string): Promise<Role> {
    const row = await this.deps.database.queryFirst<{ role: Role }>(
      'SELECT role FROM memberships WHERE subject_id = ? AND workspace_id = ?',
      [subjectId, workspaceId]
    );
    return row?.role ?? 'workspace-viewer';
  }

  async createSession(subjectId: string, workspaceId: string): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const role = await this.resolveRole(subjectId, workspaceId);

    await this.deps.database.execute(
      `INSERT INTO sessions (id, subject_id, workspace_id, role, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, subjectId, workspaceId, role, now, expiresAt]
    );

    return {
      sessionId,
      subjectId,
      workspaceId,
      role,
      createdAt: now,
      expiresAt,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.deps.database.execute(
      'DELETE FROM sessions WHERE id = ?',
      [sessionId]
    );
  }
}

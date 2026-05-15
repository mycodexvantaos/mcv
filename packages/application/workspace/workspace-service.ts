/**
 * MyCodeXvantaOS — Workspace Application Service
 * Category: workspace
 *
 * Workspace-scoped resource isolation and lifecycle management.
 * Every resource belongs to a workspace; workspace enforces namespace boundaries.
 *
 * Use cases:
 *   - create-workspace
 *   - list-workspaces
 *   - get-workspace
 *   - update-workspace
 *   - add-member
 *   - remove-member
 */

import type { IDatabasePort } from '../../ports/database';
import type { IAuthPort, Role } from '../../ports/auth';
import type { ResourceCondition } from '../../core/shared';

// ── Service Dependencies ───────────────────────────────────────────────

export interface WorkspaceServiceDeps {
  database: IDatabasePort;
  audit: {
    emitEvent(event: WorkspaceAuditEvent): Promise<void>;
  };
  auth: IAuthPort;
}

// ── Input / Output Types ───────────────────────────────────────────────

export type WorkspacePhase = 'creating' | 'active' | 'suspended' | 'deleting' | 'deleted';

export interface CreateWorkspaceInput {
  displayName: string;
  description?: string;
  ownerId: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface UpdateWorkspaceInput {
  displayName?: string;
  description?: string;
}

export interface QuotaSpec {
  maxMembers: number;
  maxResources: number;
  maxCollections: number;
  maxModelEndpoints: number;
  maxStorageMb: number;
}

export interface QuotaUsage {
  members: number;
  resources: number;
  collections: number;
  modelEndpoints: number;
  storageMb: number;
}

export interface WorkspaceResource {
  id: string;
  urn: string;
  spec: {
    displayName: string;
    description: string;
    ownerId: string;
    quotas: QuotaSpec;
  };
  status: {
    phase: WorkspacePhase;
    memberCount: number;
    resourceCount: number;
    quotaUsage: QuotaUsage;
    conditions: ResourceCondition[];
  };
}

export interface MembershipResource {
  subjectId: string;
  workspaceId: string;
  role: Role;
  addedAt: string;
  addedBy: string;
}

export interface WorkspaceAuditEvent {
  eventType: string;
  category: 'workspace';
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class WorkspaceService {
  private deps: WorkspaceServiceDeps;

  constructor(deps: WorkspaceServiceDeps) {
    this.deps = deps;
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceResource> {
    const workspaceId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:workspace:workspace:${workspaceId}`;
    const now = new Date().toISOString();

    const defaultQuotas: QuotaSpec = input.tier === 'enterprise'
      ? { maxMembers: 200, maxResources: 100000, maxCollections: 500, maxModelEndpoints: 20, maxStorageMb: 50000 }
      : input.tier === 'pro'
        ? { maxMembers: 50, maxResources: 50000, maxCollections: 50, maxModelEndpoints: 5, maxStorageMb: 5000 }
        : { maxMembers: 10, maxResources: 1000, maxCollections: 5, maxModelEndpoints: 1, maxStorageMb: 100 };

    await this.deps.database.execute(
      `INSERT INTO workspaces (id, urn, display_name, description, owner_id, phase, tier, quotas, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [workspaceId, urn, input.displayName, input.description ?? '', input.ownerId, input.tier ?? 'free', JSON.stringify(defaultQuotas), now, now]
    );

    await this.addMember(workspaceId, input.ownerId, 'workspace-owner');

    await this.deps.audit.emitEvent({
      eventType: 'workspace.workspace.created',
      category: 'workspace',
      severity: 'info',
      subjectId: input.ownerId,
      workspaceId,
      action: 'create-workspace',
      correlationId: crypto.randomUUID(),
    });

    return {
      id: workspaceId,
      urn,
      spec: { displayName: input.displayName, description: input.description ?? '', ownerId: input.ownerId, quotas: defaultQuotas },
      status: { phase: 'active', memberCount: 1, resourceCount: 0, quotaUsage: { members: 1, resources: 0, collections: 0, modelEndpoints: 0, storageMb: 0 }, conditions: [] },
    };
  }

  async listWorkspaces(subjectId: string): Promise<WorkspaceResource[]> {
    const rows = await this.deps.database.query<Record<string, unknown>>(
      `SELECT w.* FROM workspaces w JOIN memberships m ON w.id = m.workspace_id WHERE m.subject_id = ?`,
      [subjectId]
    );
    return rows.map(row => this.mapRowToResource(row));
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceResource | null> {
    const row = await this.deps.database.queryFirst<Record<string, unknown>>(
      'SELECT * FROM workspaces WHERE id = ?',
      [workspaceId]
    );
    return row ? this.mapRowToResource(row) : null;
  }

  async addMember(workspaceId: string, subjectId: string, role: Role): Promise<MembershipResource> {
    const now = new Date().toISOString();
    await this.deps.database.execute(
      `INSERT INTO memberships (subject_id, workspace_id, role, added_at, added_by)
       VALUES (?, ?, ?, ?, ?)`,
      [subjectId, workspaceId, role, now, 'system']
    );
    return { subjectId, workspaceId, role, addedAt: now, addedBy: 'system' };
  }

  private mapRowToResource(row: Record<string, unknown>): WorkspaceResource {
    return {
      id: row.id as string,
      urn: row.urn as string,
      spec: {
        displayName: row.display_name as string,
        description: row.description as string,
        ownerId: row.owner_id as string,
        quotas: JSON.parse(row.quotas as string || '{}'),
      },
      status: {
        phase: row.phase as WorkspacePhase,
        memberCount: 0,
        resourceCount: 0,
        quotaUsage: { members: 0, resources: 0, collections: 0, modelEndpoints: 0, storageMb: 0 },
        conditions: [],
      },
    };
  }
}

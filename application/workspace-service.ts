/**
 * Workspace Service — Application Layer
 *
 * Workspace-scoped resource isolation and lifecycle management.
 * Every resource belongs to a workspace; workspace enforces namespace boundaries.
 */

import type { IDatabasePort, ICachePort, IAuditPort, IIdentityPort } from '../ports/index';
import type {
  WorkspaceSpec,
  WorkspaceStatus,
  WorkspacePhase,
  Resource,
  Membership,
  Role,
  QuotaSpec,
  QuotaUsage,
} from '../core/index';

export interface WorkspaceServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  audit: IAuditPort;
  identity: IIdentityPort;
}

export class WorkspaceService {
  private deps: WorkspaceServiceDeps;

  constructor(deps: WorkspaceServiceDeps) {
    this.deps = deps;
  }

  async createWorkspace(input: {
    displayName: string;
    description?: string;
    ownerId: string;
    tier?: string;
  }): Promise<Resource<WorkspaceSpec, WorkspaceStatus>> {
    const workspaceId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:core:workspace:${workspaceId}`;
    const now = new Date().toISOString();

    const defaultQuotas: QuotaSpec =
      input.tier === 'enterprise'
        ? {
            maxMembers: 200,
            maxResources: 100000,
            maxCollections: 500,
            maxModelEndpoints: 20,
            maxStorageMb: 50000,
          }
        : input.tier === 'pro'
          ? {
              maxMembers: 50,
              maxResources: 50000,
              maxCollections: 50,
              maxModelEndpoints: 5,
              maxStorageMb: 5000,
            }
          : {
              maxMembers: 10,
              maxResources: 1000,
              maxCollections: 5,
              maxModelEndpoints: 1,
              maxStorageMb: 100,
            };

    await this.deps.database.execute(
      `INSERT INTO workspaces (id, urn, display_name, description, owner_id, phase, tier, quotas, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [
        workspaceId,
        urn,
        input.displayName,
        input.description ?? '',
        input.ownerId,
        input.tier ?? 'free',
        JSON.stringify(defaultQuotas),
        now,
        now,
      ]
    );

    // Owner is automatically a member
    await this.addMember(workspaceId, input.ownerId, 'workspace-owner');

    await this.deps.audit.emitEvent({
      eventType: 'workspace.created',
      category: 'workspace',
      severity: 'info',
      subjectId: input.ownerId,
      workspaceId,
      action: 'create-workspace',
      data: { displayName: input.displayName, tier: input.tier ?? 'free' },
      correlationId: crypto.randomUUID(),
    });

    return {
      apiVersion: 'platform.mycodexvantaos/v1',
      kind: 'workspace',
      metadata: {
        id: workspaceId,
        urn,
        kind: 'workspace',
        workspaceId,
        labels: { tier: input.tier ?? 'free' },
        annotations: {},
        createdBy: input.ownerId,
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        displayName: input.displayName,
        description: input.description ?? '',
        ownerId: input.ownerId,
        settings: {
          dataResidency: 'auto',
          defaultLanguage: 'en',
          mfaRequired: false,
          retentionPolicy: { documents: 90, chatSessions: 90, auditEvents: 2555 },
        },
        quotas: defaultQuotas,
      },
      status: {
        phase: 'active',
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Created',
            message: 'Workspace created',
            lastTransitionTime: now,
          },
        ],
        memberCount: 1,
        resourceCount: 0,
        quotaUsage: { members: 1, resources: 0, collections: 0, modelEndpoints: 0, storageMb: 0 },
        suspended: false,
      },
    };
  }

  async addMember(workspaceId: string, subjectId: string, role: Role): Promise<Membership> {
    const now = new Date().toISOString();
    await this.deps.database.execute(
      `INSERT INTO workspace_memberships (workspace_id, subject_id, role, added_at, added_by)
       VALUES (?, ?, ?, ?, ?)`,
      [workspaceId, subjectId, role, now, subjectId]
    );

    await this.deps.audit.emitEvent({
      eventType: 'workspace.member.added',
      category: 'workspace',
      severity: 'medium',
      subjectId,
      workspaceId,
      action: 'add-member',
      data: { role, addedBy: subjectId },
      correlationId: crypto.randomUUID(),
    });

    return { subjectId, workspaceId, role, addedAt: now, addedBy: subjectId };
  }

  async removeMember(workspaceId: string, subjectId: string): Promise<void> {
    await this.deps.database.execute(
      'DELETE FROM workspace_memberships WHERE workspace_id = ? AND subject_id = ?',
      [workspaceId, subjectId]
    );

    await this.deps.audit.emitEvent({
      eventType: 'workspace.member.removed',
      category: 'workspace',
      severity: 'medium',
      subjectId,
      workspaceId,
      action: 'remove-member',
      data: { removedBy: subjectId },
      correlationId: crypto.randomUUID(),
    });
  }

  async checkQuota(
    workspaceId: string,
    resourceKind: string
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const workspace = await this.deps.database.queryFirst<{ quotas: string }>(
      'SELECT quotas FROM workspaces WHERE id = ?',
      [workspaceId]
    );
    if (!workspace) throw new Error('Workspace not found');

    const quotas: QuotaSpec = JSON.parse(workspace.quotas);
    const usage = await this.getQuotaUsage(workspaceId);

    const limitMap: Record<string, { current: number; limit: number }> = {
      'knowledge-collection': { current: usage.collections, limit: quotas.maxCollections },
      'model-endpoint': { current: usage.modelEndpoints, limit: quotas.maxModelEndpoints },
      member: { current: usage.members, limit: quotas.maxMembers },
    };

    const check = limitMap[resourceKind] ?? {
      current: usage.resources,
      limit: quotas.maxResources,
    };
    return { allowed: check.current < check.limit, current: check.current, limit: check.limit };
  }

  private async getQuotaUsage(workspaceId: string): Promise<QuotaUsage> {
    const memberCount = await this.deps.database.queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM workspace_memberships WHERE workspace_id = ?',
      [workspaceId]
    );
    return {
      members: memberCount?.count ?? 0,
      resources: 0,
      collections: 0,
      modelEndpoints: 0,
      storageMb: 0,
    };
  }
}

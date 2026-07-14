import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// MyCodexVantaOS Admin Dashboard - Audit Trail API
// Governance audit log with search and filtering

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceType: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  governance: {
    approved: boolean;
    approver: string | null;
    policy: string;
  };
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  metadata: Record<string, string>;
}

const auditEntries: AuditEntry[] = [
  {
    id: 'audit-001',
    action: 'connector.create',
    resource: 'connector/pg-primary',
    resourceType: 'connector',
    actor: 'admin@mycodexvantaos.io',
    actorRole: 'super_admin',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'connector-lifecycle' },
    changes: [{ field: 'status', oldValue: 'none', newValue: 'initializing' }],
    metadata: { source: 'dashboard', ip: '10.0.1.100' },
  },
  {
    id: 'audit-002',
    action: 'inference.routing.update',
    resource: 'inference/routing/route-gpt4o',
    resourceType: 'inference',
    actor: 'admin@mycodexvantaos.io',
    actorRole: 'admin',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'routing-modification' },
    changes: [{ field: 'weight', oldValue: '25', newValue: '30' }],
    metadata: { source: 'dashboard', ip: '10.0.1.100' },
  },
  {
    id: 'audit-003',
    action: 'edge.deploy',
    resource: 'edge/us-east-1/gpt-4o-mini',
    resourceType: 'edge',
    actor: 'system',
    actorRole: 'system',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'success',
    governance: {
      approved: true,
      approver: 'admin@mycodexvantaos.io',
      policy: 'deployment-approval',
    },
    changes: [{ field: 'model_status', oldValue: 'none', newValue: 'loaded' }],
    metadata: { source: 'scheduler', version: '2024-07-18' },
  },
  {
    id: 'audit-004',
    action: 'security.secret.rotate',
    resource: 'security/secrets/redis-auth',
    resourceType: 'security',
    actor: 'admin@mycodexvantaos.io',
    actorRole: 'admin',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'secret-rotation' },
    changes: [{ field: 'secret_version', oldValue: 'v12', newValue: 'v13' }],
    metadata: { source: 'dashboard', rotationType: 'scheduled' },
  },
  {
    id: 'audit-005',
    action: 'governance.rbac.update',
    resource: 'governance/rbac/operator',
    resourceType: 'governance',
    actor: 'admin@mycodexvantaos.io',
    actorRole: 'super_admin',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'rbac-modification' },
    changes: [{ field: 'permissions', oldValue: '["read"]', newValue: '["read","write"]' }],
    metadata: { source: 'dashboard', affectedUsers: '3' },
  },
  {
    id: 'audit-006',
    action: 'connector.health_check',
    resource: 'connector/s3-storage',
    resourceType: 'connector',
    actor: 'system',
    actorRole: 'system',
    timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
    status: 'failed',
    governance: { approved: false, approver: null, policy: 'health-monitoring' },
    changes: [{ field: 'status', oldValue: 'healthy', newValue: 'degraded' }],
    metadata: { source: 'monitor', latency: '250ms' },
  },
  {
    id: 'audit-007',
    action: 'scenario.create',
    resource: 'scenario/scenario-002',
    resourceType: 'scenario',
    actor: 'operator@mycodexvantaos.io',
    actorRole: 'operator',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    status: 'success',
    governance: {
      approved: true,
      approver: 'admin@mycodexvantaos.io',
      policy: 'scenario-lifecycle',
    },
    changes: [{ field: 'status', oldValue: 'none', newValue: 'draft' }],
    metadata: { source: 'dashboard', domain: 'Developer Platform' },
  },
  {
    id: 'audit-008',
    action: 'user.login',
    resource: 'user/operator@mycodexvantaos.io',
    resourceType: 'user',
    actor: 'operator@mycodexvantaos.io',
    actorRole: 'operator',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'authentication' },
    changes: [],
    metadata: { source: 'cloudflare-access', ip: '203.0.113.42', mfaUsed: 'true' },
  },
  {
    id: 'audit-009',
    action: 'inference.model.register',
    resource: 'inference/models/qwen-2-72b',
    resourceType: 'inference',
    actor: 'admin@mycodexvantaos.io',
    actorRole: 'admin',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'model-registration' },
    changes: [{ field: 'status', oldValue: 'none', newValue: 'registered' }],
    metadata: { source: 'dashboard', provider: 'alibaba' },
  },
  {
    id: 'audit-010',
    action: 'security.compliance.scan',
    resource: 'security/compliance/hipaa',
    resourceType: 'security',
    actor: 'system',
    actorRole: 'system',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    status: 'success',
    governance: { approved: true, approver: 'system', policy: 'compliance-monitoring' },
    changes: [{ field: 'score', oldValue: '75', newValue: '78' }],
    metadata: { source: 'scheduler', findings: '3' },
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const resourceType = searchParams.get('resourceType');
  const actor = searchParams.get('actor');
  const limit = parseInt(searchParams.get('limit') || '50');

  let filtered = [...auditEntries];

  if (action) {
    filtered = filtered.filter((e) => e.action.includes(action));
  }
  if (resourceType) {
    filtered = filtered.filter((e) => e.resourceType === resourceType);
  }
  if (actor) {
    filtered = filtered.filter((e) => e.actor.includes(actor));
  }

  return NextResponse.json({
    entries: filtered.slice(0, limit),
    total: filtered.length,
    filters: { action, resourceType, actor },
  });
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// MyCodexVantaOS Admin Dashboard - System Overview API
// Provides system overview data including KPIs, connector status, alerts, and activity

const mockKpis = [
  {
    id: 'total-requests',
    title: 'Total Requests',
    value: '1.24M',
    subtitle: 'Last 24 hours',
    change: 12.5,
    changeLabel: 'vs yesterday',
    trend: 'up' as const,
    status: 'healthy' as const,
  },
  {
    id: 'avg-latency',
    title: 'Avg Latency',
    value: '142ms',
    subtitle: 'p50 latency',
    change: -3.2,
    changeLabel: 'vs yesterday',
    trend: 'down' as const,
    status: 'healthy' as const,
  },
  {
    id: 'error-rate',
    title: 'Error Rate',
    value: '0.23%',
    subtitle: '5xx errors',
    change: -0.05,
    changeLabel: 'vs yesterday',
    trend: 'down' as const,
    status: 'warning' as const,
  },
  {
    id: 'active-models',
    title: 'Active Models',
    value: '8',
    subtitle: 'of 12 registered',
    change: 2,
    changeLabel: 'new this week',
    trend: 'up' as const,
    status: 'healthy' as const,
  },
  {
    id: 'connectors-online',
    title: 'Connectors Online',
    value: '5/6',
    subtitle: '1 degraded',
    change: 0,
    changeLabel: 'no change',
    trend: 'neutral' as const,
    status: 'warning' as const,
  },
  {
    id: 'edge-nodes',
    title: 'Edge Nodes',
    value: '12',
    subtitle: 'across 4 regions',
    change: 1,
    changeLabel: 'new this week',
    trend: 'up' as const,
    status: 'healthy' as const,
  },
];

const mockConnectorStatuses = [
  {
    id: 'pg-primary',
    name: 'PostgreSQL Primary',
    type: 'postgresql',
    status: 'healthy' as const,
    latency: 12,
    connections: 45,
    maxConnections: 100,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: 'pg-replica',
    name: 'PostgreSQL Replica',
    type: 'postgresql',
    status: 'healthy' as const,
    latency: 15,
    connections: 32,
    maxConnections: 100,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    type: 'redis',
    status: 'healthy' as const,
    latency: 2,
    connections: 88,
    maxConnections: 200,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: 'github-scm',
    name: 'GitHub SCM',
    type: 'github',
    status: 'healthy' as const,
    latency: 85,
    connections: 12,
    maxConnections: 50,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: 's3-storage',
    name: 'S3 Object Storage',
    type: 's3',
    status: 'degraded' as const,
    latency: 250,
    connections: 23,
    maxConnections: 100,
    lastHealthCheck: new Date().toISOString(),
  },
  {
    id: 'custom-webhook',
    name: 'Custom Webhook',
    type: 'custom',
    status: 'healthy' as const,
    latency: 45,
    connections: 5,
    maxConnections: 20,
    lastHealthCheck: new Date().toISOString(),
  },
];

const mockAlerts = [
  {
    id: 'alert-001',
    severity: 'critical' as const,
    title: 'S3 Storage latency spike',
    message: 'S3 Object Storage latency exceeded 200ms threshold',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    acknowledged: false,
    source: 'connector-monitor',
  },
  {
    id: 'alert-002',
    severity: 'warning' as const,
    title: 'Redis memory usage high',
    message: 'Redis Cache memory usage at 78% - approaching threshold',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    acknowledged: false,
    source: 'connector-monitor',
  },
  {
    id: 'alert-003',
    severity: 'info' as const,
    title: 'Model deployment completed',
    message: 'gpt-4o-mini deployed to us-east-1 edge nodes',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    acknowledged: true,
    source: 'edge-deploy',
  },
  {
    id: 'alert-004',
    severity: 'warning' as const,
    title: 'Audit log rotation pending',
    message: 'Audit log size approaching retention limit',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    acknowledged: false,
    source: 'governance',
  },
];

const mockActivityFeed = [
  {
    id: 'act-001',
    type: 'deployment' as const,
    action: 'Deployed model gpt-4o-mini to us-east-1',
    actor: 'system',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    resource: 'edge/us-east-1',
    governanceApproved: true,
  },
  {
    id: 'act-002',
    type: 'connector' as const,
    action: 'Health check failed for S3 Object Storage',
    actor: 'system',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    resource: 'connector/s3-storage',
    governanceApproved: false,
  },
  {
    id: 'act-003',
    type: 'security' as const,
    action: 'Secret rotation completed for PostgreSQL credentials',
    actor: 'admin@mycodexvantaos.io',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    resource: 'security/secrets/pg-primary',
    governanceApproved: true,
  },
  {
    id: 'act-004',
    type: 'governance' as const,
    action: 'RBAC policy updated for operator role',
    actor: 'admin@mycodexvantaos.io',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    resource: 'governance/rbac',
    governanceApproved: true,
  },
  {
    id: 'act-005',
    type: 'inference' as const,
    action: 'Model routing updated - claude-3.5-sonnet weight increased',
    actor: 'system',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    resource: 'inference/routing',
    governanceApproved: true,
  },
];

function generateSparklineData() {
  const data: { time: string; value: number }[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    data.push({
      time: hour.toISOString(),
      value: Math.floor(40000 + Math.random() * 20000 + Math.sin(i / 3) * 8000),
    });
  }
  return data;
}

export async function GET() {
  const overview = {
    kpis: mockKpis,
    connectors: mockConnectorStatuses,
    alerts: mockAlerts,
    activity: mockActivityFeed,
    inferenceSparkline: generateSparklineData(),
    systemHealth: {
      status: 'degraded' as const,
      uptime: '99.97%',
      lastIncident: new Date(Date.now() - 7 * 86400000).toISOString(),
      activeConnections: 205,
      totalRequests24h: 1243789,
    },
    lastSync: new Date().toISOString(),
  };

  return NextResponse.json(overview);
}

export async function POST(request: Request) {
  const body: { action?: string; alertId?: string } = await request.json();

  if (body.action === 'acknowledge_alert' && body.alertId) {
    const alert = mockAlerts.find((a) => a.id === body.alertId);
    if (alert) {
      alert.acknowledged = true;
      return NextResponse.json({ success: true, alert });
    }
    return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

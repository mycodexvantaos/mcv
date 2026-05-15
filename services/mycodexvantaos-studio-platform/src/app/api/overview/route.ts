import { NextResponse } from 'next/server';

/**
 * GET /api/overview
 * Returns system overview KPIs, inference mini-chart, connector status,
 * activity feed, and alert summary for the MyCodeXvantaOS admin dashboard.
 */
export async function GET() {
  const now = new Date().toISOString();

  const overview = {
    timestamp: now,
    platform: 'MyCodeXvantaOS Studio',
    version: '1.0.0',
    kpis: {
      totalRequests: { value: 142_830, delta: '+12.4%', trend: 'up' },
      activeConnectors: { value: 8, delta: '+1', trend: 'up' },
      inferenceLatencyP95Ms: { value: 187, delta: '-8ms', trend: 'down' },
      systemAvailability: { value: 99.97, unit: '%', delta: '+0.02%', trend: 'up' },
      activeAgents: { value: 24, delta: '+3', trend: 'up' },
      errorRate: { value: 0.03, unit: '%', delta: '-0.01%', trend: 'down' },
    },
    inferenceMiniChart: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      requestsPerMin: Math.floor(80 + Math.random() * 60),
      latencyMs: Math.floor(140 + Math.random() * 80),
    })),
    connectorStatus: [
      { id: 'connector-github', name: 'GitHub', status: 'healthy', latencyMs: 42 },
      { id: 'connector-postgresql', name: 'PostgreSQL', status: 'healthy', latencyMs: 8 },
      { id: 'connector-redis', name: 'Redis', status: 'healthy', latencyMs: 2 },
      { id: 'connector-kafka', name: 'Kafka', status: 'healthy', latencyMs: 15 },
      { id: 'connector-s3', name: 'S3 / R2', status: 'healthy', latencyMs: 55 },
      { id: 'connector-mongodb', name: 'MongoDB', status: 'degraded', latencyMs: 320 },
      { id: 'connector-elastic', name: 'Elasticsearch', status: 'healthy', latencyMs: 28 },
      { id: 'connector-auth', name: 'Auth (Keycloak)', status: 'healthy', latencyMs: 12 },
    ],
    activityFeed: [
      { id: 'act-001', actor: 'admin@mycodexvantaos.dev', action: 'DEPLOY', resource: 'mycodexvantaos-ai-agent:v1.2.0', result: 'success', ts: now },
      { id: 'act-002', actor: 'system', action: 'DRIFT_DETECT', resource: 'mycodexvantaos-core-gateway', result: 'no-drift', ts: now },
      { id: 'act-003', actor: 'admin@mycodexvantaos.dev', action: 'CONNECTOR_UPDATE', resource: 'connector-mongodb', result: 'degraded', ts: now },
      { id: 'act-004', actor: 'system', action: 'SBOM_UPLOAD', resource: 'mycodexvantaos-ai-llm:v0.9.1', result: 'success', ts: now },
      { id: 'act-005', actor: 'admin@mycodexvantaos.dev', action: 'POLICY_CHECK', resource: 'opa-admission-control', result: 'pass', ts: now },
    ],
    alerts: {
      critical: 0,
      warning: 1,
      info: 3,
      items: [
        { id: 'alert-001', severity: 'warning', message: 'connector-mongodb response time > 300ms', ts: now },
        { id: 'alert-002', severity: 'info', message: 'SBOM attestation completed for ai-llm:v0.9.1', ts: now },
        { id: 'alert-003', severity: 'info', message: 'Deployment freeze gate active: 2026-05-05 UTC+8', ts: now },
        { id: 'alert-004', severity: 'info', message: 'Naming validation passed: 0 violations', ts: now },
      ],
    },
  };

  return NextResponse.json({ success: true, data: overview });
}

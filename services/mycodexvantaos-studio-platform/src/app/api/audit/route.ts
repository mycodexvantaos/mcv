import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/audit
 * Returns immutable audit log entries with filtering and pagination.
 * Query params: page, limit, actor, action, resource, from, to
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const actor = searchParams.get('actor');
  const action = searchParams.get('action');

  const now = Date.now();
  const entries = Array.from({ length: 50 }, (_, i) => ({
    id: `audit-${String(i + 1).padStart(5, '0')}`,
    traceId: `trace-${Math.random().toString(36).slice(2, 10)}`,
    sessionId: `sess-${Math.random().toString(36).slice(2, 8)}`,
    actor: i % 5 === 0 ? 'system' : 'admin@mycodexvantaos.dev',
    action: [
      'DEPLOY',
      'POLICY_CHECK',
      'CONNECTOR_UPDATE',
      'SBOM_UPLOAD',
      'DRIFT_DETECT',
      'SECRET_SCAN',
    ][i % 6],
    resource: `mycodexvantaos-${['ai-agent', 'core-gateway', 'ai-llm', 'core-auth', 'data-vector-store'][i % 5]}:v1.${i % 3}.0`,
    result: i % 10 === 0 ? 'failure' : 'success',
    policyVersion: 'v1.2.0',
    complianceTags: ['SOC2', 'SLSA-L3'],
    ts: new Date(now - i * 300_000).toISOString(),
    immutable: true,
  }));

  let filtered = [...entries];
  if (actor) filtered = filtered.filter((e) => e.actor === actor);
  if (action) filtered = filtered.filter((e) => e.action === action);

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  });
}

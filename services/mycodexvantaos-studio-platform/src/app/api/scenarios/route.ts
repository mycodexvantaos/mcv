import { NextRequest, NextResponse } from 'next/server';

const SCENARIOS = [
  {
    id: 'scn-001',
    name: 'High-Load Inference Burst',
    category: 'performance',
    severity: 'high',
    description:
      'Simulates 10x normal inference traffic to test auto-scaling and circuit breaker behavior.',
    status: 'ready',
    lastRun: '2026-05-04T10:00:00Z',
    passRate: 98.5,
  },
  {
    id: 'scn-002',
    name: 'Connector Failover',
    category: 'resilience',
    severity: 'critical',
    description:
      'Tests graceful degradation when primary PostgreSQL connector becomes unavailable.',
    status: 'ready',
    lastRun: '2026-05-03T14:30:00Z',
    passRate: 100,
  },
  {
    id: 'scn-003',
    name: 'SBOM Attestation Failure',
    category: 'security',
    severity: 'critical',
    description: 'Verifies that deployment is blocked when SBOM signature verification fails.',
    status: 'ready',
    lastRun: '2026-05-02T09:15:00Z',
    passRate: 100,
  },
  {
    id: 'scn-004',
    name: 'Multi-Region Drift Detection',
    category: 'gitops',
    severity: 'medium',
    description: 'Detects configuration drift across all edge nodes and triggers ArgoCD sync.',
    status: 'running',
    lastRun: null,
    passRate: null,
  },
  {
    id: 'scn-005',
    name: 'AI Agent Memory Overflow',
    category: 'ai',
    severity: 'medium',
    description: 'Tests memory management when AI agent context exceeds pgvector capacity limits.',
    status: 'ready',
    lastRun: '2026-05-01T16:00:00Z',
    passRate: 95.2,
  },
];

/** GET /api/scenarios — list all scenarios */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  let result = [...SCENARIOS];
  if (category) result = result.filter((s) => s.category === category);
  if (status) result = result.filter((s) => s.status === status);

  return NextResponse.json({ success: true, data: result, total: result.length });
}

/** POST /api/scenarios — create a new scenario */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, severity, description } = body;

  if (!name || !category) {
    return NextResponse.json(
      { success: false, error: 'name and category are required' },
      { status: 400 }
    );
  }

  const newScenario = {
    id: `scn-${String(SCENARIOS.length + 1).padStart(3, '0')}`,
    name,
    category,
    severity: severity ?? 'medium',
    description: description ?? '',
    status: 'draft',
    lastRun: null,
    passRate: null,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: newScenario }, { status: 201 });
}

/** POST /api/scenarios/run — trigger a scenario run */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) {
    return NextResponse.json(
      { success: false, error: `Scenario '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { ...scenario, status: 'running', startedAt: new Date().toISOString() },
  });
}

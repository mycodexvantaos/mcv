import { NextRequest, NextResponse } from 'next/server';

const DECISION_TEMPLATES = [
  { id: 'dec-001', title: 'LLM Provider Selection', domain: 'ai', description: 'Guides selection of optimal LLM provider based on cost, latency, context window, and capability requirements.', factors: ['cost', 'latency', 'context-window', 'capability', 'data-residency'], status: 'published' },
  { id: 'dec-002', title: 'Database Technology Selection', domain: 'data', description: 'Decision framework for choosing between PostgreSQL, MongoDB, Redis, and vector databases.', factors: ['query-pattern', 'scale', 'consistency', 'latency', 'cost'], status: 'published' },
  { id: 'dec-003', title: 'Deployment Strategy Selection', domain: 'devops', description: 'Guides choice between rolling, blue-green, canary, and feature-flag deployment strategies.', factors: ['risk-tolerance', 'rollback-speed', 'traffic-volume', 'team-size'], status: 'published' },
  { id: 'dec-004', title: 'Auth Provider Selection', domain: 'security', description: 'Framework for selecting between Keycloak, Supabase Auth, and custom JWT implementations.', factors: ['compliance', 'sso-requirements', 'user-volume', 'self-hosted'], status: 'draft' },
];

/** GET /api/decisions — list decision guide templates */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');

  let result = [...DECISION_TEMPLATES];
  if (domain) result = result.filter(d => d.domain === domain);

  return NextResponse.json({ success: true, data: result, total: result.length });
}

/** POST /api/decisions/generate — AI-powered decision guide generation */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { context, requirements, domain } = body;

  if (!context || !domain) {
    return NextResponse.json({ success: false, error: 'context and domain are required' }, { status: 400 });
  }

  // Structured decision guide output (in production, this would call Genkit AI flow)
  const guide = {
    id: `dec-gen-${Date.now()}`,
    domain,
    context,
    requirements: requirements ?? [],
    generatedAt: new Date().toISOString(),
    recommendation: {
      primary: 'Based on your requirements, the recommended approach is...',
      alternatives: ['Alternative A: ...', 'Alternative B: ...'],
      tradeoffs: [
        { option: 'Primary', pros: ['Lower cost', 'Better latency'], cons: ['Limited context window'] },
        { option: 'Alternative A', pros: ['Larger context window'], cons: ['Higher cost'] },
      ],
    },
    complianceNotes: ['GDPR: Data residency must be configured', 'SOC2: Audit logging required'],
    nextSteps: ['Review tradeoffs with team', 'Run scenario matrix', 'Validate with policy check'],
    aiModel: 'mycodexvantaos-ai-agent',
    policyVersion: 'v1.2.0',
  };

  return NextResponse.json({ success: true, data: guide }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';

const ROUTING_CONFIG = {
  strategy: 'cost-latency-balanced',
  fallbackChain: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2-5-flash', 'llama-3-70b'],
  rules: [
    {
      id: 'rule-001',
      name: 'Code tasks → GPT-4o',
      condition: 'capability == "code"',
      targetModel: 'gpt-4o',
      priority: 1,
      enabled: true,
    },
    {
      id: 'rule-002',
      name: 'Long context → Gemini',
      condition: 'tokenCount > 32000',
      targetModel: 'gemini-2-5-flash',
      priority: 2,
      enabled: true,
    },
    {
      id: 'rule-003',
      name: 'Reasoning → DeepSeek R1',
      condition: 'capability == "reasoning"',
      targetModel: 'deepseek-r1',
      priority: 3,
      enabled: true,
    },
    {
      id: 'rule-004',
      name: 'Local-only mode',
      condition: 'env == "air-gapped"',
      targetModel: 'llama-3-70b',
      priority: 4,
      enabled: false,
    },
    {
      id: 'rule-005',
      name: 'Cost cap fallback',
      condition: 'costPer1kTokens > 0.004',
      targetModel: 'gemini-2-5-flash',
      priority: 5,
      enabled: true,
    },
  ],
  loadBalancing: {
    enabled: true,
    algorithm: 'weighted-round-robin',
    weights: { 'gpt-4o': 40, 'claude-3-5-sonnet': 30, 'gemini-2-5-flash': 30 },
  },
  circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 30_000 },
  updatedAt: new Date().toISOString(),
};

/** GET /api/inference/routing — get current routing config */
export async function GET() {
  return NextResponse.json({ success: true, data: ROUTING_CONFIG });
}

/** PUT /api/inference/routing — update routing config */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updated = { ...ROUTING_CONFIG, ...body, updatedAt: new Date().toISOString() };
  return NextResponse.json({ success: true, data: updated });
}

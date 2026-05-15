import { NextResponse } from 'next/server';

// MyCodeXvantaOS Admin Dashboard - Inference Routing API
// Model routing configuration and load balancing rules

interface RoutingRule {
  id: string;
  name: string;
  model: string;
  provider: string;
  weight: number;
  priority: number;
  enabled: boolean;
  conditions: {
    type: 'token_count' | 'latency' | 'cost' | 'availability';
    operator: 'lt' | 'gt' | 'eq' | 'between';
    value: number | [number, number];
  }[];
  fallbackModel: string | null;
}

const routingRules: RoutingRule[] = [
  {
    id: 'route-gpt4o',
    name: 'GPT-4o Primary',
    model: 'gpt-4o',
    provider: 'openai',
    weight: 30,
    priority: 1,
    enabled: true,
    conditions: [
      { type: 'token_count', operator: 'lt', value: 128000 },
      { type: 'latency', operator: 'lt', value: 300 },
    ],
    fallbackModel: 'claude-3.5-sonnet',
  },
  {
    id: 'route-gpt4o-mini',
    name: 'GPT-4o Mini Fast',
    model: 'gpt-4o-mini',
    provider: 'openai',
    weight: 25,
    priority: 2,
    enabled: true,
    conditions: [
      { type: 'token_count', operator: 'lt', value: 128000 },
      { type: 'cost', operator: 'lt', value: 1.0 },
    ],
    fallbackModel: 'gemini-1.5-flash',
  },
  {
    id: 'route-claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    model: 'claude-3.5-sonnet',
    provider: 'anthropic',
    weight: 20,
    priority: 2,
    enabled: true,
    conditions: [{ type: 'token_count', operator: 'lt', value: 200000 }],
    fallbackModel: 'gpt-4o',
  },
  {
    id: 'route-claude-haiku',
    name: 'Claude 3 Haiku Budget',
    model: 'claude-3-haiku',
    provider: 'anthropic',
    weight: 10,
    priority: 3,
    enabled: true,
    conditions: [
      { type: 'cost', operator: 'lt', value: 0.5 },
      { type: 'latency', operator: 'lt', value: 100 },
    ],
    fallbackModel: 'gpt-4o-mini',
  },
  {
    id: 'route-gemini-flash',
    name: 'Gemini Flash Low-Cost',
    model: 'gemini-1.5-flash',
    provider: 'google',
    weight: 10,
    priority: 3,
    enabled: true,
    conditions: [
      { type: 'token_count', operator: 'lt', value: 1000000 },
      { type: 'cost', operator: 'lt', value: 0.5 },
    ],
    fallbackModel: 'claude-3-haiku',
  },
  {
    id: 'route-gemini-pro',
    name: 'Gemini Pro Long-Context',
    model: 'gemini-1.5-pro',
    provider: 'google',
    weight: 5,
    priority: 4,
    enabled: true,
    conditions: [{ type: 'token_count', operator: 'gt', value: 128000 }],
    fallbackModel: 'claude-3.5-sonnet',
  },
];

export async function GET() {
  return NextResponse.json({
    rules: routingRules,
    strategy: 'weighted-priority',
    totalWeight: routingRules.filter((r) => r.enabled).reduce((sum, r) => sum + r.weight, 0),
    activeRules: routingRules.filter((r) => r.enabled).length,
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { ruleId, ...updates } = body;

  const rule = routingRules.find((r) => r.id === ruleId);
  if (!rule) {
    return NextResponse.json({ error: 'Routing rule not found' }, { status: 404 });
  }

  Object.assign(rule, updates);
  return NextResponse.json({ success: true, rule });
}

export async function POST(request: Request) {
  const body = await request.json();

  const newRule: RoutingRule = {
    id: `route-${Date.now()}`,
    name: body.name || 'New Routing Rule',
    model: body.model || '',
    provider: body.provider || '',
    weight: body.weight || 10,
    priority: body.priority || 5,
    enabled: body.enabled !== undefined ? body.enabled : true,
    conditions: body.conditions || [],
    fallbackModel: body.fallbackModel || null,
  };

  routingRules.push(newRule);
  return NextResponse.json(newRule, { status: 201 });
}

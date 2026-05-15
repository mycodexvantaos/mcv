import { NextResponse } from 'next/server';

/**
 * GET /api/inference/models
 * Returns the list of registered LLM models available in the inference gateway.
 */
export async function GET() {
  const models = [
    {
      id: 'gpt-4o',
      provider: 'openai',
      displayName: 'GPT-4o',
      contextWindow: 128_000,
      status: 'active',
      latencyP95Ms: 1_200,
      costPer1kTokens: 0.005,
      capabilities: ['chat', 'code', 'vision'],
      routing: 'primary',
    },
    {
      id: 'claude-3-5-sonnet',
      provider: 'anthropic',
      displayName: 'Claude 3.5 Sonnet',
      contextWindow: 200_000,
      status: 'active',
      latencyP95Ms: 980,
      costPer1kTokens: 0.003,
      capabilities: ['chat', 'code', 'analysis'],
      routing: 'fallback',
    },
    {
      id: 'gemini-2-5-flash',
      provider: 'google',
      displayName: 'Gemini 2.5 Flash',
      contextWindow: 1_000_000,
      status: 'active',
      latencyP95Ms: 650,
      costPer1kTokens: 0.001,
      capabilities: ['chat', 'code', 'vision', 'long-context'],
      routing: 'cost-optimized',
    },
    {
      id: 'llama-3-70b',
      provider: 'ollama',
      displayName: 'Llama 3 70B (Local)',
      contextWindow: 8_192,
      status: 'active',
      latencyP95Ms: 2_100,
      costPer1kTokens: 0,
      capabilities: ['chat', 'code'],
      routing: 'local-only',
    },
    {
      id: 'deepseek-r1',
      provider: 'deepseek',
      displayName: 'DeepSeek R1',
      contextWindow: 64_000,
      status: 'standby',
      latencyP95Ms: 1_500,
      costPer1kTokens: 0.0014,
      capabilities: ['reasoning', 'code', 'math'],
      routing: 'reasoning',
    },
  ];

  return NextResponse.json({ success: true, data: models, total: models.length });
}

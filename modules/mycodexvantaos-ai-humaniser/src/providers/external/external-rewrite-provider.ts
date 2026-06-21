/**
 * @fileoverview External Rewrite Provider — LLM-powered humanisation
 *
 * Implements IRewriteProvider using an external LLM API.
 * Provides higher-quality rewrites in connected mode.
 */

import type {
  IRewriteProvider,
  HumaniserResult,
  HumaniserRequest,
  ProviderSource,
} from '../../types';
import { humaniseNative } from '../../core/rewriter';

interface ExternalRewriteConfig {
  endpoint: string;
  apiKey: string;
  model?: string;
}

export class ExternalRewriteProvider implements IRewriteProvider {
  readonly capability = 'rewrite';
  readonly source: ProviderSource = 'external';

  private config: ExternalRewriteConfig | null = null;
  private initialized = false;

  async initialize(config?: ExternalRewriteConfig): Promise<void> {
    if (config) {
      this.config = config;
    }
    this.initialized = true;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config) return false;
    try {
      const response = await fetch(`${this.config.endpoint}/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async shutdown(): Promise<void> {
    this.config = null;
    this.initialized = false;
  }

  async humanise(request: HumaniserRequest): Promise<HumaniserResult> {
    if (!this.initialized || !this.config) {
      return humaniseNative(request);
    }

    try {
      const prompt = buildRewritePrompt(request);
      const response = await callRewriteLLM(this.config, prompt);
      return parseRewriteResponse(request, response);
    } catch (error) {
      console.warn('External rewrite failed, falling back to native:', error);
      return humaniseNative(request);
    }
  }
}

function buildRewritePrompt(request: HumaniserRequest): string {
  const flaggedSentences = request.detectionResult.sentences
    .filter((s) => s.label === 'ai' || s.label === 'mixed')
    .map((s) => `"${s.text}" (AI score: ${(s.aiScore * 100).toFixed(0)}%)`)
    .join('\n');

  return `Rewrite the following AI-flagged sentences to sound more natural and human-written while preserving their meaning. Style: ${request.style || 'neutral'}. Preserve technical terms: ${request.preserveTechnicalTerms !== false}.

Flagged sentences:
${flaggedSentences}

Original full text for context:
"""
${request.originalText}
"""

For each rewritten sentence, explain what changed and why. Respond in JSON:
{
  "rewrites": [
    {
      "original": "original sentence",
      "rewritten": "rewritten sentence",
      "changes": ["change description"],
      "ai_score_before": 0.0-1.0,
      "ai_score_after": 0.0-1.0
    }
  ],
  "full_rewritten_text": "complete rewritten text",
  "overall_improvement": "description of overall changes"
}`;
}

async function callRewriteLLM(config: ExternalRewriteConfig, prompt: string): Promise<string> {
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseRewriteResponse(request: HumaniserRequest, llmResponse: string): HumaniserResult {
  try {
    const parsed = JSON.parse(llmResponse);
    const startTime = Date.now();

    const sentenceRewrites = (parsed.rewrites || []).map((r: any, i: number) => ({
      index: i,
      original: r.original || '',
      rewritten: r.rewritten || r.original || '',
      originalAiScore: r.ai_score_before || 0.7,
      newAiScore: r.ai_score_after || 0.3,
      improvement: (r.ai_score_before || 0.7) - (r.ai_score_after || 0.3),
      changes: r.changes || [],
    }));

    return {
      id: crypto.randomUUID?.() || String(Date.now()),
      humanisedText: parsed.full_rewritten_text || request.originalText,
      sentenceRewrites,
      changeSummary: {
        sentencesRewritten: sentenceRewrites.filter((r: any) => r.improvement > 0).length,
        sentencesUnchanged: sentenceRewrites.filter((r: any) => r.improvement === 0).length,
        avgScoreImprovement: 0,
        overallScoreChange: { before: request.detectionResult.aiScore, after: 0 },
        changeCategories: [],
      },
      updatedDetection: request.detectionResult, // Simplified
      comparison: {
        originalHighlighted: [],
        humanisedHighlighted: [],
        diffs: [],
      },
      timestamp: new Date().toISOString(),
      providerSource: 'external' as ProviderSource,
      processingTimeMs: Date.now() - startTime,
    };
  } catch {
    return humaniseNative(request);
  }
}

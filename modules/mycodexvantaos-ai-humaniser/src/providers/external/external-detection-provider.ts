/**
 * @fileoverview External Detection Provider — LLM-powered AI content detection
 *
 * Implements IDetectionProvider using an external LLM API (OpenAI-compatible).
 * Used in connected mode for enhanced detection accuracy.
 * Falls back to native detection when unavailable.
 */

import type { IDetectionProvider, DetectionResult, InputSource, ProviderSource } from '../../types';
import { ContentLabel } from '../../types';
import { detectNative } from '../../core/detector';

interface ExternalDetectionConfig {
  endpoint: string;
  apiKey: string;
  model?: string;
}

export class ExternalDetectionProvider implements IDetectionProvider {
  readonly capability = 'detection';
  readonly source: ProviderSource = 'external';

  private config: ExternalDetectionConfig | null = null;
  private initialized = false;

  async initialize(config?: ExternalDetectionConfig): Promise<void> {
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

  async detect(text: string, source?: InputSource): Promise<DetectionResult> {
    if (!this.initialized || !this.config) {
      // Fallback to native detection
      return detectNative(text, source);
    }

    try {
      const prompt = buildDetectionPrompt(text);
      const response = await callLLM(this.config, prompt);
      return parseDetectionResponse(text, response, source);
    } catch (error) {
      // Fallback to native on error
      console.warn('External detection failed, falling back to native:', error);
      return detectNative(text, source);
    }
  }
}

/**
 * Build a detection prompt for the LLM
 */
function buildDetectionPrompt(text: string): string {
  return `Analyze the following text and determine if it was written by AI or a human. For each sentence, provide:
1. A classification: "ai", "human", "mixed", or "uncertain"
2. A confidence score from 0 to 1
3. A brief explanation

Respond in JSON format:
{
  "sentences": [
    {
      "text": "sentence text",
      "label": "ai|human|mixed|uncertain",
      "confidence": 0.0-1.0,
      "explanation": "brief explanation"
    }
  ],
  "overall_label": "ai|human|mixed|uncertain",
  "overall_confidence": 0.0-1.0,
  "overall_explanation": "brief overall explanation"
}

Text to analyze:
"""
${text}
"""`;
}

/**
 * Call the LLM API
 */
async function callLLM(config: ExternalDetectionConfig, prompt: string): Promise<string> {
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Parse the LLM response into a DetectionResult
 */
function parseDetectionResponse(
  originalText: string,
  llmResponse: string,
  source?: InputSource
): DetectionResult {
  try {
    const parsed = JSON.parse(llmResponse);
    // Convert LLM response to DetectionResult format
    // This is a simplified mapping — production would validate more thoroughly
    const startTime = Date.now();

    return {
      id: crypto.randomUUID?.() || String(Date.now()),
      label: parsed.overall_label || ContentLabel.UNCERTAIN,
      confidence: parsed.overall_confidence || 0.5,
      aiScore:
        parsed.overall_label === ContentLabel.AI
          ? parsed.overall_confidence
          : 1 - parsed.overall_confidence,
      humanScore:
        parsed.overall_label === ContentLabel.HUMAN
          ? parsed.overall_confidence
          : parsed.overall_confidence * 0.5,
      sentences: (parsed.sentences || []).map((s: any, i: number) => ({
        text: s.text || '',
        index: i,
        label: s.label || ContentLabel.UNCERTAIN,
        confidence: s.confidence || 0.5,
        aiScore: s.label === ContentLabel.AI ? s.confidence : 1 - s.confidence,
        humanScore: s.label === ContentLabel.HUMAN ? s.confidence : 1 - s.confidence,
        features: {
          avgWordLength: 0,
          wordCount: 0,
          lexicalDiversity: 0,
          avgWordFrequency: 0,
          punctuationDensity: 0,
          complexity: 0,
          repetitionScore: 0,
          perplexityProxy: 0,
          transitionSmoothness: 0,
          vocabularyRichness: 0,
        },
        explanation: s.explanation || '',
      })),
      stats: {
        totalSentences: parsed.sentences?.length || 0,
        aiSentences: parsed.sentences?.filter((s: any) => s.label === 'ai').length || 0,
        humanSentences: parsed.sentences?.filter((s: any) => s.label === 'human').length || 0,
        uncertainSentences:
          parsed.sentences?.filter((s: any) => s.label === 'uncertain' || s.label === 'mixed')
            .length || 0,
        avgConfidence: 0,
        maxAiScore: 0,
        minAiScore: 0,
        stdDevAiScore: 0,
      },
      explanation: parsed.overall_explanation || '',
      timestamp: new Date().toISOString(),
      providerSource: 'external' as ProviderSource,
      processingTimeMs: Date.now() - startTime,
    };
  } catch {
    // If parsing fails, fall back to native
    return detectNative(originalText, source);
  }
}

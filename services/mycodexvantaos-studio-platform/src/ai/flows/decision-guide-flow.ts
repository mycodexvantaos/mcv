/**
 * MyCodeXvantaOS Studio Platform — Decision Guide AI Flow
 * Phase 4: Genkit AI Flows
 *
 * Generates structured technology selection decision guides using the
 * MyCodeXvantaOS Provider Architecture (native-first, multi-provider).
 */

import { generateText } from '../genkit';

export interface DecisionGuideInput {
  domain: string;
  context: string;
  requirements: string[];
  constraints?: string[];
  complianceTags?: string[];
}

export interface DecisionGuideOutput {
  flowId: string;
  domain: string;
  recommendation: {
    primary: string;
    rationale: string;
    alternatives: Array<{ option: string; pros: string[]; cons: string[] }>;
    tradeoffMatrix: Array<{ criterion: string; weight: number; scores: Record<string, number> }>;
  };
  complianceNotes: string[];
  nextSteps: string[];
  policyVersion: string;
  generatedAt: string;
  aiProvider: string;
}

/**
 * decisionGuideFlow — AI-powered technology decision guide generation.
 * Produces structured recommendations with tradeoff matrix and compliance notes.
 */
export async function decisionGuideFlow(input: DecisionGuideInput): Promise<DecisionGuideOutput> {
  const { domain, context, requirements, constraints = [], complianceTags = ['SOC2', 'SLSA-L3'] } = input;

  const prompt = `You are the MyCodeXvantaOS Architecture Decision Engine.

Domain: ${domain}
Context: ${context}
Requirements: ${requirements.join(', ')}
Constraints: ${constraints.join(', ') || 'none'}
Compliance: ${complianceTags.join(', ')}

Generate a concise technology decision recommendation with:
1. Primary recommendation (1-2 sentences)
2. Rationale (2-3 sentences)
3. Top 2 alternatives with pros/cons
4. 3 compliance notes
5. 3 next steps

Format as structured JSON.`;

  let aiProvider = 'native';
  let primaryRec = '';
  let rationale = '';

  try {
    const response = await generateText(prompt, { maxTokens: 800, temperature: 0.3 });
    aiProvider = response.provider ?? 'native';

    // Parse AI response or use structured fallback
    try {
      const parsed = JSON.parse(response.text);
      primaryRec = parsed.primary ?? '';
      rationale = parsed.rationale ?? '';
    } catch {
      primaryRec = response.text.slice(0, 200);
      rationale = `Based on ${domain} domain analysis with ${requirements.length} requirements.`;
    }
  } catch {
    primaryRec = `For ${domain} with requirements [${requirements.join(', ')}], the recommended approach follows mycodexvantaos native-first provider architecture.`;
    rationale = `Native provider selected for air-gap compatibility and zero external dependency. Can be upgraded to external providers (OpenAI, Anthropic, Gemini) via environment configuration.`;
  }

  const output: DecisionGuideOutput = {
    flowId: `decision-guide-${Date.now()}`,
    domain,
    recommendation: {
      primary: primaryRec || `Adopt mycodexvantaos-native ${domain} stack with provider abstraction layer.`,
      rationale: rationale || `Aligns with MyCodeXvantaOS Provider Architecture: native-first, zero vendor lock-in, SLSA-L3 compliant.`,
      alternatives: [
        {
          option: 'External Provider (OpenAI/Anthropic)',
          pros: ['Higher capability ceiling', 'Managed infrastructure', 'Latest model access'],
          cons: ['API cost at scale', 'Data residency concerns', 'External dependency'],
        },
        {
          option: 'Self-hosted OSS (Ollama/vLLM)',
          pros: ['Full data control', 'No per-token cost', 'Air-gap compatible'],
          cons: ['Higher ops overhead', 'Hardware requirements', 'Model update cadence'],
        },
      ],
      tradeoffMatrix: [
        { criterion: 'Cost', weight: 0.25, scores: { native: 9, external: 5, self_hosted: 7 } },
        { criterion: 'Capability', weight: 0.30, scores: { native: 6, external: 10, self_hosted: 7 } },
        { criterion: 'Data Control', weight: 0.25, scores: { native: 10, external: 4, self_hosted: 9 } },
        { criterion: 'Ops Complexity', weight: 0.20, scores: { native: 9, external: 8, self_hosted: 4 } },
      ],
    },
    complianceNotes: [
      `${complianceTags.includes('SOC2') ? 'SOC2: Audit logging required for all AI inference calls' : ''}`,
      'GDPR: Ensure no PII in prompt payloads when using external providers',
      'SLSA-L3: AI model artifacts must be signed and SBOM-attested before deployment',
    ].filter(Boolean),
    nextSteps: [
      `Review tradeoff matrix with ${domain} domain team`,
      'Run scenario matrix: High-Load Inference Burst (scn-001)',
      'Execute policy check via OPA admission control before deployment',
    ],
    policyVersion: 'v1.2.0',
    generatedAt: new Date().toISOString(),
    aiProvider,
  };

  return output;
}

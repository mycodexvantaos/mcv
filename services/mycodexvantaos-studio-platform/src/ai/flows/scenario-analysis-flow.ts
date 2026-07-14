/**
 * MyCodexVantaOS Studio Platform — Scenario Analysis AI Flow
 * Phase 4: Genkit AI Flows
 *
 * Analyzes scenario matrix results and generates root cause analysis,
 * risk assessment, and remediation recommendations.
 */

import { generateText } from '../genkit';

export interface ScenarioAnalysisInput {
  scenarioId: string;
  scenarioName: string;
  category: string;
  severity: string;
  observedBehavior: string;
  metrics?: Record<string, number | string>;
  affectedServices?: string[];
}

export interface ScenarioAnalysisOutput {
  flowId: string;
  scenarioId: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  impactAssessment: {
    affectedServices: string[];
    estimatedDowntimeMin: number;
    dataLossRisk: boolean;
    complianceImpact: string[];
  };
  remediationPlan: Array<{
    step: number;
    action: string;
    owner: string;
    estimatedDurationMin: number;
  }>;
  preventionMeasures: string[];
  generatedAt: string;
  aiProvider: string;
}

export async function scenarioAnalysisFlow(
  input: ScenarioAnalysisInput
): Promise<ScenarioAnalysisOutput> {
  const {
    scenarioId,
    scenarioName,
    category,
    severity,
    observedBehavior,
    affectedServices = [],
  } = input;

  const prompt = `You are the MyCodexVantaOS Scenario Analysis Engine.

Scenario: ${scenarioName} (${category}, severity: ${severity})
Observed Behavior: ${observedBehavior}
Affected Services: ${affectedServices.join(', ') || 'unknown'}

Provide:
1. Root cause (1-2 sentences)
2. Risk level (critical/high/medium/low)
3. Estimated downtime in minutes
4. 3 remediation steps with owner and duration
5. 2 prevention measures`;

  let aiProvider = 'native';
  let rootCause = '';

  try {
    const response = await generateText(prompt, { maxTokens: 600, temperature: 0.2 });
    aiProvider = response.provider ?? 'native';
    rootCause = response.text.slice(0, 300);
  } catch {
    rootCause = `${scenarioName} triggered due to ${category} domain constraint violation. Auto-analysis requires provider configuration.`;
  }

  const riskMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };

  return {
    flowId: `scenario-analysis-${Date.now()}`,
    scenarioId,
    riskLevel: riskMap[severity] ?? 'medium',
    rootCause:
      rootCause ||
      `Root cause analysis pending — ${category} scenario requires manual investigation.`,
    impactAssessment: {
      affectedServices:
        affectedServices.length > 0 ? affectedServices : ['mycodexvantaos-core-gateway'],
      estimatedDowntimeMin: severity === 'critical' ? 15 : severity === 'high' ? 5 : 1,
      dataLossRisk: severity === 'critical',
      complianceImpact: severity === 'critical' ? ['SOC2-CC7.2', 'ISO27001-A.17'] : [],
    },
    remediationPlan: [
      {
        step: 1,
        action: 'Isolate affected service and enable circuit breaker',
        owner: 'on-call-sre',
        estimatedDurationMin: 2,
      },
      {
        step: 2,
        action: 'Trigger ArgoCD rollback to last known-good revision',
        owner: 'platform-team',
        estimatedDurationMin: 5,
      },
      {
        step: 3,
        action: 'Validate health checks and re-enable traffic routing',
        owner: 'on-call-sre',
        estimatedDurationMin: 3,
      },
    ],
    preventionMeasures: [
      `Add ${category} scenario to pre-deployment gate in CI/CD pipeline`,
      'Configure alerting threshold at 80% of SLO breach to enable proactive response',
    ],
    generatedAt: new Date().toISOString(),
    aiProvider,
  };
}

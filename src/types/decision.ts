export type ImplementationEffort = 'low' | 'medium' | 'high';
export type DecisionOutcome = 'success' | 'partial' | 'failure';

export interface PreviousDecision {
  scenarioId: string;
  chosenSolutionId: string;
  outcome: DecisionOutcome;
}

export interface DecisionGuideInput {
  scenarioMatrixId: string;
  focusArea?: string;
  constraints?: string[];
  previousDecisions?: PreviousDecision[];
}

export interface Recommendation {
  rank: number;
  solutionId: string;
  solutionName: string;
  overallScore: number;
  confidence: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimatedCost: string;
  implementationEffort: ImplementationEffort;
}

export interface TradeOff {
  dimension: string;
  description: string;
  recommendation: string;
}

export interface DecisionGuideOutput {
  recommendations: Recommendation[];
  tradeOffs: TradeOff[];
  nextSteps: string[];
}

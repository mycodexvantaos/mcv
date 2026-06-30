export type RequirementPriority = "must" | "should" | "nice";

export interface ScenarioRequirement {
  metric: string;
  value: string;
  priority: RequirementPriority;
  weight: number;
}

export interface ScenarioConstraint {
  type: string;
  value: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  domain: string;
  requirements: ScenarioRequirement[];
  constraints: ScenarioConstraint[];
}

export interface Solution {
  id: string;
  name: string;
  provider: string;
  category: "inference" | "storage" | "compute" | "networking";
  capabilities: string[];
  limitations: string[];
}

export interface ScenarioMatrix {
  id: string;
  name: string;
  domain: string;
  scenarios: Scenario[];
  solutions: Solution[];
  scores: Record<string, Record<string, number>>;
  aiInsights: string;
  generatedAt: string;
  generatedBy: string;
}

export type ScenarioWizardStep = "domain" | "requirements" | "constraints" | "priority";

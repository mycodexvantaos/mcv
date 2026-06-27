/**
 * @fileOverview Client-safe stubs for AI flow functions.
 *
 * AI flow files use genkit and server-side APIs that cannot be bundled
 * for the client. With `output: "export"` (static export), server actions
 * are also not supported. This module provides:
 *
 * 1. Type definitions matching the AI flow output schemas (for client use)
 * 2. Stub implementations that throw descriptive errors indicating
 *    the AI features require a server deployment
 *
 * When deployed as a static site (GitHub Pages), AI features are not available.
 * When running on a Node.js server with proper API keys, the actual flow
 * implementations in src/ai/flows/ will be used via API routes.
 */

// ============================================================
// Type Definitions (matching AI flow output schemas)
// ============================================================

// --- Advanced Analysis Flow ---
export interface AdvancedAnalysisInput {
  mode: string;
  contextDescription: string;
  mockDataSeed?: string;
}

export interface AdvancedAnalysisOutput {
  summary: string;
  findings: Array<{
    source: string;
    content: unknown;
    relevance?: number;
    pageReference?: string;
  }>;
  recommendations: string[];
  metadata?: Record<string, unknown>;
}

// --- Zero-Shot Tool Forge Flow ---
export interface ToolForgeInput {
  environmentDescription: string;
  taskGoal: string;
  previousErrors?: string;
}

export interface ToolForgeOutput {
  generatedCode: string;
  reverseEngineeringReport: string;
  selfCorrectionLog: string;
  safetyAudit: string;
}

// --- Analyze Architecture for Risks Flow ---
export interface AnalyzeArchitectureForRisksInput {
  architectureDefinition: string;
  ciCdPipelineConfig: string;
}

export interface AnalyzeArchitectureForRisksOutput {
  risks: Array<{
    type: string;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
    recommendation: string;
  }>;
  vulnerabilities: Array<{
    description: string;
    cvssScore?: number;
    remediationSuggestion: string;
  }>;
  complianceIssues: Array<{
    ruleId: string;
    description: string;
    complianceStandard: string;
    impact: string;
  }>;
  overallAssessment: string;
}

// --- Global Pulse Sensing Flow ---
export interface PulseSensingInput {
  region?: string;
  dataStreams: string[];
}

export interface PulseSensingOutput {
  globalSentiment: string;
  detectedAnomalies: Array<{
    source: string;
    anomaly_score: number;
    description: string;
    suggestedAction: string;
  }>;
  emergentGoals: Array<{
    task_id: string;
    description: string;
    expertise_required: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

// --- Suggest Architecture Refinements Flow ---
export interface SuggestArchitectureRefinementsInput {
  currentArchitectureDescription: string;
  gitlabCiCdConfiguration?: string;
  architecturalGoals: string;
  pastIncidentsSummary?: string;
}

export interface SuggestArchitectureRefinementsOutput {
  suggestions: Array<{
    category: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
    gitlabImplications: string;
    reasoning: string;
  }>;
  overallSummary: string;
}

// --- Generate CI/CD Pipeline Flow ---
export interface GenerateCiCdPipelineInput {
  architectureDescription: string;
  deploymentStrategy: string;
  additionalRequirements?: string;
}

export interface GenerateCiCdPipelineOutput {
  gitlabCiCdYaml: string;
  validationReport: string;
}

// --- Validate and Suggest Checklists Flow ---
export interface ValidateAndSuggestChecklistsInput {
  architectureDefinition: string;
  ciCdPipelineConfig: string;
  customChecklist: string[];
}

export interface ValidateAndSuggestChecklistsOutput {
  validationResults: Array<{
    policy: string;
    status: 'ADHERENT' | 'VIOLATED' | 'N/A';
    details: string;
  }>;
  suggestedPolicies: Array<{
    policy: string;
    reason: string;
  }>;
}

// --- Conversational AI Assistant Flow ---
export interface ConversationalAiAssistantInput {
  query: string;
  codeSnippet?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  isOffline?: boolean;
}

export interface ConversationalAiAssistantOutput {
  answer: string;
  internalLog?: string;
  actionsTaken?: string[];
}

// --- Research Data Summarization Flow ---
export interface ResearchDataSummarizationInput {
  researchData: string;
}

export interface ResearchDataSummarizationOutput {
  summary: string;
}

// --- Vulnerability Scanner Flow ---
export interface ScanForVulnerabilitiesInput {
  packageJsonContent: string;
  isOffline?: boolean;
}

export interface ScanForVulnerabilitiesOutput {
  vulnerabilities: Array<{
    id: string;
    packageName: string;
    version: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    cve: string;
    description: string;
    remediation: string;
  }>;
  auditMode?: string;
}

// --- Delegate Coding Task Flow ---
export interface DelegateCodingTaskInput {
  taskDescription: string;
  codeContext?: string;
  filePath?: string;
  taskType?: 'generation' | 'refactoring' | 'testing' | 'documentation' | 'optimization';
  isOffline?: boolean;
}

export interface DelegateCodingTaskOutput {
  generatedCode: string;
  explanation: string;
  agentRole: string;
}

// ============================================================
// Stub Implementations
// ============================================================

const NOT_AVAILABLE_MSG =
  'AI features are not available in the static site deployment. ' +
  'Deploy to a Node.js server with GEMINI_API_KEY to enable AI capabilities.';

function createUnavailableStub<T>(name: string): (input: unknown) => Promise<T> {
  return async (_input: unknown): Promise<T> => {
    throw new Error(`${name}: ${NOT_AVAILABLE_MSG}`);
  };
}

export const runAdvancedAnalysis =
  createUnavailableStub<AdvancedAnalysisOutput>('runAdvancedAnalysis');

export const forgeDynamicTool = createUnavailableStub<ToolForgeOutput>('forgeDynamicTool');

export const analyzeArchitectureForRisks = createUnavailableStub<AnalyzeArchitectureForRisksOutput>(
  'analyzeArchitectureForRisks'
);

export const senseGlobalPulse = createUnavailableStub<PulseSensingOutput>('senseGlobalPulse');

export const suggestArchitectureRefinements =
  createUnavailableStub<SuggestArchitectureRefinementsOutput>('suggestArchitectureRefinements');

export const generateCiCdPipeline =
  createUnavailableStub<GenerateCiCdPipelineOutput>('generateCiCdPipeline');

export const validateAndSuggestChecklists =
  createUnavailableStub<ValidateAndSuggestChecklistsOutput>('validateAndSuggestChecklists');

export const conversationalAiAssistant = createUnavailableStub<ConversationalAiAssistantOutput>(
  'conversationalAiAssistant'
);

export const summarizeResearchData =
  createUnavailableStub<ResearchDataSummarizationOutput>('summarizeResearchData');

export const scanForVulnerabilities =
  createUnavailableStub<ScanForVulnerabilitiesOutput>('scanForVulnerabilities');

export const delegateCodingTask =
  createUnavailableStub<DelegateCodingTaskOutput>('delegateCodingTask');

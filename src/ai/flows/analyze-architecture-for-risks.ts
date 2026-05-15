'use server';
/**
 * @fileOverview An AI agent for analyzing system architectures and CI/CD pipelines for risks, vulnerabilities, and compliance issues.
 *
 * - analyzeArchitectureForRisks - A function that handles the architecture analysis process.
 * - AnalyzeArchitectureForRisksInput - The input type for the analyzeArchitectureForRisks function.
 * - AnalyzeArchitectureForRisksOutput - The return type for the analyzeArchitectureForRisks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeArchitectureForRisksInputSchema = z.object({
  architectureDefinition: z
    .string()
    .describe(
      'A detailed description of the system architecture, which can include textual explanations, PlantUML, or Mermaid diagram code.'
    ),
  ciCdPipelineConfig: z
    .string()
    .describe(
      'The GitLab CI/CD pipeline configuration in YAML format, or a textual description of the pipeline steps and stages.'
    ),
});
export type AnalyzeArchitectureForRisksInput = z.infer<
  typeof AnalyzeArchitectureForRisksInputSchema
>;

const AnalyzeArchitectureForRisksOutputSchema = z.object({
  risks: z
    .array(
      z.object({
        type: z
          .string()
          .describe('The type of risk (e.g., security, performance, reliability, operational).'),
        description: z.string().describe('A detailed description of the risk.'),
        severity: z
          .enum(['Critical', 'High', 'Medium', 'Low', 'Informational'])
          .describe('The severity level of the risk.'),
        recommendation: z.string().describe('Suggested actions to mitigate the risk.'),
      })
    )
    .describe('A list of identified architectural risks.'),
  vulnerabilities: z
    .array(
      z.object({
        description: z.string().describe('A detailed description of the vulnerability.'),
        cvssScore: z
          .number()
          .optional()
          .describe('The CVSS score if applicable for security vulnerabilities.'),
        remediationSuggestion: z
          .string()
          .describe('Suggested actions to remediate the vulnerability.'),
      })
    )
    .describe('A list of identified security vulnerabilities.'),
  complianceIssues: z
    .array(
      z.object({
        ruleId: z.string().describe('The identifier for the compliance rule or standard violated.'),
        description: z.string().describe('A detailed description of the compliance issue.'),
        complianceStandard: z
          .string()
          .describe('The compliance standard affected (e.g., ISO 27001, SOC 2, GDPR).'),
        impact: z.string().describe('The potential impact of the compliance deviation.'),
      })
    )
    .describe('A list of identified compliance deviations.'),
  overallAssessment: z
    .string()
    .describe(
      'A comprehensive summary of the analysis, highlighting key findings and an overall risk posture.'
    ),
});
export type AnalyzeArchitectureForRisksOutput = z.infer<
  typeof AnalyzeArchitectureForRisksOutputSchema
>;

export async function analyzeArchitectureForRisks(
  input: AnalyzeArchitectureForRisksInput
): Promise<AnalyzeArchitectureForRisksOutput> {
  return analyzeArchitectureForRisksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeArchitectureForRisksPrompt',
  input: { schema: AnalyzeArchitectureForRisksInputSchema },
  output: { schema: AnalyzeArchitectureForRisksOutputSchema },
  prompt: `You are an expert architect and CI/CD specialist with extreme meticulousness, focused on zero-failure architecture refinement.
Your task is to meticulously analyze the provided system architecture definition and GitLab CI/CD pipeline configuration.
Identify all potential risks, security vulnerabilities, and compliance issues.
For each identified item, provide a clear description, assign a severity (for risks), or a CVSS score (for vulnerabilities if applicable), and suggest concrete recommendations or remediation steps.
Finally, provide an overall assessment of the architecture's resilience and adherence to best practices, with a focus on achieving 'zero-failure' deployments.

Architecture Definition:
{{{architectureDefinition}}}

CI/CD Pipeline Configuration (GitLab):
{{{ciCdPipelineConfig}}}`,
});

const analyzeArchitectureForRisksFlow = ai.defineFlow(
  {
    name: 'analyzeArchitectureForRisksFlow',
    inputSchema: AnalyzeArchitectureForRisksInputSchema,
    outputSchema: AnalyzeArchitectureForRisksOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

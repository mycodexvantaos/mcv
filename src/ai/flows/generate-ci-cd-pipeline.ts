/**
 * @fileOverview A Genkit flow that generates GitLab CI/CD pipeline configurations
 * based on architectural descriptions and deployment strategies, ensuring best practices.
 *
 * - generateCiCdPipeline - A function that handles the generation of GitLab CI/CD pipelines.
 * - GenerateCiCdPipelineInput - The input type for the generateCiCdPipeline function.
 * - GenerateCiCdPipelineOutput - The return type for the generateCiCdPipeline function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateCiCdPipelineInputSchema = z.object({
  architectureDescription: z
    .string()
    .describe(
      "A detailed description of the system architecture, including components, dependencies, data flows, and services."
    ),
  deploymentStrategy: z
    .string()
    .describe(
      "A description of the deployment strategy, such as target environments (e.g., staging, production), containerization approach, or serverless functions."
    ),
  additionalRequirements: z
    .string()
    .optional()
    .describe(
      "Any additional requirements or specific considerations for the CI/CD pipeline, e.g., security scans, specific testing stages, or rollback procedures."
    ),
});
export type GenerateCiCdPipelineInput = z.infer<typeof GenerateCiCdPipelineInputSchema>;

const GenerateCiCdPipelineOutputSchema = z.object({
  gitlabCiCdYaml: z
    .string()
    .describe("The generated GitLab CI/CD pipeline configuration in YAML format."),
  validationReport: z
    .string()
    .describe(
      'A report detailing how the generated pipeline adheres to best practices and "perfect pass" scenarios, identifying any potential areas for improvement or concerns regarding zero-failure deployments.'
    ),
});
export type GenerateCiCdPipelineOutput = z.infer<typeof GenerateCiCdPipelineOutputSchema>;

export async function generateCiCdPipeline(
  input: GenerateCiCdPipelineInput
): Promise<GenerateCiCdPipelineOutput> {
  return generateCiCdPipelineFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateCiCdPipelinePrompt",
  input: { schema: GenerateCiCdPipelineInputSchema },
  output: { schema: GenerateCiCdPipelineOutputSchema },
  prompt: `You are an expert in GitLab CI/CD pipeline configuration and architectural best practices, with a focus on achieving 'perfect pass' rates and 'zero-failure' deployments.

Your task is to generate a comprehensive GitLab CI/CD pipeline configuration in YAML format based on the provided system architecture and deployment strategy. You must also provide a detailed validation report that highlights how the generated pipeline adheres to best practices, ensures robustness, and identifies any potential risks or areas for refinement.

Focus on creating a pipeline that is resilient, efficient, and follows modern CI/CD principles, suitable for enterprise-grade applications. Consider stages for build, test, deploy, and potentially security scanning or environment-specific configurations.

Architecture Description:
{{{architectureDescription}}}

Deployment Strategy:
{{{deploymentStrategy}}}

{{#if additionalRequirements}}
Additional Requirements:
{{{additionalRequirements}}}
{{/if}}

Provide the output as a JSON object with two fields: 'gitlabCiCdYaml' containing the full YAML configuration, and 'validationReport' explaining the design choices and validation against best practices for zero-failure deployments.

Ensure the YAML is valid and complete, ready to be dropped into a .gitlab-ci.yml file.`,
});

const generateCiCdPipelineFlow = ai.defineFlow(
  {
    name: "generateCiCdPipelineFlow",
    inputSchema: GenerateCiCdPipelineInputSchema,
    outputSchema: GenerateCiCdPipelineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate GitLab CI/CD pipeline.");
    }
    return output;
  }
);

'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-powered suggestions
 * for architectural improvements and resilience patterns, tailored to GitLab's capabilities.
 *
 * - suggestArchitectureRefinements - A function that orchestrates the suggestion process.
 * - SuggestArchitectureRefinementsInput - The input type for the suggestArchitectureRefinements function.
 * - SuggestArchitectureRefinementsOutput - The return type for the suggestArchitectureRefinements function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema Definition
const SuggestArchitectureRefinementsInputSchema = z.object({
  currentArchitectureDescription: z
    .string()
    .describe(
      'A detailed description of the current system architecture, including components, their interactions, data flows, and deployment environment.'
    ),
  gitlabCiCdConfiguration: z
    .string()
    .optional()
    .describe(
      'The current GitLab CI/CD pipeline configuration in YAML format, if available, for context on deployment strategies and automation. This helps tailor suggestions to existing CI/CD practices.'
    ),
  architecturalGoals: z
    .string()
    .describe(
      "A clear statement of desired architectural goals and non-functional requirements, such as high availability, scalability, security, performance, cost efficiency, and 'zero-failure' operational targets."
    ),
  pastIncidentsSummary: z
    .string()
    .optional()
    .describe(
      'A summary of past incidents, outages, or recurring issues that the architecture has experienced. This information is crucial for identifying areas needing improvement and suggesting targeted resilience patterns.'
    ),
});
export type SuggestArchitectureRefinementsInput = z.infer<
  typeof SuggestArchitectureRefinementsInputSchema
>;

// Output Schema Definition
const SuggestArchitectureRefinementsOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        category: z
          .string()
          .describe(
            'The category of the suggestion, e.g., "Resilience", "Performance", "Security", "Scalability", "Cost Optimization", "Maintainability", "GitLab CI/CD Enhancement".'
          ),
        description: z
          .string()
          .describe(
            'A detailed explanation of the proposed architectural improvement or resilience pattern, including its technical aspects and how it addresses identified weaknesses.'
          ),
        impact: z
          .enum(['High', 'Medium', 'Low'])
          .describe(
            'The estimated impact level of implementing this suggestion on achieving the architectural goals and a zero-failure state. "High" indicates significant improvement, "Medium" moderate, and "Low" minor.'
          ),
        gitlabImplications: z
          .string()
          .describe(
            'Specific considerations, best practices, or actions related to GitLab for implementing this suggestion. This could include recommended CI/CD pipeline modifications, policy enforcement within GitLab, leveraging specific GitLab features (e.g., environments, reviews, security scanning), or repository structure changes.'
          ),
        reasoning: z
          .string()
          .describe(
            'The rationale behind the suggestion, explaining why it is being made, which architectural principles it aligns with, and how it contributes to the "zero-failure" objective.'
          ),
      })
    )
    .describe(
      'A comprehensive list of AI-powered suggestions for architectural improvements and resilience patterns.'
    ),
  overallSummary: z
    .string()
    .describe(
      'A concise summary highlighting the main architectural refinement themes, key recommendations, and how they align with the "zero-failure" goal and GitLab integration.'
    ),
});
export type SuggestArchitectureRefinementsOutput = z.infer<
  typeof SuggestArchitectureRefinementsOutputSchema
>;

// Wrapper function to call the Genkit flow
export async function suggestArchitectureRefinements(
  input: SuggestArchitectureRefinementsInput
): Promise<SuggestArchitectureRefinementsOutput> {
  return suggestArchitectureRefinementsFlow(input);
}

// Prompt Definition
const suggestArchitectureRefinementsPrompt = ai.definePrompt({
  name: 'suggestArchitectureRefinementsPrompt',
  input: { schema: SuggestArchitectureRefinementsInputSchema },
  output: { schema: SuggestArchitectureRefinementsOutputSchema },
  prompt: `You are an expert architect with extreme meticulousness, specializing in 'zero-failure' architecture refinement for systems integrating seamlessly with GitLab.
Your goal is to provide AI-powered suggestions for architectural improvements and resilience patterns. These suggestions must be practical, actionable, and specifically tailored to leverage or integrate with GitLab's capabilities for CI/CD, version control, and operational best practices.

Consider the following architectural details, goals, and historical context:

Current Architecture Description:
{{{currentArchitectureDescription}}}

Architectural Goals:
{{{architecturalGoals}}}

{{#if gitlabCiCdConfiguration}}
Current GitLab CI/CD Configuration (for context on existing automation and deployment strategies):
{{{gitlabCiCdConfiguration}}}
{{/if}}

{{#if pastIncidentsSummary}}
Summary of Past Incidents/Failures (learn from these to prevent recurrence and enhance resilience):
{{{pastIncidentsSummary}}}
{{/if}}

Based on the information provided, analyze the architecture for potential weaknesses, single points of failure, inefficiencies, or areas that could benefit from enhanced resilience and 'zero-failure' principles.
Propose a list of specific architectural improvements and resilience patterns. For each suggestion:
- Categorize it (e.g., Resilience, Performance, Security, GitLab CI/CD Enhancement).
- Provide a detailed description of the improvement.
- Estimate its impact on achieving the 'zero-failure' goal (High, Medium, Low).
- Clearly explain its implications or integration points with GitLab (e.g., how to implement it using GitLab CI/CD, leveraging GitLab features, defining GitLab policies).
- Provide a clear reasoning for why this suggestion is important and how it contributes to the overall architectural robustness.

Finally, provide an overall summary of your key recommendations and how they align with the 'zero-failure' objective and effective GitLab integration.`,
});

// Genkit Flow Definition
const suggestArchitectureRefinementsFlow = ai.defineFlow(
  {
    name: 'suggestArchitectureRefinementsFlow',
    inputSchema: SuggestArchitectureRefinementsInputSchema,
    outputSchema: SuggestArchitectureRefinementsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestArchitectureRefinementsPrompt(input);
    return output!;
  }
);

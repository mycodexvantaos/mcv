'use server';
/**
 * @fileOverview A Genkit flow for validating architectural and CI/CD configurations against custom 'zero-failure' checklists and suggesting new policy items.
 *
 * - validateAndSuggestChecklists - A function that handles the validation and suggestion process.
 * - ValidateAndSuggestChecklistsInput - The input type for the validateAndSuggestChecklists function.
 * - ValidateAndSuggestChecklistsOutput - The return type for the validateAndSuggestChecklists function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateAndSuggestChecklistsInputSchema = z.object({
  architectureDefinition: z
    .string()
    .describe(
      'The architecture definition, potentially in a format like PlantUML or Mermaid diagram code.'
    ),
  ciCdPipelineConfig: z
    .string()
    .describe('The GitLab CI/CD pipeline configuration in YAML format.'),
  customChecklist: z
    .array(z.string())
    .describe("A list of existing 'zero-failure' checklist items or policies to validate against."),
});
export type ValidateAndSuggestChecklistsInput = z.infer<
  typeof ValidateAndSuggestChecklistsInputSchema
>;

const ValidationFindingSchema = z.object({
  policy: z.string().describe('The checklist policy item being validated.'),
  status: z
    .enum(['ADHERENT', 'VIOLATED', 'N/A'])
    .describe(
      "The adherence status: 'ADHERENT' if the policy is followed, 'VIOLATED' if not, or 'N/A' if not applicable."
    ),
  details: z
    .string()
    .describe(
      'Explanation for the status, including specific reasons for violation if applicable.'
    ),
});

const SuggestedPolicySchema = z.object({
  policy: z.string().describe('A new policy item suggested for the checklist.'),
  reason: z
    .string()
    .describe(
      'The reasoning behind the suggested policy, linking it to zero-failure architecture, security, or efficiency.'
    ),
});

const ValidateAndSuggestChecklistsOutputSchema = z.object({
  validationResults: z
    .array(ValidationFindingSchema)
    .describe('Results of validating the architecture and CI/CD against the custom checklist.'),
  suggestedPolicies: z
    .array(SuggestedPolicySchema)
    .describe('New policy items suggested by AI to enhance zero-failure goals.'),
});
export type ValidateAndSuggestChecklistsOutput = z.infer<
  typeof ValidateAndSuggestChecklistsOutputSchema
>;

export async function validateAndSuggestChecklists(
  input: ValidateAndSuggestChecklistsInput
): Promise<ValidateAndSuggestChecklistsOutput> {
  return validateAndSuggestChecklistsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAndSuggestChecklistsPrompt',
  input: { schema: ValidateAndSuggestChecklistsInputSchema },
  output: { schema: ValidateAndSuggestChecklistsOutputSchema },
  prompt: `You are an expert in 'zero-failure' architecture and GitLab CI/CD, dedicated to meticulous refinement and ensuring perfect pass rates.
Your task is to analyze an architecture definition and its corresponding GitLab CI/CD pipeline configuration against a set of 'zero-failure' policies.
After validation, you must also suggest new policy items to further enhance the system's reliability and security within the GitLab ecosystem.

---
Architecture Definition:
\`\`\`
{{{architectureDefinition}}}
\`\`\`

---
GitLab CI/CD Pipeline Configuration:
\`\`\`
{{{ciCdPipelineConfig}}}
\`\`\`

---
Custom 'Zero-Failure' Checklist:
{{#if customChecklist}}
{{#each customChecklist}}
- {{{this}}}
{{/each}}
{{else}}
No custom checklist items provided.
{{/if}}

---

Based on the provided information, perform the following tasks and output your response in JSON format according to the specified output schema:

1.  **Validate Adherence**: For each item in the 'Custom 'Zero-Failure' Checklist', determine if the 'Architecture Definition' and 'GitLab CI/CD Pipeline Configuration' adhere to it. Provide a 'status' (ADHERENT, VIOLATED, N/A) and 'details' for each finding. If no custom checklist is provided, respond with an empty array for validationResults.

2.  **Suggest New Policies**: Based on your expertise in zero-failure architecture, GitLab best practices, common failure points, and the provided architecture/pipeline, suggest new policy items that could be added to the 'zero-failure' checklist. For each suggestion, provide the 'policy' text and a clear 'reason' explaining its importance. Ensure these suggestions are highly relevant to achieving 'zero-failure' deployments, especially within a GitLab context.
`,
});

const validateAndSuggestChecklistsFlow = ai.defineFlow(
  {
    name: 'validateAndSuggestChecklistsFlow',
    inputSchema: ValidateAndSuggestChecklistsInputSchema,
    outputSchema: ValidateAndSuggestChecklistsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

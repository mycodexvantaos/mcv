/**
 * @fileOverview AI flow for Month 2: Zero-Shot Tool Forge with Self-Correction.
 * Generates executable code based on novel environments and performs self-audit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ToolForgeInputSchema = z.object({
  environmentDescription: z
    .string()
    .describe('API docs, UI structure, or novel environment parameters.'),
  taskGoal: z.string().describe('The specific action to perform.'),
  previousErrors: z
    .string()
    .optional()
    .describe('Error logs from previous execution for self-correction.'),
});

const ToolForgeOutputSchema = z.object({
  generatedCode: z.string().describe('The Python/JS code generated for the task.'),
  reverseEngineeringReport: z.string().describe('How the AI interpreted the target system.'),
  selfCorrectionLog: z
    .string()
    .describe('Steps taken to ensure code validity or fix previous errors.'),
  safetyAudit: z.string().describe('Validation against safety protocols.'),
});

export type ToolForgeInput = z.infer<typeof ToolForgeInputSchema>;
export type ToolForgeOutput = z.infer<typeof ToolForgeOutputSchema>;

export async function forgeDynamicTool(input: ToolForgeInput): Promise<ToolForgeOutput> {
  const { output } = await ai.generate({
    output: { schema: ToolForgeOutputSchema },
    prompt: `You are the Zero-Shot Tool Forge (Month 2 Protocol).
    You have encountered a novel environment. 
    
    Input Parameters:
    Environment: ${input.environmentDescription}
    Goal: ${input.taskGoal}
    ${input.previousErrors ? `Previous Error Context: ${input.previousErrors}` : ''}

    Task:
    1. Reverse engineer the provided specs.
    2. Write a clean, sandboxed Python script to achieve the goal.
    3. If previous errors exist, explain the fix in the self-correction log.
    4. Perform a safety audit to ensure no data escape.`,
  });
  return output!;
}

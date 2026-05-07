'use server';
/**
 * @fileOverview A Genkit flow for delegating specific coding tasks to specialized AI agents.
 *
 * - delegateCodingTask - A function that handles delegating coding tasks like generation, refactoring, or testing.
 * - DelegateCodingTaskInput - The input type for the delegateCodingTask function.
 * - DelegateCodingTaskOutput - The return type for the delegateCodingTask function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DelegateCodingTaskInputSchema = z.object({
  taskDescription: z.string().describe('A clear description of the coding task to be performed by the AI agent (e.g., "generate a React button component", "refactor this function to be more readable", "write unit tests for this class").'),
  codeContext: z.string().optional().describe('The existing code context that the AI agent needs to work with or use as a reference. This can be the content of a file or a relevant code snippet.'),
  filePath: z.string().optional().describe('The logical file path where the code context resides, providing additional context to the AI agent.'),
  taskType: z.enum(['generation', 'refactoring', 'testing', 'documentation', 'optimization']).optional().describe('The type of coding task to perform. Defaults to general code generation if not specified.').default('generation'),
  isOffline: z.boolean().optional().describe('Whether the system is operating in offline mode.'),
});

export type DelegateCodingTaskInput = z.infer<typeof DelegateCodingTaskInputSchema>;

const DelegateCodingTaskOutputSchema = z.object({
  generatedCode: z.string().describe('The resulting code generated or refactored by the AI agent.'),
  explanation: z.string().describe('An explanation of the changes made or the rationale behind the generated code.'),
  agentRole: z.string().describe('The specific role the AI agent adopted for this task (e.g., "Code Generator", "Refactoring Assistant", "Test Writer").'),
});

export type DelegateCodingTaskOutput = z.infer<typeof DelegateCodingTaskOutputSchema>;

export async function delegateCodingTask(input: DelegateCodingTaskInput): Promise<DelegateCodingTaskOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set. Please add it to your .env file to use AI features.');
  }
  try {
    return await delegateCodingTaskFlow(input);
  } catch (e: any) {
    if (e.message.includes('API key not valid')) {
      throw new Error('The provided GEMINI_API_KEY is invalid. Please check your .env file and provide a valid key from Google AI Studio.');
    }
    // Re-throw other errors
    throw e;
  }
}

const agentCodingTaskPrompt = ai.definePrompt({
  name: 'agentCodingTaskPrompt',
  input: { schema: DelegateCodingTaskInputSchema },
  output: { schema: DelegateCodingTaskOutputSchema },
  prompt: `You are a highly specialized AI coding agent, tasked with assisting a developer with various programming tasks. Your current role is to act as a {{{taskType}}} agent.

Your goal is to understand the provided task, utilize the code context (if any), and produce high-quality, clean, and efficient code according to the instructions.

When responding, provide the generated/refactored code and a clear explanation of what you did and why.

--- TASK DETAILS ---
Task Type: {{{taskType}}}
Task Description: {{{taskDescription}}}
File Path: {{{filePath}}}

--- CODE CONTEXT ---
{{#if codeContext}}
${'```'}
{{{codeContext}}}
${'```'}
{{else}}
No code context provided.
{{/if}}

Your output MUST be a JSON object conforming to the DelegateCodingTaskOutputSchema. Ensure the 'agentRole' field accurately reflects your specialized function for this task.
`,
});

const delegateCodingTaskFlow = ai.defineFlow(
  {
    name: 'delegateCodingTaskFlow',
    inputSchema: DelegateCodingTaskInputSchema,
    outputSchema: DelegateCodingTaskOutputSchema,
  },
  async (input) => {
    const { output } = await agentCodingTaskPrompt({
      ...input,
      // The agentRole is dynamically determined by the AI based on the taskType and prompt instruction.
      // We don't explicitly pass it in here as it's part of the AI's output generation.
    });
    return output!;
  }
);

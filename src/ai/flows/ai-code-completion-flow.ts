/**
 * @fileOverview A Genkit flow for providing context-aware code completions.
 *
 * - aiCodeCompletion - A function that handles the AI code completion process.
 * - AiCodeCompletionInput - The input type for the aiCodeCompletion function.
 * - AiCodeCompletionOutput - The return type for the aiCodeCompletion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiCodeCompletionInputSchema = z.object({
  currentCode: z.string().describe('The full code content of the file.'),
  language: z
    .string()
    .describe('The programming language of the current file (e.g., "typescript", "python").'),
  cursorPosition: z
    .number()
    .describe('The 0-indexed character position of the cursor within the currentCode.'),
});
export type AiCodeCompletionInput = z.infer<typeof AiCodeCompletionInputSchema>;

const AiCodeCompletionOutputSchema = z.object({
  completion: z.string().describe('The suggested code snippet to insert at the cursor position.'),
});
export type AiCodeCompletionOutput = z.infer<typeof AiCodeCompletionOutputSchema>;

export async function aiCodeCompletion(
  input: AiCodeCompletionInput
): Promise<AiCodeCompletionOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'The GEMINI_API_KEY environment variable is not set. Please add it to your .env file to use AI features.'
    );
  }
  try {
    return await aiCodeCompletionFlow(input);
  } catch (e: any) {
    if (e.message.includes('API key not valid')) {
      throw new Error(
        'The provided GEMINI_API_KEY is invalid. Please check your .env file and provide a valid key from Google AI Studio.'
      );
    }
    // Re-throw other errors
    throw e;
  }
}

const CURSOR_MARKER = '██'; // A distinct marker for the cursor position

const aiCodeCompletionPrompt = ai.definePrompt({
  name: 'aiCodeCompletionPrompt',
  input: {
    schema: z.object({
      codeWithCursor: z
        .string()
        .describe('The code content with a ' + CURSOR_MARKER + ' marker at the cursor position.'),
      language: z.string().describe('The programming language.'),
    }),
  },
  output: { schema: AiCodeCompletionOutputSchema },
  prompt: `You are an expert code completion AI assistant. Your goal is to provide intelligent, context-aware code completions.

Given the following {{language}} code with a special marker '${CURSOR_MARKER}' indicating the cursor position, provide a concise and context-aware code completion that *starts immediately after the '${CURSOR_MARKER}' marker*.

Your response MUST be a JSON object conforming to the following schema:
${'```json'}
{{json out.schema}}
${'```'}

Do NOT include any additional explanation or text outside the JSON object.

${'```'}{{language}}
{{codeWithCursor}}
${'```'}

JSON completion:`,
});

const aiCodeCompletionFlow = ai.defineFlow(
  {
    name: 'aiCodeCompletionFlow',
    inputSchema: AiCodeCompletionInputSchema,
    outputSchema: AiCodeCompletionOutputSchema,
  },
  async (input) => {
    // Insert the cursor marker into the code
    const codeWithCursor =
      input.currentCode.slice(0, input.cursorPosition) +
      CURSOR_MARKER +
      input.currentCode.slice(input.cursorPosition);

    const { output } = await aiCodeCompletionPrompt({
      codeWithCursor,
      language: input.language,
    });

    if (!output?.completion) {
      // This is a safety net; the prompt tries to enforce the schema.
      throw new Error('AI did not provide a valid code completion with a completion field.');
    }

    return output;
  }
);

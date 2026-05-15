'use server';
/**
 * @fileOverview A Genkit flow that provides a conversational AI assistant for developers.
 *
 * - conversationalAiAssistant - A function that handles developer queries, debugs code, and explains concepts.
 * - ConversationalAiAssistantInput - The input type for the conversationalAiAssistant function.
 * - ConversationalAiAssistantOutput - The return type for the conversationalAiAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConversationalAiAssistantInputSchema = z.object({
  query: z.string().describe("The user's current question or request."),
  codeSnippet: z
    .string()
    .optional()
    .describe('An optional code snippet the user wants help with (e.g., debugging, explanation).'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .optional()
    .describe('An optional array of previous messages in the conversation for context.'),
  isOffline: z.boolean().optional().describe('Whether the system is operating in offline mode.'),
});
export type ConversationalAiAssistantInput = z.infer<typeof ConversationalAiAssistantInputSchema>;

const ConversationalAiAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's detailed and helpful response."),
  internalLog: z.string().optional().describe('Internal processing log for debugging.'),
  actionsTaken: z.array(z.string()).optional().describe('List of actions taken by the assistant.'),
});
export type ConversationalAiAssistantOutput = z.infer<typeof ConversationalAiAssistantOutputSchema>;

export async function conversationalAiAssistant(
  input: ConversationalAiAssistantInput
): Promise<ConversationalAiAssistantOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'The GEMINI_API_KEY environment variable is not set. Please add it to your .env file to use AI features.'
    );
  }
  try {
    return await conversationalAiAssistantFlow(input);
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

const conversationalAiAssistantPrompt = ai.definePrompt({
  name: 'conversationalAiAssistantPrompt',
  input: { schema: ConversationalAiAssistantInputSchema },
  output: { schema: ConversationalAiAssistantOutputSchema },
  prompt: `You are a highly intelligent and helpful AI programming assistant named MyCodeXvantaOS Studio. Your goal is to provide immediate, relevant, and accurate help to developers.

You can answer general programming questions, explain programming concepts, and debug or improve code snippets.

Instructions:
- If a code snippet is provided, analyze it thoroughly. Identify any errors, suggest improvements, and explain why your suggestions are better. Provide corrected code if applicable.
- If a programming concept is asked, explain it clearly, concisely, and provide examples if it helps understanding.
- If a general question is asked, provide an accurate and helpful answer.
- Always be polite, encouraging, and easy to understand.
- Use markdown for code blocks, explanations, and any formatting that improves readability.

Conversation History:
{{#if conversationHistory}}
  {{#each conversationHistory}}
    {{this.role}}: {{{this.content}}}
  {{/each}}
{{/if}}

{{#if codeSnippet}}
Code Snippet to Analyze:
\`\`\`
{{{codeSnippet}}}
\`\`\`
{{/if}}

User's Request: {{{query}}}

Your response should strictly be a JSON object conforming to the following schema:
{{jsonSchema output.schema}}`,
});

const conversationalAiAssistantFlow = ai.defineFlow(
  {
    name: 'conversationalAiAssistantFlow',
    inputSchema: ConversationalAiAssistantInputSchema,
    outputSchema: ConversationalAiAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await conversationalAiAssistantPrompt(input);
    if (!output) {
      throw new Error('AI assistant failed to generate a response.');
    }
    return output;
  }
);

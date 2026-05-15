'use server';
/**
 * @fileOverview Conversational AI Assistant for developers.
 *
 * Refactored to follow MyCodeXvantaOS Provider Architecture:
 * - Uses Provider abstraction layer instead of direct Genkit dependency
 * - No hardcoded API key requirements
 * - Falls back to native provider when no external provider is configured
 *
 * - conversationalAiAssistant - A function that handles developer queries, debugs code, and explains concepts.
 * - ConversationalAiAssistantInput - The input type for the conversationalAiAssistant function.
 * - ConversationalAiAssistantOutput - The return type for the conversationalAiAssistant function.
 */

import { generateChat, generateText, hasAdvancedAI, getActiveProvider } from '@/ai/genkit';
import type { ChatMessage } from '@/ai/genkit';

// Input/Output types
export interface ConversationalAiAssistantInput {
  query: string;
  codeSnippet?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface ConversationalAiAssistantOutput {
  answer: string;
}

/**
 * Build chat messages from input
 */
function buildMessages(input: ConversationalAiAssistantInput): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a highly intelligent and helpful AI programming assistant named MyCodeXvantaOS Studio. Your goal is to provide immediate, relevant, and accurate help to developers.

You can answer general programming questions, explain programming concepts, and debug or improve code snippets.

Instructions:
- If a code snippet is provided, analyze it thoroughly. Identify any errors, suggest improvements, and explain why your suggestions are better. Provide corrected code if applicable.
- If a programming concept is asked, explain it clearly, concisely, and provide examples if it helps understanding.
- If a general question is asked, provide an accurate and helpful answer.
- Always be polite, encouraging, and easy to understand.
- Use markdown for code blocks, explanations, and any formatting that improves readability.`,
    },
  ];

  // Add conversation history
  if (input.conversationHistory) {
    for (const msg of input.conversationHistory) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  // Add current query with optional code snippet
  let userContent = input.query;
  if (input.codeSnippet) {
    userContent += `\n\nCode Snippet to Analyze:\n\`\`\`\n${input.codeSnippet}\n\`\`\``;
  }
  messages.push({
    role: 'user',
    content: userContent,
  });

  return messages;
}

/**
 * Conversational AI Assistant
 * Uses the Provider abstraction layer - no direct API key dependency
 */
export async function conversationalAiAssistant(
  input: ConversationalAiAssistantInput
): Promise<ConversationalAiAssistantOutput> {
  try {
    // Use chat completion for conversation context
    const messages = buildMessages(input);
    const response = await generateChat(messages, {
      maxTokens: 4096,
      temperature: 0.7,
    });

    return {
      answer: response.text,
    };
  } catch (error: any) {
    const provider = getActiveProvider();
    const advancedHint = hasAdvancedAI()
      ? ''
      : ' Tip: Configure LLM_PROVIDER and corresponding API key for advanced capabilities.';

    throw new Error(`AI assistant failed to respond: ${error.message}.${advancedHint}`);
  }
}

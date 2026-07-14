'use server';
/**
 * @fileOverview AI Code Completion flow for providing context-aware code completions.
 *
 * Refactored to follow MyCodexVantaOS Provider Architecture:
 * - Uses Provider abstraction layer instead of direct Genkit dependency
 * - No hardcoded API key requirements
 * - Falls back to native provider when no external provider is configured
 *
 * - aiCodeCompletion - A function that handles the AI code completion process.
 * - AiCodeCompletionInput - The input type for the aiCodeCompletion function.
 * - AiCodeCompletionOutput - The return type for the aiCodeCompletion function.
 */

import { generateText, hasAdvancedAI, getActiveProvider } from '@/ai/genkit';

// Input/Output types
export interface AiCodeCompletionInput {
  currentCode: string;
  language: string;
  cursorPosition: number;
}

export interface AiCodeCompletionOutput {
  completion: string;
}

const CURSOR_MARKER = '██'; // A distinct marker for the cursor position

/**
 * Build the prompt for code completion
 */
function buildPrompt(input: AiCodeCompletionInput): string {
  // Insert the cursor marker into the code
  const codeWithCursor =
    input.currentCode.slice(0, input.cursorPosition) +
    CURSOR_MARKER +
    input.currentCode.slice(input.cursorPosition);

  return `You are an expert code completion AI assistant. Your goal is to provide intelligent, context-aware code completions.

Given the following ${input.language} code with a special marker '${CURSOR_MARKER}' indicating the cursor position, provide a concise and context-aware code completion that *starts immediately after the '${CURSOR_MARKER}' marker*.

Important rules:
1. Only provide the completion text, not the entire code
2. The completion should be syntactically correct and contextually appropriate
3. Keep completions concise but complete (finish the logical unit)
4. Do not include any explanation, just the code

\`\`\`${input.language}
${codeWithCursor}
\`\`\`

Code completion:`;
}

/**
 * AI Code Completion
 * Uses the Provider abstraction layer - no direct API key dependency
 */
export async function aiCodeCompletion(
  input: AiCodeCompletionInput
): Promise<AiCodeCompletionOutput> {
  // For native provider, return a simple hint
  if (!hasAdvancedAI()) {
    // Native provider - return contextual hint
    const lineStart = input.currentCode.lastIndexOf('\n', input.cursorPosition - 1) + 1;
    const currentLine = input.currentCode.slice(lineStart, input.cursorPosition);

    return {
      completion: getNativeCompletion(currentLine, input.language),
    };
  }

  try {
    const prompt = buildPrompt(input);
    const response = await generateText(prompt, {
      maxTokens: 512,
      temperature: 0.3,
    });

    // Clean up the completion - remove any markdown code blocks
    let completion = response.text.trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = completion.match(/```[\w]*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      completion = codeBlockMatch[1].trim();
    }

    // Remove any "completion:" prefix
    completion = completion.replace(/^completion:\s*/i, '').trim();

    return {
      completion,
    };
  } catch (error: any) {
    // Return empty completion on error rather than throwing
    // This allows the editor to continue functioning
    console.error('[AI Code Completion] Error:', error.message);
    return {
      completion: '',
    };
  }
}

/**
 * Get a simple native completion for basic cases
 */
function getNativeCompletion(currentLine: string, language: string): string {
  const trimmedLine = currentLine.trim();

  // Simple pattern matching for common cases
  const patterns: Record<string, Record<string, string>> = {
    typescript: {
      'if ': '() {\n  \n}',
      'for ': '(let i = 0; i < ; i++) {\n  \n}',
      'while ': '() {\n  \n}',
      'function ': '() {\n  \n}',
      'const ': ' = ',
      'let ': ' = ',
      'interface ': ' {\n  \n}',
      'type ': ' = ',
      'console.log': '(',
      'import ': " from '';",
      'export ': '',
    },
    javascript: {
      'if ': '() {\n  \n}',
      'for ': '(let i = 0; i < ; i++) {\n  \n}',
      'while ': '() {\n  \n}',
      'function ': '() {\n  \n}',
      'const ': ' = ',
      'let ': ' = ',
      'console.log': '(',
    },
    python: {
      'if ': ':\n    ',
      'for ': ' in :\n    ',
      'while ': ':\n    ',
      'def ': '():\n    ',
      'class ': ':\n    ',
      print: '(',
      'import ': '',
    },
  };

  const langPatterns = patterns[language] || patterns.typescript;

  for (const [prefix, suffix] of Object.entries(langPatterns)) {
    if (trimmedLine.endsWith(prefix)) {
      return suffix;
    }
  }

  return '';
}

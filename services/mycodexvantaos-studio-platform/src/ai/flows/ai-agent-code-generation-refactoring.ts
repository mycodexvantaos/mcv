'use server';
/**
 * @fileOverview AI Agent for code generation and refactoring tasks.
 *
 * Refactored to follow MyCodeXvantaOS Provider Architecture:
 * - Uses Provider abstraction layer instead of direct Genkit dependency
 * - No hardcoded API key requirements
 * - Falls back to native provider when no external provider is configured
 *
 * - delegateCodingTask - A function that handles delegating coding tasks like generation, refactoring, or testing.
 * - DelegateCodingTaskInput - The input type for the delegateCodingTask function.
 * - DelegateCodingTaskOutput - The return type for the delegateCodingTask function.
 */

import { generateText, hasAdvancedAI, getActiveProvider } from '@/ai/genkit';

// Input/Output types
export interface DelegateCodingTaskInput {
  taskDescription: string;
  codeContext?: string;
  filePath?: string;
  taskType?: 'generation' | 'refactoring' | 'testing' | 'documentation' | 'optimization';
}

export interface DelegateCodingTaskOutput {
  generatedCode: string;
  explanation: string;
  agentRole: string;
}

/**
 * Build the prompt for code generation/refactoring tasks
 */
function buildPrompt(input: DelegateCodingTaskInput): string {
  const taskType = input.taskType || 'generation';

  return `You are a highly specialized AI coding agent, tasked with assisting a developer with various programming tasks. Your current role is to act as a ${taskType} agent.

Your goal is to understand the provided task, utilize the code context (if any), and produce high-quality, clean, and efficient code according to the instructions.

When responding, provide the generated/refactored code and a clear explanation of what you did and why.

--- TASK DETAILS ---
Task Type: ${taskType}
Task Description: ${input.taskDescription}
File Path: ${input.filePath || 'Not specified'}

--- CODE CONTEXT ---
${input.codeContext ? `\`\`\`\n${input.codeContext}\n\`\`\`` : 'No code context provided.'}

Please respond in the following JSON format:
{
  "generatedCode": "<the resulting code>",
  "explanation": "<explanation of changes>",
  "agentRole": "<the role you adopted, e.g., 'Code Generator', 'Refactoring Assistant'>"
}`;
}

/**
 * Delegate a coding task to the AI agent
 * Uses the Provider abstraction layer - no direct API key dependency
 */
export async function delegateCodingTask(
  input: DelegateCodingTaskInput
): Promise<DelegateCodingTaskOutput> {
  const prompt = buildPrompt(input);

  try {
    const response = await generateText(prompt, {
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Try to parse JSON response
    try {
      // Look for JSON in the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // JSON parsing failed, construct a default response
    }

    // Fallback: construct response from text
    const agentRole = getAgentRole(input.taskType || 'generation');

    return {
      generatedCode:
        extractCodeBlock(response.text) ||
        `// AI Provider: ${response.provider}\n// Configure an external LLM provider for advanced code generation`,
      explanation: response.text,
      agentRole: `${agentRole} (via ${response.provider})`,
    };
  } catch (error: any) {
    // Provide helpful error message
    const provider = getActiveProvider();
    const advancedHint = hasAdvancedAI()
      ? ''
      : ' Tip: Configure LLM_PROVIDER and corresponding API key for advanced capabilities.';

    throw new Error(`AI task delegation failed: ${error.message}.${advancedHint}`);
  }
}

/**
 * Get the agent role based on task type
 */
function getAgentRole(taskType: string): string {
  const roles: Record<string, string> = {
    generation: 'Code Generator',
    refactoring: 'Refactoring Assistant',
    testing: 'Test Writer',
    documentation: 'Documentation Specialist',
    optimization: 'Performance Optimizer',
  };
  return roles[taskType] || 'Coding Agent';
}

/**
 * Extract code block from response text
 */
function extractCodeBlock(text: string): string | null {
  const codeBlockMatch = text.match(/```[\w]*\n?([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : null;
}

/**
 * services/mycodexvantaos-studio-platform/src/ai/genkit.ts
 *
 * AI Configuration following MyCodeXvantaOS Provider Architecture
 *
 * This module provides LLM capabilities through the Provider abstraction layer.
 * It does NOT directly depend on any external AI service.
 *
 * Provider Selection Logic:
 * 1. Check for configured external providers (Gemini, OpenAI, etc.)
 * 2. Fall back to native provider if no external provider is available
 * 3. Native provider works without any API keys
 */

import {
  getLLMRegistry,
  initializeLLM,
  generateCompletion,
  generateChatCompletion,
  type LLMProviderType,
  type LLMResponse,
  type ChatMessage,
} from '@mycodexvantaos/ai-llm';

// Provider configuration from environment
const getLLMConfig = () => {
  const preferredProvider = (process.env.LLM_PROVIDER as LLMProviderType) || 'native';

  return {
    preferredProvider,
    providers: {
      gemini: process.env.GOOGLE_GENAI_API_KEY
        ? {
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            enabled: true,
          }
        : undefined,
      ollama: process.env.OLLAMA_BASE_URL
        ? {
            baseUrl: process.env.OLLAMA_BASE_URL,
            model: process.env.OLLAMA_MODEL || 'llama3',
            enabled: true,
          }
        : undefined,
      openai: process.env.OPENAI_API_KEY
        ? {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            enabled: true,
          }
        : undefined,
    },
  };
};

// Singleton for initialized LLM
let llmInitialized = false;

/**
 * Initialize the AI system with available providers
 * Called at application startup
 */
export async function initializeAI(): Promise<void> {
  if (llmInitialized) return;

  const config = getLLMConfig();
  await initializeLLM(config);

  const registry = getLLMRegistry();
  const healthStatus = await registry.healthCheckAll();

  console.log('[AI] Provider health check:', healthStatus);
  console.log('[AI] Active provider:', registry.getActive().name);

  llmInitialized = true;
}

/**
 * Get the current active AI provider name
 */
export function getActiveProvider(): string {
  const registry = getLLMRegistry();
  return registry.getActive().name;
}

/**
 * Generate text completion
 */
export async function generateText(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<LLMResponse> {
  return generateCompletion(prompt, options);
}

/**
 * Generate chat completion
 */
export async function generateChat(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<LLMResponse> {
  return generateChatCompletion(messages, options);
}

/**
 * Check if an advanced AI provider is available
 */
export function hasAdvancedAI(): boolean {
  const registry = getLLMRegistry();
  const active = registry.getActive();
  return !active.isNative;
}

/**
 * Get AI capabilities metadata
 */
export function getAICapabilities() {
  const registry = getLLMRegistry();
  const active = registry.getActive();

  return {
    provider: active.name,
    isNative: active.isNative,
    capabilities: active.getMetadata().capabilities || [],
    advancedAvailable: hasAdvancedAI(),
  };
}

// Export types
export type { LLMResponse, ChatMessage, LLMProviderType };

// Default export for backwards compatibility
export const ai = {
  initialize: initializeAI,
  generateText,
  generateChat,
  getActiveProvider,
  hasAdvancedAI,
  getAICapabilities,
};

export default ai;

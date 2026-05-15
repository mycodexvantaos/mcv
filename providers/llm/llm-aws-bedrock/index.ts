/**
 * 🔒 MyCodeXvantaOS - AWS Bedrock LLM Provider
 *
 * AWS Bedrock LLM integration with native fallback.
 *
 * @module providers/llm/llm-aws-bedrock
 * @version 1.0.0
 */

export { BedrockLLMProvider } from './bedrock-provider-cb';
export type { BedrockConfig, ChatMessage, ChatCompletionOptions, ChatCompletionResult, EmbeddingResult } from './bedrock-provider-cb';

/**
 * Factory function to create Bedrock provider
 */
export function createBedrockProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): BedrockLLMProvider {
  return new BedrockLLMProvider({
    id: config.id || 'bedrock-llm',
    name: config.name || 'AWS Bedrock LLM',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize Bedrock provider
 */
export async function initializeBedrockProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<BedrockLLMProvider> {
  const provider = createBedrockProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { BedrockLLMProvider as default };

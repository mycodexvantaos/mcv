/**
 * ✨ MyCodeXvantaOS - Gemini LLM Provider
 *
 * Google Gemini API integration with native fallback.
 * 
 * @module providers/llm/llm-gemini
 * @version 1.0.0
 */

export { GeminiLLMProvider, default } from './gemini-provider-cb';
export type { 
  GeminiConfig, 
  Content, 
  ContentPart, 
  LLMRequest as GeminiLLMRequest, 
  LLMResponse as GeminiLLMResponse 
} from './gemini-provider-cb';

/**
 * Create a Gemini LLM provider instance
 */
export function createGeminiProvider(
  id: string = 'gemini-default',
  config: GeminiConfig = {}
): GeminiLLMProvider {
  const ProviderConfig = {
    config,
    mode: 'external' as const,
    providerId: id,
  };

  return new GeminiLLMProvider(
    id,
    'Gemini LLM Provider',
    ProviderConfig,
    {
      enabled: true,
      retryCount: 3,
    }
  );
}

/**
 * Initialize Gemini provider with health check
 */
export async function initializeGeminiProvider(
  id: string = 'gemini-default',
  config: GeminiConfig = {}
): Promise<GeminiLLMProvider> {
  const provider = createGeminiProvider(id, config);
  await provider.initialize();
  return provider;
}

export default {
  GeminiLLMProvider,
  createGeminiProvider,
  initializeGeminiProvider,
};
/**
 * 🦙 MyCodeXvantaOS - Ollama LLM Provider
 *
 * Local LLM provider using Ollama for offline inference.
 * 
 * @module providers/llm/llm-ollama
 * @version 1.0.0
 */

export { OllamaLLMProvider, default } from './ollama-provider-cb';
export type { 
  OllamaConfig, 
  LLMRequest as OllamaLLMRequest, 
  LLMResponse as OllamaLLMResponse 
} from './ollama-provider-cb';

/**
 * Create an Ollama LLM provider instance
 */
export function createOllamaProvider(
  id: string = 'ollama-default',
  config: OllamaConfig = {}
): OllamaLLMProvider {
  const ProviderConfig = {
    config,
    mode: 'native' as const,
    providerId: id,
  };

  return new OllamaLLMProvider(
    id,
    'Ollama LLM Provider',
    ProviderConfig,
    {
      enabled: true,
      retryCount: 3,
    }
  );
}

/**
 * Initialize Ollama provider with health check
 */
export async function initializeOllamaProvider(
  id: string = 'ollama-default',
  config: OllamaConfig = {}
): Promise<OllamaLLMProvider> {
  const provider = createOllamaProvider(id, config);
  await provider.initialize();
  return provider;
}

export default {
  OllamaLLMProvider,
  createOllamaProvider,
  initializeOllamaProvider,
};
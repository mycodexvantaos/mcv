import { OpenAIEmbeddingProvider } from './openai-embedding-provider-cb';
import type { OpenAIEmbeddingConfig } from './openai-embedding-provider-cb';
/**
 * 🔒 MyCodeXvantaOS - OpenAI Embedding Provider Exports
 *
 * @module providers/embedding/embedding-openai
 * @version 1.0.0
 */

export { OpenAIEmbeddingProvider, default } from './openai-embedding-provider-cb';
export type {
  OpenAIEmbeddingConfig,
  EmbeddingRequest,
  EmbeddingResponse,
} from './openai-embedding-provider-cb';

/**
 * Create an OpenAI embedding provider instance
 */
export function createOpenAIEmbeddingProvider(
  id: string = 'embedding-openai',
  config?: Partial<OpenAIEmbeddingConfig>
) {
  const { OpenAIEmbeddingProvider } = require('./openai-embedding-provider-cb');

  return new OpenAIEmbeddingProvider(id, 'OpenAI Embedding', {
    enabled: true,
    config: config || {},
  });
}

/**
 * Initialize and return an OpenAI embedding provider
 */
export async function initializeOpenAIEmbeddingProvider(
  id: string = 'embedding-openai',
  config?: Partial<OpenAIEmbeddingConfig>
) {
  const provider = createOpenAIEmbeddingProvider(id, config);
  await provider.initialize();
  return provider;
}

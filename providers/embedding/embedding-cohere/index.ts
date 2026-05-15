/**
 * 🔒 MyCodeXvantaOS - Cohere Embedding Provider Exports
 *
 * @module providers/embedding/embedding-cohere
 * @version 1.0.0
 */

export { CohereEmbeddingProvider, default } from './cohere-embedding-provider-cb';
export type {
  CohereEmbeddingConfig,
  EmbeddingRequest,
  EmbeddingResponse,
} from './cohere-embedding-provider-cb';

/**
 * Create a Cohere embedding provider instance
 */
export function createCohereEmbeddingProvider(
  id: string = 'embedding-cohere',
  config?: Partial<CohereEmbeddingConfig>
) {
  const { CohereEmbeddingProvider } = require('./cohere-embedding-provider-cb');
  
  return new CohereEmbeddingProvider(
    id,
    'Cohere Embedding',
    {
      enabled: true,
      config: config || {},
    }
  );
}

/**
 * Initialize and return a Cohere embedding provider
 */
export async function initializeCohereEmbeddingProvider(
  id: string = 'embedding-cohere',
  config?: Partial<CohereEmbeddingConfig>
) {
  const provider = createCohereEmbeddingProvider(id, config);
  await provider.initialize();
  return provider;
}
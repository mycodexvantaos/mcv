/**
 * 📦 Hybrid Embedding Provider Exports
 *
 * @module providers/hybrid/embedding
 * @version 1.0.0
 */

export { HybridEmbeddingProvider } from './hybrid-embedding-provider-cb';
export type { HybirdEmbeddingConfig } from './hybrid-embedding-provider-cb';

// Re-export sub-providers
export { CohereHybridEmbeddingProvider } from './embedding-cohere/cohere-hybrid-embedding-provider-cb';
export { OllamaHybridEmbeddingProvider } from './embedding-ollama/ollama-hybrid-embedding-provider-cb';
export { OpenAIHybridEmbeddingProvider } from './embedding-openai/openai-hybrid-embedding-provider-cb';

/**
 * Create a hybrid embedding provider instance
 */
export function createHybridEmbeddingProvider(
  id: string = 'hybrid-embedding',
  config?: Partial<import('./hybrid-embedding-provider-cb').HybirdEmbeddingConfig>
) {
  const { HybridEmbeddingProvider } = require('./hybrid-embedding-provider-cb');

  return new HybridEmbeddingProvider(id, 'Hybrid Embedding', {
    mode: 'hybrid' as any,
    providerMode: 'hybrid' as any,
    config: config || {},
  });
}

/**
 * Initialize and return a hybrid embedding provider
 */
export async function initializeHybridEmbeddingProvider(
  id: string = 'hybrid-embedding',
  config?: Partial<import('./hybrid-embedding-provider-cb').HybirdEmbeddingConfig>
) {
  const provider = createHybridEmbeddingProvider(id, config);
  await provider.initialize();
  return provider;
}

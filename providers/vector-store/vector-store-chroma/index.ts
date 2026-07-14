import { ChromaVectorProvider } from './chroma-vector-provider-cb';
import type { ChromaVectorConfig } from './chroma-vector-provider-cb';
export { ChromaVectorProvider, default } from './chroma-vector-provider-cb';
export type {
  ChromaVectorConfig,
  VectorSearchResult,
  SearchResult,
} from './chroma-vector-provider-cb';
export function createChromaVectorProvider(
  id: string = 'vector-chroma',
  config?: Partial<ChromaVectorConfig>
) {
  const { ChromaVectorProvider } = require('./chroma-vector-provider-cb');
  return new ChromaVectorProvider(id, 'ChromaDB Vector Store', {
    enabled: true,
    config: config || {},
  });
}
export async function initializeChromaVectorProvider(
  id: string = 'vector-chroma',
  config?: Partial<ChromaVectorConfig>
) {
  const provider = createChromaVectorProvider(id, config);
  await provider.initialize();
  return provider;
}

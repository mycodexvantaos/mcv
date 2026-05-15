/**
 * 📦 Native Memory Vector Store Provider Exports
 *
 * @module providers/native/memory-vector-store
 * @version 1.0.0
 */

export { MemoryVectorStore } from './memory-vector-store-cb';
export type { MemoryVectorStoreConfig } from './memory-vector-store-cb';

/**
 * Create a native memory vector store provider instance
 */
export function createNativeMemoryVectorStoreProvider(
  id: string = 'native-memory-vector-store',
  config?: Partial<import('./memory-vector-store-cb').MemoryVectorStoreConfig>
) {
  const { MemoryVectorStore } = require('./memory-vector-store-cb');

  return new MemoryVectorStore(
    id,
    'Native Memory Vector Store',
    {
      mode: 'native' as any,
      providerMode: 'native' as any,
      config: config || {},
    }
  );
}

/**
 * Initialize and return a native memory vector store provider
 */
export async function initializeNativeMemoryVectorStoreProvider(
  id: string = 'native-memory-vector-store',
  config?: Partial<import('./memory-vector-store-cb').MemoryVectorStoreConfig>
) {
  const provider = createNativeMemoryVectorStoreProvider(id, config);
  await provider.initialize();
  return provider;
}

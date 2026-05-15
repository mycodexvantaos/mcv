export { PineconeVectorProvider, default } from './pinecone-vector-provider-cb';
export type { PineconeVectorConfig, VectorSearchResult, SearchResult } from './pinecone-vector-provider-cb';
export function createPineconeVectorProvider(id: string = 'vector-pinecone', config?: Partial<PineconeVectorConfig>) {
  const { PineconeVectorProvider } = require('./pinecone-vector-provider-cb');
  return new PineconeVectorProvider(id, 'Pinecone Vector Store', { enabled: true, config: config || {} });
}
export async function initializePineconeVectorProvider(id: string = 'vector-pinecone', config?: Partial<PineconeVectorConfig>) {
  const provider = createPineconeVectorProvider(id, config);
  await provider.initialize();
  return provider;
}

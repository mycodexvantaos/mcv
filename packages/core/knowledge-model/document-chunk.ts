/**
 * MyCodeXvantaOS — Document Chunk Model
 */

export interface ChunkMetadata {
  pageNumber?: number;
  sectionTitle?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface DocumentChunkSpec {
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding: number[] | null;
  metadata: ChunkMetadata;
}

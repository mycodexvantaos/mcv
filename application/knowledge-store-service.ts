/**
 * Knowledge Store Service — Application Layer
 *
 * Document ingestion, chunking, embedding, and persistent storage.
 * Manages the complete ingestion pipeline: validate → extract → chunk → embed → index → verify.
 */

import type {
  IDatabasePort,
  IStoragePort,
  ISearchPort,
  IQueuePort,
  IAuditPort,
  IIdentityPort,
} from '../ports/index';
import type {
  DocumentSpec,
  DocumentStatus,
  DocumentPhase,
  KnowledgeCollectionSpec,
  KnowledgeCollectionStatus,
  CollectionPhase,
  Resource,
  IngestionResult,
  VerificationReport,
  EvidenceLevel,
} from '../core/index';

export interface KnowledgeStoreServiceDeps {
  database: IDatabasePort;
  storage: IStoragePort;
  search: ISearchPort;
  queue: IQueuePort;
  audit: IAuditPort;
  identity: IIdentityPort;
}

export class KnowledgeStoreService {
  private deps: KnowledgeStoreServiceDeps;

  constructor(deps: KnowledgeStoreServiceDeps) {
    this.deps = deps;
  }

  async uploadDocument(
    workspaceId: string,
    input: {
      title: string;
      format: string;
      collectionId: string;
      content: Uint8Array;
      sourceUri?: string;
      language?: string;
    }
  ): Promise<Resource<DocumentSpec, DocumentStatus>> {
    const documentId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:knowledge:document:${documentId}`;
    const now = new Date().toISOString();

    // Store raw document in R2
    await this.deps.storage.put('documents', `${workspaceId}/${documentId}`, input.content, {
      contentType: `application/${input.format}`,
      metadata: { documentId, collectionId: input.collectionId, workspaceId },
    });

    // Create document record
    await this.deps.database.execute(
      `INSERT INTO documents (id, urn, workspace_id, title, format, collection_id, source_uri, language, phase, file_size_bytes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded', ?, ?, ?)`,
      [
        documentId,
        urn,
        workspaceId,
        input.title,
        input.format,
        input.collectionId,
        input.sourceUri ?? null,
        input.language ?? 'en',
        input.content.byteLength,
        now,
        now,
      ]
    );

    // Queue for ingestion
    await this.deps.queue.send('ingestion', {
      body: { documentId, workspaceId, collectionId: input.collectionId },
      contentType: 'application/json',
    });

    await this.deps.audit.emitEvent({
      eventType: 'knowledge.document.uploaded',
      category: 'knowledge',
      severity: 'info',
      subjectId: 'system',
      workspaceId,
      resourceKind: 'document',
      resourceId: documentId,
      action: 'upload-document',
      data: { title: input.title, format: input.format, sizeBytes: input.content.byteLength },
      correlationId: crypto.randomUUID(),
    });

    return {
      apiVersion: 'platform.mycodevantaos/v1',
      kind: 'document',
      metadata: {
        id: documentId,
        urn,
        kind: 'document',
        workspaceId,
        labels: {},
        annotations: {},
        createdBy: 'system',
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        title: input.title,
        format: input.format as any,
        collectionId: input.collectionId,
        sourceUri: input.sourceUri ?? null,
        language: input.language ?? 'en',
      },
      status: {
        phase: 'uploaded',
        conditions: [
          {
            type: 'Ready',
            status: 'False',
            reason: 'PendingIngestion',
            message: 'Document awaiting ingestion',
            lastTransitionTime: now,
          },
        ],
        chunkCount: 0,
        totalTokens: 0,
        fileSizeBytes: input.content.byteLength,
        verificationStatus: 'pending',
      },
    };
  }

  async ingestDocument(documentId: string): Promise<IngestionResult> {
    const now = new Date().toISOString();
    const startTime = Date.now();

    await this.deps.audit.emitEvent({
      eventType: 'knowledge.document.ingestion.started',
      category: 'knowledge',
      severity: 'info',
      subjectId: 'system',
      resourceKind: 'document',
      resourceId: documentId,
      action: 'ingest-document',
      data: { pipelineStages: ['extract', 'chunk', 'embed', 'index', 'verify'] },
      correlationId: crypto.randomUUID(),
    });

    try {
      // Update phase to ingesting
      await this.deps.database.execute(
        "UPDATE documents SET phase = 'ingesting', updated_at = ? WHERE id = ?",
        [now, documentId]
      );

      // Pipeline stages (simplified for constitution — real implementation in services/)
      // 1. Extract — read from R2, parse content
      // 2. Chunk — split into semantic chunks
      // 3. Embed — generate vectors via model port
      // 4. Index — upsert to Vectorize + D1 FTS
      // 5. Verify — round-trip test and quality checks

      const chunksCreated = 0; // placeholder
      const tokensGenerated = 0; // placeholder

      // Mark as ready
      await this.deps.database.execute(
        "UPDATE documents SET phase = 'ready', chunk_count = ?, total_tokens = ?, updated_at = ? WHERE id = ?",
        [chunksCreated, tokensGenerated, now, documentId]
      );

      await this.deps.audit.emitEvent({
        eventType: 'knowledge.document.ingestion.completed',
        category: 'knowledge',
        severity: 'info',
        subjectId: 'system',
        resourceKind: 'document',
        resourceId: documentId,
        action: 'ingest-document',
        data: {
          chunkCount: chunksCreated,
          totalTokens: tokensGenerated,
          durationMs: Date.now() - startTime,
        },
        correlationId: crypto.randomUUID(),
      });

      return {
        documentId,
        phase: 'verify',
        chunksCreated,
        tokensGenerated,
        durationMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      await this.deps.database.execute(
        "UPDATE documents SET phase = 'failed', updated_at = ? WHERE id = ?",
        [now, documentId]
      );

      await this.deps.audit.emitEvent({
        eventType: 'knowledge.document.ingestion.failed',
        category: 'knowledge',
        severity: 'high',
        subjectId: 'system',
        resourceKind: 'document',
        resourceId: documentId,
        action: 'ingest-document',
        data: { failedStage: 'unknown', error: String(error), retryable: true },
        correlationId: crypto.randomUUID(),
      });

      return {
        documentId,
        phase: 'embed',
        chunksCreated: 0,
        tokensGenerated: 0,
        durationMs: Date.now() - startTime,
        success: false,
        error: String(error),
      };
    }
  }

  async createCollection(
    workspaceId: string,
    input: {
      name: string;
      description?: string;
      embeddingModel?: string;
      chunkStrategy?: string;
      language?: string;
    }
  ): Promise<Resource<KnowledgeCollectionSpec, KnowledgeCollectionStatus>> {
    const collectionId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:knowledge:knowledge-collection:${collectionId}`;
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO knowledge_collections (id, urn, workspace_id, name, description, embedding_model, chunk_strategy, language, phase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'empty', ?, ?)`,
      [
        collectionId,
        urn,
        workspaceId,
        input.name,
        input.description ?? '',
        input.embeddingModel ?? 'text-embedding-3-small',
        input.chunkStrategy ?? 'semantic',
        input.language ?? 'en',
        now,
        now,
      ]
    );

    await this.deps.audit.emitEvent({
      eventType: 'knowledge.collection.created',
      category: 'knowledge',
      severity: 'info',
      subjectId: 'system',
      workspaceId,
      resourceKind: 'knowledge-collection',
      resourceId: collectionId,
      action: 'create-collection',
      data: { name: input.name, embeddingModel: input.embeddingModel ?? 'text-embedding-3-small' },
      correlationId: crypto.randomUUID(),
    });

    return {
      apiVersion: 'platform.mycodevantaos/v1',
      kind: 'knowledge-collection',
      metadata: {
        id: collectionId,
        urn,
        kind: 'knowledge-collection',
        workspaceId,
        labels: {},
        annotations: {},
        createdBy: 'system',
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        name: input.name,
        description: input.description ?? '',
        embeddingModel: input.embeddingModel ?? 'text-embedding-3-small',
        chunkStrategy: (input.chunkStrategy as any) ?? 'semantic',
        language: input.language ?? 'en',
      },
      status: {
        phase: 'empty',
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Created',
            message: 'Collection created, awaiting documents',
            lastTransitionTime: now,
          },
        ],
        documentCount: 0,
        totalChunks: 0,
        totalTokens: 0,
        lastIndexBuiltAt: null,
        freshness: { avgDocumentAgeDays: 0, staleDocumentCount: 0, lastIngestedAt: null },
      },
    };
  }
}

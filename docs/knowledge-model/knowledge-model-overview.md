# Knowledge Model Overview

## Purpose

The Knowledge Model governs the full lifecycle of knowledge within the platform:
ingestion, parsing, chunking, embedding, storage, retrieval, and traceability.

## Architecture

- **Package**: `@mycodexvantaos/knowledge-model` (TS types)
- **Python Package**: `mycodexvantaos-knowledge-pipeline` (processing)
- **Contract**: `contracts/events/knowledge-events.yaml`
- **Schema**: `contracts/schemas/knowledge-model.schema.json`

## Knowledge Pipeline Flow

```
[Document Upload]
    -> [TS API: knowledge-store] (create resource, enqueue job)
    -> [D1 Job Table] (pending pipeline job)
    -> [Python: knowledge-worker] (pick up job)
        -> [Parse] (extract text, metadata)
        -> [Chunk] (split into segments)
        -> [Embed] (generate vectors)
        -> [Store] (write to vector store + metadata DB)
    -> [Report] (write result to job record)
    -> [TS Audit] (record completion event)
```

## Core Types

- `DocumentInput`: Raw document with metadata
- `ParsedDocument`: Extracted text and structure
- `DocumentChunk`: Segmented text with position info
- `EmbeddingResult`: Vector embedding with model reference
- `KnowledgeTrace`: Provenance chain for audit

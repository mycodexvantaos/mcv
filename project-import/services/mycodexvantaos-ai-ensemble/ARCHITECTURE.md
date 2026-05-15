# CodexVanta OS — AI Engine Architecture

## Overview

The AI Engine provides the intelligence layer for CodexVanta OS. It abstracts all AI/ML capabilities behind provider-agnostic service interfaces, allowing the platform to operate with native inference in offline environments and scale to cloud-hosted models when connected.

---

## Design Principles

1. **Provider-agnostic inference** — No service directly imports OpenAI, Anthropic, or any vendor SDK. All access goes through Provider interfaces resolved by ProviderRegistry.

2. **Native-first intelligence** — The platform ships with template-based LLM responses, hash-based embeddings, and in-memory vector search. These are functional, deterministic, and require zero external dependencies.

3. **Graceful degradation** — If an external LLM API becomes unavailable, the system falls back to native template responses. RAG queries fall back to keyword matching. Agents fall back to rule-based execution.

4. **Observability-integrated** — Every inference call, agent step, and embedding operation is traced through the ObservabilityProvider. Token usage, latency, and error rates are recorded as metrics.

5. **Queue-backed async** — Long-running agent executions and batch embedding jobs are dispatched through the QueueProvider, preventing blocking of synchronous request paths.

---

## Service Architecture

### LLMService

```
Request → Cache Check (stateStore) → Provider Dispatch → Response
                                          │
                                    ┌─────┴─────┐
                                    │  Native    │  External
                                    │ (template) │  (API call)
                                    └────────────┘
```

The LLMService implements a caching layer using StateStoreProvider. Identical prompts within a configurable TTL window return cached responses. Cache keys are computed from a hash of the prompt, model, and temperature parameters.

Native mode uses a template engine that matches prompt patterns to predefined response templates. This enables deterministic testing and offline development without any API keys.

### AgentService

```
Create Agent → Store Definition (database)
Execute Agent → Queue Task → Step Loop
                                │
                          ┌─────┴─────┐
                          │  Observe   │
                          │  (trace)   │
                          └─────┬─────┘
                          Store Result
```

Agents are defined as JSON specifications with a name, description, tools list, and system prompt. Execution creates a run record, dispatches to the queue, and processes steps sequentially. Each step result is stored in the database with timing information.

### EmbeddingService

```
Text → Hash/API → Vector → Store (database + storage)
Query → Embed Query → Cosine Similarity → Ranked Results
```

In native mode, text is converted to vectors using a deterministic hash function that maps character codes to float values. The resulting vectors support cosine similarity search with reasonable semantic clustering for common English text patterns.

In connected mode, the service delegates to hosted embedding APIs that produce high-dimensional semantic vectors.

### RAGService

```
Index: Document → Chunk → Embed Chunks → Store
Query: Question → Embed → Search → Retrieve Context → LLM Generate
```

The RAG pipeline combines the EmbeddingService for indexing and retrieval with the LLMService for context-aware generation. Documents are chunked, embedded, and stored with metadata. Queries embed the question, search for relevant chunks, and pass them as context to the LLM.

---

## Data Flow

```
User Request
     │
     ▼
┌─────────┐     ┌──────────┐     ┌──────────┐
│   LLM   │────▶│  Agent   │────▶│   RAG    │
│ Service  │     │ Service  │     │ Service  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     ▼               ▼               ▼
┌─────────────────────────────────────────┐
│           Provider Layer                 │
│  database · storage · stateStore         │
│  queue · observability                   │
└─────────────────────────────────────────┘
```

---

## Provider Usage Map

| Service          | database | storage   | stateStore | queue    | observability |
| ---------------- | -------- | --------- | ---------- | -------- | ------------- |
| LLMService       | —        | —         | cache      | —        | log, metric   |
| AgentService     | persist  | —         | state      | dispatch | trace         |
| EmbeddingService | metadata | vectors   | cache      | —        | log           |
| RAGService       | metadata | documents | cache      | —        | log, trace    |

---

## Native Mode Implementation Details

### Template-Based LLM

- Pattern matching against prompt keywords
- Variable substitution in response templates
- Deterministic output for identical inputs
- Configurable template library

### Hash-Based Embeddings

- Character code summation per dimension
- Normalized to unit vectors
- 128-dimension default vector space
- Deterministic: same input always produces same vector

### In-Memory Vector Search

- Brute-force cosine similarity computation
- Suitable for up to ~10,000 vectors in memory
- No external vector database required
- Results ranked by similarity score

---

## Security Considerations

- API keys for external providers are stored in SecretsProvider, never in environment variables directly
- Token usage is metered and logged for cost control
- Agent tool calls are sandboxed and validated against allowed tool lists
- Document content is stored encrypted at rest when using native storage

---

## Scaling Strategy

| Scale       | Strategy                                      |
| ----------- | --------------------------------------------- |
| Development | Native mode, in-memory, no API keys           |
| Staging     | Hybrid mode, external LLM + native embeddings |
| Production  | Connected mode, all external providers        |

---

## Dependencies

- **Tier 3** in the CodexVanta OS dependency hierarchy
- Depends on: core-kernel (Provider interfaces), data-pipeline (data ingestion)
- Consumed by: automation-core, decision-engine, app-ui, governance-autonomy

# Pattern: Semantic Decision Pipeline（語意決策管道）

**Category**: AI Architecture
**Maturity**: Proven
**Score**: 87/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

AI 系統的「決策」往往是黑盒：

- 不清楚 AI 基於什麼資料做出決策
- Semantic similarity 只是第一步，如何轉成可執行決策？
- 無法審計 AI 決策過程

## Solution

```text
Semantic Decision Engine
  ├── Semantic Similarity Client    — 計算語意相似度
  ├── Context Retrieval Adapter     — 基於語意檢索相關 context
  ├── Decision Pipeline Orchestrator — 編排多步驟決策
  ├── Fallback Semantic Mode        — 降級決策策略
  ├── Metrics and Trace Hooks       — 追蹤每步決策
  └── SDK-facing API Contract       — 對外提供穩定 API
```

## Implementation Guide

### Decision Pipeline

```typescript
// services/semantic-core/decision-pipeline.ts
interface DecisionContext {
  query: string;
  metadata: Record<string, unknown>;
}

interface DecisionResult {
  decision: string;
  confidence: number;
  reasoning: string[];
  fallback_used: boolean;
}

class SemanticDecisionPipeline {
  constructor(
    private similarityClient: SemanticSimilarityClient,
    private contextRetriever: ContextRetrievalAdapter,
    private orchestrator: DecisionOrchestrator,
  ) {}

  async decide(context: DecisionContext): Promise<DecisionResult> {
    // Step 1: 語意相似度分析
    const similar = await this.similarityClient.findSimilar(context.query);

    // Step 2: 相關 context 檢索
    const retrievedContext = await this.contextRetriever.retrieve(similar);

    // Step 3: 決策編排
    try {
      return await this.orchestrator.execute(context, retrievedContext);
    } catch (error) {
      // Step 4: 降級決策
      return this.fallback(context, error);
    }
  }

  private fallback(context: DecisionContext, error: Error): DecisionResult {
    return {
      decision: 'default',
      confidence: 0,
      reasoning: [`Fallback due to: ${error.message}`],
      fallback_used: true,
    };
  }
}
```

## CI Enforcement

```yaml
name: Semantic Pipeline Contract Check
on:
  pull_request:
    paths:
      - 'services/semantic-core/**'
      - 'contracts/openapi/**'

jobs:
  contract-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate semantic API contract
        run: npx @redocly/cli lint contracts/openapi/semantic-core-api.yaml
      - name: Check fallback coverage
        run: node ci/check-fallback-coverage.ts
```

## Example Structure

```text
services/semantic-core/
├── decision-pipeline.ts
├── similarity-client.ts
├── context-retrieval.ts
├── decision-orchestrator.ts
└── fallback-handler.ts

contracts/openapi/
└── semantic-core-api.yaml
```

---

*Pattern Score: 87/100 | Priority: High | Related Skill: SM-06-A*

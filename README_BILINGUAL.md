# MyCodeXvantaOS — 雙語架構升級

> **TypeScript Control Plane + Python Intelligence Plane**

MyCodeXvantaOS 已從 **TypeScript-only** 平台升級為 **雙語架構平台**，將 AI/ML 能力透過 Python 智能平面引入。

## 架構概覽

```
mycodexvantaos/
├── packages/              # TypeScript 控制平面 — 74個 CapabilityBase providers
├── services/              # TypeScript 平台服務
├── providers/             # TypeScript provider adapters
├── contracts/             # 語言中立契約
│   └── schemas/
│       ├── memory-item.schema.json
│       ├── dream-run.schema.json
│       ├── dream-action.schema.json
│       └── dream-report.schema.json
├──
├── python/                # Python 智能平面 — AI/ML 能力
│   ├── packages/
│   │   └── mycodexvantaos-memory-dream/  # 記憶夢境引擎
│   ├── apps/
│   │   └── dream-worker/                    # 夢境執行 worker
│   └── tests/
└──
└── apps/                  # Web console / API worker
```

## 語言分工

### TypeScript 控制平面

負責：
- Cloudflare Workers / Pages 原生執行環境
- Service Catalog / Resource Model / Policy Model
- Audit Log / Usage Meter
- Web Console / API Gateway
- BYOK Model Routing
- Provider Management

**部署：** Cloudflare Workers, Node.js, Docker, Kubernetes

### Python 智能平面

負責：
- Memory Dream (記憶夢境) — 時間整合、衝突偵測、語義聚類
- Knowledge Pipeline (知識管道) — 文件解析、embedding 生成、RAG 檢索
- Agent Workers (智能代理) — Self-hosted AI 執行
- Evaluation (評估) — AI 系統測試與評估

**部署：** Docker, Kubernetes, CLI, Scheduled Workers

## 跨語言通訊

TypeScript 和 Python 透過 **契約** 溝通：

```
contracts/schemas/ (JSON Schema)
├── memory-item.schema.json   → MemoryItem (pydantic)
├── dream-run.schema.json     → DreamRun (pydantic)
├── dream-action.schema.json  → DreamAction (pydantic)
└── dream-report.schema.json  → DreamReport (pydantic)
```

### 通訊流程

1. **TypeScript API** 創建 `dream-run` 記錄
2. **Python Worker** 從資料庫讀取 job
3. **Python** 處理 memory items 並生成 `dream-actions`
4. **Python** 將 `dream-report` 寫回資料庫
5. **TypeScript** 讀取結果供審計/UI 使用

## 快速開始

### TypeScript (控制平面)

```bash
# 安裝依賴
pnpm install

# 執行測試
pnpm test

# 執行 linter
pnpm lint

# 建置
pnpm build
```

### Python (智能平面)

```bash
# 安裝 uv
pip install uv

# 安裝依賴
cd python
uv sync --extra dev

# 執行測試
uv run pytest

# 執行 linter
uv run ruff check .
uv run ruff format .

# 執行 dream worker
uv run python -m apps.dream_worker.main tests/fixtures/sample-memories.json
```

## 數據模型

### Memory Item

```json
{
  "memory_id": "mem_001",
  "content": "System updated at 2024-01-15",
  "tags": ["system", "update"],
  "related_entities": ["system-001"],
  "temporal_expressions": ["2024-01-15"],
  "memory_type": "observation"
}
```

### Dream Run

```json
{
  "dream_run_id": "urn:mycodexvantaos:dream:...",
  "memory_items": [...],
  "dry_run": true,
  "proposal_mode": true
}
```

### Dream Report

```json
{
  "dream_run_id": "...",
  "total_memories": 100,
  "duplicates_found": 5,
  "conflicts_found": 2,
  "orphans_found": 3,
  "actions": [...]
}
```

## 技術棧

### TypeScript
- **Package Manager**: pnpm / Turborepo
- **Testing**: Jest (377 passing tests)
- **Type Checking**: TypeScript 5.5 (strict mode)
- **Linting**: ESLint / Prettier
- **Runtime**: Cloudflare Workers, Node.js

### Python
- **Package Manager**: uv (Rust-based, fast)
- **Testing**: pytest
- **Type Checking**: mypy (strict mode)
- **Linting**: ruff
- **Data Models**: pydantic
- **ML/NLP**: scikit-learn (MVP), sentence-transformers (future)

## CI/CD

- **TypeScript**: `.github/workflows/ci.yml`
- **Python**: `.github/workflows/python-ci.yml`
- **Contract Validation**: `.github/workflows/cross-language-contract-check.yml`

## 文件

- [Python README](python/README.md)
- [Memory Dream README](python/packages/mycodexvantaos-memory-dream/README.md)
- [Dream Worker README](python/apps/dream-worker/README.md)

## 許可證

MIT License — see [LICENSE](LICENSE) for details.
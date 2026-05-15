# MyCodeXvantaOS 架構排查與補強計畫

## Phase 0: 排查報告
- [x] 盤點現有架構文件與規劃藍圖的差距

## Phase 1: 服務分類重構（8 大類別目錄）
- [x] 重構 service-catalog.yaml 分類：core/knowledge/ai/governance → knowledge/agent/workspace/developer/security/storage/model/automation
- [x] 為每個服務定義添加 category 欄位對應新的 8 大分類
- [x] 建立 contracts/service-categories.yaml 定義完整分類體系

## Phase 2: 補強核心領域模型（packages/core 拆分）
- [x] 建立 packages/core/shared/ (id.ts, time.ts, result.ts, errors.ts, pagination.ts, metadata.ts, index.ts)
- [x] 建立 packages/core/service-catalog/ (service-definition.ts, service-category.ts, index.ts)
- [x] 建立 packages/core/resource-model/ (resource-kind.ts, index.ts)
- [x] 建立 packages/core/policy-model/ (policy-definition.ts, index.ts)
- [x] 建立 packages/core/audit-model/ (audit-event.ts, index.ts)
- [x] 建立 packages/core/knowledge-model/ (document.ts, document-chunk.ts, knowledge-collection.ts, knowledge-index.ts, retrieval-receipt.ts, answer-trace.ts, memory-item.ts, knowledge-issue.ts, knowledge-repair.ts, derived-artifact.ts, index.ts)
- [x] 建立 packages/core/index.ts barrel re-export + package.json

## Phase 3: 補強 Ports 層（Repository + Provider 接口）
- [x] 建立 packages/ports/database/ (IDatabasePort + IRepository<T> + types)
- [x] 建立 packages/ports/object-storage/ (IObjectStoragePort + types)
- [x] 建立 packages/ports/search/ (ISearchPort + IKnowledgeSearchPort + types)
- [x] 建立 packages/ports/model-provider/ (IChatModelPort + IEmbeddingModelPort + IModelPort + types)
- [x] 建立 packages/ports/queue/ (IQueuePort + IJobQueuePort + types)
- [x] 建立 packages/ports/auth/ (IAuthPort + types)
- [x] 建立 packages/ports/index.ts barrel re-export + package.json

## Phase 4: Application 層拆分為獨立服務模組
- [x] 建立 packages/application/identity/ (IdentityService)
- [x] 建立 packages/application/workspace/ (WorkspaceService)
- [x] 建立 packages/application/knowledge/ (KnowledgeService)
- [x] 建立 packages/application/agent/ (AgentService)
- [x] 建立 packages/application/model/ (ModelService)
- [x] 建立 packages/application/audit/ (AuditService)
- [x] 建立 packages/application/usage/ (UsageService)
- [x] 建立 packages/application/automation/ (AutomationService)
- [x] 建立 packages/application/index.ts barrel + SERVICE_DEPENDENCIES + package.json

## Phase 5: Adapters 拆分為獨立適配器包
- [x] 建立 packages/adapters/cloudflare-d1/ (CloudflareD1Adapter + D1Repository<T>)
- [x] 建立 packages/adapters/cloudflare-kv/ (CloudflareKVCacheStore + CloudflareKVSessionStore)
- [x] 建立 packages/adapters/cloudflare-r2/ (CloudflareR2Adapter)
- [x] 建立 packages/adapters/d1-full-text-search/ (D1FullTextSearchAdapter)
- [x] 建立 packages/adapters/openai/ (OpenAIChatAdapter + OpenAIEmbeddingAdapter)
- [x] 建立 packages/adapters/openrouter/ (OpenRouterChatAdapter)
- [x] 建立 packages/adapters/workers-ai/ (WorkersAIChatAdapter + WorkersAIEmbeddingAdapter)
- [x] 建立 packages/adapters/index.ts barrel re-export
- [x] 建立 packages/adapters/package.json

## Phase 6: 補強 apps 層
- [x] 建立 apps/api-worker/ (index.ts, wrangler.toml, package.json, tsconfig.json)
- [x] 建立 apps/web-console/ (index.html, app.ts, package.json)
- [x] 建立 apps/cli/ (index.ts, package.json, tsconfig.json)

## Phase 7: 補強 Infrastructure
- [x] 建立 contracts/openapi/ (api-v1.yaml)
- [x] 建立 contracts/events/ (events.yaml)
- [x] 建立 migrations/sqlite/ (001_initial_schema.sql)
- [x] 建立 migrations/postgres/ (001_initial_schema.sql with pgvector)
- [x] 補強 infra/docker-compose/env.example 和 docker-compose.local.yaml
- [x] 補強 infra/helm/ Helm chart (templates/: _helpers, serviceaccount, configmap, deployment, service, ingress, secrets, hpa, pdb, servicemonitor, migration-job, workers)

## Phase 8: 補強 Runtime 層
- [x] 建立 runtimes/cloudflare/src/ (bootstrap.ts, index.ts)
- [x] 建立 runtimes/node/src/ (bootstrap.ts, index.ts)
- [x] 建立 runtimes/docker/ (index.ts with env mapping + shutdown handlers)
- [x] 建立 runtimes/kubernetes/ (index.ts with K8s probes)
- [x] 更新 runtimes/index.ts barrel re-export

## Phase 9: 補強 Docs 與 Tools
- [x] 建立 docs/ 各子目錄
- [x] 補強 tools/validators/
- [x] 補強 tools/generators/

## Phase 10: 清理與提交
- [ ] 清理 legacy 空白包（packages/mycodexvantaos-*）
- [ ] 移除或標記 memory-dream.yaml 為 non-MVP
- [ ] 更新 PLATFORM_ARCHITECTURE.md
- [ ] 更新 CI
- [ ] Git commit + Push + PR

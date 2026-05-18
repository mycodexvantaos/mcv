# README.md 及舊檔同步更新深度評估

## 評估結論：**需要更新**（3 個高優先、4 個中優先、2 個低優先）

---

## 進度追蹤

| PR  | 範圍                                 | 狀態                                 |
| --- | ------------------------------------ | ------------------------------------ |
| #75 | README.md + PLATFORM_ARCHITECTURE.md | ✅ 已完成（docs/sync-readme-v0.1.0） |
| #76 | CONTRIBUTING.md                      | 🔲 待處理                            |

### PR #75 已解決的項目

- ✅ 1.1 Node.js 版本 → 更新為 Node.js 22+
- ✅ 1.2 遺漏的應用層 → 新增 api-node + admin-console（5 apps）
- ✅ 1.3 遺漏的目錄結構 → 新增 python/, release/, providers/, runtimes/local/
- ✅ 1.4 過時的合約數量 → 更新為 15/14/7/16/5
- ✅ 1.5 過時的開發指令 → 新增 governance:check, rc:verify, rc:soak, release:\* 等
- ✅ 1.6 過時的 Docker 端口 → 修正為 port 9100
- ✅ 1.7 過時的 V6 歷史描述 → 新增 V7-V9
- ✅ 1.8 三階段策略表 → 新增 Phase 5: Release & Supply Chain
- ✅ 1.9 API 端口 → 修正為 /v1/health, /v1/version 等
- ✅ 3.1 架構層數不一致 → 統一為 nine-layer
- ✅ 3.2 缺少 Release & Supply Chain 章節 → 已新增 Layer F 及詳細說明
- ✅ 3.3 Python Intelligence Plane 未提及 → 已新增 Section 12
- ✅ CI Badge → 已更新
- ✅ npm → pnpm 統一
- ✅ MIT → Proprietary 授權
- ✅ SHA-256 → SHA3-512 primary / SHA-256 secondary
- ✅ PLATFORM_ARCHITECTURE.md apps 列表更新為 5 apps
- ✅ PLATFORM_ARCHITECTURE.md 實作狀態新增 Phases 10-13

---

## 一、README.md（高優先 🔴）

README.md 是專案門面，目前有 **9 處明確過時**，部分會直接誤導使用者：

### 1.1 過時的先決條件

| 項目             | README 現值                        | 實際值                                             | 影響                             |
| ---------------- | ---------------------------------- | -------------------------------------------------- | -------------------------------- |
| Node.js 版本     | "Node.js 20+"                      | **Node.js 22+**（v22.22.2，CI 全線用 Node 22）     | 🔴 使用者用 Node 20 會遇到不相容 |
| CI/CD 工作流數量 | "38 CI/CD pipeline configurations" | **22 個 .yml 檔**（但含子目錄 argocd/ 等共 49 條） | 🟡 數量不準確                    |

### 1.2 遺漏的應用層

README 的 Repository Structure 區塊列了 3 個 app：

- `apps/api-worker/`
- `apps/web-console/`
- `apps/cli/`

**實際有 5 個 app**，缺少：

- `apps/api-node/` — 這是 v0.1.0 的核心 API（port 9100），目前主要入口
- `apps/admin-console/` — 管理控制台

這是最嚴重的遺漏，因為 `apps/api-node/` 是 Docker 和 self-hosted 的主要 runtime。

### 1.3 遺漏的目錄結構

README 的 repo structure 完全未提及以下已存在的目錄：

| 缺漏目錄          | 說明                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| `python/`         | Python intelligence plane（4 packages + 3 apps），已在 PR #58-#61 加入             |
| `release/`        | Release artifacts + policies（SBOM, provenance, signing policy, promotion policy） |
| `providers/`      | 5 個 Cloudflare provider packages                                                  |
| `runtimes/local/` | 本地 runtime bootstrap                                                             |

### 1.4 過時的合約數量

| 項目                     | README 現值        | 實際值                                                                                    |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| service-definitions YAML | 10                 | **15**                                                                                    |
| JSON Schema 檔案         | 5                  | **14**                                                                                    |
| events 結構              | 單一 `events.yaml` | **7 個分類事件 YAML**（audit, knowledge, memory, agent, usage, runtime + 原 events.yaml） |
| resource-kinds           | 未提及             | **16 個 YAML**                                                                            |
| policies                 | 未提及             | **5 個 YAML**                                                                             |

### 1.5 過時的開發指令

README 列出的指令缺少 v0.1.0 新增的重要指令：

| 缺少指令                          | 說明                    |
| --------------------------------- | ----------------------- |
| `pnpm rc:verify`                  | RC 驗證（8 大類檢查）   |
| `pnpm rc:soak`                    | Soak 驗證報告           |
| `pnpm release:artifacts`          | 發布 artifact 生成      |
| `pnpm release:sbom`               | CycloneDX SBOM 生成     |
| `pnpm release:provenance`         | SLSA v1 provenance 生成 |
| `pnpm release:promotion:evaluate` | 發布閘道評估            |
| `pnpm governance:check`           | 24 項治理檢查           |
| `pnpm contracts:validate`         | 合約驗證                |
| `pnpm policy:check`               | 政策檢查                |

README 仍列出 `npm install` 和 `npm run setup` 等不存在或非標準的指令。

### 1.6 過時的 Docker 端口

README 範例用 `docker run -p 3000:3000`，實際 API 在 **port 9100**（Dockerfile 的 EXPOSE 9100）。

### 1.7 過時的 V6 歷史描述

README 的 Project History 表格停在 V6 "Governance Hardening"，缺少後續里程碑：

- **V7**: Release Candidate Stabilization（CodeQL 整合、TFC guard、RC verify）
- **V8**: Release Validation & Packaging（SBOM、provenance、artifact digests、self-hosted quickstart、promotion policy）
- **V9**: RC Soak & Stable Promotion Readiness（soak validation、gate evaluation、signing plan、v0.1.0 stable draft）

### 1.8 三階段策略表需要更新

Phase 4 "Governance Hardening" 標記為 ✅ Complete 但內容描述不完整。缺少 Phase 5: Release & Supply Chain。

### 1.9 API 端口

README 的 API Quick Reference 列出 `/health`，但 v0.1.0 的 API 實際在 port 9100 並暴露 `/v1/health`、`/v1/version`、`/v1/runtime` 等端點。

---

## 二、CONTRIBUTING.md（高優先 🔴）

CONTRIBUTING.md **嚴重過時**，描述的是一個完全不同的架構：

### 2.1 架構描述完全不符

CONTRIBUTING.md 描述的是「六層架構」（Layer A-F）：

- Layer A: Builder（api-generator, schema-generator...）
- Layer B: Runtime（execution, session-runtime...）
- Layer C: Native Services（native-queue, native-logging...）
- Layer D: Connector（connector-github, connector-redis...）
- Layer E: Deployment（auto-scaler, load-balancer...）
- Layer F: Governance（audit-logger, compliance-checker...）

**實際架構是八/九層 hexagonal port/adapter**（Core → Ports → Application → Adapters → Infrastructure → Governance → Runtimes → Apps），與 CONTRIBUTING.md 描述完全不同。

### 2.2 工具鏈不符

| CONTRIBUTING.md 現值      | 實際值                         |
| ------------------------- | ------------------------------ |
| `npm install`             | `pnpm install`                 |
| `npm run setup`           | 不存在                         |
| `npm test`                | `pnpm test`                    |
| `npm run test:coverage`   | 不存在                         |
| `npm run build`           | `pnpm build`                   |
| MIT License               | Proprietary（README 明確標註） |
| `docker run -p 3000:3000` | `docker run -p 9100:9100`      |

### 2.3 品質標準缺少治理相關項

CONTRIBUTING.md 的 PR checklist 未包含：

- Governance check（`pnpm governance:check`）
- Contract validation（`pnpm contracts:validate`）
- No Section Sign Symbol check
- RC verify（`pnpm rc:verify`）

---

## 三、PLATFORM_ARCHITECTURE.md（中優先 🟡）

PLATFORM_ARCHITECTURE.md 整體較為準確，但有數處需要同步：

### 3.1 架構層數不一致

README 說「eight-layer」，PLATFORM_ARCHITECTURE.md 說「Nine-Layer Architecture (Updated with Capabilities Layer)」。兩份文件應統一。

### 3.2 缺少 Release & Supply Chain 章節

PLATFORM_ARCHITECTURE.md 未涵蓋 v0.1.0 的 release pipeline：

- Release artifact generation
- SBOM (CycloneDX 1.5)
- Provenance (SLSA v1 / in-toto)
- Signing policy
- Promotion gates
- Soak validation

### 3.3 Python Intelligence Plane 未提及

PLATFORM_ARCHITECTURE.md 未涵蓋 `python/` 目錄下的 intelligence plane。

---

## 四、CI Badge 參照（中優先 🟡）

README 使用兩個 badge：

1. `platform-constitution-ci.yml` — ✅ 存在
2. `codeql.yml` — ✅ 存在

但缺少重要的活躍 CI badge：

- `unified-ci.yaml`（主要 CI pipeline）
- `release-candidate-check.yml`
- `governance-check.yml`

建議更新為反映當前活躍的 CI 狀態。

---

## 五、docs/ 內部文件（中優先 🟡）

### 5.1 docs/ 結構已大幅擴展

README 只列出 `docs/api/`、`docs/deployment/`、`docs/operations/`，但實際 docs/ 現有 25+ 子目錄，包括：

- `docs/releases/` — 發布說明和報告
- `docs/security/` — 簽署計畫
- `docs/self-hostable/` — 自架快速入門
- `docs/architecture/` — 架構文件
- `docs/architecture-decision-records/` — ADR
- `docs/memory-dream/` — Dream safety
- 等等

### 5.2 需要更新 README 的 docs 結構引用

---

## 六、package.json name 欄位（低優先 🟢）

`package.json` 的 `name` 欄位是 `"nextn"`，這是原始模板的遺留，不代表專案名稱。雖然不影響功能，但可能造成混淆。

---

## 七、合約數量摘要（低優先 🟢）

README 的 Service Categories 表格列了 MVP 和 Post-MVP 服務，但部分 MVP 服務已實作而 Post-MVP 服務尚未更新。這屬於漸進式更新，不急迫。

---

## 建議的更新策略

### 建議拆為 2 個 PR：

**PR #75: `docs(readme): sync README.md with v0.1.0 stable`**

- 修正 Node.js 版本為 22+
- 新增 `apps/api-node/` 和 `apps/admin-console/`
- 新增 `python/`、`release/`、`providers/`、`runtimes/local/` 到 repo structure
- 更新合約數量
- 新增 release/governance 指令區塊
- 修正 Docker port 為 9100
- 更新 CI badge
- 新增 V7-V9 到 Project History
- 更新 Three-Phase Strategy 表格

**PR #76: `docs(contributing): rewrite CONTRIBUTING.md for v0.1.0`**

- 完全重寫架構描述為 hexagonal port/adapter
- 統一工具鏈為 pnpm
- 更新 PR checklist 加入治理檢查
- 修正 License 為 Proprietary
- 修正 Docker port
- 新增 governance/contract/policy 驗證指令

PLATFORM_ARCHITECTURE.md 的更新可併入 PR #75 或單獨為 PR #77。

---

### PR #76 已解決的項目

- ✅ 2.1 架構描述完全不符 → 重寫為九層 hexagonal port/adapter（Layer A-I）
- ✅ 2.2 工具鏈不符 → 統一為 pnpm 9，Node.js 22+
- ✅ 2.3 品質標準缺少治理相關項 → PR checklist 新增 governance:check, contracts:validate, no-section-sign
- ✅ Docker port 3000 → 9100
- ✅ MIT License → Proprietary
- ✅ 新增雙平面架構說明（TypeScript Control Plane + Python Intelligence Plane）
- ✅ 新增完整的 repository structure
- ✅ 新增 governance 與 release pipeline 指令
- ✅ 新增分支命名慣例（feature/, fix/, docs/, governance/, contract/, chore/）
- ✅ 新增 conventional commit type: governance, contract

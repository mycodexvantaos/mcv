# MyCodeXvantaOS Naming Convention Specification v1.0（正式版）

**Document ID:** `mcx-naming-spec-v1.0`
**Status:** Official / Enforced
**Version:** 1.0.0
**Date:** 2026-07-19
**Authority:** Platform Governance (`governance/platform-governance-spec.yaml`)
**產出依據:** 對真實 repo 的實證深度掃描 + PR #203 CI 失敗的本地重現複驗 + 自我挑戰審查

---

## 0. 版本定位

本規範是 MyCodexVantaOS 平台的**首次正式版命名慣例**。它由三部分產出：(a) 對真實 repo 的實證深度掃描（`REALITY-CHECK-REPORT.md`、`repo-scan-report.json`）、(b) 對 PR #203 所有失敗 CI 檢查的 log-level 分析與**本地重現複驗**、(c) 自我挑戰審查以移除假設。

本規範在訂定時即已吸收 PR #203 的全部教訓，因此從第一版起就內建三項防護機制，避免重蹈覆轍：

1. **Rule 0 — PR 前置驗證義務**：任何涉及 CI 設定的 PR，作者須附本地零失敗輸出。
2. **Fix Status 三態制**：「已修復」聲明須附驗證證據，否則僅標為 `Unverified`，不得用以宣告 PR 可合併。
3. **Rule 11 — Secret 與 Bootstrap 檔案治理**：bootstrap 產物不得入庫；gitleaks 須以嚴格 exit code 執行。

> **核心原則：** 任何「Fix Status」欄位標為 `Verified` 前，必須附本地 `pnpm format:check && pnpm lint` 零失敗輸出或 CI run 連結。標為 `Unverified` 的項目不得用以宣告 PR 可合併。

---

## 1. Executive Summary

本規範是 MyCodexVantaOS 平台的權威命名慣例。它的設計目的是消除跨層（Kubernetes、npm、Python、YAML、env vars）的命名衝突——這些衝突不是風格偏好，而是會造成 `kubectl apply` 拒絕、`npm publish` 失敗、`import` SyntaxError、YAML lint CI 失敗的具體錯誤。

**本規範確認的違規類別（經本地 `pnpm format:check` + `pnpm lint` 重現，源自 PR #203 的實測）：**

| Category | Root Cause | Severity | Fix Status |
|----------|-----------|----------|------------|
| 10 個 package.json 缺檔尾 `\n` | 以 `open(f,'w')` 重寫檔案未補 `\n` | CI Blocker | 🔴 Unverified（PR #203 聲稱已修，實測仍失敗）|
| `eslint.config.js` 過度簡化（刪 ignores/globals/domain guard）| 誤將治理結構當冗餘刪除 | CI Blocker | 🔴 Unverified（PR #203 誤判為 quote style 問題，實為 11,392 errors）|
| `super-linter.yml` 多行 `FILTER_REGEX_EXCLUDE` | YAML `>-` 折疊改變 regex 語義 + prettier 不滿 | CI Blocker | 🔴 Unverified |
| `super-linter.yml` 啟用 `VALIDATE_JSON` + 縮減 `SHELLCHECK_OPTS` | 重啟已禁用的 lint 衝突 | 高風險 | ⚠️ 未驗證 |
| `app_manifest_server.py` 含活態 `gho_` PAT | bootstrap 腳本入庫 + 硬編碼密鑰 | 🔴 安全 | 🔴 待 rotate + 刪檔 |
| 4 個 root 密鑰檔（`github_app_*.json`、`oauth_app_result.json`）| bootstrap 產物入庫 root | 安全/治理 | ⚠️ 內容已 redact，但檔案不應存在 |

---

## 2. Scope and Applicability

本規範治理：

- **目錄：** `packages/`、`services/`、`modules/`、`providers/`、`apps/`、`infra/`、`contracts/`、`schemas/`、`governance/`、`.github/workflows/`、`tooling/`、`tests/`
- **檔名：** TypeScript、JavaScript、YAML、JSON、Markdown、Python
- **程式碼識別字：** 變數、函式、類別、介面、型別、列舉
- **基礎設施：** Kubernetes 資源名、Docker Compose 服務名、Helm values 鍵、環境變數
- **API 設計：** HTTP route 路徑、JSON 欄位名、事件名
- **CI/CD：** workflow 檔名、job 名、step 名、**PR 前置驗證義務（Rule 0）**
- **安全治理：** Secret 儲存、bootstrap 產物、gitleaks 嚴格性（Rule 11）

**不在 scope 內：** 第三方 vendored 程式碼、`project-import/`、`packages/jsonata/`、生成的 lock 檔。

---

## 3. Part I — 命名分析：確認的問題

### 3.1 Hyphen vs Underscore（`-` vs `_`）衝突

每層 stack 有結構性理由偏好其一，混用會造成錯誤而非僅風格警告。

#### 3.1.2 衝突對照表（節錄）

| Context | Observed Mix | Concrete Error |
|---------|-------------|----------------|
| Kubernetes 資源名 | `mycodexvantaos-core-auth` vs `mycodexvantaos_core_auth` | RFC 1123：DNS subdomain 只允 `-`，`kubectl apply` 拒絕底線 |
| npm scoped 套件名 | `@mycodexvantaos/ports` vs `@mycodexvantaos/ports_database` | npm registry 拒絕 scoped 名含 `_` |
| Python 模組名 | `mcv_auditor/`（底線）vs `mycodexvantaos-ai-embedding`（連字目錄）| `import mycodexvantaos-ai-embedding` 為 SyntaxError |
| 環境變數 | `DATABASE_URL` | POSIX sh 要求 `[A-Za-z_][A-Za-z0-9_]*`，連字會 fatal |
| GitHub Actions trigger | `on:`（裸）| YAML 1.1：`on` 是 boolean `true` 同義詞，**直接造成 YAML Lint Guard CI 失敗** |

### 3.1.3 掃描結果 — 實際 repo 狀態

```
Repository empirical scan (2026-07-18, base main@15afba1a):
  Top-level dirs: 17 hyphen-style, 2 underscore-style (__tests__, mcv_auditor)
  modules/: ALL 54 use mycodexvantaos-<name> (kebab, correct)
  services/: ALL 51 use mycodexvantaos-<name> (kebab, correct)
  packages/: 93 dirs — mixed: ports, adapters (no prefix) + mycodexvantaos-* (with prefix)
  providers/: category/provider-name hierarchy (kebab, correct)
  TypeScript files by naming style: kebab=570, PascalCase=27, snake=1, camelCase=5
  Workflow files with bare `on:`: 1 (super-linter.yml — FIXED to "on":)
```

> **註：** 「Workflow files with bare `on:`: 1 — FIXED」此處指 `super-linter.yml` 已改 `"on":`，屬 Rule 4 範疇且經複驗通過（`YAML Lint Guard` 應通過）。但此修復**不**等同於 PR #203 全部 CI 已通過——`format:check` 與 `lint` 仍失敗（見 §7）。

### 3.2 其他命名不一致

#### 3.2.3 套件前綴不一致

5 個核心套件（`ports/`、`adapters/`、`core/`、`application/`、`runtime/`）目錄名無 `mycodexvantaos-` 前綴，但 npm 名為 `@mycodexvantaos/<name>`（scoped，正確）。**決策：目錄名 grandfathered，新套件須用 `mycodexvantaos-<name>/` 目錄名 + `@mycodexvantaos/<name>` npm 名。**

#### 3.2.4 apiVersion 格式

`mycodexvantaos.org/v1` 為正確（schema validator 強制 `^mycodexvantaos\.org/v`）；`mycodexvantaos.io/v1` 為錯誤。

---

## 4. Part II — 自我審查 / 挑戰

### 4.1–4.6 自我挑戰項（kebab-case 真慣例性、YAML/JSON key split、Python 連字目錄、`"on":` 引號必要性、legacy `.eslintrc.json`、missing newline 歸因）

以上挑戰結論均成立並經實證掃描支持，保留為規範依據。

### 4.7 挑戰：「Fix Applied」聲明是否經驗證？

**挑戰：** PR #203 的命名規範草稿曾宣告所有 CI Blocker「已修復」，但 PR 在作者聲稱「resolve all CI failures」的 commit 之後，`mergeable_state` 仍為 `unstable`。聲稱是否經過實際 `pnpm format:check`/`lint` 驗證？

**複驗方法：** Node 22 + pnpm 10，`pnpm install --frozen-lockfile` 成功後執行：
- `pnpm format:check` → 11 檔 `[warn]`，exit 1
- `pnpm lint` → 13,342 problems（11,392 errors），exit 1

**裁決：** ❌「已修復」聲明不實。10 個 package.json 缺檔尾 `\n`、`eslint.config.js` 刪除 ignores/globals、`super-linter.yml` 多行 regex 三項均未實際修復。草稿誤將 `lint` 失敗根因寫為「prettier 對 eslint.config.js 的 quote style 警告」，嚴重低估為單一檔案風格問題，實為 config 結構性刪減導致的 11,392 errors。

**教訓：** 「Fix Applied」欄位不得在未驗證前填入；須改為「Fix Status」並附驗證證據（Rule 0）。

### 4.8 挑戰：bootstrap 腳本與密鑰檔是否應入庫？

**挑戰：** PR #203 在 repo root 新增 `app_manifest_server.py`（含硬編碼 `gho_` PAT）與 4 個密鑰 JSON/PEM 檔。即使密鑰檔已 redact，這類「setup/bootstrap 產物」是否應存在於 repo root？

**裁決：** ❌ 不應入庫。bootstrap 腳本屬一次性產物，含環境特定硬編碼（絕對路徑 `/home/user/...`、sandbox 主機名），且其密鑰讀取方式（硬編碼）與專案治理（環境變數/secrets）衝突。應存放於 `.github/setup/`（並以 `.example` 模板化）或完全不入庫。

---

## 5. Part III — 產業標準參照

| Layer | Rule | Standard |
|-------|------|----------|
| DNS / K8s names | lowercase + hyphens, ≤63 chars | RFC 1123 §2.1 |
| npm package names | lowercase, hyphens, scoped 無底線 | npm package-name-guidelines |
| Docker image names | lowercase `[a-z0-9._-]` | OCI Distribution Spec §3.1 |
| TS identifiers | camelCase (vars/fns), PascalCase (classes/types) | TS Handbook |
| TS file names | kebab-case | Google TS Style Guide §3.2 |
| Python identifiers | snake_case (vars/fns), PascalCase (classes) | PEP 8 |
| Python module names | lowercase, underscores only | PEP 8 §Packages |
| Env vars | SCREAMING_SNAKE_CASE | POSIX.1-2017 §8.1 |
| HTTP API paths | lowercase-kebab | Google API Design Guide |
| HTTP API JSON fields | snake_case | Google JSON Style Guide §7 |
| YAML boolean keys | quote `"on":`, `"yes":`, `"no":` | YAML 1.1 §10.3.2 |
| K8s structural keys | camelCase (apiVersion, kind, metadata, spec) | K8s API Conventions |
| JSON Schema `$id` | absolute URI | JSON Schema draft-07 §9.2 |
| SemVer | MAJOR.MINOR.PATCH | SemVer 2.0.0 |
| Git branches | lowercase-kebab | GitHub Flow |
| GitHub Actions `on:` | MUST quote `"on":` | actions/runner#1173 |
| **Secrets in source** | **NEVER commit; use env/secrets** | **OWASP A02:2021, GitHub Secret Scanning** |

---

## 6. Part IV — 標準規則（Normative）

> 標記 **[ENFORCED]** 由自動化 CI 檢查；**[CONVENTION]** 由 code review 檢查；**[GRANDFATHERED]** 僅適用新檔。

### Rule 0 — PR 前置驗證義務〔ENFORCED〕

```
[ENFORCED]   任何涉及 CI 設定、lint、format、workflow 的 PR，
             作者須在 PR 描述附上以下本地零失敗輸出（Node 22 + pnpm）：
               pnpm install --frozen-lockfile
               pnpm format:check   # 必須 0 [warn]
               pnpm lint           # 必須 0 error（warning 可接受但須列出）
             未附驗證輸出的 PR，reviewer 不得標記任何「Fix」為完成。
[ENFORCED]   「Fix Status」分三態：
               Verified    — 附本地輸出或 CI run 連結，已重現零失敗
               Unverified  — 僅聲稱修復，未附證據；不得用以宣告可合併
               Pending     — 尚未處理
```

### Rule 1 — 目錄名

```
[ENFORCED]   modules/<name>:    mycodexvantaos-<domain>-<function>   (kebab, platform prefix)
[ENFORCED]   services/<name>:   mycodexvantaos-<domain>-<function>   (kebab, platform prefix)
[ENFORCED]   packages/<name>:   <function> or mycodexvantaos-<name>  (see §3.2.3)
[ENFORCED]   providers/<cat>/<name>: <category>/<category>-<provider>
[CONVENTION] apps/<name>:       <function>-<type> (e.g., web-console, api-worker)
[ENFORCED]   No uppercase letters in ANY directory name
[ENFORCED]   No underscores in infrastructure directory names (Kubernetes-facing)
[CONVENTION] Python packages under python/: snake_case only
```

### Rule 2 — 檔名（強調檔尾換行）

```
[ENFORCED]   TypeScript/JavaScript source files: kebab-case.ts / kebab-case.tsx
[ENFORCED]   YAML manifest files: <resource-type>-manifest.yaml or module-manifest.yaml
[ENFORCED]   JSON Schema files: <name>.schema.json
[CONVENTION] Python source files: snake_case.py
[ENFORCED]   GitHub Actions workflows: kebab-case.yml (under .github/workflows/)
[ENFORCED]   ALL text files: must end with a single newline character (\n)
             — 違反此條會被 `prettier --check` 攔截（prettier.config.js endOfLine:'lf'）
             — 自動化檔案寫入須用 `content + "\n"` 或 `print(..., end="\n")`
```

### Rule 3 — 程式碼識別字

```
TypeScript:  vars/fns = camelCase; classes/interfaces/types/enums = PascalCase;
             enum members = SCREAMING_SNAKE; module consts = SCREAMING_SNAKE;
             private members = _camelCase
Python:      vars/fns = snake_case; classes = PascalCase;
             module consts = SCREAMING_SNAKE; private = _snake_case
```

### Rule 4 — YAML Keys

```
[ENFORCED]   K8s structural keys:    camelCase  (apiVersion, kind, metadata, spec)
[CONVENTION] Domain payload keys:    kebab-case
[ENFORCED]   GitHub Actions trigger: "on":   (MUST quote — never bare on:)
[ENFORCED]   YAML boolean-valued keys: quote if value is yes/no/true/false/on/off
[ENFORCED]   YAML files: must end with a single newline (\n)
```

### Rule 5 — JSON Fields

```
[CONVENTION] REST API fields:        snake_case
[CONVENTION] JSON Schema properties: snake_case
[CONVENTION] JSON Schema meta-keys:  camelCase ($id, $schema, additionalProperties)
[ENFORCED]   JSON files: valid JSON (no trailing commas, no comments)
[ENFORCED]   JSON files: must end with a single newline (\n)
```

### Rule 6 — API Routes

```
[CONVENTION] HTTP path segments: lowercase-kebab  (/api/v1/audit-events)
[CONVENTION] Path parameters:    snake_case        (/users/{user_id})
[CONVENTION] Query parameters:   snake_case        (?page_size=10)
[CONVENTION] API version prefix: /api/v1/          (semver major only)
```

### Rule 7 — 環境變數

```
[ENFORCED]   All env vars:      SCREAMING_SNAKE_CASE
[ENFORCED]   No hyphens in env var names (POSIX sh fatal)
[CONVENTION] Platform prefix:   MYCODEXVANTAOS_
[CONVENTION] Provider-specific: <PROVIDER>_API_KEY (e.g., OPENAI_API_KEY)
```

### Rule 8 — npm 套件名

```
[ENFORCED]   Published packages: @mycodexvantaos/<name>   (scoped, never @mycodex or @mcxos)
[ENFORCED]   Package identifier: lowercase-kebab-case
[CONVENTION] Internal workspace: private: true
[ENFORCED]   npm scripts:        <verb>:<qualifier>  (test:e2e, format:check)
```

### Rule 9 — 基礎設施

```
Kubernetes:  resource.metadata.name = lowercase-kebab (RFC 1123);
             namespaces = mycodexvantaos, mycodexvantaos-{dev,staging,prod};
             label keys = <domain>/<key>
Helm:        values.yaml keys = camelCase; chart name = lowercase-kebab
Docker:      image names = mycodexvantaos/<service>:<tag> (lowercase, no uppercase)
```

### Rule 10 — Manifests 與 Schemas

```
[ENFORCED]   apiVersion:   mycodexvantaos.org/v<N>    (domain = .org, NOT .io)
[ENFORCED]   kind:         PascalCase singular (Module, Service, CapabilitySet, ExceptionRegister)
[ENFORCED]   metadata.name: kebab-case, prefixed mycodexvantaos-
[CONVENTION] spec fields:  kebab-case (YAML), snake_case (JSON schemas)
[ENFORCED]   supportsModes: ["connected","hybrid"] — NOT "native" for external API providers
```

### Rule 11 — Secret 與 Bootstrap 檔案治理〔ENFORCED〕

```
[ENFORCED]   NEVER commit secrets (PAT, OAuth secret, PEM private key, installation token)
             to source control — 不論檔案、不論歷史 commit。
[ENFORCED]   密鑰須存於 GitHub Actions secrets / Vault / Secrets Manager；
             repo 內僅允許 .example 模板（含 REDACTED 佔位符）。
[ENFORCED]   bootstrap/setup 一次性腳本（含環境特定硬編碼：絕對路徑、sandbox 主機、
             token）不得入庫 root；須存放於 .github/setup/ 並模板化，或完全不入庫。
[ENFORCED]   gitleaks / secret-scan workflow 須以嚴格 exit code（非零）執行，
             不得以 --exit-code 0 || true 短路。
[ENFORCED]   若密鑰曾進入 git history（即使事後 force-push 覆蓋），
             視為已洩漏：須立即 rotate/revoke，並以 git filter-repo 清理歷史。
             僅刪除檔案不足。
[ENFORCED]   tooling/ 治理腳本須被 workflow 或 pre-commit hook 實際引用，
             並附 pytest 覆蓋；未被引用的腳本視為 dead code，
             不得以「治理工具」名義入庫。
```

---

## 7. Part V — CI 失敗根因分析（以本地重現為準）

### 7.1 PR #203 失敗摘要（經本地 `pnpm format:check` + `pnpm lint` 重現）

| CI Check | Result | Root Cause | Fix Status |
|----------|--------|-----------|------------|
| **Core CI / Code Lint and Formatting（`prettier --check .`）** | ❌ FAIL（11 檔）| 10 個 package.json 缺檔尾 `\n`（重寫時 `open(f,'w')` 漏寫）；`super-linter.yml` 多行 `FILTER_REGEX_EXCLUDE` | 🔴 Unverified（PR #203 聲稱已修，實測仍失敗）|
| **Core CI / Code Lint（`eslint .`）** | ❌ FAIL（11,392 errors）| `eslint.config.js` 刪除 ~40 條 `ignores`、整段 `globals`、`no-restricted-syntax` domain guard；`web-deploy/worker.js` 等被越界 lint | 🔴 Unverified（PR #203 誤判為 quote style）|
| **Lint Code Base / YAML** | ⚠️ 視 `super-linter.yml` 多行 regex 而定 | 多行 `FILTER_REGEX_EXCLUDE` 改變語意、遺失 `infra/helm/.*/templates/.*`、`argocd/.*` 排除 | 🔴 Unverified |
| **Lint Code Base / JSON** | ⚠️ 高風險 | 啟用 `VALIDATE_JSON: true` + `.eslintrc.json`，可能重啟 v7.4 ESLint/flat-config 衝突 | ⚠️ 未在 CI 實跑驗證 |
| **Lint Code Base / Shellcheck** | ⚠️ 高風險 | `SHELLCHECK_OPTS` 由 7 項縮減為 1 項，重啟 6 項檢查 | ⚠️ 未驗證 |
| **YAML Lint Guard** | ✅ 預期通過 | `super-linter.yml` 已改 `"on":`（quoted） | ✅ Verified（此單項）|
| **Gitleaks / Secret Scan** | ❌ 應失敗但被短路 | `app_manifest_server.py` 含活態 `gho_` PAT；workflow `--exit-code 0 \|\| true` 短路 | 🔴 安全（須 rotate + 刪檔 + 改嚴格 exit）|
| **Core CI / Tests** | ⏭ SKIP | `needs: [lint]` gate；lint 失敗故測試未跑 | 待 lint 修復後自動觸發 |
| **Unified CI / Build** | ⏭ SKIP | 同上 | 同上 |

### 7.2 為何下游檢查被 SKIP

GitHub Actions `needs:` 在上游 job 失敗時將下游標為 skipped（非 failed）。此為正確 CI 設計，避免在未通過格式/lint 時浪費 build/test 運算。skipped 檢查**非獨立失敗**，lint 修復後會自動啟動。

### 7.3 修復優先順序

```
Priority 0（安全，立即）:
  → rotate/revoke app_manifest_server.py 中的 gho_ PAT 與所有曾入 history 的憑證
  → 從 PR 刪除 app_manifest_server.py 與 4 個 root 密鑰檔
  → gitleaks.yaml 改嚴格 exit code

Priority 1（CI Blocker，阻塞所有下游）:
  → 還原 10 個 package.json 檔尾 \n（pnpm prettier --write）
  → 還原 super-linter.yml 為單行 FILTER_REGEX_EXCLUDE（含 infra/helm、argocd 排除）
  → 還原 eslint.config.js 的 ignores / globals / no-restricted-syntax
     （或 git checkout main -- eslint.config.js，另 PR 謹慎現代化）
  → 本地跑 pnpm format:check && pnpm lint 確認零失敗（Rule 0）

Priority 2（風險管控）:
  → 評估 VALIDATE_JSON 重啟風險（CI 實跑一次 super-linter 後決定）
  → 若縮減 SHELLCHECK_OPTS，同步修復受影響 shell 腳本

Priority 3（流程）:
  → 拆分 PR：CI 修復 / 命名規範 / 重構計畫 / tooling 各自獨立
  → tooling scripts 接入 workflow + pytest，否則移除
```

---

## 8. Appendix A — 快速對照表

| What | Format | Example |
|------|--------|---------|
| Module dir | `mycodexvantaos-<domain>-<function>` | `mycodexvantaos-core-auth` |
| Service dir | `mycodexvantaos-<domain>-<function>` | `mycodexvantaos-ai-embedding` |
| npm package | `@mycodexvantaos/<kebab>` | `@mycodexvantaos/ports` |
| TS source file | `kebab-case.ts` | `audit-service.ts` |
| TS variable | `camelCase` | `auditEventId` |
| TS class | `PascalCase` | `AuditEventHandler` |
| TS constant | `SCREAMING_SNAKE` | `MAX_RETRY_COUNT` |
| Python module | `snake_case.py` | `deep_ci_triage.py` |
| Env var | `SCREAMING_SNAKE` | `DATABASE_URL` |
| K8s resource | `lowercase-kebab` | `mycodexvantaos-core-auth` |
| HTTP route | `lowercase-kebab` | `/api/v1/audit-events` |
| JSON field | `snake_case` | `event_type` |
| YAML key (domain) | `kebab-case` | `spec-authority` |
| YAML key (K8s structural) | `camelCase` | `apiVersion`, `spec` |
| apiVersion | `mycodexvantaos.org/v1` | `mycodexvantaos.org/v1` |
| kind | `PascalCase` | `Module`, `CapabilitySet` |
| GitHub Actions trigger | `"on":` (quoted) | `"on":\n  push:` |
| Docker image | `lowercase/kebab` | `mycodexvantaos/core-auth` |
| Helm values key | `camelCase` | `replicaCount` |
| npm script | `verb:qualifier` | `test:e2e`, `format:check` |
| **Secret storage** | **env / secrets / vault** | **`secrets.GITHUB_APP_PRIVATE_KEY`** |
| **PR fix status** | **Verified / Unverified / Pending** | **須附驗證輸出** |

---

## 9. Appendix B — 理由與例外登記

### B.1 Grandfathered Exceptions

| Item | Exception | Rationale |
|------|-----------|-----------|
| `packages/{ports, adapters, core, application, runtime}/` | 目錄名無 `mycodexvantaos-` 前綴 | 早於命名 spec；rename 會破壞所有 `workspace:*` 依賴；列為 tech-debt |
| `packages/jsonata/` | 4-space indent, JSDoc | 第三方 vendored fork |
| `mcv_auditor/` | 頂層底線目錄 | Python package；PEP 8 要求 snake_case |

### B.2 Domain `.io` vs `.org`

| Value | Status | Notes |
|-------|--------|-------|
| `mycodexvantaos.org/v1` | ✅ 正確 | 所有 manifest，schema validator 強制 |
| `mycodexvantaos.io/v1` | ❌ 錯誤 | 曾用於 module manifest；已修 |
| `mycodexvantaos.io/v1/CapabilitySet` | ⚠️ 僅 CapabilitySet 允許 | `governance/capability-set.yaml` legacy；待遷移 |

### B.3 變更歷史

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-19 | 首次正式版。整合實證 repo 掃描、PR #203 CI 失敗本地重現、自我挑戰審查。內建 Rule 0（PR 前置驗證）、Fix Status 三態制、Rule 11（secret/bootstrap 治理）。規則 1–10 經複驗正確。 |

---

## 10. 強制機制

```
本規範由以下 workflow 強制：
  .github/workflows/governance-check.yml   — 治理政策驗證
  .github/workflows/yaml-lint-guard.yml    — YAML boolean-key 守護
  pnpm format:check（prettier）            — Rule 2/4/5 檔尾換行、格式
  pnpm lint（eslint）                      — Rule 3 識別字、domain guard
  gitleaks / security-scan（嚴格 exit）    — Rule 11 secret 治理

Rule 0（PR 前置驗證）由 reviewer 於 PR 描述核驗；長期應以
  .github/workflows/pr-validation.yml 自動核驗 PR 描述含驗證輸出。
```

---

*本文件為 MyCodexVantaOS 治理框架之一部分。*
*Governed by: `governance/platform-governance-spec.yaml`*
*產出依據: PR #203 獨立複驗報告 `DIAGNOSIS-AND-FIX-PLAN.md`、`DESIGN-REVIEW.md`*

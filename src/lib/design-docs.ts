export const designDocsContent = `# AI 程式碼編輯生態深度研究開發者平台 - 完整架構規格

## 第一部分：架構需求與設計原則

### 1.1 核心需求分析

本平台需要服務三類主要用戶：

**開發者使用者**：需要一個整合的編輯環境，結合傳統IDE功能、AI輔助編程、深度生態研究工具
**研究者**：需要系統化的數據收集、分析、可視化工具來研究編輯器生態系統
**平台維護者**：需要完整的管理、監控、擴展機制來維持系統穩定性與可演進性

### 1.2 設計原則

**模組化**：每個功能獨立開發、測試、部署
**可擴展性**：支持新編輯器集成、新AI模型接入、新研究工具添加
**隔離性**：不同用戶的數據、配置、擴展互不干擾
**開源透明**：核心代碼、數據結構、API規範完全開放
**性能優先**：關鍵路徑優化，支持百萬行代碼編輯
**安全至上**：用戶數據隔離、擴展沙箱、API認證

---

## 第二部分：完整目錄樹結構 (已根據 AutoEcoOps 規範重構)

\`\`\`
autoeccops/
│
├── README.md
├── ARCHITECTURE.md                     # 本架構文檔
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json                        # Monorepo 根配置
├── pnpm-workspace.yaml                 # PNPM 工作區配置
├── turbo.json                          # Turbo Repo 配置
│
├── infra/                              # 基礎設施即代碼 (Terraform, Kubernetes)
│
├── docs/                               # 項目文檔
│   └── architecture/
│       ├── naming-convention.md        # 倉庫命名與架構映射指南
│       └── component-interaction.md    # 元件規格與交互設計
│
├── pkgs/                               # 共享包 (SDK, Contracts, etc.)
│   ├── softwareos-contracts/           # API 契約 (Protobuf, OpenAPI)
│   ├── softwareos-toolkit-sdk/         # 平台 SDK (TypeScript, Python)
│   ├── softwareos-toolkit-cli/         # 平台 CLI 工具
│   ├── softwareos-theme-engine/        # 主題引擎
│   └── softwareos-research-toolkit/    # 研究分析工具包
│
└── services/                           # 微服務架構
    ├── codevantaos/                    # 控制平面核心服務 (Core Infrastructure)
    │   ├── api-gateway/                # 核心 API Gateway
    │   ├── auth-service/               # 身份驗證與授權服務
    │   ├── policy-service/             # 策略與審計服務
    │   ├── memory-hub/                 # RAG 記憶與上下文中心
    │   ├── event-bus/                  # 事件總線 (Kafka/Redis Streams)
    │   ├── infra-manager/              # GitOps 基礎設施管理器
    │   ├── db-schemas/                 # 資料庫結構定義
    │   ├── signerd-service/            # 簽名服務
    │   ├── controller-manager/         # 通用控制器管理器
    │   ├── rolloutd-service/           # 部署滾動控制器
    │   ├── collaboration-service/      # 實時協作服務 (OT)
    │   ├── plugin-manager-service/     # 插件管理服務
    │   └── notification-service/       # 通知服務
    │
    └── softwareos/                     # 業務平台 (Business Platforms)
        ├── platform-observability/     # 觀測平台 (舊稱 Platform-01)
        │   ├── api/
        │   ├── web/
        │   └── worker/
        ├── platform-iaops/             # IaC/GitOps 平台
        │   ├── api/
        │   ├── web/
        │   └── agent/
        ├── platform-edge/              # 邊緣計算與節點管理平台
        │   ├── api/
        │   └── agent/
        ├── app-main/                   # 主應用 (Web, Desktop)
        │   ├── web/                    # (原 apps/web-editor)
        │   └── desktop/                # (原 apps/desktop-app)
        └── app-research/               # 研究平台專用應用
            ├── api/
            └── web/
\`\`\`

---

## 第三部分：核心模組詳細規格

(詳細規格請參考 \`docs/architecture/component-interaction.md\`)

---

## 第四部分：後端服務架構

### 4.1 REST API 端點規範

(API 契約詳細定義請參考 \`pkgs/softwareos-contracts/\`)

**核心 API Gateway (\`codevantaos-api-gateway\`)**
- \`/auth/...\` -> \`codevantaos-auth-service\`
- \`/policy/...\` -> \`codevantaos-policy-service\`
- \`/memory/...\` -> \`codevantaos-memory-hub\`

**業務平台 API**
- \`/observability/api/...\` -> \`softwareos-platform-observability-api\`
- \`/iaops/api/...\` -> \`softwareos-platform-iaops-api\`
- \`/main/api/...\` -> \`softwareos-app-main-api\` (如果有的話)

### 4.2 WebSocket 事件規範

(異步 API 契約詳細定義請參考 \`pkgs/softwareos-contracts/\`)

**事件總線 (\`codevantaos-event-bus\`) Topics**
- \`events.collaboration.operations\`
- \`events.collaboration.presence\`
- \`events.ai.completion.status\`
- \`events.agent.execution.log\`
- \`events.research.data.updated\`

---

## 第五部分：數據模型架構

(所有數據庫結構定義請參考 \`pkgs/codevantaos-db-schemas/\`)

---

(後續部分將根據重構後的架構進行調整)


# AI 程式碼編輯生態研究平台 - 元件規格與交互設計

## 第一部分：核心元件交互圖

### 1.1 系統層級交互

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                         客戶端層(Apps)                            │
├─────────────────────┬─────────────────────┬─────────────────────┤
│   Web Editor        │  Desktop App        │    CLI Agent         │
│  (React)            │  (Electron)         │    (Node.js)         │
└────────┬────────────┴────────┬────────────┴────────┬─────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API層 & WebSocket │
                    │  (Express/Fastify)  │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────────┐  ┌────────▼────────┐   ┌────────▼─────────┐
│  核心引擎層      │  │ 微服務層         │   │  數據層           │
│ (packages/core)  │  │ (services/)      │   │ (MongoDB/PostgreSQL)
└──────────────────┘  └──────────────────┘   └───────────────────┘
\`\`\`

### 1.2 編輯器核心內部交互

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│              Editor UI Component Tree                        │
├──────────────────────┬──────────────────┬───────────────────┤
│   EditorCore        │   FileExplorer   │   AIPanel         │
├─────────┬──────────┤                   ├────────┬──────────┤
│ Viewport│ CodeMirr│                   │Chatbox │Completion│
│ Buffer  │ror Area │                   │TerminalAgent      │
└─────────┴──────────┘                   └────────┴──────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Tokenization Engine │              │ LLM Provider Layer   │
├──────────────────────┤              ├──────────────────────┤
│ - Grammar Registry   │              │ - OpenAI API         │
│ - Syntax Highlighter │              │ - Anthropic API      │
│ - Theme Manager      │              │ - Local Models       │
└──────────────────────┘              └──────────────────────┘
\`\`\`

---

## 第二部分：詳細模組規格

### 2.1 文本緩衝區模組(TextBuffer Module)

**模組責任**
- 高效存儲與操作代碼文本
- 支持無限撤銷/重做
- 支持協作編輯的操作轉換
- 發出文本變更事件

**API接口**

\`\`\`typescript
class TextBuffer {
  // 基礎操作
  insertText(offset: number, text: string): void;
  deleteText(offset: number, length: number): void;
  replaceText(offset: number, length: number, text: string): void;
  getText(startOffset?: number, endOffset?: number): string;
  
  // 行操作
  getLineContent(lineNumber: number): string;
  getLineLength(lineNumber: number): number;
  getLineCount(): number;
  
  // 位置轉換
  offsetToPosition(offset: number): Position; // {line, column}
  positionToOffset(line: number, column: number): number;
  
  // 撤銷/重做
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // 版本控制
  createSnapshot(): BufferSnapshot;
  restoreSnapshot(snapshot: BufferSnapshot): void;
  
  // 事件
  onDidChange(handler: (change: TextChange) => void): Disposable;
  onDidChangeSize(handler: (size: Size) => void): Disposable;
}
\`\`\`

**內部數據結構**
- Piece Table：分段存儲原始與編輯內容
- 操作歷史棧：完整的撤銷/重做鏈
- 行索引：快速行查詢(O(1))
- 文本分段：按需加載大文件

**性能目標**
- 插入/刪除：<1ms (1000字符)
- 行查詢：<0.1ms
- 撤銷/重做：<10ms
- 內存：<2倍原文件大小

### 2.2 渲染與視窗化模組(Viewport Rendering)

**模組責任**
- 管理可見的代碼行範圍
- 計算DOM元素位置
- 優化重繪性能
- 處理滾動與虛擬化

**API接口**

\`\`\`typescript
class ViewportRenderer {
  // 配置
  setLineHeight(height: number): void;
  setCharWidth(width: number): void;
  
  // 視口管理
  getVisibleRange(): LineRange;
  setVisibleRange(start: number, end: number): void;
  scrollToLine(line: number): void;
  scrollToPosition(position: Position): void;
  
  // 渲染控制
  invalidateLine(lineNumber: number): void;
  invalidateRange(startLine: number, endLine: number): void;
  render(): void; // 執行實際渲染
  
  // 查詢
  getLineHeight(line: number): number;
  getLineWidth(line: number): number;
  screenToLine(screenY: number): number;
  
  // 事件
  onDidScroll(handler: (position: ScrollPosition) => void): Disposable;
  onDidResize(handler: (size: ViewportSize) => void): Disposable;
}
\`\`\`

**優化策略**
- 僅渲染視口內行(+上下各50行緩衝)
- DOM回收池：複用DOM節點
- 批量更新：多個變更合併為一次渲染
- 增量重排：只重新計算受影響的行
- GPU加速：使用transform優化動畫

**性能指標**
- 滾動幀率：60fps
- 大文件(1M行)打開：<2秒
- 實時編輯延遲：<16ms

### 2.3 標記化與語法高亮模組(Tokenization)

**模組責任**
- 解析代碼為語法符號
- 應用主題著色
- 支持多種語言
- 增量標記化

**API接口**

\`\`\`typescript
class TokenizationEngine {
  // 語言註冊
  registerLanguage(id: string, definition: LanguageDefinition): void;
  getLanguages(): LanguageInfo[];
  
  // 標記化
  tokenizeLine(line: string, languageId: string, startState: TokenizationState): {
    tokens: Token[];
    endState: TokenizationState;
  };
  
  // 主題管理
  setTheme(themeName: string): void;
  getTheme(): Theme;
  registerTheme(name: string, theme: Theme): void;
  
  // 增量更新
  updateLine(lineNumber: number, lineText: string): void;
  getTokensForLine(lineNumber: number): Token[];
  
  // 事件
  onDidChangeTheme(handler: () => void): Disposable;
  onDidChangeLanguage(handler: (language: string) => void): Disposable;
}

interface Token {
  startIndex: number;
  length: number;
  type: string; // e.g., 'keyword.js', 'comment', 'string'
}

interface TokenizationState {
  stateData: any; // 語言特定的狀態
}
\`\`\`

**支持的語言**
- 主流語言：JavaScript、Python、Java、C++、Go、Rust等
- Web技術：HTML、CSS、JSON、YAML、XML
- 配置語言：JSON、YAML、TOML、INI
- 標記語言：Markdown、ReStructuredText
- 總計：100+種語言

**主題引擎**
- TextMate兼容：支持.tmTheme格式
- 預設主題：Dracula、Solarized、Nord、One Dark等
- 自定義主題：支持用戶自定義配色

**性能**
- 標記化速度：<5ms/1000行
- 增量更新：平均修改行+5行重新標記化
- 主題切換：<100ms

### 2.4 LSP集成模組(Language Server Protocol)

**模組責任**
- 與LSP伺服器通訊
- 提供代碼智能功能
- 管理多個語言伺服器
- 緩存LSP結果

**API接口**

\`\`\`typescript
class LSPClient {
  // 伺服器生命週期
  startServer(languageId: string): Promise<void>;
  stopServer(languageId: string): Promise<void>;
  
  // LSP功能(Core)
  completion(position: Position): Promise<CompletionItem[]>;
  hover(position: Position): Promise<HoverInfo | null>;
  definition(position: Position): Promise<Location>;
  references(position: Position): Promise<Location[]>;
  rename(position: Position, newName: string): Promise<WorkspaceEdit>;
  
  // 診斷(Diagnostics)
  getFileDiagnostics(uri: string): Diagnostic[];
  onDidPublishDiagnostics(handler: (diagnostics: Diagnostic[]) => void): Disposable;
  
  // 初始化與配置
  initialize(capabilities: ClientCapabilities): Promise<void>;
  didChange(uri: string, changes: TextDocumentContentChangeEvent[]): void;
  
  // 事件
  onDidOpen(handler: (uri: string) => void): Disposable;
  onDidClose(handler: (uri: string) => void): Disposable;
}
\`\`\`

**支持的LSP功能**
| 功能 | 優先級 | 實現狀態 |
|------|--------|---------|
| textDocument/completion | P0 | ✓ 必需 |
| textDocument/hover | P0 | ✓ 必需 |
| textDocument/definition | P1 | ✓ 重要 |
| textDocument/references | P1 | ✓ 重要 |
| textDocument/rename | P2 | ✓ 增強 |
| textDocument/codeAction | P2 | ✓ 增強 |
| textDocument/formatting | P3 | ○ 可選 |

**伺服器管理**
- 本地伺服器：Node.js進程、Python進程
- 遠程伺服器：SSH、HTTP隧道
- 自動啟動：按文件類型觸發
- 故障恢復：自動重啟、降級模式

**性能優化**
- 結果緩存：補全、hover結果緩存
- 延遲請求：防止過度請求
- 批量診斷：按需更新

### 2.5 AI集成模組(AI Integration)

**模組責任**
- 與LLM提供者集成
- 管理AI會話和上下文
- 實現Agent系統
- 處理Token計數和成本

**API接口**

\`\`\`typescript
class AIIntegration {
  // 補全功能
  getCodeCompletion(context: CompletionContext): Promise<CompletionResult[]>;
  getMultilineCompletion(context: CompletionContext): Promise<string>;
  
  // 對話
  sendChatMessage(message: string): Promise<ChatResponse>;
  streamChatMessage(message: string): AsyncIterable<ChatDelta>;
  
  // Agent
  executeAgent(goal: string, tools: ToolDefinition[]): Promise<AgentResult>;
  
  // 模型管理
  listAvailableModels(): Model[];
  selectModel(modelId: string): void;
  getTokenCount(text: string): number;
  
  // 設置
  setAPIKey(provider: string, key: string): void;
  getConfiguration(): AIConfiguration;
}

interface CompletionContext {
  prefix: string;           // 光標前的代碼
  suffix: string;           // 光標後的代碼
  language: string;
  filePath: string;
  maxTokens?: number;
}

interface CompletionResult {
  text: string;
  score: number;            // 置信度 0-1
}
\`\`\`

**LLM提供者**
- OpenAI：GPT-3.5-turbo, GPT-4
- Anthropic：Claude 2/3系列
- Google：Gemini 1.5/2.0
- 本地模型：Llama、Mistral、CodeLlama

**Agent系統**

\`\`\`typescript
interface Agent {
  name: string;
  role: string;             // Builder, Reviewer, Security, Governor
  tools: Tool[];
  memory: AgentMemory;
  
  async execute(goal: string): Promise<AgentResult>;
  async think(context: Context): Promise<Action>;
}

// 多Agent編排
class AgentOrchestrator {
  createAgentTeam(): AgentTeam;
  executeAgentWorkflow(workflow: AgentWorkflow): Promise<Result>;
  coordinateAgents(agents: Agent[], task: Task): Promise<Outcome>;
}
\`\`\`

**Token管理**
- Token計數：精確計算各模型
- 成本追蹤：按用戶/項目/時間段
- 速率限制：防止超配
- 緩存：重複查詢結果緩存

### 2.6 研究工具模組(Research Toolkit)

**模組責任**
- 收集編輯器生態數據
- 分析市場趨勢
- 生成研究報告
- 可視化數據

**API接口**

\`\`\`typescript
class ResearchToolkit {
  // 數據收集
  collectEditorMetrics(editorName: string): Promise<EditorMetrics>;
  trackMarketTrends(): Promise<MarketAnalysis>;
  
  // 生態分析
  analyzeEcosystem(editorName: string): Promise<EcosystemAnalysis>;
  compareEditors(editors: string[]): Promise<ComparisonMatrix>;
  analyzeCommunity(editorName: string): Promise<CommunityStats>;
  
  // 報告生成
  generateReport(config: ReportConfig): Promise<Report>;
  exportReport(report: Report, format: 'pdf' | 'html' | 'md'): Promise<Buffer>;
  
  // 可視化
  createChart(data: ChartData, type: ChartType): ChartComponent;
  createNetworkGraph(nodes: Node[], edges: Edge[]): GraphComponent;
  
  // 事件
  onDataUpdated(handler: (data: ResearchData) => void): Disposable;
}

interface EcosystemAnalysis {
  platformSize: number;       // 擴展數量
  communitySize: number;      // 社區成員
  activityLevel: 'high' | 'medium' | 'low';
  marketShare: number;        // 百分比
  averageRating: number;      // 1-5
}
\`\`\`

**數據源**
- GitHub API：倉庫、趨勢、貢獻者
- npm Registry：下載統計、包元數據
- Stack Overflow：問題、標籤流行度
- 官方統計：VSCode Marketplace、JetBrains
- 用戶研究：調查、反饋

**分析能力**
- 時間序列分析：趨勢追蹤
- 預測建模：未來預測
- 網絡分析：社區結構
- 文本分析：評論情感

**可視化**
- 折線圖：趨勢變化
- 柱狀圖：對比數據
- 散點圖：相關性
- 網絡圖：關係結構
- 熱力圖：活躍度分佈

### 2.7 插件系統模組(Plugin System)

**模組責任**
- 動態加載/卸載插件
- 提供插件API
- 隔離插件執行環境
- 管理插件生命週期

**API接口**

\`\`\`typescript
class PluginSystem {
  // 生命週期
  async loadPlugin(pluginPath: string): Promise<Plugin>;
  async unloadPlugin(pluginId: string): Promise<void>;
  async enablePlugin(pluginId: string): Promise<void>;
  async disablePlugin(pluginId: string): Promise<void>;
  
  // 管理
  getInstalledPlugins(): Plugin[];
  getPluginById(pluginId: string): Plugin | undefined;
  
  // 事件
  onDidLoad(handler: (plugin: Plugin) => void): Disposable;
  onDidUnload(handler: (pluginId: string) => void): Disposable;
  onDidActivate(handler: (plugin: Plugin) => void): Disposable;
  onDidDeactivate(handler: (pluginId: string) => void): Disposable;
}

// 插件接口
interface Plugin {
  id: string;
  name: string;
  version: string;
  main: string;              // 入口點
  permissions: string[];     // 所需權限
  manifest: PluginManifest;
}

// 插件能訪問的API
interface PluginAPI {
  // 編輯器
  editor: {
    getActiveEditor(): Editor;
    openFile(path: string): Promise<Editor>;
    onDidChange(handler: (change: TextChange) => void): Disposable;
  };
  
  // 命令
  commands: {
    registerCommand(id: string, handler: Function): void;
    executeCommand(id: string, ...args: any[]): Promise<any>;
  };
  
  // UI
  ui: {
    showMessage(message: string, type: 'info' | 'warn' | 'error'): Promise<void>;
    showInputBox(prompt: string): Promise<string | undefined>;
    createPanel(title: string): Panel;
  };
  
  // 存儲
  storage: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
}
\`\`\`

**插件隔離**
- 沙箱執行：VM2/iframe隔離
- 權限系統：聲明所需權限
- 資源限制：CPU、內存、網絡
- 審計日誌：記錄敏感操作

**生命週期**
1. 加載：解析manifest、驗證簽名
2. 初始化：調用activate()函數
3. 運行：響應事件、執行命令
4. 卸載：調用deactivate()函數

---

## 第三部分：數據流與通訊協議

### 3.1 編輯流程數據流

\`\`\`
用戶輸入
  │
  ▼
Input Handler
  │
  ├─→ TextBuffer (插入/刪除文本)
  │     │
  │     └─→ 發出onDidChange事件
  │
  ├─→ Tokenizer (標記化受影響的行)
  │     │
  │     └─→ 發出onDidChangeTokens事件
  │
  ├─→ ViewportRenderer (計算可見行)
  │     │
  │     └─→ 發出onDidRender事件
  │
  └─→ LSPClient (發送didChange通知)
        │
        └─→ 接收Diagnostics
\`\`\`

### 3.2 AI補全流程

\`\`\`
用戶請求補全 (Ctrl+Space)
  │
  ▼
Completion Engine
  │
  ├─→ 構建上下文
  │     ├─ 當前行前後代碼
  │     ├─ 檔案路徑和語言
  │     └─ 之前的編輯上下文
  │
  ├─→ LLM提供者
  │     ├─ 構建prompt
  │     ├─ 計算token數
  │     └─ 調用API
  │
  ├─→ 結果處理
  │     ├─ 解析響應
  │     ├─ 過濾結果
  │     └─ 排序候選
  │
  └─→ 顯示補全建議
        └─→ 用戶選擇
\`\`\`

### 3.3 協作編輯同步

\`\`\`
用戶A編輯
  │
  ▼
本地TextBuffer更新
  │
  ▼
生成Operation
  │
  ▼
Send to Server via WebSocket
  │
  ▼
Server收到
  │
  ├─→ 應用OT轉換
  │
  └─→ Broadcast到其他用戶
        │
        ▼
    用戶B收到
      │
      ▼
    本地應用Operation
      │
      ▼
    更新UI顯示
\`\`\`

---

## 第四部分：擴展與集成點

### 4.1 服務集成點

| 服務 | 集成點 | 功能 | 優先級 |
|------|-------|------|--------|
| GitHub | OAuth認證、倉庫操作 | 登錄、Clone、Push | P0 |
| GitLab | OAuth認證、CI/CD | 登錄、部署 | P1 |
| Jira | API集成 | 任務追蹤 | P2 |
| Slack | Webhook | 通知推送 | P2 |
| npm | 註冊表API | 包搜索、發佈 | P1 |
| PyPI | HTTP API | Python包管理 | P2 |
| Docker | CLI集成 | 容器化構建 | P3 |

### 4.2 語言伺服器集成

\`\`\`typescript
// 自動発現和註冊LSP伺服器
const languageServers = {
  javascript: 'node-lsp',
  python: 'pylsp',
  java: 'eclipse-jdt-ls',
  go: 'gopls',
  rust: 'rust-analyzer',
  cpp: 'clangd',
  // ... 更多語言
};
\`\`\`

### 4.3 AI模型集成

\`\`\`typescript
const aiProviders = {
  openai: {
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    models: ['claude-2', 'claude-3-opus', 'claude-3-sonnet'],
    baseUrl: 'https://api.anthropic.com/v1',
  },
  google: {
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  local: {
    models: ['llama2', 'mistral', 'codellama'],
    baseUrl: 'http://localhost:8000', // Ollama等本地服務
  },
};
\`\`\`

---

## 第五部分：性能優化策略

### 5.1 前端優化

**代碼分割**
- 路由級別分割：各頁面獨立chunk
- 組件懶加載：按需加載重量級組件
- 庫分割：第三方庫單獨chunk

**緩存策略**
- 瀏覽器緩存：靜態資源long-term緩存
- HTTP緩存：ETag + Last-Modified
- IndexedDB：編輯歷史、用戶設置

**虛擬化**
- 無限列表：檔案瀏覽器、擴展列表
- 表格虛擬化：研究數據表格
- 樹型虛擬化：檔案樹

### 5.2 後端優化

**數據庫優化**
- 查詢優化：索引、執行計劃
- 連接池：最大化重用
- 讀寫分離：主從複製
- 分片：大表水平分片

**API優化**
- 速率限制：防止濫用
- 分頁：大結果集分頁
- 字段篩選：客戶端指定返回字段
- GraphQL：精確查詢

**緩存層**
- Redis：會話、API結果緩存
- CDN：靜態資源分發
- 應用級緩存：對象池、結果緩存

### 5.3 AI優化

**推理優化**
- 批次處理：多個請求合併推理
- 量化：模型權重量化
- 蒸馏：使用小模型
- 快取：結果緩存

**成本優化**
- 模型選擇：根據複雜度選擇模型
- 令牌優化：最小化輸入令牌
- 批處理：離線處理非實時任務

---

## 結論

本規格文檔詳細描述了AI程式碼編輯生態研究平台的所有核心元件、數據流、集成點和性能優化策略。通過模組化設計和清晰的接口定義，系統提供了高度的靈活性和可擴展性，能支持快速迭代和功能擴展。

關鍵的架構決策包括：

1. **Piece Table文本存儲**：平衡性能和內存
2. **虛擬視窗化渲染**：支持超大文件
3. **LSP標準化**：通用語言支持
4. **插件沙箱隔離**：安全的生態
5. **多Agent AI系統**：複雜推理能力
6. **微服務架構**：獨立可擴展

這些設計選擇確保了系統的性能、安全性和可維護性，使其能成為專業級的開發工具平台。


# AutoEcoOps 全量倉庫命名規範與架構映射指南

## 1. 核心詞彙表 (Lexicon)

為了確保整個 AutoEcoOps 生態系統的溝通一致性與架構清晰度，我們定義以下核心詞彙及其語義：

### 1.1 命名空間 (Namespace)

| 詞彙 | 定義 | 範例 |
| :--- | :--- | :--- |
| **codevantaos** | 代表平台的核心基礎設施、共享服務與控制平面組件。這些組件通常是底層的、通用的，為上層業務平台提供支撐。 | \`codevantaos-auth\` (身份驗證服務), \`codevantaos-policy\` (策略與審計) |
| **softwareos** | 代表基於 \`codevantaos\` 核心能力構建的業務領域平台與應用。這些組件通常是面向特定業務場景的，如 IaC、觀測、邊緣計算等。 | \`softwareos-iaops\` (IaC 平台), \`softwareos-platform-01\` (觀測平台) |

### 1.2 領域 (Domain)

領域代表了倉庫所屬的業務或技術範疇，應具備清晰的邊界。

| 詞彙 | 定義 | 範例 |
| :--- | :--- | :--- |
| **auth** | 身份驗證與授權管理 | \`codevantaos-auth\` |
| **policy** | 策略管理與審計 | \`codevantaos-policy\` |
| **memory** | 記憶體與上下文管理 (如向量資料庫) | \`codevantaos-memory-hub\` |
| **event** | 事件總線與事件處理 | \`codevantaos-event-bus\` |
| **infra** | 基礎設施管理與 GitOps 控制器 | \`codevantaos-infra-manager\` |
| **platform-01** | 觀測、自癒、修復編排平台 | \`softwareos-platform-01\` |
| **iaops** | 基礎設施即代碼 (IaC) 與 GitOps 平台 | \`softwareos-iaops\` |
| **machinenativeops** | 節點基線、硬體納管、邊緣代理平台 | \`softwareos-machinenativeops\` |
| **toolkit** | 開發工具集與 SDK | \`softwareos-toolkit\` |
| **contracts** | 跨服務 API 契約定義 | \`softwareos-contracts\` |
| **signerd** | 簽名服務 | \`codevantaos-signerd\` |
| **controller** | 控制器 | \`codevantaos-controller\` |
| **rolloutd** | 部署滾動控制器 | \`codevantaos-rolloutd\` |
| **db-schemas** | 資料庫結構定義 | \`codevantaos-db-schemas\` |

### 1.3 功能 (Function)

功能描述了倉庫提供的具體服務或組件類型。

| 詞彙 | 定義 | 範例 |
| :--- | :--- | :--- |
| **service** | 微服務 | \`codevantaos-auth-service\` |
| **agent** | 代理程式 | \`softwareos-edge-agent\` |
| **sdk** | 軟體開發套件 | \`softwareos-toolkit-sdk\` |
| **cli** | 命令列工具 | \`softwareos-toolkit-cli\` |
| **web** | 前端應用 | \`softwareos-platform-01-web\` |
| **api** | API 服務 | \`softwareos-platform-01-api\` |
| **worker** | 後台工作者 | \`codevantaos-event-worker\` |
| **manager** | 管理器 | \`codevantaos-infra-manager\` |
| **hub** | 核心樞紐 | \`codevantaos-memory-hub\` |
| **bus** | 總線 | \`codevantaos-event-bus\` |

## 2. 倉庫命名邏輯 (Naming Convention)

所有倉庫命名應遵循以下模式：

\`[Namespace]-[Domain]-[Function]\`

**範例：**
*   \`codevantaos-auth-service\`：\`codevantaos\` 命名空間下的 \`auth\` 領域的 \`service\` 組件。
*   \`softwareos-iaops-api\`：\`softwareos\` 命名空間下的 \`iaops\` 領域的 \`api\` 組件。
*   \`codevantaos-memory-hub\`：\`codevantaos\` 命名空間下的 \`memory\` 領域的 \`hub\` 組件。

**命名規則：**
*   所有名稱均使用小寫字母。
*   各段位之間使用連字符 \`-\` 分隔。
*   命名應簡潔、清晰，能直接反映倉庫的職責。

## 3. 依賴與引用映射 (Dependency & Reference Mapping)

AutoEcoOps 生態系統的倉庫之間存在清晰的分層與領域依賴關係。本節將透過 C4 模型風格的圖表與詳細說明，闡述各倉庫間的引用與依賴拓撲，區分強依賴（直接 API 調用、程式碼引用）與弱依賴（事件驅動、配置依賴）。

### 3.1 核心服務與平台依賴概覽

\`\`\`mermaid
C4Context
    title AutoEcoOps Repository Dependency Map

    System_Ext(repo, "Git Repo", "部署清單、Helm Charts、策略定義")

    Boundary(boundary_shared, "Shared Kernel (控制平面)") {
        Container(auth, "codevantaos-auth", "身份驗證、RBAC、Token 發放")
        Container(memory, "codevantaos-memory-hub", "文件切片、向量檢索、RAG 上下文")
        Container(event, "codevantaos-event-bus", "事件路由、重放、去重")
        Container(policy, "codevantaos-policy", "策略判決、審計軌跡")
        Container(infra, "codevantaos-infra-manager", "漂移檢測、同步、回滾鉤子")
        Container(db_schemas, "codevantaos-db-schemas", "統一資料庫結構定義")
        Container(signerd, "codevantaos-signerd", "簽名服務")
        Container(controller, "codevantaos-controller", "通用控制器")
        Container(rolloutd, "codevantaos-rolloutd", "部署滾動控制器")
        Container(metricsd, "codevantaos-metricsd", "指標收集服務")
        Container(alertd, "codevantaos-alertd", "告警服務")
        Container(api, "codevantaos-api", "核心服務統一 API Gateway")
        Container(internal_mvs, "codevantaos-internal-mvs", "內部微服務")
        Container(hyperautomation, "codevantaos-hyperautomation", "超自動化引擎")
        Container(org_meta, "codevantaos-org-meta", "組織元數據管理")
    }

    Boundary(boundary_platforms, "Platforms (業務域)") {
        Container(p01, "softwareos-platform-01", "觀測、自癒、修復編排")
        Container(iaops, "softwareos-iaops", "IaC、GitOps、供應鏈合規")
        Container(p03, "softwareos-platform-03", "節點基線、硬體納管、邊緣代理")
        Container(main, "softwareos-main", "主應用入口")
        Container(base, "softwareos-base", "平台基礎組件")
        Container(gitops, "softwareos-gitops", "GitOps 相關工具")
        Container(core, "softwareos-core", "核心業務邏輯")
        Container(legacy_eco, "softwareos-legacy-eco", "遺留生態系統整合")
        Container(observability, "softwareos-observability", "觀測性平台")
        Container(ecosystem, "softwareos-ecosystem", "生態系統管理")
    }

    Boundary(boundary_interfaces, "契約層 & SDK") {
        Container(contracts, "softwareos-contracts", "OpenAPI / AsyncAPI / JSON Schema")
        Container(toolkit, "softwareos-toolkit", "TypeScript / Python SDK")
        Container(adk_samples, "softwareos-adk-samples", "ADK 範例")
    }

    Rel(api, auth, "驗證授權", "HTTPS/gRPC")
    Rel(api, memory, "查詢上下文", "HTTPS/gRPC")
    Rel(api, event, "發布事件", "HTTPS/gRPC")
    Rel(api, policy, "寫入審計", "HTTPS/gRPC")
    Rel(api, infra, "觸發同步", "HTTPS/gRPC")
    Rel(api, db_schemas, "資料庫操作", "HTTPS/gRPC")
    Rel(api, signerd, "簽名請求", "HTTPS/gRPC")
    Rel(api, controller, "控制指令", "HTTPS/gRPC")
    Rel(api, rolloutd, "部署指令", "HTTPS/gRPC")
    Rel(api, metricsd, "指標收集", "HTTPS/gRPC")
    Rel(api, alertd, "告警觸發", "HTTPS/gRPC")
    Rel(api, internal_mvs, "內部調用", "HTTPS/gRPC")
    Rel(api, hyperautomation, "自動化觸發", "HTTPS/gRPC")
    Rel(api, org_meta, "元數據查詢", "HTTPS/gRPC")

    Rel(p01, api, "使用", "HTTPS/gRPC")
    Rel(iaops, api, "使用", "HTTPS/gRPC")
    Rel(p03, api, "使用", "HTTPS/gRPC")
    Rel(main, api, "使用", "HTTPS/gRPC")
    Rel(base, api, "使用", "HTTPS/gRPC")
    Rel(gitops, api, "使用", "HTTPS/gRPC")
    Rel(core, api, "使用", "HTTPS/gRPC")
    Rel(legacy_eco, api, "使用", "HTTPS/gRPC")
    Rel(observability, api, "使用", "HTTPS/gRPC")
    Rel(ecosystem, api, "使用", "HTTPS/gRPC")

    Rel(contracts, p01, "定義接口", "IDL")
    Rel(contracts, iaops, "定義接口", "IDL")
    Rel(contracts, p03, "定義接口", "IDL")
    Rel(contracts, api, "定義接口", "IDL")
    Rel(toolkit, contracts, "實現", "程式碼引用")
    Rel(adk_samples, toolkit, "使用", "程式碼引用")

    Rel(infra, repo, "監控變更", "GitOps")
    Rel(iaops, repo, "管理", "GitOps")

    Rel(db_schemas, auth, "依賴", "資料庫")
    Rel(db_schemas, memory, "依賴", "資料庫")
    Rel(db_schemas, policy, "依賴", "資料庫")

    Rel(event, p01, "發布/訂閱", "Kafka/Redis Streams")
    Rel(event, iaops, "發布/訂閱", "Kafka/Redis Streams")
    Rel(event, p03, "發布/訂閱", "Kafka/Redis Streams")

    Rel(policy, p01, "策略判決", "OPA")
    Rel(policy, iaops, "策略判決", "OPA")
    Rel(policy, p03, "策略判決", "OPA")

    Rel(auth, p01, "驗證授權", "OIDC")
    Rel(auth, iaops, "驗證授權", "OIDC")
    Rel(auth, p03, "驗證授權", "OIDC")

    Rel(memory, p01, "查詢上下文", "RAG")
    Rel(memory, iaops, "查詢上下文", "RAG")
    Rel(memory, p03, "查詢上下文", "RAG")

    Rel(hyperautomation, p01, "驅動", "自動化")
    Rel(hyperautomation, iaops, "驅動", "自動化")
    Rel(hyperautomation, p03, "驅動", "自動化")

    Rel(controller, p01, "控制", "指令")
    Rel(controller, iaops, "控制", "指令")
    Rel(controller, p03, "控制", "指令")

    Rel(rolloutd, p01, "部署", "指令")
    Rel(rolloutd, iaops, "部署", "指令")
    Rel(rolloutd, p03, "部署", "指令")

    Rel(metricsd, observability, "提供", "指標")
    Rel(alertd, observability, "提供", "告警")

    Rel(main, base, "依賴", "組件")
    Rel(main, core, "依賴", "組件")
    Rel(main, gitops, "依賴", "組件")

    Rel(softwareos-platform-01, softwareos-observability, "使用", "觀測能力")
    Rel(softwareos-platform-03, softwareos-observability, "使用", "觀測能力")

    Rel(softwareos-platform-01, softwareos-base, "依賴", "基礎組件")
    Rel(softwareos-platform-03, softwareos-base, "依賴", "基礎組件")
    Rel(softwareos-iaops, softwareos-base, "依賴", "基礎組件")

    Rel(softwareos-platform-01, softwareos-gitops, "使用", "GitOps")
    Rel(softwareos-iaops, softwareos-gitops, "使用", "GitOps")
    Rel(softwareos-platform-03, softwareos-gitops, "使用", "GitOps")

    Rel(softwareos-platform-01, softwareos-core, "依賴", "核心邏輯")
    Rel(softwareos-iaops, softwareos-core, "依賴", "核心邏輯")
    Rel(softwareos-platform-03, softwareos-core, "依賴", "核心邏輯")

    Rel(softwareos-ecosystem, softwareos-platform-01, "管理", "平台")
    Rel(softwareos-ecosystem, softwareos-iaops, "管理", "平台")
    Rel(softwareos-ecosystem, softwareos-platform-03, "管理", "平台")

    Rel(softwareos-legacy-eco, softwareos-ecosystem, "整合", "舊系統")

\`\`\`

### 3.2 依賴類型說明

*   **強依賴 (Strong Dependency)**：指一個倉庫在編譯時或運行時必須依賴另一個倉庫提供的程式碼、API 或服務才能正常工作。例如，業務平台對核心服務 API 的直接調用。
*   **弱依賴 (Weak Dependency)**：指倉庫之間透過非同步事件、配置或鬆散耦合的機制進行互動。例如，透過事件總線發布和訂閱事件，或透過 OPA 策略引擎進行決策判斷。

### 3.3 關鍵依賴關係

1.  **核心服務統一 API Gateway (\`codevantaos-api\`)**：所有業務平台 (\`softwareos-*\`) 應透過 \`codevantaos-api\` 統一訪問底層核心服務 (\`codevantaos-*\`)，實現單一入口與解耦。
2.  **契約驅動開發 (\`softwareos-contracts\`)**：\`softwareos-contracts\` 定義了跨服務的 API 接口（如 gRPC/Protobuf），所有依賴這些接口的服務都應引用此倉庫，確保接口一致性。
3.  **SDK 與工具 (\`softwareos-toolkit\`)**：\`softwareos-toolkit\` 提供了統一的 SDK，供業務平台或外部應用程式集成，其內部會依賴 \`softwareos-contracts\` 的定義。
4.  **GitOps 流程**：\`codevantaos-infra-manager\` 與 \`softwareos-gitops\` 共同負責監控 Git 倉庫 (\`Git Repo\`) 的變更，驅動基礎設施與應用部署的自動化。
5.  **事件驅動架構**：\`codevantaos-event-bus\` 作為核心事件中心，實現各服務間的非同步通信與解耦。

## 4. 功能模組與邏輯架構劃分 (Functional & Logic Architecture)

AutoEcoOps 生態系統的邏輯架構劃分為三個主要層次，以實現職責分離、高內聚低耦合的設計原則：

### 4.1 控制平面 (Control Plane)

控制平面負責整個系統的協調、管理與策略執行，提供核心的基礎設施服務。這些服務通常是無狀態或狀態外部化的，具備高可用性與可擴展性。

| 模組 | 核心職責 | 相關倉庫 |
| :--- | :--- | :--- |
| **身份驗證與授權** | 用戶身份管理、RBAC、Token 發放與驗證 | \`codevantaos-auth\` |
| **策略與審計** | 策略定義、決策判斷、不可變審計日誌 | \`codevantaos-policy\` |
| **記憶體與上下文** | 文件切片、向量嵌入、RAG 上下文管理 | \`codevantaos-memory-hub\` |
| **事件總線** | 事件路由、重放、去重、異步通信 | \`codevantaos-event-bus\` |
| **基礎設施管理** | GitOps、漂移檢測、同步、回滾鉤子 | \`codevantaos-infra-manager\` |
| **核心 API Gateway** | 統一入口、流量管理、服務發現 | \`codevantaos-api\` |
| **通用控制器** | 協調與管理其他服務 | \`codevantaos-controller\` |
| **部署滾動控制器** | 應用部署與版本滾動 | \`codevantaos-rolloutd\` |
| **簽名服務** | 代碼簽名、證明生成 | \`codevantaos-signerd\` |
| **數據庫結構** | 統一資料庫模式管理 | \`codevantaos-db-schemas\` |
| **超自動化引擎** | 跨領域自動化編排 | \`codevantaos-hyperautomation\` |
| **組織元數據** | 組織級配置與元數據管理 | \`codevantaos-org-meta\` |

### 4.2 業務平台 (Business Platforms)

業務平台基於控制平面提供的能力，實現特定的業務邏輯與應用場景。它們通常是面向終端用戶或特定開發者角色的。

| 模組 | 核心職責 | 相關倉庫 |
| :--- | :--- | :--- |
| **觀測平台 (Platform-01)** | 觀測、自癒、修復編排 | \`softwareos-platform-01\`, \`softwareos-observability\` |
| **IaC/GitOps 平台 (Platform-02)** | 基礎設施即代碼、供應鏈合規 | \`softwareos-iaops\`, \`softwareos-gitops\` |
| **邊緣計算平台 (Platform-03)** | 節點基線、硬體納管、邊緣代理 | \`softwareos-platform-03\` |
| **主應用入口** | 聚合各業務平台功能 | \`softwareos-main\` |
| **平台基礎組件** | 業務平台通用組件 | \`softwareos-base\` |
| **核心業務邏輯** | 業務平台核心邏輯 | \`softwareos-core\` |
| **生態系統管理** | 平台間整合與管理 | \`softwareos-ecosystem\` |
| **遺留系統整合** | 橋接舊有系統 | \`softwareos-legacy-eco\` |

### 4.3 契約與 SDK 層 (Contract & SDK Layer)

契約與 SDK 層負責定義服務間的通信接口與提供便捷的開發工具，確保跨服務通信的一致性與開發效率。

| 模組 | 核心職責 | 相關倉庫 |
| :--- | :--- | :--- |
| **API 契約定義** | 服務間通信接口 (Protobuf/OpenAPI) | \`softwareos-contracts\` |
| **開發工具包** | 統一的 TypeScript/Python SDK | \`softwareos-toolkit\` |
| **ADK 範例** | 開發套件使用範例 | \`softwareos-adk-samples\` |

## 5. 契約與版本化 (Contract & Versioning)

契約驅動開發 (Contract-Driven Development, CDD) 是 AutoEcoOps 生態系統的基石，確保服務間通信的穩定性與可預測性。所有服務間的互動都必須基於明確定義的契約。

### 5.1 契約定義

*   **Protobuf (Protocol Buffers)**：用於定義高性能、跨語言的 gRPC 服務接口。主要應用於 \`codevantaos\` 核心服務之間以及核心服務與業務平台之間的同步通信。
*   **OpenAPI (Swagger)**：用於定義 RESTful API 接口，主要應用於對外暴露的 API Gateway (\`codevantaos-api\`) 以及部分業務平台對外的接口。
*   **JSON Schema / AsyncAPI**：用於定義事件總線 (\`codevantaos-event-bus\`) 上的事件 Payload 結構，確保事件的一致性與可消費性。

所有契約定義文件統一存儲於 \`softwareos-contracts\` 倉庫，並作為單一事實來源 (Single Source of Truth)。

### 5.2 版本化策略

AutoEcoOps 採用 **語義化版本控制 (Semantic Versioning)** (\`MAJOR.MINOR.PATCH\`) 策略，並應用於以下層面：

1.  **服務 API 版本**：
    *   \`MAJOR\` 版本變更：表示 API 存在不兼容的變更，需要消費者進行修改。
    *   \`MINOR\` 版本變更：表示新增了向後兼容的功能。
    *   \`PATCH\` 版本變更：表示向後兼容的錯誤修復。
    *   API 版本應體現在 URL 路徑 (\`/v1/\`) 或 HTTP Header 中。

2.  **SDK 版本**：\`softwareos-toolkit\` 的版本應與其所依賴的核心服務 API 版本保持同步，並在引入不兼容的 API 變更時提升 \`MAJOR\` 版本。

3.  **事件契約版本**：事件 Payload 的 \`JSON Schema\` 或 \`Protobuf\` 定義應進行版本控制。不兼容的事件結構變更應視為 \`MAJOR\` 版本變更，並透過事件總線的 Schema Registry 進行管理。

4.  **倉庫版本**：每個倉庫的 \`main\` 分支應始終保持可部署狀態。發布新版本時，應在 Git 中打上語義化版本標籤 (\`git tag vX.Y.Z\`)。

### 5.3 契約驅動工作流

1.  **契約優先**：任何新的服務功能或 API 變更，必須首先在 \`softwareos-contracts\` 中定義或更新契約。
2.  **自動化生成**：基於契約定義，自動生成客戶端 SDK、服務端 Stub 以及 API 文件。
3.  **兼容性測試**：在 CI/CD 流程中，強制執行契約兼容性測試，確保新版本不會破壞現有消費者。

這份指南將作為 AutoEcoOps 生態系統所有開發者、架構師和運維人員的參考標準，確保整個平台的健康、高效與可持續發展。
`;

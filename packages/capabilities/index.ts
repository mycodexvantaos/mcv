/**
 * 🏢 MyCodeXvantaOS - Capabilities Layer
 *
 * 🎯 目的：
 * 提供統一的 Provider 抽象和管理系統，實現 Platform Independence
 * 確保平台在各種運行時環境下都能正常運作（online/offline/hybrid）
 *
 * 📌 核心組件：
 * - **CapabilityBase**: Provider 抽象基類
 * - **ProviderFactory**: Provider 工廠（Runtime Mode 自動選擇）
 * - **ProviderRegistry**: Provider 註冊中心
 * - **Types**: 統一的類型定義
 *
 * 🚀 快速開始：
 * ```typescript
 * import { CapabilityBase, ProviderFactory, RuntimeMode } from '@mycodexvantaos/capabilities';
 *
 * // 1. 定義你的 Provider
 * class MyVectorStore extends CapabilityBase<VectorStoreConfig> {
 *   protected async doInitialize(): Promise<void> { ... }
 *   protected async doHealthCheck(): Promise<ProviderHealthCheckResult> { ... }
 *   protected async doShutdown(): Promise<void> { ... }
 * }
 *
 * // 2. 創建 Factory
 * const factory = new ProviderFactory('vector-store', RuntimeMode.AUTO);
 *
 * // 3. 註冊 Providers
 * factory.registerProvider({ id: 'native', mode: RuntimeMode.NATIVE, config: {...} });
 * factory.registerProvider({ id: 'external', mode: RuntimeMode.CONNECTED, config: {...} });
 *
 * // 4. 創建 Provider 實例
 * const vectorStore = await factory.createProvider(
 *   'vector-store',
 *   MyVectorStore,
 *   NativeVectorStore // fallback
 * );
 * ```
 *
 * @module packages/capabilities
 * @version 1.0.0
 */

// 🎨 導出類型
export type {
  // 核心類型
  ProviderConfig,
  FallbackConfig,
  RuntimeConfig,
  NetworkStatus,
  ProviderMetrics,
  CapabilityQuery,

  // 健康檢查相關
  ProviderHealthCheckResult,
  ProviderCapability,
} from './types';

// 🔮 導出枚舉
export {
  RuntimeMode,
  ProviderMode,
  ProviderHealthStatus,
  ProviderMode as CapabilityMode, // 別名，保持向後兼容
} from './types';

// 🏛️ 導出基類
export { CapabilityBase } from './base';

// 🏭 導出工廠類
export { ProviderFactory } from './factory';

// 📦 導出所有默認導出
export { CapabilityBase as default } from './base';
export { ProviderFactory as defaultFactory } from './factory';

/**
 * 📚 使用指南
 */

/**
 * 🎯 一、創建 Native Provider（零依賴）
 *
 * Native Provider 必須滿足：
 * - 沒有外部 API 調用
 * - 沒有外部依賴（如 OpenAI SDK）
 * - 可以完全離線運作
 *
 * @example
 * ```typescript
 * // ✅ 正確：Native Vector Store（使用內存或本地文件）
 * class NativeVectorStore extends CapabilityBase<NativeVectorStoreConfig> {
 *   private vector: Map<string, number[]> = new Map();
 *
 *   protected async doInitialize(): Promise<void> {
 *     // 零依賴初始化
 *     this.log('info', 'Native vector store initialized');
 *   }
 *
 *   protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
 *     // 零依賴健康檢查
 *     return {
 *       isHealthy: true,
 *       status: ProviderHealthStatus.HEALTHY,
 *       checkTime: new Date().toISOString(),
 *     };
 *   }
 *
 *   protected async doShutdown(): Promise<void> {
 *     // 清理資源
 *     this.vector.clear();
 *   }
 * }
 * ```
 */

/**
 * 🌐 二、創建 External Provider（需要 API）
 *
 * External Provider 需要：
 * - API 配置（如 API keys）
 * - 網絡連接
 * - 必須有 Native fallback（在 Hybrid 模式）
 *
 * @example
 * ```typescript
 * // ✅ 正確：External Vector Store（使用 OpenAI）
 * class OpenAIVectorStore extends CapabilityBase<OpenAIVectorStoreConfig> {
 *   private client: OpenAIClient;
 *
 *   protected async doInitialize(): Promise<void> {
 *     // 初始化 OpenAI 客戶端
 *     this.client = new OpenAIClient({ apiKey: this.config.config.apiKey });
 *     this.log('info', 'OpenAI vector store initialized');
 *   }
 *
 *   protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
 *     try {
 *       // 調用 OpenAI API 檢查健康狀態
 *       await this.client.ping();
 *       return {
 *         isHealthy: true,
 *         status: ProviderHealthStatus.HEALTHY,
 *         checkTime: new Date().toISOString(),
 *         metrics: { latency: 50 },
 *       };
 *     } catch (error) {
 *       return {
 *         isHealthy: false,
 *         status: ProviderHealthStatus.UNHEALTHY,
 *         checkTime: new Date().toISOString(),
 *         metrics: {
 *           lastError: error instanceof Error ? error.message : 'Unknown error',
 *         },
 *       };
 *     }
 *   }
 *
 *   protected async doShutdown(): Promise<void> {
 *     // 清理連接
 *     this.client.close();
 *   }
 * }
 * ```
 */

/**
 * 🔄 三、創建 Hybrid Provider（External + Native Fallback）
 *
 * Hybrid Provider 需要：
 * - External Provider 主實現
 * - Native Provider fallback 實現
 * - 自動 fallback 切換邏輯
 * - 結構化日誌記錄
 *
 * @example
 * ```typescript
 * // ✅ 正確：Hybrid Vector Store
 * factory.registerProvider({
 *   id: 'openai-vector',
 *   mode: RuntimeMode.HYBRID,
 *   providerMode: ProviderMode.EXTERNAL,
 *   config: {
 *     apiKey: process.env.OPENAI_API_KEY,
 *     fallbackThreshold: 3,
 *   },
 * });
 *
 * factory.registerProvider({
 *   id: 'native-vector',
 *   mode: RuntimeMode.NATIVE,
 *   providerMode: ProviderMode.NATIVE,
 *   config: {},
 * });
 *
 * // 創建 Hybrid Provider
 * const hybridVectorStore = await factory.createProvider(
 *   'vector-store',
 *   OpenAIVectorStore,
 *   NativeVectorStore // fallback
 * );
 * ```
 */

/**
 * 🎛️ 四、使用 Runtime Mode
 *
 * Runtime Mode 決定 Provider 的選擇邏輯：
 *
 * - **NATIVE**: 僅使用 Native Provider（完全離線）
 *   ```typescript
 *   const factory = new ProviderFactory('my-factory', RuntimeMode.NATIVE);
 *   ```
 *
 * - **CONNECTED**: 優先使用 External Provider（需要 API）
 *   ```typescript
 *   const factory = new ProviderFactory('my-factory', RuntimeMode.CONNECTED);
 *   ```
 *
 * - **HYBRID**: External first，失敗時自動回退到 Native
 *   ```typescript
 *   const factory = new ProviderFactory('my-factory', RuntimeMode.HYBRID);
 *   ```
 *
 * - **AUTO**: 根據網絡狀態自動切換
 *   ```typescript
 *   const factory = new ProviderFactory('my-factory', RuntimeMode.AUTO);
 *   // Factory 會自動檢測網絡狀態並切換 Provider
 *   ```
 */

/**
 * 🧪 五、測試 Provider
 *
 * 測試 Provider 需要：
 * - 模擬網絡故障（測試 fallback）
 * - 測試離線模式（Native Provider）
 * - 測試健康檢查邏輯
 * - 測試指標收集
 *
 * @example
 * ```typescript
 * // TODO: 添加測試示例
 * ```
 */

/**
 * 📖 六、文檔
 *
 * 詳細文檔請參考：
 *
 * - 架構文檔: `docs/architecture/capabilities-layer.md`
 * - Provider 指南: `docs/guides/provider-development.md`
 * - Runtime Mode 指南: `docs/guides/runtime-mode.md`
 * - API 參考: `docs/api/capabilities-layer.md`
 */

/**
 * 🚨 注意事項
 *
 * 1. **必須實現 CapabilityBase**: 所有 Provider 必須繼承 CapabilityBase
 * 2. **Native Provider 零依賴**: Native Provider 不能有任何外部依賴
 * 3. **External Provider 有 fallback**: External Provider 必須有 Native fallback
 * 4. **健康檢查必須實現**: doHealthCheck() 不能返回默認值
 * 5. **日誌必須結構化**: 使用 this.log() 方法記錄所有關鍵事件
 */

/**
 * 🔗 相關模塊
 *
 * -/packages/ports: Platform-neutral interfaces
 * -packages/adapters: Vendor-specific implementations
 * -providers: Provider 實現目錄
 * -runtimes: Runtime configuration (native/connected/hybrid/auto)
 */

/**
 * 📞 支持
 *
 * 如有問題，請查看：
 * - GitHub Issues: https://github.com/mycodexvantaos/mycodexvantaos/issues
 * - Documentation: `docs/`
 * - Architecture: `docs/architecture/`
 */

/**
 * 📝 版本歷史
 *
 * - 1.0.0 (2024-05-15): 初始版本，包含 CapabilityBase、ProviderFactory、類型系統
 */

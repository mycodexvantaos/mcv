/**
 * 🏢 MyCodexVantaOS - Runtime Layer
 *
 * Layer 1: Runtime Mode Management（Phase 0.5 新增）
 *   Runtime Mode 配置、檢測與動態切換能力
 *   支持 native/connected/hybrid/auto 四種模式
 *
 * Layer 2: Runtime Adapter Support（原有功能，向後兼容）
 *   Cloudflare Workers / Docker / Kubernetes 適配器
 *   三階段啟動策略：Cloudflare-first → Portable Core → Self-hostable
 *
 * === Runtime Mode Management ===
 * 快速開始：
 * ```typescript
 * import { getRuntimeManager, RuntimeMode } from './runtimes';
 *
 * const manager = getRuntimeManager({ mode: RuntimeMode.AUTO, enableAutoFallback: true, logLevel: 'info' });
 * console.log('Current mode:', manager.getCurrentMode());
 *
 * // AUTO 模式下執行檢測並自動切換
 * const result = await manager.performDetectionAndSwitch(true);
 * console.log('Recommended:', result.recommendedMode);
 *
 * // 手動切換
 * manager.setMode(RuntimeMode.NATIVE, 'user request');
 * ```
 *
 * === Runtime Adapter Support ===
 * 支持多運行時適配（與 Phase 0.5 互補）：
 * - Cloudflare Workers（MVP 階段）
 * - Docker / Node.js（Portable Core）
 * - Kubernetes（Self-hostable）
 */

// 🔧 Runtime Mode Management（新增）
export { RuntimeManager, getRuntimeManager, loadRuntimeConfig } from './manager';
export { detectMode } from './detector';
export type {
  RuntimeConfiguration,
  RuntimeEnvironment,
  NetworkProbeStrategy,
  NetworkProbeConfig,
  ModeDetectionResult,
} from './types';
export { RuntimeMode } from '../packages/capabilities/types';

// 🌐 Runtime Adapter Support（原有功能，向後兼容）

// ── Cloudflare Runtime ─────────────────────
export {
  bootstrapCloudflare,
  healthCheck as cloudflareHealthCheck,
  type CloudflareBindings,
  type CloudflareServiceContainer,
} from './cloudflare/src/index.js';

// Re-export the legacy CloudflareRuntimeAdapter for backward compat
export { CloudflareRuntimeAdapter } from './cloudflare/adapter.js';

// ── Node.js Runtime ─────────────────────
export {
  bootstrapNode,
  createNodeServer,
  type NodeBindings,
  type NodeServiceContainer,
} from './node/src/index.js';

// ── Docker Runtime ─────────────────────
export {
  bootstrapNode as bootstrapDocker,
  createNodeServer as createDockerServer,
  mapDockerEnv,
  registerDockerShutdownHandlers,
  type DockerBindings,
  type DockerServiceContainer,
} from './docker/index.js';

// Re-export the legacy DockerRuntimeAdapter for backward compat
export { DockerRuntimeAdapter } from './docker/adapter.js';

// ── Kubernetes Runtime ──────────────────
export {
  bootstrapNode as bootstrapKubernetes,
  mapKubernetesEnv,
  livenessCheck,
  readinessCheck,
  startupCheck,
  type KubernetesBindings,
  type KubernetesServiceContainer,
} from './kubernetes/index.js';

// ── Runtime Detection (Legacy) ──────────
/**
 * Detect the current runtime environment and return the appropriate adapter.
 * 保留原有的 runtime adapter 檢測邏輯以向後兼容。
 * 與 RuntimeMode 檢測分層：RuntimeMode 專注於能力層（Native/External/Hybrid），
 * Runtime Adapter 專注於部署環境（Cloudflare/Docker/K8s）。
 */
export async function createRuntimeAdapter(env: Record<string, unknown>) {
  // Cloudflare Workers have specific bindings
  if (env.DB && typeof (env.DB as any).prepare === 'function') {
    const { CloudflareRuntimeAdapter } = await import('./cloudflare/adapter.js');
    return new CloudflareRuntimeAdapter(env as any);
  }

  // Docker/K8s environment uses standard URLs
  if (env.DATABASE_URL || env.POSTGRES_URL) {
    const { DockerRuntimeAdapter } = await import('./docker/adapter.js');
    return new DockerRuntimeAdapter({
      DATABASE_URL: (env.DATABASE_URL || env.POSTGRES_URL) as string,
      REDIS_URL: (env.REDIS_URL || 'redis://localhost:6379') as string,
      MINIO_ENDPOINT: (env.MINIO_ENDPOINT || 'localhost:9000') as string,
      MINIO_ACCESS_KEY: (env.MINIO_ACCESS_KEY || '') as string,
      MINIO_SECRET_KEY: (env.MINIO_SECRET_KEY || '') as string,
      QDRANT_URL: (env.QDRANT_URL || 'http://localhost:6333') as string,
      RABBITMQ_URL: (env.RABBITMQ_URL || 'amqp://localhost:5672') as string,
      ENCRYPTION_KEY: (env.ENCRYPTION_KEY || '') as string,
    });
  }

  throw new Error(
    'Unable to detect runtime environment. ' +
      'Ensure either Cloudflare bindings (DB, KV, R2) or Docker URLs (DATABASE_URL, REDIS_URL) are present.'
  );
}

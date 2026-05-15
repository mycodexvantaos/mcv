/**
 * Runtime Adapter Index — Multi-runtime support
 *
 * This module provides a unified factory for creating runtime-specific
 * service collections. The runtime is determined by the execution
 * environment (Cloudflare Workers vs. Docker/K8s).
 *
 * Three-phase startup strategy:
 *   Phase 1: Cloudflare-first (MVP) — CloudflareRuntimeAdapter
 *   Phase 2: Portable Core — DockerRuntimeAdapter with portable adapters
 *   Phase 3: Self-hostable — Kubernetes with Helm charts
 *
 * Runtime packages:
 *   runtimes/cloudflare/src/  — Cloudflare Workers bootstrap + health check
 *   runtimes/node/src/        — Node.js generic bootstrap
 *   runtimes/docker/           — Docker Compose env mapping + shutdown handlers
 *   runtimes/kubernetes/       — K8s probes + ConfigMap/Secret mapping
 */

// ── Cloudflare Runtime ──────────────────────────────────────────────────
export {
  bootstrapCloudflare,
  healthCheck as cloudflareHealthCheck,
  type CloudflareBindings,
  type CloudflareServiceContainer,
} from './cloudflare/src/index.js';

// Re-export the legacy CloudflareRuntimeAdapter for backward compat
export { CloudflareRuntimeAdapter } from './cloudflare/adapter.js';

// ── Node.js Runtime ─────────────────────────────────────────────────────
export {
  bootstrapNode,
  createNodeServer,
  type NodeBindings,
  type NodeServiceContainer,
} from './node/src/index.js';

// ── Docker Runtime ──────────────────────────────────────────────────────
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

// ── Kubernetes Runtime ──────────────────────────────────────────────────
export {
  bootstrapNode as bootstrapKubernetes,
  mapKubernetesEnv,
  livenessCheck,
  readinessCheck,
  startupCheck,
  type KubernetesBindings,
  type KubernetesServiceContainer,
} from './kubernetes/index.js';

// ── Runtime Detection ───────────────────────────────────────────────────

/**
 * Detect the current runtime environment and return the appropriate adapter.
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

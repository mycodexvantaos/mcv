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
 */

export { CloudflareRuntimeAdapter } from './cloudflare/adapter.js';
export type { CloudflareEnv } from '../adapters/cloudflare/index.js';

export { DockerRuntimeAdapter } from './docker/adapter.js';
export type { DockerEnv } from './docker/adapter.js';

/**
 * Detect the current runtime environment and return the appropriate adapter.
 */
export async function createRuntimeAdapter(env: Record<string, any>) {
  // Cloudflare Workers have specific bindings
  if (env.DB && typeof env.DB.prepare === 'function') {
    const { CloudflareRuntimeAdapter } = await import('./cloudflare/adapter.js');
    return new CloudflareRuntimeAdapter(env as any);
  }

  // Docker/K8s environment uses standard URLs
  if (env.DATABASE_URL || env.POSTGRES_URL) {
    const { DockerRuntimeAdapter } = await import('./docker/adapter.js');
    return new DockerRuntimeAdapter({
      DATABASE_URL: env.DATABASE_URL || env.POSTGRES_URL,
      REDIS_URL: env.REDIS_URL || 'redis://localhost:6379',
      MINIO_ENDPOINT: env.MINIO_ENDPOINT || 'localhost:9000',
      MINIO_ACCESS_KEY: env.MINIO_ACCESS_KEY || '',
      MINIO_SECRET_KEY: env.MINIO_SECRET_KEY || '',
      QDRANT_URL: env.QDRANT_URL || 'http://localhost:6333',
      RABBITMQ_URL: env.RABBITMQ_URL || 'amqp://localhost:5672',
      ENCRYPTION_KEY: env.ENCRYPTION_KEY || '',
    });
  }

  throw new Error(
    'Unable to detect runtime environment. ' +
    'Ensure either Cloudflare bindings (DB, KV, R2) or Docker URLs (DATABASE_URL, REDIS_URL) are present.'
  );
}

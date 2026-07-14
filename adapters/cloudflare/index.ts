/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MyCodexVantaOS — Cloudflare Adapter Index                          ║
 * ║  Concrete implementations of port interfaces using Cloudflare       ║
 * ║  Workers runtime primitives (D1, KV, R2, Queues, Vectorize).       ║
 * ║  Version: 1.0.0-constitution                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Each adapter bridges a port interface to a Cloudflare-specific API.
 * When the platform moves to Phase 2 (Portable Core), additional adapters
 * will be created for Docker/Postgres/Redis/etc. — the ports stay the same.
 */

export { CloudflareStorageAdapter } from './storage-adapter';
export { CloudflareDatabaseAdapter } from './database-adapter';
export { CloudflareCacheAdapter } from './cache-adapter';
export { CloudflareSearchAdapter } from './search-adapter';
export { CloudflareModelAdapter } from './model-adapter';
export { CloudflareQueueAdapter } from './queue-adapter';

/**
 * Cloudflare Worker Environment bindings.
 * All adapters receive this typed environment in their constructor.
 *
 * Usage:
 *   const env: CloudflareEnv = { DB: ..., KV: ..., BUCKET: ..., ... };
 *   const storage = new CloudflareStorageAdapter(env);
 *   const db = new CloudflareDatabaseAdapter(env);
 */
export interface CloudflareEnv {
  // D1 Database
  DB: D1Database;

  // KV Namespace (cache)
  KV: KVNamespace;

  // R2 Bucket (storage)
  BUCKET: R2Bucket;

  // Vectorize Index (search)
  VECTORIZE: VectorizeIndex;

  // Queue (async processing)
  AUDIT_QUEUE: Queue;
  INGESTION_QUEUE: Queue;

  // Environment variables
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;

  // Service bindings (internal RPC)
  IDENTITY_SERVICE: Fetcher;
  WORKSPACE_SERVICE: Fetcher;
  KNOWLEDGE_STORE_SERVICE: Fetcher;
  KNOWLEDGE_SEARCH_SERVICE: Fetcher;
  AGENT_CHAT_SERVICE: Fetcher;
  MODEL_BYOK_SERVICE: Fetcher;
  AUDIT_LOG_SERVICE: Fetcher;
  USAGE_METER_SERVICE: Fetcher;
}

/**
 * Adapter factory — creates all Cloudflare adapters from a single env.
 * This is the entry point for the Cloudflare Workers runtime.
 */
export function createCloudflareAdapters(env: CloudflareEnv) {
  return {
    storage: new CloudflareStorageAdapter(env),
    database: new CloudflareDatabaseAdapter(env),
    cache: new CloudflareCacheAdapter(env),
    search: new CloudflareSearchAdapter(env),
    model: new CloudflareModelAdapter(env),
    queue: new CloudflareQueueAdapter(env),
  };
}

/**
 * DockerRuntimeAdapter — Self-hosted runtime adapter
 *
 * Implements the port/adapter pattern using portable infrastructure:
 *   - PostgreSQL (D1 portable alternative)
 *   - Redis (KV portable alternative)
 *   - MinIO (R2 portable alternative)
 *   - Qdrant (Vectorize portable alternative)
 *   - RabbitMQ (Cloudflare Queues portable alternative)
 *
 * This is the "Self-hostable" Phase 2+ runtime. The same application
 * services that run on Cloudflare Workers run here without modification,
 * only the adapters change.
 */

import type {
  IStoragePort,
  IDatabasePort,
  ICachePort,
  ISearchPort,
  IModelPort,
  IQueuePort,
  IAuditPort,
  IUsagePort,
} from "../../ports/index.js";

import {
  IdentityService,
  WorkspaceService,
  KnowledgeStoreService,
  KnowledgeSearchService,
  AgentChatService,
  ModelByokService,
  AuditLogService,
  UsageMeterService,
} from "../../application/index.js";

export interface DockerEnv {
  DATABASE_URL: string; // postgresql://...
  REDIS_URL: string; // redis://...
  MINIO_ENDPOINT: string; // minio:9000
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  QDRANT_URL: string; // http://qdrant:6333
  RABBITMQ_URL: string; // amqp://...
  ENCRYPTION_KEY: string;
}

export class DockerRuntimeAdapter {
  readonly name = "docker";
  readonly version = "1.0.0-constitution";

  private env: DockerEnv;
  private _adapters?: {
    storage: IStoragePort;
    database: IDatabasePort;
    cache: ICachePort;
    search: ISearchPort;
    model: IModelPort;
    queue: IQueuePort;
    audit: IAuditPort;
    usage: IUsagePort;
  };

  constructor(env: DockerEnv) {
    this.env = env;
  }

  /**
   * Create adapter instances using portable infrastructure.
   * These would import from adapters/postgresql/, adapters/redis/, etc.
   * For now, this serves as the interface contract.
   */
  async createAdapters() {
    if (this._adapters) return this._adapters;

    // TODO: Import and instantiate portable adapters when implemented
    // const { PostgreSQLAdapter } = await import('../../adapters/postgresql/database-adapter.js');
    // const { RedisCacheAdapter } = await import('../../adapters/redis/cache-adapter.js');
    // const { MinIOStorageAdapter } = await import('../../adapters/minio/storage-adapter.js');
    // const { QdrantSearchAdapter } = await import('../../adapters/qdrant/search-adapter.js');
    // const { RabbitMQQueueAdapter } = await import('../../adapters/rabbitmq/queue-adapter.js');

    // Placeholder — will be replaced when portable adapters are implemented
    throw new Error(
      "DockerRuntimeAdapter: Portable adapters not yet implemented. " +
        "These will be added in Phase 2 (Portable Core). " +
        "See adapters/ directory for the Cloudflare implementations to use as reference."
    );
  }

  /**
   * Create all services — same pattern as CloudflareRuntimeAdapter.
   */
  async createAllServices() {
    const adapters = await this.createAdapters();
    const identity = new IdentityService({
      database: adapters.database,
      cache: adapters.cache,
      audit: adapters.audit,
      queue: adapters.queue,
    });

    return {
      identity,
      workspace: new WorkspaceService({
        database: adapters.database,
        cache: adapters.cache,
        audit: adapters.audit,
        identity,
      }),
      "knowledge-store": new KnowledgeStoreService({
        database: adapters.database,
        storage: adapters.storage,
        search: adapters.search,
        queue: adapters.queue,
        audit: adapters.audit,
        identity,
      }),
      "knowledge-search": new KnowledgeSearchService({
        database: adapters.database,
        search: adapters.search,
        audit: adapters.audit,
        identity,
      }),
      "agent-chat": new AgentChatService({
        database: adapters.database,
        cache: adapters.cache,
        queue: adapters.queue,
        model: adapters.model,
        audit: adapters.audit,
        identity,
        usage: adapters.usage,
      }),
      "model-byok": new ModelByokService({
        database: adapters.database,
        cache: adapters.cache,
        model: adapters.model,
        audit: adapters.audit,
        identity,
        usage: adapters.usage,
      }),
      "audit-log": new AuditLogService({
        database: adapters.database,
        queue: adapters.queue,
      }),
      "usage-meter": new UsageMeterService({
        database: adapters.database,
        cache: adapters.cache,
        audit: adapters.audit,
        queue: adapters.queue,
      }),
    };
  }
}

export default DockerRuntimeAdapter;

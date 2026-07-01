/**
 * CloudflareRuntimeAdapter — Cloudflare Workers runtime adapter
 *
 * Implements the port/adapter pattern defined in ports/index.ts.
 * Wires up Cloudflare-specific implementations (D1, KV, R2, Vectorize, Queues)
 * and injects them into application services via dependency injection.
 *
 * This is the "Cloudflare-first" Phase 1 runtime. The same application
 * services can run with different adapters (Docker/K8s) without modification.
 */

import {
  CloudflareStorageAdapter,
  CloudflareDatabaseAdapter,
  CloudflareCacheAdapter,
  CloudflareSearchAdapter,
  CloudflareModelAdapter,
  CloudflareQueueAdapter,
} from "../../adapters/cloudflare/index.js";

import { createCloudflareAdapters, type CloudflareEnv } from "../../adapters/cloudflare/index.js";

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

export class CloudflareRuntimeAdapter {
  readonly name = "cloudflare";
  readonly version = "1.0.0-constitution";

  private env: CloudflareEnv;

  constructor(env: CloudflareEnv) {
    this.env = env;
  }

  /**
   * Create all adapter instances from Cloudflare environment bindings.
   */
  createAdapters() {
    return createCloudflareAdapters(this.env);
  }

  /**
   * Create the Identity Service with its required ports.
   */
  createIdentityService() {
    const adapters = this.createAdapters();
    return new IdentityService({
      database: adapters.database,
      cache: adapters.cache,
      audit: adapters.audit,
      queue: adapters.queue,
    });
  }

  /**
   * Create the Workspace Service with its required ports.
   */
  createWorkspaceService() {
    const adapters = this.createAdapters();
    const identity = this.createIdentityService();
    return new WorkspaceService({
      database: adapters.database,
      cache: adapters.cache,
      audit: adapters.audit,
      identity,
    });
  }

  /**
   * Create the Knowledge Store Service with its required ports.
   */
  createKnowledgeStoreService() {
    const adapters = this.createAdapters();
    const identity = this.createIdentityService();
    return new KnowledgeStoreService({
      database: adapters.database,
      storage: adapters.storage,
      search: adapters.search,
      queue: adapters.queue,
      audit: adapters.audit,
      identity,
    });
  }

  /**
   * Create the Knowledge Search Service with its required ports.
   */
  createKnowledgeSearchService() {
    const adapters = this.createAdapters();
    const identity = this.createIdentityService();
    return new KnowledgeSearchService({
      database: adapters.database,
      search: adapters.search,
      audit: adapters.audit,
      identity,
    });
  }

  /**
   * Create the Agent Chat Service with its required ports.
   */
  createAgentChatService() {
    const adapters = this.createAdapters();
    const identity = this.createIdentityService();
    return new AgentChatService({
      database: adapters.database,
      cache: adapters.cache,
      queue: adapters.queue,
      model: adapters.model,
      audit: adapters.audit,
      identity,
      usage: adapters.usage,
    });
  }

  /**
   * Create the Model BYOK Service with its required ports.
   */
  createModelByokService() {
    const adapters = this.createAdapters();
    const identity = this.createIdentityService();
    return new ModelByokService({
      database: adapters.database,
      cache: adapters.cache,
      model: adapters.model,
      audit: adapters.audit,
      identity,
      usage: adapters.usage,
    });
  }

  /**
   * Create the Audit Log Service with its required ports.
   */
  createAuditLogService() {
    const adapters = this.createAdapters();
    return new AuditLogService({
      database: adapters.database,
      queue: adapters.queue,
    });
  }

  /**
   * Create the Usage Meter Service with its required ports.
   */
  createUsageMeterService() {
    const adapters = this.createAdapters();
    return new UsageMeterService({
      database: adapters.database,
      cache: adapters.cache,
      audit: adapters.audit,
      queue: adapters.queue,
    });
  }

  /**
   * Create all services as a map — useful for service discovery.
   */
  createAllServices() {
    return {
      identity: this.createIdentityService(),
      workspace: this.createWorkspaceService(),
      "knowledge-store": this.createKnowledgeStoreService(),
      "knowledge-search": this.createKnowledgeSearchService(),
      "agent-chat": this.createAgentChatService(),
      "model-byok": this.createModelByokService(),
      "audit-log": this.createAuditLogService(),
      "usage-meter": this.createUsageMeterService(),
    };
  }
}

/**
 * Default export for use in Cloudflare Workers entry points.
 *
 * Usage:
 *   export default {
 *     async fetch(request: Request, env: CloudflareEnv) {
 *       const runtime = new CloudflareRuntimeAdapter(env);
 *       const identity = runtime.createIdentityService();
 *       // ... route to service method
 *     }
 *   }
 */
export default CloudflareRuntimeAdapter;

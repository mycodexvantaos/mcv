/**
 * @module runtimes/cloudflare/src/bootstrap
 * @description Bootstrap logic for the Cloudflare Workers runtime.
 *
 * This module wires all Cloudflare-specific adapters to application services,
 * creating the full service container for the Worker execution environment.
 *
 * Bindings expected in wrangler.toml:
 *   - D1_DATABASE (D1Database)
 *   - KV_CACHE (KVNamespace)
 *   - KV_SESSION (KVNamespace)
 *   - R2_BUCKET (R2Bucket)
 *   - AI (Ai)
 *   - QUEUE_JOBS (Queue)
 */

import type {
  IDatabasePort,
  IObjectStoragePort,
  ISearchPort,
  IChatModelPort,
  IEmbeddingModelPort,
  IQueuePort,
  IAuthPort,
} from '@mycodexvantaos/ports';

import { CloudflareD1Adapter } from '@mycodexvantaos/adapters/cloudflare-d1';
import { CloudflareKVCacheStore, CloudflareKVSessionStore } from '@mycodexvantaos/adapters/cloudflare-kv';
import { CloudflareR2Adapter } from '@mycodexvantaos/adapters/cloudflare-r2';
import { D1FullTextSearchAdapter } from '@mycodexvantaos/adapters/d1-full-text-search';
import { WorkersAIChatAdapter, WorkersAIEmbeddingAdapter } from '@mycodexvantaos/adapters/workers-ai';

import { IdentityService } from '@mycodexvantaos/application/identity';
import { WorkspaceService } from '@mycodexvantaos/application/workspace';
import { KnowledgeService } from '@mycodexvantaos/application/knowledge';
import { AgentService } from '@mycodexvantaos/application/agent';
import { ModelService } from '@mycodexvantaos/application/model';
import { AuditService } from '@mycodexvantaos/application/audit';
import { UsageService } from '@mycodexvantaos/application/usage';
import { AutomationService } from '@mycodexvantaos/application/automation';

export interface CloudflareBindings {
  D1_DATABASE: D1Database;
  KV_CACHE: KVNamespace;
  KV_SESSION: KVNamespace;
  R2_BUCKET: R2Bucket;
  AI: Ai;
  QUEUE_JOBS: Queue;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface CloudflareServiceContainer {
  identity: IdentityService;
  workspace: WorkspaceService;
  knowledge: KnowledgeService;
  agent: AgentService;
  model: ModelService;
  audit: AuditService;
  usage: UsageService;
  automation: AutomationService;
}

/**
 * Bootstrap the full service container for Cloudflare Workers runtime.
 * Called once per Worker isolate initialisation.
 */
export function bootstrapCloudflare(env: CloudflareBindings): CloudflareServiceContainer {
  // Adapters (ports → concrete Cloudflare implementations)
  const database: IDatabasePort = new CloudflareD1Adapter(env.D1_DATABASE);
  const cacheStore = new CloudflareKVCacheStore(env.KV_CACHE);
  const sessionStore = new CloudflareKVSessionStore(env.KV_SESSION);
  const objectStorage: IObjectStoragePort = new CloudflareR2Adapter(env.R2_BUCKET);
  const search: ISearchPort = new D1FullTextSearchAdapter(env.D1_DATABASE);
  const chatModel: IChatModelPort = new WorkersAIChatAdapter(env.AI);
  const embeddingModel: IEmbeddingModelPort = new WorkersAIEmbeddingAdapter(env.AI);

  // Application services (wired via constructor injection)
  const audit = new AuditService(database);
  const usage = new UsageService(cacheStore);
  const identity = new IdentityService(database, sessionStore, env.JWT_SECRET);
  const workspace = new WorkspaceService(database);
  const model = new ModelService(chatModel, embeddingModel);
  const knowledge = new KnowledgeService(database, objectStorage, search, embeddingModel);
  const automation = new AutomationService(env.QUEUE_JOBS as unknown as IQueuePort);
  const agent = new AgentService(knowledge, model, audit, usage);

  return { identity, workspace, knowledge, agent, model, audit, usage, automation };
}

/**
 * Create a lightweight health-check probe that validates
 * all critical infrastructure bindings are present.
 */
export function healthCheck(env: CloudflareBindings): {
  status: 'ok' | 'degraded' | 'down';
  checks: Record<string, boolean>;
} {
  const checks: Record<string, boolean> = {
    d1: !!env.D1_DATABASE,
    kvCache: !!env.KV_CACHE,
    kvSession: !!env.KV_SESSION,
    r2: !!env.R2_BUCKET,
    ai: !!env.AI,
    queue: !!env.QUEUE_JOBS,
    jwt: !!env.JWT_SECRET,
  };

  const allOk = Object.values(checks).every(Boolean);
  const mostOk = Object.values(checks).filter(Boolean).length >= 5;

  return {
    status: allOk ? 'ok' : mostOk ? 'degraded' : 'down',
    checks,
  };
}

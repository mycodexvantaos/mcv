/**
 * @module apps/api-worker
 * @description Cloudflare Worker entry point for the MyCodeXvantaOS platform API.
 *
 * This is the primary HTTP API surface. It routes incoming requests to
 * the appropriate application service, wiring ports to adapters at
 * boot time via dependency injection.
 *
 * Routes are organised by the 8 service categories:
 *   /api/v1/knowledge/**   → KnowledgeService
 *   /api/v1/agent/**       → AgentService
 *   /api/v1/workspace/**   → WorkspaceService
 *   /api/v1/developer/**   → (reserved)
 *   /api/v1/security/**    → IdentityService
 *   /api/v1/storage/**     → (delegated to R2 presigned URLs)
 *   /api/v1/model/**       → ModelService
 *   /api/v1/automation/**  → AutomationService
 *
 * Cross-cutting concerns (audit, usage) are invoked internally by
 * the services rather than exposed as separate top-level routes.
 */

import type { CloudflareBindings } from '@mycodexvantaos/adapters/cloudflare-d1';
import type {
  IAuthPort,
  IDatabasePort,
  IObjectStoragePort,
  ISearchPort,
  IChatModelPort,
  IEmbeddingModelPort,
  IQueuePort,
} from '@mycodexvantaos/ports';

import { CloudflareD1Adapter } from '@mycodexvantaos/adapters/cloudflare-d1';
import {
  CloudflareKVCacheStore,
  CloudflareKVSessionStore,
} from '@mycodexvantaos/adapters/cloudflare-kv';
import { CloudflareR2Adapter } from '@mycodexvantaos/adapters/cloudflare-r2';
import { D1FullTextSearchAdapter } from '@mycodexvantaos/adapters/d1-full-text-search';
import {
  WorkersAIChatAdapter,
  WorkersAIEmbeddingAdapter,
} from '@mycodexvantaos/adapters/workers-ai';

import { IdentityService } from '@mycodexvantaos/application/identity';
import { WorkspaceService } from '@mycodexvantaos/application/workspace';
import { KnowledgeService } from '@mycodexvantaos/application/knowledge';
import { AgentService } from '@mycodexvantaos/application/agent';
import { ModelService } from '@mycodexvantaos/application/model';
import { AuditService } from '@mycodexvantaos/application/audit';
import { UsageService } from '@mycodexvantaos/application/usage';
import { AutomationService } from '@mycodexvantaos/application/automation';

// ── Type for Env bindings (wrangler.toml → D1, KV, R2, AI bindings) ────
export interface Env {
  D1_DATABASE: D1Database;
  KV_CACHE: KVNamespace;
  KV_SESSION: KVNamespace;
  R2_BUCKET: R2Bucket;
  AI: Ai; // Cloudflare Workers AI binding
  QUEUE_JOBS: Queue; // Cloudflare Queue binding
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  JWT_SECRET: string;
  ENVIRONMENT: 'production' | 'staging' | 'development';
}

// ── Service container (assembled once per Worker isolate) ───────────────
interface ServiceContainer {
  identity: IdentityService;
  workspace: WorkspaceService;
  knowledge: KnowledgeService;
  agent: AgentService;
  model: ModelService;
  audit: AuditService;
  usage: UsageService;
  automation: AutomationService;
}

function assembleServices(env: Env): ServiceContainer {
  // Adapters (ports → concrete implementations)
  const database: IDatabasePort = new CloudflareD1Adapter(env.D1_DATABASE);
  const cacheStore = new CloudflareKVCacheStore(env.KV_CACHE);
  const sessionStore = new CloudflareKVSessionStore(env.KV_SESSION);
  const objectStorage: IObjectStoragePort = new CloudflareR2Adapter(env.R2_BUCKET);
  const search: ISearchPort = new D1FullTextSearchAdapter(env.D1_DATABASE);
  const chatModel: IChatModelPort = new WorkersAIChatAdapter(env.AI);
  const embeddingModel: IEmbeddingModelPort = new WorkersAIEmbeddingAdapter(env.AI);

  // Application services
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

// ── Router ─────────────────────────────────────────────────────────────
const ROUTE_TABLE: Array<{
  method: string;
  pattern: URLPattern;
  handler: (
    req: Request,
    svc: ServiceContainer,
    ctx: ExecutionContext,
    match: URLPatternResult
  ) => Promise<Response>;
}> = [];

function registerRoute(
  method: string,
  pathPattern: string,
  handler: (
    req: Request,
    svc: ServiceContainer,
    ctx: ExecutionContext,
    match: URLPatternResult
  ) => Promise<Response>
): void {
  ROUTE_TABLE.push({ method, pattern: new URLPattern({ pathname: pathPattern }), handler });
}

// ── Health ─────────────────────────────────────────────────────────────
registerRoute('GET', '/api/v1/health', async (_req, _svc, _ctx) => {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Security / Identity ────────────────────────────────────────────────
registerRoute('POST', '/api/v1/security/register', async (req, svc) => {
  const body = (await req.json()) as {
    subjectId: string;
    roles: string[];
    claims?: Record<string, unknown>;
  };
  const result = await svc.identity.registerSubject(body);
  return Response.json(result);
});

registerRoute('POST', '/api/v1/security/token', async (req, svc) => {
  const body = (await req.json()) as { subjectId: string; password: string };
  const result = await svc.identity.createSession(body.subjectId, body.password);
  return Response.json(result);
});

registerRoute('GET', '/api/v1/security/verify', async (req, svc) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });
  const result = await svc.identity.validateToken(token);
  return Response.json(result);
});

// ── Workspace ──────────────────────────────────────────────────────────
registerRoute('POST', '/api/v1/workspace', async (req, svc) => {
  const body = (await req.json()) as {
    name: string;
    ownerId: string;
    settings?: Record<string, unknown>;
  };
  const result = await svc.workspace.createWorkspace(body);
  return Response.json(result, { status: 201 });
});

registerRoute('GET', '/api/v1/workspace', async (_req, svc) => {
  const result = await svc.workspace.listWorkspaces();
  return Response.json(result);
});

// ── Knowledge ──────────────────────────────────────────────────────────
registerRoute('POST', '/api/v1/knowledge/collections', async (req, svc) => {
  const body = (await req.json()) as {
    name: string;
    description?: string;
    embeddingModel?: string;
  };
  const result = await svc.knowledge.createCollection(body);
  return Response.json(result, { status: 201 });
});

registerRoute('POST', '/api/v1/knowledge/ingest', async (req, svc) => {
  const body = (await req.json()) as {
    collectionId: string;
    documentId: string;
    content: string;
    metadata?: Record<string, unknown>;
  };
  const result = await svc.knowledge.ingestDocument(body);
  return Response.json(result, { status: 202 });
});

registerRoute('POST', '/api/v1/knowledge/search', async (req, svc) => {
  const body = (await req.json()) as { query: string; collectionIds?: string[]; topK?: number };
  const result = await svc.knowledge.searchKnowledge(body.query, body.collectionIds, body.topK);
  return Response.json(result);
});

// ── Agent ──────────────────────────────────────────────────────────────
registerRoute('POST', '/api/v1/agent/sessions', async (req, svc) => {
  const body = (await req.json()) as { workspaceId: string; modelEndpointId?: string };
  const result = await svc.agent.createSession(body.workspaceId, body.modelEndpointId);
  return Response.json(result, { status: 201 });
});

registerRoute(
  'POST',
  '/api/v1/agent/sessions/:sessionId/messages',
  async (req, svc, _ctx, match) => {
    const sessionId = match.pathname.groups.sessionId!;
    const body = (await req.json()) as { content: string; collectionIds?: string[] };
    const result = await svc.agent.sendMessage(sessionId, body.content, body.collectionIds);
    return Response.json(result);
  }
);

// ── Model ──────────────────────────────────────────────────────────────
registerRoute('GET', '/api/v1/model/endpoints', async (_req, svc) => {
  const result = await svc.model.healthCheck();
  return Response.json(result);
});

registerRoute('POST', '/api/v1/model/chat', async (req, svc) => {
  const body = (await req.json()) as {
    modelId: string;
    messages: Array<{ role: string; content: string }>;
    options?: Record<string, unknown>;
  };
  const result = await svc.model.callChatModel(body.modelId, body.messages, body.options);
  return Response.json(result);
});

// ── Audit ──────────────────────────────────────────────────────────────
registerRoute('GET', '/api/v1/audit/events', async (req, svc) => {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const result = await svc.audit.listAuditEvents(limit, cursor);
  return Response.json(result);
});

registerRoute('POST', '/api/v1/audit/verify', async (_req, svc) => {
  const result = await svc.audit.verifyAuditChain();
  return Response.json(result);
});

// ── Usage ──────────────────────────────────────────────────────────────
registerRoute('GET', '/api/v1/usage/:subjectId', async (req, svc, _ctx, match) => {
  const subjectId = match.pathname.groups.subjectId!;
  const url = new URL(req.url);
  const window = (url.searchParams.get('window') as 'minute' | 'hour' | 'day') ?? 'hour';
  const result = await svc.usage.listUsageEvents(subjectId, window);
  return Response.json(result);
});

// ── Automation ─────────────────────────────────────────────────────────
registerRoute('POST', '/api/v1/automation/jobs', async (req, svc) => {
  const body = (await req.json()) as { jobType: string; payload: unknown; priority?: number };
  const result = await svc.automation.enqueueJob(body.jobType, body.payload, body.priority);
  return Response.json(result, { status: 202 });
});

// ── Cloudflare Worker export ───────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Route matching
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return Response.json({
        name: 'MyCodeXvantaOS API',
        version: '0.1.0',
        status: 'running',
        docs: '/api/v1/health',
      });
    }

    for (const route of ROUTE_TABLE) {
      if (route.method !== request.method) continue;
      const match = route.pattern.exec(url);
      if (match) {
        try {
          const svc = assembleServices(env);
          const response = await route.handler(request, svc, ctx, match);
          // Add CORS headers to all responses
          response.headers.set('Access-Control-Allow-Origin', '*');
          return response;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal Server Error';
          const status = message.includes('not found')
            ? 404
            : message.includes('unauthorized') || message.includes('Unauthorized')
              ? 401
              : message.includes('forbidden')
                ? 403
                : message.includes('already exists')
                  ? 409
                  : message.includes('quota')
                    ? 429
                    : 500;
          return Response.json({ error: message }, { status });
        }
      }
    }

    return Response.json({ error: 'Not Found', path: url.pathname }, { status: 404 });
  },

  // Queue consumer for async job processing
  async queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext): Promise<void> {
    const database = new CloudflareD1Adapter(env.D1_DATABASE);
    const search = new D1FullTextSearchAdapter(env.D1_DATABASE);
    const embeddingModel = new WorkersAIEmbeddingAdapter(env.AI);
    const objectStorage = new CloudflareR2Adapter(env.R2_BUCKET);
    const knowledge = new KnowledgeService(database, objectStorage, search, embeddingModel);
    const automation = new AutomationService({} as never);

    for (const message of batch.messages) {
      try {
        const { jobType, payload } = message.body as { jobType: string; payload: unknown };
        if (jobType === 'chunk-and-embed') {
          const p = payload as { documentId: string; collectionId: string };
          await knowledge.ingestDocument({
            documentId: p.documentId,
            collectionId: p.collectionId,
            content: '',
          });
        }
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};

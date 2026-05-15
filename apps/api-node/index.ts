/**
 * @module apps/api-node
 * @description Node.js API server for self-hosted deployment.
 *
 * Runtime activation (spectrum-02):
 *   Loop 1: GET /v1/services, GET /v1/services/:id
 *   Loop 2: GET /v1/resource-kinds, GET /v1/resource-kinds/:kind
 *   Loop 3: POST /v1/audit/events, GET /v1/audit/events
 *   Loop 4: POST /v1/knowledge/search (with retrieval receipt)
 *   Loop 5: POST /v1/dream/run, GET /v1/dream/runs/:id
 *
 * Uses Node.js http module — zero external HTTP framework dependencies.
 * All contract data loaded via @mycodexvantaos/contracts-sdk.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

// ─── Service imports ──────────────────────────────────────────────────────────

import {
  listServices,
  getService,
  type ServiceListResponse,
  type ServiceDetailResponse,
} from '@mycodexvantaos/service-service-catalog';

import {
  listResourceKinds,
  getResourceKind,
  type ResourceKindListResponse,
  type ResourceKindDetailResponse,
} from '@mycodexvantaos/service-resource-registry';

import {
  recordEvent,
  queryEvents,
  getEvent as getAuditEvent,
  verifyIntegrity,
  type CreateAuditEventRequest,
  type CreateAuditEventResponse,
  type QueryAuditEventsResponse,
} from '@mycodexvantaos/service-audit-log';

import { validateAllContracts } from '@mycodexvantaos/contracts-sdk';

import {
  createSearchReceipt as createReceipt,
  getReceipt as getRetrievalReceipt,
  getTrace as getAnswerTrace,
  createAnswerTrace as createTrace,
  verifyReceipt as verifyRetrievalReceipt,
  type SearchResult,
} from '@mycodexvantaos/service-knowledge-trace';

import {
  createDreamRunSync,
  getDreamRun as getDreamRunRecord,
  listDreamRuns as listDreamRunRecords,
  getDreamStats,
} from '@mycodexvantaos/service-memory-dream';

// ─── Knowledge trace (delegated to service-knowledge-trace) ──────────

// ─── Dream run models (in-memory MVP) ─────────────────────────────────────────

interface DreamRun {
  runId: string;
  mode: 'dry-run' | 'proposal' | 'execute';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  actionsCount: number;
  report?: {
    duplicates: number;
    conflicts: number;
    orphans: number;
    actions: number;
  };
}

const dreamRuns = new Map<string, DreamRun>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

// ─── Route matching ───────────────────────────────────────────────────────────

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: Record<string, string>
) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler): void {
  // Convert path like /v1/services/:id to a regex with named captures
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${regexStr}$`);
  routes.push({ method, pattern, paramNames, handler });
}

// ─── Health / Meta ────────────────────────────────────────────────────────────

addRoute('GET', '/v1/health', async (_req, res) => {
  sendJson(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    runtime: 'node',
  });
});

addRoute('GET', '/v1/contracts/validate', async (_req, res) => {
  const result = validateAllContracts();
  sendJson(res, 200, result);
});

// ─── Loop 1: Service Catalog ─────────────────────────────────────────────────

addRoute('GET', '/v1/services', async (_req, res, _params, query) => {
  const result = listServices();
  // Support optional filtering by category
  const category = query['category'];
  if (category) {
    const filtered = result.services.filter((s) => s.category === category);
    sendJson(res, 200, { services: filtered, total: filtered.length });
    return;
  }
  sendJson(res, 200, result);
});

addRoute('GET', '/v1/services/:id', async (_req, res, params) => {
  const service = getService(params.id);
  if (!service) {
    sendError(res, 404, `Service not found: ${params.id}`);
    return;
  }
  sendJson(res, 200, { service });
});

// ─── Loop 2: Resource Registry ───────────────────────────────────────────────

addRoute('GET', '/v1/resource-kinds', async (_req, res) => {
  const result = listResourceKinds();
  sendJson(res, 200, result);
});

addRoute('GET', '/v1/resource-kinds/:kind', async (_req, res, params) => {
  const resourceKind = getResourceKind(params.kind);
  if (!resourceKind) {
    sendError(res, 404, `Resource kind not found: ${params.kind}`);
    return;
  }
  sendJson(res, 200, { resourceKind });
});

// ─── Loop 3: Audit Event Runtime ─────────────────────────────────────────────

addRoute('POST', '/v1/audit/events', async (req, res) => {
  const body = await readBody(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const createReq = parsed as CreateAuditEventRequest;
  if (!createReq.eventType || !createReq.category || !createReq.actor || !createReq.resource || !createReq.context) {
    sendError(res, 400, 'Missing required fields: eventType, category, actor, resource, context');
    return;
  }
  const result = recordEvent(createReq);
  sendJson(res, 201, result);
});

addRoute('GET', '/v1/audit/events', async (_req, res, _params, query) => {
  const result = queryEvents({
    eventType: query['eventType'],
    category: query['category'] as 'knowledge' | 'agent' | 'workspace' | 'developer' | 'security' | 'storage' | 'model' | 'automation' | 'audit' | undefined,
    resourceType: query['resourceType'],
    resourceId: query['resourceId'],
    actorId: query['actorId'],
    tenantId: query['tenantId'],
    workspaceId: query['workspaceId'],
    fromTimestamp: query['from'],
    toTimestamp: query['to'],
    limit: query['limit'] ? Number(query['limit']) : undefined,
    offset: query['offset'] ? Number(query['offset']) : undefined,
  });
  sendJson(res, 200, result);
});

addRoute('GET', '/v1/audit/events/:eventId', async (_req, res, params) => {
  const event = getAuditEvent(params.eventId);
  if (!event) {
    sendError(res, 404, `Audit event not found: ${params.eventId}`);
    return;
  }
  sendJson(res, 200, { event });
});

addRoute('GET', '/v1/audit/verify', async (_req, res) => {
  const result = verifyIntegrity();
  sendJson(res, 200, result);
});

// ─── Loop 4: Knowledge Trace Runtime ─────────────────────────────────────────

addRoute('POST', '/v1/knowledge/search', async (req, res) => {
  const body = await readBody(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const searchReq = parsed as { query: string; collectionIds?: string[]; topK?: number; evidenceLevel?: 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded' };
  if (!searchReq.query) {
    sendError(res, 400, 'Missing required field: query');
    return;
  }

  // Create a retrieval receipt via knowledge-trace service
  const { receipt } = createReceipt({
    query: searchReq.query,
    collectionIds: searchReq.collectionIds,
    topK: searchReq.topK,
    evidenceLevel: searchReq.evidenceLevel,
  });

  sendJson(res, 200, {
    receiptId: receipt.receiptId,
    query: receipt.query,
    results: receipt.results,
    totalResults: receipt.totalResults,
    receipt: {
      receiptId: receipt.receiptId,
      evidenceLevel: receipt.evidenceLevel,
      createdAt: receipt.createdAt,
    },
  });
});

addRoute('POST', '/v1/knowledge/answer', async (req, res) => {
  const body = await readBody(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const answerReq = parsed as { receiptId: string; answer: string; evidenceLevel?: string; citations?: Array<{ chunkId: string; text: string }> };
  if (!answerReq.receiptId || !answerReq.answer) {
    sendError(res, 400, 'Missing required fields: receiptId, answer');
    return;
  }

  try {
    const { trace } = createTrace({
      receiptId: answerReq.receiptId,
      answer: answerReq.answer,
      evidenceLevel: answerReq.evidenceLevel as 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded' | undefined,
      citations: answerReq.citations,
    });
    sendJson(res, 201, { trace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    sendError(res, 400, message);
  }
});

addRoute('GET', '/v1/knowledge/retrieval-receipts/:id', async (_req, res, params) => {
  const receipt = getRetrievalReceipt(params.id);
  if (!receipt) {
    sendError(res, 404, `Retrieval receipt not found: ${params.id}`);
    return;
  }
  sendJson(res, 200, { receipt });
});

addRoute('GET', '/v1/knowledge/answer-traces/:id', async (_req, res, params) => {
  const trace = getAnswerTrace(params.id);
  if (!trace) {
    sendError(res, 404, `Answer trace not found: ${params.id}`);
    return;
  }
  sendJson(res, 200, { trace });
});

addRoute('GET', '/v1/knowledge/verify/:id', async (_req, res, params) => {
  const result = verifyRetrievalReceipt(params.id);
  sendJson(res, 200, result);
});

// ─── Loop 5: Memory Dream Runtime ────────────────────────────────────────────

addRoute('POST', '/v1/dream/run', async (req, res) => {
  const body = await readBody(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const dreamReq = parsed as { mode?: 'dry-run' | 'proposal' | 'execute'; memory_items?: unknown[] };
  const mode = dreamReq.mode ?? 'dry-run';

  // Use the memory-dream service (sync JS engine for MVP, with Python fallback)
  const result = createDreamRunSync({
    mode,
    memory_items: dreamReq.memory_items as import('@mycodexvantaos/service-memory-dream').MemoryItem[] | undefined,
  });

  // Record audit event for dream run
  recordEvent({
    eventType: 'dream.run-initiated',
    category: 'automation',
    severity: 'info',
    actor: { type: 'system', id: 'dream-worker' },
    resource: { type: 'dream-run', id: result.run.runId },
    context: { tenantId: 'system', workspaceId: null },
    data: { mode, runId: result.run.runId },
  });

  sendJson(res, 202, {
    runId: result.run.runId,
    mode: result.run.mode,
    status: result.run.status,
    report: result.run.report,
  });
});

addRoute('GET', '/v1/dream/runs/:id', async (_req, res, params) => {
  const result = getDreamRunRecord(params.id);
  if (!result) {
    sendError(res, 404, `Dream run not found: ${params.id}`);
    return;
  }
  sendJson(res, 200, { run: result.run });
});

addRoute('GET', '/v1/dream/runs/:id/actions', async (_req, res, params) => {
  const result = getDreamRunRecord(params.id);
  if (!result) {
    sendError(res, 404, `Dream run not found: ${params.id}`);
    return;
  }
  const actions = result.run.report?.actions ?? [];
  sendJson(res, 200, {
    runId: params.id,
    actions,
    total: actions.length,
  });
});

addRoute('GET', '/v1/dream/stats', async (_req, res) => {
  const stats = getDreamStats();
  sendJson(res, 200, stats);
});

// ─── Root ─────────────────────────────────────────────────────────────────────

addRoute('GET', '/', async (_req, res) => {
  sendJson(res, 200, {
    name: 'MyCodeXvantaOS API',
    version: '0.1.0',
    status: 'running',
    runtime: 'node',
    loops: [
      'service-catalog',
      'resource-registry',
      'audit-log',
      'knowledge-trace',
      'memory-dream',
    ],
    endpoints: [
      'GET  /v1/health',
      'GET  /v1/contracts/validate',
      'GET  /v1/services',
      'GET  /v1/services/:id',
      'GET  /v1/resource-kinds',
      'GET  /v1/resource-kinds/:kind',
      'POST /v1/audit/events',
      'GET  /v1/audit/events',
      'GET  /v1/audit/events/:eventId',
      'GET  /v1/audit/verify',
      'POST /v1/knowledge/search',
      'POST /v1/knowledge/answer',
      'GET  /v1/knowledge/retrieval-receipts/:id',
      'GET  /v1/knowledge/answer-traces/:id',
      'GET  /v1/knowledge/verify/:id',
      'POST /v1/dream/run',
      'GET  /v1/dream/runs/:id',
      'GET  /v1/dream/runs/:id/actions',
      'GET  /v1/dream/stats',
    ],
  });
});

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 9100);

const server = createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method ?? 'GET';

  // Parse query parameters
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Route matching
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;

    // Extract params
    const params: Record<string, string> = {};
    for (let i = 0; i < route.paramNames.length; i++) {
      params[route.paramNames[i]] = match[i + 1];
    }

    try {
      await route.handler(req, res, params, query);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      console.error(`Error handling ${method} ${pathname}:`, message);
      sendError(res, 500, message);
    }
    return;
  }

  sendError(res, 404, `Not Found: ${method} ${pathname}`);
});

server.listen(PORT, () => {
  console.log(`🚀 MyCodeXvantaOS API Node running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/v1/health`);
  console.log(`   Services: http://localhost:${PORT}/v1/services`);
  console.log(`   Resource Kinds: http://localhost:${PORT}/v1/resource-kinds`);
  console.log(`   Audit Events: http://localhost:${PORT}/v1/audit/events`);
});

export { server, routes };

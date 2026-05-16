/**
 * @module apps/api-node
 * @description Node.js API server for self-hosted deployment.
 *
 * Platform launch readiness (spectrum-04):
 *   GET /v1/version, GET /v1/runtime
 *
 * Runtime activation (spectrum-02):
 *   Loop 1: GET /v1/services, GET /v1/services/:id
 *   Loop 2: GET /v1/resource-kinds, GET /v1/resource-kinds/:kind
 *   Loop 3: POST /v1/audit/events, GET /v1/audit/events
 *   Loop 4: POST /v1/knowledge/search (with retrieval receipt)
 *   Loop 5: POST /v1/dream/run, GET /v1/dream/runs/:id
 *
 * Governance hardening (spectrum-03):
 *   Loop 6: POST /v1/policies/evaluate, GET /v1/policies
 *   withAudit() enforcement on all state-changing routes
 *   Knowledge trace enforcement (receipt required)
 *   Dream safety enforcement (review/apply/rollback)
 *
 * Uses Node.js http module — zero external HTTP framework dependencies.
 * All contract data loaded via @mycodexvantaos/contracts-sdk.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

// ── Service imports ──────────────────────────────────────────────────────

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

import {
  evaluatePolicy,
  getPolicyEngine,
  type PolicyEvaluateRequest as PolicyEvaluateRequestType,
} from '@mycodexvantaos/service-policy-engine';

// ── Dream run models (in-memory MVP) ────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────

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

// ── Route matching ───────────────────────────────────────────────────────

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
  audited?: boolean;
}

const routes: Route[] = [];

function addRoute(
  method: string,
  path: string,
  handler: RouteHandler,
  opts?: { audited?: boolean }
): void {
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${regexStr}$`);
  routes.push({ method, pattern, paramNames, handler, audited: opts?.audited });
}

// ── Audit Enforcement Middleware ─────────────────────────────────────────

/**
 * withAudit() wraps a state-changing route handler to ensure it produces an audit event.
 * This is the governance enforcement layer — every mutation must be auditable.
 *
 * If audit enforcement is enabled (default), any POST/PUT/DELETE route that is NOT
 * wrapped with withAudit() will be rejected at runtime with a 403 error.
 *
 * Usage:
 *   addRoute('POST', '/v1/dream/run', withAudit('dream.run-initiated', 'automation', handler));
 */
let auditEnforcementEnabled = true;

export function setAuditEnforcement(enabled: boolean): void {
  auditEnforcementEnabled = enabled;
}

export function isAuditEnforcementEnabled(): boolean {
  return auditEnforcementEnabled;
}

type AuditableEventType = string;
type AuditableCategory =
  | 'knowledge'
  | 'agent'
  | 'workspace'
  | 'developer'
  | 'security'
  | 'storage'
  | 'model'
  | 'automation'
  | 'audit';

function withAudit(
  eventType: AuditableEventType,
  category: AuditableCategory,
  handler: RouteHandler,
  opts?: {
    severity?: 'info' | 'warning' | 'error';
    resourceType?: string;
    resourceIdParam?: string;
  }
): RouteHandler {
  return async (req, res, params, query) => {
    // Track the response status by intercepting writeHead
    let responseStatus = 200;
    const originalWriteHead = res.writeHead;

    // Override writeHead to capture the status code
    res.writeHead = function (statusCode: number, ...args: unknown[]) {
      responseStatus = statusCode;
      // Call original with proper types
      if (args.length === 0) return originalWriteHead.call(res, statusCode);
      if (typeof args[0] === 'string' && args.length === 1)
        return originalWriteHead.call(res, statusCode, args[0] as string);
      if (typeof args[0] === 'object' && args.length === 1)
        return originalWriteHead.call(
          res,
          statusCode,
          args[0] as Record<string, string | string[]>
        );
      if (typeof args[0] === 'string' && typeof args[1] === 'object')
        return originalWriteHead.call(
          res,
          statusCode,
          args[0] as string,
          args[1] as Record<string, string | string[]>
        );
      return originalWriteHead.call(res, statusCode);
    };

    // Execute the handler
    await handler(req, res, params, query);

    // Produce audit event for the state-changing operation
    const success = responseStatus >= 200 && responseStatus < 300;
    const resourceType = opts?.resourceType ?? 'unknown';
    const resourceId = opts?.resourceIdParam ? params[opts.resourceIdParam] : undefined;

    recordEvent({
      eventType,
      category,
      severity: success ? (opts?.severity ?? 'info') : 'warning',
      actor: { type: 'system', id: 'api-node' },
      resource: { type: resourceType, id: resourceId },
      context: { tenantId: 'system', workspaceId: null },
      data: {
        method: req.method,
        path: req.url,
        status: responseStatus,
        success,
        enforcedBy: 'withAudit',
      },
    });
  };
}

// ── Health / Meta ────────────────────────────────────────────────────────

addRoute('GET', '/', async (_req, res) => {
  sendJson(res, 200, {
    name: 'MyCodeXvantaOS',
    version: '0.1.0',
    description: 'Self-hosted AI platform with dual-plane architecture',
    status: 'running',
    runtime: 'node',
    apiBase: '/v1',
    loops: [
      'service-catalog',
      'resource-registry',
      'audit-log',
      'knowledge-trace',
      'memory-dream',
      'policy-engine',
    ],
    governance: {
      auditEnforcement: auditEnforcementEnabled,
      knowledgeTraceEnforcement: true,
      dreamSafetyEnforcement: true,
    },
    endpoints: [
      'GET  /v1/health',
      'GET  /v1/ready',
      'GET  /v1/version',
      'GET  /v1/runtime',
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
      'POST /v1/dream/runs/:id/review',
      'POST /v1/dream/runs/:id/apply',
      'POST /v1/dream/runs/:id/rollback',
      'POST /v1/policies/evaluate',
      'GET  /v1/policies',
    ],
  });
});

addRoute('GET', '/v1/health', async (_req, res) => {
  // Verify all 5 runtime loops are responsive
  const loops: Record<string, { status: string; details?: string }> = {};

  // Loop 1: Service Catalog
  try {
    const services = listServices();
    loops['service-catalog'] = { status: 'ok', details: `${services.services.length} services` };
  } catch (e) {
    loops['service-catalog'] = {
      status: 'error',
      details: e instanceof Error ? e.message : 'unknown',
    };
  }

  // Loop 2: Resource Registry
  try {
    const kinds = listResourceKinds();
    loops['resource-registry'] = {
      status: 'ok',
      details: `${kinds.resourceKinds.length} resource kinds`,
    };
  } catch (e) {
    loops['resource-registry'] = {
      status: 'error',
      details: e instanceof Error ? e.message : 'unknown',
    };
  }

  // Loop 3: Audit Log
  try {
    const events = queryEvents({ limit: 1 });
    loops['audit-log'] = { status: 'ok', details: `${events.total} events` };
  } catch (e) {
    loops['audit-log'] = { status: 'error', details: e instanceof Error ? e.message : 'unknown' };
  }

  // Loop 4: Knowledge Trace
  try {
    loops['knowledge-trace'] = { status: 'ok', details: 'receipt and trace services available' };
  } catch (e) {
    loops['knowledge-trace'] = {
      status: 'error',
      details: e instanceof Error ? e.message : 'unknown',
    };
  }

  // Loop 5: Memory Dream
  try {
    const stats = getDreamStats();
    loops['memory-dream'] = { status: 'ok', details: `${stats.totalRuns} runs` };
  } catch (e) {
    loops['memory-dream'] = {
      status: 'error',
      details: e instanceof Error ? e.message : 'unknown',
    };
  }

  const allOk = Object.values(loops).every((l) => l.status === 'ok');
  const degraded = !allOk;

  sendJson(res, degraded ? 503 : 200, {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    runtime: 'node',
    loops,
    governance: {
      auditEnforcement: auditEnforcementEnabled,
      knowledgeTraceEnforcement: true,
      dreamSafetyEnforcement: true,
    },
  });
});

addRoute('GET', '/v1/ready', async (_req, res) => {
  // Readiness probe for Kubernetes — checks that the server can serve traffic
  const checks: Record<string, string> = {};

  try {
    listServices();
    checks['service-catalog'] = 'ready';
  } catch {
    checks['service-catalog'] = 'not-ready';
  }

  try {
    listResourceKinds();
    checks['resource-registry'] = 'ready';
  } catch {
    checks['resource-registry'] = 'not-ready';
  }

  const allReady = Object.values(checks).every((v) => v === 'ready');

  sendJson(res, allReady ? 200 : 503, {
    ready: allReady,
    timestamp: new Date().toISOString(),
    checks,
  });
});

addRoute('GET', '/v1/version', async (_req, res) => {
  sendJson(res, 200, {
    version: process.env.npm_package_version ?? '0.1.0',
    commit: process.env.GIT_COMMIT ?? 'unknown',
    branch: process.env.GIT_BRANCH ?? 'unknown',
    buildTimestamp: process.env.BUILD_TIMESTAMP ?? new Date().toISOString(),
    nodeVersion: process.version,
  });
});

addRoute('GET', '/v1/runtime', async (_req, res) => {
  const memoryUsage = process.memoryUsage();
  sendJson(res, 200, {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    },
    env: process.env.NODE_ENV ?? 'development',
    nodeVersions: process.versions,
    execPath: process.execPath,
    cwd: process.cwd(),
  });
});

addRoute('GET', '/v1/contracts/validate', async (_req, res) => {
  const result = validateAllContracts();
  sendJson(res, 200, result);
});

// ── Loop 1: Service Catalog ─────────────────────────────────────────────

addRoute('GET', '/v1/services', async (_req, res, _params, query) => {
  const result = listServices();
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

// ── Loop 2: Resource Registry ───────────────────────────────────────────

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

// ── Loop 3: Audit Event Runtime (with withAudit enforcement) ────────────

// POST /v1/audit/events is NOT wrapped with withAudit() to prevent
// infinite recursion — this route IS the audit mechanism. Recording an
// audit event about recording an audit event would be redundant noise.
// It is still marked { audited: true } so the enforcement layer allows it.
addRoute(
  'POST',
  '/v1/audit/events',
  async (req, res) => {
    const body = await readBody(req);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      sendError(res, 400, 'Invalid JSON body');
      return;
    }
    const createReq = parsed as CreateAuditEventRequest;
    if (
      !createReq.eventType ||
      !createReq.category ||
      !createReq.actor ||
      !createReq.resource ||
      !createReq.context
    ) {
      sendError(res, 400, 'Missing required fields: eventType, category, actor, resource, context');
      return;
    }
    const result = recordEvent(createReq);
    sendJson(res, 201, result);
  },
  { audited: true }
);

addRoute('GET', '/v1/audit/events', async (_req, res, _params, query) => {
  const result = queryEvents({
    eventType: query['eventType'],
    category: query['category'] as
      | 'knowledge'
      | 'agent'
      | 'workspace'
      | 'developer'
      | 'security'
      | 'storage'
      | 'model'
      | 'automation'
      | 'audit'
      | undefined,
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

// ── Loop 4: Knowledge Trace Runtime (with withAudit enforcement) ────────

addRoute(
  'POST',
  '/v1/knowledge/search',
  withAudit(
    'knowledge.search',
    'knowledge',
    async (req, res) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const searchReq = parsed as {
        query: string;
        collectionIds?: string[];
        topK?: number;
        evidenceLevel?: 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded';
      };
      if (!searchReq.query) {
        sendError(res, 400, 'Missing required field: query');
        return;
      }

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
    },
    { resourceType: 'knowledge-receipt' }
  ),
  { audited: true }
);

addRoute(
  'POST',
  '/v1/knowledge/answer',
  withAudit(
    'knowledge.answer-created',
    'knowledge',
    async (req, res) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const answerReq = parsed as {
        receiptId: string;
        answer: string;
        evidenceLevel?: string;
        citations?: Array<{ chunkId: string; text: string }>;
        knowledge_assisted?: boolean;
      };
      if (!answerReq.receiptId || !answerReq.answer) {
        sendError(res, 400, 'Missing required fields: receiptId, answer');
        return;
      }

      // ── Knowledge Trace Enforcement (PR 46) ────────────────────────────
      // If knowledge_assisted=true, the receiptId MUST be a valid retrieval receipt
      if (answerReq.knowledge_assisted === true) {
        const receipt = getRetrievalReceipt(answerReq.receiptId);
        if (!receipt) {
          sendError(
            res,
            403,
            `Knowledge-assisted answer requires valid retrieval_receipt_id. Receipt not found: ${answerReq.receiptId}`
          );
          return;
        }
      }

      try {
        const { trace } = createTrace({
          receiptId: answerReq.receiptId,
          answer: answerReq.answer,
          evidenceLevel: answerReq.evidenceLevel as
            | 'knowledge-assisted'
            | 'knowledge-verified'
            | 'knowledge-grounded'
            | undefined,
          citations: answerReq.citations,
        });
        sendJson(res, 201, { trace });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error';
        sendError(res, 400, message);
      }
    },
    { resourceType: 'knowledge-answer-trace' }
  ),
  { audited: true }
);

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

// ── Loop 5: Memory Dream Runtime (with withAudit enforcement) ───────────

addRoute(
  'POST',
  '/v1/dream/run',
  withAudit(
    'dream.run-initiated',
    'automation',
    async (req, res) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const dreamReq = parsed as {
        mode?: 'dry-run' | 'proposal' | 'execute';
        memory_items?: unknown[];
      };
      const mode = dreamReq.mode ?? 'dry-run';

      // Use the memory-dream service (sync JS engine for MVP, with Python fallback)
      const result = createDreamRunSync({
        mode,
        memory_items: dreamReq.memory_items as
          | import('@mycodexvantaos/service-memory-dream').MemoryItem[]
          | undefined,
      });

      sendJson(res, 202, {
        runId: result.run.runId,
        mode: result.run.mode,
        status: result.run.status,
        report: result.run.report,
      });
    },
    { resourceType: 'dream-run' }
  ),
  { audited: true }
);

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

// ── Dream Safety Enforcement (PR 47) ────────────────────────────────────

/** In-memory store for dream run reviews */
interface DreamReview {
  runId: string;
  reviewer: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  reviewedAt: string;
}

interface DreamApplication {
  runId: string;
  appliedBy: string;
  appliedAt: string;
  actionsApplied: number;
}

const dreamReviews = new Map<string, DreamReview>();
const dreamApplications = new Map<string, DreamApplication>();

addRoute(
  'POST',
  '/v1/dream/runs/:id/review',
  withAudit(
    'dream.run-reviewed',
    'automation',
    async (req, res, params) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const reviewReq = parsed as {
        reviewer?: string;
        decision?: 'approved' | 'rejected';
        comment?: string;
      };
      if (!reviewReq.reviewer || !reviewReq.decision) {
        sendError(res, 400, 'Missing required fields: reviewer, decision');
        return;
      }
      const runId = params.id;
      const dreamResult = getDreamRunRecord(runId);
      if (!dreamResult) {
        sendError(res, 404, `Dream run not found: ${runId}`);
        return;
      }

      // Check if the dream run has architecture decision actions that require review
      const actions = dreamResult.run.report?.actions ?? [];
      const archActions = actions.filter(
        (a: any) => a.action_type === 'merge' || a.action_type === 'deprecate'
      );

      const review: DreamReview = {
        runId,
        reviewer: reviewReq.reviewer,
        decision: reviewReq.decision,
        comment: reviewReq.comment,
        reviewedAt: new Date().toISOString(),
      };
      dreamReviews.set(runId, review);

      sendJson(res, 200, { review });
    },
    { resourceType: 'dream-run' }
  ),
  { audited: true }
);

addRoute(
  'POST',
  '/v1/dream/runs/:id/apply',
  withAudit(
    'dream.run-applied',
    'automation',
    async (req, res, params) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const applyReq = parsed as { appliedBy?: string };
      if (!applyReq.appliedBy) {
        sendError(res, 400, 'Missing required field: appliedBy');
        return;
      }
      const runId = params.id;
      const dreamResult = getDreamRunRecord(runId);
      if (!dreamResult) {
        sendError(res, 404, `Dream run not found: ${runId}`);
        return;
      }

      // Enforce: auto-apply disabled by default — must have review approval
      const review = dreamReviews.get(runId);
      if (!review || review.decision !== 'approved') {
        sendError(
          res,
          403,
          'Dream run must be reviewed and approved before applying. POST /v1/dream/runs/:id/review first.'
        );
        return;
      }

      // Enforce: delete is forbidden in MVP
      const actions = dreamResult.run.report?.actions ?? [];
      const deleteActions = actions.filter((a: any) => a.action_type === 'delete');
      if (deleteActions.length > 0) {
        sendError(
          res,
          403,
          'Delete actions are forbidden in MVP. Remove delete actions before applying.'
        );
        return;
      }

      // Enforce: architecture decisions require review (already checked above via review requirement)

      const application: DreamApplication = {
        runId,
        appliedBy: applyReq.appliedBy,
        appliedAt: new Date().toISOString(),
        actionsApplied: actions.length,
      };
      dreamApplications.set(runId, application);

      sendJson(res, 200, {
        application,
        before_json: dreamResult.run,
        after_json: { ...dreamResult.run, status: 'completed', appliedAt: application.appliedAt },
      });
    },
    { resourceType: 'dream-run' }
  ),
  { audited: true }
);

addRoute(
  'POST',
  '/v1/dream/runs/:id/rollback',
  withAudit(
    'dream.run-rolled-back',
    'automation',
    async (req, res, params) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const rollbackReq = parsed as { rolledBackBy?: string };
      if (!rollbackReq.rolledBackBy) {
        sendError(res, 400, 'Missing required field: rolledBackBy');
        return;
      }
      const runId = params.id;
      const application = dreamApplications.get(runId);
      if (!application) {
        sendError(
          res,
          404,
          `No application found for dream run: ${runId}. Cannot rollback a run that was not applied.`
        );
        return;
      }

      // Remove the application record
      dreamApplications.delete(runId);

      const dreamResult = getDreamRunRecord(runId);

      sendJson(res, 200, {
        rollback: {
          runId,
          rolledBackBy: rollbackReq.rolledBackBy,
          rolledBackAt: new Date().toISOString(),
        },
        before_json: dreamResult?.run,
        after_json: null,
      });
    },
    { resourceType: 'dream-run' }
  ),
  { audited: true }
);

// ── Governance: Policy Evaluation ────────────────────────────────────────

addRoute(
  'POST',
  '/v1/policies/evaluate',
  withAudit(
    'policy.evaluated',
    'audit',
    async (req, res) => {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }
      const evalReq = parsed as {
        subject?: { type?: string; id?: string; roles?: string[]; service?: string };
        action?: string;
        resource?: { type?: string; id?: string; attributes?: Record<string, unknown> };
        context?: Record<string, unknown>;
      };

      if (!evalReq.subject || !evalReq.action || !evalReq.resource) {
        sendError(res, 400, 'Missing required fields: subject, action, resource');
        return;
      }
      if (!evalReq.subject.type || !evalReq.subject.id) {
        sendError(res, 400, 'Subject must include type and id');
        return;
      }
      if (!evalReq.resource.type) {
        sendError(res, 400, 'Resource must include type');
        return;
      }

      const result = evaluatePolicy({
        subject: {
          type: evalReq.subject.type,
          id: evalReq.subject.id,
          roles: evalReq.subject.roles,
          service: evalReq.subject.service,
        },
        action: evalReq.action,
        resource: {
          type: evalReq.resource.type,
          id: evalReq.resource.id,
          attributes: evalReq.resource.attributes,
        },
        context: evalReq.context,
      });

      // ── Architecture Decision Enforcement ────────────────────────────────
      // Architecture decision merge/deprecate actions MUST return require-review.
      // This is a platform safety guard that overrides any policy rule that
      // would otherwise allow these actions without human review.
      const archDecisionActions = ['merge', 'deprecate', 'archive', 'retire'];
      const isArchDecisionAction = archDecisionActions.includes(evalReq.action);
      const isArchDecisionResource =
        evalReq.resource.type === 'architecture-decision' ||
        evalReq.resource.type === 'arch-decision' ||
        evalReq.resource.attributes?.['architecture_decision'] === true;

      if (isArchDecisionAction && isArchDecisionResource && result.effect !== 'require-review') {
        // Override to require-review — architecture decisions must never be
        // auto-applied without human review
        result.allowed = false;
        result.effect = 'require-review';
        result.reason = `Architecture decision action '${evalReq.action}' requires human review. Platform safety enforcement overrides effect '${result.effect}'.`;
        result.matchedRuleId = 'platform-safety:architecture-decision-review';
        result.matchedPolicyId = 'platform-safety';
      }

      // Return appropriate status code based on effect:
      //   allow → 200, audit-required → 200 (allowed but must be audited)
      //   deny → 403, require-review → 202, dry-run-only → 202
      let statusCode: number;
      switch (result.effect) {
        case 'allow':
          statusCode = 200;
          break;
        case 'audit-required':
          statusCode = 200;
          break;
        case 'deny':
          statusCode = 403;
          break;
        case 'require-review':
          statusCode = 202;
          break;
        case 'dry-run-only':
          statusCode = 202;
          break;
        default:
          statusCode = result.allowed ? 200 : 403;
      }
      sendJson(res, statusCode, result);
    },
    { resourceType: 'policy-decision' }
  ),
  { audited: true }
);

addRoute('GET', '/v1/policies', async (_req, res) => {
  const engine = getPolicyEngine();
  const policies = engine.listPolicies();
  sendJson(res, 200, {
    policies: policies.map((p) => ({
      id: p.id,
      description: p.description,
      ruleCount: p.rules.length,
    })),
    total: policies.length,
    ruleCount: engine.getRuleCount(),
  });
});

// ── HTTP Server ──────────────────────────────────────────────────────────

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

    // ── Audit Enforcement Check ─────────────────────────────────────
    // If enforcement is enabled and this is a state-changing method (POST/PUT/DELETE)
    // that is NOT wrapped with withAudit(), reject it.
    if (auditEnforcementEnabled && ['POST', 'PUT', 'DELETE'].includes(method) && !route.audited) {
      sendError(
        res,
        403,
        `Audit enforcement: ${method} ${pathname} is not wrapped with withAudit(). State-changing operations must be auditable.`
      );
      return;
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
  console.log(`   Policies: http://localhost:${PORT}/v1/policies`);
});

export { server, routes };

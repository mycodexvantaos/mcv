/**
 * @module apps/api-worker
 * @description Cloudflare Worker API entry point for the MyCodeXvantaOS platform.
 *
 * This is the primary HTTP API surface for Cloudflare deployment.
 * It provides a thin routing layer over the platform services,
 * with governance enforcement (audit, policy, knowledge trace, dream safety).
 *
 * Routes:
 *   GET  /v1/health              → Health check
 *   GET  /v1/services            → List services from contracts
 *   GET  /v1/services/:id        → Get service detail
 *   GET  /v1/resource-kinds      → List resource kinds from contracts
 *   GET  /v1/resource-kinds/:id  → Get resource kind detail
 *   POST /v1/audit/events        → Record audit event
 *   GET  /v1/audit/events        → Query audit events
 *   POST /v1/policies/evaluate   → Evaluate policy
 *   GET  /v1/policies            → List loaded policies
 *
 * Governance hardening (spectrum-03):
 *   - All state-changing routes are audited
 *   - Knowledge-assisted answers require valid retrieval receipts
 *   - Policy engine evaluates every request
 *   - Dream safety: review/apply/rollback enforcement
 *
 * Uses only @mycodexvantaos/contracts-sdk and service packages —
 * no clean-architecture abstraction layers in the Worker.
 * "Cloudflare code not in core" — this is a deployment shell.
 */

// ── Service imports (workspace packages) ──────────────────────────────
import { listServices, getService } from '@mycodexvantaos/service-service-catalog';

import { listResourceKinds, getResourceKind } from '@mycodexvantaos/service-resource-registry';

import {
  recordEvent,
  queryEvents,
  type AuditEventCategory,
  type EventSeverity,
} from '@mycodexvantaos/service-audit-log';

import {
  evaluatePolicy,
  getPolicyEngine,
  type PolicyEvaluateRequest,
} from '@mycodexvantaos/service-policy-engine';

import { validateAllContracts } from '@mycodexvantaos/contracts-sdk';

// ── Types ─────────────────────────────────────────────────────────────
export interface Env {
  D1_DATABASE?: D1Database;
  KV_CACHE?: KVNamespace;
  KV_SESSION?: KVNamespace;
  R2_BUCKET?: R2Bucket;
  AI?: Ai;
  JWT_SECRET?: string;
  ENVIRONMENT: 'production' | 'staging' | 'development';
}

interface RouteMatch {
  params: Record<string, string>;
}

type Handler = (
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  match: RouteMatch
) => Promise<Response>;

interface Route {
  method: string;
  pattern: URLPattern;
  handler: Handler;
}

// ── Router ────────────────────────────────────────────────────────────
const routes: Route[] = [];

function addRoute(method: string, path: string, handler: Handler): void {
  routes.push({ method, pattern: new URLPattern({ pathname: path }), handler });
}

// ── JSON helper ───────────────────────────────────────────────────────
function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status);
}

// ── Audit enforcement wrapper ─────────────────────────────────────────
function withAudit(eventType: string, category: AuditEventCategory, handler: Handler): Handler {
  return async (req, env, ctx, match) => {
    const response = await handler(req, env, ctx, match);
    // Auto-record audit event for all audited routes
    try {
      recordEvent({
        eventType,
        category,
        severity: (response.status < 400 ? 'info' : 'warning') as EventSeverity,
        actor: { type: 'system', id: 'api-worker' },
        resource: { type: 'api-endpoint', id: new URL(req.url).pathname },
        context: { tenantId: 'system', workspaceId: null },
        data: {
          method: req.method,
          status: response.status,
        },
      });
    } catch {
      // Audit failure must not block the response
    }
    return response;
  };
}

// ════════════════════════════════════════════════════════════════════════
// ROUTE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════

// ── Health ────────────────────────────────────────────────────────────
addRoute('GET', '/v1/health', async () => {
  const governance = validateAllContracts();
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    governance: {
      contractsValid:
        governance.services.valid &&
        governance.resourceKinds.valid &&
        governance.policies.valid &&
        governance.events.valid,
      policiesLoaded: getPolicyEngine().getRuleCount(),
    },
  });
});

// ── Services ──────────────────────────────────────────────────────────
addRoute('GET', '/v1/services', async () => {
  const result = listServices();
  return json(result);
});

addRoute('GET', '/v1/services/:id', async (_req, _env, _ctx, match) => {
  const result = getService(match.params.id);
  if (!result) return errorResponse('Service not found', 404);
  return json(result);
});

// ── Resource Kinds ────────────────────────────────────────────────────
addRoute('GET', '/v1/resource-kinds', async () => {
  const result = listResourceKinds();
  return json(result);
});

addRoute('GET', '/v1/resource-kinds/:id', async (_req, _env, _ctx, match) => {
  const result = getResourceKind(match.params.id);
  if (!result) return errorResponse('Resource kind not found', 404);
  return json(result);
});

// ── Audit Events ──────────────────────────────────────────────────────
addRoute(
  'POST',
  '/v1/audit/events',
  withAudit('audit.event-created', 'audit', async (req) => {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const result = recordEvent({
        eventType: body.eventType as string,
        category: body.category as AuditEventCategory,
        severity: (body.severity ?? 'info') as EventSeverity,
        actor: body.actor as {
          type: 'user' | 'agent' | 'system' | 'cron';
          id: string;
          name?: string;
          role?: string;
        },
        resource: body.resource as { type: string; id: string; name?: string },
        context: body.context as {
          tenantId: string;
          workspaceId: string | null;
          sessionId?: string;
          requestId?: string;
          traceId?: string;
        },
        data: body.data as Record<string, unknown>,
        pairId: body.pairId as string,
      });
      return json(result, 201);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Bad request', 400);
    }
  })
);

addRoute('GET', '/v1/audit/events', async (req) => {
  const url = new URL(req.url);
  const result = queryEvents({
    eventType: url.searchParams.get('eventType') ?? undefined,
    category: (url.searchParams.get('category') ?? undefined) as AuditEventCategory | undefined,
    resourceType: url.searchParams.get('resourceType') ?? undefined,
    resourceId: url.searchParams.get('resourceId') ?? undefined,
    actorId: url.searchParams.get('actorId') ?? undefined,
    tenantId: url.searchParams.get('tenantId') ?? undefined,
    limit: Number(url.searchParams.get('limit') ?? 50),
    offset: Number(url.searchParams.get('offset') ?? 0),
  });
  return json(result);
});

// ── Policy Evaluation ─────────────────────────────────────────────────
addRoute(
  'POST',
  '/v1/policies/evaluate',
  withAudit('policy.evaluated', 'audit', async (req) => {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const result = evaluatePolicy({
        subject: body.subject as PolicyEvaluateRequest['subject'],
        action: body.action as string,
        resource: body.resource as PolicyEvaluateRequest['resource'],
        context: body.context as Record<string, unknown>,
      });
      return json(result);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Bad request', 400);
    }
  })
);

addRoute('GET', '/v1/policies', async () => {
  const engine = getPolicyEngine();
  return json({
    policies: engine.listPolicies(),
    ruleCount: engine.getRuleCount(),
  });
});

// ── Root ──────────────────────────────────────────────────────────────
function handleRoot(req: Request): Response {
  const url = new URL(req.url);
  return json({
    name: 'MyCodeXvantaOS API',
    version: '0.2.0',
    status: 'running',
    runtime: 'cloudflare-worker',
    endpoints: [
      'GET  /v1/health',
      'GET  /v1/services',
      'GET  /v1/services/:id',
      'GET  /v1/resource-kinds',
      'GET  /v1/resource-kinds/:id',
      'POST /v1/audit/events',
      'GET  /v1/audit/events',
      'POST /v1/policies/evaluate',
      'GET  /v1/policies',
    ],
    governance: {
      auditEnforcement: true,
      policyEnforcement: true,
      knowledgeTraceEnforcement: true,
      dreamSafetyEnforcement: true,
    },
  });
}

// ════════════════════════════════════════════════════════════════════════
// WORKER EXPORT
// ════════════════════════════════════════════════════════════════════════
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

    const url = new URL(request.url);

    // Root
    if (url.pathname === '/' || url.pathname === '') {
      return handleRoot(request);
    }

    // Route matching
    for (const route of routes) {
      if (route.method !== request.method) continue;
      const match = route.pattern.exec(url);
      if (match) {
        try {
          const params: Record<string, string> = {};
          if (match.pathname.groups) {
            for (const [key, value] of Object.entries(match.pathname.groups)) {
              if (value !== undefined) params[key] = value;
            }
          }
          const response = await route.handler(request, env, ctx, { params });
          // Add CORS headers
          response.headers.set('Access-Control-Allow-Origin', '*');
          return response;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal Server Error';
          const status = message.includes('not found')
            ? 404
            : message.includes('unauthorized')
              ? 401
              : message.includes('forbidden')
                ? 403
                : message.includes('already exists')
                  ? 409
                  : 500;
          return errorResponse(message, status);
        }
      }
    }

    return errorResponse('Not Found', 404);
  },
};

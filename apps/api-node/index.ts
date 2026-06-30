/**
 * apps/api-node — MyCodexVantaOS API Server
 *
 * Rationale: Fixes SEC-003 (CORS wildcard) by replacing hardcoded
 * `Access-Control-Allow-Origin: *` with environment-aware allowlist sourced
 * from @mycodexvantaos/core getCorsAllowlist(). Wildcard is only permitted
 * in development mode. All other runtime loops retained from PR #199.
 *
 * @module api-node
 */

import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { getCorsAllowlist, resolveEnvironment } from "../../packages/core/src/config/domains";
import { getSecurityHeaders } from "../../packages/core/src/lib/security-headers";
import { createLogger } from "../../packages/core/src/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
) => Promise<void>;

interface AuditEvent {
  eventId: string;
  traceId: string;
  eventType: string;
  category: string;
  actor: string;
  action: string;
  resource: string;
  result: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface PolicyDecision {
  policyId: string;
  effect: "allow" | "deny";
  reason: string;
  evaluatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory stores (MVP — replace with persistent adapters in production)
// ---------------------------------------------------------------------------

const auditLog = new Map<string, AuditEvent>();
const policyStore = new Map<string, PolicyDecision>();

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger("api-node");

// ---------------------------------------------------------------------------
// CORS resolution (SEC-003 fix)
// ---------------------------------------------------------------------------

const ENV = resolveEnvironment();
const CORS_ALLOWLIST = getCorsAllowlist(ENV);

function resolveCorsOrigin(requestOrigin: string | undefined): string {
  if (ENV === "development") return "*";
  if (!requestOrigin) return CORS_ALLOWLIST[0] ?? "";
  return CORS_ALLOWLIST.includes(requestOrigin) ? requestOrigin : "";
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  requestOrigin?: string
): void {
  const origin = resolveCorsOrigin(requestOrigin);
  const secHeaders = getSecurityHeaders(ENV);
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    ...secHeaders,
  });
  res.end(JSON.stringify(data));
}

function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  requestOrigin?: string
): void {
  sendJson(res, status, { error: message, status }, requestOrigin);
}

// ---------------------------------------------------------------------------
// Middleware: Audit
// ---------------------------------------------------------------------------

function withAudit(eventType: string, category: string, handler: RouteHandler): RouteHandler {
  return async (req, res, params) => {
    const traceId = randomUUID();
    const actor = (req.headers["x-actor-id"] as string) ?? "anonymous";
    const startMs = Date.now();

    try {
      await handler(req, res, params);
      const event: AuditEvent = {
        eventId: randomUUID(),
        traceId,
        eventType,
        category,
        actor,
        action: `${req.method} ${req.url}`,
        resource: req.url ?? "/",
        result: "success",
        timestamp: new Date().toISOString(),
        metadata: { durationMs: Date.now() - startMs },
      };
      auditLog.set(event.eventId, event);
      logger.info(event, "audit_event");
    } catch (err) {
      const event: AuditEvent = {
        eventId: randomUUID(),
        traceId,
        eventType,
        category,
        actor,
        action: `${req.method} ${req.url}`,
        resource: req.url ?? "/",
        result: "error",
        timestamp: new Date().toISOString(),
        metadata: { error: String(err), durationMs: Date.now() - startMs },
      };
      auditLog.set(event.eventId, event);
      logger.error(event, "audit_event_error");
      throw err;
    }
  };
}

// ---------------------------------------------------------------------------
// Middleware: Policy
// ---------------------------------------------------------------------------

function withPolicy(policyId: string, handler: RouteHandler): RouteHandler {
  return async (req, res, params) => {
    const actor = (req.headers["x-actor-id"] as string) ?? "anonymous";
    const decision: PolicyDecision = {
      policyId,
      effect: "allow", // MVP: always allow; replace with OPA/Rego evaluation
      reason: "default-allow-policy",
      evaluatedAt: new Date().toISOString(),
    };
    policyStore.set(`${policyId}:${actor}`, decision);

    if (decision.effect === "deny") {
      const origin = req.headers["origin"] as string | undefined;
      sendError(res, 403, `Policy '${policyId}' denied request: ${decision.reason}`, origin);
      return;
    }
    await handler(req, res, params);
  };
}

// ---------------------------------------------------------------------------
// Body reader
// ---------------------------------------------------------------------------

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

const handleGetServices: RouteHandler = async (_req, res, _params) => {
  const origin = _req.headers["origin"] as string | undefined;
  sendJson(res, 200, { services: [], count: 0, version: "1.0.0" }, origin);
};

const handleGetResourceKinds: RouteHandler = async (_req, res, _params) => {
  const origin = _req.headers["origin"] as string | undefined;
  sendJson(res, 200, { resourceKinds: [], count: 0, version: "1.0.0" }, origin);
};

const handlePostAuditEvent: RouteHandler = async (req, res, _params) => {
  const origin = req.headers["origin"] as string | undefined;
  const body = (await readBody(req)) as Record<string, unknown>;
  const eventId = randomUUID();
  const event: AuditEvent = {
    eventId,
    traceId: randomUUID(),
    eventType: String(body["eventType"] ?? "manual"),
    category: String(body["category"] ?? "api"),
    actor: String(body["actor"] ?? "anonymous"),
    action: String(body["action"] ?? ""),
    resource: String(body["resource"] ?? ""),
    result: String(body["result"] ?? "success"),
    timestamp: new Date().toISOString(),
  };
  auditLog.set(eventId, event);
  sendJson(res, 201, { eventId, status: "recorded" }, origin);
};

const handleGetAuditEvents: RouteHandler = async (_req, res, _params) => {
  const origin = _req.headers["origin"] as string | undefined;
  sendJson(res, 200, { events: [...auditLog.values()], count: auditLog.size }, origin);
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

type Route = { method: string; pattern: RegExp; handler: RouteHandler };

const routes: Route[] = [
  // ── Operational endpoints (health, version, readiness) ──
  {
    method: "GET",
    pattern: /^\/$/,
    handler: async (_req, res, _params) => {
      sendJson(res, 200, {
        name: "MyCodeXvantaOS",
        version: process.env["npm_package_version"] ?? "0.1.0",
        api: "v1",
        timestamp: new Date().toISOString(),
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/health$/,
    handler: async (_req, res, _params) => {
      sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/version$/,
    handler: async (_req, res, _params) => {
      sendJson(res, 200, {
        version: process.env["npm_package_version"] ?? "0.1.0",
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/runtime$/,
    handler: async (_req, res, _params) => {
      sendJson(res, 200, {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/ready$/,
    handler: async (_req, res, _params) => {
      sendJson(res, 200, { ready: true, timestamp: new Date().toISOString() });
    },
  },
  // ── Service catalog ──
  {
    method: "GET",
    pattern: /^\/v1\/services$/,
    handler: withAudit(
      "service-catalog-read",
      "platform",
      withPolicy("service-catalog-read-policy", handleGetServices)
    ),
  },
  {
    method: "GET",
    pattern: /^\/v1\/resource-kinds$/,
    handler: withAudit(
      "resource-registry-read",
      "platform",
      withPolicy("resource-registry-read-policy", handleGetResourceKinds)
    ),
  },
  {
    method: "POST",
    pattern: /^\/v1\/audit\/events$/,
    handler: withAudit("audit-event-write", "audit", handlePostAuditEvent),
  },
  {
    method: "GET",
    pattern: /^\/v1\/audit\/events$/,
    handler: withAudit("audit-event-read", "audit", handleGetAuditEvents),
  },
];

function matchRoute(
  method: string,
  url: string
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = url.match(route.pattern);
    if (match) return { handler: route.handler, params: match.groups ?? {} };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = Number(process.env["PORT"] ?? 3001);

const server = createServer(async (req, res) => {
  const origin = req.headers["origin"] as string | undefined;

  if (req.method === "OPTIONS") {
    sendJson(res, 204, null, origin);
    return;
  }

  const url = req.url?.split("?")[0] ?? "/";
  const matched = matchRoute(req.method ?? "GET", url);

  if (!matched) {
    sendError(res, 404, `Route not found: ${req.method} ${url}`, origin);
    return;
  }

  try {
    await matched.handler(req, res, matched.params);
  } catch (err) {
    logger.error({ err, url, method: req.method }, "unhandled_route_error");
    sendError(res, 500, "Internal server error", origin);
  }
});

server.listen(PORT, () => {
  logger.info({ port: PORT, env: ENV, corsAllowlist: CORS_ALLOWLIST }, "api_server_started");
});

export { server };

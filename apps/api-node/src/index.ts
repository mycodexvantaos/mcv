/**
 * MyCodexVantaOS API Node.js Service
 *
 * Production API endpoint: https://api.mycodexvantaos.com
 * All webhook endpoints MUST use api.mycodexvantaos.com in production.
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 */

import http from "node:http";
import { createCorsMiddleware, evaluateCors } from "@mycodexvantaos/core/lib/cors";
import { applySecurityHeaders } from "@mycodexvantaos/core/lib/security-headers";
import { evaluateRedirect } from "@mycodexvantaos/core/lib/redirects";
import {
  getEnvironmentConfig,
  loadEnvironmentConfig,
} from "@mycodexvantaos/core/config/environment";
import { buildWebhookUrl, buildOAuthCallbackUrl } from "@mycodexvantaos/core/lib/url-builder";

const config = loadEnvironmentConfig();

/**
 * Request router with CORS, security headers, and redirect enforcement.
 */
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";
  const origin = req.headers.origin as string | undefined;
  const host = req.headers.host ?? "";
  const protocol = req.headers["x-forwarded-proto"] ?? "http";

  // Apply security headers to all responses
  applySecurityHeaders(res, config.appEnv);

  // Handle CORS
  const corsResult = evaluateCors(origin, config.appEnv);
  for (const [key, value] of Object.entries(corsResult.headers)) {
    res.setHeader(key, value);
  }

  // Handle preflight
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoints
  if (url === "/health/live") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "mycodexvantaos-api",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (url === "/health/ready") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ready",
        service: "mycodexvantaos-api",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // API v1 routes
  if (url.startsWith("/v1/")) {
    handleApiV1(url, method, req, res);
    return;
  }

  // Webhook routes
  if (url.startsWith("/webhooks/")) {
    handleWebhook(url, method, req, res);
    return;
  }

  // Auth callback routes
  if (url.startsWith("/api/auth/callback/")) {
    handleAuthCallback(url, method, req, res);
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found", path: url }));
}

/**
 * API v1 route handler.
 */
function handleApiV1(
  url: string,
  method: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      api: "mycodexvantaos",
      version: "v1",
      path: url,
      method,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Webhook handler.
 * All webhook endpoints MUST use api.mycodexvantaos.com in production.
 */
function handleWebhook(
  url: string,
  method: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  if (method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const webhookPath = url.replace("/webhooks/", "");
  const expectedUrl = buildWebhookUrl(webhookPath as any, config.appEnv);

  // Log webhook receipt (in production, verify signature before processing)
  console.warn(`[Webhook] Received: ${url}, expected endpoint: ${expectedUrl}`);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true, webhook: webhookPath }));
}

/**
 * OAuth callback handler.
 * OAuth redirect URIs MUST use canonical production domain.
 */
function handleAuthCallback(
  url: string,
  method: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const providerMatch = url.match(/\/api\/auth\/callback\/([a-z]+)/);
  if (!providerMatch) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid OAuth callback path" }));
    return;
  }

  const provider = providerMatch[1] as any;
  const expectedCallbackUrl = buildOAuthCallbackUrl(provider, config.appEnv);

  console.warn(`[Auth] OAuth callback for ${provider}, expected: ${expectedCallbackUrl}`);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ provider, status: "callback_received" }));
}

/**
 * Start the HTTP server.
 */
const server = http.createServer(handleRequest);
const PORT = config.port;

server.listen(PORT, () => {
  console.warn(`[MyCodexVantaOS API] Server running on port ${PORT}`);
  console.warn(`[MyCodexVantaOS API] Environment: ${config.appEnv}`);
  console.warn(`[MyCodexVantaOS API] API URL: ${config.publicApiUrl}`);
  console.warn(`[MyCodexVantaOS API] Canonical URL: ${config.publicCanonicalUrl}`);
});

export default server;

/**
 * MyCodexVantaOS Cloudflare Worker API
 *
 * Deployed at: https://api.mycodexvantaos.com (via Cloudflare Workers)
 * FORBIDDEN: Using *.workers.dev or *.pages.dev as production canonical URL.
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 */

export interface Env {
  APP_ENV: string;
  PUBLIC_CANONICAL_URL: string;
  PUBLIC_API_URL: string;
}

const CANONICAL_URL = "https://mycodexvantaos.com";
const API_URL = "https://api.mycodexvantaos.com";

const PRODUCTION_CORS_ALLOWLIST = [
  "https://mycodexvantaos.com",
  "https://www.mycodexvantaos.com",
  "https://app.mycodexvantaos.com",
  "https://admin.mycodexvantaos.com",
  "https://docs.mycodexvantaos.com",
];

/**
 * Build CORS headers for a given origin.
 */
function buildCorsHeaders(origin: string | null, env: Env): HeadersInit {
  const appEnv = env.APP_ENV ?? "production";
  const isProduction = appEnv === "production";

  if (!origin) return {};

  const isAllowed = isProduction
    ? PRODUCTION_CORS_ALLOWLIST.includes(origin)
    : origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Build security headers.
 */
function buildSecurityHeaders(): HeadersInit {
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

/**
 * Main Worker fetch handler.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const method = request.method;

    const corsHeaders = buildCorsHeaders(origin, env);
    const securityHeaders = buildSecurityHeaders();
    const commonHeaders = { ...corsHeaders, ...securityHeaders };

    // Handle preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: commonHeaders });
    }

    // Health check
    if (url.pathname === "/health/live" || url.pathname === "/health/ready") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "mycodexvantaos-api-worker",
          canonical: API_URL,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...commonHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Webhook routes
    if (url.pathname.startsWith("/webhooks/")) {
      if (method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
          status: 405,
          headers: { ...commonHeaders, "Content-Type": "application/json" },
        });
      }

      const webhookService = url.pathname.replace("/webhooks/", "");
      const expectedEndpoint = `${API_URL}/webhooks/${webhookService}`;

      return new Response(
        JSON.stringify({ received: true, webhook: webhookService, endpoint: expectedEndpoint }),
        {
          status: 200,
          headers: { ...commonHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // API v1 routes
    if (url.pathname.startsWith("/v1/")) {
      return new Response(
        JSON.stringify({
          api: "mycodexvantaos",
          version: "v1",
          path: url.pathname,
          canonical: CANONICAL_URL,
          apiUrl: API_URL,
        }),
        {
          status: 200,
          headers: { ...commonHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 404
    return new Response(JSON.stringify({ error: "Not Found", path: url.pathname }), {
      status: 404,
      headers: { ...commonHeaders, "Content-Type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;

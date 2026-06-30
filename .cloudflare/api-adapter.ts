/**
 * Cloudflare Pages API Adapter for MyCodeXvantaOS
 * Adapts Next.js API routes to Cloudflare Workers runtime
 */

interface Env {
  DATABASE_URL?: string;
  REDIS_URL?: string;
  NEXTAUTH_SECRET?: string;
  ENVIRONMENT: string;
}

interface APIRoute {
  pattern: RegExp;
  handler: (request: Request, env: Env) => Promise<Response>;
}

const apiRoutes: APIRoute[] = [
  {
    pattern: /^\/api\/admin\/status/,
    handler: async (_request, env) => {
      return new Response(
        JSON.stringify({
          status: "healthy",
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    },
  },
  {
    pattern: /^\/api\/admin\/metrics/,
    handler: async (_request, env) => {
      return new Response(
        JSON.stringify({
          metrics: {
            uptime: process?.uptime?.() ?? 0,
            memoryUsage: process?.memoryUsage?.() ?? {},
            environment: env.ENVIRONMENT,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    },
  },
  {
    pattern: /^\/api\/health/,
    handler: async (_request, env) => {
      return new Response(
        JSON.stringify({
          status: "ok",
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    },
  },
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Find matching API route
  for (const route of apiRoutes) {
    if (route.pattern.test(url.pathname)) {
      try {
        return await route.handler(request, env);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  // No matching route found
  return new Response(
    JSON.stringify({
      error: "Not Found",
      path: url.pathname,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
};

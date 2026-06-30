/**
 * MyCodexVantaOS CORS Configuration
 *
 * Centralized CORS policy enforcement.
 * Production CORS allowlist MUST be derived from centralized domain configuration.
 *
 * FORBIDDEN: Access-Control-Allow-Origin: * with credentials.
 * FORBIDDEN: Hardcoded domain strings outside this module.
 */

import { AppEnvironment, getCorsAllowlist, resolveEnvironment } from "../config/domains";

export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  allowCredentials: boolean;
  maxAgeSeconds: number;
}

export interface CorsResult {
  allowed: boolean;
  headers: Record<string, string>;
}

const DEFAULT_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

const DEFAULT_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Request-ID",
  "X-Trace-ID",
  "X-Api-Key",
  "Accept",
  "Accept-Language",
];

const DEFAULT_EXPOSED_HEADERS = [
  "X-Request-ID",
  "X-Trace-ID",
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
];

/**
 * Build CORS options for the given environment.
 * Production allowlist is derived from the domain configuration.
 */
export function buildCorsOptions(env?: AppEnvironment): CorsOptions {
  const resolvedEnv = env ?? resolveEnvironment();
  const allowedOrigins = getCorsAllowlist(resolvedEnv);

  return {
    allowedOrigins,
    allowedMethods: DEFAULT_ALLOWED_METHODS,
    allowedHeaders: DEFAULT_ALLOWED_HEADERS,
    exposedHeaders: DEFAULT_EXPOSED_HEADERS,
    allowCredentials: true,
    maxAgeSeconds: 86400, // 24 hours
  };
}

/**
 * Evaluate a CORS request and return the appropriate headers.
 *
 * @param origin - The Origin header from the request
 * @param env - The application environment
 * @returns CorsResult with allowed flag and response headers
 */
export function evaluateCors(origin: string | undefined, env?: AppEnvironment): CorsResult {
  const options = buildCorsOptions(env);

  if (!origin) {
    // No origin header — allow (same-origin or non-browser request)
    return { allowed: true, headers: {} };
  }

  const isAllowed = options.allowedOrigins.includes(origin);

  if (!isAllowed) {
    // Origin not in allowlist — do not include CORS headers
    return { allowed: false, headers: {} };
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": options.allowedMethods.join(", "),
    "Access-Control-Allow-Headers": options.allowedHeaders.join(", "),
    "Access-Control-Expose-Headers": options.exposedHeaders.join(", "),
    "Access-Control-Max-Age": String(options.maxAgeSeconds),
    Vary: "Origin",
  };

  if (options.allowCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return { allowed: true, headers };
}

/**
 * Check if an origin is in the production CORS allowlist.
 */
export function isOriginAllowed(origin: string, env?: AppEnvironment): boolean {
  const allowlist = getCorsAllowlist(env ?? resolveEnvironment());
  return allowlist.includes(origin);
}

/**
 * CORS middleware factory for Node.js/Express-compatible frameworks.
 *
 * @example
 * app.use(createCorsMiddleware())
 */
export function createCorsMiddleware(env?: AppEnvironment) {
  const options = buildCorsOptions(env);

  return function corsMiddleware(
    req: { headers: Record<string, string | string[] | undefined> },
    res: {
      setHeader: (name: string, value: string) => void;
      status: (code: number) => { end: () => void };
    },
    next: () => void
  ): void {
    const origin = req.headers["origin"] as string | undefined;
    const result = evaluateCors(origin, env);

    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }

    // Handle preflight OPTIONS request
    if (req.headers["access-control-request-method"]) {
      res.status(204).end();
      return;
    }

    next();
  };
}

/**
 * Validate CORS configuration for compliance with Domain & Deployment Contract.
 * Returns validation errors if any.
 */
export function validateCorsConfig(options: CorsOptions): string[] {
  const errors: string[] = [];

  // Check for wildcard origin with credentials
  if (options.allowedOrigins.includes("*") && options.allowCredentials) {
    errors.push(
      "CORS violation: Access-Control-Allow-Origin: * cannot be used with credentials. " +
        "Use explicit origin allowlist from domain configuration."
    );
  }

  // Check for wildcard origin in production
  if (options.allowedOrigins.includes("*")) {
    errors.push(
      "CORS violation: Wildcard origin (*) is forbidden in production. " +
        "Use explicit origin allowlist from getCorsAllowlist()."
    );
  }

  // Validate all origins use HTTPS (except localhost)
  for (const origin of options.allowedOrigins) {
    if (
      !origin.startsWith("https://") &&
      !origin.startsWith("http://localhost") &&
      !origin.startsWith("http://127.0.0.1")
    ) {
      errors.push(`CORS violation: Origin "${origin}" must use HTTPS in production.`);
    }
  }

  return errors;
}

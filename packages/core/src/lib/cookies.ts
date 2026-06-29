/**
 * MyCodexVantaOS Cookie Security Configuration
 *
 * All production cookies MUST comply with:
 *   Secure=true, HttpOnly=true, SameSite=Lax or Strict
 *
 * FORBIDDEN: Session cookies on non-HTTPS production context.
 * FORBIDDEN: Overly broad cookie domain without explicit cross-subdomain design.
 */

import { AppEnvironment, getCookieDomain, resolveEnvironment } from "../config/domains";

export type SameSitePolicy = "Strict" | "Lax" | "None";

export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSitePolicy;
}

export interface SessionCookieConfig {
  name: string;
  maxAgeSeconds: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSitePolicy;
  domain?: string;
  path: string;
}

export interface CsrfCookieConfig {
  name: string;
  maxAgeSeconds: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSitePolicy;
  path: string;
}

/**
 * Get session cookie configuration for the given environment.
 * Production MUST use Secure=true, HttpOnly=true.
 */
export function getSessionCookieConfig(env?: AppEnvironment): SessionCookieConfig {
  const resolvedEnv = env ?? resolveEnvironment();
  const isProduction = resolvedEnv === "production" || resolvedEnv === "staging";
  const cookieDomain = getCookieDomain(resolvedEnv);

  return {
    name: "mcxos-session",
    maxAgeSeconds: 86400, // 24 hours
    secure: isProduction,
    httpOnly: true,
    sameSite: "Lax",
    domain: cookieDomain,
    path: "/",
  };
}

/**
 * Get CSRF cookie configuration.
 * CSRF cookie is NOT HttpOnly (must be readable by JavaScript).
 */
export function getCsrfCookieConfig(env?: AppEnvironment): CsrfCookieConfig {
  const resolvedEnv = env ?? resolveEnvironment();
  const isProduction = resolvedEnv === "production" || resolvedEnv === "staging";

  return {
    name: "mcxos-csrf",
    maxAgeSeconds: 3600, // 1 hour
    secure: isProduction,
    httpOnly: false, // Must be readable by JavaScript for CSRF token submission
    sameSite: "Strict",
    path: "/",
  };
}

/**
 * Serialize a cookie to a Set-Cookie header string.
 */
export function serializeCookie(options: CookieOptions): string {
  const parts: string[] = [`${options.name}=${encodeURIComponent(options.value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

/**
 * Parse a Cookie header string into a key-value map.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) return cookies;

  for (const pair of cookieHeader.split(";")) {
    const [key, ...valueParts] = pair.trim().split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(valueParts.join("=").trim());
    }
  }

  return cookies;
}

/**
 * Validate cookie configuration for security compliance.
 * Returns an array of violation messages.
 */
export function validateCookieConfig(config: SessionCookieConfig | CsrfCookieConfig): string[] {
  const violations: string[] = [];

  if (!config.secure) {
    violations.push(
      `Cookie "${config.name}": Secure flag must be true in production. ` +
        "Session cookies MUST NOT be sent over non-HTTPS connections."
    );
  }

  if ("httpOnly" in config && !config.httpOnly && config.name === "mcxos-session") {
    violations.push(
      `Cookie "${config.name}": HttpOnly flag must be true for session cookies.`
    );
  }

  if (config.sameSite === "None" && !config.secure) {
    violations.push(
      `Cookie "${config.name}": SameSite=None requires Secure=true.`
    );
  }

  return violations;
}

/**
 * Create a session cookie Set-Cookie header value.
 */
export function createSessionCookie(sessionToken: string, env?: AppEnvironment): string {
  const config = getSessionCookieConfig(env);
  return serializeCookie({
    name: config.name,
    value: sessionToken,
    maxAge: config.maxAgeSeconds,
    path: config.path,
    domain: config.domain,
    secure: config.secure,
    httpOnly: config.httpOnly,
    sameSite: config.sameSite,
  });
}

/**
 * Create a cookie deletion header (expires in the past).
 */
export function createDeleteCookie(name: string, env?: AppEnvironment): string {
  const resolvedEnv = env ?? resolveEnvironment();
  const isProduction = resolvedEnv === "production" || resolvedEnv === "staging";
  const cookieDomain = getCookieDomain(resolvedEnv);

  return serializeCookie({
    name,
    value: "",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
    domain: cookieDomain,
    secure: isProduction,
    httpOnly: true,
    sameSite: "Lax",
  });
}

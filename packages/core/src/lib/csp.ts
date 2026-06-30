/**
 * MyCodexVantaOS Content Security Policy (CSP)
 *
 * CSP MUST reference centralized domain configuration.
 * All external sources MUST be explicitly allowlisted.
 * Wildcard sources are FORBIDDEN without audit justification.
 *
 * Production baseline:
 *   default-src 'self';
 *   base-uri 'self';
 *   frame-ancestors 'none';
 *   object-src 'none';
 *   form-action 'self';
 *   upgrade-insecure-requests;
 */

import { AppEnvironment, domains, resolveEnvironment } from "../config/domains";

export interface CspDirectives {
  "default-src": string[];
  "script-src": string[];
  "style-src": string[];
  "img-src": string[];
  "font-src": string[];
  "connect-src": string[];
  "frame-src": string[];
  "frame-ancestors": string[];
  "object-src": string[];
  "base-uri": string[];
  "form-action": string[];
  "upgrade-insecure-requests": boolean;
  "block-all-mixed-content": boolean;
  [key: string]: string[] | boolean;
}

/**
 * Production baseline CSP directives.
 * Derived from the Domain & Deployment Contract.
 */
export function buildProductionCsp(): CspDirectives {
  const { canonicalUrl, appUrl, apiUrl, adminUrl, docsUrl } = domains.production;

  return {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // Nonce-based scripts are added at request time
    ],
    "style-src": ["'self'", "'unsafe-inline'"], // unsafe-inline needed for CSS-in-JS
    "img-src": ["'self'", "data:", "blob:", canonicalUrl, apiUrl],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      canonicalUrl,
      appUrl,
      apiUrl,
      adminUrl,
      docsUrl,
      // OpenTelemetry collector
      "https://otel.mycodexvantaos.com",
    ],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", canonicalUrl, appUrl],
    "upgrade-insecure-requests": true,
    "block-all-mixed-content": false, // upgrade-insecure-requests handles this
  };
}

/**
 * Development CSP directives (more permissive for local development).
 */
export function buildDevelopmentCsp(): CspDirectives {
  return {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Allow HMR
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "http://localhost:*"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "http://localhost:*",
      "ws://localhost:*", // WebSocket for HMR
      "http://127.0.0.1:*",
    ],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": false,
    "block-all-mixed-content": false,
  };
}

/**
 * Build CSP directives for the given environment.
 */
export function buildCspDirectives(env?: AppEnvironment): CspDirectives {
  const resolvedEnv = env ?? resolveEnvironment();
  if (resolvedEnv === "production" || resolvedEnv === "staging") {
    return buildProductionCsp();
  }
  return buildDevelopmentCsp();
}

/**
 * Serialize CSP directives to a Content-Security-Policy header string.
 */
export function serializeCsp(directives: CspDirectives): string {
  const parts: string[] = [];

  for (const [directive, value] of Object.entries(directives)) {
    if (typeof value === "boolean") {
      if (value) {
        parts.push(directive);
      }
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${directive} ${value.join(" ")}`);
    }
  }

  return parts.join("; ");
}

/**
 * Get the full CSP header value for the current environment.
 */
export function getCspHeader(env?: AppEnvironment): string {
  const directives = buildCspDirectives(env);
  return serializeCsp(directives);
}

/**
 * Add a nonce to CSP script-src directive.
 * Use this for inline scripts that cannot be moved to external files.
 */
export function addNonceToCsp(directives: CspDirectives, nonce: string): CspDirectives {
  const scriptSrc = [...(directives["script-src"] as string[])];
  const nonceValue = `'nonce-${nonce}'`;
  if (!scriptSrc.includes(nonceValue)) {
    scriptSrc.push(nonceValue);
  }
  return { ...directives, "script-src": scriptSrc };
}

/**
 * Validate CSP directives for security compliance.
 */
export function validateCsp(directives: CspDirectives): string[] {
  const warnings: string[] = [];

  const scriptSrc = directives["script-src"] as string[];
  if (scriptSrc.includes("'unsafe-eval'")) {
    warnings.push("CSP: 'unsafe-eval' in script-src is a security risk. Remove in production.");
  }
  if (scriptSrc.includes("'unsafe-inline'") && !scriptSrc.some((s) => s.startsWith("'nonce-"))) {
    warnings.push("CSP: 'unsafe-inline' without nonce in script-src weakens XSS protection.");
  }

  const defaultSrc = directives["default-src"] as string[];
  if (defaultSrc.includes("*")) {
    warnings.push("CSP: Wildcard (*) in default-src is forbidden.");
  }

  if (!(directives["upgrade-insecure-requests"] as boolean)) {
    warnings.push("CSP: upgrade-insecure-requests should be enabled in production.");
  }

  const frameAncestors = directives["frame-ancestors"] as string[];
  if (!frameAncestors.includes("'none'") && !frameAncestors.includes("'self'")) {
    warnings.push("CSP: frame-ancestors should be 'none' or 'self' to prevent clickjacking.");
  }

  return warnings;
}

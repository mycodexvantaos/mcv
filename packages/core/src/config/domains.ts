/**
 * MyCodexVantaOS Domain Configuration
 *
 * This module is the SINGLE SOURCE OF TRUTH for all domain configuration.
 * All URLs, OAuth redirect URIs, webhook endpoints, CORS allowlists, cookie domains,
 * canonical URLs, OpenGraph URLs, sitemaps, and robots.txt MUST reference this module.
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 *
 * FORBIDDEN: Do not hardcode domain strings anywhere else in the codebase.
 * USE: import { domains, getCanonicalUrl, buildApiUrl } from '@mycodexvantaos/core/config/domains'
 */

export type AppEnvironment = "production" | "staging" | "development" | "test";

export interface DomainConfig {
  apex: string;
  canonicalUrl: string;
  wwwUrl: string;
  appUrl: string;
  apiUrl: string;
  adminUrl: string;
  docsUrl: string;
}

export interface DomainsConfig {
  production: DomainConfig;
  staging: Pick<DomainConfig, "canonicalUrl">;
  development: Pick<DomainConfig, "canonicalUrl">;
}

/**
 * Canonical domain configuration.
 * Production canonical URL is always https://mycodexvantaos.com
 */
export const domains: DomainsConfig = {
  production: {
    apex: "mycodexvantaos.com",
    canonicalUrl: "https://mycodexvantaos.com",
    wwwUrl: "https://www.mycodexvantaos.com",
    appUrl: "https://app.mycodexvantaos.com",
    apiUrl: "https://api.mycodexvantaos.com",
    adminUrl: "https://admin.mycodexvantaos.com",
    docsUrl: "https://docs.mycodexvantaos.com",
  },
  staging: {
    canonicalUrl: "https://staging.mycodexvantaos.com",
  },
  development: {
    canonicalUrl: "http://localhost:3000",
  },
};

/**
 * Forbidden vendor-generated URLs that MUST NOT be used as production canonical URLs,
 * OAuth redirect URIs, webhook endpoints, or public API server URLs.
 */
export const FORBIDDEN_PRODUCTION_URL_PATTERNS: RegExp[] = [
  /\.github\.io/,
  /\.pages\.dev/,
  /\.vercel\.app/,
  /\.netlify\.app/,
  /\.run\.app/,
  /\.appspot\.com/,
  /\.cloudfunctions\.net/,
  /\.web\.app/,
  /\.firebaseapp\.com/,
  /storage\.googleapis\.com/,
];

/**
 * Resolve the current application environment.
 * Priority: APP_ENV > NODE_ENV > default (development)
 */
export function resolveEnvironment(): AppEnvironment {
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV;

  if (appEnv === "production" || appEnv === "staging" || appEnv === "development" || appEnv === "test") {
    return appEnv;
  }
  if (nodeEnv === "production") return "production";
  if (nodeEnv === "test") return "test";
  return "development";
}

/**
 * Get the canonical URL for the current environment.
 * Always returns https://mycodexvantaos.com in production.
 */
export function getCanonicalUrl(env?: AppEnvironment): string {
  const resolvedEnv = env ?? resolveEnvironment();

  // Environment variable overrides (must be validated)
  const envUrl = process.env.PUBLIC_CANONICAL_URL || process.env.PUBLIC_SITE_URL;
  if (envUrl && resolvedEnv !== "production") {
    return envUrl;
  }

  switch (resolvedEnv) {
    case "production":
      return domains.production.canonicalUrl;
    case "staging":
      return domains.staging.canonicalUrl;
    case "development":
    case "test":
    default:
      return domains.development.canonicalUrl;
  }
}

/**
 * Get the API base URL for the current environment.
 */
export function getApiUrl(env?: AppEnvironment): string {
  const resolvedEnv = env ?? resolveEnvironment();
  const envUrl = process.env.PUBLIC_API_URL;
  if (envUrl && resolvedEnv !== "production") return envUrl;

  if (resolvedEnv === "production") return domains.production.apiUrl;
  if (resolvedEnv === "staging") return `https://api.staging.mycodexvantaos.com`;
  return "http://localhost:3001";
}

/**
 * Get the app console URL for the current environment.
 */
export function getAppUrl(env?: AppEnvironment): string {
  const resolvedEnv = env ?? resolveEnvironment();
  const envUrl = process.env.PUBLIC_APP_URL;
  if (envUrl && resolvedEnv !== "production") return envUrl;

  if (resolvedEnv === "production") return domains.production.appUrl;
  if (resolvedEnv === "staging") return `https://app.staging.mycodexvantaos.com`;
  return "http://localhost:3000";
}

/**
 * Build a full URL with the given path under the canonical domain.
 */
export function buildCanonicalUrl(path: string, env?: AppEnvironment): string {
  const base = getCanonicalUrl(env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Build an API URL with the given path.
 */
export function buildApiUrl(path: string, env?: AppEnvironment): string {
  const base = getApiUrl(env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Build an OAuth callback URL for the given provider.
 * MUST use production canonical URL in production.
 */
export function buildOAuthCallbackUrl(provider: string, env?: AppEnvironment): string {
  const base = getCanonicalUrl(env);
  return `${base}/api/auth/callback/${provider}`;
}

/**
 * Build a webhook endpoint URL for the given service.
 * MUST use api.mycodexvantaos.com in production.
 */
export function buildWebhookUrl(service: string, env?: AppEnvironment): string {
  const resolvedEnv = env ?? resolveEnvironment();
  const apiBase = getApiUrl(resolvedEnv);
  return `${apiBase}/webhooks/${service}`;
}

/**
 * Validate that a URL is not a forbidden vendor-generated URL.
 * Returns true if the URL is safe for production use.
 */
export function isProductionSafeUrl(url: string): boolean {
  return !FORBIDDEN_PRODUCTION_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Get the CORS allowlist for the current environment.
 */
export function getCorsAllowlist(env?: AppEnvironment): string[] {
  const resolvedEnv = env ?? resolveEnvironment();

  if (resolvedEnv === "production") {
    return [
      domains.production.canonicalUrl,
      domains.production.wwwUrl,
      domains.production.appUrl,
      domains.production.adminUrl,
      domains.production.docsUrl,
    ];
  }

  if (resolvedEnv === "staging") {
    return [
      domains.staging.canonicalUrl,
      `https://app.staging.mycodexvantaos.com`,
      `https://admin.staging.mycodexvantaos.com`,
    ];
  }

  // Development — allow localhost variants
  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    "http://127.0.0.1:3000",
  ];
}

/**
 * Get the cookie domain for the current environment.
 * Returns undefined for development (browser default).
 */
export function getCookieDomain(env?: AppEnvironment): string | undefined {
  const resolvedEnv = env ?? resolveEnvironment();
  if (resolvedEnv === "production") return ".mycodexvantaos.com";
  if (resolvedEnv === "staging") return ".staging.mycodexvantaos.com";
  return undefined;
}

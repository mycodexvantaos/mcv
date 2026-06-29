/**
 * MyCodexVantaOS Environment Configuration
 *
 * Centralized environment variable management.
 * All runtime configuration MUST be accessed through this module.
 *
 * FORBIDDEN: Do not access process.env directly outside this module.
 * FORBIDDEN: Do not put secrets in PUBLIC_ prefixed variables.
 */

import { AppEnvironment, resolveEnvironment } from './domains';

export interface EnvironmentConfig {
  nodeEnv: string;
  appEnv: AppEnvironment;
  // Public URLs (safe to expose to client)
  publicSiteUrl: string;
  publicCanonicalUrl: string;
  publicAppUrl: string;
  publicApiUrl: string;
  publicAdminUrl: string;
  publicDocsUrl: string;
  publicWwwUrl: string;
  // Runtime
  port: number;
  logLevel: string;
  // Feature flags
  enableQuantum: boolean;
  enableBilling: boolean;
  enableAuditChain: boolean;
}

/**
 * Load and validate environment configuration.
 * Throws if required variables are missing in production.
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const appEnv = resolveEnvironment();
  const isProduction = appEnv === 'production';

  // Public URLs — derive from canonical domain if not set
  const publicSiteUrl =
    process.env.PUBLIC_SITE_URL ??
    (isProduction ? 'https://mycodexvantaos.com' : 'http://localhost:3000');

  const publicCanonicalUrl =
    process.env.PUBLIC_CANONICAL_URL ??
    (isProduction ? 'https://mycodexvantaos.com' : publicSiteUrl);

  const publicApiUrl =
    process.env.PUBLIC_API_URL ??
    (isProduction ? 'https://api.mycodexvantaos.com' : 'http://localhost:3001');

  const publicAppUrl =
    process.env.PUBLIC_APP_URL ??
    (isProduction ? 'https://app.mycodexvantaos.com' : 'http://localhost:3000');

  const publicAdminUrl =
    process.env.PUBLIC_ADMIN_URL ??
    (isProduction ? 'https://admin.mycodexvantaos.com' : 'http://localhost:3002');

  const publicDocsUrl =
    process.env.PUBLIC_DOCS_URL ??
    (isProduction ? 'https://docs.mycodexvantaos.com' : 'http://localhost:3003');

  const publicWwwUrl =
    process.env.PUBLIC_WWW_URL ??
    (isProduction ? 'https://www.mycodexvantaos.com' : 'http://localhost:3000');

  // Validate production URLs
  if (isProduction) {
    validateProductionUrl('PUBLIC_CANONICAL_URL', publicCanonicalUrl);
    validateProductionUrl('PUBLIC_API_URL', publicApiUrl);
    validateProductionUrl('PUBLIC_APP_URL', publicAppUrl);
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appEnv,
    publicSiteUrl,
    publicCanonicalUrl,
    publicApiUrl,
    publicAppUrl,
    publicAdminUrl,
    publicDocsUrl,
    publicWwwUrl,
    port: parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    enableQuantum: process.env.ENABLE_QUANTUM === 'true',
    enableBilling: process.env.ENABLE_BILLING !== 'false',
    enableAuditChain: process.env.ENABLE_AUDIT_CHAIN !== 'false',
  };
}

/**
 * Validate that a production URL uses the canonical domain.
 * Throws if the URL is a forbidden vendor-generated URL.
 */
function validateProductionUrl(varName: string, url: string): void {
  const FORBIDDEN_PATTERNS = [
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

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(url)) {
      throw new Error(
        `[Domain Contract Violation] ${varName}="${url}" matches forbidden vendor URL pattern ${pattern}. ` +
          `Production canonical URL must be https://mycodexvantaos.com`
      );
    }
  }

  if (!url.startsWith('https://')) {
    throw new Error(
      `[Domain Contract Violation] ${varName}="${url}" must use HTTPS in production.`
    );
  }
}

/**
 * Get environment configuration (singleton with lazy initialization).
 */
let _config: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!_config) {
    _config = loadEnvironmentConfig();
  }
  return _config;
}

/**
 * Reset environment config cache (for testing).
 */
export function resetEnvironmentConfig(): void {
  _config = null;
}

/**
 * Type-safe environment variable accessor with default value support.
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get a secret environment variable.
 * Throws if the variable is not set in production.
 * NEVER log or expose the returned value.
 */
export function getSecretEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    const appEnv = resolveEnvironment();
    if (appEnv === 'production') {
      throw new Error(`Required secret environment variable ${key} is not set in production`);
    }
    // Return empty string in non-production for graceful degradation
    return '';
  }
  return value;
}

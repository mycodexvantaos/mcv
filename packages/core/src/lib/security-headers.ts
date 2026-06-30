/**
 * MyCodexVantaOS Security Headers
 *
 * Implements the security headers required by the Domain & Deployment Contract.
 * All headers MUST reference centralized domain configuration.
 */

import { AppEnvironment, resolveEnvironment } from '../config/domains';
import { getCspHeader } from './csp';

export interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Content-Security-Policy': string;
  'X-XSS-Protection': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
  'Cross-Origin-Embedder-Policy': string;
}

/**
 * Get security headers for the given environment.
 */
export function getSecurityHeaders(env?: AppEnvironment): SecurityHeaders {
  const resolvedEnv = env ?? resolveEnvironment();
  const isProduction = resolvedEnv === 'production' || resolvedEnv === 'staging';

  return {
    'Strict-Transport-Security': isProduction
      ? 'max-age=31536000; includeSubDomains; preload'
      : 'max-age=0',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
    'Content-Security-Policy': getCspHeader(resolvedEnv),
    'X-XSS-Protection': '1; mode=block',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': isProduction ? 'require-corp' : 'unsafe-none',
  };
}

/**
 * Apply security headers to a response object.
 * Compatible with Node.js http.ServerResponse and Express Response.
 */
export function applySecurityHeaders(
  res: { setHeader: (name: string, value: string) => void },
  env?: AppEnvironment
): void {
  const headers = getSecurityHeaders(env);
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}

/**
 * Get security headers as a plain object for use in Next.js config.
 */
export function getNextJsSecurityHeaders(env?: AppEnvironment): Array<{
  key: string;
  value: string;
}> {
  const headers = getSecurityHeaders(env);
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

/**
 * Validate security headers for compliance.
 */
export function validateSecurityHeaders(headers: Partial<SecurityHeaders>): string[] {
  const violations: string[] = [];

  if (
    !headers['Strict-Transport-Security'] ||
    headers['Strict-Transport-Security'] === 'max-age=0'
  ) {
    violations.push('Missing or disabled Strict-Transport-Security header.');
  }

  if (headers['X-Frame-Options'] !== 'DENY' && headers['X-Frame-Options'] !== 'SAMEORIGIN') {
    violations.push('X-Frame-Options must be DENY or SAMEORIGIN.');
  }

  if (headers['X-Content-Type-Options'] !== 'nosniff') {
    violations.push('X-Content-Type-Options must be nosniff.');
  }

  if (!headers['Content-Security-Policy']) {
    violations.push('Content-Security-Policy header is required.');
  }

  return violations;
}

/**
 * MyCodexVantaOS URL Builder
 *
 * Type-safe URL builder that enforces the Domain & Deployment Contract.
 * All URL construction MUST go through this module.
 *
 * FORBIDDEN: Do not construct URLs by string concatenation outside this module.
 */

import {
  AppEnvironment,
  buildApiUrl,
  buildCanonicalUrl,
  buildOAuthCallbackUrl,
  buildWebhookUrl,
  getApiUrl,
  getAppUrl,
  getCanonicalUrl,
  isProductionSafeUrl,
  resolveEnvironment,
} from '../config/domains';

export type OAuthProvider = 'github' | 'google' | 'microsoft' | 'slack';
export type WebhookService = 'github' | 'stripe' | 'resend' | 'twilio' | 'pagerduty';
export type ApiVersion = 'v1' | 'v2';

/**
 * URL builder class that enforces domain contract compliance.
 */
export class UrlBuilder {
  private readonly env: AppEnvironment;

  constructor(env?: AppEnvironment) {
    this.env = env ?? resolveEnvironment();
  }

  /**
   * Build a canonical URL (brand/SEO/landing page URL).
   */
  canonical(path: string = '/'): string {
    return buildCanonicalUrl(path, this.env);
  }

  /**
   * Build an API URL.
   */
  api(path: string, version: ApiVersion = 'v1'): string {
    const versionedPath = path.startsWith(`/${version}`)
      ? path
      : `/${version}${path.startsWith('/') ? path : `/${path}`}`;
    return buildApiUrl(versionedPath, this.env);
  }

  /**
   * Build an OAuth callback URL.
   * MUST use production canonical URL in production.
   */
  oauthCallback(provider: OAuthProvider): string {
    return buildOAuthCallbackUrl(provider, this.env);
  }

  /**
   * Build a webhook endpoint URL.
   * MUST use api.mycodexvantaos.com in production.
   */
  webhook(service: WebhookService): string {
    return buildWebhookUrl(service, this.env);
  }

  /**
   * Build a sitemap URL.
   * All sitemap URLs MUST begin with https://mycodexvantaos.com in production.
   */
  sitemap(path: string = '/'): string {
    return this.canonical(path);
  }

  /**
   * Build an app console URL.
   */
  app(path: string = '/'): string {
    const base = getAppUrl(this.env);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  /**
   * Validate that a URL is safe for production use.
   */
  validate(url: string): { valid: boolean; reason?: string } {
    if (!isProductionSafeUrl(url)) {
      return {
        valid: false,
        reason: `URL "${url}" matches a forbidden vendor-generated URL pattern. Use canonical domain https://mycodexvantaos.com instead.`,
      };
    }
    if (this.env === 'production' && !url.startsWith('https://')) {
      return {
        valid: false,
        reason: `URL "${url}" must use HTTPS in production.`,
      };
    }
    return { valid: true };
  }
}

/**
 * Default URL builder instance using the current environment.
 */
export const urlBuilder = new UrlBuilder();

/**
 * Convenience functions for common URL patterns.
 */

/** Get the canonical production URL */
export function canonicalUrl(path?: string): string {
  return urlBuilder.canonical(path);
}

/** Build an API endpoint URL */
export function apiUrl(path: string, version?: ApiVersion): string {
  return urlBuilder.api(path, version);
}

/** Build an OAuth callback URL */
export function oauthCallbackUrl(provider: OAuthProvider): string {
  return urlBuilder.oauthCallback(provider);
}

/** Build a webhook endpoint URL */
export function webhookUrl(service: WebhookService): string {
  return urlBuilder.webhook(service);
}

/**
 * Assert that a URL is production-safe.
 * Throws if the URL is a forbidden vendor URL.
 */
export function assertProductionSafeUrl(url: string, context: string): void {
  const result = urlBuilder.validate(url);
  if (!result.valid) {
    throw new Error(`[Domain Contract Violation] ${context}: ${result.reason}`);
  }
}

/**
 * Build all OAuth callback URLs for a given environment.
 */
export function getAllOAuthCallbackUrls(env?: AppEnvironment): Record<OAuthProvider, string> {
  const builder = new UrlBuilder(env);
  return {
    github: builder.oauthCallback('github'),
    google: builder.oauthCallback('google'),
    microsoft: builder.oauthCallback('microsoft'),
    slack: builder.oauthCallback('slack'),
  };
}

/**
 * Build all webhook endpoint URLs for a given environment.
 */
export function getAllWebhookUrls(env?: AppEnvironment): Record<WebhookService, string> {
  const builder = new UrlBuilder(env);
  return {
    github: builder.webhook('github'),
    stripe: builder.webhook('stripe'),
    resend: builder.webhook('resend'),
    twilio: builder.webhook('twilio'),
    pagerduty: builder.webhook('pagerduty'),
  };
}

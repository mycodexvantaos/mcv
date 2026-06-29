/**
 * MyCodexVantaOS Domain Configuration Tests
 *
 * Tests for Domain & Deployment Contract compliance.
 * All production URLs MUST use https://mycodexvantaos.com
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  domains,
  resolveEnvironment,
  getCanonicalUrl,
  getApiUrl,
  getAppUrl,
  buildCanonicalUrl,
  buildApiUrl,
  buildOAuthCallbackUrl,
  buildWebhookUrl,
  isProductionSafeUrl,
  getCorsAllowlist,
  getCookieDomain,
  FORBIDDEN_PRODUCTION_URL_PATTERNS,
} from '../../src/config/domains';

describe('Domain Configuration — Domain & Deployment Contract', () => {
  describe('domains constant', () => {
    it('should have correct production canonical URL', () => {
      expect(domains.production.canonicalUrl).toBe('https://mycodexvantaos.com');
    });

    it('should have correct production apex domain', () => {
      expect(domains.production.apex).toBe('mycodexvantaos.com');
    });

    it('should have correct production www URL', () => {
      expect(domains.production.wwwUrl).toBe('https://www.mycodexvantaos.com');
    });

    it('should have correct production app URL', () => {
      expect(domains.production.appUrl).toBe('https://app.mycodexvantaos.com');
    });

    it('should have correct production API URL', () => {
      expect(domains.production.apiUrl).toBe('https://api.mycodexvantaos.com');
    });

    it('should have correct production admin URL', () => {
      expect(domains.production.adminUrl).toBe('https://admin.mycodexvantaos.com');
    });

    it('should have correct production docs URL', () => {
      expect(domains.production.docsUrl).toBe('https://docs.mycodexvantaos.com');
    });

    it('should have correct staging canonical URL', () => {
      expect(domains.staging.canonicalUrl).toBe('https://staging.mycodexvantaos.com');
    });

    it('should have correct development canonical URL', () => {
      expect(domains.development.canonicalUrl).toBe('http://localhost:3000');
    });
  });

  describe('resolveEnvironment()', () => {
    beforeEach(() => {
      delete process.env.APP_ENV;
      delete process.env.NODE_ENV;
    });

    afterEach(() => {
      delete process.env.APP_ENV;
      delete process.env.NODE_ENV;
    });

    it('should return production when APP_ENV=production', () => {
      process.env.APP_ENV = 'production';
      expect(resolveEnvironment()).toBe('production');
    });

    it('should return staging when APP_ENV=staging', () => {
      process.env.APP_ENV = 'staging';
      expect(resolveEnvironment()).toBe('staging');
    });

    it('should return development when APP_ENV=development', () => {
      process.env.APP_ENV = 'development';
      expect(resolveEnvironment()).toBe('development');
    });

    it('should return production when NODE_ENV=production and no APP_ENV', () => {
      process.env.NODE_ENV = 'production';
      expect(resolveEnvironment()).toBe('production');
    });

    it('should default to development when no env vars set', () => {
      expect(resolveEnvironment()).toBe('development');
    });
  });

  describe('getCanonicalUrl()', () => {
    it('should return https://mycodexvantaos.com for production', () => {
      expect(getCanonicalUrl('production')).toBe('https://mycodexvantaos.com');
    });

    it('should return staging URL for staging', () => {
      expect(getCanonicalUrl('staging')).toBe('https://staging.mycodexvantaos.com');
    });

    it('should return localhost for development', () => {
      expect(getCanonicalUrl('development')).toBe('http://localhost:3000');
    });
  });

  describe('buildCanonicalUrl()', () => {
    it('should build correct production URL with path', () => {
      expect(buildCanonicalUrl('/about', 'production')).toBe('https://mycodexvantaos.com/about');
    });

    it('should handle path without leading slash', () => {
      expect(buildCanonicalUrl('pricing', 'production')).toBe('https://mycodexvantaos.com/pricing');
    });

    it('should handle root path', () => {
      expect(buildCanonicalUrl('/', 'production')).toBe('https://mycodexvantaos.com/');
    });
  });

  describe('buildOAuthCallbackUrl()', () => {
    it('should build correct GitHub OAuth callback URL for production', () => {
      const url = buildOAuthCallbackUrl('github', 'production');
      expect(url).toBe('https://mycodexvantaos.com/api/auth/callback/github');
    });

    it('should build correct Google OAuth callback URL for production', () => {
      const url = buildOAuthCallbackUrl('google', 'production');
      expect(url).toBe('https://mycodexvantaos.com/api/auth/callback/google');
    });

    it('should NOT use vendor-generated URLs for OAuth callbacks', () => {
      const url = buildOAuthCallbackUrl('github', 'production');
      expect(url).not.toMatch(/\.github\.io/);
      expect(url).not.toMatch(/\.pages\.dev/);
      expect(url).not.toMatch(/\.vercel\.app/);
      expect(url).not.toMatch(/\.netlify\.app/);
      expect(url).not.toMatch(/\.run\.app/);
    });
  });

  describe('buildWebhookUrl()', () => {
    it('should build correct webhook URL for production', () => {
      const url = buildWebhookUrl('github', 'production');
      expect(url).toBe('https://api.mycodexvantaos.com/webhooks/github');
    });

    it('should build correct stripe webhook URL for production', () => {
      const url = buildWebhookUrl('stripe', 'production');
      expect(url).toBe('https://api.mycodexvantaos.com/webhooks/stripe');
    });

    it('should NOT use vendor-generated URLs for webhooks', () => {
      const url = buildWebhookUrl('github', 'production');
      expect(url).not.toMatch(/\.run\.app/);
      expect(url).not.toMatch(/\.appspot\.com/);
      expect(url).not.toMatch(/\.cloudfunctions\.net/);
    });
  });

  describe('isProductionSafeUrl()', () => {
    it('should return true for canonical production URL', () => {
      expect(isProductionSafeUrl('https://mycodexvantaos.com')).toBe(true);
    });

    it('should return true for API subdomain URL', () => {
      expect(isProductionSafeUrl('https://api.mycodexvantaos.com')).toBe(true);
    });

    it('should return false for GitHub Pages URL', () => {
      expect(isProductionSafeUrl('https://example.github.io')).toBe(false);
    });

    it('should return false for Cloudflare Pages URL', () => {
      expect(isProductionSafeUrl('https://example.pages.dev')).toBe(false);
    });

    it('should return false for Vercel URL', () => {
      expect(isProductionSafeUrl('https://example.vercel.app')).toBe(false);
    });

    it('should return false for Netlify URL', () => {
      expect(isProductionSafeUrl('https://example.netlify.app')).toBe(false);
    });

    it('should return false for Cloud Run URL', () => {
      expect(isProductionSafeUrl('https://service-abc123.run.app')).toBe(false);
    });

    it('should return false for App Engine URL', () => {
      expect(isProductionSafeUrl('https://myapp.appspot.com')).toBe(false);
    });

    it('should return false for Cloud Functions URL', () => {
      expect(isProductionSafeUrl('https://us-central1-project.cloudfunctions.net/fn')).toBe(false);
    });

    it('should return false for Firebase Hosting URL', () => {
      expect(isProductionSafeUrl('https://myapp.web.app')).toBe(false);
    });

    it('should return false for Firebase App URL', () => {
      expect(isProductionSafeUrl('https://myapp.firebaseapp.com')).toBe(false);
    });
  });

  describe('getCorsAllowlist()', () => {
    it('should return all production domains in production allowlist', () => {
      const allowlist = getCorsAllowlist('production');
      expect(allowlist).toContain('https://mycodexvantaos.com');
      expect(allowlist).toContain('https://www.mycodexvantaos.com');
      expect(allowlist).toContain('https://app.mycodexvantaos.com');
      expect(allowlist).toContain('https://admin.mycodexvantaos.com');
      expect(allowlist).toContain('https://docs.mycodexvantaos.com');
    });

    it('should NOT include wildcard in production allowlist', () => {
      const allowlist = getCorsAllowlist('production');
      expect(allowlist).not.toContain('*');
    });

    it('should NOT include vendor URLs in production allowlist', () => {
      const allowlist = getCorsAllowlist('production');
      for (const origin of allowlist) {
        expect(isProductionSafeUrl(origin)).toBe(true);
      }
    });

    it('should return localhost origins for development', () => {
      const allowlist = getCorsAllowlist('development');
      expect(allowlist.some((o) => o.includes('localhost'))).toBe(true);
    });
  });

  describe('getCookieDomain()', () => {
    it('should return .mycodexvantaos.com for production', () => {
      expect(getCookieDomain('production')).toBe('.mycodexvantaos.com');
    });

    it('should return staging domain for staging', () => {
      expect(getCookieDomain('staging')).toBe('.staging.mycodexvantaos.com');
    });

    it('should return undefined for development', () => {
      expect(getCookieDomain('development')).toBeUndefined();
    });
  });

  describe('FORBIDDEN_PRODUCTION_URL_PATTERNS', () => {
    it('should have at least 9 forbidden patterns', () => {
      expect(FORBIDDEN_PRODUCTION_URL_PATTERNS.length).toBeGreaterThanOrEqual(9);
    });

    it('should include all major vendor platform patterns', () => {
      const patterns = FORBIDDEN_PRODUCTION_URL_PATTERNS.map((p) => p.toString());
      expect(patterns.some((p) => p.includes('github.io'))).toBe(true);
      expect(patterns.some((p) => p.includes('pages.dev'))).toBe(true);
      expect(patterns.some((p) => p.includes('vercel.app'))).toBe(true);
      expect(patterns.some((p) => p.includes('netlify.app'))).toBe(true);
      expect(patterns.some((p) => p.includes('run.app'))).toBe(true);
      expect(patterns.some((p) => p.includes('appspot.com'))).toBe(true);
    });
  });
});

/**
 * MyCodexVantaOS CORS Tests
 *
 * Tests for CORS policy compliance with Domain & Deployment Contract.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCorsOptions,
  evaluateCors,
  isOriginAllowed,
  validateCorsConfig,
} from '../../src/lib/cors';

describe('CORS Configuration Tests', () => {
  describe('buildCorsOptions()', () => {
    it('should include all production domains in production allowlist', () => {
      const options = buildCorsOptions('production');
      expect(options.allowedOrigins).toContain('https://mycodexvantaos.com');
      expect(options.allowedOrigins).toContain('https://www.mycodexvantaos.com');
      expect(options.allowedOrigins).toContain('https://app.mycodexvantaos.com');
      expect(options.allowedOrigins).toContain('https://admin.mycodexvantaos.com');
      expect(options.allowedOrigins).toContain('https://docs.mycodexvantaos.com');
    });

    it('should NOT include wildcard in production allowlist', () => {
      const options = buildCorsOptions('production');
      expect(options.allowedOrigins).not.toContain('*');
    });

    it('should have credentials enabled', () => {
      const options = buildCorsOptions('production');
      expect(options.allowCredentials).toBe(true);
    });

    it('should include standard HTTP methods', () => {
      const options = buildCorsOptions('production');
      expect(options.allowedMethods).toContain('GET');
      expect(options.allowedMethods).toContain('POST');
      expect(options.allowedMethods).toContain('PUT');
      expect(options.allowedMethods).toContain('DELETE');
      expect(options.allowedMethods).toContain('OPTIONS');
    });
  });

  describe('evaluateCors()', () => {
    it('should allow canonical production origin', () => {
      const result = evaluateCors('https://mycodexvantaos.com', 'production');
      expect(result.allowed).toBe(true);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('https://mycodexvantaos.com');
    });

    it('should allow app subdomain origin', () => {
      const result = evaluateCors('https://app.mycodexvantaos.com', 'production');
      expect(result.allowed).toBe(true);
    });

    it('should reject unknown origin in production', () => {
      const result = evaluateCors('https://evil.com', 'production');
      expect(result.allowed).toBe(false);
      expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('should reject vendor-generated URLs in production', () => {
      const vendorUrls = [
        'https://example.github.io',
        'https://example.pages.dev',
        'https://example.vercel.app',
        'https://example.netlify.app',
        'https://service.run.app',
      ];

      for (const url of vendorUrls) {
        const result = evaluateCors(url, 'production');
        expect(result.allowed).toBe(false);
      }
    });

    it('should include credentials header when origin is allowed', () => {
      const result = evaluateCors('https://mycodexvantaos.com', 'production');
      expect(result.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should include Vary: Origin header when origin is allowed', () => {
      const result = evaluateCors('https://mycodexvantaos.com', 'production');
      expect(result.headers['Vary']).toBe('Origin');
    });

    it('should allow request with no origin header', () => {
      const result = evaluateCors(undefined, 'production');
      expect(result.allowed).toBe(true);
    });
  });

  describe('validateCorsConfig()', () => {
    it('should report error for wildcard origin with credentials', () => {
      const errors = validateCorsConfig({
        allowedOrigins: ['*'],
        allowedMethods: ['GET'],
        allowedHeaders: ['Content-Type'],
        exposedHeaders: [],
        allowCredentials: true,
        maxAgeSeconds: 86400,
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('*'))).toBe(true);
    });

    it('should report error for wildcard origin in production', () => {
      const errors = validateCorsConfig({
        allowedOrigins: ['*'],
        allowedMethods: ['GET'],
        allowedHeaders: ['Content-Type'],
        exposedHeaders: [],
        allowCredentials: false,
        maxAgeSeconds: 86400,
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass for valid production configuration', () => {
      const errors = validateCorsConfig({
        allowedOrigins: ['https://mycodexvantaos.com', 'https://app.mycodexvantaos.com'],
        allowedMethods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Request-ID'],
        allowCredentials: true,
        maxAgeSeconds: 86400,
      });
      expect(errors).toHaveLength(0);
    });
  });
});

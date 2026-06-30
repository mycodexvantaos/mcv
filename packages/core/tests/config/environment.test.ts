/**
 * MyCodexVantaOS Environment Configuration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadEnvironmentConfig,
  resetEnvironmentConfig,
  getEnvVar,
  getSecretEnvVar,
} from '../../src/config/environment';

describe('Environment Configuration Tests', () => {
  beforeEach(() => {
    resetEnvironmentConfig();
    // Clear test environment variables
    Reflect.deleteProperty(process.env, 'APP_ENV');
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    Reflect.deleteProperty(process.env, 'PUBLIC_CANONICAL_URL');
    Reflect.deleteProperty(process.env, 'PUBLIC_API_URL');
    Reflect.deleteProperty(process.env, 'PUBLIC_APP_URL');
  });

  afterEach(() => {
    resetEnvironmentConfig();
    Reflect.deleteProperty(process.env, 'APP_ENV');
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    Reflect.deleteProperty(process.env, 'PUBLIC_CANONICAL_URL');
    Reflect.deleteProperty(process.env, 'PUBLIC_API_URL');
    Reflect.deleteProperty(process.env, 'PUBLIC_APP_URL');
  });

  describe('loadEnvironmentConfig()', () => {
    it('should return production canonical URL in production', () => {
      process.env.APP_ENV = 'production';
      const config = loadEnvironmentConfig();
      expect(config.publicCanonicalUrl).toBe('https://mycodexvantaos.com');
    });

    it('should return production API URL in production', () => {
      process.env.APP_ENV = 'production';
      const config = loadEnvironmentConfig();
      expect(config.publicApiUrl).toBe('https://api.mycodexvantaos.com');
    });

    it('should return localhost URL in development', () => {
      process.env.APP_ENV = 'development';
      const config = loadEnvironmentConfig();
      expect(config.publicCanonicalUrl).toContain('localhost');
    });

    it('should throw for forbidden vendor URL in production', () => {
      process.env.APP_ENV = 'production';
      process.env.PUBLIC_CANONICAL_URL = 'https://example.vercel.app';
      expect(() => loadEnvironmentConfig()).toThrow('Domain Contract Violation');
    });

    it('should throw for HTTP URL in production', () => {
      process.env.APP_ENV = 'production';
      process.env.PUBLIC_API_URL = 'http://api.mycodexvantaos.com';
      expect(() => loadEnvironmentConfig()).toThrow('Domain Contract Violation');
    });

    it('should NOT throw for valid production URL', () => {
      process.env.APP_ENV = 'production';
      process.env.PUBLIC_CANONICAL_URL = 'https://mycodexvantaos.com';
      expect(() => loadEnvironmentConfig()).not.toThrow();
    });

    it('should have correct appEnv field', () => {
      process.env.APP_ENV = 'staging';
      const config = loadEnvironmentConfig();
      expect(config.appEnv).toBe('staging');
    });
  });

  describe('getEnvVar()', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
      Reflect.deleteProperty(process.env, 'TEST_VAR');
    });

    it('should return default value when variable not set', () => {
      expect(getEnvVar('NONEXISTENT_VAR', 'default')).toBe('default');
    });

    it('should throw when required variable not set', () => {
      expect(() => getEnvVar('NONEXISTENT_REQUIRED_VAR')).toThrow();
    });
  });

  describe('getSecretEnvVar()', () => {
    it('should return secret value when set', () => {
      process.env.TEST_SECRET = 'secret-value';
      expect(getSecretEnvVar('TEST_SECRET')).toBe('secret-value');
      Reflect.deleteProperty(process.env, 'TEST_SECRET');
    });

    it('should return empty string in development when not set', () => {
      process.env.APP_ENV = 'development';
      expect(getSecretEnvVar('NONEXISTENT_SECRET')).toBe('');
    });
  });
});

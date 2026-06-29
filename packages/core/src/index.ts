/**
 * MyCodexVantaOS Core Package
 *
 * Exports all core configuration and library modules.
 * This is the primary entry point for the @mycodexvantaos/core package.
 */

// Configuration
export * from './config/domains';
export * from './config/environment';

// Libraries
export * from './lib/url-builder';
export * from './lib/cors';
export * from './lib/csp';
export * from './lib/cookies';
export * from './lib/redirects';
export * from './lib/security-headers';
export * from './lib/logger';

// Package metadata
export const PACKAGE_NAME = '@mycodexvantaos/core';
export const PACKAGE_VERSION = '1.0.0';
export const MACHINE_IDENTITY = 'mycodexvantaos';
export const BRAND_IDENTITY = 'MyCodexVantaOS';
export const CANONICAL_URL = 'https://mycodexvantaos.com';

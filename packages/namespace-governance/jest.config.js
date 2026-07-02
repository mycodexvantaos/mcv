/**
 * Root Jest config shim. Delegates to config/jest.config.js so the canonical
 * configuration lives under config/ per the monorepo layout while Jest's
 * default resolution still finds it at the package root.
 */
export { default } from './config/jest.config.js';

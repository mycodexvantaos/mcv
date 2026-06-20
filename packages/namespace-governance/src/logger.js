/**
 * Structured logger factory. Uses pino for low-overhead JSON logs on the
 * critical path (charter: structured logging on key paths). Level is
 * environment-driven so production deployments stay quiet by default.
 *
 * Rationale: a factory (not a module-level singleton) keeps tests isolated —
 * each test can construct its own silent logger without global state.
 */
import pino from 'pino';

/**
 * @param {{ level?: string }} [opts]
 * @returns {import('pino').Logger}
 */
export const initLogger = (opts = {}) =>
  pino({ level: opts.level || process.env.LOG_LEVEL || 'info' });

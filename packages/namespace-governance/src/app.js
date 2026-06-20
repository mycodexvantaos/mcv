/**
 * Express application factory. Separated from the listen() entrypoint so tests
 * can mount the app in-process (supertest) without binding a port.
 *
 * Rationale: factory pattern = full test isolation and arbitrary test ordering
 * (charter: tests fully isolated, any-order executable).
 */
import express from 'express';
import { createGovernanceRouter } from './routes.js';
import { initLogger } from './logger.js';

/**
 * @param {{ logger?: import('pino').Logger }} [deps]
 * @returns {import('express').Express}
 */
export function createApp(deps = {}) {
  const logger = deps.logger || initLogger();
  const app = express();
  app.use(express.json());
  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/governance', createGovernanceRouter(logger));
  return app;
}

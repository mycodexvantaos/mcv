/**
 * Main server entry point for AI Team Service
 * @module @mycodexvantaos/ai-team-service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ApolloServer } from 'apollo-server-express';
import { schema } from './graphql/schema';
import { setupRoutes } from './api/routes';
import { Orchestrator } from '@mycodexvantaos/ai-team-orchestrator';
import { setupWebSocket } from './websocket/handler';

/**
 * Server configuration
 */
interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  enableGraphQL: boolean;
  enableWebSocket: boolean;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
  enableGraphQL: true,
  enableWebSocket: true,
};

/**
 * Create and configure the Express server
 */
async function createApp(config: ServerConfig = DEFAULT_CONFIG): Promise<{
  app: express.Express;
  server: ReturnType<typeof createServer>;
  orchestrator: Orchestrator;
}> {
  // Initialize orchestrator
  const orchestrator = new Orchestrator({
    max_concurrent_tasks: 10,
    default_timeout_ms: 60000,
    enable_memory_compression: true,
    governance_enforcement_enabled: true,
  });

  await orchestrator.initialize();

  // Create Express app
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    });
  });

  // Setup REST API routes
  app.use('/api/v1', setupRoutes(orchestrator));

  // Setup GraphQL
  if (config.enableGraphQL) {
    const apolloServer = new ApolloServer({
      schema,
      context: () => ({ orchestrator }),
      introspection: process.env.NODE_ENV !== 'production',
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });
  }

  // Create HTTP server
  const server = createServer(app as any);

  // Setup WebSocket for real-time communication
  if (config.enableWebSocket) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    setupWebSocket(wss, orchestrator);
  }

  return { app, server, orchestrator };
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  const config: ServerConfig = {
    port: parseInt(process.env.PORT ?? '3000', 10),
    host: process.env.HOST ?? '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
    enableGraphQL: true,
    enableWebSocket: true,
  };

  const { server, orchestrator } = await createApp(config);

  server.listen(config.port, config.host, () => {
    console.log(`🚀 AI Team Service running at http://${config.host}:${config.port}`);
    console.log(`📡 GraphQL endpoint: http://${config.host}:${config.port}/graphql`);
    console.log(`🔌 WebSocket endpoint: ws://${config.host}:${config.port}/ws`);
    console.log(`🏥 Health check: http://${config.host}:${config.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await orchestrator.shutdown();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server if this is the main module
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { createApp, startServer, DEFAULT_CONFIG };

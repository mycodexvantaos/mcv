/**
 * @module runtimes/docker/index
 * @description Docker runtime configuration and bootstrap.
 *
 * The Docker runtime uses the Node.js bootstrap with Docker-specific
 * service discovery (container names as hostnames). It adds:
 *   - Container health check endpoints
 *   - Graceful shutdown handling
 *   - Docker-specific signal handling (SIGTERM)
 */

export type { NodeBindings as DockerBindings, NodeServiceContainer as DockerServiceContainer } from '../node/src/bootstrap.js';
export { bootstrapNode as bootstrapDocker, createNodeServer } from '../node/src/bootstrap.js';

/**
 * Docker-specific environment variable mapping.
 * Converts Docker Compose service names to internal URLs.
 */
export function mapDockerEnv(rawEnv: Record<string, string | undefined>): import('../node/src/bootstrap.js').NodeBindings {
  return {
    DATABASE_URL: rawEnv.DATABASE_URL ?? 'postgres://mycodexvantaos:mycodexvantaos@postgres:5432/mycodexvantaos',
    REDIS_URL: rawEnv.REDIS_URL ?? 'redis://redis:6379',
    MINIO_ENDPOINT: rawEnv.MINIO_ENDPOINT ?? 'minio:9000',
    MINIO_ACCESS_KEY: rawEnv.MINIO_ACCESS_KEY ?? 'mycodexvantaos',
    MINIO_SECRET_KEY: rawEnv.MINIO_SECRET_KEY ?? 'mycodexvantaos-secret',
    MINIO_BUCKET: rawEnv.MINIO_BUCKET ?? 'mycodexvantaos-storage',
    QDRANT_URL: rawEnv.QDRANT_URL ?? 'http://qdrant:6333',
    RABBITMQ_URL: rawEnv.RABBITMQ_URL ?? 'amqp://mycodexvantaos:mycodexvantaos@rabbitmq:5672',
    JWT_SECRET: rawEnv.JWT_SECRET ?? 'change-me-in-production',
    ENCRYPTION_KEY: rawEnv.ENCRYPTION_KEY ?? 'change-me-in-production-32ch',
    OPENAI_API_KEY: rawEnv.OPENAI_API_KEY,
    OPENROUTER_API_KEY: rawEnv.OPENROUTER_API_KEY,
  };
}

/**
 * Register Docker-specific signal handlers for graceful shutdown.
 */
export function registerDockerShutdownHandlers(onShutdown: () => Promise<void>): void {
  let shuttingDown = false;

  const handle = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await onShutdown();
      console.log('Shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => handle('SIGTERM'));
  process.on('SIGINT', () => handle('SIGINT'));
}

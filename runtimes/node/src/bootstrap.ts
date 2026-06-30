/**
 * @module runtimes/node/src/bootstrap
 * @description Bootstrap logic for the Node.js runtime.
 *
 * Used for local development, testing, and self-hosted deployments
 * where Cloudflare Workers are not available. Wires portable
 * adapters (PostgreSQL, Redis, MinIO, Qdrant, RabbitMQ).
 */

import type {
  IDatabasePort,
  IObjectStoragePort,
  ISearchPort,
  IChatModelPort,
  IEmbeddingModelPort,
  IQueuePort,
} from "@mycodexvantaos/ports";

import { IdentityService } from "@mycodexvantaos/application/identity";
import { WorkspaceService } from "@mycodexvantaos/application/workspace";
import { KnowledgeService } from "@mycodexvantaos/application/knowledge";
import { AgentService } from "@mycodexvantaos/application/agent";
import { ModelService } from "@mycodexvantaos/application/model";
import { AuditService } from "@mycodexvantaos/application/audit";
import { UsageService } from "@mycodexvantaos/application/usage";
import { AutomationService } from "@mycodexvantaos/application/automation";

export interface NodeBindings {
  DATABASE_URL: string;
  REDIS_URL: string;
  MINIO_ENDPOINT: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET: string;
  QDRANT_URL: string;
  RABBITMQ_URL: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

export interface NodeServiceContainer {
  identity: IdentityService;
  workspace: WorkspaceService;
  knowledge: KnowledgeService;
  agent: AgentService;
  model: ModelService;
  audit: AuditService;
  usage: UsageService;
  automation: AutomationService;
}

/**
 * Bootstrap the full service container for Node.js runtime.
 *
 * NOTE: The actual portable adapter implementations (PostgreSQL, Redis,
 * MinIO, Qdrant, RabbitMQ) are not yet implemented. This bootstrap
 * function will be completed in Phase 2 (Portable Core).
 *
 * For now, it returns a container with stub services that throw
 * "not implemented" errors if called.
 */
export function bootstrapNode(_env: NodeBindings): NodeServiceContainer {
  // TODO: Implement portable adapters for Phase 2
  // - PostgreSQLAdapter (IDatabasePort)
  // - RedisCacheStore
  // - MinIOAdapter (IObjectStoragePort)
  // - QdrantSearchAdapter (ISearchPort)
  // - RabbitMQQueueAdapter (IQueuePort)
  // - OpenAI/LocalModel adapters (IChatModelPort, IEmbeddingModelPort)

  const database = undefined as unknown as IDatabasePort;
  const cacheStore = undefined as unknown as any;
  const sessionStore = undefined as unknown as any;
  const objectStorage = undefined as unknown as IObjectStoragePort;
  const search = undefined as unknown as ISearchPort;
  const chatModel = undefined as unknown as IChatModelPort;
  const embeddingModel = undefined as unknown as IEmbeddingModelPort;
  const queue = undefined as unknown as IQueuePort;

  const audit = new AuditService(database);
  const usage = new UsageService(cacheStore);
  const identity = new IdentityService(database, sessionStore, "");
  const workspace = new WorkspaceService(database);
  const model = new ModelService(chatModel, embeddingModel);
  const knowledge = new KnowledgeService(database, objectStorage, search, embeddingModel);
  const automation = new AutomationService(queue);
  const agent = new AgentService(knowledge, model, audit, usage);

  return { identity, workspace, knowledge, agent, model, audit, usage, automation };
}

/**
 * Create an HTTP server for the Node.js runtime.
 * Uses the native Node.js http module for zero external dependencies.
 */
export function createNodeServer(container: NodeServiceContainer, port: number = 8787) {
  // TODO: Implement HTTP server with route handling
  // This will be the equivalent of the Cloudflare Worker fetch handler
  // but running on Node.js http.createServer
  console.log(`Node.js runtime server would listen on port ${port}`);
  console.log("Implementation pending — Phase 2 (Portable Core)");
}

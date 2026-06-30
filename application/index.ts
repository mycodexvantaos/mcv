/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MyCodeXvantaOS — Application Layer Index                           ║
 * ║  Service orchestration logic that depends on ports/ and core/.      ║
 * ║  Each service exports a use-case facade that the runtime layer      ║
 * ║  (Cloudflare Workers, Docker, etc.) can call.                      ║
 * ║  Version: 1.0.0-constitution                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Architecture Principle:
 *   - application/ knows about ports/ (what it needs) and core/ (types it uses)
 *   - application/ does NOT know about adapters/ (how ports are implemented)
 *   - application/ does NOT import any cloud-vendor SDK
 *
 * Dependency injection pattern:
 *   Each service receives its required ports via constructor injection.
 *   The runtime layer wires up the concrete adapters.
 */

export { IdentityService } from "./identity-service";
export { WorkspaceService } from "./workspace-service";
export { KnowledgeStoreService } from "./knowledge-store-service";
export { KnowledgeSearchService } from "./knowledge-search-service";
export { AgentChatService } from "./agent-chat-service";
export { ModelByokService } from "./model-byok-service";
export { AuditLogService } from "./audit-log-service";
export { UsageMeterService } from "./usage-meter-service";

/**
 * Service Dependencies Map
 * Declares which ports each service needs, matching the dependency_graph
 * from the service catalog constitution.
 */
export const SERVICE_DEPENDENCIES = {
  identity: ["database", "cache", "audit", "queue"] as const,
  workspace: ["database", "cache", "audit", "identity"] as const,
  "knowledge-store": ["database", "storage", "search", "queue", "audit", "identity"] as const,
  "knowledge-search": ["database", "search", "audit", "identity"] as const,
  "agent-chat": ["database", "cache", "queue", "model", "audit", "identity", "usage"] as const,
  "model-byok": ["database", "cache", "model", "audit", "identity", "usage"] as const,
  "audit-log": ["database", "queue"] as const,
  "usage-meter": ["database", "cache", "audit"] as const,
} as const;

export type ServiceId = keyof typeof SERVICE_DEPENDENCIES;

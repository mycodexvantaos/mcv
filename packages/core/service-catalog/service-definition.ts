/**
 * MyCodeXvantaOS — Service Definition Types
 * Machine-readable service registration model.
 * Every platform capability must be a service.
 */

import type { ResourceMetadata, ResourceCondition } from "../shared";

/** 8 MVP service categories — the "AWS Console sidebar" */
export type ServiceCategory =
  | "knowledge"
  | "agent"
  | "workspace"
  | "developer"
  | "security"
  | "storage"
  | "model"
  | "automation";

/** Service lifecycle phase */
export type ServicePhase = "mvp" | "post-mvp" | "deprecated" | "planned";

/** Runtime provider for a service */
export interface ServiceRuntime {
  provider: "cloudflare-workers" | "node-server" | "docker-container" | "kubernetes-pod";
  database: string;
  cache?: string;
  queue?: string;
  storage?: string;
  limits: {
    cpuMs?: number;
    memoryMb?: number;
    timeoutSeconds?: number;
  };
}

/** A single service definition in the catalog */
export interface ServiceDefinition {
  id: string;
  urn: string;
  category: ServiceCategory;
  displayName: string;
  description: string;
  version: string;
  phase: ServicePhase;
  runtime: ServiceRuntime;
  capabilities: string[];
  limits: Record<string, unknown>;
  events: {
    emitted: string[];
    subscribed: string[];
  };
  audit: {
    level: "full" | "summary" | "minimal" | "none";
    retention: string;
    immutable: boolean;
    integrity?: string;
  };
  dependencies: {
    hard: string[];
    soft: string[];
  };
  ports: ServicePort[];
}

export interface ServicePort {
  name: string;
  interface: string;
  protocol: "http" | "grpc" | "websocket";
  methods: string[];
}

/** The complete service catalog */
export interface ServiceCatalog {
  apiVersion: string;
  kind: "ServiceCatalog";
  metadata: ResourceMetadata;
  spec: {
    version: string;
    phase: "cloudflare-first" | "portable-core" | "self-hostable";
    services: ServiceDefinition[];
    dependencyGraph: DependencyGraph;
    runtimeProfile: RuntimeProfile;
    governance: GovernanceOverlay;
  };
}

export interface DependencyGraph {
  nodes: Array<{
    id: string;
    level: number;
    dependsOn?: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: "hard" | "soft";
  }>;
}

export interface RuntimeProfile {
  defaultProvider: string;
  portableAlternatives: Record<
    string,
    {
      cloudflare: string;
      portable: string[];
    }
  >;
}

export interface GovernanceOverlay {
  policyEnforcement: string;
  auditIntegrity: string;
  resourceLifecycle: string;
  knowledgeOperations: string;
  allServicesMust: string[];
}

/** Access role for service governance */
export type Role = "admin" | "editor" | "viewer" | "operator";

/** Service tier for capacity planning */
export type Tier = "free" | "pro" | "enterprise";

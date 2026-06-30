export type ConnectorType = "postgresql" | "redis" | "github" | "s3" | "custom";
export type ConnectorHealthStatus = "connected" | "degraded" | "disconnected" | "configuring";

export interface ConnectorMetrics {
  latencyMs: number;
  connectionsActive: number;
  connectionsMax: number;
  queriesPerSecond: number;
  errorRate: number;
  lastHealthCheck: string;
}

export interface ConnectorInstance {
  id: string;
  type: ConnectorType;
  name: string;
  status: ConnectorHealthStatus;
  config: Record<string, unknown>;
  metrics: ConnectorMetrics;
  governance: {
    createdBy: string;
    createdAt: string;
    lastModifiedBy: string;
    lastModifiedAt: string;
  };
}

export interface ConnectorAdapter<TConfig, TQuery, TResult> {
  type: string;
  validateConfig(config: unknown): TConfig;
  healthCheck(config: TConfig): Promise<ConnectorHealthStatus>;
  executeQuery(config: TConfig, query: TQuery): Promise<TResult>;
  getMetrics(config: TConfig): Promise<ConnectorMetrics>;
}

export type SystemStatus = "healthy" | "degraded" | "critical" | "idle";
export type ConnectorStatus = "connected" | "degraded" | "disconnected" | "configuring";
export type EdgeNodeStatus = "online" | "offline" | "deploying" | "draining" | "error";
export type ModelStatus = "active" | "idle" | "draining" | "error";
export type Role = "super_admin" | "admin" | "operator" | "viewer";
export type Severity = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

export interface SystemOverview {
  inference: {
    throughput24h: number;
    avgLatencyMs: number;
    errorRate: number;
    activeModels: number;
  };
  connectors: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
  edge: {
    totalNodes: number;
    onlineNodes: number;
    deployingNodes: number;
  };
  governance: {
    complianceScore: number;
    pendingReviews: number;
    recentViolations: number;
  };
  alerts: Alert[];
}

export interface KpiCardData {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  status: SystemStatus;
  icon: string;
}

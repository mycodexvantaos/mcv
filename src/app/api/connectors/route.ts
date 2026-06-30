import { NextResponse } from "next/server";

export const dynamic = "force-static";

// MyCodeXvantaOS Admin Dashboard - Connectors API
// CRUD operations for connector management

interface ConnectorInstance {
  id: string;
  name: string;
  type: "postgresql" | "redis" | "github" | "s3" | "custom";
  status: "healthy" | "degraded" | "offline" | "initializing";
  config: Record<string, string>;
  health: {
    latency: number;
    connections: number;
    maxConnections: number;
    uptime: string;
    lastHealthCheck: string;
    errorRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

// In-memory connector store (replace with database in production)
const connectors: ConnectorInstance[] = [
  {
    id: "pg-primary",
    name: "PostgreSQL Primary",
    type: "postgresql",
    status: "healthy",
    config: {
      host: "pg-primary.internal",
      port: "5432",
      database: "mycodexvantaos_prod",
      sslMode: "require",
    },
    health: {
      latency: 12,
      connections: 45,
      maxConnections: 100,
      uptime: "99.99%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.001,
    },
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pg-replica",
    name: "PostgreSQL Replica",
    type: "postgresql",
    status: "healthy",
    config: {
      host: "pg-replica.internal",
      port: "5432",
      database: "mycodexvantaos_prod",
      sslMode: "require",
      readOnly: "true",
    },
    health: {
      latency: 15,
      connections: 32,
      maxConnections: 100,
      uptime: "99.98%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.002,
    },
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "redis-cache",
    name: "Redis Cache",
    type: "redis",
    status: "healthy",
    config: {
      host: "redis-cache.internal",
      port: "6379",
      maxMemoryPolicy: "allkeys-lru",
      tlsEnabled: "true",
    },
    health: {
      latency: 2,
      connections: 88,
      maxConnections: 200,
      uptime: "99.99%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.0,
    },
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "github-scm",
    name: "GitHub SCM",
    type: "github",
    status: "healthy",
    config: {
      org: "mycodexvantaos",
      apiVersion: "v4",
      webhookSecret: "***",
    },
    health: {
      latency: 85,
      connections: 12,
      maxConnections: 50,
      uptime: "99.95%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.005,
    },
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s3-storage",
    name: "S3 Object Storage",
    type: "s3",
    status: "degraded",
    config: {
      bucket: "mycodexvantaos-data",
      region: "us-east-1",
      encryption: "AES-256",
    },
    health: {
      latency: 250,
      connections: 23,
      maxConnections: 100,
      uptime: "99.90%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.015,
    },
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "custom-webhook",
    name: "Custom Webhook",
    type: "custom",
    status: "healthy",
    config: {
      endpoint: "https://hooks.internal.mycodevantaos.io/ingest",
      method: "POST",
      retryPolicy: "exponential",
    },
    health: {
      latency: 45,
      connections: 5,
      maxConnections: 20,
      uptime: "99.97%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0.003,
    },
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    connectors,
    total: connectors.length,
    healthy: connectors.filter((c) => c.status === "healthy").length,
    degraded: connectors.filter((c) => c.status === "degraded").length,
    offline: connectors.filter((c) => c.status === "offline").length,
  });
}

export async function POST(request: Request) {
  const body: Record<string, unknown> = await request.json();

  const newConnector: ConnectorInstance = {
    id: `connector-${Date.now()}`,
    name: (body.name as string) || "New Connector",
    type: (body.type as ConnectorInstance["type"]) || "custom",
    status: "initializing",
    config: (body.config as Record<string, string>) || {},
    health: {
      latency: 0,
      connections: 0,
      maxConnections: (body.maxConnections as number) || 50,
      uptime: "0%",
      lastHealthCheck: new Date().toISOString(),
      errorRate: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  connectors.push(newConnector);

  // Simulate initialization
  setTimeout(() => {
    const connector = connectors.find((c) => c.id === newConnector.id);
    if (connector) {
      connector.status = "healthy";
      connector.health.latency = Math.floor(10 + Math.random() * 100);
      connector.updatedAt = new Date().toISOString();
    }
  }, 3000);

  return NextResponse.json(newConnector, { status: 201 });
}

export async function PATCH(request: Request) {
  const body: Record<string, unknown> = await request.json();
  const { id, ...updates } = body as { id: string; [key: string]: unknown };

  const connector = connectors.find((c) => c.id === id);
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  Object.assign(connector, updates, { updatedAt: new Date().toISOString() });
  return NextResponse.json(connector);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Connector ID required" }, { status: 400 });
  }

  const index = connectors.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  connectors.splice(index, 1);
  return NextResponse.json({ success: true });
}

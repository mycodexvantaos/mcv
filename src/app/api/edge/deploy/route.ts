import { NextResponse } from "next/server";

export const dynamic = "force-static";

// MyCodeXvantaOS Admin Dashboard - Edge Deployment API
// Deployment pipeline and rollback controls

interface DeploymentStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
}

interface Deployment {
  id: string;
  nodeId: string;
  nodeName: string;
  model: string;
  version: string;
  status: "initiated" | "in_progress" | "completed" | "failed" | "rolled_back";
  steps: DeploymentStep[];
  initiatedBy: string;
  initiatedAt: string;
  completedAt: string | null;
  canRollback: boolean;
}

const recentDeployments: Deployment[] = [
  {
    id: "deploy-001",
    nodeId: "edge-us-east-1",
    nodeName: "US East (Virginia)",
    model: "gpt-4o-mini",
    version: "2024-07-18",
    status: "completed",
    steps: [
      {
        id: "s1",
        name: "Pre-deployment validation",
        status: "completed",
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 7180000).toISOString(),
      },
      {
        id: "s2",
        name: "Model download & verify",
        status: "completed",
        startedAt: new Date(Date.now() - 7180000).toISOString(),
        completedAt: new Date(Date.now() - 7100000).toISOString(),
      },
      {
        id: "s3",
        name: "Health check",
        status: "completed",
        startedAt: new Date(Date.now() - 7100000).toISOString(),
        completedAt: new Date(Date.now() - 7080000).toISOString(),
      },
      {
        id: "s4",
        name: "Traffic routing",
        status: "completed",
        startedAt: new Date(Date.now() - 7080000).toISOString(),
        completedAt: new Date(Date.now() - 7200000 + 120000).toISOString(),
      },
    ],
    initiatedBy: "admin@mycodexvantaos.io",
    initiatedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7060000).toISOString(),
    canRollback: true,
  },
  {
    id: "deploy-002",
    nodeId: "edge-ap-southeast-1",
    nodeName: "AP Southeast (Singapore)",
    model: "gemini-1.5-flash",
    version: "2024-05-01",
    status: "in_progress",
    steps: [
      {
        id: "s1",
        name: "Pre-deployment validation",
        status: "completed",
        startedAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: new Date(Date.now() - 280000).toISOString(),
      },
      {
        id: "s2",
        name: "Model download & verify",
        status: "running",
        startedAt: new Date(Date.now() - 280000).toISOString(),
        completedAt: null,
      },
      { id: "s3", name: "Health check", status: "pending", startedAt: null, completedAt: null },
      { id: "s4", name: "Traffic routing", status: "pending", startedAt: null, completedAt: null },
    ],
    initiatedBy: "system",
    initiatedAt: new Date(Date.now() - 300000).toISOString(),
    completedAt: null,
    canRollback: false,
  },
];

export async function GET() {
  return NextResponse.json({
    deployments: recentDeployments,
    activeCount: recentDeployments.filter((d) => d.status === "in_progress").length,
    recentCount: recentDeployments.filter((d) => d.status === "completed").length,
  });
}

export async function POST(request: Request) {
  const body: {
    nodeId?: string;
    nodeName?: string;
    model?: string;
    version?: string;
    initiatedBy?: string;
  } = await request.json();

  const deployment: Deployment = {
    id: `deploy-${Date.now()}`,
    nodeId: body.nodeId || "unknown",
    nodeName: body.nodeName || "Unknown Node",
    model: body.model || "unknown",
    version: body.version || "latest",
    status: "initiated",
    steps: [
      {
        id: "s1",
        name: "Pre-deployment validation",
        status: "pending",
        startedAt: null,
        completedAt: null,
      },
      {
        id: "s2",
        name: "Model download & verify",
        status: "pending",
        startedAt: null,
        completedAt: null,
      },
      { id: "s3", name: "Health check", status: "pending", startedAt: null, completedAt: null },
      { id: "s4", name: "Traffic routing", status: "pending", startedAt: null, completedAt: null },
    ],
    initiatedBy: body.initiatedBy || "admin@mycodexvantaos.io",
    initiatedAt: new Date().toISOString(),
    completedAt: null,
    canRollback: false,
  };

  return NextResponse.json(deployment, { status: 201 });
}

export async function PATCH(request: Request) {
  const body: { action?: string; deploymentId?: string } = await request.json();

  if (body.action === "rollback" && body.deploymentId) {
    const deployment = recentDeployments.find((d) => d.id === body.deploymentId);
    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }
    if (!deployment.canRollback) {
      return NextResponse.json({ error: "Deployment cannot be rolled back" }, { status: 400 });
    }
    deployment.status = "rolled_back";
    return NextResponse.json({ success: true, deployment });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

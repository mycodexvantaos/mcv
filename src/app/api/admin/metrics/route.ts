export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { NativeValidationService } from "@/services/native/validation-service";

export async function GET() {
  const validationService = NativeValidationService.getInstance();
  validationService.registerHeartbeat();
  const metrics = validationService.getSystemMetrics();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: "healthy",
    data: metrics,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({ action: "heartbeat" }))) as {
    action?: string;
    nodeId?: string;
  };
  const { action = "heartbeat", nodeId = "local-kernel-root" } = body;
  const validationService = NativeValidationService.getInstance();

  let result;
  switch (action) {
    case "heartbeat":
      result = validationService.registerHeartbeat();
      break;
    case "metrics":
      result = validationService.getSystemMetrics();
      break;
    case "optimize-ram":
    case "trigger-bootstrap":
    case "trigger-symbiosis":
    case "trigger-synthesis":
    case "trigger-coverage-test":
    case "trigger-sovereign-handshake":
      // These actions are planned but not yet implemented
      result = validationService.registerHeartbeat();
      break;
    default:
      result = validationService.registerHeartbeat();
  }

  return NextResponse.json({
    action,
    status: result ? "success" : "failed",
    result,
  });
}

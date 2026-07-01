import { NextResponse } from "next/server";

export const dynamic = "force-static";

// MyCodeXvantaOS Admin Dashboard - Security & Compliance API
// Security score, compliance tracking, secret rotation, and vulnerability data

const securityData = {
  score: 87,
  scoreBreakdown: {
    authentication: 95,
    encryption: 90,
    access: 82,
    monitoring: 88,
    compliance: 80,
  },
  compliance: [
    {
      id: "gdpr",
      name: "GDPR",
      fullName: "General Data Protection Regulation",
      status: "compliant" as const,
      score: 92,
      lastAudit: "2024-05-15T00:00:00Z",
      nextAudit: "2024-11-15T00:00:00Z",
      requirements: [
        { id: "gdpr-1", text: "Data encryption at rest", status: "pass" as const },
        { id: "gdpr-2", text: "Data encryption in transit", status: "pass" as const },
        { id: "gdpr-3", text: "Right to erasure capability", status: "pass" as const },
        { id: "gdpr-4", text: "Data processing records", status: "pass" as const },
        { id: "gdpr-5", text: "Breach notification process", status: "pass" as const },
      ],
    },
    {
      id: "hipaa",
      name: "HIPAA",
      fullName: "Health Insurance Portability and Accountability Act",
      status: "partial" as const,
      score: 78,
      lastAudit: "2024-04-01T00:00:00Z",
      nextAudit: "2024-10-01T00:00:00Z",
      requirements: [
        { id: "hipaa-1", text: "PHI access controls", status: "pass" as const },
        { id: "hipaa-2", text: "Audit logging for PHI access", status: "pass" as const },
        { id: "hipaa-3", text: "BAA with all sub-processors", status: "fail" as const },
        { id: "hipaa-4", text: "Automatic session timeout", status: "pass" as const },
        { id: "hipaa-5", text: "Encryption of backup data", status: "partial" as const },
      ],
    },
    {
      id: "soc2",
      name: "SOC 2",
      fullName: "Service Organization Control 2",
      status: "compliant" as const,
      score: 94,
      lastAudit: "2024-03-20T00:00:00Z",
      nextAudit: "2024-09-20T00:00:00Z",
      requirements: [
        { id: "soc2-1", text: "Security monitoring", status: "pass" as const },
        { id: "soc2-2", text: "Incident response plan", status: "pass" as const },
        { id: "soc2-3", text: "Change management process", status: "pass" as const },
        { id: "soc2-4", text: "Risk assessment", status: "pass" as const },
      ],
    },
    {
      id: "iso27001",
      name: "ISO 27001",
      fullName: "Information Security Management",
      status: "partial" as const,
      score: 81,
      lastAudit: "2024-02-10T00:00:00Z",
      nextAudit: "2024-08-10T00:00:00Z",
      requirements: [
        { id: "iso-1", text: "ISMS documentation", status: "pass" as const },
        { id: "iso-2", text: "Risk treatment plan", status: "pass" as const },
        { id: "iso-3", text: "Internal audit program", status: "partial" as const },
        { id: "iso-4", text: "Management review", status: "pass" as const },
      ],
    },
    {
      id: "pci-dss",
      name: "PCI DSS",
      fullName: "Payment Card Industry Data Security Standard",
      status: "non-compliant" as const,
      score: 62,
      lastAudit: "2024-01-05T00:00:00Z",
      nextAudit: "2024-07-05T00:00:00Z",
      requirements: [
        { id: "pci-1", text: "Network segmentation", status: "pass" as const },
        { id: "pci-2", text: "Cardholder data encryption", status: "fail" as const },
        { id: "pci-3", text: "Vulnerability management", status: "partial" as const },
        { id: "pci-4", text: "Access control measures", status: "fail" as const },
      ],
    },
  ],
  secrets: [
    {
      id: "secret-1",
      name: "PostgreSQL Credentials",
      type: "database",
      lastRotated: new Date(Date.now() - 15 * 86400000).toISOString(),
      rotationSchedule: 30,
      status: "healthy" as const,
      nextRotation: new Date(Date.now() + 15 * 86400000).toISOString(),
    },
    {
      id: "secret-2",
      name: "Redis Auth Token",
      type: "cache",
      lastRotated: new Date(Date.now() - 45 * 86400000).toISOString(),
      rotationSchedule: 30,
      status: "overdue" as const,
      nextRotation: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: "secret-3",
      name: "OpenAI API Key",
      type: "api_key",
      lastRotated: new Date(Date.now() - 7 * 86400000).toISOString(),
      rotationSchedule: 90,
      status: "healthy" as const,
      nextRotation: new Date(Date.now() + 83 * 86400000).toISOString(),
    },
    {
      id: "secret-4",
      name: "Anthropic API Key",
      type: "api_key",
      lastRotated: new Date(Date.now() - 7 * 86400000).toISOString(),
      rotationSchedule: 90,
      status: "healthy" as const,
      nextRotation: new Date(Date.now() + 83 * 86400000).toISOString(),
    },
    {
      id: "secret-5",
      name: "S3 Access Key",
      type: "cloud_storage",
      lastRotated: new Date(Date.now() - 60 * 86400000).toISOString(),
      rotationSchedule: 30,
      status: "overdue" as const,
      nextRotation: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "secret-6",
      name: "GitHub PAT",
      type: "scm",
      lastRotated: new Date(Date.now() - 25 * 86400000).toISOString(),
      rotationSchedule: 60,
      status: "healthy" as const,
      nextRotation: new Date(Date.now() + 35 * 86400000).toISOString(),
    },
  ],
  vulnerabilities: {
    critical: 0,
    high: 2,
    medium: 5,
    low: 12,
    lastScan: new Date(Date.now() - 4 * 3600000).toISOString(),
    nextScan: new Date(Date.now() + 20 * 3600000).toISOString(),
  },
  cloudflareAccess: {
    enabled: true,
    policies: 3,
    activeUsers: 12,
    mfaEnforced: true,
    lastPolicyUpdate: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
};

export async function GET() {
  return NextResponse.json(securityData);
}

export async function POST(request: Request) {
  const body: { action?: string; secretId?: string } = await request.json();

  if (body.action === "rotate_secret" && body.secretId) {
    const secret = securityData.secrets.find((s) => s.id === body.secretId);
    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }
    secret.lastRotated = new Date().toISOString();
    secret.nextRotation = new Date(Date.now() + secret.rotationSchedule * 86400000).toISOString();
    secret.status = "healthy";
    return NextResponse.json({ success: true, secret });
  }

  if (body.action === "trigger_vulnerability_scan") {
    return NextResponse.json({
      success: true,
      message: "Vulnerability scan initiated",
      scanId: `scan-${Date.now()}`,
      estimatedDuration: "15-30 minutes",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

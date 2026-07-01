import type { Role } from "./dashboard";

export interface RbacPolicy {
  role: Role;
  permissions: string[];
  description: string;
}

export interface GovernanceConfig {
  policyVersion: string;
  auditRetentionDays: number;
  requireApprovalFor: string[];
  maxSessionDurationHours: number;
  enforce2FA: boolean;
  allowedIpRanges: string[];
}

export const RBAC_POLICIES: RbacPolicy[] = [
  {
    role: "super_admin",
    permissions: ["*"],
    description: "Full CRUD on all resources, policy management, user management, audit log access",
  },
  {
    role: "admin",
    permissions: [
      "connector.create",
      "connector.read",
      "connector.update",
      "connector.delete",
      "edge.deploy",
      "edge.read",
      "edge.rollback",
      "scenario.create",
      "scenario.read",
      "scenario.update",
      "scenario.delete",
      "decision.create",
      "decision.read",
      "audit.read",
      "security.scan",
      "security.read",
      "inference.read",
      "inference.routing",
    ],
    description: "CRUD on connectors, deployments, scenarios; read-only audit log",
  },
  {
    role: "operator",
    permissions: [
      "edge.deploy",
      "edge.read",
      "edge.rollback",
      "security.scan",
      "security.read",
      "connector.read",
      "inference.read",
      "scenario.read",
      "decision.read",
      "audit.read",
    ],
    description: "Deploy/rollback edge nodes, trigger scans, view dashboards",
  },
  {
    role: "viewer",
    permissions: [
      "connector.read",
      "edge.read",
      "inference.read",
      "scenario.read",
      "decision.read",
      "audit.read",
      "security.read",
    ],
    description: "Read-only access to all dashboards and reports",
  },
];

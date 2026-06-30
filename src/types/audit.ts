import type { Role } from "./dashboard";

export interface AuditEntryChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditEntryGovernance {
  approved: boolean;
  approvedBy: string | null;
  policyVersion: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: {
    email: string;
    role: Role;
    ipAddress: string;
  };
  action: string;
  resource: {
    type: string;
    id: string;
    name: string;
  };
  changes: AuditEntryChange[];
  governance: AuditEntryGovernance;
}

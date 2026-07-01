/**
 * MyCodeXvantaOS — Knowledge Repair Model
 * Remediation actions for knowledge issues.
 *
 * Repairs close the loop: every detected issue should eventually
 * produce a repair (or a "won't fix" decision). Repairs are auditable.
 */

import type { ResourceCondition } from "../shared";
import type { KnowledgeIssueType } from "./knowledge-issue";

export type KnowledgeRepairType =
  | "re-ingest"
  | "re-embed"
  | "re-chunk"
  | "delete"
  | "merge"
  | "supplement";

export interface KnowledgeRepairSpec {
  /** The issue this repair addresses */
  issueId: string;
  /** What kind of repair to perform */
  repairType: KnowledgeRepairType;
  /** Whether this repair is automated or manual */
  automated: boolean;
  /** Repair-specific data (e.g., new source URI for re-ingest) */
  repairData: Record<string, unknown>;
  /** Target collection for the repair */
  collectionId: string;
}

export interface KnowledgeRepairStatus {
  phase: KnowledgeRepairPhase;
  conditions: ResourceCondition[];
  startedAt: string | null;
  completedAt: string | null;
  verificationResult: "passed" | "failed" | "pending" | null;
  error: string | null;
}

export type KnowledgeRepairPhase =
  | "pending"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "rolled-back";

/**
 * MyCodeXvantaOS — Knowledge Issue Model
 * Detectable problems in the knowledge base: stale, contradictory,
 * incomplete, hallucinated, or broken-reference content.
 *
 * Issues are the input to the knowledge repair cycle:
 *   detect issue → classify severity → determine repair → execute → verify
 */

import type { ResourceCondition } from "../shared";

export type KnowledgeIssueType =
  | "stale"
  | "contradiction"
  | "gap"
  | "hallucination"
  | "broken-reference";

export type KnowledgeIssueSeverity = "critical" | "high" | "medium" | "low";

export interface KnowledgeIssueSpec {
  /** What kind of issue was detected */
  issueType: KnowledgeIssueType;
  /** Resources affected by this issue */
  affectedResourceIds: string[];
  /** How severe is this issue */
  severity: KnowledgeIssueSeverity;
  /** Human-readable description */
  description: string;
  /** Whether this issue can be auto-repaired */
  autoRepairEligible: boolean;
  /** The collection this issue belongs to */
  collectionId: string;
  /** How the issue was detected (manual, automated-scan, user-report) */
  detectionMethod: "manual" | "automated-scan" | "user-report";
}

export interface KnowledgeIssueStatus {
  phase: KnowledgeIssuePhase;
  conditions: ResourceCondition[];
  repairAttempts: number;
  lastRepairAttemptAt: string | null;
  resolvedAt: string | null;
}

export type KnowledgeIssuePhase = "detected" | "confirmed" | "repairing" | "resolved" | "wont-fix";

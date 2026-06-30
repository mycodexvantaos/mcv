/**
 * ci/rules/graph-db-index-id.rule.ts
 * Section 10.3, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.graphDbIndexIds.map((id) => ({
    ruleId: "graph-db-index-id",
    enforcement: "soft" as const,
    passed: validate("graph-db-index-id", id),
    target: id,
    message: validate("graph-db-index-id", id)
      ? `graph-db-index-id "${id}" is valid`
      : `Invalid graph-db-index-id: "${id}". Expected graph-idx--<service-id>--<label>--<property> (Section 10.3)`,
  }));
}

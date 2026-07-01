/**
 * ci/rules/graph-node-id.rule.ts
 * Section 9.6, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.graphNodeIds.map((id) => ({
    ruleId: "graph-node-id",
    enforcement: "soft" as const,
    passed: validate("graph-node-id", id),
    target: id,
    message: validate("graph-node-id", id)
      ? `graph-node-id "${id}" is valid`
      : `Invalid graph-node-id: "${id}". Expected <service-id>--<entity-type>--<natural-key> (Section 9.6)`,
  }));
}

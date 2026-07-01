/**
 * ci/rules/vector-collection.rule.ts
 * Section 9.2, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.vectorCollectionIds.map((id) => ({
    ruleId: "vector-collection",
    enforcement: "soft" as const,
    passed: validate("vector-collection", id),
    target: id,
    message: validate("vector-collection", id)
      ? `vector-collection id "${id}" is valid`
      : `Invalid vector-collection id: "${id}". Expected <service-id>--<purpose>--<model-alias> (Section 9.2)`,
  }));
}

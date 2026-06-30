/**
 * ci/rules/search-index-id.rule.ts
 * Section 9.5, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.searchIndexIds.map((id) => ({
    ruleId: "search-index-id",
    enforcement: "soft" as const,
    passed: validate("search-index-id", id),
    target: id,
    message: validate("search-index-id", id)
      ? `search-index-id "${id}" is valid`
      : `Invalid search-index-id: "${id}". Expected idx--<service-id>--<field>--<analyzer> (Section 9.5)`,
  }));
}

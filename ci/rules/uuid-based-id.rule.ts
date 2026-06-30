/**
 * ci/rules/uuid-based-id.rule.ts
 * Section 9.10, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.uuidBasedIds.map((id) => ({
    ruleId: "uuid-based-id",
    enforcement: "soft" as const,
    passed: validate("uuid-based-id", id),
    target: id,
    message: validate("uuid-based-id", id)
      ? `uuid-based-id "${id}" is valid`
      : `Invalid uuid-based-id: "${id}". Expected <prefix>--<32 hex chars> (Section 9.10)`,
  }));
}

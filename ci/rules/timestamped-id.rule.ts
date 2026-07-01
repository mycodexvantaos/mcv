/**
 * ci/rules/timestamped-id.rule.ts
 * Section 9.8, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.timestampedIds.map((id) => ({
    ruleId: "timestamped-id",
    enforcement: "soft" as const,
    passed: validate("timestamped-id", id),
    target: id,
    message: validate("timestamped-id", id)
      ? `timestamped-id "${id}" is valid`
      : `Invalid timestamped-id: "${id}". Expected <prefix>--<YYYYMMDD>--<random6> (Section 9.8)`,
  }));
}

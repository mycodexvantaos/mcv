/**
 * ci/rules/content-addressed-id.rule.ts
 * Section 9.9, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.contentAddressedIds.map((id) => ({
    ruleId: "content-addressed-id",
    enforcement: "soft" as const,
    passed: validate("content-addressed-id", id),
    target: id,
    message: validate("content-addressed-id", id)
      ? `content-addressed-id "${id}" is valid`
      : `Invalid content-addressed-id: "${id}". Expected <prefix>--sha256-<12 hex chars> (Section 9.9)`,
  }));
}

/**
 * ci/rules/capability-id.rule.ts
 * Section 5.5, Section 13 — Hard enforcement
 * Validates: capability-id belongs to the canonical capability set
 */
import { validate, CANONICAL_CAPABILITIES } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const capabilityId of ctx.capabilityIds) {
    if (!validate("capability-id", capabilityId)) {
      results.push({
        ruleId: "capability-id",
        enforcement: "hard",
        passed: false,
        target: capabilityId,
        message:
          `"${capabilityId}" is not a canonical capability-id. ` +
          `Allowed values: ${CANONICAL_CAPABILITIES.join(", ")} (Section 5.5)`,
      });
    } else {
      results.push({
        ruleId: "capability-id",
        enforcement: "hard",
        passed: true,
        target: capabilityId,
        message: `capability-id "${capabilityId}" is valid`,
      });
    }
  }

  return results;
}

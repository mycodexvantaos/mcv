/**
 * ci/rules/provider-instance.rule.ts
 * Section 8.1, Section 8.2, Section 13 — Hard enforcement
 * Validates: provider instance format, capability prefix correctness
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const providerInstance of ctx.providerInstances) {
    if (!validate("provider-instance", providerInstance)) {
      results.push({
        ruleId: "provider-instance",
        enforcement: "hard",
        passed: false,
        target: providerInstance,
        message:
          `Invalid provider instance: "${providerInstance}". ` +
          `Must be <canonical-capability-id>-<provider-name>. ` +
          `Capability segment must come first and must be from the canonical set (Section 8.1, Section 8.2)`,
      });
    } else {
      results.push({
        ruleId: "provider-instance",
        enforcement: "hard",
        passed: true,
        target: providerInstance,
        message: `provider instance "${providerInstance}" is valid`,
      });
    }
  }

  return results;
}

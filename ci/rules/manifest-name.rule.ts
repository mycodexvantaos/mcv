/**
 * ci/rules/manifest-name.rule.ts
 * Section 6.3, Section 6.4 — Hard enforcement
 * Validates: manifest metadata.name equals service-id
 */
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const { manifestPath, metadataName, expectedServiceId } of ctx.manifestEntries) {
    if (metadataName !== expectedServiceId) {
      results.push({
        ruleId: "manifest-name",
        enforcement: "hard",
        passed: false,
        target: manifestPath,
        message: `manifest metadata.name "${metadataName}" does not match expected service-id "${expectedServiceId}" (Section 6.3, Section 6.4)`,
      });
    } else {
      results.push({
        ruleId: "manifest-name",
        enforcement: "hard",
        passed: true,
        target: manifestPath,
        message: `manifest "${manifestPath}" metadata.name is consistent with service-id`,
      });
    }
  }

  return results;
}

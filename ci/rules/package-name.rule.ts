/**
 * ci/rules/package-name.rule.ts
 * Section 7.1, Section 13 — Hard enforcement
 * Validates: package name format and derivation from service-id
 */
import { validate, derivePackageName } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const { serviceId, packageName } of ctx.packageEntries) {
    // Format check
    if (!validate("package-name", packageName)) {
      results.push({
        ruleId: "package-name",
        enforcement: "hard",
        passed: false,
        target: packageName,
        message: `Invalid package name format: "${packageName}". Must match ^@mycodexvantaos/[a-z0-9]+(?:-[a-z0-9]+)+$ (Section 7.1)`,
      });
      continue;
    }

    // Derivation consistency check
    if (serviceId) {
      const expected = derivePackageName(serviceId);
      if (packageName !== expected) {
        results.push({
          ruleId: "package-name",
          enforcement: "hard",
          passed: false,
          target: packageName,
          message: `package name "${packageName}" does not derive from service-id "${serviceId}". Expected "${expected}" (Section 7.1, Section 6.4)`,
        });
        continue;
      }
    }

    results.push({
      ruleId: "package-name",
      enforcement: "hard",
      passed: true,
      target: packageName,
      message: `package name "${packageName}" is valid`,
    });
  }

  return results;
}

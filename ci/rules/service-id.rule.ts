/**
 * ci/rules/service-id.rule.ts
 * Section 5.1, Section 13 — Hard enforcement
 * Validates: service-id format, no version, no environment marker
 */
import {
  validate,
  containsVersionPattern,
  containsEnvironmentMarker,
} from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const serviceId of ctx.serviceIds) {
    // Format check
    if (!validate("service-id", serviceId)) {
      results.push({
        ruleId: "service-id",
        enforcement: "hard",
        passed: false,
        target: serviceId,
        message: `Invalid service-id format: "${serviceId}". Must match ^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+$ (Section 5.1)`,
      });
      continue; // no need to run further sub-checks on an already-invalid id
    }

    // Section 3.6 — no version
    if (containsVersionPattern(serviceId)) {
      results.push({
        ruleId: "no-version-in-canonical",
        enforcement: "hard",
        passed: false,
        target: serviceId,
        message: `service-id "${serviceId}" contains a version pattern. Version must not appear in canonical identifiers (Section 3.6)`,
      });
    }

    // Section 3.7 — no environment
    if (containsEnvironmentMarker(serviceId)) {
      results.push({
        ruleId: "no-environment-in-canonical",
        enforcement: "hard",
        passed: false,
        target: serviceId,
        message: `service-id "${serviceId}" contains an environment marker (dev/staging/prod). Environment must not appear in canonical identifiers (Section 3.7)`,
      });
    }

    // Section 4 — no legacy prefix
    if (!validate("forbidden-legacy-prefix", serviceId) === false) {
      // validate returns false when pattern matches (matchMeansValid=false)
    }
    if (!validate("forbidden-legacy-prefix", serviceId)) {
      results.push({
        ruleId: "forbidden-legacy-prefix",
        enforcement: "hard",
        passed: false,
        target: serviceId,
        message: `service-id "${serviceId}" contains a forbidden legacy prefix (mycodexvanta-os, codexvanta, codexvanta-os) (Section 4)`,
      });
    }

    // All checks passed for this id
    results.push({
      ruleId: "service-id",
      enforcement: "hard",
      passed: true,
      target: serviceId,
      message: `service-id "${serviceId}" is valid`,
    });
  }

  return results;
}

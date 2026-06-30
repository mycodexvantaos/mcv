/**
 * ci/rules/urn.rule.ts
 * Section 7.5, Section 13 — Hard enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

const ALLOWED_URN_TYPES = ["capability", "provider", "manifest", "policy", "exception", "audit"];

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const urn of ctx.urns) {
    if (!validate("urn", urn)) {
      results.push({
        ruleId: "urn",
        enforcement: "hard",
        passed: false,
        target: urn,
        message: `Invalid URN: "${urn}". Must match ^urn:mycodexvantaos:[a-z-]+:[a-z-]+:[a-z0-9-]+$ (Section 7.5)`,
      });
      continue;
    }

    // Validate type segment
    const segments = urn.split(":");
    const urnType = segments[2];
    if (!ALLOWED_URN_TYPES.includes(urnType)) {
      results.push({
        ruleId: "urn",
        enforcement: "hard",
        passed: false,
        target: urn,
        message: `URN type "${urnType}" is not allowed. Allowed types: ${ALLOWED_URN_TYPES.join(", ")} (Section 7.5)`,
      });
      continue;
    }

    // Section 3.6 — no version in identifier segment
    const identifier = segments[4];
    if (/v\d+/.test(identifier)) {
      results.push({
        ruleId: "no-version-in-canonical",
        enforcement: "hard",
        passed: false,
        target: urn,
        message: `URN identifier segment "${identifier}" contains a version pattern. Version must not be in the URN identifier (Section 3.6, Section 7.5)`,
      });
      continue;
    }

    results.push({
      ruleId: "urn",
      enforcement: "hard",
      passed: true,
      target: urn,
      message: `URN "${urn}" is valid`,
    });
  }

  return results;
}

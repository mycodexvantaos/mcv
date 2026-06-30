/**
 * ci/rules/env-var.rule.ts
 * Section 7.2, Section 13 — Hard enforcement
 * Validates: environment variable naming
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

const DEPRECATED_PREFIX = /^ORCH_/;

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const envVar of ctx.envVars) {
    // Check deprecated ORCH_ prefix
    if (DEPRECATED_PREFIX.test(envVar)) {
      results.push({
        ruleId: "env-var",
        enforcement: "hard",
        passed: false,
        target: envVar,
        message: `env var "${envVar}" uses deprecated ORCH_ prefix. New variables MUST use MYCODEXVANTAOS_ prefix (Section 7.2)`,
      });
      continue;
    }

    if (!validate("env-var", envVar)) {
      results.push({
        ruleId: "env-var",
        enforcement: "hard",
        passed: false,
        target: envVar,
        message: `Invalid env var: "${envVar}". Must match ^MYCODEXVANTAOS_[A-Z0-9_]+$ (Section 7.2)`,
      });
    } else {
      results.push({
        ruleId: "env-var",
        enforcement: "hard",
        passed: true,
        target: envVar,
        message: `env var "${envVar}" is valid`,
      });
    }
  }

  return results;
}

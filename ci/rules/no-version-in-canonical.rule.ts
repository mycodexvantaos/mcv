/**
 * ci/rules/no-version-in-canonical.rule.ts
 * Section 3.6, Section 14.1 — Hard enforcement
 */
import { containsVersionPattern } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const canonicals = [
    ...ctx.serviceIds,
    ...ctx.moduleFolderPaths.map((p) => p.split("/").pop() ?? p),
  ];

  for (const name of canonicals) {
    if (containsVersionPattern(name)) {
      results.push({
        ruleId: "no-version-in-canonical",
        enforcement: "hard",
        passed: false,
        target: name,
        message: `Canonical identifier "${name}" contains a version pattern (e.g. v1, v2.0). Version must be in metadata, tags, or labels only (Section 3.6)`,
      });
    }
  }

  return results;
}

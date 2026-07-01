/**
 * ci/rules/no-environment-in-canonical.rule.ts
 * Section 3.7, Section 14.1 — Hard enforcement
 */
import { containsEnvironmentMarker } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const canonicals = [
    ...ctx.serviceIds,
    ...ctx.moduleFolderPaths.map((p) => p.split("/").pop() ?? p),
    ...ctx.packageEntries.map((p) => p.packageName),
  ];

  for (const name of canonicals) {
    if (containsEnvironmentMarker(name)) {
      results.push({
        ruleId: "no-environment-in-canonical",
        enforcement: "hard",
        passed: false,
        target: name,
        message: `Canonical identifier "${name}" contains an environment marker (dev/staging/prod). Environment must appear only in Kubernetes namespaces and overlay configs (Section 3.7, Section 12)`,
      });
    }
  }

  return results;
}

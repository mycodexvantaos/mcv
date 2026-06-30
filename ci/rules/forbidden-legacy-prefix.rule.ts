/**
 * ci/rules/forbidden-legacy-prefix.rule.ts
 * Section 4, Section 13 — Hard enforcement
 * Scans all names for forbidden legacy prefixes.
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];
  const LEGACY = /^(mycodexvanta-os|codexvanta|codexvanta-os)(\b|[^o]|$)/;

  const allNames = [
    ...ctx.serviceIds,
    ...ctx.packageEntries.map((p) => p.packageName),
    ...ctx.moduleFolderPaths,
    ...ctx.providerInstances,
  ];

  for (const name of allNames) {
    if (LEGACY.test(name)) {
      results.push({
        ruleId: "forbidden-legacy-prefix",
        enforcement: "hard",
        passed: false,
        target: name,
        message: `"${name}" contains a forbidden legacy prefix (mycodexvanta-os, codexvanta, codexvanta-os). These must not appear in any resource name (Section 4)`,
      });
    }
  }

  return results;
}

/**
 * ci/rules/module-path.rule.ts
 * Section 6.2, Section 6.4 — Hard enforcement
 * Validates: module folder name equals service-id exactly
 */
import type { ValidationContext, RuleResult } from "../validate-architecture.js";
import path from "path";

export function run(ctx: ValidationContext): RuleResult[] {
  const results: RuleResult[] = [];

  for (const modulePath of ctx.moduleFolderPaths) {
    const folderName = path.basename(modulePath);
    const expectedServiceId = folderName;

    // Check that folder name matches service-id pattern
    if (!/^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+$/.test(folderName)) {
      results.push({
        ruleId: "module-path",
        enforcement: "hard",
        passed: false,
        target: modulePath,
        message: `Module folder "${folderName}" does not match service-id pattern. Folder name must equal the service-id exactly (Section 6.2, Section 6.4)`,
      });
    } else {
      results.push({
        ruleId: "module-path",
        enforcement: "hard",
        passed: true,
        target: modulePath,
        message: `Module folder "${folderName}" is valid`,
      });
    }
  }

  return results;
}

/**
 * ci/rules/embedding-model-alias.rule.ts
 * Section 9.3, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.embeddingModelAliases.map((alias) => ({
    ruleId: "embedding-model-alias",
    enforcement: "soft" as const,
    passed: validate("embedding-model-alias", alias),
    target: alias,
    message: validate("embedding-model-alias", alias)
      ? `embedding-model-alias "${alias}" is valid`
      : `Invalid embedding-model-alias: "${alias}". Expected <provider>--<model>--<dim>d (Section 9.3)`,
  }));
}

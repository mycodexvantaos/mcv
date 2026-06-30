/**
 * ci/rules/retrieval-pipeline-id.rule.ts
 * Section 9.4, Section 13 — Soft enforcement
 */
import { validate } from "../utils/regex-table.js";
import type { ValidationContext, RuleResult } from "../validate-architecture.js";

export function run(ctx: ValidationContext): RuleResult[] {
  return ctx.retrievalPipelineIds.map((id) => ({
    ruleId: "retrieval-pipeline-id",
    enforcement: "soft" as const,
    passed: validate("retrieval-pipeline-id", id),
    target: id,
    message: validate("retrieval-pipeline-id", id)
      ? `retrieval-pipeline-id "${id}" is valid`
      : `Invalid retrieval-pipeline-id: "${id}". Expected retrieval--<strategy>--<store-type> (Section 9.4)`,
  }));
}

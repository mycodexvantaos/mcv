/**
 * @mycodexvantaos/mycodexvantaos-policy-model
 * Policy model - subject, action, resource, condition, effect, evaluation result
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/policy-model';

// Extended types for standalone package
export type PolicyEffect = 'allow' | 'deny' | 'require-review';

export interface PolicyEvaluationResult {
  allowed: boolean;
  effect: PolicyEffect;
  matchedPolicies: string[];
  reason?: string;
}

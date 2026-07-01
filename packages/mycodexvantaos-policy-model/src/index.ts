/**
 * @mycodexvantaos/policy-model
 * Policy model - types for subject, action, resource, condition, effect, and evaluation results.
 *
 * This package defines the canonical type system for platform policy enforcement.
 * All policy decisions flow through these types. The policy-engine service consumes
 * them to evaluate requests; the api-node uses them to enforce governance.
 *
 * Decisions: allow | deny | require-review | dry-run-only | audit-required
 * These map directly from the contract definitions in contracts/policies/*.yaml
 * and the schema in contracts/schemas/policy.schema.json + policy-decision.schema.json.
 */

// ── Policy Effect ────────────────────────────────────────────────────────

/** The set of possible policy decisions. Extends the contract schema enum. */
export type PolicyEffect = "allow" | "deny" | "require-review" | "dry-run-only" | "audit-required";

/** Check if an effect is permissive (allows the action to proceed) */
export function isAllowedEffect(effect: PolicyEffect): boolean {
  return effect === "allow";
}

/** Check if an effect blocks the action */
export function isDeniedEffect(effect: PolicyEffect): boolean {
  return effect === "deny";
}

/** Check if an effect requires human review before proceeding */
export function isReviewRequiredEffect(effect: PolicyEffect): boolean {
  return effect === "require-review";
}

// ── Policy Subject ──────────────────────────────────────────────────────

/** Who or what is making the request */
export interface PolicySubject {
  /** 'user' | 'service' | 'agent' | 'system' */
  type: string;
  /** Identifier for the subject */
  id: string;
  /** Roles the subject holds (e.g., 'platform-admin', 'workspace-owner') */
  roles?: string[];
  /** The service making the request, if subject is a service */
  service?: string;
}

// ── Policy Action ────────────────────────────────────────────────────────

/** What operation is being requested. Supports compound actions like 'memory-item-deprecate,memory-item-merge' */
export type PolicyAction = string;

/** Parse a compound action string into individual actions */
export function parseActions(action: PolicyAction): string[] {
  return action
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

/** Check if a requested action matches a policy action pattern.
 *  Supports wildcard '*' and comma-separated compound actions. */
export function actionMatches(policyAction: PolicyAction, requestedAction: string): boolean {
  if (policyAction === "*") return true;
  const policyActions = parseActions(policyAction);
  return policyActions.includes(requestedAction) || policyActions.includes("*");
}

// ── Policy Resource ──────────────────────────────────────────────────────

/** What resource is being accessed */
export interface PolicyResource {
  /** Resource type (e.g., 'dream-run', 'memory-item', 'audit-event') */
  type: string;
  /** Specific resource identifier */
  id?: string;
  /** Additional resource attributes for condition matching */
  attributes?: Record<string, unknown>;
}

/** Check if a requested resource matches a policy resource pattern.
 *  Supports wildcard '*' and prefix patterns like 'workspace/*' and 'knowledge/collections/*' */
export function resourceMatches(
  policyResource: string,
  requestedResource: PolicyResource
): boolean {
  if (policyResource === "*") return true;
  // Exact match on resource type
  if (policyResource === requestedResource.type) return true;
  // Prefix pattern match: 'workspace/*' matches any resource type starting with 'workspace/'
  if (policyResource.endsWith("/*")) {
    const prefix = policyResource.slice(0, -2);
    return requestedResource.type.startsWith(prefix + "/") || requestedResource.type === prefix;
  }
  return false;
}

// ── Policy Condition ─────────────────────────────────────────────────────

/** Conditions that must be met for a rule to apply */
export interface PolicyCondition {
  /** Key-value conditions that must all match (AND logic) */
  [key: string]: unknown;
}

/** Evaluate a condition against a context.
 *  All keys in the condition must match the corresponding values in the context.
 *  - String values: exact match
 *  - Array values: context value must be in the array (OR logic)
 *  - tags_contains: context.tags must include at least one of the specified tags */
export function conditionMatches(
  condition: PolicyCondition | undefined,
  context: Record<string, unknown>
): boolean {
  if (!condition || Object.keys(condition).length === 0) return true;

  for (const [key, expected] of Object.entries(condition)) {
    const actual = context[key];

    // Special handling for tags_contains: check if any of the expected tags are present in context.tags
    if (key === "tags_contains") {
      const expectedTags = expected as string[];
      const actualTags = (context["tags"] as string[]) ?? [];
      const hasMatch = expectedTags.some((tag) => actualTags.includes(tag));
      if (!hasMatch) return false;
      continue;
    }

    // Array expected: actual must be in the array
    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
      continue;
    }

    // String/exact match
    if (actual !== expected) return false;
  }

  return true;
}

// ── Policy Rule ──────────────────────────────────────────────────────────

/** A single policy rule with effect, subject, action, resource, and optional condition */
export interface PolicyRule {
  /** The decision when this rule matches */
  effect: PolicyEffect;
  /** Who the rule applies to. '*' means all subjects. */
  subject: PolicySubject | { roles?: string[]; service?: string } | string;
  /** What actions the rule covers. '*' means all actions. Supports comma-separated compound actions. */
  action: PolicyAction;
  /** What resources the rule covers. '*' means all resources. Supports prefix patterns. */
  resource: string;
  /** Optional conditions that must all be met for the rule to apply */
  condition?: PolicyCondition;
}

// ── Policy Definition ────────────────────────────────────────────────────

/** A complete policy with id, description, and rules */
export interface PolicyDefinition {
  id: string;
  description?: string;
  rules: PolicyRule[];
}

// ── Policy Evaluation Request ────────────────────────────────────────────

/** Request to evaluate whether an action is allowed */
export interface PolicyEvaluateRequest {
  /** Who is making the request */
  subject: PolicySubject;
  /** What action is being requested */
  action: string;
  /** What resource is being accessed */
  resource: PolicyResource;
  /** Additional context for condition matching (e.g., memory_type, tags, mode) */
  context?: Record<string, unknown>;
}

// ── Policy Evaluation Result ─────────────────────────────────────────────

/** Result of evaluating a policy request */
export interface PolicyEvaluateResult {
  /** Whether the action is allowed to proceed */
  allowed: boolean;
  /** The final effect determined by policy evaluation */
  effect: PolicyEffect;
  /** Human-readable explanation of the decision */
  reason: string;
  /** The ID of the policy rule that made the final decision */
  matchedRuleId?: string;
  /** The policy ID that contained the matched rule */
  matchedPolicyId?: string;
  /** The role used in evaluation, if applicable */
  role?: string;
  /** Scope of the decision */
  scope?: "platform" | "workspace";
  /** Detailed condition check results */
  conditions?: Array<{
    type: string;
    status: "True" | "False" | "Unknown";
    reason: string;
    message: string;
  }>;
  /** When the evaluation occurred */
  evaluatedAt: string;
}

// ── Subject matching helper ──────────────────────────────────────────────

/** Check if a policy rule's subject matches the request subject.
 *  Supports: wildcard '*', role-based matching, service-based matching, exact match */
export function subjectMatches(
  ruleSubject: PolicyRule["subject"],
  requestSubject: PolicySubject
): boolean {
  // Wildcard: rule applies to all subjects
  if (ruleSubject === "*") return true;

  // String form: match by service name or role
  if (typeof ruleSubject === "string") {
    return (
      requestSubject.service === ruleSubject || (requestSubject.roles ?? []).includes(ruleSubject)
    );
  }

  // Object form: check roles and/or service
  if (typeof ruleSubject === "object" && ruleSubject !== null) {
    const rule = ruleSubject as { roles?: string[]; service?: string; type?: string; id?: string };

    // Service match
    if (rule.service && requestSubject.service === rule.service) return true;

    // Role match: at least one of the rule's roles must be in the subject's roles
    if (rule.roles && rule.roles.length > 0) {
      const subjectRoles = requestSubject.roles ?? [];
      if (rule.roles.some((role) => subjectRoles.includes(role))) return true;
    }

    // Exact subject match
    if (rule.type && rule.id && rule.type === requestSubject.type && rule.id === requestSubject.id)
      return true;

    return false;
  }

  return false;
}

// ── Policy Decision Helpers ──────────────────────────────────────────────

/** Create an 'allow' decision result */
export function allowDecision(
  reason: string,
  opts?: { matchedRuleId?: string; matchedPolicyId?: string; role?: string }
): PolicyEvaluateResult {
  return {
    allowed: true,
    effect: "allow",
    reason,
    matchedRuleId: opts?.matchedRuleId,
    matchedPolicyId: opts?.matchedPolicyId,
    role: opts?.role,
    evaluatedAt: new Date().toISOString(),
  };
}

/** Create a 'deny' decision result */
export function denyDecision(
  reason: string,
  opts?: { matchedRuleId?: string; matchedPolicyId?: string; role?: string }
): PolicyEvaluateResult {
  return {
    allowed: false,
    effect: "deny",
    reason,
    matchedRuleId: opts?.matchedRuleId,
    matchedPolicyId: opts?.matchedPolicyId,
    role: opts?.role,
    evaluatedAt: new Date().toISOString(),
  };
}

/** Create a 'require-review' decision result */
export function requireReviewDecision(
  reason: string,
  opts?: { matchedRuleId?: string; matchedPolicyId?: string; role?: string }
): PolicyEvaluateResult {
  return {
    allowed: false,
    effect: "require-review",
    reason,
    matchedRuleId: opts?.matchedRuleId,
    matchedPolicyId: opts?.matchedPolicyId,
    role: opts?.role,
    evaluatedAt: new Date().toISOString(),
  };
}

/** Create a 'dry-run-only' decision result */
export function dryRunOnlyDecision(
  reason: string,
  opts?: { matchedRuleId?: string; matchedPolicyId?: string }
): PolicyEvaluateResult {
  return {
    allowed: false,
    effect: "dry-run-only",
    reason,
    matchedRuleId: opts?.matchedRuleId,
    matchedPolicyId: opts?.matchedPolicyId,
    evaluatedAt: new Date().toISOString(),
  };
}

/** Create an 'audit-required' decision result */
export function auditRequiredDecision(
  reason: string,
  opts?: { matchedRuleId?: string; matchedPolicyId?: string }
): PolicyEvaluateResult {
  return {
    allowed: true,
    effect: "audit-required",
    reason,
    matchedRuleId: opts?.matchedRuleId,
    matchedPolicyId: opts?.matchedPolicyId,
    evaluatedAt: new Date().toISOString(),
  };
}

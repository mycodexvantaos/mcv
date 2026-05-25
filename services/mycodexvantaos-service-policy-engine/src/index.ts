/**
 * @mycodexvantaos/service-policy-engine
 * Policy engine service - runtime policy evaluation and enforcement.
 *
 * Loads all policy definitions from contracts/policies/*.yaml via the
 * contracts-sdk and evaluates incoming requests against the full rule set.
 *
 * Evaluation strategy:
 *   1. Load all policy definitions from contracts (via contracts-sdk)
 *   2. Flatten all rules from all policies into a single ordered list
 *   3. Evaluate each rule in order against the request
 *   4. First matching rule determines the decision (first-match-wins)
 *   5. If no rule matches, default to deny
 *
 * The engine supports the following decisions (effects):
 *   - allow: Action is permitted
 *   - deny: Action is forbidden
 *   - require-review: Action requires human approval before proceeding
 *   - dry-run-only: Action may only proceed in dry-run mode
 *   - audit-required: Action is allowed but must produce an audit event
 */

import {
  loadPolicyDefinitions,
  type PolicyDefinitionContract,
} from '@mycodexvantaos/contracts-sdk';

import {
  type PolicyEffect,
  type PolicySubject,
  type PolicyResource,
  type PolicyRule,
  type PolicyDefinition,
  type PolicyEvaluateRequest,
  type PolicyEvaluateResult,
  subjectMatches,
  actionMatches,
  resourceMatches,
  conditionMatches,
  denyDecision,
  allowDecision,
  requireReviewDecision,
  dryRunOnlyDecision,
  auditRequiredDecision,
} from '@mycodexvantaos/policy-model';

// ── Internal flattened rule with reference to source policy ──────────────

interface FlattenedRule {
  policyId: string;
  policyDescription?: string;
  ruleIndex: number;
  rule: PolicyRule;
}

// ── Policy Engine Class ──────────────────────────────────────────────────

export class PolicyEngine {
  private rules: FlattenedRule[] = [];
  private policies: PolicyDefinition[] = [];
  private loaded = false;

  /** Load all policy definitions from contracts. Called automatically on first evaluate if not called manually. */
  loadPolicies(contractsDir?: string): void {
    const contractPolicies = loadPolicyDefinitions(contractsDir);
    this.policies = [];
    this.rules = [];

    for (const contract of contractPolicies) {
      // Extract rules from the spec
      const rawRules = (contract.spec?.rules ?? []) as Array<Record<string, unknown>>;
      const policyId = contract.metadata?.name ?? 'unknown';

      const policy: PolicyDefinition = {
        id: policyId,
        description: contract.metadata?.description,
        rules: rawRules.map((raw) => this.normalizeRule(raw)),
      };

      this.policies.push(policy);

      for (let i = 0; i < policy.rules.length; i++) {
        this.rules.push({
          policyId: policy.id,
          policyDescription: policy.description,
          ruleIndex: i,
          rule: policy.rules[i],
        });
      }
    }

    this.loaded = true;
  }

  /** Normalize a raw rule from YAML contract into a PolicyRule */
  private normalizeRule(raw: Record<string, unknown>): PolicyRule {
    return {
      effect: (raw.effect as PolicyEffect) ?? 'deny',
      subject: raw.subject as PolicyRule['subject'],
      action: (raw.action as string) ?? '*',
      resource: (raw.resource as string) ?? '*',
      condition: raw.condition as Record<string, unknown> | undefined,
    };
  }

  /** Add a policy definition programmatically (for testing or runtime extension) */
  addPolicy(policy: PolicyDefinition): void {
    if (!this.loaded) this.loadPolicies();

    this.policies.push(policy);
    for (let i = 0; i < policy.rules.length; i++) {
      this.rules.push({
        policyId: policy.id,
        policyDescription: policy.description,
        ruleIndex: i,
        rule: policy.rules[i],
      });
    }
  }

  /**
   * Evaluate a policy request against all loaded policies.
   *
   * Strategy: first-match-wins. Rules are evaluated in the order they appear
   * across all policies. The first rule whose subject, action, resource, and
   * condition all match determines the decision. If no rule matches, deny.
   */
  evaluate(request: PolicyEvaluateRequest): PolicyEvaluateResult {
    if (!this.loaded) this.loadPolicies();

    const context = request.context ?? {};

    for (const flattened of this.rules) {
      const { rule, policyId, ruleIndex } = flattened;

      // Check subject match
      if (!subjectMatches(rule.subject, request.subject)) continue;

      // Check action match
      if (!actionMatches(rule.action, request.action)) continue;

      // Check resource match
      if (!resourceMatches(rule.resource, request.resource)) continue;

      // Check condition match
      if (!conditionMatches(rule.condition, context)) continue;

      // Rule matches! Determine the decision based on effect
      const matchedRuleId = `${policyId}.rules[${ruleIndex}]`;
      const reason = `Matched rule in policy '${policyId}': effect=${rule.effect}, action=${rule.action}, resource=${rule.resource}`;

      switch (rule.effect) {
        case 'allow':
          return allowDecision(reason, {
            matchedRuleId,
            matchedPolicyId: policyId,
            role: request.subject.roles?.[0],
          });
        case 'deny':
          return denyDecision(reason, {
            matchedRuleId,
            matchedPolicyId: policyId,
            role: request.subject.roles?.[0],
          });
        case 'require-review':
          return requireReviewDecision(reason, {
            matchedRuleId,
            matchedPolicyId: policyId,
            role: request.subject.roles?.[0],
          });
        case 'dry-run-only':
          return dryRunOnlyDecision(reason, { matchedRuleId, matchedPolicyId: policyId });
        case 'audit-required':
          return auditRequiredDecision(reason, { matchedRuleId, matchedPolicyId: policyId });
        default:
          return denyDecision(`Unknown effect: ${rule.effect}`, {
            matchedRuleId,
            matchedPolicyId: policyId,
          });
      }
    }

    // No rule matched — default deny
    return denyDecision(
      `No matching policy rule found for action '${request.action}' on resource '${request.resource.type}'`,
      {
        role: request.subject.roles?.[0],
      }
    );
  }

  /** List all loaded policies */
  listPolicies(): PolicyDefinition[] {
    if (!this.loaded) this.loadPolicies();
    return [...this.policies];
  }

  /** Get a specific policy by ID */
  getPolicy(id: string): PolicyDefinition | undefined {
    if (!this.loaded) this.loadPolicies();
    return this.policies.find((p) => p.id === id);
  }

  /** Get total rule count across all policies */
  getRuleCount(): number {
    if (!this.loaded) this.loadPolicies();
    return this.rules.length;
  }

  /** Clear all loaded policies (useful for testing) */
  clear(): void {
    this.policies = [];
    this.rules = [];
    this.loaded = false;
  }
}

// ── Singleton engine for app-wide use ────────────────────────────────────

let engineInstance: PolicyEngine | null = null;

/** Get or create the singleton PolicyEngine instance */
export function getPolicyEngine(): PolicyEngine {
  if (!engineInstance) {
    engineInstance = new PolicyEngine();
    engineInstance.loadPolicies();
  }
  return engineInstance;
}

/** Reset the singleton (for testing) */
export function resetPolicyEngine(): void {
  engineInstance = null;
}

// ── Convenience evaluate function ────────────────────────────────────────

/** Evaluate a policy request using the singleton engine */
export function evaluatePolicy(request: PolicyEvaluateRequest): PolicyEvaluateResult {
  return getPolicyEngine().evaluate(request);
}

// ── Re-export types from policy-model for convenience ────────────────────

export type {
  PolicyEffect,
  PolicySubject,
  PolicyResource,
  PolicyRule,
  PolicyDefinition,
  PolicyEvaluateRequest,
  PolicyEvaluateResult,
} from '@mycodexvantaos/policy-model';

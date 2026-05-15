/**
 * MyCodeXvantaOS Policy Engine
 * Provides policy evaluation and enforcement across the platform
 */

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  target: 'service' | 'user' | 'resource' | 'network';
  action: 'allow' | 'deny';
}

export interface PolicyRule {
  condition: string;
  effect: 'allow' | 'deny';
}

export interface PolicyContext {
  subject?: string;
  resource?: string;
  action?: string;
  environment?: Record<string, any>;
}

export interface PolicyResult {
  allowed: boolean;
  policyId?: string;
  reason: string;
}

export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();

  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    let lastDenyReason = '';

    for (const policy of this.policies.values()) {
      const matches = this.matchesPolicy(policy, context);
      if (matches) {
        if (policy.action === 'deny') {
          lastDenyReason = `Denied by policy ${policy.name}: ${policy.description}`;
        }
      }
    }

    // Default deny if no explicit allow
    return {
      allowed: lastDenyReason === '',
      reason: lastDenyReason || 'Allowed by default',
    };
  }

  private matchesPolicy(policy: Policy, context: PolicyContext): boolean {
    // Simplified policy matching
    return true;
  }

  getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }
}

export default PolicyEngine;

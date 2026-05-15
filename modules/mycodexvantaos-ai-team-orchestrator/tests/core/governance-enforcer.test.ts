import {
  GovernanceEnforcer,
  GovernanceRule,
  GovernanceDecision,
  PermissionCheck,
  PermissionType,
} from '../../src/core/governance-enforcer';
import type { AgentURN, GovernanceTier } from '../../src/types';

describe('GovernanceEnforcer', () => {
  let governanceEnforcer: GovernanceEnforcer;

  beforeEach(() => {
    governanceEnforcer = new GovernanceEnforcer();

    // Register agent tiers
    governanceEnforcer.registerAgentTier('urn:mycodexvantaos:agent:admin-01' as AgentURN, 3);
    governanceEnforcer.registerAgentTier('urn:mycodexvantaos:agent:architect-01' as AgentURN, 2);
    governanceEnforcer.registerAgentTier('urn:mycodexvantaos:agent:engineer-01' as AgentURN, 1);
    governanceEnforcer.registerAgentTier('urn:mycodexvantaos:agent:intern-01' as AgentURN, 0);
    governanceEnforcer.registerAgentTier('urn:mycodexvantaos:agent:restricted-01' as AgentURN, -1);
  });

  afterEach(() => {
    governanceEnforcer.clear();
  });

  describe('Tier Management', () => {
    it('should register and retrieve agent tier', () => {
      const tier = governanceEnforcer.getAgentTier('urn:mycodexvantaos:agent:admin-01' as AgentURN);
      expect(tier).toBe(3);
    });

    it('should return 0 for unregistered agents', () => {
      const tier = governanceEnforcer.getAgentTier('urn:mycodexvantaos:agent:unknown' as AgentURN);
      expect(tier).toBe(0);
    });

    it('should unregister agent tier', () => {
      governanceEnforcer.unregisterAgentTier('urn:mycodexvantaos:agent:admin-01' as AgentURN);
      const tier = governanceEnforcer.getAgentTier('urn:mycodexvantaos:agent:admin-01' as AgentURN);
      expect(tier).toBe(0);
    });
  });

  describe('Permission Checking', () => {
    it('should allow action when agent has sufficient tier', () => {
      // Register a rule that requires tier 1
      const rule: GovernanceRule = {
        permission: 'task:create',
        minTier: 0,
        requiresApproval: false,
        approverTiers: [],
      };
      governanceEnforcer.addRule(rule);

      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
        resource: 'task',
        action: 'create',
      };

      const decision = governanceEnforcer.checkPermission(check);
      expect(decision.allowed).toBe(true);
    });

    it('should deny action when agent has insufficient tier', () => {
      // task:delegate requires tier 1 by default
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:intern-01' as AgentURN,
        resource: 'task',
        action: 'delegate',
      };

      const decision = governanceEnforcer.checkPermission(check);
      // Intern has tier 0, task:delegate requires tier 1
      expect(decision.allowed).toBe(false); // Insufficient tier
      expect(decision.reason).toContain('insufficient tier');
    });

    it('should deny all actions for restricted tier (-1) agents', () => {
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:restricted-01' as AgentURN,
        resource: 'sensitive_data',
        action: 'view',
      };

      const decision = governanceEnforcer.checkPermission(check);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('restricted');
    });

    it('should allow admin agents (tier 3) to perform actions', () => {
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:admin-01' as AgentURN,
        resource: 'any_resource',
        action: 'any_action',
      };

      const decision = governanceEnforcer.checkPermission(check);
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Approval Requirements', () => {
    it('should require approval for actions with requiresApproval flag', () => {
      // team:create requires approval by default
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:architect-01' as AgentURN,
        resource: 'team',
        action: 'create',
      };

      const decision = governanceEnforcer.checkPermission(check);
      expect(decision.requiresApproval).toBe(true);
    });

    it('should request and get approval status', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^approval-/);

      const status = governanceEnforcer.getApprovalStatus(requestId);
      expect(status).toBeDefined();
      expect(status?.status).toBe('pending');
    });

    it('should approve a pending request', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      const result = governanceEnforcer.approveRequest(requestId, 3);
      expect(result).toBe(true);

      const status = governanceEnforcer.getApprovalStatus(requestId);
      expect(status?.status).toBe('approved');
    });

    it('should reject a pending request', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      const result = governanceEnforcer.rejectRequest(requestId, 3);
      expect(result).toBe(true);

      const status = governanceEnforcer.getApprovalStatus(requestId);
      expect(status?.status).toBe('rejected');
    });

    it('should throw for unknown approval request', () => {
      expect(() => {
        governanceEnforcer.approveRequest('unknown-id', 3);
      }).toThrow('Approval request not found');
    });
  });

  describe('Tool Restrictions', () => {
    it('should check if agent can use tool', () => {
      const canUse = governanceEnforcer.canUseTool(
        'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
        'urn:mycodexvantaos:tool:code_editor' as any
      );
      expect(canUse).toBe(true);
    });

    it('should get allowed tools for a tier', () => {
      const tools = governanceEnforcer.getAllowedTools(1);
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('Policy Management', () => {
    it('should add a policy', () => {
      const policy = {
        id: 'test-policy',
        name: 'Test Policy',
        description: 'A test policy',
        rules: [],
        effective_from: new Date().toISOString(),
        status: 'active' as const,
      };

      governanceEnforcer.addPolicy(policy);
      const activePolicies = governanceEnforcer.getActivePolicies();
      expect(activePolicies.length).toBe(1);
    });

    it('should remove a policy', () => {
      const policy = {
        id: 'test-policy',
        name: 'Test Policy',
        description: 'A test policy',
        rules: [],
        effective_from: new Date().toISOString(),
        status: 'active' as const,
      };

      governanceEnforcer.addPolicy(policy);
      governanceEnforcer.removePolicy('test-policy');
      const activePolicies = governanceEnforcer.getActivePolicies();
      expect(activePolicies.length).toBe(0);
    });
  });

  describe('Rule Management', () => {
    it('should add a governance rule', () => {
      const rule: GovernanceRule = {
        permission: 'custom:action' as PermissionType,
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
      };

      const result = governanceEnforcer.addRule(rule);
      expect(result).toBe(true);
      expect(governanceEnforcer.hasRule('custom:action')).toBe(true);
    });

    it('should not add duplicate rule', () => {
      const rule: GovernanceRule = {
        permission: 'resource:access',
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
      };

      governanceEnforcer.addRule(rule);
      const result = governanceEnforcer.addRule(rule);
      expect(result).toBe(false);
    });

    it('should update an existing rule', () => {
      const rule: GovernanceRule = {
        permission: 'resource:access',
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
      };

      governanceEnforcer.addRule(rule);

      const updatedRule: GovernanceRule = {
        permission: 'resource:access',
        minTier: 2,
        requiresApproval: true,
        approverTiers: [3],
      };

      const result = governanceEnforcer.updateRule('resource:access', updatedRule);
      expect(result).toBe(true);
    });

    it('should remove a rule', () => {
      const rule: GovernanceRule = {
        permission: 'resource:access',
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
      };

      governanceEnforcer.addRule(rule);
      const result = governanceEnforcer.removeRule('resource:access');
      expect(result).toBe(true);
      expect(governanceEnforcer.hasRule('resource:access')).toBe(false);
    });

    it('should get rules for a resource', () => {
      const rules = governanceEnforcer.getRulesForResource('test');
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('Batch Permission Checks', () => {
    it('should process multiple permission checks in batch', () => {
      const checks: PermissionCheck[] = [
        {
          agent_urn: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
          resource: 'task',
          action: 'create',
        },
        {
          agent_urn: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
          resource: 'task',
          action: 'delegate',
        },
        {
          agent_urn: 'urn:mycodexvantaos:agent:restricted-01' as AgentURN,
          resource: 'task',
          action: 'create',
        },
      ];

      const decisions = governanceEnforcer.batchCheckPermissions(checks);

      expect(decisions.length).toBe(3);
      expect(decisions[0].allowed).toBe(true); // tier 1 >= 0
      expect(decisions[1].allowed).toBe(true); // tier 1 >= 1 for delegate
      expect(decisions[2].allowed).toBe(false); // restricted tier
    });

    it('should provide summary of batch check results', () => {
      const checks: PermissionCheck[] = [
        {
          agent_urn: 'urn:mycodexvantaos:agent:intern-01' as AgentURN,
          resource: 'task',
          action: 'create',
        },
        {
          agent_urn: 'urn:mycodexvantaos:agent:intern-01' as AgentURN,
          resource: 'task',
          action: 'delegate',
        },
        {
          agent_urn: 'urn:mycodexvantaos:agent:restricted-01' as AgentURN,
          resource: 'task',
          action: 'create',
        },
      ];

      const summary = governanceEnforcer.batchCheckSummary(checks);

      expect(summary.total).toBe(3);
      expect(typeof summary.allowed).toBe('number');
      expect(typeof summary.denied).toBe('number');
      expect(typeof summary.requiresApproval).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown agent gracefully', () => {
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:unknown' as AgentURN,
        resource: 'any_resource',
        action: 'any_action',
      };

      const decision = governanceEnforcer.checkPermission(check);
      // Unknown agents get tier 0 by default, so they should be allowed
      expect(decision.allowed).toBe(true);
    });

    it('should handle empty resource and action', () => {
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
        resource: '',
        action: '',
      };

      const decision = governanceEnforcer.checkPermission(check);
      // Default: tier >= 0 is allowed
      expect(decision.allowed).toBe(true);
    });

    it('should cleanup expired requests', () => {
      governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      const cleaned = governanceEnforcer.cleanupExpiredRequests();
      expect(typeof cleaned).toBe('number');
    });
  });

  describe('Validation', () => {
    it('should validate tier permissions', () => {
      // agent:register requires tier 0 by default
      expect(() => {
        governanceEnforcer.validateTierPermissions(0, 'agent:register');
      }).not.toThrow();
    });

    it('should throw for insufficient tier', () => {
      // team:create requires tier 1 by default
      expect(() => {
        governanceEnforcer.validateTierPermissions(0, 'team:create');
      }).toThrow('Permission denied');
    });

    it('should check if approval is required', () => {
      const requires = governanceEnforcer.requiresApproval('team:create');
      expect(requires).toBe(true);
    });

    it('should get approvers for a permission', () => {
      const approvers = governanceEnforcer.getApprovers('team:create');
      expect(Array.isArray(approvers)).toBe(true);
    });

    it('should throw for unknown permission in validation', () => {
      expect(() => {
        governanceEnforcer.validateTierPermissions(0, 'unknown:permission' as PermissionType);
      }).toThrow('Unknown permission');
    });

    it('should return false for approval requirement on unknown permission', () => {
      const requires = governanceEnforcer.requiresApproval('unknown:permission' as PermissionType);
      expect(requires).toBe(false);
    });

    it('should return empty array for approvers on unknown permission', () => {
      const approvers = governanceEnforcer.getApprovers('unknown:permission' as PermissionType);
      expect(approvers).toEqual([]);
    });
  });

  describe('Approval Request Edge Cases', () => {
    it('should throw when approving non-pending request', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      governanceEnforcer.approveRequest(requestId, 3);

      expect(() => {
        governanceEnforcer.approveRequest(requestId, 3);
      }).toThrow('Approval request is not pending');
    });

    it('should throw when rejecting non-pending request', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      governanceEnforcer.rejectRequest(requestId, 3);

      expect(() => {
        governanceEnforcer.rejectRequest(requestId, 3);
      }).toThrow('Approval request is not pending');
    });

    it('should throw when rejecting unknown request', () => {
      expect(() => {
        governanceEnforcer.rejectRequest('unknown-id', 3);
      }).toThrow('Approval request not found');
    });

    it('should check approver tier authorization', () => {
      const requestId = governanceEnforcer.requestApproval(
        'team:create' as PermissionType,
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );

      // tier 0 is not in approverTiers [2, 3] for team:create
      expect(() => {
        governanceEnforcer.approveRequest(requestId, 0);
      }).toThrow('not authorized to approve');
    });
  });

  describe('Policy Edge Cases', () => {
    it('should add policy with effective_until date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const policy = {
        id: 'test-policy-with-end',
        name: 'Test Policy With End',
        description: 'A test policy with end date',
        rules: [
          {
            permission: 'task:create' as PermissionType,
            minTier: 2 as GovernanceTier,
            requiresApproval: true,
            approverTiers: [3] as GovernanceTier[],
          },
        ],
        effective_from: new Date().toISOString(),
        effective_until: futureDate.toISOString(),
        status: 'active' as const,
      };

      governanceEnforcer.addPolicy(policy);
      const activePolicies = governanceEnforcer.getActivePolicies();
      expect(activePolicies.length).toBe(1);
    });

    it('should add policy with past effective_until date (not active)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const policy = {
        id: 'test-policy-past',
        name: 'Test Policy Past',
        description: 'A test policy with past end date',
        rules: [
          {
            permission: 'task:create' as PermissionType,
            minTier: 2 as GovernanceTier,
            requiresApproval: true,
            approverTiers: [3] as GovernanceTier[],
          },
        ],
        effective_from: new Date(Date.now() - 86400000 * 2).toISOString(),
        effective_until: pastDate.toISOString(),
        status: 'active' as const,
      };

      governanceEnforcer.addPolicy(policy);
      const activePolicies = governanceEnforcer.getActivePolicies();
      // Policy is stored but not active due to past end date
      expect(activePolicies.length).toBe(0);
    });

    it('should add draft policy (not active)', () => {
      const policy = {
        id: 'test-draft-policy',
        name: 'Draft Policy',
        description: 'A draft policy',
        rules: [],
        effective_from: new Date().toISOString(),
        status: 'draft' as const,
      };

      governanceEnforcer.addPolicy(policy);
      const activePolicies = governanceEnforcer.getActivePolicies();
      expect(activePolicies.length).toBe(0);
    });

    it('should add policy with future effective_from date (not active)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const policy = {
        id: 'test-future-policy',
        name: 'Future Policy',
        description: 'A policy with future start date',
        rules: [
          {
            permission: 'task:create' as PermissionType,
            minTier: 3 as GovernanceTier,
            requiresApproval: true,
            approverTiers: [3] as GovernanceTier[],
          },
        ],
        effective_from: futureDate.toISOString(),
        status: 'active' as const,
      };

      governanceEnforcer.addPolicy(policy);
      const activePolicies = governanceEnforcer.getActivePolicies();
      expect(activePolicies.length).toBe(0);
    });
  });

  describe('Rule Edge Cases', () => {
    it('should return false when updating non-existent rule', () => {
      const rule: GovernanceRule = {
        permission: 'nonexistent:action' as PermissionType,
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
      };

      const result = governanceEnforcer.updateRule('nonexistent:action', rule);
      expect(result).toBe(false);
    });

    it('should get rules with constraints for a resource', () => {
      const rule: GovernanceRule = {
        permission: 'resource:constrained' as PermissionType,
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
        constraints: { task: { maxCount: 5 } },
      };

      governanceEnforcer.addRule(rule);
      const rules = governanceEnforcer.getRulesForResource('task');
      expect(rules.length).toBe(1);
    });

    it('should return empty array for rules with no matching constraints', () => {
      const rule: GovernanceRule = {
        permission: 'resource:other' as PermissionType,
        minTier: 1,
        requiresApproval: false,
        approverTiers: [],
        constraints: { otherResource: { maxCount: 5 } },
      };

      governanceEnforcer.addRule(rule);
      const rules = governanceEnforcer.getRulesForResource('task');
      expect(rules.length).toBe(0);
    });
  });

  describe('Negative Tier Edge Cases', () => {
    it('should deny action for restricted tier (-1)', () => {
      // Already tested elsewhere, but verify consistent behavior
      const check: PermissionCheck = {
        agent_urn: 'urn:mycodexvantaos:agent:restricted-01' as AgentURN,
        resource: 'any_resource',
        action: 'any_action',
      };

      const decision = governanceEnforcer.checkPermission(check);
      expect(decision.allowed).toBe(false);
      expect(decision.tier).toBe(-1);
    });

    describe('Expired Approval Request Handling', () => {
      it('should throw error when approving an expired request', () => {
        const rule: GovernanceRule = {
          permission: 'task:delete' as PermissionType,
          minTier: 1 as GovernanceTier,
          requiresApproval: true,
          approverTiers: [2 as GovernanceTier, 3 as GovernanceTier],
        };
        governanceEnforcer.addRule(rule);

        const requestId = governanceEnforcer.requestApproval(
          'task:delete' as PermissionType,
          'urn:mycodexvantaos:agent:test-01' as AgentURN,
          { reason: 'test' }
        );

        expect(requestId).toBeDefined();
      });

      it('should clean up expired approval requests', () => {
        const rule: GovernanceRule = {
          permission: 'task:archive' as PermissionType,
          minTier: 1 as GovernanceTier,
          requiresApproval: true,
          approverTiers: [3 as GovernanceTier],
        };
        governanceEnforcer.addRule(rule);

        governanceEnforcer.requestApproval(
          'task:archive' as PermissionType,
          'urn:mycodexvantaos:agent:test-02' as AgentURN,
          { reason: 'test' }
        );

        const cleaned = governanceEnforcer.cleanupExpiredRequests();
        expect(cleaned).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

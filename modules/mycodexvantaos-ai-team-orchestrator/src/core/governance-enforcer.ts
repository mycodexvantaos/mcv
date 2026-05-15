/**
 * GovernanceEnforcer - Enforces governance rules and policies
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import type { AgentProfile, AgentURN, GovernanceTier, ToolURN, TaskURN } from '../types';

/**
 * Permission types for governance checks
 */
export type PermissionType =
  | 'agent:register'
  | 'agent:activate'
  | 'agent:tool:call'
  | 'task:create'
  | 'task:assign'
  | 'task:delegate'
  | 'team:create'
  | 'team:modify'
  | 'workflow:execute'
  | 'hitl:approve'
  | 'hitl:reject'
  | 'resource:access'
  | 'external:communicate';

/**
 * Permission rule definition
 */
export interface PermissionRule {
  permission: PermissionType;
  minTier: GovernanceTier;
  requiresApproval: boolean;
  approverTiers: GovernanceTier[];
  constraints?: Record<string, unknown>;
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  id: string;
  permission: PermissionType;
  requester_id: AgentURN;
  target_id?: string;
  context?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
}

/**
 * Permission check request
 */
export interface PermissionCheck {
  agent_urn: AgentURN;
  resource: string;
  action: string;
}

/**
 * Governance decision result
 */
export interface GovernanceDecision {
  allowed: boolean;
  reason: string;
  tier?: GovernanceTier;
  requiresApproval?: boolean;
}

/**
 * Governance rule (alias for PermissionRule for backward compatibility)
 */
export type GovernanceRule = PermissionRule;

/**
 * Governance policy definition
 */
export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  rules: PermissionRule[];
  effective_from: string;
  effective_until?: string;
  status: 'draft' | 'active' | 'deprecated';
}

/**
 * Default permission rules by tier
 */
const DEFAULT_PERMISSION_RULES: PermissionRule[] = [
  // Agent operations
  { permission: 'agent:register', minTier: 0, requiresApproval: false, approverTiers: [] },
  { permission: 'agent:activate', minTier: -1, requiresApproval: true, approverTiers: [1, 2, 3] },
  { permission: 'agent:tool:call', minTier: 0, requiresApproval: false, approverTiers: [] },

  // Task operations
  { permission: 'task:create', minTier: 0, requiresApproval: false, approverTiers: [] },
  { permission: 'task:assign', minTier: 0, requiresApproval: false, approverTiers: [] },
  { permission: 'task:delegate', minTier: 1, requiresApproval: false, approverTiers: [] },

  // Team operations
  { permission: 'team:create', minTier: 1, requiresApproval: true, approverTiers: [2, 3] },
  { permission: 'team:modify', minTier: 1, requiresApproval: true, approverTiers: [2, 3] },

  // Workflow operations
  { permission: 'workflow:execute', minTier: 0, requiresApproval: false, approverTiers: [] },

  // HITL operations
  { permission: 'hitl:approve', minTier: 1, requiresApproval: false, approverTiers: [] },
  { permission: 'hitl:reject', minTier: 1, requiresApproval: false, approverTiers: [] },

  // Resource and external access
  { permission: 'resource:access', minTier: 0, requiresApproval: false, approverTiers: [] },
  { permission: 'external:communicate', minTier: 1, requiresApproval: true, approverTiers: [2, 3] },
];

/**
 * Restricted tools by governance tier
 */
const RESTRICTED_TOOLS_BY_TIER: Record<GovernanceTier, ToolURN[]> = {
  [-1]: [], // Experimental - no tools directly (must request)
  0: [], // Standard - all standard tools
  1: [], // Elevated - standard tools
  2: [], // High - standard tools
  3: [], // Critical - all tools
};

export class GovernanceEnforcer {
  private policies: Map<string, GovernancePolicy> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private permissionRules: Map<PermissionType, PermissionRule> = new Map();
  private agentTiers: Map<AgentURN, GovernanceTier> = new Map();

  constructor() {
    // Initialize with default permission rules
    for (const rule of DEFAULT_PERMISSION_RULES) {
      this.permissionRules.set(rule.permission, rule);
    }
  }

  // ============================================================================
  // Tier Validation
  // ============================================================================

  /**
   * Validate if an operation is permitted for a governance tier
   * @param tier - The governance tier
   * @param permission - The permission to check
   * @returns true if permitted
   * @throws Error if not permitted
   */
  public validateTierPermissions(tier: GovernanceTier, permission: PermissionType): boolean {
    const rule = this.permissionRules.get(permission);

    if (!rule) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (tier < rule.minTier) {
      throw new Error(
        `Permission denied: ${permission} requires tier ${rule.minTier}, but agent has tier ${tier}`
      );
    }

    return true;
  }

  /**
   * Check if approval is required for an operation
   * @param permission - The permission to check
   * @returns true if approval is required
   */
  public requiresApproval(permission: PermissionType): boolean {
    const rule = this.permissionRules.get(permission);
    return rule?.requiresApproval ?? false;
  }

  /**
   * Get approvers for a permission
   * @param permission - The permission to check
   * @returns Array of governance tiers that can approve
   */
  public getApprovers(permission: PermissionType): GovernanceTier[] {
    const rule = this.permissionRules.get(permission);
    return rule?.approverTiers ?? [];
  }

  // ============================================================================
  // Agent Registration
  // ============================================================================

  /**
   * Register an agent's governance tier
   * @param agentId - The agent URN
   * @param tier - The governance tier
   */
  public registerAgentTier(agentId: AgentURN, tier: GovernanceTier): void {
    this.agentTiers.set(agentId, tier);
  }

  /**
   * Unregister an agent's governance tier
   * @param agentId - The agent URN
   */
  public unregisterAgentTier(agentId: AgentURN): void {
    this.agentTiers.delete(agentId);
  }

  /**
   * Get an agent's governance tier
   * @param agentId - The agent URN
   * @returns The governance tier or 0 if not registered
   */
  public getAgentTier(agentId: AgentURN): GovernanceTier {
    return this.agentTiers.get(agentId) ?? 0;
  }

  // ============================================================================
  // Approval Workflow
  // ============================================================================

  /**
   * Request approval for an operation
   * @param permission - The permission requiring approval
   * @param requesterId - The agent requesting approval
   * @param context - Additional context for the request
   * @returns The approval request ID
   */
  public requestApproval(
    permission: PermissionType,
    requesterId: AgentURN,
    context?: Record<string, unknown>
  ): string {
    const requestId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const request: ApprovalRequest = {
      id: requestId,
      permission,
      requester_id: requesterId,
      context,
      status: 'pending',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    this.approvalRequests.set(requestId, request);
    return requestId;
  }

  /**
   * Approve a pending request
   * @param requestId - The approval request ID
   * @param approverTier - The governance tier of the approver
   * @returns true if approval successful
   */
  public approveRequest(requestId: string, approverTier: GovernanceTier): boolean {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Approval request is not pending: ${request.status}`);
    }

    // Check if request has expired
    if (new Date() > new Date(request.expires_at)) {
      request.status = 'expired';
      throw new Error(`Approval request has expired: ${requestId}`);
    }

    // Check if approver has sufficient tier
    const rule = this.permissionRules.get(request.permission);
    if (rule && !rule.approverTiers.includes(approverTier)) {
      throw new Error(
        `Approver tier ${approverTier} is not authorized to approve ${request.permission}`
      );
    }

    request.status = 'approved';
    return true;
  }

  /**
   * Reject a pending request
   * @param requestId - The approval request ID
   * @param approverTier - The governance tier of the rejecter
   * @returns true if rejection successful
   */
  public rejectRequest(requestId: string, approverTier: GovernanceTier): boolean {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Approval request is not pending: ${request.status}`);
    }

    request.status = 'rejected';
    return true;
  }

  /**
   * Get approval request status
   * @param requestId - The approval request ID
   * @returns The approval request or undefined
   */
  public getApprovalStatus(requestId: string): ApprovalRequest | undefined {
    return this.approvalRequests.get(requestId);
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  /**
   * Add a governance policy
   * @param policy - The policy to add
   */
  public addPolicy(policy: GovernancePolicy): void {
    if (policy.status === 'active') {
      // Check effective dates
      const now = new Date();
      const effectiveFrom = new Date(policy.effective_from);
      const effectiveUntil = policy.effective_until ? new Date(policy.effective_until) : null;

      if (now >= effectiveFrom && (!effectiveUntil || now <= effectiveUntil)) {
        // Apply policy rules
        for (const rule of policy.rules) {
          this.permissionRules.set(rule.permission, rule);
        }
      }
    }

    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a governance policy
   * @param policyId - The policy ID to remove
   */
  public removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Get all active policies
   * @returns Array of active policies
   */
  public getActivePolicies(): GovernancePolicy[] {
    const now = new Date();
    return Array.from(this.policies.values()).filter((policy) => {
      if (policy.status !== 'active') return false;
      const effectiveFrom = new Date(policy.effective_from);
      const effectiveUntil = policy.effective_until ? new Date(policy.effective_until) : null;
      return now >= effectiveFrom && (!effectiveUntil || now <= effectiveUntil);
    });
  }

  // ============================================================================
  // Tool Restrictions
  // ============================================================================

  /**
   * Check if an agent can use a specific tool
   * @param agentId - The agent URN
   * @param toolId - The tool URN
   * @returns true if tool is allowed
   */
  public canUseTool(agentId: AgentURN, toolId: ToolURN): boolean {
    const tier = this.getAgentTier(agentId);
    const restrictedTools = RESTRICTED_TOOLS_BY_TIER[tier] ?? [];
    return !restrictedTools.includes(toolId);
  }

  /**
   * Get allowed tools for a governance tier
   * @param tier - The governance tier
   * @returns Array of allowed tool URNs
   */
  public getAllowedTools(tier: GovernanceTier): ToolURN[] {
    // Return allowed tools based on tier
    // In a real implementation, this would query a tool registry
    return [];
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up expired approval requests
   */
  public cleanupExpiredRequests(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, request] of this.approvalRequests) {
      if (request.status === 'pending' && now > new Date(request.expires_at)) {
        request.status = 'expired';
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear all governance data
   */
  public clear(): void {
    this.policies.clear();
    this.approvalRequests.clear();
    this.agentTiers.clear();
    this.permissionRules.clear();

    // Re-initialize with default rules
    for (const rule of DEFAULT_PERMISSION_RULES) {
      this.permissionRules.set(rule.permission, rule);
    }
  }

  // ============================================================================
  // Permission Check Methods
  // ============================================================================

  /**
   * Check if an agent has permission to perform an action
   * @param check - The permission check request
   * @returns GovernanceDecision with allowed status and reason
   */
  public checkPermission(check: PermissionCheck): GovernanceDecision {
    const agentTier = this.getAgentTier(check.agent_urn);

    // Restricted tier (-1) agents are denied all actions
    if (agentTier === -1) {
      return {
        allowed: false,
        reason: `Agent ${check.agent_urn} is restricted and cannot perform any actions`,
        tier: agentTier,
      };
    }

    // Map resource:action to permission type
    const permissionKey = `${check.resource}:${check.action}` as PermissionType;
    const rule = this.permissionRules.get(permissionKey);

    // Check if we have a specific rule for this permission
    if (rule) {
      const hasPermission = agentTier >= rule.minTier;
      return {
        allowed: hasPermission,
        reason: hasPermission
          ? `Agent has sufficient tier (${agentTier}) for ${check.action} on ${check.resource}`
          : `Agent has insufficient tier (${agentTier}) for ${check.action} on ${check.resource}. Required: ${rule.minTier}`,
        tier: agentTier,
        requiresApproval: rule.requiresApproval,
      };
    }

    // Default: allow if tier >= 0, deny otherwise
    return {
      allowed: agentTier >= 0,
      reason:
        agentTier >= 0
          ? `Agent has sufficient tier (${agentTier}) for ${check.action} on ${check.resource}`
          : `Agent has insufficient tier (${agentTier}) for ${check.action} on ${check.resource}`,
      tier: agentTier,
    };
  }

  /**
   * Batch check multiple permissions at once
   * @param checks - Array of permission check requests
   * @returns Array of GovernanceDecision results
   */
  public batchCheckPermissions(checks: PermissionCheck[]): GovernanceDecision[] {
    return checks.map((check) => this.checkPermission(check));
  }

  /**
   * Get a summary of batch permission checks
   * @param checks - Array of permission check requests
   * @returns Summary object with allowed, denied, and requiresApproval counts
   */
  public batchCheckSummary(checks: PermissionCheck[]): {
    total: number;
    allowed: number;
    denied: number;
    requiresApproval: number;
  } {
    const decisions = this.batchCheckPermissions(checks);
    return {
      total: decisions.length,
      allowed: decisions.filter((d) => d.allowed).length,
      denied: decisions.filter((d) => !d.allowed).length,
      requiresApproval: decisions.filter((d) => d.requiresApproval).length,
    };
  }

  // ============================================================================
  // Rule Management Methods
  // ============================================================================

  /**
   * Add a governance rule
   * @param rule - The rule to add
   * @returns true if added successfully
   */
  public addRule(rule: GovernanceRule): boolean {
    if (this.permissionRules.has(rule.permission)) {
      return false;
    }
    this.permissionRules.set(rule.permission, rule);
    return true;
  }

  /**
   * Update an existing rule
   * @param ruleId - The rule ID to update
   * @param rule - The new rule data
   * @returns true if updated successfully
   */
  public updateRule(ruleId: string, rule: GovernanceRule): boolean {
    if (!this.permissionRules.has(rule.permission)) {
      return false;
    }
    this.permissionRules.set(rule.permission, rule);
    return true;
  }

  /**
   * Remove a rule
   * @param ruleId - The rule ID to remove
   * @returns true if removed successfully
   */
  public removeRule(ruleId: string): boolean {
    // Find and remove the rule
    for (const [permission, rule] of this.permissionRules) {
      if (rule.permission === ruleId) {
        this.permissionRules.delete(permission);
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a rule exists
   * @param ruleId - The rule ID to check
   * @returns true if rule exists
   */
  public hasRule(ruleId: string): boolean {
    for (const rule of this.permissionRules.values()) {
      if (rule.permission === ruleId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all rules for a resource
   * @param resource - The resource to get rules for
   * @returns Array of rules applicable to the resource
   */
  public getRulesForResource(resource: string): GovernanceRule[] {
    const rules: GovernanceRule[] = [];
    for (const rule of this.permissionRules.values()) {
      if (rule.constraints && rule.constraints[resource]) {
        rules.push(rule);
      }
    }
    return rules;
  }
}

export default GovernanceEnforcer;

/**
 * MyCodeXvantaOS — Policy Definition Model
 * "Who can do what, under what conditions, to what resources?"
 * RBAC + ABAC policy engine with allow/deny rules.
 */

import type { Role, Tier } from '../service-catalog/service-definition';

/** Policy effect */
export type PolicyEffect = 'allow' | 'deny';

/** Policy subject — who is acting */
export interface PolicySubject {
  role?: Role;
  subjectId?: string;
  workspaceScope?: 'same-workspace' | 'any-workspace' | 'platform';
  tier?: Tier;
}

/** Policy action — what they're trying to do */
export interface PolicyAction {
  serviceId: string;
  action: string;
}

/** Policy resource — what they're acting on */
export interface PolicyResource {
  kind: string;
  id?: string;
  scope: 'workspace' | 'platform' | 'global';
}

/** Policy condition — additional constraints */
export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'lt' | 'gt' | 'lte' | 'gte' | 'exists';
  value: unknown;
}

/** A single policy rule */
export interface PolicyRule {
  id: string;
  urn: string;
  description: string;
  subject: PolicySubject;
  actions: PolicyAction[];
  resources: PolicyResource[];
  conditions: PolicyCondition[];
  effect: PolicyEffect;
  priority: number;
}

/** Policy evaluation result */
export interface PolicyDecision {
  allowed: boolean;
  matchedPolicies: string[];
  deniedBy: string | null;
  conditions: Record<string, unknown>;
  evaluatedAt: string;
}

/** Policy evaluation context */
export interface PolicyEvaluationContext {
  subjectId: string;
  workspaceId: string;
  role: Role;
  action: string;
  resourceKind: string;
  resourceScope: 'workspace' | 'platform';
  tier: Tier;
}

/** Standard permission actions per category */
export const STANDARD_ACTIONS: Record<string, string[]> = {
  knowledge: ['knowledge-store:read', 'knowledge-store:write', 'knowledge-search:execute', 'knowledge-ingestion:execute'],
  agent: ['agent-chat:execute', 'agent-router:execute', 'agent-mode:switch'],
  workspace: ['workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete', 'workspace:manage-members'],
  developer: ['developer-api:read', 'developer-token:create', 'developer-webhook:register'],
  security: ['identity:read', 'identity:write', 'access-policy:read', 'access-policy:write', 'audit-log:read'],
  storage: ['storage-object:read', 'storage-object:write', 'storage-cache:read', 'storage-cache:write'],
  model: ['model-byok:read', 'model-byok:write', 'model-byok:execute', 'model-byok:admin'],
  automation: ['automation-job:create', 'automation-job:read', 'automation-job:execute'],
};

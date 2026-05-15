/**
 * Core type definitions for MyCodeXvantaOS AI Team Orchestrator
 * @module @mycodexvantaos/ai-team-orchestrator/types
 */

// ============================================================================
// URN Types
// ============================================================================

/**
 * Base URN type for all MyCodeXvantaOS entities
 */
export type URN = `urn:mycodexvantaos:${string}`;

/**
 * Agent URN type
 */
export type AgentURN = `urn:mycodexvantaos:agent:${string}`;

/**
 * Team URN type
 */
export type TeamURN = `urn:mycodexvantaos:team:${string}`;

/**
 * Task URN type
 */
export type TaskURN = `urn:mycodexvantaos:task:${string}`;

/**
 * Message URN type
 */
export type MessageURN = `urn:mycodexvantaos:message:${string}`;

/**
 * Tool URN type
 */
export type ToolURN = `urn:mycodexvantaos:tool:${string}`;

/**
 * Capability URN type
 */
export type CapabilityURN = `urn:mycodexvantaos:capability:${string}`;

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Supported agent roles in the system
 */
export type AgentRole =
  | 'architect'
  | 'engineer'
  | 'tester'
  | 'reviewer'
  | 'coordinator'
  | 'analyst'
  | 'ethicist'
  | 'blockchain_expert'
  | 'security_specialist'
  | 'devops_engineer'
  | 'data_scientist'
  | 'custom';

/**
 * Agent status values
 */
export type AgentStatus = 'draft' | 'experimental_controlled' | 'active' | 'deprecated' | 'retired';

/**
 * Governance tier levels
 * - -1: Experimental (sandbox only)
 * - 0: Standard (normal operations)
 * - 1: Elevated (cross-module access)
 * - 2: High (sensitive operations)
 * - 3: Critical (core system operations)
 */
export type GovernanceTier = -1 | 0 | 1 | 2 | 3;

/**
 * Behavioral parameters for agent execution
 */
export interface BehavioralParameters {
  creativity_level?: number;
  risk_tolerance?: number;
  verbosity?: 'concise' | 'normal' | 'detailed';
  max_iterations?: number;
}

/**
 * Memory configuration for an agent
 */
export interface MemoryConfiguration {
  short_term_capacity?: number;
  long_term_enabled?: boolean;
  memory_compression_threshold?: number;
}

/**
 * Complete agent profile definition
 */
export interface AgentProfile {
  id: AgentURN;
  name: string;
  version: string;
  role: AgentRole;
  goal: string;
  backstory: string;
  allowed_tools: ToolURN[];
  capabilities?: CapabilityURN[];
  dependencies?: URN[];
  behavioral_parameters?: BehavioralParameters;
  memory_configuration?: MemoryConfiguration;
  governance_tier?: GovernanceTier;
  status: AgentStatus;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Team Types
// ============================================================================

/**
 * Supported topology types for agent communication
 */
export type TopologyType =
  | 'sequential'
  | 'hierarchical'
  | 'broadcast'
  | 'mesh'
  | 'dag'
  | 'state_machine';

/**
 * Message routing strategies
 */
export type MessageRouting = 'direct' | 'broadcast' | 'round_robin' | 'priority';

/**
 * Agent assignment within a team
 */
export interface TeamAgentAssignment {
  agent_id: AgentURN;
  position: number;
  role_override?: string;
  delegation_scope?: string[];
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  max_retries: number;
  backoff_ms: number;
}

/**
 * Communication rules for team
 */
export interface CommunicationRules {
  message_routing?: MessageRouting;
  max_concurrent_messages?: number;
  message_timeout_ms?: number;
  retry_policy?: RetryPolicy;
}

/**
 * Workflow node definition
 */
export interface WorkflowNode {
  id: string;
  agent_id: AgentURN;
  action?: string;
  on_success?: string;
  on_failure?: string;
}

/**
 * Workflow edge definition
 */
export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

/**
 * Workflow definition (DAG or State Machine)
 */
export interface WorkflowDefinition {
  type: 'dag' | 'state_machine';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  initial_state?: string;
  final_states?: string[];
}

/**
 * HITL checkpoint configuration
 */
export interface HITLCheckpoint {
  node_id: string;
  trigger_condition: 'always' | 'on_error' | 'on_threshold' | 'manual';
  timeout_seconds?: number;
  notification_channels?: string[];
}

/**
 * Human-in-the-loop configuration
 */
export interface HITLConfig {
  enabled: boolean;
  checkpoints?: HITLCheckpoint[];
  approval_required_for?: string[];
}

/**
 * Complete team topology definition
 */
export interface TeamTopology {
  id: TeamURN;
  name: string;
  version: string;
  topology_type: TopologyType;
  agents: TeamAgentAssignment[];
  communication_rules?: CommunicationRules;
  workflow_definition?: WorkflowDefinition;
  hitl_config?: HITLConfig;
  status?: 'draft' | 'active' | 'deprecated';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Task status values
 */
export type TaskStatus =
  | 'pending'
  | 'decomposing'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Task result status
 */
export type TaskResultStatus = 'success' | 'partial' | 'failure';

/**
 * Reference to external resource
 */
export interface TaskReference {
  type: 'document' | 'code' | 'url' | 'artifact';
  uri: string;
}

/**
 * Task context information
 */
export interface TaskContext {
  background?: string;
  constraints?: string[];
  references?: TaskReference[];
  variables?: Record<string, unknown>;
}

/**
 * Task dependency definition
 */
export interface TaskDependency {
  subtask_id: TaskURN;
  depends_on: TaskURN[];
}

/**
 * Task decomposition configuration
 */
export interface TaskDecomposition {
  strategy: 'sequential' | 'parallel' | 'hybrid';
  subtasks?: AgentTask[];
  dependencies?: TaskDependency[];
}

/**
 * Task artifact
 */
export interface TaskArtifact {
  type: string;
  uri: string;
  checksum?: string;
}

/**
 * Task execution metrics
 */
export interface TaskMetrics {
  execution_time_ms?: number;
  tokens_used?: number;
  iterations?: number;
}

/**
 * Task result
 */
export interface TaskResult {
  status: TaskResultStatus;
  output?: Record<string, unknown>;
  artifacts?: TaskArtifact[];
  metrics?: TaskMetrics;
}

/**
 * Task error information
 */
export interface TaskError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retry_count?: number;
  recoverable?: boolean;
}

/**
 * Complete task definition
 */
export interface AgentTask {
  id: TaskURN;
  parent_task_id?: TaskURN | null;
  objective: string;
  context?: TaskContext;
  decomposition?: TaskDecomposition;
  assigned_agents?: AgentURN[];
  priority?: TaskPriority;
  status: TaskStatus;
  progress?: number;
  result?: TaskResult;
  error?: TaskError;
  created_at: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  deadline?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Message type enumeration
 */
export type MessageType =
  | 'task_assignment'
  | 'task_update'
  | 'query'
  | 'response'
  | 'notification'
  | 'collaboration_request'
  | 'review_request'
  | 'approval_request'
  | 'error_report'
  | 'status_update'
  | 'context_share'
  | 'tool_call'
  | 'tool_result';

/**
 * Message priority
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Message content
 */
export interface MessageContent {
  type: 'text' | 'structured' | 'tool_call' | 'tool_result' | 'artifact_reference';
  data: string | Record<string, unknown>;
  format?: 'plain' | 'markdown' | 'json' | 'code';
}

/**
 * Tool call information
 */
export interface ToolCall {
  tool_id: ToolURN;
  function_name: string;
  arguments: Record<string, unknown>;
  call_id: string;
}

/**
 * Tool result information
 */
export interface ToolResult {
  call_id: string;
  status: 'success' | 'error' | 'timeout';
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * Context reference
 */
export interface ContextReference {
  type: 'message' | 'artifact' | 'task' | 'external';
  ref_id: string;
}

/**
 * Complete agent message definition
 */
export interface AgentMessage {
  id: MessageURN;
  conversation_id?: string;
  sender_id: AgentURN;
  recipient_id?: AgentURN | null;
  message_type: MessageType;
  content: MessageContent;
  tool_call?: ToolCall;
  tool_result?: ToolResult;
  context_references?: ContextReference[];
  priority?: MessagePriority;
  requires_response?: boolean;
  response_deadline?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Event Types
// ============================================================================

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
 * Orchestrator event types
 */
export type OrchestratorEventType =
  | 'agent:registered'
  | 'agent:unregistered'
  | 'agent:activated'
  | 'agent:deactivated'
  | 'team:created'
  | 'team:updated'
  | 'team:destroyed'
  | 'team:activated'
  | 'team:deactivated'
  | 'task:created'
  | 'task:updated'
  | 'task:completed'
  | 'task:failed'
  | 'task:decomposed'
  | 'message:sent'
  | 'message:received'
  | 'message:timeout'
  | 'message:failed'
  | 'workflow:started'
  | 'workflow:paused'
  | 'workflow:resumed'
  | 'workflow:completed'
  | 'workflow:created'
  | 'workflow:node:started'
  | 'hitl:checkpoint'
  | 'hitl:approved'
  | 'hitl:rejected'
  | 'hitl:timeout'
  | 'orchestrator:initialized'
  | 'orchestrator:shutdown';

/**
 * Base orchestrator event
 */
export interface OrchestratorEvent<T = unknown> {
  type: OrchestratorEventType;
  timestamp: string;
  payload: T;
  correlation_id?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  max_concurrent_tasks?: number;
  default_timeout_ms?: number;
  enable_memory_compression?: boolean;
  max_context_tokens?: number;
  governance_enforcement_enabled?: boolean;
  hitl_default_timeout_seconds?: number;
}

/**
 * Agent instance state
 */
export interface AgentInstanceState {
  profile: AgentProfile;
  status: 'idle' | 'busy' | 'error';
  current_task_id?: TaskURN | null;
  last_activity?: string;
  context_window: unknown[];
}

/**
 * @mycodexvantaos/ai-team-orchestrator
 * Core orchestrator for multi-agent AI teams in MyCodeXvantaOS
 *
 * @packageDocumentation
 */

// Core orchestrator
export { Orchestrator } from './core/orchestrator';

// Core components
export { AgentManager } from './core/agent-manager';
export { MessageBus } from './core/message-bus';
export { GovernanceEnforcer } from './core/governance-enforcer';
export { WorkflowEngine } from './core/workflow-engine';
export { TeamManager } from './core/team-manager';
export { TaskDecomposer } from './core/task-decomposer';

// Re-export types
export type {
  // URN Types
  URN,
  AgentURN,
  TeamURN,
  TaskURN,
  MessageURN,
  ToolURN,
  CapabilityURN,

  // Agent Types
  AgentProfile,
  AgentRole,
  AgentStatus,
  GovernanceTier,
  BehavioralParameters,
  MemoryConfiguration,
  AgentInstanceState,

  // Team Types
  TeamTopology,
  TopologyType,
  TeamAgentAssignment,
  CommunicationRules,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  HITLConfig,
  HITLCheckpoint,

  // Task Types
  AgentTask,
  TaskStatus,
  TaskPriority,
  TaskContext,
  TaskDecomposition,
  TaskResult,
  TaskError,

  // Message Types
  AgentMessage,
  MessageType,
  MessagePriority,
  MessageContent,
  ToolCall,
  ToolResult,

  // Event Types
  OrchestratorEventType,
  OrchestratorEvent,

  // Configuration Types
  OrchestratorConfig,
} from './types';

// Export component-specific types
export type { AgentManagerConfig } from './core/agent-manager';

export type {
  MessageBusConfig,
  MessageBusStats,
  MessageHandler,
  EventHandler,
} from './core/message-bus';

export type {
  PermissionType,
  PermissionRule,
  ApprovalRequest,
  GovernancePolicy,
} from './core/governance-enforcer';

export type {
  WorkflowStatus,
  NodeStatus,
  WorkflowContext,
  WorkflowState,
  NodeResult,
  HITLCheckpointResult,
  WorkflowEngineConfig,
} from './core/workflow-engine';

export type {
  TeamInstanceState,
  TeamCreationOptions,
  TeamManagerConfig,
} from './core/team-manager';

export type {
  DecompositionStrategy,
  DecompositionRule,
  DecompositionResult,
  TaskTemplate,
  TaskDecomposerConfig,
} from './core/task-decomposer';

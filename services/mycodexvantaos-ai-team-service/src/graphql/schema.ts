/**
 * GraphQL schema for AI Team Service
 * @module @mycodexvantaos/ai-team-service/graphql
 */

import gql from 'graphql-tag';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Orchestrator } from '@mycodexvantaos/ai-team-orchestrator';

/**
 * Type definitions
 */
const typeDefs = gql`
  # ============================================================================
  # Scalars
  # ============================================================================

  scalar JSON
  scalar DateTime

  # ============================================================================
  # Enums
  # ============================================================================

  enum AgentRole {
    ARCHITECT
    ENGINEER
    TESTER
    REVIEWER
    COORDINATOR
    ANALYST
    ETHICIST
    BLOCKCHAIN_EXPERT
    SECURITY_SPECIALIST
    DEVOPS_ENGINEER
    DATA_SCIENTIST
    CUSTOM
  }

  enum AgentStatus {
    DRAFT
    EXPERIMENTAL_CONTROLLED
    ACTIVE
    DEPRECATED
    RETIRED
  }

  enum GovernanceTier {
    EXPERIMENTAL
    STANDARD
    ELEVATED
    HIGH
    CRITICAL
  }

  enum TopologyType {
    SEQUENTIAL
    HIERARCHICAL
    BROADCAST
    MESH
    DAG
    STATE_MACHINE
  }

  enum TaskStatus {
    PENDING
    DECOMPOSING
    ASSIGNED
    IN_PROGRESS
    BLOCKED
    REVIEWING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum TaskPriority {
    LOW
    NORMAL
    HIGH
    CRITICAL
  }

  enum WorkflowStatus {
    PENDING
    RUNNING
    PAUSED
    COMPLETED
    FAILED
    CANCELLED
  }

  # ============================================================================
  # Types
  # ============================================================================

  type BehavioralParameters {
    creativityLevel: Float
    riskTolerance: Float
    verbosity: String
    maxIterations: Int
  }

  type MemoryConfiguration {
    shortTermCapacity: Int
    longTermEnabled: Boolean
    memoryCompressionThreshold: Float
  }

  type AgentProfile {
    id: ID!
    name: String!
    version: String!
    role: AgentRole!
    goal: String!
    backstory: String!
    allowedTools: [String!]!
    capabilities: [String!]
    dependencies: [String!]
    behavioralParameters: BehavioralParameters
    memoryConfiguration: MemoryConfiguration
    governanceTier: Int
    status: AgentStatus!
    metadata: JSON
  }

  type TeamAgentAssignment {
    agentId: ID!
    position: Int!
    roleOverride: String
    delegationScope: [String!]
  }

  type WorkflowNode {
    id: String!
    agentId: ID!
    action: String
    onSuccess: String
    onFailure: String
  }

  type WorkflowEdge {
    from: String!
    to: String!
    condition: String
  }

  type WorkflowDefinition {
    type: String!
    nodes: [WorkflowNode!]!
    edges: [WorkflowEdge!]
    initialState: String
    finalStates: [String!]
  }

  type HITLCheckpoint {
    nodeId: String!
    triggerCondition: String!
    timeoutSeconds: Int
    notificationChannels: [String!]
  }

  type HITLConfig {
    enabled: Boolean!
    checkpoints: [HITLCheckpoint!]
    approvalRequiredFor: [String!]
  }

  type TeamTopology {
    id: ID!
    name: String!
    version: String!
    topologyType: TopologyType!
    agents: [TeamAgentAssignment!]!
    communicationRules: JSON
    workflowDefinition: WorkflowDefinition
    hitlConfig: HITLConfig
    status: String
    metadata: JSON
  }

  type TaskContext {
    background: String
    constraints: [String!]
    references: [JSON!]
    variables: JSON
  }

  type TaskArtifact {
    type: String!
    uri: String!
    checksum: String
  }

  type TaskMetrics {
    executionTimeMs: Int
    tokensUsed: Int
    iterations: Int
  }

  type TaskResult {
    status: String!
    output: JSON
    artifacts: [TaskArtifact!]
    metrics: TaskMetrics
  }

  type TaskError {
    code: String!
    message: String!
    details: JSON
    retryCount: Int
    recoverable: Boolean
  }

  type AgentTask {
    id: ID!
    parentTaskId: ID
    objective: String!
    context: TaskContext
    decomposition: JSON
    assignedAgents: [ID!]
    priority: TaskPriority
    status: TaskStatus!
    progress: Float
    result: TaskResult
    error: TaskError
    createdAt: DateTime!
    updatedAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    deadline: DateTime
    metadata: JSON
  }

  type WorkflowState {
    id: ID!
    status: WorkflowStatus!
    currentNode: String
    visitedNodes: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    startedAt: DateTime
    completedAt: DateTime
  }

  type MessageStats {
    messagesSent: Int!
    messagesDelivered: Int!
    messagesFailed: Int!
    activeSubscriptions: Int!
    queueSize: Int!
  }

  type OrchestratorStats {
    agents: AgentStats!
    teams: TeamStats!
    workflows: WorkflowStats!
    messages: MessageStats!
  }

  type AgentStats {
    total: Int!
    available: Int!
  }

  type TeamStats {
    total: Int!
    active: Int!
  }

  type WorkflowStats {
    total: Int!
  }

  # ============================================================================
  # Inputs
  # ============================================================================

  input AgentProfileInput {
    id: ID!
    name: String!
    version: String!
    role: AgentRole!
    goal: String!
    backstory: String!
    allowedTools: [String!]!
    capabilities: [String!]
    dependencies: [String!]
    behavioralParameters: BehavioralParametersInput
    memoryConfiguration: MemoryConfigurationInput
    governanceTier: Int
    status: AgentStatus
    metadata: JSON
  }

  input BehavioralParametersInput {
    creativityLevel: Float
    riskTolerance: Float
    verbosity: String
    maxIterations: Int
  }

  input MemoryConfigurationInput {
    shortTermCapacity: Int
    longTermEnabled: Boolean
    memoryCompressionThreshold: Float
  }

  input TeamAgentAssignmentInput {
    agentId: ID!
    position: Int!
    roleOverride: String
    delegationScope: [String!]
  }

  input CreateTeamInput {
    name: String!
    topologyType: TopologyType!
    agents: [TeamAgentAssignmentInput!]!
    communicationRules: JSON
    workflowDefinition: WorkflowDefinitionInput
    hitlConfig: HITLConfigInput
    metadata: JSON
  }

  input WorkflowDefinitionInput {
    type: String!
    nodes: [WorkflowNodeInput!]!
    edges: [WorkflowEdgeInput!]
    initialState: String
    finalStates: [String!]
  }

  input WorkflowNodeInput {
    id: String!
    agentId: ID!
    action: String
    onSuccess: String
    onFailure: String
  }

  input WorkflowEdgeInput {
    from: String!
    to: String!
    condition: String
  }

  input HITLConfigInput {
    enabled: Boolean!
    checkpoints: [HITLCheckpointInput!]
    approvalRequiredFor: [String!]
  }

  input HITLCheckpointInput {
    nodeId: String!
    triggerCondition: String!
    timeoutSeconds: Int
    notificationChannels: [String!]
  }

  input CreateTaskInput {
    objective: String!
    context: TaskContextInput
    priority: TaskPriority
    assignedAgents: [ID!]
    deadline: DateTime
  }

  input TaskContextInput {
    background: String
    constraints: [String!]
    references: [JSON!]
    variables: JSON
  }

  # ============================================================================
  # Queries
  # ============================================================================

  type Query {
    # Agents
    agents: [AgentProfile!]!
    agent(id: ID!): AgentProfile
    availableAgents: [AgentProfile!]!
    agentsByRole(role: AgentRole!): [AgentProfile!]!

    # Teams
    teams: [TeamTopology!]!
    team(id: ID!): TeamTopology

    # Workflows
    workflow(id: ID!): WorkflowState

    # Stats
    stats: OrchestratorStats!
  }

  # ============================================================================
  # Mutations
  # ============================================================================

  type Mutation {
    # Agent mutations
    registerAgent(profile: AgentProfileInput!): ID!
    unregisterAgent(id: ID!): Boolean!

    # Team mutations
    createTeam(input: CreateTeamInput!): ID!
    activateTeam(id: ID!): Boolean!
    deactivateTeam(id: ID!): Boolean!
    destroyTeam(id: ID!): Boolean!
    addAgentToTeam(teamId: ID!, agentId: ID!, position: Int): Boolean!
    removeAgentFromTeam(teamId: ID!, agentId: ID!): Boolean!

    # Task mutations
    createTask(input: CreateTaskInput!): ID!
    assignTask(taskId: ID!, agentId: ID!): Boolean!

    # Workflow mutations
    startWorkflow(teamId: ID!, variables: JSON): ID!
    pauseWorkflow(id: ID!): Boolean!
    resumeWorkflow(id: ID!): Boolean!
    cancelWorkflow(id: ID!): Boolean!

    # HITL mutations
    approveCheckpoint(workflowId: ID!, nodeId: String!, approver: String): Boolean!
    rejectCheckpoint(workflowId: ID!, nodeId: String!, reason: String): Boolean!
  }

  # ============================================================================
  # Subscriptions
  # ============================================================================

  type Subscription {
    onAgentEvent: AgentEvent!
    onTeamEvent: TeamEvent!
    onTaskEvent: TaskEvent!
    onWorkflowEvent: WorkflowEvent!
    onHITLEvent: HITLEvent!
  }

  type AgentEvent {
    type: String!
    agentId: ID!
    timestamp: DateTime!
    data: JSON
  }

  type TeamEvent {
    type: String!
    teamId: ID!
    timestamp: DateTime!
    data: JSON
  }

  type TaskEvent {
    type: String!
    taskId: ID!
    timestamp: DateTime!
    data: JSON
  }

  type WorkflowEvent {
    type: String!
    workflowId: ID!
    timestamp: DateTime!
    data: JSON
  }

  type HITLEvent {
    type: String!
    workflowId: ID!
    nodeId: String!
    timestamp: DateTime!
    data: JSON
  }
`;

/**
 * Resolvers
 */
const resolvers = {
  Query: {
    agents: (_: unknown, __: unknown, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getAllAgents();
    },
    agent: (_: unknown, { id }: { id: string }, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getAgent(id as any);
    },
    availableAgents: (_: unknown, __: unknown, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getAvailableAgents();
    },
    agentsByRole: (
      _: unknown,
      { role }: { role: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.getAgentsByRole(role);
    },
    teams: (_: unknown, __: unknown, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getAllTeams();
    },
    team: (_: unknown, { id }: { id: string }, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getTeam(id as any);
    },
    workflow: (_: unknown, { id }: { id: string }, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getWorkflow(id);
    },
    stats: (_: unknown, __: unknown, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.getStats();
    },
  },

  Mutation: {
    registerAgent: (
      _: unknown,
      { profile }: { profile: any },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.registerAgent(profile);
    },
    unregisterAgent: (
      _: unknown,
      { id }: { id: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.unregisterAgent(id as any);
    },
    createTeam: (
      _: unknown,
      { input }: { input: any },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.createTeam({
        name: input.name,
        topology_type: input.topologyType?.toLowerCase(),
        agents: input.agents?.map((a: any) => ({
          agent_id: a.agentId,
          position: a.position,
          role_override: a.roleOverride,
          delegation_scope: a.delegationScope,
        })),
        communication_rules: input.communicationRules,
        workflow_definition: input.workflowDefinition,
        hitl_config: input.hitlConfig,
        metadata: input.metadata,
      });
    },
    activateTeam: (_: unknown, { id }: { id: string }, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.activateTeam(id as any);
    },
    deactivateTeam: (
      _: unknown,
      { id }: { id: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.deactivateTeam(id as any);
    },
    destroyTeam: (_: unknown, { id }: { id: string }, context: { orchestrator: Orchestrator }) => {
      return context.orchestrator.destroyTeam(id as any);
    },
    addAgentToTeam: (
      _: unknown,
      { teamId, agentId, position }: { teamId: string; agentId: string; position?: number },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.addAgentToTeam(teamId as any, agentId as any, position);
    },
    removeAgentFromTeam: (
      _: unknown,
      { teamId, agentId }: { teamId: string; agentId: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.removeAgentFromTeam(teamId as any, agentId as any);
    },
    createTask: (
      _: unknown,
      { input }: { input: any },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.createTask(input.objective, {
        context: input.context,
        priority: input.priority?.toLowerCase(),
        assigned_agents: input.assignedAgents,
        deadline: input.deadline,
      });
    },
    assignTask: (
      _: unknown,
      { taskId, agentId }: { taskId: string; agentId: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.assignTask(agentId as any, taskId as any);
    },
    startWorkflow: (
      _: unknown,
      { teamId, variables }: { teamId: string; variables?: Record<string, unknown> },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.startWorkflow(teamId as any, variables);
    },
    pauseWorkflow: (
      _: unknown,
      { id }: { id: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.pauseWorkflow(id);
    },
    resumeWorkflow: (
      _: unknown,
      { id }: { id: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.resumeWorkflow(id);
    },
    cancelWorkflow: (
      _: unknown,
      { id }: { id: string },
      context: { orchestrator: Orchestrator }
    ) => {
      return context.orchestrator.cancelWorkflow(id);
    },
    approveCheckpoint: (
      _: unknown,
      { workflowId, nodeId, approver }: { workflowId: string; nodeId: string; approver?: string },
      context: { orchestrator: Orchestrator }
    ) => {
      context.orchestrator.approveHITLCheckpoint(workflowId, nodeId, approver);
      return true;
    },
    rejectCheckpoint: (
      _: unknown,
      { workflowId, nodeId, reason }: { workflowId: string; nodeId: string; reason?: string },
      context: { orchestrator: Orchestrator }
    ) => {
      context.orchestrator.rejectHITLCheckpoint(workflowId, nodeId, reason);
      return true;
    },
  },
};

/**
 * Executable schema
 */
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

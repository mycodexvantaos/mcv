/**
 * WorkflowEngine - DAG and State Machine based workflow execution
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  AgentURN,
  TaskURN,
  HITLConfig,
  HITLCheckpoint,
  TeamTopology,
  AgentTask,
} from '../types';
import { MessageBus } from './message-bus';

/**
 * Workflow execution status
 */
export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Node execution status
 */
export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  workflow_id: string;
  team_id: string;
  current_node: string | null;
  visited_nodes: string[];
  variables: Record<string, unknown>;
  results: Map<string, NodeResult>;
  errors: Map<string, Error>;
}

/**
 * Node execution result
 */
export interface NodeResult {
  node_id: string;
  agent_id: AgentURN;
  status: NodeStatus;
  output?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

/**
 * Workflow execution state
 */
export interface WorkflowState {
  id: string;
  workflow_definition: WorkflowDefinition;
  context: WorkflowContext;
  status: WorkflowStatus;
  hitl_config?: HITLConfig;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * HITL checkpoint result
 */
export interface HITLCheckpointResult {
  checkpoint: HITLCheckpoint;
  node_result: NodeResult;
  decision: 'approved' | 'rejected' | 'timeout';
  approver?: string;
  timestamp: string;
}

/**
 * Configuration for WorkflowEngine
 */
export interface WorkflowEngineConfig {
  maxConcurrentWorkflows?: number;
  defaultNodeTimeoutMs?: number;
  hitlDefaultTimeoutSeconds?: number;
  enableAutoRetry?: boolean;
  maxRetries?: number;
}

const DEFAULT_CONFIG: Required<WorkflowEngineConfig> = {
  maxConcurrentWorkflows: 10,
  defaultNodeTimeoutMs: 60000,
  hitlDefaultTimeoutSeconds: 300,
  enableAutoRetry: true,
  maxRetries: 3,
};

/**
 * WorkflowEngine class
 * Manages workflow execution using DAG or State Machine patterns
 */
export class WorkflowEngine {
  private workflows: Map<string, WorkflowState> = new Map();
  private messageBus: MessageBus;
  private config: Required<WorkflowEngineConfig>;
  private hitlCallbacks: Map<string, (result: HITLCheckpointResult) => void> = new Map();

  constructor(messageBus: MessageBus, config?: WorkflowEngineConfig) {
    this.messageBus = messageBus;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Subscribe to workflow-related events
    this.messageBus.on('task:completed', this.handleTaskCompletion.bind(this));
    this.messageBus.on('task:failed', this.handleTaskFailure.bind(this));
  }

  // ============================================================================
  // Workflow Creation
  // ============================================================================

  /**
   * Create a new workflow from a team topology
   * @param topology - The team topology containing workflow definition
   * @param variables - Initial variables for the workflow
   * @returns The workflow ID
   */
  public createWorkflow(topology: TeamTopology, variables?: Record<string, unknown>): string {
    if (!topology.workflow_definition) {
      throw new Error('Team topology does not contain a workflow definition');
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate workflow definition
    this.validateWorkflowDefinition(topology.workflow_definition);

    const state: WorkflowState = {
      id: workflowId,
      workflow_definition: topology.workflow_definition,
      context: {
        workflow_id: workflowId,
        team_id: topology.id,
        current_node: topology.workflow_definition.initial_state ?? null,
        visited_nodes: [],
        variables: variables ?? {},
        results: new Map(),
        errors: new Map(),
      },
      status: 'pending',
      hitl_config: topology.hitl_config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.workflows.set(workflowId, state);

    this.messageBus.emit('workflow:created', {
      workflow_id: workflowId,
      team_id: topology.id,
      topology_type: topology.topology_type,
    });

    return workflowId;
  }

  /**
   * Validate a workflow definition
   */
  private validateWorkflowDefinition(definition: WorkflowDefinition): void {
    if (!definition.nodes || definition.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // Check for duplicate node IDs
    const nodeIds = new Set(definition.nodes.map((n) => n.id));
    if (nodeIds.size !== definition.nodes.length) {
      throw new Error('Workflow contains duplicate node IDs');
    }

    // Validate edges reference existing nodes
    for (const edge of definition.edges ?? []) {
      if (!nodeIds.has(edge.from)) {
        throw new Error(`Edge references non-existent source node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        throw new Error(`Edge references non-existent target node: ${edge.to}`);
      }
    }

    // Check for cycles (DAG validation)
    if (definition.type === 'dag') {
      if (this.hasCycle(definition)) {
        throw new Error('DAG workflow contains cycles');
      }
    }
  }

  /**
   * Check if the workflow has cycles using DFS
   */
  private hasCycle(definition: WorkflowDefinition): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const adjacencyList = this.buildAdjacencyList(definition);

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacencyList.get(nodeId) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of definition.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Build adjacency list from edges
   */
  private buildAdjacencyList(definition: WorkflowDefinition): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    for (const node of definition.nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of definition.edges ?? []) {
      adjacencyList.get(edge.from)?.push(edge.to);
    }

    return adjacencyList;
  }

  // ============================================================================
  // Workflow Execution
  // ============================================================================

  /**
   * Start a workflow
   * @param workflowId - The workflow ID to start
   */
  public async startWorkflow(workflowId: string): Promise<void> {
    const state = this.workflows.get(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (state.status !== 'pending') {
      throw new Error(`Workflow cannot be started: status is ${state.status}`);
    }

    state.status = 'running';
    state.started_at = new Date().toISOString();
    state.updated_at = new Date().toISOString();

    // Set initial node
    state.context.current_node =
      state.workflow_definition.initial_state ?? state.workflow_definition.nodes[0]?.id ?? null;

    this.messageBus.emit('workflow:started', {
      workflow_id: workflowId,
      initial_node: state.context.current_node,
    });

    // Execute first node
    if (state.context.current_node) {
      await this.executeNode(workflowId, state.context.current_node);
    }
  }

  /**
   * Execute a workflow node
   */
  private async executeNode(workflowId: string, nodeId: string): Promise<void> {
    const state = this.workflows.get(workflowId);
    if (!state) return;

    const node = state.workflow_definition.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Mark node as running
    const nodeResult: NodeResult = {
      node_id: nodeId,
      agent_id: node.agent_id,
      status: 'running',
      started_at: new Date().toISOString(),
    };
    state.context.results.set(nodeId, nodeResult);
    state.context.visited_nodes.push(nodeId);

    this.messageBus.emit('workflow:node:started', {
      workflow_id: workflowId,
      node_id: nodeId,
      agent_id: node.agent_id,
    });

    // Check for HITL checkpoint
    if (this.shouldPauseForHITL(state, nodeId)) {
      await this.handleHITLCheckpoint(workflowId, nodeId, node);
      return;
    }

    // Create task for the agent
    const taskId = await this.createTaskForNode(workflowId, node);

    // Task execution is handled by event handlers
  }

  /**
   * Create a task for a workflow node
   */
  private async createTaskForNode(workflowId: string, node: WorkflowNode): Promise<TaskURN> {
    const taskId = `urn:mycodexvantaos:task:wf-${workflowId}-${node.id}` as TaskURN;

    this.messageBus.emit('task:created', {
      task_id: taskId,
      workflow_id: workflowId,
      node_id: node.id,
      agent_id: node.agent_id,
      action: node.action,
    });

    return taskId;
  }

  // ============================================================================
  // HITL Handling
  // ============================================================================

  /**
   * Check if workflow should pause for HITL
   */
  private shouldPauseForHITL(state: WorkflowState, nodeId: string): boolean {
    if (!state.hitl_config?.enabled) return false;

    const checkpoint = state.hitl_config.checkpoints?.find((cp) => cp.node_id === nodeId);
    return checkpoint !== undefined;
  }

  /**
   * Handle HITL checkpoint
   */
  private async handleHITLCheckpoint(
    workflowId: string,
    nodeId: string,
    node: WorkflowNode
  ): Promise<void> {
    const state = this.workflows.get(workflowId);
    if (!state || !state.hitl_config) return;

    const checkpoint = state.hitl_config.checkpoints?.find((cp) => cp.node_id === nodeId);
    if (!checkpoint) return;

    state.status = 'paused';
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('hitl:checkpoint', {
      workflow_id: workflowId,
      node_id: nodeId,
      checkpoint: checkpoint,
      timeout_seconds: checkpoint.timeout_seconds ?? this.config.hitlDefaultTimeoutSeconds,
    });

    // Set up timeout
    const timeout = checkpoint.timeout_seconds ?? this.config.hitlDefaultTimeoutSeconds;
    setTimeout(() => {
      this.handleHITLTimeout(workflowId, nodeId);
    }, timeout * 1000);
  }

  /**
   * Handle HITL approval
   */
  public approveHITLCheckpoint(workflowId: string, nodeId: string, approver?: string): void {
    const state = this.workflows.get(workflowId);
    if (!state || state.status !== 'paused') return;

    const checkpoint = state.hitl_config?.checkpoints?.find((cp) => cp.node_id === nodeId);
    if (!checkpoint) return;

    // Update node result
    const nodeResult = state.context.results.get(nodeId);
    if (nodeResult) {
      nodeResult.status = 'completed';
      nodeResult.completed_at = new Date().toISOString();
    }

    this.messageBus.emit('hitl:approved', {
      workflow_id: workflowId,
      node_id: nodeId,
      approver,
    });

    // Continue workflow
    this.continueWorkflow(workflowId, nodeId, 'success');
  }

  /**
   * Handle HITL rejection
   */
  public rejectHITLCheckpoint(workflowId: string, nodeId: string, reason?: string): void {
    const state = this.workflows.get(workflowId);
    if (!state || state.status !== 'paused') return;

    this.messageBus.emit('hitl:rejected', {
      workflow_id: workflowId,
      node_id: nodeId,
      reason,
    });

    // Handle based on on_failure path
    const node = state.workflow_definition.nodes.find((n) => n.id === nodeId);
    if (node?.on_failure) {
      this.continueWorkflow(workflowId, nodeId, 'failure');
    } else {
      state.status = 'failed';
      state.completed_at = new Date().toISOString();
      this.messageBus.emit('workflow:completed', {
        workflow_id: workflowId,
        status: 'failed',
        reason: 'HITL rejection without fallback',
      });
    }
  }

  /**
   * Handle HITL timeout
   */
  private handleHITLTimeout(workflowId: string, nodeId: string): void {
    const state = this.workflows.get(workflowId);
    if (!state || state.status !== 'paused') return;

    this.messageBus.emit('hitl:timeout', {
      workflow_id: workflowId,
      node_id: nodeId,
    });

    // Default to rejection on timeout
    this.rejectHITLCheckpoint(workflowId, nodeId, 'HITL timeout');
  }

  // ============================================================================
  // Workflow Continuation
  // ============================================================================

  /**
   * Continue workflow to next node
   */
  private async continueWorkflow(
    workflowId: string,
    currentNodeId: string,
    result: 'success' | 'failure'
  ): Promise<void> {
    const state = this.workflows.get(workflowId);
    if (!state) return;

    state.status = 'running';
    state.updated_at = new Date().toISOString();

    // Find next node
    const currentNode = state.workflow_definition.nodes.find((n) => n.id === currentNodeId);
    const nextNodeId = result === 'success' ? currentNode?.on_success : currentNode?.on_failure;

    // Check edges for conditional transitions
    const matchingEdge = state.workflow_definition.edges?.find((e) => {
      if (e.from !== currentNodeId) return false;
      if (!e.condition) return true;
      // Evaluate condition based on context
      return this.evaluateCondition(e.condition, state.context);
    });

    const nextNode = nextNodeId ?? matchingEdge?.to;

    if (nextNode) {
      // Check if it's a final state
      if (state.workflow_definition.final_states?.includes(nextNode)) {
        state.status = 'completed';
        state.completed_at = new Date().toISOString();
        this.messageBus.emit('workflow:completed', {
          workflow_id: workflowId,
          status: 'success',
          final_node: nextNode,
        });
        return;
      }

      state.context.current_node = nextNode;
      await this.executeNode(workflowId, nextNode);
    } else {
      // No more nodes, workflow complete
      state.status = 'completed';
      state.completed_at = new Date().toISOString();
      this.messageBus.emit('workflow:completed', {
        workflow_id: workflowId,
        status: 'success',
      });
    }
  }

  /**
   * Evaluate a condition against context
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    // Simple condition evaluation
    // In production, this would use a proper expression evaluator
    try {
      const variables = context.variables;
      // Safely evaluate simple conditions
      return Boolean(eval(condition));
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle task completion event
   */
  private handleTaskCompletion(event: unknown): void {
    const typedEvent = event as {
      payload: { task_id: TaskURN; workflow_id?: string; node_id?: string };
    };
    const { workflow_id, node_id } = typedEvent.payload;
    if (!workflow_id || !node_id) return;

    this.continueWorkflow(workflow_id, node_id, 'success');
  }

  /**
   * Handle task failure event
   */
  private handleTaskFailure(event: unknown): void {
    const typedEvent = event as {
      payload: { task_id: TaskURN; workflow_id?: string; node_id?: string; error?: string };
    };
    const { workflow_id, node_id } = typedEvent.payload;
    if (!workflow_id || !node_id) return;

    this.continueWorkflow(workflow_id, node_id, 'failure');
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Get workflow state
   */
  public getWorkflow(workflowId: string): WorkflowState | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Cancel a workflow
   */
  public cancelWorkflow(workflowId: string): boolean {
    const state = this.workflows.get(workflowId);
    if (!state) return false;

    if (state.status === 'completed' || state.status === 'failed') {
      return false;
    }

    state.status = 'cancelled';
    state.completed_at = new Date().toISOString();
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('workflow:completed', {
      workflow_id: workflowId,
      status: 'cancelled',
    });

    return true;
  }

  /**
   * Pause a running workflow
   */
  public pauseWorkflow(workflowId: string): boolean {
    const state = this.workflows.get(workflowId);
    if (!state || state.status !== 'running') return false;

    state.status = 'paused';
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('workflow:paused', {
      workflow_id: workflowId,
      current_node: state.context.current_node,
    });

    return true;
  }

  /**
   * Resume a paused workflow
   */
  public resumeWorkflow(workflowId: string): boolean {
    const state = this.workflows.get(workflowId);
    if (!state || state.status !== 'paused') return false;

    state.status = 'running';
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('workflow:resumed', {
      workflow_id: workflowId,
      current_node: state.context.current_node,
    });

    return true;
  }

  /**
   * Get all workflow IDs
   */
  public getWorkflowIds(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Clear completed workflows
   */
  public clearCompletedWorkflows(): number {
    let cleared = 0;
    for (const [id, state] of this.workflows) {
      if (['completed', 'failed', 'cancelled'].includes(state.status)) {
        this.workflows.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
}

export default WorkflowEngine;

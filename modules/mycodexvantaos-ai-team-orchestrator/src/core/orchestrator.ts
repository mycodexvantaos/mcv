/**
 * Orchestrator - Main facade for the AI Team Orchestrator
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import type {
  AgentProfile,
  AgentURN,
  TeamTopology,
  TeamURN,
  AgentTask,
  TaskURN,
  AgentMessage,
  MessageURN,
  OrchestratorConfig,
  GovernanceTier,
  PermissionType,
  TopologyType,
} from '../types';
import { AgentManager } from './agent-manager';
import { MessageBus } from './message-bus';
import { GovernanceEnforcer, ApprovalRequest } from './governance-enforcer';
import { WorkflowEngine } from './workflow-engine';
import { TeamManager, TeamCreationOptions } from './team-manager';
import { TaskDecomposer } from './task-decomposer';

/**
 * Default orchestrator configuration
 */
const DEFAULT_ORCHESTRATOR_CONFIG: Required<OrchestratorConfig> = {
  max_concurrent_tasks: 10,
  default_timeout_ms: 60000,
  enable_memory_compression: true,
  max_context_tokens: 8000,
  governance_enforcement_enabled: true,
  hitl_default_timeout_seconds: 300,
};

/**
 * Orchestrator class
 * Main entry point for AI Team orchestration
 */
export class Orchestrator {
  private config: Required<OrchestratorConfig>;
  private messageBus: MessageBus;
  private governanceEnforcer: GovernanceEnforcer;
  private agentManager: AgentManager;
  private workflowEngine: WorkflowEngine;
  private teamManager: TeamManager;
  private taskDecomposer: TaskDecomposer;
  private initialized: boolean = false;

  constructor(config?: OrchestratorConfig) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };

    // Initialize core components
    this.messageBus = new MessageBus({
      maxQueueSize: 1000,
      maxRetries: 3,
      retryDelayMs: 1000,
      messageTimeoutMs: this.config.default_timeout_ms,
    });

    this.governanceEnforcer = new GovernanceEnforcer();

    this.agentManager = new AgentManager(this.messageBus, this.governanceEnforcer, {
      maxAgents: 100,
      defaultContextCapacity: this.config.max_context_tokens,
      governanceEnabled: this.config.governance_enforcement_enabled,
    });

    this.workflowEngine = new WorkflowEngine(this.messageBus, {
      maxConcurrentWorkflows: this.config.max_concurrent_tasks,
      defaultNodeTimeoutMs: this.config.default_timeout_ms,
      hitlDefaultTimeoutSeconds: this.config.hitl_default_timeout_seconds,
    });

    this.teamManager = new TeamManager(this.agentManager, this.messageBus, this.workflowEngine, {
      maxTeams: 50,
      maxAgentsPerTeam: 20,
    });

    this.taskDecomposer = new TaskDecomposer(this.messageBus, {
      maxDepth: 3,
      maxSubtasks: 10,
      enableAutoDecomposition: true,
    });

    this.setupEventForwarding();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the orchestrator
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load any persisted state if needed
    // Initialize connections to external services
    // Validate configuration

    this.initialized = true;

    this.messageBus.emit('orchestrator:initialized', {
      timestamp: new Date().toISOString(),
      config: {
        governance_enabled: this.config.governance_enforcement_enabled,
        max_concurrent_tasks: this.config.max_concurrent_tasks,
      },
    });
  }

  /**
   * Shutdown the orchestrator
   */
  public async shutdown(): Promise<void> {
    // Cancel active workflows
    for (const workflowId of this.workflowEngine.getWorkflowIds()) {
      this.workflowEngine.cancelWorkflow(workflowId);
    }

    // Clear message bus
    this.messageBus.clear();

    this.initialized = false;

    this.messageBus.emit('orchestrator:shutdown', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if orchestrator is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================================================
  // Agent Management
  // ============================================================================

  /**
   * Register an agent
   */
  public registerAgent(profile: AgentProfile): AgentURN {
    this.ensureInitialized();
    const agentId = this.agentManager.registerAgent(profile);
    this.governanceEnforcer.registerAgentTier(agentId, profile.governance_tier ?? 0);
    return agentId;
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: AgentURN): boolean {
    this.ensureInitialized();
    const result = this.agentManager.unregisterAgent(agentId);
    if (result) {
      this.governanceEnforcer.unregisterAgentTier(agentId);
    }
    return result;
  }

  /**
   * Get an agent profile
   */
  public getAgent(agentId: AgentURN): AgentProfile | undefined {
    return this.agentManager.getAgent(agentId);
  }

  /**
   * Get all agents
   */
  public getAllAgents(): AgentProfile[] {
    return this.agentManager.getAllAgents();
  }

  /**
   * Get agents by role
   */
  public getAgentsByRole(role: string): AgentProfile[] {
    return this.agentManager.getAgentsByRole(role);
  }

  /**
   * Get available agents
   */
  public getAvailableAgents(): AgentProfile[] {
    return this.agentManager.getAvailableAgents();
  }

  // ============================================================================
  // Team Management
  // ============================================================================

  /**
   * Create a team
   */
  public createTeam(options: TeamCreationOptions): TeamURN {
    this.ensureInitialized();
    return this.teamManager.createTeam(options);
  }

  /**
   * Create a team from topology
   */
  public createTeamFromTopology(topology: TeamTopology): TeamURN {
    this.ensureInitialized();
    return this.teamManager.createTeamFromTopology(topology);
  }

  /**
   * Get a team
   */
  public getTeam(teamId: TeamURN): TeamTopology | undefined {
    return this.teamManager.getTeam(teamId);
  }

  /**
   * Activate a team
   */
  public activateTeam(teamId: TeamURN): boolean {
    this.ensureInitialized();
    return this.teamManager.activateTeam(teamId);
  }

  /**
   * Deactivate a team
   */
  public deactivateTeam(teamId: TeamURN): boolean {
    return this.teamManager.deactivateTeam(teamId);
  }

  /**
   * Destroy a team
   */
  public destroyTeam(teamId: TeamURN): boolean {
    return this.teamManager.destroyTeam(teamId);
  }

  /**
   * Get all teams
   */
  public getAllTeams(): TeamTopology[] {
    return this.teamManager.getAllTeams();
  }

  /**
   * Add agent to team
   */
  public addAgentToTeam(teamId: TeamURN, agentId: AgentURN, position?: number): boolean {
    return this.teamManager.addAgentToTeam(teamId, agentId, position);
  }

  /**
   * Remove agent from team
   */
  public removeAgentFromTeam(teamId: TeamURN, agentId: AgentURN): boolean {
    return this.teamManager.removeAgentFromTeam(teamId, agentId);
  }

  // ============================================================================
  // Task Management
  // ============================================================================

  /**
   * Create a task
   */
  public createTask(
    objective: string,
    options?: {
      context?: AgentTask['context'];
      priority?: AgentTask['priority'];
      assigned_agents?: AgentURN[];
      deadline?: string;
    }
  ): TaskURN {
    this.ensureInitialized();

    const taskId =
      `urn:mycodexvantaos:task:${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as TaskURN;

    const task: AgentTask = {
      id: taskId,
      objective,
      context: options?.context,
      priority: options?.priority ?? 'normal',
      assigned_agents: options?.assigned_agents,
      status: 'pending',
      created_at: new Date().toISOString(),
      deadline: options?.deadline,
    };

    this.messageBus.emit('task:created', {
      task_id: taskId,
      objective,
      priority: task.priority,
    });

    return taskId;
  }

  /**
   * Decompose a task
   */
  public decomposeTask(task: AgentTask): ReturnType<TaskDecomposer['decompose']> {
    return this.taskDecomposer.decompose(task);
  }

  /**
   * Assign task to agent
   */
  public assignTask(agentId: AgentURN, taskId: TaskURN): boolean {
    return this.agentManager.assignTask(agentId, taskId);
  }

  /**
   * Release agent from task
   */
  public releaseAgent(agentId: AgentURN): boolean {
    return this.agentManager.releaseAgent(agentId);
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Start a workflow for a team
   */
  public startWorkflow(teamId: TeamURN, variables?: Record<string, unknown>): string {
    this.ensureInitialized();
    return this.teamManager.startWorkflow(teamId, variables);
  }

  /**
   * Pause a workflow
   */
  public pauseWorkflow(workflowId: string): boolean {
    return this.workflowEngine.pauseWorkflow(workflowId);
  }

  /**
   * Resume a workflow
   */
  public resumeWorkflow(workflowId: string): boolean {
    return this.workflowEngine.resumeWorkflow(workflowId);
  }

  /**
   * Cancel a workflow
   */
  public cancelWorkflow(workflowId: string): boolean {
    return this.workflowEngine.cancelWorkflow(workflowId);
  }

  /**
   * Get workflow state
   */
  public getWorkflow(workflowId: string): ReturnType<WorkflowEngine['getWorkflow']> {
    return this.workflowEngine.getWorkflow(workflowId);
  }

  // ============================================================================
  // HITL (Human-in-the-Loop)
  // ============================================================================

  /**
   * Approve HITL checkpoint
   */
  public approveHITLCheckpoint(workflowId: string, nodeId: string, approver?: string): void {
    this.workflowEngine.approveHITLCheckpoint(workflowId, nodeId, approver);
  }

  /**
   * Reject HITL checkpoint
   */
  public rejectHITLCheckpoint(workflowId: string, nodeId: string, reason?: string): void {
    this.workflowEngine.rejectHITLCheckpoint(workflowId, nodeId, reason);
  }

  // ============================================================================
  // Messaging
  // ============================================================================

  /**
   * Send a message
   */
  public sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): MessageURN {
    return this.messageBus.send(message);
  }

  /**
   * Broadcast a message
   */
  public broadcastMessage(
    senderId: AgentURN,
    messageType: AgentMessage['message_type'],
    content: AgentMessage['content']
  ): MessageURN {
    return this.messageBus.broadcast(senderId, messageType, content);
  }

  /**
   * Subscribe to messages
   */
  public subscribeToMessages(
    agentId: AgentURN,
    handler: (message: AgentMessage) => void | Promise<void>
  ): string {
    return this.messageBus.subscribe(agentId, handler);
  }

  /**
   * Unsubscribe from messages
   */
  public unsubscribeFromMessages(
    agentId: AgentURN,
    handler: (message: AgentMessage) => void | Promise<void>
  ): void {
    this.messageBus.unsubscribe(agentId, handler);
  }

  // ============================================================================
  // Governance
  // ============================================================================

  /**
   * Request approval for an operation
   */
  public requestApproval(
    permission: PermissionType,
    requesterId: AgentURN,
    context?: Record<string, unknown>
  ): string {
    return this.governanceEnforcer.requestApproval(permission, requesterId, context);
  }

  /**
   * Approve a request
   */
  public approveRequest(requestId: string, approverTier: GovernanceTier): boolean {
    return this.governanceEnforcer.approveRequest(requestId, approverTier);
  }

  /**
   * Reject a request
   */
  public rejectRequest(requestId: string, approverTier: GovernanceTier): boolean {
    return this.governanceEnforcer.rejectRequest(requestId, approverTier);
  }

  /**
   * Get approval status
   */
  public getApprovalStatus(requestId: string): ApprovalRequest | undefined {
    return this.governanceEnforcer.getApprovalStatus(requestId);
  }

  /**
   * Check if agent can use a tool
   */
  public canAgentUseTool(agentId: AgentURN, toolId: string): boolean {
    return this.governanceEnforcer.canUseTool(
      agentId,
      toolId as `urn:mycodexvantaos:tool:${string}`
    );
  }

  // ============================================================================
  // Events
  // ============================================================================

  /**
   * Subscribe to orchestrator events
   */
  public onEvent(eventType: string, handler: (event: unknown) => void): void {
    this.messageBus.on(eventType as any, handler as any);
  }

  /**
   * Unsubscribe from orchestrator events
   */
  public offEvent(eventType: string, handler: (event: unknown) => void): void {
    this.messageBus.off(eventType as any, handler as any);
  }

  // ============================================================================
  // Statistics and Monitoring
  // ============================================================================

  /**
   * Get orchestrator statistics
   */
  public getStats(): {
    agents: { total: number; available: number };
    teams: { total: number; active: number };
    workflows: { total: number };
    messages: ReturnType<MessageBus['getStats']>;
  } {
    return {
      agents: {
        total: this.agentManager.count,
        available: this.agentManager.getAvailableAgents().length,
      },
      teams: {
        total: this.teamManager.count,
        active: this.teamManager.getTeamsByStatus('active').length,
      },
      workflows: {
        total: this.workflowEngine.getWorkflowIds().length,
      },
      messages: this.messageBus.getStats(),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Ensure orchestrator is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }
  }

  /**
   * Set up event forwarding for external listeners
   */
  private setupEventForwarding(): void {
    // Forward key events to external systems
    const eventsToForward = [
      'task:created',
      'task:completed',
      'task:failed',
      'workflow:started',
      'workflow:completed',
      'hitl:checkpoint',
      'hitl:approved',
      'hitl:rejected',
      'agent:registered',
      'agent:activated',
      'team:created',
      'team:activated',
    ];

    // Events are already emitted through messageBus
    // Additional forwarding logic can be added here
  }
}

export default Orchestrator;

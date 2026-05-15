/**
 * AgentManager - Manages agent lifecycle, instantiation, and context
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import { v4 as uuidv4 } from 'uuid';
import type { AgentProfile, AgentURN, AgentInstanceState, TaskURN, GovernanceTier } from '../types';
import { MessageBus } from './message-bus';
import { GovernanceEnforcer } from './governance-enforcer';

/**
 * Configuration for AgentManager
 */
export interface AgentManagerConfig {
  maxAgents?: number;
  defaultContextCapacity?: number;
  governanceEnabled?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<AgentManagerConfig> = {
  maxAgents: 100,
  defaultContextCapacity: 8000,
  governanceEnabled: true,
};

/**
 * AgentManager class
 * Responsible for:
 * - Agent registration and lifecycle management
 * - Context window management per agent
 * - Agent state tracking
 * - Governance tier validation
 */
export class AgentManager {
  private agents: Map<AgentURN, AgentInstanceState> = new Map();
  private config: Required<AgentManagerConfig>;
  private messageBus: MessageBus;
  private governanceEnforcer?: GovernanceEnforcer;

  constructor(
    messageBus: MessageBus,
    governanceEnforcer?: GovernanceEnforcer,
    config?: AgentManagerConfig
  ) {
    this.messageBus = messageBus;
    this.governanceEnforcer = governanceEnforcer;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a new agent profile
   * @param profile - The agent profile to register
   * @returns The agent URN if successful
   * @throws Error if agent already exists or max agents reached
   */
  public registerAgent(profile: AgentProfile): AgentURN {
    // Check if agent already exists
    if (this.agents.has(profile.id)) {
      throw new Error(`Agent ${profile.id} already registered`);
    }

    // Check max agents limit
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum agent limit (${this.config.maxAgents}) reached`);
    }

    // Validate governance tier if enforcer available
    if (this.config.governanceEnabled && this.governanceEnforcer) {
      const tier = profile.governance_tier ?? 0;
      this.governanceEnforcer.validateTierPermissions(tier, 'agent:register');
    }

    // Initialize agent state
    const instanceState: AgentInstanceState = {
      profile,
      status: 'idle',
      current_task_id: null,
      last_activity: new Date().toISOString(),
      context_window: [],
    };

    this.agents.set(profile.id, instanceState);

    // Emit registration event
    this.messageBus.emit('agent:registered', {
      agent_id: profile.id,
      role: profile.role,
      governance_tier: profile.governance_tier ?? 0,
    });

    return profile.id;
  }

  /**
   * Unregister an agent
   * @param agentId - The agent URN to unregister
   * @returns true if successful
   */
  public unregisterAgent(agentId: AgentURN): boolean {
    const state = this.agents.get(agentId);
    if (!state) {
      return false;
    }

    // Cannot unregister agent that is busy
    if (state.status === 'busy') {
      throw new Error(
        `Cannot unregister agent ${agentId}: agent is busy with task ${state.current_task_id}`
      );
    }

    this.agents.delete(agentId);

    // Emit unregistration event
    this.messageBus.emit('agent:unregistered', {
      agent_id: agentId,
    });

    return true;
  }

  /**
   * Get agent profile
   * @param agentId - The agent URN
   * @returns The agent profile or undefined
   */
  public getAgent(agentId: AgentURN): AgentProfile | undefined {
    return this.agents.get(agentId)?.profile;
  }

  /**
   * Get agent instance state
   * @param agentId - The agent URN
   * @returns The agent instance state or undefined
   */
  public getAgentState(agentId: AgentURN): AgentInstanceState | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   * @returns Array of agent profiles
   */
  public getAllAgents(): AgentProfile[] {
    return Array.from(this.agents.values()).map((state) => state.profile);
  }

  /**
   * Get agents by role
   * @param role - The role to filter by
   * @returns Array of agent profiles with the specified role
   */
  public getAgentsByRole(role: string): AgentProfile[] {
    return this.getAllAgents().filter((agent) => agent.role === role);
  }

  /**
   * Get available (idle) agents
   * @returns Array of idle agent profiles
   */
  public getAvailableAgents(): AgentProfile[] {
    return Array.from(this.agents.values())
      .filter((state) => state.status === 'idle')
      .map((state) => state.profile);
  }

  /**
   * Assign a task to an agent
   * @param agentId - The agent URN
   * @param taskId - The task URN
   * @returns true if assignment successful
   */
  public assignTask(agentId: AgentURN, taskId: TaskURN): boolean {
    const state = this.agents.get(agentId);
    if (!state) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (state.status !== 'idle') {
      throw new Error(`Agent ${agentId} is not available (status: ${state.status})`);
    }

    state.status = 'busy';
    state.current_task_id = taskId;
    state.last_activity = new Date().toISOString();

    this.messageBus.emit('agent:activated', {
      agent_id: agentId,
      task_id: taskId,
    });

    return true;
  }

  /**
   * Release an agent from a task
   * @param agentId - The agent URN
   * @returns true if release successful
   */
  public releaseAgent(agentId: AgentURN): boolean {
    const state = this.agents.get(agentId);
    if (!state) {
      return false;
    }

    const previousTask = state.current_task_id;
    state.status = 'idle';
    state.current_task_id = null;
    state.last_activity = new Date().toISOString();

    this.messageBus.emit('agent:deactivated', {
      agent_id: agentId,
      previous_task_id: previousTask,
    });

    return true;
  }

  /**
   * Update agent context window
   * @param agentId - The agent URN
   * @param context - Context to add
   * @param compress - Whether to compress if over threshold
   */
  public updateContext(agentId: AgentURN, context: unknown, compress: boolean = true): void {
    const state = this.agents.get(agentId);
    if (!state) {
      throw new Error(`Agent ${agentId} not found`);
    }

    state.context_window.push(context);
    state.last_activity = new Date().toISOString();

    // Check if compression needed
    const capacity =
      state.profile.memory_configuration?.short_term_capacity ?? this.config.defaultContextCapacity;

    if (compress && this.shouldCompress(state, capacity)) {
      this.compressContext(state, capacity);
    }
  }

  /**
   * Clear agent context window
   * @param agentId - The agent URN
   */
  public clearContext(agentId: AgentURN): void {
    const state = this.agents.get(agentId);
    if (!state) {
      throw new Error(`Agent ${agentId} not found`);
    }

    state.context_window = [];
    state.last_activity = new Date().toISOString();
  }

  /**
   * Check if context should be compressed
   */
  private shouldCompress(state: AgentInstanceState, capacity: number): boolean {
    const threshold = state.profile.memory_configuration?.memory_compression_threshold ?? 0.8;
    const currentSize = this.estimateContextSize(state);
    return currentSize >= capacity * threshold;
  }

  /**
   * Estimate context size in tokens (simplified)
   */
  private estimateContextSize(state: AgentInstanceState): number {
    // Simplified estimation: count string lengths / 4 (avg chars per token)
    return state.context_window.reduce((acc: number, item) => {
      const str = typeof item === 'string' ? item : JSON.stringify(item);
      return acc + Math.ceil(str.length / 4);
    }, 0 as number);
  }

  /**
   * Compress context by summarizing older entries
   */
  private compressContext(state: AgentInstanceState, capacity: number): void {
    const targetSize = Math.floor(capacity * 0.5);
    const currentSize = this.estimateContextSize(state);

    if (currentSize <= targetSize) {
      return;
    }

    // Simple compression: keep only recent entries
    // In production, this would call an LLM for summarization
    const compressedWindow: unknown[] = [];
    let accumulatedSize = 0;

    // Iterate from newest to oldest
    for (let i = state.context_window.length - 1; i >= 0; i--) {
      const item = state.context_window[i];
      const str = typeof item === 'string' ? item : JSON.stringify(item);
      const itemSize = Math.ceil(str.length / 4);

      if (accumulatedSize + itemSize <= targetSize) {
        compressedWindow.unshift(item);
        accumulatedSize += itemSize;
      } else {
        break;
      }
    }

    // Add compression notice
    const removedCount = state.context_window.length - compressedWindow.length;
    if (removedCount > 0) {
      compressedWindow.unshift({
        _compressed: true,
        _removed_entries: removedCount,
        _timestamp: new Date().toISOString(),
      });
    }

    state.context_window = compressedWindow;
  }

  /**
   * Get count of registered agents
   */
  public get count(): number {
    return this.agents.size;
  }

  /**
   * Check if an agent exists
   */
  public has(agentId: AgentURN): boolean {
    return this.agents.has(agentId);
  }
}

export default AgentManager;

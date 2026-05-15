/**
 * TeamManager - Manages team lifecycle and topology
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import type {
  TeamTopology,
  TeamURN,
  AgentURN,
  AgentProfile,
  TopologyType,
  TeamAgentAssignment,
} from '../types';
import { AgentManager } from './agent-manager';
import { MessageBus } from './message-bus';
import { WorkflowEngine } from './workflow-engine';

/**
 * Team instance state
 */
export interface TeamInstanceState {
  topology: TeamTopology;
  status: 'draft' | 'active' | 'paused' | 'deprecated';
  active_agents: AgentURN[];
  created_at: string;
  updated_at: string;
  workflow_ids: string[];
}

/**
 * Team creation options
 */
export interface TeamCreationOptions {
  name: string;
  topology_type: TopologyType;
  agents: TeamAgentAssignment[];
  communication_rules?: TeamTopology['communication_rules'];
  workflow_definition?: TeamTopology['workflow_definition'];
  hitl_config?: TeamTopology['hitl_config'];
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for TeamManager
 */
export interface TeamManagerConfig {
  maxTeams?: number;
  maxAgentsPerTeam?: number;
  defaultTopologyType?: TopologyType;
}

const DEFAULT_CONFIG: Required<TeamManagerConfig> = {
  maxTeams: 50,
  maxAgentsPerTeam: 20,
  defaultTopologyType: 'hierarchical',
};

/**
 * TeamManager class
 * Manages team creation, agent assignment, and topology configuration
 */
export class TeamManager {
  private teams: Map<TeamURN, TeamInstanceState> = new Map();
  private agentManager: AgentManager;
  private messageBus: MessageBus;
  private workflowEngine: WorkflowEngine;
  private config: Required<TeamManagerConfig>;

  constructor(
    agentManager: AgentManager,
    messageBus: MessageBus,
    workflowEngine: WorkflowEngine,
    config?: TeamManagerConfig
  ) {
    this.agentManager = agentManager;
    this.messageBus = messageBus;
    this.workflowEngine = workflowEngine;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // Team Creation
  // ============================================================================

  /**
   * Create a new team
   * @param options - Team creation options
   * @returns The team URN
   */
  public createTeam(options: TeamCreationOptions): TeamURN {
    // Check max teams limit
    if (this.teams.size >= this.config.maxTeams) {
      throw new Error(`Maximum team limit (${this.config.maxTeams}) reached`);
    }

    // Validate agent count
    if (options.agents.length > this.config.maxAgentsPerTeam) {
      throw new Error(`Team exceeds maximum agents (${this.config.maxAgentsPerTeam})`);
    }

    // Validate all agents exist
    for (const assignment of options.agents) {
      if (!this.agentManager.has(assignment.agent_id)) {
        throw new Error(`Agent not found: ${assignment.agent_id}`);
      }
    }

    // Generate team URN
    const teamId = this.generateTeamURN(options.name);

    // Create topology
    const topology: TeamTopology = {
      id: teamId,
      name: options.name,
      version: '1.0.0',
      topology_type: options.topology_type,
      agents: options.agents,
      communication_rules: options.communication_rules,
      workflow_definition: options.workflow_definition,
      hitl_config: options.hitl_config,
      status: 'draft',
      metadata: options.metadata,
    };

    // Create instance state
    const instanceState: TeamInstanceState = {
      topology,
      status: 'draft',
      active_agents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workflow_ids: [],
    };

    this.teams.set(teamId, instanceState);

    this.messageBus.emit('team:created', {
      team_id: teamId,
      name: options.name,
      topology_type: options.topology_type,
      agent_count: options.agents.length,
    });

    return teamId;
  }

  /**
   * Create a team from a predefined topology
   * @param topology - The team topology
   * @returns The team URN
   */
  public createTeamFromTopology(topology: TeamTopology): TeamURN {
    // Validate all agents exist
    for (const assignment of topology.agents) {
      if (!this.agentManager.has(assignment.agent_id)) {
        throw new Error(`Agent not found: ${assignment.agent_id}`);
      }
    }

    const instanceState: TeamInstanceState = {
      topology,
      status: topology.status ?? 'draft',
      active_agents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workflow_ids: [],
    };

    this.teams.set(topology.id, instanceState);

    this.messageBus.emit('team:created', {
      team_id: topology.id,
      name: topology.name,
      topology_type: topology.topology_type,
      agent_count: topology.agents.length,
    });

    return topology.id;
  }

  // ============================================================================
  // Team Activation
  // ============================================================================

  /**
   * Activate a team
   * @param teamId - The team URN
   * @returns true if activation successful
   */
  public activateTeam(teamId: TeamURN): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    if (state.status === 'active') {
      return true; // Already active
    }

    // Validate workflow definition exists for certain topologies
    if (['dag', 'state_machine'].includes(state.topology.topology_type)) {
      if (!state.topology.workflow_definition) {
        throw new Error(
          `Team ${teamId} requires a workflow definition for topology type ${state.topology.topology_type}`
        );
      }
    }

    state.status = 'active';
    state.active_agents = state.topology.agents.map((a) => a.agent_id);
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('team:activated', {
      team_id: teamId,
      active_agents: state.active_agents,
    });

    return true;
  }

  /**
   * Deactivate a team
   * @param teamId - The team URN
   * @returns true if deactivation successful
   */
  public deactivateTeam(teamId: TeamURN): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      return false;
    }

    state.status = 'paused';
    state.active_agents = [];
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('team:deactivated', {
      team_id: teamId,
    });

    return true;
  }

  /**
   * Destroy a team
   * @param teamId - The team URN
   * @returns true if destruction successful
   */
  public destroyTeam(teamId: TeamURN): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      return false;
    }

    // Cancel any active workflows
    for (const workflowId of state.workflow_ids) {
      this.workflowEngine.cancelWorkflow(workflowId);
    }

    this.teams.delete(teamId);

    this.messageBus.emit('team:destroyed', {
      team_id: teamId,
    });

    return true;
  }

  // ============================================================================
  // Team Queries
  // ============================================================================

  /**
   * Get team topology
   * @param teamId - The team URN
   * @returns The team topology or undefined
   */
  public getTeam(teamId: TeamURN): TeamTopology | undefined {
    return this.teams.get(teamId)?.topology;
  }

  /**
   * Get team instance state
   * @param teamId - The team URN
   * @returns The team instance state or undefined
   */
  public getTeamState(teamId: TeamURN): TeamInstanceState | undefined {
    return this.teams.get(teamId);
  }

  /**
   * Get all teams
   * @returns Array of team topologies
   */
  public getAllTeams(): TeamTopology[] {
    return Array.from(this.teams.values()).map((state) => state.topology);
  }

  /**
   * Get teams by status
   * @param status - The status to filter by
   * @returns Array of team topologies with the specified status
   */
  public getTeamsByStatus(status: TeamInstanceState['status']): TeamTopology[] {
    return Array.from(this.teams.values())
      .filter((state) => state.status === status)
      .map((state) => state.topology);
  }

  /**
   * Get teams containing a specific agent
   * @param agentId - The agent URN
   * @returns Array of team topologies containing the agent
   */
  public getTeamsByAgent(agentId: AgentURN): TeamTopology[] {
    return Array.from(this.teams.values())
      .filter((state) => state.topology.agents.some((a) => a.agent_id === agentId))
      .map((state) => state.topology);
  }

  /**
   * Get active agents in a team
   * @param teamId - The team URN
   * @returns Array of agent URNs
   */
  public getActiveAgents(teamId: TeamURN): AgentURN[] {
    return this.teams.get(teamId)?.active_agents ?? [];
  }

  // ============================================================================
  // Team Modification
  // ============================================================================

  /**
   * Add an agent to a team
   * @param teamId - The team URN
   * @param agentId - The agent URN to add
   * @param position - Position in the team
   * @returns true if successful
   */
  public addAgentToTeam(teamId: TeamURN, agentId: AgentURN, position?: number): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    if (!this.agentManager.has(agentId)) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Check if agent already in team
    if (state.topology.agents.some((a) => a.agent_id === agentId)) {
      throw new Error(`Agent ${agentId} already in team ${teamId}`);
    }

    // Check max agents
    if (state.topology.agents.length >= this.config.maxAgentsPerTeam) {
      throw new Error(`Team has reached maximum agents (${this.config.maxAgentsPerTeam})`);
    }

    const assignment: TeamAgentAssignment = {
      agent_id: agentId,
      position: position ?? state.topology.agents.length,
    };

    state.topology.agents.push(assignment);
    state.updated_at = new Date().toISOString();

    if (state.status === 'active') {
      state.active_agents.push(agentId);
    }

    this.messageBus.emit('team:updated', {
      team_id: teamId,
      change: 'agent_added',
      agent_id: agentId,
    });

    return true;
  }

  /**
   * Remove an agent from a team
   * @param teamId - The team URN
   * @param agentId - The agent URN to remove
   * @returns true if successful
   */
  public removeAgentFromTeam(teamId: TeamURN, agentId: AgentURN): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const index = state.topology.agents.findIndex((a) => a.agent_id === agentId);
    if (index === -1) {
      throw new Error(`Agent ${agentId} not in team ${teamId}`);
    }

    state.topology.agents.splice(index, 1);
    state.active_agents = state.active_agents.filter((id) => id !== agentId);
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('team:updated', {
      team_id: teamId,
      change: 'agent_removed',
      agent_id: agentId,
    });

    return true;
  }

  /**
   * Update team topology type
   * @param teamId - The team URN
   * @param topologyType - The new topology type
   * @returns true if successful
   */
  public updateTopologyType(teamId: TeamURN, topologyType: TopologyType): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Validate workflow definition for certain types
    if (['dag', 'state_machine'].includes(topologyType)) {
      if (!state.topology.workflow_definition) {
        throw new Error(`Cannot set topology to ${topologyType} without workflow definition`);
      }
    }

    state.topology.topology_type = topologyType;
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('team:updated', {
      team_id: teamId,
      change: 'topology_changed',
      topology_type: topologyType,
    });

    return true;
  }

  /**
   * Update HITL configuration
   * @param teamId - The team URN
   * @param hitlConfig - The new HITL configuration
   * @returns true if successful
   */
  public updateHITLConfig(teamId: TeamURN, hitlConfig: TeamTopology['hitl_config']): boolean {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    state.topology.hitl_config = hitlConfig;
    state.updated_at = new Date().toISOString();

    this.messageBus.emit('team:updated', {
      team_id: teamId,
      change: 'hitl_config_updated',
    });

    return true;
  }

  // ============================================================================
  // Workflow Integration
  // ============================================================================

  /**
   * Start a workflow for a team
   * @param teamId - The team URN
   * @param variables - Initial workflow variables
   * @returns The workflow ID
   */
  public startWorkflow(teamId: TeamURN, variables?: Record<string, unknown>): string {
    const state = this.teams.get(teamId);
    if (!state) {
      throw new Error(`Team not found: ${teamId}`);
    }

    if (state.status !== 'active') {
      throw new Error(`Team ${teamId} is not active`);
    }

    const workflowId = this.workflowEngine.createWorkflow(state.topology, variables);
    state.workflow_ids.push(workflowId);

    this.workflowEngine.startWorkflow(workflowId);

    return workflowId;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Generate a team URN from name
   */
  private generateTeamURN(name: string): TeamURN {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `urn:mycodexvantaos:team:${slug}-${suffix}` as TeamURN;
  }

  /**
   * Get count of teams
   */
  public get count(): number {
    return this.teams.size;
  }

  /**
   * Check if a team exists
   */
  public has(teamId: TeamURN): boolean {
    return this.teams.has(teamId);
  }
}

export default TeamManager;

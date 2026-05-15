import { TeamManager, TeamInstanceState, TeamCreationOptions } from '../../src/core/team-manager';
import { MessageBus } from '../../src/core/message-bus';
import { AgentManager } from '../../src/core/agent-manager';
import { WorkflowEngine } from '../../src/core/workflow-engine';
import {
  AgentProfile,
  TeamTopology,
  TeamAgentAssignment,
  TeamURN,
  AgentURN,
  ToolURN,
} from '../../src/types';

describe('TeamManager', () => {
  let teamManager: TeamManager;
  let messageBus: MessageBus;
  let agentManager: AgentManager;
  let workflowEngine: WorkflowEngine;

  const mockAgents: AgentProfile[] = [
    {
      id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN,
      name: 'Test Architect',
      version: '1.0.0',
      role: 'architect',
      goal: 'Design system architecture',
      backstory: 'Experienced system architect',
      allowed_tools: [
        'urn:mycodexvantaos:tool:design_tool' as ToolURN,
        'urn:mycodexvantaos:tool:review_tool' as ToolURN,
      ],
      governance_tier: 1,
      status: 'active',
    },
    {
      id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
      name: 'Test Engineer',
      version: '1.0.0',
      role: 'engineer',
      goal: 'Implement software components',
      backstory: 'Full-stack developer',
      allowed_tools: [
        'urn:mycodexvantaos:tool:code_editor' as ToolURN,
        'urn:mycodexvantaos:tool:terminal' as ToolURN,
        'urn:mycodexvantaos:tool:git' as ToolURN,
      ],
      governance_tier: 0,
      status: 'active',
    },
    {
      id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN,
      name: 'Test QA',
      version: '1.0.0',
      role: 'tester',
      goal: 'Ensure code quality',
      backstory: 'QA specialist',
      allowed_tools: [
        'urn:mycodexvantaos:tool:test_runner' as ToolURN,
        'urn:mycodexvantaos:tool:coverage_tool' as ToolURN,
      ],
      governance_tier: 0,
      status: 'active',
    },
  ];

  beforeEach(() => {
    messageBus = new MessageBus();
    agentManager = new AgentManager(messageBus);
    workflowEngine = new WorkflowEngine(messageBus);
    teamManager = new TeamManager(agentManager, messageBus, workflowEngine);

    // Register mock agents
    mockAgents.forEach((agent) => {
      agentManager.registerAgent(agent);
    });
  });

  afterEach(() => {
    messageBus.clear();
  });

  describe('Team Creation', () => {
    it('should create a team with valid options', () => {
      const options: TeamCreationOptions = {
        name: 'Development Team',
        topology_type: 'hierarchical',
        agents: [
          {
            agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN,
            position: 0,
            role_override: 'lead',
          },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
          { agent_id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN, position: 2 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      expect(teamUrn).toBeDefined();
      expect(teamUrn).toMatch(/^urn:mycodexvantaos:team:/);

      const team = teamManager.getTeam(teamUrn);
      expect(team).toBeDefined();
      expect(team?.name).toBe('Development Team');
      expect(team?.agents).toHaveLength(3);
    });

    it('should reject team creation with non-existent agents', () => {
      const options: TeamCreationOptions = {
        name: 'Invalid Team',
        topology_type: 'hierarchical',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:non-existent' as AgentURN, position: 0 }],
      };

      expect(() => teamManager.createTeam(options)).toThrow('Agent not found');
    });

    it('should reject team creation exceeding max agents per team', () => {
      // Create a team manager with maxAgentsPerTeam = 2
      const limitedManager = new TeamManager(agentManager, messageBus, workflowEngine, {
        maxAgentsPerTeam: 2,
      });

      const options: TeamCreationOptions = {
        name: 'Too Large Team',
        topology_type: 'hierarchical',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
          { agent_id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN, position: 2 },
        ],
      };

      expect(() => limitedManager.createTeam(options)).toThrow('Team exceeds maximum agents');
    });

    it('should reject team creation when max teams limit reached', () => {
      // Create a team manager with maxTeams = 1
      const limitedManager = new TeamManager(agentManager, messageBus, workflowEngine, {
        maxTeams: 1,
      });

      const options1: TeamCreationOptions = {
        name: 'First Team',
        topology_type: 'hierarchical',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      limitedManager.createTeam(options1);

      const options2: TeamCreationOptions = {
        name: 'Second Team',
        topology_type: 'hierarchical',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
      };

      expect(() => limitedManager.createTeam(options2)).toThrow('Maximum team limit');
    });

    it('should create team with workflow definition', () => {
      const options: TeamCreationOptions = {
        name: 'Workflow Team',
        topology_type: 'dag',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
        workflow_definition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN,
              action: 'design',
            },
          ],
          edges: [],
        },
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);
      expect(team?.workflow_definition).toBeDefined();
    });
  });

  describe('Team Lifecycle', () => {
    it('should transition team through lifecycle states', () => {
      const options: TeamCreationOptions = {
        name: 'Lifecycle Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      const state = teamManager.getTeamState(teamUrn);
      expect(state?.status).toBe('draft');

      teamManager.activateTeam(teamUrn);
      expect(teamManager.getTeamState(teamUrn)?.status).toBe('active');

      teamManager.deactivateTeam(teamUrn);
      expect(teamManager.getTeamState(teamUrn)?.status).toBe('paused');
    });

    it('should throw when activating non-existent team', () => {
      expect(() =>
        teamManager.activateTeam('urn:mycodexvantaos:team:non-existent' as TeamURN)
      ).toThrow('Team not found');
    });

    it('should return true when activating already active team (idempotent)', () => {
      const options: TeamCreationOptions = {
        name: 'Already Active Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      teamManager.activateTeam(teamUrn);

      // Activating an already active team should return true (idempotent)
      const result = teamManager.activateTeam(teamUrn);
      expect(result).toBe(true);
    });

    it('should throw when activating dag team without workflow definition', () => {
      const options: TeamCreationOptions = {
        name: 'DAG Team Without Workflow',
        topology_type: 'dag',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
        // No workflow_definition
      };

      const teamUrn = teamManager.createTeam(options);
      expect(() => teamManager.activateTeam(teamUrn)).toThrow('requires a workflow definition');
    });

    it('should return false when deactivating non-existent team', () => {
      const result = teamManager.deactivateTeam('urn:mycodexvantaos:team:non-existent' as TeamURN);
      expect(result).toBe(false);
    });

    it('should destroy team and release resources', () => {
      const options: TeamCreationOptions = {
        name: 'Destroy Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      expect(teamManager.has(teamUrn)).toBe(true);

      const destroyed = teamManager.destroyTeam(teamUrn);
      expect(destroyed).toBe(true);
      expect(teamManager.has(teamUrn)).toBe(false);
    });

    it('should return false when destroying non-existent team', () => {
      const result = teamManager.destroyTeam('urn:mycodexvantaos:team:non-existent' as TeamURN);
      expect(result).toBe(false);
    });
  });

  describe('Agent Management', () => {
    it('should add agent to existing team', () => {
      const options: TeamCreationOptions = {
        name: 'Agent Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);

      const result = teamManager.addAgentToTeam(
        teamUrn,
        'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
        1
      );
      expect(result).toBe(true);

      const team = teamManager.getTeam(teamUrn);
      expect(team?.agents).toHaveLength(2);
    });

    it('should throw when adding agent to non-existent team', () => {
      expect(() =>
        teamManager.addAgentToTeam(
          'urn:mycodexvantaos:team:non-existent' as TeamURN,
          'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
          0
        )
      ).toThrow('Team not found');
    });

    it('should throw when adding non-existent agent to team', () => {
      const options: TeamCreationOptions = {
        name: 'Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);

      expect(() =>
        teamManager.addAgentToTeam(teamUrn, 'urn:mycodexvantaos:agent:non-existent' as AgentURN, 1)
      ).toThrow('Agent not found');
    });

    it('should throw when adding agent already in team', () => {
      const options: TeamCreationOptions = {
        name: 'Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);

      expect(() =>
        teamManager.addAgentToTeam(teamUrn, 'urn:mycodexvantaos:agent:architect-01' as AgentURN, 1)
      ).toThrow('already in team');
    });

    it('should throw when adding agent exceeds max agents per team', () => {
      const limitedManager = new TeamManager(agentManager, messageBus, workflowEngine, {
        maxAgentsPerTeam: 1,
      });

      const options: TeamCreationOptions = {
        name: 'Limited Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = limitedManager.createTeam(options);

      expect(() =>
        limitedManager.addAgentToTeam(
          teamUrn,
          'urn:mycodexvantaos:agent:engineer-01' as AgentURN,
          1
        )
      ).toThrow('maximum agents');
    });

    it('should remove agent from team', () => {
      const options: TeamCreationOptions = {
        name: 'Remove Agent Test Team',
        topology_type: 'sequential',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);

      const result = teamManager.removeAgentFromTeam(
        teamUrn,
        'urn:mycodexvantaos:agent:engineer-01' as AgentURN
      );

      expect(result).toBe(true);
      const team = teamManager.getTeam(teamUrn);
      expect(team?.agents).toHaveLength(1);
    });

    it('should throw when removing agent from non-existent team', () => {
      expect(() =>
        teamManager.removeAgentFromTeam(
          'urn:mycodexvantaos:team:non-existent' as TeamURN,
          'urn:mycodexvantaos:agent:engineer-01' as AgentURN
        )
      ).toThrow('Team not found');
    });

    it('should throw when removing agent not in team', () => {
      const options: TeamCreationOptions = {
        name: 'Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);

      expect(() =>
        teamManager.removeAgentFromTeam(teamUrn, 'urn:mycodexvantaos:agent:engineer-01' as AgentURN)
      ).toThrow('not in team');
    });

    it('should get active agents for a team', () => {
      const options: TeamCreationOptions = {
        name: 'Active Agents Test Team',
        topology_type: 'sequential',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      teamManager.activateTeam(teamUrn);

      const activeAgents = teamManager.getActiveAgents(teamUrn);
      expect(activeAgents.length).toBeGreaterThan(0);
    });
  });

  describe('Query Methods', () => {
    it('should get all teams', () => {
      const options1: TeamCreationOptions = {
        name: 'Team One',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const options2: TeamCreationOptions = {
        name: 'Team Two',
        topology_type: 'hierarchical',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 0 }],
      };

      teamManager.createTeam(options1);
      teamManager.createTeam(options2);

      const teams = teamManager.getAllTeams();
      expect(teams).toHaveLength(2);
    });

    it('should get teams by status', () => {
      const options: TeamCreationOptions = {
        name: 'Status Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      teamManager.activateTeam(teamUrn);

      const activeTeams = teamManager.getTeamsByStatus('active');
      expect(activeTeams.length).toBeGreaterThan(0);
      expect(
        activeTeams.every((t) => {
          const state = teamManager.getTeamState(t.id as TeamURN);
          return state?.status === 'active';
        })
      ).toBe(true);
    });

    it('should get teams by agent', () => {
      const options: TeamCreationOptions = {
        name: 'Agent Query Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      teamManager.createTeam(options);

      const teams = teamManager.getTeamsByAgent(
        'urn:mycodexvantaos:agent:architect-01' as AgentURN
      );
      expect(teams.length).toBeGreaterThan(0);
    });

    it('should get team state', () => {
      const options: TeamCreationOptions = {
        name: 'State Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      const state = teamManager.getTeamState(teamUrn);

      expect(state).toBeDefined();
      expect(state?.status).toBe('draft');
    });

    it('should return undefined for non-existent team state', () => {
      const state = teamManager.getTeamState('urn:mycodexvantaos:team:non-existent' as TeamURN);
      expect(state).toBeUndefined();
    });
  });

  describe('Topology Types', () => {
    it('should create hierarchical topology', () => {
      const options: TeamCreationOptions = {
        name: 'Hierarchical Team',
        topology_type: 'hierarchical',
        agents: [
          {
            agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN,
            position: 0,
            role_override: 'lead',
          },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
          { agent_id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN, position: 2 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);

      expect(team?.topology_type).toBe('hierarchical');
      expect(team?.agents).toHaveLength(3);
    });

    it('should create mesh topology', () => {
      const options: TeamCreationOptions = {
        name: 'Mesh Team',
        topology_type: 'mesh',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
          { agent_id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN, position: 2 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);

      expect(team?.topology_type).toBe('mesh');
    });

    it('should create dag topology', () => {
      const options: TeamCreationOptions = {
        name: 'DAG Team',
        topology_type: 'dag',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
          { agent_id: 'urn:mycodexvantaos:agent:tester-01' as AgentURN, position: 2 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);

      expect(team?.topology_type).toBe('dag');
    });

    it('should create broadcast topology', () => {
      const options: TeamCreationOptions = {
        name: 'Broadcast Team',
        topology_type: 'broadcast',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);

      expect(team?.topology_type).toBe('broadcast');
    });

    it('should create sequential topology', () => {
      const options: TeamCreationOptions = {
        name: 'Sequential Team',
        topology_type: 'sequential',
        agents: [
          { agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 },
          { agent_id: 'urn:mycodexvantaos:agent:engineer-01' as AgentURN, position: 1 },
        ],
      };

      const teamUrn = teamManager.createTeam(options);
      const team = teamManager.getTeam(teamUrn);

      expect(team?.topology_type).toBe('sequential');
    });
  });

  describe('Utility Methods', () => {
    it('should return team count', () => {
      expect(teamManager.count).toBe(0);

      const options: TeamCreationOptions = {
        name: 'Count Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      teamManager.createTeam(options);

      expect(teamManager.count).toBe(1);
    });

    it('should check if team exists', () => {
      const options: TeamCreationOptions = {
        name: 'Has Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      expect(teamManager.has(teamUrn)).toBe(true);
      expect(teamManager.has('urn:mycodexvantaos:team:non-existent' as TeamURN)).toBe(false);
    });

    it('should get team by URN', () => {
      const options: TeamCreationOptions = {
        name: 'Get Test Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      const team = teamManager.getTeam(teamUrn);
      expect(team).toBeDefined();
      expect(team?.name).toBe('Get Test Team');
    });

    it('should return undefined for non-existent team', () => {
      const team = teamManager.getTeam('urn:mycodexvantaos:team:non-existent' as TeamURN);
      expect(team).toBeUndefined();
    });
  });

  describe('Advanced Methods', () => {
    it('should update topology type for a team', () => {
      const options: TeamCreationOptions = {
        name: 'Topology Update Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      // Update topology type
      const result = teamManager.updateTopologyType(teamUrn, 'mesh');
      expect(result).toBe(true);

      const team = teamManager.getTeam(teamUrn);
      expect(team?.topology_type).toBe('mesh');
    });

    it('should throw when updating topology type for non-existent team', () => {
      expect(() => {
        teamManager.updateTopologyType('urn:mycodexvantaos:team:non-existent' as TeamURN, 'mesh');
      }).toThrow();
    });

    it('should throw when setting dag topology without workflow definition', () => {
      const options: TeamCreationOptions = {
        name: 'No Workflow Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      expect(() => {
        teamManager.updateTopologyType(teamUrn, 'dag');
      }).toThrow('Cannot set topology to dag without workflow definition');
    });

    it('should throw when setting state_machine topology without workflow definition', () => {
      const options: TeamCreationOptions = {
        name: 'No Workflow Team 2',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      expect(() => {
        teamManager.updateTopologyType(teamUrn, 'state_machine');
      }).toThrow('Cannot set topology to state_machine without workflow definition');
    });

    it('should update HITL config for a team', () => {
      const options: TeamCreationOptions = {
        name: 'HITL Update Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);

      const hitlConfig = {
        enabled: true,
        checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
      };

      const result = teamManager.updateHITLConfig(teamUrn, hitlConfig);
      expect(result).toBe(true);
    });

    it('should throw when updating HITL config for non-existent team', () => {
      const hitlConfig = { enabled: true };

      expect(() => {
        teamManager.updateHITLConfig('urn:mycodexvantaos:team:non-existent' as TeamURN, hitlConfig);
      }).toThrow();
    });

    it('should start a workflow for an active team', () => {
      const options: TeamCreationOptions = {
        name: 'Workflow Team',
        topology_type: 'dag',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
        workflow_definition: {
          type: 'dag',
          nodes: [{ id: 'node-1', agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN }],
          edges: [],
          initial_state: 'node-1',
        },
      };
      const teamUrn = teamManager.createTeam(options);

      // Activate the team first
      teamManager.activateTeam(teamUrn);

      // Start a workflow
      const workflowId = teamManager.startWorkflow(teamUrn, { testVar: 'value' });
      expect(workflowId).toBeDefined();
    });

    it('should throw when starting workflow for non-existent team', () => {
      expect(() => {
        teamManager.startWorkflow('urn:mycodexvantaos:team:non-existent' as TeamURN);
      }).toThrow();
    });

    it('should throw when starting workflow for inactive team', () => {
      const options: TeamCreationOptions = {
        name: 'Inactive Workflow Team',
        topology_type: 'sequential',
        agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01' as AgentURN, position: 0 }],
      };
      const teamUrn = teamManager.createTeam(options);
      // Team is in 'draft' status by default, not 'active'

      expect(() => {
        teamManager.startWorkflow(teamUrn);
      }).toThrow('is not active');
    });
  });
});

import {
  WorkflowEngine,
  WorkflowState,
  WorkflowContext,
  NodeResult,
  WorkflowStatus,
} from '../../src/core/workflow-engine';
import { MessageBus } from '../../src/core/message-bus';
import type { TeamTopology, TeamURN, AgentURN, HITLConfig } from '../../src/types';

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  let messageBus: MessageBus;

  // Helper function to create valid topology
  const createTestTopology = (
    teamId: string,
    options?: {
      workflowDefinition?: any;
      hitlConfig?: HITLConfig;
      topologyType?: 'sequential' | 'hierarchical' | 'broadcast' | 'mesh' | 'dag';
    }
  ): TeamTopology => ({
    id: `urn:mycodexvantaos:team:${teamId}` as TeamURN,
    name: 'Test Team',
    version: '1.0.0',
    topology_type: options?.topologyType ?? 'sequential',
    agents: [],
    workflow_definition: options?.workflowDefinition ?? {
      type: 'dag',
      nodes: [
        {
          id: 'node-1',
          agent_id: 'urn:mycodexvantaos:agent:test-agent' as AgentURN,
          action: 'process',
        },
      ],
      edges: [],
    },
    hitl_config: options?.hitlConfig,
  });

  // Helper to create multi-node workflow
  const createMultiNodeTopology = (teamId: string): TeamTopology => ({
    id: `urn:mycodexvantaos:team:${teamId}` as TeamURN,
    name: 'Test Team',
    version: '1.0.0',
    topology_type: 'dag',
    agents: [],
    workflow_definition: {
      type: 'dag',
      nodes: [
        { id: 'node-1', agent_id: 'urn:mycodexvantaos:agent:agent-1' as AgentURN, action: 'start' },
        {
          id: 'node-2',
          agent_id: 'urn:mycodexvantaos:agent:agent-2' as AgentURN,
          action: 'process',
        },
        { id: 'node-3', agent_id: 'urn:mycodexvantaos:agent:agent-3' as AgentURN, action: 'end' },
      ],
      edges: [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' },
      ],
      initial_state: 'node-1',
      final_states: ['node-3'],
    },
  });

  beforeEach(() => {
    messageBus = new MessageBus();
    workflowEngine = new WorkflowEngine(messageBus);
  });

  afterEach(() => {
    workflowEngine.clearCompletedWorkflows();
  });

  describe('Workflow Creation', () => {
    it('should create a workflow from a topology', () => {
      const topology = createTestTopology('team-001');

      const workflowId = workflowEngine.createWorkflow(topology);
      expect(workflowId).toBeDefined();
      expect(typeof workflowId).toBe('string');
    });

    it('should get workflow state after creation', () => {
      const topology = createTestTopology('team-001');

      const workflowId = workflowEngine.createWorkflow(topology);
      const state = workflowEngine.getWorkflow(workflowId);

      expect(state).toBeDefined();
      expect(state?.status).toBe('pending');
    });

    it('should throw when creating workflow without workflow definition', () => {
      const topology: TeamTopology = {
        id: 'urn:mycodexvantaos:team:team-001' as TeamURN,
        name: 'Test Team',
        version: '1.0.0',
        topology_type: 'sequential',
        agents: [],
        // No workflow_definition
      };

      expect(() => workflowEngine.createWorkflow(topology)).toThrow(
        'does not contain a workflow definition'
      );
    });

    it('should throw when workflow has no nodes', () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [],
          edges: [],
        },
      });

      expect(() => workflowEngine.createWorkflow(topology)).toThrow('at least one node');
    });

    it('should throw when workflow has duplicate node IDs', () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'process',
            },
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a2' as AgentURN,
              action: 'process',
            },
          ],
          edges: [],
        },
      });

      expect(() => workflowEngine.createWorkflow(topology)).toThrow('duplicate node IDs');
    });

    it('should throw when edge references non-existent source node', () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'process',
            },
          ],
          edges: [{ from: 'non-existent', to: 'node-1' }],
        },
      });

      expect(() => workflowEngine.createWorkflow(topology)).toThrow('non-existent source node');
    });

    it('should throw when edge references non-existent target node', () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'process',
            },
          ],
          edges: [{ from: 'node-1', to: 'non-existent' }],
        },
      });

      expect(() => workflowEngine.createWorkflow(topology)).toThrow('non-existent target node');
    });

    it('should throw when DAG workflow contains cycles', () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'process',
            },
            {
              id: 'node-2',
              agent_id: 'urn:mycodexvantaos:agent:a2' as AgentURN,
              action: 'process',
            },
            {
              id: 'node-3',
              agent_id: 'urn:mycodexvantaos:agent:a3' as AgentURN,
              action: 'process',
            },
          ],
          edges: [
            { from: 'node-1', to: 'node-2' },
            { from: 'node-2', to: 'node-3' },
            { from: 'node-3', to: 'node-1' }, // Creates a cycle
          ],
        },
      });

      expect(() => workflowEngine.createWorkflow(topology)).toThrow('contains cycles');
    });

    it('should create workflow with initial variables', () => {
      const topology = createTestTopology('team-001');
      const variables = { foo: 'bar', count: 42 };

      const workflowId = workflowEngine.createWorkflow(topology, variables);
      const state = workflowEngine.getWorkflow(workflowId);

      expect(state?.context.variables).toEqual(variables);
    });

    it('should create workflow with HITL config', () => {
      const hitlConfig: HITLConfig = {
        enabled: true,
        checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
      };
      const topology = createTestTopology('team-001', { hitlConfig });

      const workflowId = workflowEngine.createWorkflow(topology);
      const state = workflowEngine.getWorkflow(workflowId);

      expect(state?.hitl_config).toEqual(hitlConfig);
    });
  });

  describe('Workflow Lifecycle', () => {
    it('should start a pending workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('running');
    });

    it('should throw when starting non-existent workflow', async () => {
      await expect(workflowEngine.startWorkflow('non-existent-id')).rejects.toThrow(
        'Workflow not found'
      );
    });

    it('should throw when starting already running workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      await expect(workflowEngine.startWorkflow(workflowId)).rejects.toThrow('cannot be started');
    });

    it('should cancel a pending workflow', () => {
      const topology = createTestTopology('team-001');

      const workflowId = workflowEngine.createWorkflow(topology);
      const result = workflowEngine.cancelWorkflow(workflowId);

      expect(result).toBe(true);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('cancelled');
    });

    it('should cancel a running workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);

      const result = workflowEngine.cancelWorkflow(workflowId);

      expect(result).toBe(true);
      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('cancelled');
    });

    it('should return false when cancelling completed workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);

      // Manually set to completed
      const state = workflowEngine.getWorkflow(workflowId);
      if (state) {
        state.status = 'completed';
        state.completed_at = new Date().toISOString();
      }

      const result = workflowEngine.cancelWorkflow(workflowId);
      expect(result).toBe(false);
    });

    it('should return false when cancelling failed workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Manually set to failed
      const state = workflowEngine.getWorkflow(workflowId);
      if (state) {
        state.status = 'failed';
        state.completed_at = new Date().toISOString();
      }

      const result = workflowEngine.cancelWorkflow(workflowId);
      expect(result).toBe(false);
    });

    it('should return false when cancelling non-existent workflow', () => {
      const result = workflowEngine.cancelWorkflow('non-existent-id');
      expect(result).toBe(false);
    });

    it('should pause and resume a workflow', async () => {
      const topology = createTestTopology('team-001');

      const workflowId = workflowEngine.createWorkflow(topology);

      // Start the workflow first (can only pause a running workflow)
      await workflowEngine.startWorkflow(workflowId);

      // Pause
      const pauseResult = workflowEngine.pauseWorkflow(workflowId);
      expect(pauseResult).toBe(true);

      let state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('paused');

      // Resume
      const resumeResult = workflowEngine.resumeWorkflow(workflowId);
      expect(resumeResult).toBe(true);

      state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('running');
    });

    it('should return false when pausing non-existent workflow', () => {
      const result = workflowEngine.pauseWorkflow('non-existent-id');
      expect(result).toBe(false);
    });

    it('should return false when pausing non-running workflow', () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Workflow is pending, not running
      const result = workflowEngine.pauseWorkflow(workflowId);
      expect(result).toBe(false);
    });

    it('should return false when resuming non-existent workflow', () => {
      const result = workflowEngine.resumeWorkflow('non-existent-id');
      expect(result).toBe(false);
    });

    it('should return false when resuming non-paused workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Workflow is pending, not paused
      const result = workflowEngine.resumeWorkflow(workflowId);
      expect(result).toBe(false);
    });
  });

  describe('Workflow Queries', () => {
    it('should get all workflow IDs', () => {
      const topology1 = createTestTopology('team-001');
      const topology2 = createTestTopology('team-002');

      workflowEngine.createWorkflow(topology1);
      workflowEngine.createWorkflow(topology2);

      const ids = workflowEngine.getWorkflowIds();
      expect(ids.length).toBe(2);
    });

    it('should clear completed workflows', async () => {
      const topology = createTestTopology('team-001');

      workflowEngine.createWorkflow(topology);
      workflowEngine.cancelWorkflow(workflowEngine.getWorkflowIds()[0]);

      const cleared = workflowEngine.clearCompletedWorkflows();
      expect(cleared).toBeGreaterThanOrEqual(0);
    });

    it('should clear failed workflows', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Manually set to failed
      const state = workflowEngine.getWorkflow(workflowId);
      if (state) {
        state.status = 'failed';
        state.completed_at = new Date().toISOString();
      }

      const cleared = workflowEngine.clearCompletedWorkflows();
      expect(cleared).toBe(1);
    });

    it('should clear cancelled workflows', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      workflowEngine.cancelWorkflow(workflowId);

      const cleared = workflowEngine.clearCompletedWorkflows();
      expect(cleared).toBe(1);
    });

    it('should return undefined for non-existent workflow', () => {
      const state = workflowEngine.getWorkflow('non-existent-id');
      expect(state).toBeUndefined();
    });
  });

  describe('HITL (Human-in-the-Loop)', () => {
    it('should pause workflow at HITL checkpoint', async () => {
      const hitlConfig: HITLConfig = {
        enabled: true,
        checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
      };
      const topology = createTestTopology('team-001', { hitlConfig });
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('paused');
    });

    it('should approve HITL checkpoint', async () => {
      const hitlConfig: HITLConfig = {
        enabled: true,
        checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
      };
      // Use multi-node topology so workflow continues after approval
      const topology = createTestTopology('team-001', {
        hitlConfig,
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'start',
              on_success: 'node-2',
            },
            {
              id: 'node-2',
              agent_id: 'urn:mycodexvantaos:agent:a2' as AgentURN,
              action: 'process',
            },
          ],
          edges: [{ from: 'node-1', to: 'node-2' }],
        },
      });
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      // Approve the checkpoint
      workflowEngine.approveHITLCheckpoint(
        workflowId,
        'node-1',
        'urn:mycodexvantaos:user:admin' as any
      );

      const state = workflowEngine.getWorkflow(workflowId);
      // After approval, workflow continues to next node (running) or completes
      expect(['running', 'completed']).toContain(state?.status);
    });

    it('should reject HITL checkpoint', async () => {
      const hitlConfig: HITLConfig = {
        enabled: true,
        checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
      };
      const topology = createTestTopology('team-001', { hitlConfig });
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      // Reject the checkpoint
      workflowEngine.rejectHITLCheckpoint(workflowId, 'node-1', 'Quality issues');

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('failed');
    });

    it('should handle rejection with on_failure path', async () => {
      const topology = createTestTopology('team-001', {
        workflowDefinition: {
          type: 'dag',
          nodes: [
            {
              id: 'node-1',
              agent_id: 'urn:mycodexvantaos:agent:a1' as AgentURN,
              action: 'start',
              on_failure: 'node-2',
            },
            {
              id: 'node-2',
              agent_id: 'urn:mycodexvantaos:agent:a2' as AgentURN,
              action: 'fallback',
            },
          ],
          edges: [],
        },
        hitlConfig: {
          enabled: true,
          checkpoints: [{ node_id: 'node-1', trigger_condition: 'always' as const }],
        },
      });
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);
      workflowEngine.rejectHITLCheckpoint(workflowId, 'node-1', 'Retry with fallback');

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('running');
      expect(state?.context.current_node).toBe('node-2');
    });

    it('should not approve checkpoint for non-paused workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Try to approve without HITL checkpoint (workflow won't be paused)
      workflowEngine.approveHITLCheckpoint(workflowId, 'node-1');

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('pending'); // Still pending, not affected
    });

    it('should not reject checkpoint for non-paused workflow', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      // Try to reject without HITL checkpoint (workflow won't be paused)
      workflowEngine.rejectHITLCheckpoint(workflowId, 'node-1');

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.status).toBe('pending'); // Still pending, not affected
    });
  });

  describe('Multi-node Workflow', () => {
    it('should create multi-node workflow', () => {
      const topology = createMultiNodeTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.workflow_definition.nodes.length).toBe(3);
    });

    it('should start multi-node workflow at initial state', async () => {
      const topology = createMultiNodeTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);

      await workflowEngine.startWorkflow(workflowId);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state?.context.current_node).toBe('node-1');
    });
  });

  describe('Event Handling', () => {
    it('should emit workflow:created event', () => {
      const handler = jest.fn();
      messageBus.on('workflow:created', handler);

      const topology = createTestTopology('team-001');
      workflowEngine.createWorkflow(topology);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit workflow:started event', async () => {
      const handler = jest.fn();
      messageBus.on('workflow:started', handler);

      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit workflow:paused event', async () => {
      const handler = jest.fn();
      messageBus.on('workflow:paused', handler);

      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);
      workflowEngine.pauseWorkflow(workflowId);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit workflow:resumed event', async () => {
      const handler = jest.fn();
      messageBus.on('workflow:resumed', handler);

      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);
      workflowEngine.pauseWorkflow(workflowId);
      workflowEngine.resumeWorkflow(workflowId);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit workflow:completed event on cancel', () => {
      const handler = jest.fn();
      messageBus.on('workflow:completed', handler);

      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      workflowEngine.cancelWorkflow(workflowId);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom configuration', () => {
      const customEngine = new WorkflowEngine(messageBus, {
        maxConcurrentWorkflows: 5,
        defaultNodeTimeoutMs: 30000,
        hitlDefaultTimeoutSeconds: 600,
        enableAutoRetry: false,
        maxRetries: 5,
      });

      expect(customEngine).toBeDefined();
    });

    it('should handle multiple concurrent workflows', () => {
      const topology1 = createTestTopology('team-001');
      const topology2 = createTestTopology('team-002');

      const workflowId1 = workflowEngine.createWorkflow(topology1);
      const workflowId2 = workflowEngine.createWorkflow(topology2);

      expect(workflowId1).toBeDefined();
      expect(workflowId2).toBeDefined();
      expect(workflowEngine.getWorkflowIds()).toHaveLength(2);
    });

    it('should handle workflow with empty variables', async () => {
      const topology = createTestTopology('team-001');
      const workflowId = workflowEngine.createWorkflow(topology);
      await workflowEngine.startWorkflow(workflowId);

      const state = workflowEngine.getWorkflow(workflowId);
      expect(state).toBeDefined();
    });
  });
});

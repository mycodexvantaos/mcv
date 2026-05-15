/**
 * Unit tests for AgentManager
 * @module @mycodexvantaos/ai-team-orchestrator/tests
 */

import { AgentManager } from '../../src/core/agent-manager';
import { MessageBus } from '../../src/core/message-bus';
import type { AgentProfile, AgentURN } from '../../src/types';

describe('AgentManager', () => {
  let messageBus: MessageBus;
  let agentManager: AgentManager;

  const mockAgentProfile: AgentProfile = {
    id: 'urn:mycodexvantaos:agent:test-agent-01',
    name: 'Test Agent',
    version: '1.0.0',
    role: 'engineer',
    goal: 'Test goal',
    backstory: 'Test backstory',
    allowed_tools: [],
    status: 'active',
  };

  beforeEach(() => {
    messageBus = new MessageBus();
    agentManager = new AgentManager(messageBus, undefined, {
      maxAgents: 10,
      defaultContextCapacity: 8000,
    });
  });

  afterEach(() => {
    messageBus.clear();
  });

  describe('registerAgent', () => {
    it('should register a new agent successfully', () => {
      const agentId = agentManager.registerAgent(mockAgentProfile);
      expect(agentId).toBe(mockAgentProfile.id);
      expect(agentManager.count).toBe(1);
    });

    it('should throw error when registering duplicate agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      expect(() => agentManager.registerAgent(mockAgentProfile)).toThrow('already registered');
    });

    it('should throw error when max agents limit reached', () => {
      const smallManager = new AgentManager(messageBus, undefined, {
        maxAgents: 2,
      });

      smallManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:agent-01',
      });
      smallManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:agent-02',
      });

      expect(() =>
        smallManager.registerAgent({
          ...mockAgentProfile,
          id: 'urn:mycodexvantaos:agent:agent-03',
        })
      ).toThrow('Maximum agent limit');
    });

    it('should emit agent:registered event', () => {
      const eventHandler = jest.fn();
      messageBus.on('agent:registered', eventHandler);

      agentManager.registerAgent(mockAgentProfile);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: mockAgentProfile.id,
        })
      );
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister an existing agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      const result = agentManager.unregisterAgent(mockAgentProfile.id);
      expect(result).toBe(true);
      expect(agentManager.count).toBe(0);
    });

    it('should return false for non-existent agent', () => {
      const result = agentManager.unregisterAgent(
        'urn:mycodexvantaos:agent:non-existent' as AgentURN
      );
      expect(result).toBe(false);
    });

    it('should throw error when unregistering busy agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.assignTask(mockAgentProfile.id, 'urn:mycodexvantaos:task:test-task-01');

      expect(() => agentManager.unregisterAgent(mockAgentProfile.id)).toThrow('agent is busy');
    });
  });

  describe('getAgent', () => {
    it('should return agent profile for existing agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      const profile = agentManager.getAgent(mockAgentProfile.id);
      expect(profile).toEqual(mockAgentProfile);
    });

    it('should return undefined for non-existent agent', () => {
      const profile = agentManager.getAgent('urn:mycodexvantaos:agent:non-existent' as AgentURN);
      expect(profile).toBeUndefined();
    });
  });

  describe('getAvailableAgents', () => {
    it('should return only idle agents', () => {
      agentManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:idle-agent',
      });
      agentManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:busy-agent',
      });

      agentManager.assignTask(
        'urn:mycodexvantaos:agent:busy-agent' as AgentURN,
        'urn:mycodexvantaos:task:test-task'
      );

      const available = agentManager.getAvailableAgents();
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('urn:mycodexvantaos:agent:idle-agent');
    });
  });

  describe('assignTask', () => {
    it('should assign task to idle agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      const result = agentManager.assignTask(
        mockAgentProfile.id,
        'urn:mycodexvantaos:task:test-task'
      );
      expect(result).toBe(true);

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.status).toBe('busy');
      expect(state?.current_task_id).toBe('urn:mycodexvantaos:task:test-task');
    });

    it('should throw error when assigning task to non-existent agent', () => {
      expect(() =>
        agentManager.assignTask(
          'urn:mycodexvantaos:agent:non-existent' as AgentURN,
          'urn:mycodexvantaos:task:test-task'
        )
      ).toThrow('not found');
    });

    it('should throw error when assigning task to busy agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.assignTask(mockAgentProfile.id, 'urn:mycodexvantaos:task:task-01');

      expect(() =>
        agentManager.assignTask(mockAgentProfile.id, 'urn:mycodexvantaos:task:task-02')
      ).toThrow('not available');
    });
  });

  describe('releaseAgent', () => {
    it('should release agent and set status to idle', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.assignTask(mockAgentProfile.id, 'urn:mycodexvantaos:task:test-task');

      const result = agentManager.releaseAgent(mockAgentProfile.id);
      expect(result).toBe(true);

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.status).toBe('idle');
      expect(state?.current_task_id).toBeNull();
    });
  });

  describe('updateContext', () => {
    it('should add context to agent context window', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.updateContext(mockAgentProfile.id, { data: 'test' });

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.context_window).toHaveLength(1);
    });

    it('should throw error for non-existent agent', () => {
      expect(() =>
        agentManager.updateContext('urn:mycodexvantaos:agent:non-existent' as AgentURN, {
          data: 'test',
        })
      ).toThrow('not found');
    });
  });

  describe('clearContext', () => {
    it('should clear agent context window', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.updateContext(mockAgentProfile.id, { data: 'test' });
      agentManager.clearContext(mockAgentProfile.id);

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.context_window).toHaveLength(0);
    });
  });

  describe('getAllAgents', () => {
    it('should return all registered agents', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:agent-02' as AgentURN,
      });

      const agents = agentManager.getAllAgents();
      expect(agents).toHaveLength(2);
    });

    it('should return empty array when no agents registered', () => {
      const agents = agentManager.getAllAgents();
      expect(agents).toHaveLength(0);
    });
  });

  describe('getAgentsByRole', () => {
    it('should return agents filtered by role', () => {
      agentManager.registerAgent({ ...mockAgentProfile, role: 'analyst' });
      agentManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:agent-02' as AgentURN,
        role: 'engineer',
      });

      const analysts = agentManager.getAgentsByRole('analyst');
      expect(analysts).toHaveLength(1);
      expect(analysts[0].role).toBe('analyst');
    });

    it('should return empty array when no agents match role', () => {
      agentManager.registerAgent(mockAgentProfile);

      const managers = agentManager.getAgentsByRole('manager');
      expect(managers).toHaveLength(0);
    });
  });

  describe('has', () => {
    it('should return true for existing agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      expect(agentManager.has(mockAgentProfile.id)).toBe(true);
    });

    it('should return false for non-existent agent', () => {
      expect(agentManager.has('urn:mycodexvantaos:agent:non-existent' as AgentURN)).toBe(false);
    });
  });

  describe('getAgentState', () => {
    it('should return agent state for existing agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state).toBeDefined();
      expect(state?.profile.id).toBe(mockAgentProfile.id);
    });

    it('should return undefined for non-existent agent', () => {
      const state = agentManager.getAgentState('urn:mycodexvantaos:agent:non-existent' as AgentURN);
      expect(state).toBeUndefined();
    });
  });

  describe('updateContext with compression', () => {
    it('should handle context update with compression enabled', () => {
      agentManager.registerAgent(mockAgentProfile);

      // Add multiple context items
      for (let i = 0; i < 10; i++) {
        agentManager.updateContext(mockAgentProfile.id, { data: 'test'.repeat(100) });
      }

      // Add one more with compression
      agentManager.updateContext(mockAgentProfile.id, { data: 'final' }, true);

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.context_window.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should throw error when clearing context for non-existent agent', () => {
      expect(() =>
        agentManager.clearContext('urn:mycodexvantaos:agent:non-existent' as AgentURN)
      ).toThrow('not found');
    });
  });

  // Extended coverage tests
  describe('assignTask', () => {
    it('should assign task to idle agent', () => {
      agentManager.registerAgent(mockAgentProfile);
      const taskId = 'urn:mycodexvantaos:task:test-task' as any;
      const result = agentManager.assignTask(mockAgentProfile.id, taskId);
      expect(result).toBe(true);
    });

    it('should throw when assigning task to non-existent agent', () => {
      const taskId = 'urn:mycodexvantaos:task:test-task' as any;
      expect(() =>
        agentManager.assignTask('urn:mycodexvantaos:agent:non-existent' as AgentURN, taskId)
      ).toThrow('not found');
    });
  });

  describe('releaseAgent', () => {
    it('should release agent from task', () => {
      agentManager.registerAgent(mockAgentProfile);
      const taskId = 'urn:mycodexvantaos:task:test-task' as any;
      agentManager.assignTask(mockAgentProfile.id, taskId);

      const result = agentManager.releaseAgent(mockAgentProfile.id);
      expect(result).toBe(true);

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.status).toBe('idle');
      expect(state?.current_task_id).toBeNull();
    });

    it('should return false when releasing non-existent agent', () => {
      const result = agentManager.releaseAgent('urn:mycodexvantaos:agent:non-existent' as AgentURN);
      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct agent count', () => {
      expect(agentManager.count).toBe(0);
      agentManager.registerAgent(mockAgentProfile);
      expect(agentManager.count).toBe(1);
    });
  });

  describe('getAvailableAgents', () => {
    it('should return only idle agents', () => {
      agentManager.registerAgent(mockAgentProfile);
      agentManager.registerAgent({
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:agent2' as any,
        name: 'Agent 2',
      });

      const available = agentManager.getAvailableAgents();
      expect(available.length).toBe(2);

      // Assign task to one agent
      agentManager.assignTask(mockAgentProfile.id, 'urn:mycodexvantaos:task:task1' as any);

      const availableAfter = agentManager.getAvailableAgents();
      expect(availableAfter.length).toBe(1);
    });
  });

  describe('updateContext extended', () => {
    it('should throw error for non-existent agent', () => {
      expect(() =>
        agentManager.updateContext('urn:mycodexvantaos:agent:non-existent' as AgentURN, {
          data: 'test',
        })
      ).toThrow('not found');
    });

    it('should add multiple context items', () => {
      agentManager.registerAgent(mockAgentProfile);

      agentManager.updateContext(mockAgentProfile.id, 'item1');
      agentManager.updateContext(mockAgentProfile.id, 'item2');
      agentManager.updateContext(mockAgentProfile.id, { complex: 'object' });

      const state = agentManager.getAgentState(mockAgentProfile.id);
      expect(state?.context_window.length).toBe(3);
    });
  });

  describe('agent status transitions', () => {
    it('should track status changes', () => {
      agentManager.registerAgent(mockAgentProfile);

      const state1 = agentManager.getAgentState(mockAgentProfile.id);
      expect(state1?.status).toBe('idle');

      const taskId = 'urn:mycodexvantaos:task:status-test' as any;
      agentManager.assignTask(mockAgentProfile.id, taskId);

      const state2 = agentManager.getAgentState(mockAgentProfile.id);
      expect(state2?.status).toBe('busy');
      expect(state2?.current_task_id).toBe(taskId);

      agentManager.releaseAgent(mockAgentProfile.id);

      const state3 = agentManager.getAgentState(mockAgentProfile.id);
      expect(state3?.status).toBe('idle');
    });
  });

  describe('context compression', () => {
    it('should compress context when over threshold', () => {
      // Create agent with small context capacity
      const smallContextAgent: AgentProfile = {
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:small-context' as any,
        memory_configuration: {
          short_term_capacity: 100, // Very small
          memory_compression_threshold: 0.5,
        },
      };

      agentManager.registerAgent(smallContextAgent);

      // Add large context items
      for (let i = 0; i < 20; i++) {
        agentManager.updateContext(smallContextAgent.id, 'x'.repeat(50), true);
      }

      const state = agentManager.getAgentState(smallContextAgent.id);
      // Context should be compressed
      expect(state?.context_window.length).toBeLessThan(20);
    });

    it('should add compression notice when entries removed', () => {
      const smallContextAgent: AgentProfile = {
        ...mockAgentProfile,
        id: 'urn:mycodexvantaos:agent:compress-notice' as any,
        memory_configuration: {
          short_term_capacity: 100,
          memory_compression_threshold: 0.5,
        },
      };

      agentManager.registerAgent(smallContextAgent);

      // Add many items
      for (let i = 0; i < 30; i++) {
        agentManager.updateContext(smallContextAgent.id, 'x'.repeat(30), true);
      }

      const state = agentManager.getAgentState(smallContextAgent.id);
      // Should have compression notice
      const hasNotice = state?.context_window.some(
        (item) => typeof item === 'object' && (item as any)._compressed === true
      );
      expect(hasNotice).toBe(true);
    });
  });
});

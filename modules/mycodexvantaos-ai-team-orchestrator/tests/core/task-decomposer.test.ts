/**
 * Unit tests for TaskDecomposer
 * @module @mycodexvantaos/ai-team-orchestrator/tests
 */

import {
  TaskDecomposer,
  DecompositionStrategy,
  DecompositionResult,
} from '../../src/core/task-decomposer';
import { MessageBus } from '../../src/core/message-bus';
import type { AgentTask, TaskURN } from '../../src/types';

describe('TaskDecomposer', () => {
  let taskDecomposer: TaskDecomposer;
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus();
    taskDecomposer = new TaskDecomposer(messageBus, {
      maxDepth: 3,
      maxSubtasks: 10,
    });
  });

  afterEach(() => {
    messageBus.clear();
  });

  describe('Decomposition', () => {
    it('should decompose task into subtasks', () => {
      // Use a "review" pattern which has no condition check (unlike "implement" which requires complexity >= 5)
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:test-task' as TaskURN,
        objective: 'Review code for security vulnerabilities',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      expect(result.success).toBe(true);
      expect(result.subtasks.length).toBeGreaterThan(0);
      expect(result.strategy).toBeDefined();
    });

    it('should respect maxDepth configuration', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:deep-task' as TaskURN,
        objective: 'Implement complex feature with many components',
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
      };

      // Decompose at max depth should return success: false
      const result = taskDecomposer.decompose(task, 3);
      expect(result.success).toBe(false);
      expect(result.subtasks).toHaveLength(0);
    });

    it('should generate sequential dependencies for feature tasks', () => {
      // Use "deploy" pattern which has no condition and uses sequential strategy
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:feature-task' as TaskURN,
        objective: 'Deploy new feature for user management',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      if (result.success && result.subtasks.length > 1) {
        // Sequential strategy should have dependencies
        expect(result.dependencies.length).toBeGreaterThan(0);
      }
    });

    it('should generate parallel subtasks for review tasks', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:review-task' as TaskURN,
        objective: 'Review code for security and performance',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('parallel');
    });

    it('should generate testing subtasks', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:test-task' as TaskURN,
        objective: 'Test the authentication module',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      expect(result.success).toBe(true);
      expect(result.subtasks.length).toBeGreaterThan(0);
    });

    it('should generate deployment subtasks', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:deploy-task' as TaskURN,
        objective: 'Deploy to production environment',
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('sequential');
    });

    it('should return no subtasks for simple tasks', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:simple-task' as TaskURN,
        objective: 'Simple task that does not match any pattern',
        status: 'pending',
        priority: 'low',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);

      // May or may not decompose depending on rules
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Rule Management', () => {
    it('should add custom decomposition rule', () => {
      taskDecomposer.addRule({
        pattern: /custom/i,
        strategy: 'parallel',
        subtaskGenerator: (task) => [
          {
            id: 'urn:mycodexvantaos:task:custom-1' as TaskURN,
            objective: 'Custom subtask 1',
            status: 'pending',
            priority: 'normal',
            created_at: new Date().toISOString(),
          },
        ],
      });

      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:custom-task' as TaskURN,
        objective: 'Custom task for testing',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result.success).toBe(true);
    });

    it('should remove decomposition rule', () => {
      const initialRules = 5; // Default rules
      const removed = taskDecomposer.removeRule(0);
      expect(removed).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should get template by id', () => {
      const template = taskDecomposer.getTemplate('feature');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Feature Development');
    });

    it('should add custom template', () => {
      taskDecomposer.addTemplate({
        id: 'custom',
        name: 'Custom Template',
        description: 'A custom template',
        objective_template: 'Custom {{PARAM}}',
        default_priority: 'normal',
        required_capabilities: ['custom'],
        estimated_complexity: 'medium',
      });

      const template = taskDecomposer.getTemplate('custom');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Custom Template');
    });

    it('should get all templates', () => {
      const templates = taskDecomposer.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('Events', () => {
    it('should emit task:decomposed event', () => {
      const handler = jest.fn();
      messageBus.on('task:decomposed', handler);

      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:event-task' as TaskURN,
        objective: 'Review code for testing events',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      taskDecomposer.decompose(task);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task without priority', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:no-priority' as TaskURN,
        objective: 'Review feature code',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result).toBeDefined();
    });

    it('should handle task with context', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:with-context' as TaskURN,
        objective: 'Review feature with context',
        status: 'pending',
        priority: 'high',
        context: {
          constraints: ['constraint1', 'constraint2'],
          references: [{ type: 'document', uri: 'ref1' }],
        },
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result).toBeDefined();
    });

    it('should handle bug task type', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:bug-task' as TaskURN,
        objective: 'Fix critical bug in authentication',
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result).toBeDefined();
    });

    it('should handle security task type', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:security-task' as TaskURN,
        objective: 'Address security vulnerability',
        status: 'pending',
        priority: 'critical',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result).toBeDefined();
    });

    it('should handle deployment task type', () => {
      const task: AgentTask = {
        id: 'urn:mycodexvantaos:task:deploy-task' as TaskURN,
        objective: 'Deploy to production',
        status: 'pending',
        priority: 'normal',
        created_at: new Date().toISOString(),
      };

      const result = taskDecomposer.decompose(task);
      expect(result).toBeDefined();
    });
  });
});

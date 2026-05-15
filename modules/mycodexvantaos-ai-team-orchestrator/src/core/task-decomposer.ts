/**
 * TaskDecomposer - Decomposes complex tasks into subtasks
 * @module @mycodexvantaos/ai-team-orchestrator/core
 */

import type {
  AgentTask,
  TaskURN,
  AgentURN,
  TaskStatus,
  TaskPriority,
  TaskContext,
  TaskDecomposition,
} from '../types';
import { MessageBus } from './message-bus';
import { v4 as uuidv4 } from 'uuid';

/**
 * Decomposition strategy
 */
export type DecompositionStrategy = 'sequential' | 'parallel' | 'hybrid';

/**
 * Decomposition rule definition
 */
export interface DecompositionRule {
  pattern: RegExp | string;
  strategy: DecompositionStrategy;
  subtaskGenerator: (task: AgentTask) => AgentTask[];
  condition?: (task: AgentTask) => boolean;
}

/**
 * Task template for decomposition
 */
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  objective_template: string;
  default_priority: TaskPriority;
  required_capabilities: string[];
  estimated_complexity: 'low' | 'medium' | 'high';
}

/**
 * Decomposition result
 */
export interface DecompositionResult {
  success: boolean;
  subtasks: AgentTask[];
  strategy: DecompositionStrategy;
  dependencies: Array<{ subtask_id: TaskURN; depends_on: TaskURN[] }>;
  estimated_total_time_ms?: number;
}

/**
 * Configuration for TaskDecomposer
 */
export interface TaskDecomposerConfig {
  maxDepth?: number;
  maxSubtasks?: number;
  enableAutoDecomposition?: boolean;
  complexityThreshold?: number;
}

const DEFAULT_CONFIG: Required<TaskDecomposerConfig> = {
  maxDepth: 3,
  maxSubtasks: 10,
  enableAutoDecomposition: true,
  complexityThreshold: 5,
};

/**
 * TaskDecomposer class
 * Handles task decomposition and subtask management
 */
export class TaskDecomposer {
  private messageBus: MessageBus;
  private config: Required<TaskDecomposerConfig>;
  private decompositionRules: DecompositionRule[] = [];
  private taskTemplates: Map<string, TaskTemplate> = new Map();

  constructor(messageBus: MessageBus, config?: TaskDecomposerConfig) {
    this.messageBus = messageBus;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDefaultRules();
    this.initializeDefaultTemplates();
  }

  // ============================================================================
  // Decomposition
  // ============================================================================

  /**
   * Decompose a task into subtasks
   * @param task - The task to decompose
   * @param depth - Current decomposition depth
   * @returns Decomposition result
   */
  public decompose(task: AgentTask, depth: number = 0): DecompositionResult {
    // Check depth limit
    if (depth >= this.config.maxDepth) {
      return {
        success: false,
        subtasks: [],
        strategy: 'sequential',
        dependencies: [],
      };
    }

    // Find matching rule
    const rule = this.findMatchingRule(task);
    if (!rule) {
      return {
        success: false,
        subtasks: [],
        strategy: 'sequential',
        dependencies: [],
      };
    }

    // Generate subtasks
    const subtasks = rule.subtaskGenerator(task);

    // Validate subtask count
    if (subtasks.length > this.config.maxSubtasks) {
      console.warn(
        `Task decomposition exceeded max subtasks (${this.config.maxSubtasks}), truncating`
      );
      subtasks.splice(this.config.maxSubtasks);
    }

    // Set up parent-child relationship
    for (const subtask of subtasks) {
      subtask.parent_task_id = task.id;
      subtask.status = 'pending';
    }

    // Generate dependencies based on strategy
    const dependencies = this.generateDependencies(subtasks, rule.strategy);

    // Create decomposition info
    const decomposition: TaskDecomposition = {
      strategy: rule.strategy,
      subtasks,
      dependencies,
    };

    // Emit decomposition event
    this.messageBus.emit('task:decomposed', {
      parent_task_id: task.id,
      subtask_count: subtasks.length,
      strategy: rule.strategy,
      depth,
    });

    return {
      success: true,
      subtasks,
      strategy: rule.strategy,
      dependencies,
    };
  }

  /**
   * Find a matching decomposition rule
   */
  private findMatchingRule(task: AgentTask): DecompositionRule | undefined {
    for (const rule of this.decompositionRules) {
      // Check condition first
      if (rule.condition && !rule.condition(task)) {
        continue;
      }

      // Check pattern match
      if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(task.objective)) {
          return rule;
        }
      } else {
        if (task.objective.toLowerCase().includes(rule.pattern.toLowerCase())) {
          return rule;
        }
      }
    }

    return undefined;
  }

  /**
   * Generate dependencies between subtasks
   */
  private generateDependencies(
    subtasks: AgentTask[],
    strategy: DecompositionStrategy
  ): Array<{ subtask_id: TaskURN; depends_on: TaskURN[] }> {
    const dependencies: Array<{ subtask_id: TaskURN; depends_on: TaskURN[] }> = [];

    switch (strategy) {
      case 'sequential':
        // Each task depends on the previous one
        for (let i = 1; i < subtasks.length; i++) {
          dependencies.push({
            subtask_id: subtasks[i].id,
            depends_on: [subtasks[i - 1].id],
          });
        }
        break;

      case 'parallel':
        // No dependencies between tasks
        break;

      case 'hybrid':
        // Mixed: some tasks can run in parallel, others are sequential
        // This is a simplified implementation
        const midpoint = Math.floor(subtasks.length / 2);
        for (let i = midpoint; i < subtasks.length; i++) {
          dependencies.push({
            subtask_id: subtasks[i].id,
            depends_on: [subtasks[i - 1].id],
          });
        }
        break;
    }

    return dependencies;
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  /**
   * Add a decomposition rule
   */
  public addRule(rule: DecompositionRule): void {
    this.decompositionRules.push(rule);
  }

  /**
   * Remove a decomposition rule
   */
  public removeRule(index: number): boolean {
    if (index >= 0 && index < this.decompositionRules.length) {
      this.decompositionRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Initialize default decomposition rules
   */
  private initializeDefaultRules(): void {
    // Feature development decomposition
    this.addRule({
      pattern: /implement|develop|build|create/i,
      strategy: 'sequential',
      condition: (task) => {
        const complexity = this.estimateComplexity(task);
        return complexity >= this.config.complexityThreshold;
      },
      subtaskGenerator: (task) => this.generateFeatureSubtasks(task),
    });

    // Code review decomposition
    this.addRule({
      pattern: /review|audit|analyze/i,
      strategy: 'parallel',
      subtaskGenerator: (task) => this.generateReviewSubtasks(task),
    });

    // Testing decomposition
    this.addRule({
      pattern: /test|verify|validate/i,
      strategy: 'parallel',
      subtaskGenerator: (task) => this.generateTestingSubtasks(task),
    });

    // Deployment decomposition
    this.addRule({
      pattern: /deploy|release|publish/i,
      strategy: 'sequential',
      subtaskGenerator: (task) => this.generateDeploymentSubtasks(task),
    });

    // Security audit decomposition
    this.addRule({
      pattern: /security|vulnerability|penetration/i,
      strategy: 'sequential',
      subtaskGenerator: (task) => this.generateSecuritySubtasks(task),
    });
  }

  // ============================================================================
  // Subtask Generators
  // ============================================================================

  /**
   * Generate subtasks for feature development
   */
  private generateFeatureSubtasks(parentTask: AgentTask): AgentTask[] {
    const subtasks: AgentTask[] = [];
    const baseId = parentTask.id.replace('task:', 'task:sub-');

    subtasks.push(
      this.createSubtask(
        `${baseId}-design-001` as TaskURN,
        parentTask,
        'Design architecture and data models for: ' + parentTask.objective,
        'architect'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-implement-002` as TaskURN,
        parentTask,
        'Implement core functionality for: ' + parentTask.objective,
        'engineer'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-test-003` as TaskURN,
        parentTask,
        'Write and execute tests for: ' + parentTask.objective,
        'tester'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-review-004` as TaskURN,
        parentTask,
        'Code review for: ' + parentTask.objective,
        'reviewer'
      )
    );

    return subtasks;
  }

  /**
   * Generate subtasks for review tasks
   */
  private generateReviewSubtasks(parentTask: AgentTask): AgentTask[] {
    const subtasks: AgentTask[] = [];
    const baseId = parentTask.id.replace('task:', 'task:sub-');

    subtasks.push(
      this.createSubtask(
        `${baseId}-code-quality-001` as TaskURN,
        parentTask,
        'Code quality review: check style, complexity, and maintainability',
        'reviewer'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-security-002` as TaskURN,
        parentTask,
        'Security review: identify potential vulnerabilities',
        'security_specialist'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-performance-003` as TaskURN,
        parentTask,
        'Performance review: identify bottlenecks and optimization opportunities',
        'analyst'
      )
    );

    return subtasks;
  }

  /**
   * Generate subtasks for testing tasks
   */
  private generateTestingSubtasks(parentTask: AgentTask): AgentTask[] {
    const subtasks: AgentTask[] = [];
    const baseId = parentTask.id.replace('task:', 'task:sub-');

    subtasks.push(
      this.createSubtask(
        `${baseId}-unit-001` as TaskURN,
        parentTask,
        'Write and run unit tests',
        'tester'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-integration-002` as TaskURN,
        parentTask,
        'Write and run integration tests',
        'tester'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-e2e-003` as TaskURN,
        parentTask,
        'Write and run end-to-end tests',
        'tester'
      )
    );

    return subtasks;
  }

  /**
   * Generate subtasks for deployment tasks
   */
  private generateDeploymentSubtasks(parentTask: AgentTask): AgentTask[] {
    const subtasks: AgentTask[] = [];
    const baseId = parentTask.id.replace('task:', 'task:sub-');

    subtasks.push(
      this.createSubtask(
        `${baseId}-prepare-001` as TaskURN,
        parentTask,
        'Prepare deployment artifacts and configuration',
        'devops_engineer'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-staging-002` as TaskURN,
        parentTask,
        'Deploy to staging environment and validate',
        'devops_engineer'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-production-003` as TaskURN,
        parentTask,
        'Deploy to production environment',
        'devops_engineer'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-verify-004` as TaskURN,
        parentTask,
        'Verify deployment success and monitor metrics',
        'devops_engineer'
      )
    );

    return subtasks;
  }

  /**
   * Generate subtasks for security audit tasks
   */
  private generateSecuritySubtasks(parentTask: AgentTask): AgentTask[] {
    const subtasks: AgentTask[] = [];
    const baseId = parentTask.id.replace('task:', 'task:sub-');

    subtasks.push(
      this.createSubtask(
        `${baseId}-scan-001` as TaskURN,
        parentTask,
        'Run automated security scanning tools',
        'security_specialist'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-analyze-002` as TaskURN,
        parentTask,
        'Analyze scan results and identify vulnerabilities',
        'security_specialist'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-remediate-003` as TaskURN,
        parentTask,
        'Propose remediation steps for identified vulnerabilities',
        'security_specialist'
      )
    );

    subtasks.push(
      this.createSubtask(
        `${baseId}-ethics-004` as TaskURN,
        parentTask,
        'Ethics review: ensure compliance with AI ethics guidelines',
        'ethicist'
      )
    );

    return subtasks;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Create a subtask
   */
  private createSubtask(
    id: TaskURN,
    parentTask: AgentTask,
    objective: string,
    suggestedRole: string
  ): AgentTask {
    return {
      id,
      parent_task_id: parentTask.id,
      objective,
      context: parentTask.context,
      status: 'pending',
      priority: parentTask.priority,
      created_at: new Date().toISOString(),
      metadata: {
        ...parentTask.metadata,
        suggested_role: suggestedRole,
      },
    };
  }

  /**
   * Estimate task complexity
   */
  private estimateComplexity(task: AgentTask): number {
    let complexity = 0;

    // Factor in objective length
    complexity += Math.min(task.objective.length / 100, 3);

    // Factor in context
    if (task.context?.constraints?.length) {
      complexity += task.context.constraints.length * 0.5;
    }

    if (task.context?.references?.length) {
      complexity += task.context.references.length * 0.3;
    }

    // Factor in priority
    const priorityWeights: Record<TaskPriority, number> = {
      low: 0.5,
      normal: 1,
      high: 1.5,
      critical: 2,
    };
    complexity *= priorityWeights[task.priority ?? 'normal'];

    return Math.round(complexity);
  }

  /**
   * Initialize default task templates
   */
  private initializeDefaultTemplates(): void {
    this.taskTemplates.set('feature', {
      id: 'feature',
      name: 'Feature Development',
      description: 'Template for implementing new features',
      objective_template: 'Implement {{FEATURE_NAME}} with {{REQUIREMENTS}}',
      default_priority: 'normal',
      required_capabilities: ['code-generation', 'testing'],
      estimated_complexity: 'high',
    });

    this.taskTemplates.set('bugfix', {
      id: 'bugfix',
      name: 'Bug Fix',
      description: 'Template for fixing bugs',
      objective_template: 'Fix bug: {{BUG_DESCRIPTION}}',
      default_priority: 'high',
      required_capabilities: ['code-analysis', 'debugging'],
      estimated_complexity: 'medium',
    });

    this.taskTemplates.set('review', {
      id: 'review',
      name: 'Code Review',
      description: 'Template for code reviews',
      objective_template: 'Review code for {{TARGET}}',
      default_priority: 'normal',
      required_capabilities: ['code-analysis'],
      estimated_complexity: 'low',
    });
  }

  /**
   * Get a task template
   */
  public getTemplate(templateId: string): TaskTemplate | undefined {
    return this.taskTemplates.get(templateId);
  }

  /**
   * Add a task template
   */
  public addTemplate(template: TaskTemplate): void {
    this.taskTemplates.set(template.id, template);
  }

  /**
   * Get all templates
   */
  public getTemplates(): TaskTemplate[] {
    return Array.from(this.taskTemplates.values());
  }
}

export default TaskDecomposer;

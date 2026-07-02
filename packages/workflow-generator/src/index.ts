/**
 * Workflow Generator Module
 *
 * This module provides capabilities for generating workflow definitions,
 * orchestration pipelines, and automation scripts from business requirements.
 */

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'trigger' | 'condition' | 'parallel' | 'sequence';
  config: Record<string, any>;
  next?: string | string[];
  onFail?: string;
  retryPolicy?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    delay: number;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  timeout?: number;
}

export interface WorkflowGeneratorOptions {
  format?: 'yaml' | 'json' | 'typescript';
  includeErrorHandling?: boolean;
  includeLogging?: boolean;
  retryStrategy?: 'none' | 'linear' | 'exponential';
}

export interface TaskDefinition {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  dependencies?: string[];
}

export class WorkflowGenerator {
  private options: WorkflowGeneratorOptions;

  constructor(options: WorkflowGeneratorOptions = {}) {
    this.options = {
      format: 'yaml',
      includeErrorHandling: true,
      includeLogging: true,
      retryStrategy: 'exponential',
      ...options,
    };
  }

  /**
   * Generate a linear workflow from tasks
   */
  generateLinearWorkflow(name: string, tasks: TaskDefinition[]): WorkflowDefinition {
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const step: WorkflowStep = {
        id: task.id,
        name: task.name,
        type: 'action',
        config: {
          ...task.config,
          type: task.type,
        },
      };

      // Add next step reference
      if (i < tasks.length - 1) {
        step.next = tasks[i + 1].id;
      }

      // Add retry policy if enabled
      if (this.options.retryStrategy && this.options.retryStrategy !== 'none') {
        step.retryPolicy = {
          maxAttempts: 3,
          backoff: this.options.retryStrategy,
          delay: 1000,
        };
      }

      steps.push(step);
    }

    return {
      id: this.formatId(name),
      name,
      version: '1.0.0',
      steps,
    };
  }

  /**
   * Generate a parallel workflow
   */
  generateParallelWorkflow(
    name: string,
    parallelTasks: TaskDefinition[][],
    finalTask?: TaskDefinition
  ): WorkflowDefinition {
    const steps: WorkflowStep[] = [];
    const finalStepId = finalTask ? finalTask.id : 'finish';

    // Create a single parallel step with all branches
    const parallelStep: WorkflowStep = {
      id: 'parallel_0',
      name: 'Execute parallel branches',
      type: 'parallel',
      config: {
        branches: parallelTasks.map((branch, branchIndex) => ({
          id: `branch_${branchIndex}`,
          name: `Branch ${branchIndex + 1}`,
          type: 'action',
          steps: branch.map((task) => ({
            id: task.id,
            name: task.name,
            type: 'action',
            config: {
              ...task.config,
              type: task.type,
            },
          })),
        })),
      },
      next: finalStepId,
    };

    steps.push(parallelStep);

    // Add final task if provided
    if (finalTask) {
      const finalStep: WorkflowStep = {
        id: finalTask.id,
        name: finalTask.name,
        type: 'action',
        config: {
          ...finalTask.config,
          type: finalTask.type,
        },
      };
      steps.push(finalStep);
    }

    return {
      id: this.formatId(name),
      name,
      version: '1.0.0',
      steps,
    };
  }

  /**
   * Generate a conditional workflow
   */
  generateConditionalWorkflow(
    name: string,
    condition: string,
    trueBranch: TaskDefinition[],
    falseBranch: TaskDefinition[],
    finalTask?: TaskDefinition
  ): WorkflowDefinition {
    const steps: WorkflowStep[] = [];
    const conditionId = 'condition_0';
    const trueBranchId = 'true_branch';
    const falseBranchId = 'false_branch';
    const finalStepId = finalTask ? finalTask.id : 'finish';

    // Create condition step
    const conditionStep: WorkflowStep = {
      id: conditionId,
      name: 'Evaluate condition',
      type: 'condition',
      config: {
        expression: condition,
      },
      next: [trueBranchId, falseBranchId],
    };
    steps.push(conditionStep);

    // Create true branch
    const trueBranchStep: WorkflowStep = {
      id: trueBranchId,
      name: 'True branch',
      type: 'sequence',
      config: {
        steps: trueBranch.map((task) => ({
          id: task.id,
          name: task.name,
          type: 'action',
          config: {
            ...task.config,
            type: task.type,
          },
        })),
      },
      next: finalStepId,
    };
    steps.push(trueBranchStep);

    // Create false branch
    const falseBranchStep: WorkflowStep = {
      id: falseBranchId,
      name: 'False branch',
      type: 'sequence',
      config: {
        steps: falseBranch.map((task) => ({
          id: task.id,
          name: task.name,
          type: 'action',
          config: {
            ...task.config,
            type: task.type,
          },
        })),
      },
      next: finalStepId,
    };
    steps.push(falseBranchStep);

    // Add final task if provided
    if (finalTask) {
      const finalStep: WorkflowStep = {
        id: finalTask.id,
        name: finalTask.name,
        type: 'action',
        config: {
          ...finalTask.config,
          type: finalTask.type,
        },
      };
      steps.push(finalStep);
    }

    return {
      id: this.formatId(name),
      name,
      version: '1.0.0',
      steps,
    };
  }

  /**
   * Generate workflow file content
   */
  generateWorkflowFile(workflow: WorkflowDefinition): string {
    if (this.options.format === 'json') {
      return JSON.stringify(workflow, null, 2);
    } else if (this.options.format === 'typescript') {
      return this.generateTypeScriptWorkflow(workflow);
    } else {
      return this.generateYamlWorkflow(workflow);
    }
  }

  /**
   * Generate CI/CD pipeline workflow
   */
  generateCiCdPipeline(name: string, stages: string[]): WorkflowDefinition {
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const step: WorkflowStep = {
        id: `stage_${i}`,
        name: stage,
        type: 'action',
        config: {
          type: 'pipeline_stage',
          stage,
          commands: this.getStageCommands(stage),
        },
      };

      if (i < stages.length - 1) {
        step.next = `stage_${i + 1}`;
      }

      steps.push(step);
    }

    return {
      id: this.formatId(name),
      name: `${name} Pipeline`,
      version: '1.0.0',
      steps,
    };
  }

  /**
   * Generate data processing pipeline
   */
  generateDataPipeline(
    name: string,
    sources: string[],
    transformations: string[],
    destinations: string[]
  ): WorkflowDefinition {
    const steps: WorkflowStep[] = [];
    let currentId = 'start';
    let parallelStepId: string | undefined;

    // Add source steps
    const sourceIds: string[] = [];
    for (let i = 0; i < sources.length; i++) {
      const stepId = `source_${i}`;
      sourceIds.push(stepId);
      steps.push({
        id: stepId,
        name: `Extract from ${sources[i]}`,
        type: 'action',
        config: {
          type: 'data_source',
          source: sources[i],
        },
      });
    }

    // If multiple sources, add a merge step
    let previousStep = sourceIds.length === 1 ? sourceIds[0] : 'merge_sources';
    if (sources.length > 1) {
      steps.push({
        id: 'merge_sources',
        name: 'Merge data sources',
        type: 'action',
        config: {
          type: 'data_merge',
          sources: sourceIds,
        },
      });
    }

    // Add transformation steps
    for (let i = 0; i < transformations.length; i++) {
      const stepId = `transform_${i}`;
      steps.push({
        id: stepId,
        name: transformations[i],
        type: 'action',
        config: {
          type: 'data_transform',
          transformation: transformations[i],
        },
      });

      // Link previous step to this one
      const previousStepObj = steps.find((s) => s.id === previousStep);
      if (previousStepObj) {
        previousStepObj.next = stepId;
      }
      previousStep = stepId;
    }

    // Add destination steps
    const destinationIds: string[] = [];
    if (destinations.length === 1) {
      const stepId = `destination_0`;
      steps.push({
        id: stepId,
        name: `Load to ${destinations[0]}`,
        type: 'action',
        config: {
          type: 'data_destination',
          destination: destinations[0],
        },
      });

      // Link previous step
      const previousStepObj = steps.find((s) => s.id === previousStep);
      if (previousStepObj) {
        previousStepObj.next = stepId;
      }
    } else {
      // Multiple destinations - run in parallel
      parallelStepId = 'parallel_destinations';
      steps.push({
        id: parallelStepId,
        name: 'Load to destinations in parallel',
        type: 'parallel',
        config: {
          branches: destinations.map((dest, i) => ({
            id: `destination_${i}`,
            name: `Load to ${dest}`,
            type: 'action',
            config: {
              type: 'data_destination',
              destination: dest,
            },
          })),
        },
      });

      // Link previous step
      const previousStepObj = steps.find((s) => s.id === previousStep);
      if (previousStepObj) {
        previousStepObj.next = parallelStepId;
      }
    }

    return {
      id: this.formatId(name),
      name: `${name} Data Pipeline`,
      description: 'ETL pipeline for data processing',
      version: '1.0.0',
      steps,
    };
  }

  /**
   * Generate YAML workflow
   */
  private generateYamlWorkflow(workflow: WorkflowDefinition): string {
    let yaml = `id: ${workflow.id}\n`;
    yaml += `name: ${workflow.name}\n`;
    yaml += `version: ${workflow.version}\n`;

    if (workflow.description) {
      yaml += `description: ${workflow.description}\n`;
    }

    if (workflow.variables) {
      yaml += `\nvariables:\n`;
      for (const [key, value] of Object.entries(workflow.variables)) {
        yaml += `  ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    yaml += `\nsteps:\n`;
    for (const step of workflow.steps) {
      yaml += `  - id: ${step.id}\n`;
      yaml += `    name: ${step.name}\n`;
      yaml += `    type: ${step.type}\n`;
      yaml += `    config:\n`;

      for (const [key, value] of Object.entries(step.config)) {
        if (typeof value === 'object') {
          yaml += `      ${key}:\n`;
          yaml += this.indentYaml(JSON.stringify(value, null, 2), 6);
        } else {
          yaml += `      ${key}: ${JSON.stringify(value)}\n`;
        }
      }

      if (step.next) {
        yaml += `    next: ${JSON.stringify(step.next)}\n`;
      }

      if (step.onFail) {
        yaml += `    onFail: ${step.onFail}\n`;
      }

      if (step.retryPolicy) {
        yaml += `    retryPolicy:\n`;
        yaml += `      maxAttempts: ${step.retryPolicy.maxAttempts}\n`;
        yaml += `      backoff: ${step.retryPolicy.backoff}\n`;
        yaml += `      delay: ${step.retryPolicy.delay}\n`;
      }

      yaml += '\n';
    }

    return yaml;
  }

  /**
   * Generate TypeScript workflow
   */
  private generateTypeScriptWorkflow(workflow: WorkflowDefinition): string {
    let ts = `// Auto-generated workflow: ${workflow.name}\n\n`;
    ts += `import { Workflow } from '@mycodexvantaos/runtime';\n\n`;
    ts += `export const ${this.formatVarName(workflow.name)}: Workflow = {\n`;
    ts += `  id: '${workflow.id}',\n`;
    ts += `  name: '${workflow.name}',\n`;
    ts += `  version: '${workflow.version}',\n`;

    if (workflow.description) {
      ts += `  description: '${workflow.description}',\n`;
    }

    if (workflow.variables) {
      ts += `  variables: ${JSON.stringify(workflow.variables, null, 2)},\n`;
    }

    ts += `  steps: [\n`;
    for (const step of workflow.steps) {
      ts += `    {\n`;
      ts += `      id: '${step.id}',\n`;
      ts += `      name: '${step.name}',\n`;
      ts += `      type: '${step.type}',\n`;
      ts += `      config: ${JSON.stringify(step.config, null, 6)},\n`;

      if (step.next) {
        ts += `      next: ${JSON.stringify(step.next)},\n`;
      }

      if (step.onFail) {
        ts += `      onFail: '${step.onFail}',\n`;
      }

      if (step.retryPolicy) {
        ts += `      retryPolicy: ${JSON.stringify(step.retryPolicy, null, 6)},\n`;
      }

      ts += `    },\n`;
    }
    ts += `  ]\n`;
    ts += `};\n`;

    return ts;
  }

  /**
   * Format workflow ID
   */
  private formatId(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Format variable name
   */
  private formatVarName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get default commands for CI/CD stages
   */
  private getStageCommands(stage: string): string[] {
    const stageCommands: Record<string, string[]> = {
      build: ['npm install', 'npm run build'],
      test: ['npm test'],
      lint: ['npm run lint'],
      deploy: ['npm run deploy'],
      release: ['npm version patch', 'npm publish'],
    };

    return stageCommands[stage] || ['echo "Running stage: ' + stage + '"'];
  }

  /**
   * Indent YAML content
   */
  private indentYaml(yaml: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return (
      yaml
        .split('\n')
        .map((line) => indent + line)
        .join('\n') + '\n'
    );
  }
}

export default WorkflowGenerator;

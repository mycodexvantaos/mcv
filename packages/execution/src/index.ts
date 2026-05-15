/**
 * MyCodeXvantaOS Execution Engine
 * Provides task execution and workflow orchestration capabilities
 *
 * @packageDocumentation
 */

export interface Task {
  id: string;
  name: string;
  handler: () => Promise<any>;
  dependencies?: string[];
  retryCount?: number;
  timeout?: number;
}

export interface WorkflowConfig {
  name: string;
  description?: string;
  tasks: Task[];
  parallel?: boolean;
  continueOnError?: boolean;
}

export interface ExecutionResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  startTime: Date;
  endTime?: Date;
}

export interface ExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  continueOnError?: boolean;
}

export class ExecutionEngine {
  private tasks: Map<string, Task> = new Map();
  private results: Map<string, ExecutionResult> = new Map();
  private defaultOptions: ExecutionOptions;

  constructor(options: ExecutionOptions = {}) {
    this.defaultOptions = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      continueOnError: false,
      ...options,
    };
  }

  /**
   * Register a task for execution
   */
  registerTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  /**
   * Execute a single task
   */
  async executeTask(taskId: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const opts = { ...this.defaultOptions, ...options };
    const result: ExecutionResult = {
      taskId,
      status: 'running',
      startTime: new Date(),
    };

    this.results.set(taskId, result);

    try {
      const resultValue = await this.executeWithRetry(task, opts);
      result.status = 'completed';
      result.result = resultValue;
      result.endTime = new Date();
    } catch (error) {
      result.status = 'failed';
      result.error = error as Error;
      result.endTime = new Date();

      if (!opts.continueOnError) {
        throw error;
      }
    }

    return result;
  }

  /**
   * Execute a task with retry logic
   */
  private async executeWithRetry(task: Task, options: ExecutionOptions): Promise<any> {
    const maxRetries = options.maxRetries || this.defaultOptions.maxRetries!;
    const retryDelay = options.retryDelay || this.defaultOptions.retryDelay!;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeout = options.timeout ?? this.defaultOptions.timeout ?? 5000;
        return await this.executeWithTimeout(task.handler, timeout);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          await this.delay(retryDelay);
        } else {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout(handler: () => Promise<any>, timeout: number): Promise<any> {
    return Promise.race([
      handler(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Task timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Execute a workflow (multiple tasks)
   */
  async executeWorkflow(config: WorkflowConfig): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    if (config.parallel) {
      // Execute all tasks in parallel
      const promises = config.tasks.map((task) =>
        this.executeTask(task.id, { continueOnError: config.continueOnError })
      );
      const executedResults = await Promise.all(promises);
      results.push(...executedResults);
    } else {
      // Execute tasks sequentially with dependency resolution
      const executionOrder = this.resolveDependencies(config.tasks);
      for (const task of executionOrder) {
        try {
          const result = await this.executeTask(task.id, {
            continueOnError: config.continueOnError,
          });
          results.push(result);
        } catch (error) {
          if (!config.continueOnError) {
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * Resolve task dependencies for sequential execution
   */
  private resolveDependencies(tasks: Task[]): Task[] {
    const resolved: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }
      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);
      const task = this.tasks.get(taskId);

      if (task?.dependencies) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);

      if (task) {
        resolved.push(task);
      }
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return resolved;
  }

  /**
   * Get execution result
   */
  getResult(taskId: string): ExecutionResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Get all results
   */
  getAllResults(): ExecutionResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): void {
    const result = this.results.get(taskId);
    if (result && result.status === 'running') {
      result.status = 'failed';
      result.error = new Error('Task cancelled');
      result.endTime = new Date();
    }
  }

  /**
   * Helper: Delay for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get task statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const results = this.getAllResults();
    return {
      total: results.length,
      pending: results.filter((r) => r.status === 'pending').length,
      running: results.filter((r) => r.status === 'running').length,
      completed: results.filter((r) => r.status === 'completed').length,
      failed: results.filter((r) => r.status === 'failed').length,
    };
  }
}

// Export factory function
export function createExecutionEngine(options?: ExecutionOptions): ExecutionEngine {
  return new ExecutionEngine(options);
}

// Types are already exported at the top of the file

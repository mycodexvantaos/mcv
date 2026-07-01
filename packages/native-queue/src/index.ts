/**
 * MyCodeXvantaOS Native Queue Implementation
 * Provides a high-performance, in-memory queue system for task management
 */

export interface QueueTask<T = any> {
  id: string;
  data: T;
  priority: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  error?: Error;
}

export interface QueueOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  timeout?: number;
  autoStart?: boolean;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export type TaskHandler<T> = (task: QueueTask<T>) => Promise<void>;

export class NativeQueue<T = any> {
  private queue: Map<string, QueueTask<T>> = new Map();
  private priorityQueue: QueueTask<T>[] = [];
  private processingTasks: Set<string> = new Set();
  private handlers: Map<string, TaskHandler<T>> = new Map();
  private options: Required<QueueOptions>;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private taskIdCounter: number = 0;

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 10,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      autoStart: options.autoStart ?? true,
    };

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Add a task to the queue
   */
  enqueue(data: T, options: { priority?: number; maxAttempts?: number } = {}): string {
    const taskId = `task-${++this.taskIdCounter}`;
    const task: QueueTask<T> = {
      id: taskId,
      data,
      priority: options.priority || 0,
      status: "pending",
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts || this.options.maxRetries,
    };

    this.queue.set(taskId, task);
    this.priorityQueue.push(task);
    this.priorityQueue.sort((a, b) => b.priority - a.priority);

    return taskId;
  }

  /**
   * Register a handler for tasks
   */
  registerHandler(handler: TaskHandler<T>): void {
    this.handlers.set("default", handler);
  }

  /**
   * Process a single task
   */
  private async processTask(task: QueueTask<T>): Promise<void> {
    const handler = this.handlers.get("default");
    if (!handler) {
      throw new Error("No handler registered");
    }

    task.status = "processing";
    task.startedAt = new Date();
    task.attempts++;
    this.processingTasks.add(task.id);

    try {
      const timeout = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Task timeout")), this.options.timeout);
      });

      await Promise.race([handler(task), timeout]);
      task.status = "completed";
      task.completedAt = new Date();
    } catch (error) {
      task.error = error as Error;

      if (task.attempts < task.maxAttempts) {
        task.status = "pending";
        this.priorityQueue.push(task);
        this.priorityQueue.sort((a, b) => b.priority - a.priority);
      } else {
        task.status = "failed";
        task.completedAt = new Date();
      }
    } finally {
      this.processingTasks.delete(task.id);
    }
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.process(), 100);
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Process the queue
   */
  async process(): Promise<void> {
    // Auto-start if not running
    if (!this.isRunning) {
      this.isRunning = true;
    }
    if (this.processingTasks.size >= this.options.maxConcurrent) return;

    // Find next pending task
    const taskIndex = this.priorityQueue.findIndex((task) => task.status === "pending");

    if (taskIndex === -1) return;

    const task = this.priorityQueue.splice(taskIndex, 1)[0];
    await this.processTask(task);
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): QueueTask<T> | undefined {
    return this.queue.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): QueueTask<T>[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: QueueTask["status"]): QueueTask<T>[] {
    return Array.from(this.queue.values()).filter((task) => task.status === status);
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const tasks = Array.from(this.queue.values());
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      processing: tasks.filter((t) => t.status === "processing").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    };
  }

  /**
   * Clear completed and failed tasks
   */
  clear(): void {
    Array.from(this.queue.entries()).forEach(([id, task]) => {
      if (task.status === "completed" || task.status === "failed") {
        this.queue.delete(id);
      }
    });
    this.priorityQueue = this.priorityQueue.filter((task) => task.status === "pending");
  }

  /**
   * Remove task by ID
   */
  remove(taskId: string): boolean {
    const task = this.queue.get(taskId);
    if (!task) return false;

    this.queue.delete(taskId);
    this.priorityQueue = this.priorityQueue.filter((t) => t.id !== taskId);
    this.processingTasks.delete(taskId);
    return true;
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.stop();
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.start();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Check if queue is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(): Promise<void> {
    while (this.isRunning && this.getStats().pending + this.getStats().processing > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Add multiple tasks to the queue
   */
  enqueueBatch(dataBatch: T[]): string[] {
    return dataBatch.map((data) => this.enqueue(data));
  }
}

export default NativeQueue;

/**
 * Native Queue Tests
 */

import { NativeQueue, QueueTask, QueueStats, TaskHandler } from "../index";

describe("NativeQueue", () => {
  let queue: NativeQueue<string>;

  beforeEach(() => {
    queue = new NativeQueue<string>({ autoStart: false });
  });

  afterEach(() => {
    queue.stop();
  });

  describe("Basic Operations", () => {
    test("should create a queue", () => {
      expect(queue).toBeInstanceOf(NativeQueue);
      expect(queue.size()).toBe(0);
    });

    test("should enqueue a task", () => {
      const taskId = queue.enqueue("test task");
      expect(taskId).toMatch(/^task-\d+$/);
      expect(queue.size()).toBe(1);
    });

    test("should enqueue multiple tasks", () => {
      const tasks = ["task1", "task2", "task3"];
      tasks.forEach((task) => queue.enqueue(task));
      expect(queue.size()).toBe(3);
    });

    test("should get task by ID", () => {
      const taskId = queue.enqueue("test task");
      const task = queue.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
      expect(task?.data).toBe("test task");
      expect(task?.status).toBe("pending");
    });

    test("should get all tasks", () => {
      queue.enqueue("task1");
      queue.enqueue("task2");
      const tasks = queue.getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    test("should remove task", () => {
      const taskId = queue.enqueue("test task");
      const removed = queue.remove(taskId);
      expect(removed).toBe(true);
      expect(queue.size()).toBe(0);
    });

    test("should return false when removing non-existent task", () => {
      const removed = queue.remove("non-existent-id");
      expect(removed).toBe(false);
    });
  });

  describe("Task Processing", () => {
    test("should process tasks with handler", async () => {
      const handler: TaskHandler<string> = jest.fn(async (task) => {
        task.data = `${task.data} processed`;
      });

      queue.registerHandler(handler);
      queue.enqueue("task1");

      await queue.process();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const task = queue.getTask("task-1");
      expect(task?.status).toBe("completed");
      expect(handler).toHaveBeenCalled();
    });

    test("should process multiple tasks", async () => {
      const handler: TaskHandler<string> = jest.fn();
      queue.registerHandler(handler);

      queue.enqueue("task1");
      queue.enqueue("task2");
      queue.enqueue("task3");

      queue.start();
      await queue.waitForCompletion();
      queue.stop();

      const stats = queue.getStats();
      expect(stats.completed).toBe(3);
      expect(stats.pending).toBe(0);
    });

    test("should retry failed tasks", async () => {
      let attempts = 0;
      const handler: TaskHandler<string> = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
      });

      queue.registerHandler(handler);
      const taskId = queue.enqueue("task1", { maxAttempts: 3 });

      queue.start();
      await queue.waitForCompletion();
      queue.stop();

      const task = queue.getTask(taskId);
      expect(task?.status).toBe("completed");
      expect(task?.attempts).toBe(2);
    });

    test("should mark task as failed after max attempts", async () => {
      const handler: TaskHandler<string> = jest.fn(async () => {
        throw new Error("Permanent failure");
      });

      queue.registerHandler(handler);
      const taskId = queue.enqueue("task1", { maxAttempts: 2 });

      queue.start();
      await queue.waitForCompletion();
      queue.stop();

      const task = queue.getTask(taskId);
      expect(task?.status).toBe("failed");
      expect(task?.attempts).toBe(2);
    });
  });

  describe("Priority System", () => {
    test("should process tasks in priority order", async () => {
      const processedOrder: string[] = [];
      const handler: TaskHandler<string> = async (task) => {
        processedOrder.push(task.data);
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      queue.registerHandler(handler);
      queue.enqueue("low", { priority: 1 });
      queue.enqueue("high", { priority: 10 });
      queue.enqueue("medium", { priority: 5 });

      queue.start();
      await queue.waitForCompletion();
      queue.stop();

      expect(processedOrder).toEqual(["high", "medium", "low"]);
    });
  });

  describe("Concurrency Control", () => {
    test("should respect max concurrent limit", async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const handler: TaskHandler<string> = async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrentCount--;
      };

      queue.registerHandler(handler);

      for (let i = 0; i < 10; i++) {
        queue.enqueue(`task${i}`);
      }

      const queueWithLimit = new NativeQueue<string>({ maxConcurrent: 3 });
      queueWithLimit.registerHandler(handler);

      for (let i = 0; i < 10; i++) {
        queueWithLimit.enqueue(`task${i}`);
      }

      queueWithLimit.start();
      await queueWithLimit.waitForCompletion();
      queueWithLimit.stop();

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  describe("Queue Statistics", () => {
    test("should return correct statistics", () => {
      queue.enqueue("task1");
      queue.enqueue("task2");
      queue.enqueue("task3");

      const stats: QueueStats = queue.getStats();
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(3);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    test("should get tasks by status", () => {
      queue.enqueue("task1");
      queue.enqueue("task2");
      queue.enqueue("task3");

      const pendingTasks = queue.getTasksByStatus("pending");
      expect(pendingTasks).toHaveLength(3);

      const completedTasks = queue.getTasksByStatus("completed");
      expect(completedTasks).toHaveLength(0);
    });
  });

  describe("Queue Control", () => {
    test("should start and stop queue", () => {
      expect(queue.isActive()).toBe(false);
      queue.start();
      expect(queue.isActive()).toBe(true);
      queue.stop();
      expect(queue.isActive()).toBe(false);
    });

    test("should pause and resume queue", () => {
      queue.start();
      queue.pause();
      expect(queue.isActive()).toBe(false);
      queue.resume();
      expect(queue.isActive()).toBe(true);
    });

    test("should clear completed tasks", async () => {
      const handler: TaskHandler<string> = jest.fn();
      queue.registerHandler(handler);

      queue.enqueue("task1");
      queue.enqueue("task2");
      queue.enqueue("task3");

      queue.start();
      await queue.waitForCompletion();
      queue.stop();

      expect(queue.size()).toBe(3);
      queue.clear();
      expect(queue.size()).toBe(0);
    });
  });

  describe("Batch Operations", () => {
    test("should enqueue batch of tasks", () => {
      const batch = ["task1", "task2", "task3"];
      const taskIds = queue.enqueueBatch(batch);

      expect(taskIds).toHaveLength(3);
      expect(queue.size()).toBe(3);
    });
  });

  describe("Error Handling", () => {
    test("should handle timeout", async () => {
      const handler: TaskHandler<string> = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      queue.registerHandler(handler);
      const taskId = queue.enqueue("task1");

      const queueWithTimeout = new NativeQueue<string>({
        timeout: 50,
        maxRetries: 1,
        autoStart: false,
      });
      queueWithTimeout.registerHandler(handler);
      queueWithTimeout.enqueue("task1");

      queueWithTimeout.start();
      await queueWithTimeout.waitForCompletion();
      queueWithTimeout.stop();

      const task = queueWithTimeout.getTask("task-1");
      expect(task?.status).toBe("failed");
      expect(task?.error?.message).toBe("Task timeout");
    });
  });
});

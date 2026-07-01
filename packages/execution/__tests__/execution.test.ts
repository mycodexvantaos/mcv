import { ExecutionEngine, createExecutionEngine, Task, WorkflowConfig } from "../src/index";

describe("ExecutionEngine", () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
  });

  describe("Task Registration", () => {
    it("should register a task", () => {
      const task: Task = {
        id: "test-task",
        name: "Test Task",
        handler: async () => "result",
      };

      engine.registerTask(task);
      // Task is registered internally
      expect(engine).toBeInstanceOf(ExecutionEngine);
    });
  });

  describe("Task Execution", () => {
    it("should execute a task successfully", async () => {
      const task: Task = {
        id: "task-1",
        name: "Task 1",
        handler: async () => "success",
      };

      engine.registerTask(task);
      const result = await engine.executeTask("task-1");

      expect(result.status).toBe("completed");
      expect(result.result).toBe("success");
      expect(result.endTime).toBeDefined();
    });

    it("should handle task failures", async () => {
      const task: Task = {
        id: "task-2",
        name: "Task 2",
        handler: async () => {
          throw new Error("Task failed");
        },
      };

      engine.registerTask(task);
      const result = await engine.executeTask("task-2", { continueOnError: true });

      expect(result.status).toBe("failed");
      expect(result.error).toBeDefined();
    });

    it("should retry failed tasks", async () => {
      let attempts = 0;
      const task: Task = {
        id: "task-3",
        name: "Task 3",
        handler: async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Retry needed");
          }
          return "success after retry";
        },
      };

      engine.registerTask(task);
      const result = await engine.executeTask("task-3", { maxRetries: 2 });

      expect(result.status).toBe("completed");
      expect(result.result).toBe("success after retry");
      expect(attempts).toBe(2);
    });
  });

  describe("Workflow Execution", () => {
    it("should execute parallel workflow", async () => {
      const tasks: Task[] = [
        { id: "task-a", name: "A", handler: async () => "a-result" },
        { id: "task-b", name: "B", handler: async () => "b-result" },
      ];

      tasks.forEach((task) => engine.registerTask(task));

      const workflow: WorkflowConfig = {
        name: "Parallel Workflow",
        tasks,
        parallel: true,
      };

      const results = await engine.executeWorkflow(workflow);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.status === "completed")).toBe(true);
    });

    it("should execute sequential workflow", async () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          name: "Task 1",
          handler: async () => "result-1",
          dependencies: [],
        },
        {
          id: "task-2",
          name: "Task 2",
          handler: async () => "result-2",
          dependencies: ["task-1"],
        },
      ];

      tasks.forEach((task) => engine.registerTask(task));

      const workflow: WorkflowConfig = {
        name: "Sequential Workflow",
        tasks,
        parallel: false,
      };

      const results = await engine.executeWorkflow(workflow);

      expect(results).toHaveLength(2);
      expect(results[0].taskId).toBe("task-1");
      expect(results[1].taskId).toBe("task-2");
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", async () => {
      const tasks: Task[] = [
        { id: "task-success", name: "Success", handler: async () => "ok" },
        {
          id: "task-fail",
          name: "Fail",
          handler: async () => {
            throw new Error("error");
          },
        },
      ];

      tasks.forEach((task) => engine.registerTask(task));

      await engine.executeTask("task-success");
      await engine.executeTask("task-fail", { continueOnError: true });

      const stats = engine.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });

  describe("Factory Function", () => {
    it("should create execution engine instance", () => {
      const eng = createExecutionEngine({ maxRetries: 5 });
      expect(eng).toBeInstanceOf(ExecutionEngine);
    });
  });
});

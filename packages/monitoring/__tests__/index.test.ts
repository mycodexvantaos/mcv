/**
 * @jest-environment node
 */

import { Monitoring, monitoring } from "../src/index";

describe("Monitoring Package", () => {
  let mon: Monitoring;

  beforeEach(() => {
    mon = new Monitoring();
  });

  afterEach(async () => {
    await mon.cleanup();
  });

  describe("initialize", () => {
    it("should initialize the monitoring service", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      await mon.initialize();

      expect(consoleSpy).toHaveBeenCalledWith("Monitoring service initialized");
      consoleSpy.mockRestore();
    });
  });

  describe("execute", () => {
    it("should execute recordMetric action", async () => {
      await mon.initialize();

      const result = await mon.execute({
        action: "recordMetric",
        data: { name: "cpu.usage", value: 50 },
      });

      expect(result).toBeUndefined();
    });

    it("should execute getMetrics action", async () => {
      await mon.initialize();
      await mon.recordMetric({ name: "cpu.usage", value: 50 });

      const result = await mon.execute({
        action: "getMetrics",
        data: { name: "cpu.usage" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("cpu.usage");
      expect(result[0].value).toBe(50);
    });

    it("should execute log action", async () => {
      await mon.initialize();

      await mon.execute({
        action: "log",
        data: { level: "info", message: "Test log" },
      });

      const logs = await mon.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Test log");
    });

    it("should execute getLogs action", async () => {
      await mon.initialize();
      await mon.log({ level: "info", message: "Test log" });

      const result = await mon.execute({
        action: "getLogs",
        data: {},
      });

      expect(result).toHaveLength(1);
    });

    it("should execute createAlert action", async () => {
      await mon.initialize();

      const result = await mon.execute({
        action: "createAlert",
        data: {
          name: "High CPU",
          metric: "cpu.usage",
          threshold: 80,
          condition: "greater",
          callback: jest.fn(),
        },
      });

      expect(result.name).toBe("High CPU");
      expect(result.id).toBeDefined();
    });

    it("should throw error for unknown action", async () => {
      await expect(mon.execute({ action: "unknown", data: {} })).rejects.toThrow(
        "Unknown monitoring action: unknown"
      );
    });
  });

  describe("recordMetric", () => {
    it("should record a metric", async () => {
      await mon.recordMetric({ name: "cpu.usage", value: 50 });

      const metrics = await mon.getMetrics({ name: "cpu.usage" });
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(50);
    });

    it("should record multiple metrics with the same name", async () => {
      await mon.recordMetric({ name: "cpu.usage", value: 50 });
      await mon.recordMetric({ name: "cpu.usage", value: 60 });

      const metrics = await mon.getMetrics({ name: "cpu.usage" });
      expect(metrics).toHaveLength(2);
    });

    it("should record metric with tags", async () => {
      await mon.recordMetric({
        name: "cpu.usage",
        value: 50,
        tags: { host: "server-1", region: "us-east" },
      });

      const metrics = await mon.getMetrics({ name: "cpu.usage" });
      expect(metrics[0].tags).toEqual({ host: "server-1", region: "us-east" });
    });

    it("should set timestamp automatically", async () => {
      const before = Date.now();
      await mon.recordMetric({ name: "cpu.usage", value: 50 });
      const after = Date.now();

      const metrics = await mon.getMetrics({ name: "cpu.usage" });
      expect(metrics[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(metrics[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("getMetrics", () => {
    it("should return all metrics when no filter", async () => {
      await mon.recordMetric({ name: "cpu.usage", value: 50 });
      await mon.recordMetric({ name: "memory.usage", value: 70 });

      const metrics = await mon.getMetrics();

      expect(metrics).toHaveLength(2);
    });

    it("should return empty array for non-existent metric", async () => {
      const metrics = await mon.getMetrics({ name: "nonexistent" });

      expect(metrics).toEqual([]);
    });

    it("should return specific metric by name", async () => {
      await mon.recordMetric({ name: "cpu.usage", value: 50 });
      await mon.recordMetric({ name: "memory.usage", value: 70 });

      const metrics = await mon.getMetrics({ name: "cpu.usage" });

      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe("cpu.usage");
    });
  });

  describe("log", () => {
    it("should log an info message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await mon.log({ level: "info", message: "Test info message" });

      expect(consoleSpy).toHaveBeenCalledWith("[INFO] Test info message");
      consoleSpy.mockRestore();
    });

    it("should log a warning message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await mon.log({ level: "warn", message: "Test warning message" });

      expect(consoleSpy).toHaveBeenCalledWith("[WARN] Test warning message");
      consoleSpy.mockRestore();
    });

    it("should log an error message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await mon.log({ level: "error", message: "Test error message" });

      expect(consoleSpy).toHaveBeenCalledWith("[ERROR] Test error message");
      consoleSpy.mockRestore();
    });

    it("should log a debug message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await mon.log({ level: "debug", message: "Test debug message" });

      expect(consoleSpy).toHaveBeenCalledWith("[DEBUG] Test debug message");
      consoleSpy.mockRestore();
    });

    it("should default to info level", async () => {
      await mon.log({ message: "Test default message" });

      const logs = await mon.getLogs();
      expect(logs[0].level).toBe("info");
    });

    it("should include context in log entry", async () => {
      await mon.log({
        level: "info",
        message: "Test message",
        context: { userId: "123", action: "login" },
      });

      const logs = await mon.getLogs();
      expect(logs[0].context).toEqual({ userId: "123", action: "login" });
    });

    it("should set timestamp automatically", async () => {
      const before = Date.now();
      await mon.log({ message: "Test message" });
      const after = Date.now();

      const logs = await mon.getLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(logs[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("getLogs", () => {
    it("should return all logs when no filter", async () => {
      await mon.log({ level: "info", message: "Info 1" });
      await mon.log({ level: "warn", message: "Warn 1" });

      const logs = await mon.getLogs();

      expect(logs).toHaveLength(2);
    });

    it("should filter logs by level", async () => {
      await mon.log({ level: "info", message: "Info 1" });
      await mon.log({ level: "warn", message: "Warn 1" });
      await mon.log({ level: "error", message: "Error 1" });

      const logs = await mon.getLogs({ level: "error" });

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("error");
    });

    it("should limit logs", async () => {
      await mon.log({ level: "info", message: "Log 1" });
      await mon.log({ level: "info", message: "Log 2" });
      await mon.log({ level: "info", message: "Log 3" });

      const logs = await mon.getLogs({ limit: 2 });

      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe("Log 2");
      expect(logs[1].message).toBe("Log 3");
    });

    it("should return empty array when no logs", async () => {
      const logs = await mon.getLogs();

      expect(logs).toEqual([]);
    });
  });

  describe("createAlert", () => {
    it("should create an alert rule", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const alert = await mon.createAlert({
        name: "High CPU",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback: jest.fn(),
      });

      expect(alert.name).toBe("High CPU");
      expect(alert.metric).toBe("cpu.usage");
      expect(alert.threshold).toBe(80);
      expect(alert.condition).toBe("greater");
      expect(alert.id).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith("Alert created: High CPU");
      consoleSpy.mockRestore();
    });

    it("should generate unique alert IDs", async () => {
      const alert1 = await mon.createAlert({
        name: "Alert 1",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback: jest.fn(),
      });

      // Wait a bit for different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const alert2 = await mon.createAlert({
        name: "Alert 2",
        metric: "memory.usage",
        threshold: 90,
        condition: "greater",
        callback: jest.fn(),
      });

      expect(alert1.id).not.toBe(alert2.id);
    });
  });

  describe("alert triggering", () => {
    it("should trigger alert when condition is met (greater)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "High CPU",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback,
      });

      await mon.recordMetric({ name: "cpu.usage", value: 90 });

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: expect.objectContaining({ value: 90 }),
          alert: expect.objectContaining({ name: "High CPU" }),
        })
      );
    });

    it("should not trigger alert when condition is not met (greater)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "High CPU",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback,
      });

      await mon.recordMetric({ name: "cpu.usage", value: 70 });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should trigger alert when condition is met (less)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "Low Memory",
        metric: "memory.available",
        threshold: 100,
        condition: "less",
        callback,
      });

      await mon.recordMetric({ name: "memory.available", value: 50 });

      expect(callback).toHaveBeenCalled();
    });

    it("should not trigger alert when condition is not met (less)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "Low Memory",
        metric: "memory.available",
        threshold: 100,
        condition: "less",
        callback,
      });

      await mon.recordMetric({ name: "memory.available", value: 150 });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should trigger alert when condition is met (equal)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "Exact Match",
        metric: "counter",
        threshold: 100,
        condition: "equal",
        callback,
      });

      await mon.recordMetric({ name: "counter", value: 100 });

      expect(callback).toHaveBeenCalled();
    });

    it("should not trigger alert when condition is not met (equal)", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "Exact Match",
        metric: "counter",
        threshold: 100,
        condition: "equal",
        callback,
      });

      await mon.recordMetric({ name: "counter", value: 99 });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not trigger alert for different metric", async () => {
      const callback = jest.fn();
      await mon.createAlert({
        name: "High CPU",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback,
      });

      await mon.recordMetric({ name: "memory.usage", value: 90 });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should clear all data", async () => {
      await mon.recordMetric({ name: "cpu.usage", value: 50 });
      await mon.log({ message: "Test log" });
      await mon.createAlert({
        name: "Test Alert",
        metric: "cpu.usage",
        threshold: 80,
        condition: "greater",
        callback: jest.fn(),
      });

      await mon.cleanup();

      const metrics = await mon.getMetrics();
      const logs = await mon.getLogs();

      expect(metrics).toEqual([]);
      expect(logs).toEqual([]);
    });

    it("should log cleanup message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      await mon.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith("Monitoring service cleaned up");
      consoleSpy.mockRestore();
    });
  });

  describe("default export", () => {
    it("should export a default Monitoring instance", () => {
      expect(monitoring).toBeInstanceOf(Monitoring);
    });
  });
});

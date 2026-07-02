/**
 * Comprehensive tests for Monitoring package
 */

import { Monitoring, MetricData, LogEntry, AlertRule } from '../src/index';

describe('Monitoring', () => {
  let monitoring: Monitoring;

  beforeEach(() => {
    monitoring = new Monitoring();
  });

  afterEach(async () => {
    await monitoring.cleanup();
  });

  describe('initialize', () => {
    it('should initialize monitoring service', async () => {
      await expect(monitoring.initialize()).resolves.not.toThrow();
    });
  });

  describe('recordMetric', () => {
    it('should record a metric', async () => {
      await monitoring.recordMetric({
        name: 'cpu.usage',
        value: 75.5,
        tags: { host: 'server-1' },
      });

      const metrics = await monitoring.getMetrics({ name: 'cpu.usage' });
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(75.5);
    });

    it('should record multiple metrics with same name', async () => {
      await monitoring.recordMetric({ name: 'requests', value: 100 });
      await monitoring.recordMetric({ name: 'requests', value: 150 });

      const metrics = await monitoring.getMetrics({ name: 'requests' });
      expect(metrics.length).toBe(2);
    });

    it('should include timestamp', async () => {
      await monitoring.recordMetric({ name: 'test.metric', value: 1 });

      const metrics = await monitoring.getMetrics({ name: 'test.metric' });
      expect(metrics[0].timestamp).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      await monitoring.recordMetric({ name: 'metric.a', value: 1 });
      await monitoring.recordMetric({ name: 'metric.b', value: 2 });
      await monitoring.recordMetric({ name: 'metric.a', value: 3 });
    });

    it('should get all metrics when no filter', async () => {
      const metrics = await monitoring.getMetrics();
      expect(metrics.length).toBe(3);
    });

    it('should filter by name', async () => {
      const metrics = await monitoring.getMetrics({ name: 'metric.a' });
      expect(metrics.length).toBe(2);
    });

    it('should return empty array for non-existent metric', async () => {
      const metrics = await monitoring.getMetrics({ name: 'non-existent' });
      expect(metrics).toEqual([]);
    });
  });

  describe('log', () => {
    it('should log an info message', async () => {
      await monitoring.log({ message: 'Test info message' });

      const logs = await monitoring.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });

    it('should log with specified level', async () => {
      await monitoring.log({ level: 'error', message: 'Test error' });

      const logs = await monitoring.getLogs();
      expect(logs[0].level).toBe('error');
    });

    it('should log with context', async () => {
      await monitoring.log({
        message: 'Test with context',
        context: { userId: '123' },
      });

      const logs = await monitoring.getLogs();
      expect(logs[0].context).toEqual({ userId: '123' });
    });

    it('should include timestamp', async () => {
      await monitoring.log({ message: 'Test' });

      const logs = await monitoring.getLogs();
      expect(logs[0].timestamp).toBeDefined();
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      await monitoring.log({ level: 'info', message: 'Info 1' });
      await monitoring.log({ level: 'error', message: 'Error 1' });
      await monitoring.log({ level: 'info', message: 'Info 2' });
      await monitoring.log({ level: 'warn', message: 'Warn 1' });
    });

    it('should get all logs when no filter', async () => {
      const logs = await monitoring.getLogs();
      expect(logs.length).toBe(4);
    });

    it('should filter by level', async () => {
      const logs = await monitoring.getLogs({ level: 'info' });
      expect(logs.length).toBe(2);
      expect(logs.every((l) => l.level === 'info')).toBe(true);
    });

    it('should limit results', async () => {
      const logs = await monitoring.getLogs({ limit: 2 });
      expect(logs.length).toBe(2);
    });

    it('should combine level and limit filters', async () => {
      const logs = await monitoring.getLogs({ level: 'info', limit: 1 });
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
    });
  });

  describe('createAlert', () => {
    it('should create an alert rule', async () => {
      const callback = jest.fn();
      const alert = await monitoring.createAlert({
        name: 'High CPU',
        metric: 'cpu.usage',
        threshold: 80,
        condition: 'greater',
        callback,
      });

      expect(alert).toBeDefined();
      expect(alert.id).toMatch(/^urn:mycodexvantaos:alert:/);
      expect(alert.name).toBe('High CPU');
      expect(alert.metric).toBe('cpu.usage');
      expect(alert.threshold).toBe(80);
      expect(alert.condition).toBe('greater');
    });
  });

  describe('alert triggering', () => {
    it('should trigger alert when condition is met (greater)', async () => {
      const callback = jest.fn();
      await monitoring.createAlert({
        name: 'High CPU',
        metric: 'cpu.usage',
        threshold: 80,
        condition: 'greater',
        callback,
      });

      await monitoring.recordMetric({ name: 'cpu.usage', value: 85 });

      expect(callback).toHaveBeenCalled();
    });

    it('should not trigger alert when condition is not met (greater)', async () => {
      const callback = jest.fn();
      await monitoring.createAlert({
        name: 'High CPU',
        metric: 'cpu.usage',
        threshold: 80,
        condition: 'greater',
        callback,
      });

      await monitoring.recordMetric({ name: 'cpu.usage', value: 75 });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should trigger alert when condition is met (less)', async () => {
      const callback = jest.fn();
      await monitoring.createAlert({
        name: 'Low Memory',
        metric: 'memory.available',
        threshold: 100,
        condition: 'less',
        callback,
      });

      await monitoring.recordMetric({ name: 'memory.available', value: 50 });

      expect(callback).toHaveBeenCalled();
    });

    it('should trigger alert when condition is met (equal)', async () => {
      const callback = jest.fn();
      await monitoring.createAlert({
        name: 'Exact Match',
        metric: 'test.metric',
        threshold: 42,
        condition: 'equal',
        callback,
      });

      await monitoring.recordMetric({ name: 'test.metric', value: 42 });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should execute recordMetric action', async () => {
      await monitoring.execute({
        action: 'recordMetric',
        data: { name: 'test', value: 1 },
      });

      const metrics = await monitoring.getMetrics({ name: 'test' });
      expect(metrics.length).toBe(1);
    });

    it('should execute getMetrics action', async () => {
      await monitoring.recordMetric({ name: 'test', value: 1 });
      const metrics = await monitoring.execute<MetricData[]>({
        action: 'getMetrics',
        data: {},
      });

      expect(metrics.length).toBe(1);
    });

    it('should execute log action', async () => {
      await monitoring.execute({
        action: 'log',
        data: { message: 'Test log' },
      });

      const logs = await monitoring.getLogs();
      expect(logs.length).toBe(1);
    });

    it('should execute getLogs action', async () => {
      await monitoring.log({ message: 'Test' });
      const logs = await monitoring.execute<LogEntry[]>({
        action: 'getLogs',
        data: {},
      });

      expect(logs.length).toBe(1);
    });

    it('should execute createAlert action', async () => {
      const alert = await monitoring.execute<AlertRule>({
        action: 'createAlert',
        data: {
          name: 'Test Alert',
          metric: 'test',
          threshold: 100,
          condition: 'greater',
          callback: () => {},
        },
      });

      expect(alert.name).toBe('Test Alert');
    });

    it('should throw error for unknown action', async () => {
      await expect(
        monitoring.execute({
          action: 'unknown',
          data: {},
        })
      ).rejects.toThrow('Unknown monitoring action: unknown');
    });
  });

  describe('cleanup', () => {
    it('should clear all data', async () => {
      await monitoring.recordMetric({ name: 'test', value: 1 });
      await monitoring.log({ message: 'Test' });
      await monitoring.createAlert({
        name: 'Test',
        metric: 'test',
        threshold: 100,
        condition: 'greater',
        callback: () => {},
      });

      await monitoring.cleanup();

      const metrics = await monitoring.getMetrics();
      const logs = await monitoring.getLogs();

      expect(metrics.length).toBe(0);
      expect(logs.length).toBe(0);
    });
  });
});

/**
 * Native Logging Tests
 */

import {
  NativeLogger,
  LogLevel,
  LogEntry,
  LogTransport,
  createLogger,
  setDefaultLogger,
  getDefaultLogger,
  debug,
  info,
  warn,
  error,
  fatal,
} from "../index";

describe("NativeLogger", () => {
  let logger: NativeLogger;
  let mockTransport: jest.Mocked<LogTransport>;

  beforeEach(() => {
    mockTransport = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    logger = new NativeLogger({
      name: "test-logger",
      level: LogLevel.DEBUG,
      enableConsole: false,
    });
    logger.addTransport(mockTransport);
  });

  describe("Basic Logging", () => {
    test("should create logger", () => {
      expect(logger).toBeInstanceOf(NativeLogger);
    });

    test("should log debug messages", async () => {
      logger.debug("Debug message");
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockTransport.write).toHaveBeenCalled();
    });

    test("should log info messages", async () => {
      logger.info("Info message");
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockTransport.write).toHaveBeenCalled();
    });

    test("should log warn messages", async () => {
      logger.warn("Warning message");
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockTransport.write).toHaveBeenCalled();
    });

    test("should log error messages", async () => {
      const err = new Error("Test error");
      logger.error("Error message", err);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockTransport.write).toHaveBeenCalled();
      const call = mockTransport.write.mock.calls[0][0] as LogEntry;
      expect(call.error).toBe(err);
    });

    test("should log fatal messages", async () => {
      const err = new Error("Fatal error");
      logger.fatal("Fatal message", err);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockTransport.write).toHaveBeenCalled();
    });
  });

  describe("Log Levels", () => {
    test("should respect log level threshold", async () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should log");
      logger.error("Should log");

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockTransport.write).toHaveBeenCalledTimes(2);
    });

    test("should set and get log level", () => {
      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    test("should format level names correctly", async () => {
      logger.debug("Debug");
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockTransport.write.mock.calls[0][0] as LogEntry;
      expect(call.levelName).toBe("DEBUG");
    });
  });

  describe("Log Context", () => {
    test("should include context in log entries", async () => {
      const context = { userId: "123", action: "login" };
      logger.info("User logged in", context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockTransport.write.mock.calls[0][0] as LogEntry;
      expect(call.context).toEqual(context);
    });

    test("should handle error objects correctly", async () => {
      const err = new Error("Test error");
      err.stack = "Error: Test error\n    at test.js:10:5";

      logger.error("Error occurred", err);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockTransport.write.mock.calls[0][0] as LogEntry;
      expect(call.error).toBe(err);
    });
  });

  describe("Transports", () => {
    test("should add custom transport", () => {
      const customTransport: LogTransport = {
        write: jest.fn(),
      };
      logger.addTransport(customTransport);
      logger.info("Test message");

      // Give it time to process
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(customTransport.write).toHaveBeenCalled();
          resolve(null);
        }, 50);
      });
    });
  });

  describe("Child Loggers", () => {
    test("should create child logger", () => {
      const child = logger.child("module");
      expect(child).toBeInstanceOf(NativeLogger);
    });

    test("should inherit parent configuration", () => {
      const child = logger.child("module");
      expect(child.getLevel()).toBe(logger.getLevel());
    });

    test("should child logger have correct name", () => {
      const child = logger.child("module");
      expect(child["name"]).toBe("test-logger.module");
    });
  });

  describe("Logger Options", () => {
    test("should respect includeTimestamp option", async () => {
      logger.info("Test message");
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockTransport.write.mock.calls[0][0] as LogEntry;
      expect(call.timestamp).toBeInstanceOf(Date);
    });

    test("should create logger with custom name", () => {
      const customLogger = new NativeLogger({ name: "custom" });
      expect(customLogger).toBeInstanceOf(NativeLogger);
    });
  });

  describe("Singleton Functions", () => {
    beforeEach(() => {
      // Reset singleton - just create a new default logger
      setDefaultLogger(new NativeLogger({ name: "default" }));
    });

    test("should create logger with factory function", () => {
      const logger = createLogger({ name: "factory" });
      expect(logger).toBeInstanceOf(NativeLogger);
    });

    test("should set and get default logger", () => {
      const customLogger = new NativeLogger({ name: "default" });
      setDefaultLogger(customLogger);
      expect(getDefaultLogger()).toBe(customLogger);
    });

    test("should use global functions correctly", async () => {
      const logger = new NativeLogger({
        name: "global",
        enableConsole: false,
      });
      setDefaultLogger(logger);

      info("Global info message");

      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe("Log Entry Structure", () => {
    test("should create valid log entry", async () => {
      const context = { key: "value" };
      const err = new Error("Test error");

      logger.error("Test message", err, context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockTransport.write.mock.calls[0][0] as LogEntry;

      expect(call.timestamp).toBeInstanceOf(Date);
      expect(call.level).toBe(LogLevel.ERROR);
      expect(call.levelName).toBe("ERROR");
      expect(call.message).toBe("Test message");
      expect(call.context).toEqual(context);
      expect(call.error).toBe(err);
      expect(call.metadata).toBeDefined();
      expect(call.metadata?.loggerName).toBe("test-logger");
    });
  });

  describe("Level Filtering", () => {
    test("should filter DEBUG messages when level is INFO", async () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug("Debug");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockTransport.write).not.toHaveBeenCalled();
    });

    test("should filter INFO messages when level is WARN", async () => {
      logger.setLevel(LogLevel.WARN);
      logger.info("Info");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockTransport.write).not.toHaveBeenCalled();
    });

    test("should allow WARN messages when level is WARN", async () => {
      logger.setLevel(LogLevel.WARN);
      logger.warn("Warn");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockTransport.write).toHaveBeenCalled();
    });
  });
});

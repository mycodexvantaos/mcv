/**
 * @jest-environment node
 */

import { EventService, events } from "../src/index";

describe("Events Package", () => {
  let ev: EventService;

  beforeEach(() => {
    ev = new EventService();
  });

  afterEach(async () => {
    await ev.cleanup();
  });

  describe("initialize", () => {
    it("should initialize the event service", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await ev.initialize();

      expect(consoleSpy).toHaveBeenCalledWith("Event service initialized");
      consoleSpy.mockRestore();
    });

    it("should set max listeners", async () => {
      await ev.initialize();

      expect(ev.getMaxListeners()).toBe(1000);
    });
  });

  describe("execute", () => {
    it("should execute publish action", async () => {
      await ev.initialize();

      const result = await ev.execute({
        action: "publish",
        data: { type: "test.event", data: { message: "hello" } },
      });

      expect(result.type).toBe("test.event");
    });

    it("should execute subscribe action", async () => {
      await ev.initialize();

      const callback = jest.fn();
      const result = (await ev.execute({
        action: "subscribe",
        data: { eventPattern: "test.event", callback },
      })) as any;

      expect(result.eventPattern).toBe("test.event");
    });

    it("should execute unsubscribe action", async () => {
      await ev.initialize();

      const sub = await ev.subscribe({ eventPattern: "test.event", callback: jest.fn() });
      const result = await ev.execute({
        action: "unsubscribe",
        data: sub.id,
      });

      expect(result).toBe(true);
    });

    it("should execute getHistory action", async () => {
      await ev.initialize();

      await ev.publish({ type: "test.event", data: {} });
      const result = await ev.execute({
        action: "getHistory",
        data: {},
      });

      expect(result).toHaveLength(1);
    });

    it("should throw error for unknown action", async () => {
      await expect(ev.execute({ action: "unknown", data: {} })).rejects.toThrow(
        "Unknown event action: unknown"
      );
    });
  });

  describe("publish", () => {
    it("should publish an event", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      await ev.initialize();

      const event = await ev.publish({
        type: "user.created",
        data: { userId: "123", name: "John" },
      });

      expect(event.id).toBeDefined();
      expect(event.type).toBe("user.created");
      expect(event.data).toEqual({ userId: "123", name: "John" });
      expect(event.timestamp).toBeDefined();
      expect(event.source).toBe("unknown");
      expect(consoleSpy).toHaveBeenCalledWith("Event published: user.created");
      consoleSpy.mockRestore();
    });

    it("should include source when provided", async () => {
      await ev.initialize();

      const event = await ev.publish({
        type: "user.created",
        data: {},
        source: "user-service",
      });

      expect(event.source).toBe("user-service");
    });

    it("should add event to history", async () => {
      await ev.initialize();

      await ev.publish({ type: "test.event", data: {} });
      await ev.publish({ type: "test.event2", data: {} });

      const history = await ev.getHistory();
      expect(history).toHaveLength(2);
    });

    it("should emit event to subscribers", async () => {
      await ev.initialize();

      const callback = jest.fn();
      ev.on("user.created", callback);

      await ev.publish({
        type: "user.created",
        data: { userId: "123" },
      });

      expect(callback).toHaveBeenCalled();
    });

    it("should emit wildcard event", async () => {
      await ev.initialize();

      const callback = jest.fn();
      ev.on("*", callback);

      await ev.publish({
        type: "user.created",
        data: { userId: "123" },
      });

      expect(callback).toHaveBeenCalled();
    });

    it("should limit history size", async () => {
      await ev.initialize();

      // Publish more than 10000 events
      for (let i = 0; i < 10002; i++) {
        await ev.publish({ type: "test.event", data: { index: i } });
      }

      const history = await ev.getHistory();
      expect(history.length).toBe(10000);
    });

    it("should generate unique event IDs", async () => {
      await ev.initialize();

      const event1 = await ev.publish({ type: "test.event", data: {} });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const event2 = await ev.publish({ type: "test.event", data: {} });

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe("subscribe", () => {
    it("should create a subscription", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      await ev.initialize();

      const callback = jest.fn();
      const sub = await ev.subscribe({
        eventPattern: "user.created",
        callback,
      });

      expect(sub.id).toBeDefined();
      expect(sub.eventPattern).toBe("user.created");
      expect(sub.callback).toBe(callback);
      expect(consoleSpy).toHaveBeenCalledWith("Subscription created: user.created");
      consoleSpy.mockRestore();
    });

    it("should receive events after subscription", async () => {
      await ev.initialize();

      const callback = jest.fn();
      await ev.subscribe({ eventPattern: "user.created", callback });

      await ev.publish({ type: "user.created", data: { userId: "123" } });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "user.created",
          data: { userId: "123" },
        })
      );
    });

    it("should generate unique subscription IDs", async () => {
      await ev.initialize();

      const sub1 = await ev.subscribe({ eventPattern: "test.event", callback: jest.fn() });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const sub2 = await ev.subscribe({ eventPattern: "test.event", callback: jest.fn() });

      expect(sub1.id).not.toBe(sub2.id);
    });
  });

  describe("unsubscribe", () => {
    it("should remove an existing subscription", async () => {
      await ev.initialize();

      const callback = jest.fn();
      const sub = await ev.subscribe({ eventPattern: "test.event", callback });

      const result = await ev.unsubscribe(sub.id);

      expect(result).toBe(true);
    });

    it("should stop receiving events after unsubscribe", async () => {
      await ev.initialize();

      const callback = jest.fn();
      const sub = await ev.subscribe({ eventPattern: "test.event", callback });

      await ev.unsubscribe(sub.id);
      await ev.publish({ type: "test.event", data: {} });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return false for non-existent subscription", async () => {
      await ev.initialize();

      const result = await ev.unsubscribe("non-existent-id");

      expect(result).toBe(false);
    });
  });

  describe("getHistory", () => {
    it("should return all events when no filter", async () => {
      await ev.initialize();

      await ev.publish({ type: "event1", data: {} });
      await ev.publish({ type: "event2", data: {} });

      const history = await ev.getHistory();

      expect(history).toHaveLength(2);
    });

    it("should filter events by type", async () => {
      await ev.initialize();

      await ev.publish({ type: "user.created", data: {} });
      await ev.publish({ type: "user.updated", data: {} });
      await ev.publish({ type: "user.created", data: {} });

      const history = await ev.getHistory({ type: "user.created" });

      expect(history).toHaveLength(2);
      expect(history.every((e) => e.type === "user.created")).toBe(true);
    });

    it("should limit number of events", async () => {
      await ev.initialize();

      await ev.publish({ type: "event1", data: {} });
      await ev.publish({ type: "event2", data: {} });
      await ev.publish({ type: "event3", data: {} });

      const history = await ev.getHistory({ limit: 2 });

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe("event2");
      expect(history[1].type).toBe("event3");
    });

    it("should return empty array when no events", async () => {
      await ev.initialize();

      const history = await ev.getHistory();

      expect(history).toEqual([]);
    });
  });

  describe("cleanup", () => {
    it("should clear all subscriptions and history", async () => {
      await ev.initialize();

      await ev.subscribe({ eventPattern: "test.event", callback: jest.fn() });
      await ev.publish({ type: "test.event", data: {} });

      await ev.cleanup();

      const history = await ev.getHistory();
      expect(history).toEqual([]);
    });

    it("should log cleanup message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await ev.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith("Event service cleaned up");
      consoleSpy.mockRestore();
    });
  });

  describe("EventEmitter functionality", () => {
    it("should be an EventEmitter", () => {
      const EventEmitter = require("events").EventEmitter;
      expect(ev).toBeInstanceOf(EventEmitter);
    });
  });

  describe("default export", () => {
    it("should export a default EventService instance", () => {
      expect(events).toBeInstanceOf(EventService);
    });
  });
});

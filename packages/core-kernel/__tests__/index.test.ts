/**
 * @jest-environment node
 */

import { ProviderRegistry, EventBus, Kernel, BaseProvider, ProviderManifest } from "../src/index";

// Mock provider for testing
const createMockProvider = (
  capability: string,
  providerName: string,
  mode: "native" | "connected" | "hybrid",
  healthStatus: "healthy" | "degraded" | "down" = "healthy"
): BaseProvider => ({
  manifest: { capability, provider: providerName, mode },
  initialize: jest.fn().mockResolvedValue(undefined),
  healthCheck: jest.fn().mockResolvedValue({ status: healthStatus }),
  shutdown: jest.fn().mockResolvedValue(undefined),
});

describe("core-kernel Package", () => {
  describe("ProviderRegistry", () => {
    describe("constructor", () => {
      it("should create registry with native mode", () => {
        const registry = new ProviderRegistry("native");
        expect(registry).toBeDefined();
      });

      it("should create registry with hybrid mode", () => {
        const registry = new ProviderRegistry("hybrid");
        expect(registry).toBeDefined();
      });

      it("should create registry with connected mode", () => {
        const registry = new ProviderRegistry("connected");
        expect(registry).toBeDefined();
      });

      it("should create registry with auto mode", () => {
        const registry = new ProviderRegistry("auto");
        expect(registry).toBeDefined();
      });
    });

    describe("register", () => {
      it("should register a provider", () => {
        const registry = new ProviderRegistry("native");
        const provider = createMockProvider("llm", "native", "native");

        registry.register(provider);

        // Should be able to resolve the provider
        return expect(registry.resolve("llm")).resolves.toBeDefined();
      });

      it("should set first provider as default for capability", () => {
        const registry = new ProviderRegistry("hybrid");
        const provider = createMockProvider("llm", "gemini", "connected");

        registry.register(provider);

        return expect(registry.resolve("llm")).resolves.toBe(provider);
      });

      it("should update default when provider matches global mode", () => {
        const registry = new ProviderRegistry("native");
        const connectedProvider = createMockProvider("llm", "gemini", "connected");
        const nativeProvider = createMockProvider("llm", "native", "native");

        registry.register(connectedProvider);
        registry.register(nativeProvider);

        // Native provider should be default in native mode
        return expect(registry.resolve("llm")).resolves.toBe(nativeProvider);
      });
    });

    describe("setPreferredProvider", () => {
      it("should set preferred provider", () => {
        const registry = new ProviderRegistry("hybrid");
        const provider1 = createMockProvider("llm", "gemini", "connected");
        const provider2 = createMockProvider("llm", "native", "native");

        registry.register(provider1);
        registry.register(provider2);
        registry.setPreferredProvider("llm", "native");

        return expect(registry.resolve("llm")).resolves.toBe(provider2);
      });

      it("should throw error for non-registered provider", () => {
        const registry = new ProviderRegistry("hybrid");

        expect(() => registry.setPreferredProvider("llm", "nonexistent")).toThrow(
          "Provider llm-nonexistent is not registered."
        );
      });
    });

    describe("resolve", () => {
      it("should resolve registered provider", async () => {
        const registry = new ProviderRegistry("hybrid");
        const provider = createMockProvider("llm", "gemini", "connected");
        registry.register(provider);

        const resolved = await registry.resolve("llm");

        expect(resolved).toBe(provider);
      });

      it("should throw error for unregistered capability", async () => {
        const registry = new ProviderRegistry("hybrid");

        await expect(registry.resolve("nonexistent")).rejects.toThrow(
          "[Fatal] No provider registered for capability: nonexistent"
        );
      });

      it("should fallback to native in native mode when primary is not native", async () => {
        const registry = new ProviderRegistry("native");
        const connectedProvider = createMockProvider("llm", "gemini", "connected");
        const nativeProvider = createMockProvider("llm", "native", "native");

        registry.register(connectedProvider);
        registry.register(nativeProvider);

        const resolved = await registry.resolve("llm");

        expect(resolved).toBe(nativeProvider);
      });

      it("should fallback when primary provider is down", async () => {
        const registry = new ProviderRegistry("hybrid");
        const downProvider = createMockProvider("llm", "gemini", "connected", "down");
        const nativeProvider = createMockProvider("llm", "native", "native");

        registry.register(downProvider);
        registry.register(nativeProvider);

        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        const resolved = await registry.resolve("llm");

        expect(resolved).toBe(nativeProvider);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it("should throw error when no fallback available", async () => {
        const registry = new ProviderRegistry("native");
        const connectedProvider = createMockProvider("llm", "gemini", "connected");
        registry.register(connectedProvider);

        await expect(registry.resolve("llm")).rejects.toThrow(
          "[Fatal] Architecture violation: No 'native' mode fallback provider for 'llm'."
        );
      });
    });
  });

  describe("EventBus", () => {
    let bus: EventBus;

    beforeEach(() => {
      bus = new EventBus();
    });

    describe("subscribe", () => {
      it("should subscribe to an event", () => {
        const callback = jest.fn();
        bus.subscribe("test-event", callback);

        bus.publish("test-event", { data: "test" });

        expect(callback).toHaveBeenCalledWith({ data: "test" });
      });

      it("should support multiple subscribers for same event", () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        bus.subscribe("test-event", callback1);
        bus.subscribe("test-event", callback2);

        bus.publish("test-event", { data: "test" });

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    describe("publish", () => {
      it("should publish event to subscribers", () => {
        const callback = jest.fn();
        bus.subscribe("test-event", callback);

        bus.publish("test-event", { message: "hello" });

        expect(callback).toHaveBeenCalledWith({ message: "hello" });
      });

      it("should not throw when no subscribers", () => {
        expect(() => bus.publish("no-subscribers", {})).not.toThrow();
      });
    });
  });

  describe("Kernel", () => {
    let kernel: Kernel;

    beforeEach(() => {
      // Reset env
      delete process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE;
      kernel = new Kernel();
    });

    describe("constructor", () => {
      it("should create kernel with default hybrid mode", () => {
        expect(kernel.defaultMode).toBe("hybrid");
      });

      it("should respect MYCODEXVANTAOS_CORE_RUNTIME_MODE env var", () => {
        process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = "native";
        const customKernel = new Kernel();
        expect(customKernel.defaultMode).toBe("native");
        delete process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE;
      });

      it("should create EventBus", () => {
        expect(kernel.events).toBeInstanceOf(EventBus);
      });

      it("should create ProviderRegistry", () => {
        expect(kernel.registry).toBeInstanceOf(ProviderRegistry);
      });
    });

    describe("start", () => {
      it("should publish pre-start event", () => {
        const callback = jest.fn();
        kernel.events.subscribe("system:pre-start", callback);

        kernel.start();

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ timestamp: expect.any(Number) })
        );
      });

      it("should publish started event", () => {
        const callback = jest.fn();
        kernel.events.subscribe("system:started", callback);

        kernel.start();

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "running",
            timestamp: expect.any(Number),
          })
        );
      });
    });
  });
});

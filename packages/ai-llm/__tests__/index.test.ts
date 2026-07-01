/**
 * @jest-environment node
 */

import {
  LLMProviderRegistry,
  NativeLLMProvider,
  getLLMRegistry,
  initializeLLM,
  generateCompletion,
  generateChatCompletion,
} from "../src/index";

// Helper to reset the singleton between tests
const resetRegistry = () => {
  // @ts-ignore - accessing private module variable
  const module = require("../src/index");
  // @ts-ignore
  module.__setRegistry && module.__setRegistry(null);
};

describe("ai-llm Package", () => {
  let originalRegistry: any;

  beforeEach(() => {
    // Reset singleton between tests
    jest.resetModules();
  });

  describe("LLMProviderRegistry", () => {
    let registry: LLMProviderRegistry;

    beforeEach(() => {
      registry = new LLMProviderRegistry();
    });

    describe("register", () => {
      it("should register a provider", () => {
        const provider = new NativeLLMProvider();
        registry.register("native", provider);
        expect(registry.get("native")).toBe(provider);
      });

      it("should update preferred provider when external provider is available", () => {
        const nativeProvider = new NativeLLMProvider();
        const mockExternalProvider = {
          name: "external",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          generateCompletion: jest.fn(),
          generateChatCompletion: jest.fn(),
          countTokens: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("external", mockExternalProvider as any);

        expect(registry.getActive()).toBe(mockExternalProvider);
      });

      it("should not update preferred provider when provider is native", () => {
        const nativeProvider = new NativeLLMProvider();
        registry.register("native", nativeProvider);

        expect(registry.getActive()).toBe(nativeProvider);
      });
    });

    describe("setPreferredProvider", () => {
      it("should set preferred provider when provider exists", () => {
        const provider = new NativeLLMProvider();
        registry.register("native", provider);
        registry.setPreferredProvider("native");

        expect(registry.getActive()).toBe(provider);
      });

      it("should not set preferred provider when provider does not exist", () => {
        registry.setPreferredProvider("nonexistent");

        // Should still throw when trying to get active without any provider
        expect(() => registry.getActive()).toThrow("No LLM provider available");
      });
    });

    describe("get", () => {
      it("should return provider when it exists", () => {
        const provider = new NativeLLMProvider();
        registry.register("native", provider);

        expect(registry.get("native")).toBe(provider);
      });

      it("should return undefined when provider does not exist", () => {
        expect(registry.get("nonexistent")).toBeUndefined();
      });
    });

    describe("getActive", () => {
      it("should return external provider when available", () => {
        const nativeProvider = new NativeLLMProvider();
        const mockExternalProvider = {
          name: "external",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          generateCompletion: jest.fn(),
          generateChatCompletion: jest.fn(),
          countTokens: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("external", mockExternalProvider as any);

        expect(registry.getActive()).toBe(mockExternalProvider);
      });

      it("should return native provider when no external provider is available", () => {
        const nativeProvider = new NativeLLMProvider();
        registry.register("native", nativeProvider);

        expect(registry.getActive()).toBe(nativeProvider);
      });

      it("should throw error when no provider is registered", () => {
        expect(() => registry.getActive()).toThrow("No LLM provider available");
      });

      it("should prefer available external provider over unavailable external provider", () => {
        const nativeProvider = new NativeLLMProvider();
        const unavailableProvider = {
          name: "unavailable",
          isNative: false,
          isAvailable: () => false,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          generateCompletion: jest.fn(),
          generateChatCompletion: jest.fn(),
          countTokens: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("unavailable", unavailableProvider as any);

        expect(registry.getActive()).toBe(nativeProvider);
      });
    });

    describe("getAll", () => {
      it("should return all registered providers", () => {
        const nativeProvider = new NativeLLMProvider();
        registry.register("native", nativeProvider);

        const all = registry.getAll();
        expect(all.size).toBe(1);
        expect(all.get("native")).toBe(nativeProvider);
      });

      it("should return empty map when no providers registered", () => {
        const all = registry.getAll();
        expect(all.size).toBe(0);
      });
    });

    describe("healthCheckAll", () => {
      it("should return health status for all providers", async () => {
        const nativeProvider = new NativeLLMProvider();
        registry.register("native", nativeProvider);

        const results = await registry.healthCheckAll();

        expect(results["native"]).toEqual({
          healthy: true,
          message: "Native LLM Provider is operational",
        });
      });

      it("should check multiple providers", async () => {
        const nativeProvider = new NativeLLMProvider();
        const mockProvider = {
          name: "mock",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest.fn().mockResolvedValue({ healthy: false, message: "Mock unhealthy" }),
          getMetadata: jest.fn(),
          generateCompletion: jest.fn(),
          generateChatCompletion: jest.fn(),
          countTokens: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("mock", mockProvider as any);

        const results = await registry.healthCheckAll();

        expect(results["native"].healthy).toBe(true);
        expect(results["mock"].healthy).toBe(false);
      });
    });
  });

  describe("NativeLLMProvider", () => {
    let provider: NativeLLMProvider;

    beforeEach(() => {
      provider = new NativeLLMProvider();
    });

    describe("properties", () => {
      it("should have correct name", () => {
        expect(provider.name).toBe("native");
      });

      it("should be native", () => {
        expect(provider.isNative).toBe(true);
      });
    });

    describe("isAvailable", () => {
      it("should always be available", () => {
        expect(provider.isAvailable()).toBe(true);
      });
    });

    describe("healthCheck", () => {
      it("should return healthy status", async () => {
        const result = await provider.healthCheck();

        expect(result.healthy).toBe(true);
        expect(result.message).toBe("Native LLM Provider is operational");
      });
    });

    describe("getMetadata", () => {
      it("should return correct metadata", () => {
        const metadata = provider.getMetadata();

        expect(metadata.name).toBe("llm-native");
        expect(metadata.provider).toBe("native");
        expect(metadata.capabilities).toContain("text-generation");
        expect(metadata.capabilities).toContain("text-completion");
        expect(metadata.isNative).toBe(true);
        expect(metadata.requiresApiKey).toBe(false);
      });
    });

    describe("generateCompletion", () => {
      it("should generate a completion response", async () => {
        const response = await provider.generateCompletion({
          prompt: "Hello world",
        });

        expect(response.text).toContain("Native LLM Provider Active");
        expect(response.text).toContain("Hello world");
        expect(response.model).toBe("native-template-v1");
        expect(response.provider).toBe("llm-native");
        expect(response.tokens).toBeGreaterThan(0);
      });

      it("should truncate long prompts in response", async () => {
        const longPrompt = "A".repeat(200);
        const response = await provider.generateCompletion({
          prompt: longPrompt,
        });

        expect(response.text).toContain("AAA...");
      });

      it("should handle empty prompt", async () => {
        const response = await provider.generateCompletion({
          prompt: "",
        });

        expect(response.text).toBeDefined();
        expect(response.tokens).toBeGreaterThan(0);
      });

      it("should respect maxTokens option", async () => {
        const response = await provider.generateCompletion({
          prompt: "Test",
          maxTokens: 100,
        });

        expect(response).toBeDefined();
      });
    });

    describe("generateChatCompletion", () => {
      it("should generate chat completion from user message", async () => {
        const response = await provider.generateChatCompletion({
          messages: [{ role: "user", content: "Hello AI" }],
        });

        expect(response.text).toContain("Hello AI");
      });

      it("should find last user message", async () => {
        const response = await provider.generateChatCompletion({
          messages: [
            { role: "user", content: "First message" },
            { role: "assistant", content: "Response" },
            { role: "user", content: "Second message" },
          ],
        });

        expect(response.text).toContain("Second message");
        expect(response.text).not.toContain("First message");
      });

      it("should handle empty messages array", async () => {
        const response = await provider.generateChatCompletion({
          messages: [],
        });

        expect(response.text).toBeDefined();
      });

      it("should handle messages without user role", async () => {
        const response = await provider.generateChatCompletion({
          messages: [
            { role: "system", content: "System message" },
            { role: "assistant", content: "Assistant message" },
          ],
        });

        expect(response.text).toBeDefined();
      });
    });

    describe("countTokens", () => {
      it("should count tokens based on text length", () => {
        const text = "Hello world";
        const tokens = provider.countTokens(text);

        expect(tokens).toBe(Math.ceil(text.length / 4));
      });

      it("should return 0 for empty string", () => {
        expect(provider.countTokens("")).toBe(0);
      });

      it("should handle long text", () => {
        const text = "A".repeat(1000);
        const tokens = provider.countTokens(text);

        expect(tokens).toBe(250);
      });
    });
  });

  describe("getLLMRegistry", () => {
    it("should return a registry instance", () => {
      // Reset modules to get fresh registry
      jest.resetModules();
      const { getLLMRegistry } = require("../src/index");
      const registry = getLLMRegistry();

      // Check that it's a valid registry object
      expect(typeof registry.register).toBe("function");
      expect(typeof registry.get).toBe("function");
      expect(typeof registry.getActive).toBe("function");
    });

    it("should return the same instance on multiple calls", () => {
      jest.resetModules();
      const { getLLMRegistry } = require("../src/index");
      const registry1 = getLLMRegistry();
      const registry2 = getLLMRegistry();

      expect(registry1).toBe(registry2);
    });
  });

  describe("initializeLLM", () => {
    it("should initialize with native provider", async () => {
      jest.resetModules();
      const { initializeLLM } = require("../src/index");
      const registry = await initializeLLM();

      expect(registry.get("native")).toBeDefined();
    });

    it("should set preferred provider when specified", async () => {
      jest.resetModules();
      const { initializeLLM } = require("../src/index");
      const registry = await initializeLLM({
        preferredProvider: "native",
      });

      expect(registry.get("native")).toBeDefined();
    });

    it("should work with empty config", async () => {
      jest.resetModules();
      const { initializeLLM } = require("../src/index");
      const registry = await initializeLLM({});

      expect(registry.get("native")).toBeDefined();
    });
  });

  describe("generateCompletion", () => {
    it("should generate completion using active provider", async () => {
      jest.resetModules();
      const { initializeLLM, generateCompletion } = require("../src/index");
      await initializeLLM();

      const response = await generateCompletion("Hello");

      expect(response.text).toBeDefined();
      expect(response.provider).toBe("llm-native");
    });

    it("should throw error when no provider available", async () => {
      jest.resetModules();
      const { LLMProviderRegistry, generateCompletion } = require("../src/index");

      // Don't initialize, registry is empty
      const registry = new LLMProviderRegistry();

      await expect(generateCompletion("Hello")).rejects.toThrow();
    });

    it("should use specified provider when available", async () => {
      jest.resetModules();
      const { initializeLLM, generateCompletion } = require("../src/index");
      await initializeLLM();

      const response = await generateCompletion("Hello", { provider: "native" });

      expect(response).toBeDefined();
    });
  });

  describe("generateChatCompletion", () => {
    it("should generate chat completion using active provider", async () => {
      jest.resetModules();
      const { initializeLLM, generateChatCompletion } = require("../src/index");
      await initializeLLM();

      const response = await generateChatCompletion([{ role: "user", content: "Hello" }]);

      expect(response.text).toBeDefined();
      expect(response.provider).toBe("llm-native");
    });

    it("should throw error when no provider available", async () => {
      jest.resetModules();
      // Don't initialize, registry is empty

      const { generateChatCompletion } = require("../src/index");

      await expect(generateChatCompletion([{ role: "user", content: "Hello" }])).rejects.toThrow();
    });

    it("should use specified provider when available", async () => {
      jest.resetModules();
      const { initializeLLM, generateChatCompletion } = require("../src/index");
      await initializeLLM();

      const response = await generateChatCompletion([{ role: "user", content: "Hello" }], {
        provider: "native",
      });

      expect(response).toBeDefined();
    });
  });
});

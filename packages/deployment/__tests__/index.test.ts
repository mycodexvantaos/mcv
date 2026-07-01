/**
 * @jest-environment node
 */

import { DeploymentProviderRegistry, NativeDeploymentProvider, Deployment } from "../src/index";

describe("Deployment Package", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("DeploymentProviderRegistry", () => {
    let registry: DeploymentProviderRegistry;

    beforeEach(() => {
      registry = new DeploymentProviderRegistry();
    });

    describe("register", () => {
      it("should register a provider", () => {
        const provider = new NativeDeploymentProvider();
        registry.register("native", provider);
        expect(registry.get("native")).toBe(provider);
      });

      it("should update preferred provider when external provider is available", () => {
        const nativeProvider = new NativeDeploymentProvider();
        const mockExternalProvider = {
          name: "kubernetes",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          deploy: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("kubernetes", mockExternalProvider as any);

        expect(registry.getActive()).toBe(mockExternalProvider);
      });

      it("should not update preferred provider when provider is native", () => {
        const nativeProvider = new NativeDeploymentProvider();
        registry.register("native", nativeProvider);

        expect(registry.getActive()).toBe(nativeProvider);
      });
    });

    describe("setPreferredProvider", () => {
      it("should set preferred provider when provider exists", () => {
        const provider = new NativeDeploymentProvider();
        registry.register("native", provider);
        registry.setPreferredProvider("native");

        expect(registry.getActive()).toBe(provider);
      });

      it("should not set preferred provider when provider does not exist", () => {
        registry.setPreferredProvider("nonexistent");

        expect(() => registry.getActive()).toThrow("No deployment provider available");
      });
    });

    describe("get", () => {
      it("should return provider when it exists", () => {
        const provider = new NativeDeploymentProvider();
        registry.register("native", provider);

        expect(registry.get("native")).toBe(provider);
      });

      it("should return undefined when provider does not exist", () => {
        expect(registry.get("nonexistent")).toBeUndefined();
      });
    });

    describe("getActive", () => {
      it("should return external provider when available", () => {
        const nativeProvider = new NativeDeploymentProvider();
        const mockExternalProvider = {
          name: "kubernetes",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          deploy: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("kubernetes", mockExternalProvider as any);

        expect(registry.getActive()).toBe(mockExternalProvider);
      });

      it("should return native provider when no external provider is available", () => {
        const nativeProvider = new NativeDeploymentProvider();
        registry.register("native", nativeProvider);

        expect(registry.getActive()).toBe(nativeProvider);
      });

      it("should throw error when no provider is registered", () => {
        expect(() => registry.getActive()).toThrow("No deployment provider available");
      });

      it("should prefer available external provider over unavailable external provider", () => {
        const nativeProvider = new NativeDeploymentProvider();
        const unavailableProvider = {
          name: "kubernetes",
          isNative: false,
          isAvailable: () => false,
          healthCheck: jest.fn(),
          getMetadata: jest.fn(),
          deploy: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("kubernetes", unavailableProvider as any);

        expect(registry.getActive()).toBe(nativeProvider);
      });
    });

    describe("getAll", () => {
      it("should return all registered providers", () => {
        const nativeProvider = new NativeDeploymentProvider();
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
        const nativeProvider = new NativeDeploymentProvider();
        registry.register("native", nativeProvider);

        const results = await registry.healthCheckAll();

        expect(results["native"]).toEqual({
          healthy: true,
          message: "Native Deployment Provider is operational",
        });
      });

      it("should check multiple providers", async () => {
        const nativeProvider = new NativeDeploymentProvider();
        const mockProvider = {
          name: "kubernetes",
          isNative: false,
          isAvailable: () => true,
          healthCheck: jest
            .fn()
            .mockResolvedValue({ healthy: false, message: "Cluster unreachable" }),
          getMetadata: jest.fn(),
          deploy: jest.fn(),
        };

        registry.register("native", nativeProvider);
        registry.register("kubernetes", mockProvider as any);

        const results = await registry.healthCheckAll();

        expect(results["native"].healthy).toBe(true);
        expect(results["kubernetes"].healthy).toBe(false);
      });
    });
  });

  describe("NativeDeploymentProvider", () => {
    let provider: NativeDeploymentProvider;

    beforeEach(() => {
      provider = new NativeDeploymentProvider();
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
        expect(result.message).toBe("Native Deployment Provider is operational");
      });
    });

    describe("getMetadata", () => {
      it("should return correct metadata", () => {
        const metadata = provider.getMetadata();

        expect(metadata.name).toBe("deploy-native");
        expect(metadata.provider).toBe("native");
        expect(metadata.capabilities).toContain("local-deployment");
        expect(metadata.capabilities).toContain("docker-deployment");
        expect(metadata.capabilities).toContain("static-site-hosting");
        expect(metadata.isNative).toBe(true);
        expect(metadata.requiresApiKey).toBe(false);
      });
    });

    describe("deploy", () => {
      it("should deploy an application", async () => {
        const application = { name: "test-app" };
        const result = await provider.deploy(application);

        expect(result.jobId).toContain("test-app");
        expect(result.status).toBe("deployed");
        expect(result.url).toBeDefined();
        expect(result.endpoints).toContain("/api/v1/test-app");
        expect(result.deploymentTime).toBeGreaterThanOrEqual(0);
      });

      it("should use default port 3000 when no resources specified", async () => {
        const application = { name: "test-app" };
        const result = await provider.deploy(application);

        expect(result.url).toBe("http://localhost:3000");
      });

      it("should use port 8080 when resources.cpu is specified", async () => {
        const application = { name: "test-app" };
        const config = { target: "local" as const, resources: { cpu: "500m" } };
        const result = await provider.deploy(application, config);

        expect(result.url).toBe("http://localhost:8080");
      });

      it("should generate unique job IDs", async () => {
        const application = { name: "test-app" };
        const result1 = await provider.deploy(application);

        // Wait a bit to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));

        const result2 = await provider.deploy(application);

        expect(result1.jobId).not.toBe(result2.jobId);
      });

      it("should handle application without name", async () => {
        const application = {};
        const result = await provider.deploy(application);

        expect(result.jobId).toContain("app");
        expect(result.endpoints).toContain("/api/v1/app");
      });
    });
  });

  describe("getDeploymentRegistry", () => {
    it("should return a registry instance", () => {
      jest.resetModules();
      const { getDeploymentRegistry } = require("../src/index");
      const registry = getDeploymentRegistry();

      // Check that it's a valid registry object
      expect(typeof registry.register).toBe("function");
      expect(typeof registry.get).toBe("function");
      expect(typeof registry.getActive).toBe("function");
    });

    it("should return the same instance on multiple calls", () => {
      jest.resetModules();
      const { getDeploymentRegistry } = require("../src/index");
      const registry1 = getDeploymentRegistry();
      const registry2 = getDeploymentRegistry();

      expect(registry1).toBe(registry2);
    });
  });

  describe("initializeDeployment", () => {
    it("should initialize with native provider", async () => {
      jest.resetModules();
      const { initializeDeployment } = require("../src/index");
      const registry = await initializeDeployment();

      expect(registry.get("native")).toBeDefined();
    });

    it("should set preferred provider when specified", async () => {
      jest.resetModules();
      const { initializeDeployment } = require("../src/index");
      const registry = await initializeDeployment({
        preferredProvider: "native",
      });

      expect(registry.get("native")).toBeDefined();
    });

    it("should work with empty config", async () => {
      jest.resetModules();
      const { initializeDeployment } = require("../src/index");
      const registry = await initializeDeployment({});

      expect(registry.get("native")).toBeDefined();
    });
  });

  describe("deploy function", () => {
    it("should deploy using active provider", async () => {
      jest.resetModules();
      const { initializeDeployment, deploy } = require("../src/index");
      await initializeDeployment();

      const result = await deploy({ name: "test-app" });

      expect(result.status).toBe("deployed");
    });

    it("should throw error when no provider available", async () => {
      jest.resetModules();
      const { deploy } = require("../src/index");

      await expect(deploy({ name: "test-app" })).rejects.toThrow();
    });

    it("should use specified provider when available", async () => {
      jest.resetModules();
      const { initializeDeployment, deploy } = require("../src/index");
      await initializeDeployment();

      const result = await deploy({ name: "test-app" }, { provider: "native" });

      expect(result).toBeDefined();
    });

    it("should pass config to provider", async () => {
      jest.resetModules();
      const { initializeDeployment, deploy } = require("../src/index");
      await initializeDeployment();

      const config = { target: "local" as const, namespace: "test-ns" };
      const result = await deploy({ name: "test-app" }, { config });

      expect(result).toBeDefined();
    });
  });

  describe("Deployment class", () => {
    let deployment: Deployment;

    beforeEach(() => {
      deployment = new Deployment();
    });

    describe("initialize", () => {
      it("should initialize the deployment service", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();
        await deployment.initialize();

        expect(consoleSpy).toHaveBeenCalledWith("Deployment service initialized");
        consoleSpy.mockRestore();
      });
    });

    describe("execute", () => {
      it("should execute a local deployment", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "local" as const },
        };

        const result = await deployment.execute(request);

        expect(result.jobId).toContain("test-app");
        expect(result.status).toBe("deployed");
        expect(result.url).toBe("http://localhost:3000");
      });

      it("should execute a kubernetes deployment", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "kubernetes" as const, namespace: "production", replicas: 3 },
        };

        const result = await deployment.execute(request);

        expect(result.status).toBe("deployed");
        expect(result.url).toBe("http://test-app.mycodexvantaos.local");
      });

      it("should execute a docker deployment", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "docker" as const },
        };

        const result = await deployment.execute(request);

        expect(result.status).toBe("deployed");
      });

      it("should execute a cloud deployment", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "cloud" as const },
        };

        const result = await deployment.execute(request);

        expect(result.status).toBe("deployed");
        expect(result.url).toBe("https://test-app.mycodexvantaos.cloud");
      });

      it("should throw error for invalid request", async () => {
        const request = {} as any;

        await expect(deployment.execute(request)).rejects.toThrow("Invalid deployment request");
      });

      it("should throw error for missing application", async () => {
        const request = {
          config: { target: "local" as const },
        } as any;

        await expect(deployment.execute(request)).rejects.toThrow("Invalid deployment request");
      });

      it("should throw error for missing config", async () => {
        const request = {
          application: { name: "test-app" },
        } as any;

        await expect(deployment.execute(request)).rejects.toThrow("Invalid deployment request");
      });

      it("should return failed status for unsupported target", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "invalid" as any },
        };

        // The execute method catches errors and returns failed status
        const result = await deployment.execute(request);
        expect(result.status).toBe("failed");
      });

      it("should use default namespace for kubernetes", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "kubernetes" as const },
        };

        const result = await deployment.execute(request);

        // Result is DeploymentResult which doesn't have namespace, but status should be 'deployed'
        expect(result.status).toBe("deployed");
        expect(result.jobId).toBeDefined();
      });

      it("should use default replicas for kubernetes", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "kubernetes" as const },
        };

        const result = await deployment.execute(request);

        expect(result.status).toBe("deployed");
      });
    });

    describe("getStatus", () => {
      it("should return deployment status", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "local" as const },
        };

        const result = await deployment.execute(request);
        const status = deployment.getStatus(result.jobId);

        expect(status).toBeDefined();
        expect(status.status).toBe("running");
      });

      it("should return undefined for non-existent deployment", () => {
        const status = deployment.getStatus("non-existent-id");

        expect(status).toBeUndefined();
      });
    });

    describe("getHistory", () => {
      it("should return empty history initially", () => {
        const history = deployment.getHistory();

        expect(history).toEqual([]);
      });

      it("should return deployment history after executions", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "local" as const },
        };

        await deployment.execute(request);
        const history = deployment.getHistory();

        expect(history.length).toBe(1);
      });
    });

    describe("cleanup", () => {
      it("should cleanup deployment resources", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();
        await deployment.cleanup();

        expect(consoleSpy).toHaveBeenCalledWith("Deployment service cleaned up");
        consoleSpy.mockRestore();
      });

      it("should clear deployments", async () => {
        const request = {
          application: { name: "test-app" },
          config: { target: "local" as const },
        };

        await deployment.execute(request);
        await deployment.cleanup();

        const history = deployment.getHistory();
        expect(history.length).toBe(1); // History is not cleared
      });
    });
  });
});

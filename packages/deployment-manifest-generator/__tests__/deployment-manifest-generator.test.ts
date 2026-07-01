import { DeploymentManifestGenerator, ServiceDefinition, InfrastructureConfig } from "../src/index";

describe("DeploymentManifestGenerator", () => {
  let generator: DeploymentManifestGenerator;

  beforeEach(() => {
    generator = new DeploymentManifestGenerator({
      platform: "docker",
      namespace: "default",
      includeIngress: true,
      includeMonitoring: true,
    });
  });

  describe("Constructor", () => {
    it("should initialize with provided options", () => {
      expect(generator).toBeInstanceOf(DeploymentManifestGenerator);
    });
  });

  describe("generateDockerfile", () => {
    it("should generate valid Dockerfile", () => {
      const dockerfile = generator.generateDockerfile("node:18-alpine");

      expect(dockerfile).toContain("FROM node:18-alpine");
      expect(dockerfile).toContain("WORKDIR /app");
      expect(dockerfile).toContain("npm ci");
      expect(dockerfile).toContain("npm run build");
      expect(dockerfile).toContain("EXPOSE 3000");
      expect(dockerfile).toContain("npm start");
    });

    it("should use custom parameters", () => {
      const dockerfile = generator.generateDockerfile(
        "node:20",
        "/workspace",
        "yarn install",
        "yarn build",
        "yarn start"
      );

      expect(dockerfile).toContain("FROM node:20");
      expect(dockerfile).toContain("WORKDIR /workspace");
      expect(dockerfile).toContain("yarn install");
      expect(dockerfile).toContain("yarn build");
      expect(dockerfile).toContain("yarn start");
    });
  });

  describe("generateDockerCompose", () => {
    it("should generate valid docker-compose.yml", () => {
      const services: ServiceDefinition[] = [
        {
          name: "web",
          image: "nginx:latest",
          ports: [{ container: 80, host: 8080 }],
        },
      ];

      const compose = generator.generateDockerCompose(services);

      expect(compose).toContain("version: '3.8'");
      expect(compose).toContain("web:");
      expect(compose).toContain("image: nginx:latest");
      expect(compose).toContain("8080:80");
    });

    it("should handle multiple services", () => {
      const services: ServiceDefinition[] = [
        { name: "web", image: "nginx", ports: [{ container: 80 }] },
        { name: "api", image: "node", ports: [{ container: 3000 }] },
      ];

      const compose = generator.generateDockerCompose(services);

      expect(compose).toContain("web:");
      expect(compose).toContain("api:");
    });

    it("should include environment variables", () => {
      const services: ServiceDefinition[] = [
        {
          name: "app",
          image: "node",
          ports: [{ container: 3000 }],
          environment: { NODE_ENV: "production", PORT: "3000" },
        },
      ];

      const compose = generator.generateDockerCompose(services);

      expect(compose).toContain("NODE_ENV=production");
      expect(compose).toContain("PORT=3000");
    });

    it("should include volumes", () => {
      const services: ServiceDefinition[] = [
        {
          name: "app",
          image: "node",
          ports: [{ container: 3000 }],
          volumes: [{ host: "./data", container: "/app/data" }],
        },
      ];

      const compose = generator.generateDockerCompose(services);

      expect(compose).toContain("./data:/app/data");
    });

    it("should include health check", () => {
      const services: ServiceDefinition[] = [
        {
          name: "app",
          image: "node",
          ports: [{ container: 3000 }],
          healthCheck: {
            path: "/health",
            interval: 30,
            timeout: 10,
            retries: 3,
          },
        },
      ];

      const compose = generator.generateDockerCompose(services);

      expect(compose).toContain("healthcheck:");
      expect(compose).toContain("/health");
      expect(compose).toContain("interval: 30s");
      expect(compose).toContain("timeout: 10s");
      expect(compose).toContain("retries: 3");
    });
  });

  describe("generateKubernetesDeployment", () => {
    it("should generate valid Kubernetes deployment and service", () => {
      const service: ServiceDefinition = {
        name: "backend",
        image: "myapp:latest",
        ports: [{ container: 3000 }],
        replicas: 3,
      };

      const yaml = generator.generateKubernetesDeployment("backend", service);

      expect(yaml).toContain("apiVersion: apps/v1");
      expect(yaml).toContain("kind: Deployment");
      expect(yaml).toContain("replicas: 3");
      expect(yaml).toContain("apiVersion: v1");
      expect(yaml).toContain("kind: Service");
    });

    it("should include environment variables", () => {
      const service: ServiceDefinition = {
        name: "app",
        image: "app:latest",
        ports: [{ container: 3000 }],
        environment: { DATABASE_URL: "postgres://localhost" },
      };

      const yaml = generator.generateKubernetesDeployment("app", service);

      expect(yaml).toContain("DATABASE_URL");
      expect(yaml).toContain("postgres://localhost");
    });

    it("should include resource limits", () => {
      const service: ServiceDefinition = {
        name: "app",
        image: "app:latest",
        ports: [{ container: 3000 }],
        resources: {
          cpu: "500m",
          memory: "512Mi",
        },
      };

      const yaml = generator.generateKubernetesDeployment("app", service);

      expect(yaml).toContain("resources:");
      expect(yaml).toContain("cpu: 500m");
      expect(yaml).toContain("memory: 512Mi");
    });

    it("should include health check probe", () => {
      const service: ServiceDefinition = {
        name: "app",
        image: "app:latest",
        ports: [{ container: 3000 }],
        healthCheck: {
          path: "/health",
          interval: 30,
          timeout: 10,
          retries: 3,
        },
      };

      const yaml = generator.generateKubernetesDeployment("app", service);

      expect(yaml).toContain("livenessProbe:");
      expect(yaml).toContain("path: /health");
    });
  });

  describe("generateKubernetesConfigMap", () => {
    it("should generate valid ConfigMap", () => {
      const config = generator.generateKubernetesConfigMap("app-config", {
        "config.yaml": "key: value",
      });

      expect(config).toContain("apiVersion: v1");
      expect(config).toContain("kind: ConfigMap");
      expect(config).toContain("name: app-config");
      expect(config).toContain("config.yaml");
    });
  });

  describe("generateKubernetesSecret", () => {
    it("should generate valid Secret", () => {
      const secret = generator.generateKubernetesSecret("app-secret", {
        password: "secret123",
      });

      expect(secret).toContain("apiVersion: v1");
      expect(secret).toContain("kind: Secret");
      expect(secret).toContain("name: app-secret");
      expect(secret).toContain("type: Opaque");
    });

    it("should base64 encode values", () => {
      const secret = generator.generateKubernetesSecret("app-secret", {
        password: "test",
      });

      expect(secret).toContain("dGVzdA=="); // base64 of 'test'
    });
  });

  describe("generateTerraformConfig", () => {
    it("should generate valid Terraform configuration", () => {
      const infrastructure: InfrastructureConfig = {
        provider: "aws",
        region: "us-east-1",
        resources: {},
      };
      const services: ServiceDefinition[] = [
        {
          name: "app",
          image: "app:latest",
          ports: [{ container: 3000 }],
        },
      ];

      const tf = generator.generateTerraformConfig(infrastructure, services);

      expect(tf).toContain('provider "aws"');
      expect(tf).toContain('region = "us-east-1"');
      expect(tf).toContain('resource "aws_vpc"');
      expect(tf).toContain('resource "aws_ecs_service"');
    });
  });

  describe("generateCICDPipeline", () => {
    it("should generate GitHub Actions workflow", () => {
      const workflow = generator.generateCICDPipeline("github", ["build", "test", "deploy"]);

      expect(workflow).toContain("name: CI/CD Pipeline");
      expect(workflow).toContain("on:");
      expect(workflow).toContain("jobs:");
      expect(workflow).toContain("build:");
      expect(workflow).toContain("test:");
      expect(workflow).toContain("deploy:");
    });

    it("should generate GitLab CI configuration", () => {
      const gitlab = generator.generateCICDPipeline("gitlab", ["build", "test"]);

      expect(gitlab).toContain("stages:");
      expect(gitlab).toContain("- build");
      expect(gitlab).toContain("- test");
      expect(gitlab).toContain("npm run build");
      expect(gitlab).toContain("npm run test");
    });

    it("should generate Azure Pipelines configuration", () => {
      const azure = generator.generateCICDPipeline("azure", ["build"]);

      expect(azure).toContain("trigger:");
      expect(azure).toContain("stages:");
      expect(azure).toContain("- stage: build");
      expect(azure).toContain("UseNode@1");
    });
  });

  describe("generateDockerignore", () => {
    it("should generate valid .dockerignore content", () => {
      const dockerignore = generator.generateDockerignore();

      expect(dockerignore).toContain("node_modules");
      expect(dockerignore).toContain("npm-debug.log");
      expect(dockerignore).toContain(".git");
      expect(dockerignore).toContain(".env");
      expect(dockerignore).toContain("coverage");
    });
  });

  describe("generateHealthCheck", () => {
    it("should generate health check handler", () => {
      const healthCheck = generator.generateHealthCheck("/health");

      expect(healthCheck).toContain("health");
      expect(healthCheck).toContain("status: 'healthy'");
      expect(healthCheck).toContain("timestamp");
      expect(healthCheck).toContain("uptime");
    });

    it("should use custom path", () => {
      const healthCheck = generator.generateHealthCheck("/status");

      expect(healthCheck).toContain("/status");
    });
  });
});

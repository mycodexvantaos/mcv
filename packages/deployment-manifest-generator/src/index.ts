/**
 * Deployment Manifest Generator Module
 *
 * This module provides capabilities for generating deployment manifests
 * for Docker, Kubernetes, Terraform, and other orchestration platforms.
 */

export interface ServiceDefinition {
  name: string;
  image: string;
  ports: { container: number; host?: number }[];
  environment?: Record<string, string>;
  volumes?: { host: string; container: string }[];
  replicas?: number;
  resources?: {
    cpu?: string;
    memory?: string;
  };
  healthCheck?: {
    path: string;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface DeploymentManifestOptions {
  platform: "docker" | "kubernetes" | "terraform" | "docker-compose";
  namespace?: string;
  includeIngress?: boolean;
  includeMonitoring?: boolean;
}

export interface InfrastructureConfig {
  provider: string;
  region: string;
  resources: Record<string, any>;
}

export class DeploymentManifestGenerator {
  private options: DeploymentManifestOptions;

  constructor(options: DeploymentManifestOptions) {
    this.options = options;
  }

  /**
   * Generate Dockerfile
   */
  generateDockerfile(
    baseImage: string,
    workDir: string = "/app",
    installCommand: string = "npm ci",
    buildCommand: string = "npm run build",
    startCommand: string = "npm start"
  ): string {
    let dockerfile = `# Auto-generated Dockerfile\n\n`;
    dockerfile += `FROM ${baseImage}\n\n`;
    dockerfile += `# Set working directory\n`;
    dockerfile += `WORKDIR ${workDir}\n\n`;
    dockerfile += `# Copy package files\n`;
    dockerfile += `COPY package*.json ./\n\n`;
    dockerfile += `# Install dependencies\n`;
    dockerfile += `RUN ${installCommand}\n\n`;
    dockerfile += `# Copy application code\n`;
    dockerfile += `COPY . .\n\n`;
    dockerfile += `# Build application\n`;
    dockerfile += `RUN ${buildCommand}\n\n`;
    dockerfile += `# Expose port\n`;
    dockerfile += `EXPOSE 3000\n\n`;
    dockerfile += `# Start application\n`;
    dockerfile += `CMD ["sh", "-c", "${startCommand}"]\n`;

    return dockerfile;
  }

  /**
   * Generate Docker Compose configuration
   */
  generateDockerCompose(services: ServiceDefinition[]): string {
    let compose = `version: '3.8'\n\n`;
    compose += `services:\n`;

    for (const service of services) {
      compose += `  ${service.name}:\n`;
      compose += `    image: ${service.image}\n`;
      compose += `    container_name: ${service.name}\n`;

      // Add ports
      if (service.ports.length > 0) {
        compose += `    ports:\n`;
        for (const port of service.ports) {
          if (port.host) {
            compose += `      - "${port.host}:${port.container}"\n`;
          } else {
            compose += `      - "${port.container}"\n`;
          }
        }
      }

      // Add environment variables
      if (service.environment && Object.keys(service.environment).length > 0) {
        compose += `    environment:\n`;
        for (const [key, value] of Object.entries(service.environment)) {
          compose += `      - ${key}=${value}\n`;
        }
      }

      // Add volumes
      if (service.volumes && service.volumes.length > 0) {
        compose += `    volumes:\n`;
        for (const volume of service.volumes) {
          compose += `      - ${volume.host}:${volume.container}\n`;
        }
      }

      // Add health check
      if (service.healthCheck) {
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD", "curl", "-f", "${service.healthCheck.path}"]\n`;
        compose += `      interval: ${service.healthCheck.interval}s\n`;
        compose += `      timeout: ${service.healthCheck.timeout}s\n`;
        compose += `      retries: ${service.healthCheck.retries}\n`;
      }

      compose += `    restart: always\n\n`;
    }

    return compose;
  }

  /**
   * Generate Kubernetes deployment
   */
  generateKubernetesDeployment(serviceName: string, service: ServiceDefinition): string {
    let yaml = `apiVersion: apps/v1\n`;
    yaml += `kind: Deployment\n`;
    yaml += `metadata:\n`;
    yaml += `  name: ${serviceName}\n`;
    yaml += `  labels:\n`;
    yaml += `    app: ${serviceName}\n`;
    yaml += `spec:\n`;
    yaml += `  replicas: ${service.replicas || 1}\n`;
    yaml += `  selector:\n`;
    yaml += `    matchLabels:\n`;
    yaml += `      app: ${serviceName}\n`;
    yaml += `  template:\n`;
    yaml += `    metadata:\n`;
    yaml += `      labels:\n`;
    yaml += `        app: ${serviceName}\n`;
    yaml += `    spec:\n`;
    yaml += `      containers:\n`;
    yaml += `      - name: ${serviceName}\n`;
    yaml += `        image: ${service.image}\n`;
    yaml += `        imagePullPolicy: Always\n`;

    // Add ports
    if (service.ports.length > 0) {
      yaml += `        ports:\n`;
      for (const port of service.ports) {
        yaml += `        - containerPort: ${port.container}\n`;
      }
    }

    // Add environment variables
    if (service.environment && Object.keys(service.environment).length > 0) {
      yaml += `        env:\n`;
      for (const [key, value] of Object.entries(service.environment)) {
        yaml += `        - name: ${key}\n`;
        yaml += `          value: "${value}"\n`;
      }
    }

    // Add resources
    if (service.resources) {
      yaml += `        resources:\n`;
      yaml += `          requests:\n`;
      if (service.resources.cpu) {
        yaml += `            cpu: ${service.resources.cpu}\n`;
      }
      if (service.resources.memory) {
        yaml += `            memory: ${service.resources.memory}\n`;
      }
    }

    // Add health check
    if (service.healthCheck) {
      yaml += `        livenessProbe:\n`;
      yaml += `          httpGet:\n`;
      yaml += `            path: ${service.healthCheck.path}\n`;
      yaml += `            port: ${service.ports[0]?.container || 3000}\n`;
      yaml += `          initialDelaySeconds: 30\n`;
      yaml += `          periodSeconds: ${service.healthCheck.interval}\n`;
      yaml += `          timeoutSeconds: ${service.healthCheck.timeout}\n`;
    }

    yaml += `\n---\n\n`;

    // Add service
    yaml += `apiVersion: v1\n`;
    yaml += `kind: Service\n`;
    yaml += `metadata:\n`;
    yaml += `  name: ${serviceName}\n`;
    yaml += `spec:\n`;
    yaml += `  selector:\n`;
    yaml += `    app: ${serviceName}\n`;
    yaml += `  ports:\n`;
    for (const port of service.ports) {
      yaml += `  - port: ${port.container}\n`;
      yaml += `    targetPort: ${port.container}\n`;
    }
    yaml += `  type: ClusterIP\n`;

    return yaml;
  }

  /**
   * Generate Kubernetes config map
   */
  generateKubernetesConfigMap(name: string, data: Record<string, string>): string {
    let yaml = `apiVersion: v1\n`;
    yaml += `kind: ConfigMap\n`;
    yaml += `metadata:\n`;
    yaml += `  name: ${name}\n`;
    yaml += `data:\n`;

    for (const [key, value] of Object.entries(data)) {
      yaml += `  ${key}: |\n`;
      yaml += `    ${value.replace(/\n/g, "\n    ")}\n`;
    }

    return yaml;
  }

  /**
   * Generate Kubernetes secret
   */
  generateKubernetesSecret(name: string, data: Record<string, string>): string {
    let yaml = `apiVersion: v1\n`;
    yaml += `kind: Secret\n`;
    yaml += `metadata:\n`;
    yaml += `  name: ${name}\n`;
    yaml += `type: Opaque\n`;
    yaml += `data:\n`;

    for (const [key, value] of Object.entries(data)) {
      // In production, this should be base64 encoded
      yaml += `  ${key}: ${Buffer.from(value).toString("base64")}\n`;
    }

    return yaml;
  }

  /**
   * Generate Terraform configuration
   */
  generateTerraformConfig(
    infrastructure: InfrastructureConfig,
    services: ServiceDefinition[]
  ): string {
    let tf = `# Auto-generated Terraform configuration\n\n`;

    // Add provider
    tf += `provider "aws" {\n`;
    tf += `  region = "${infrastructure.region}"\n`;
    tf += `}\n\n`;

    // Add VPC
    tf += `resource "aws_vpc" "main" {\n`;
    tf += `  cidr_block = "10.0.0.0/16"\n`;
    tf += `  tags = {\n`;
    tf += `    Name = "main-vpc"\n`;
    tf += `  }\n`;
    tf += `}\n\n`;

    // Add services
    for (const service of services) {
      tf += `resource "aws_ecs_service" "${service.name}" {\n`;
      tf += `  name            = "${service.name}"\n`;
      tf += `  cluster         = aws_ecs_cluster.main.id\n`;
      tf += `  task_definition = aws_ecs_task_definition.${service.name}.arn\n`;
      tf += `  desired_count   = ${service.replicas || 1}\n`;
      tf += `}\n\n`;
    }

    return tf;
  }

  /**
   * Generate CI/CD pipeline configuration
   */
  generateCICDPipeline(platform: "github" | "gitlab" | "azure", stages: string[]): string {
    if (platform === "github") {
      return this.generateGitHubActions(stages);
    } else if (platform === "gitlab") {
      return this.generateGitLabCI(stages);
    } else {
      return this.generateAzurePipelines(stages);
    }
  }

  /**
   * Generate GitHub Actions workflow
   */
  private generateGitHubActions(stages: string[]): string {
    let workflow = `name: CI/CD Pipeline\n\n`;
    workflow += `on:\n`;
    workflow += `  push:\n`;
    workflow += `    branches: [ main, develop ]\n`;
    workflow += `  pull_request:\n`;
    workflow += `    branches: [ main ]\n\n`;

    workflow += `jobs:\n`;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      workflow += `  ${stage}:\n`;
      workflow += `    runs-on: ubuntu-latest\n`;
      workflow += `    steps:\n`;
      workflow += `    - uses: actions/checkout@v3\n\n`;
      workflow += `    - name: Setup Node.js\n`;
      workflow += `      uses: actions/setup-node@v3\n`;
      workflow += `      with:\n`;
      workflow += `        node-version: '18'\n\n`;

      if (i === stages.length - 1) {
        workflow += `    - name: Deploy\n`;
        workflow += `      run: npm run deploy\n`;
      }

      workflow += `\n`;
    }

    return workflow;
  }

  /**
   * Generate GitLab CI configuration
   */
  private generateGitLabCI(stages: string[]): string {
    let gitlabCI = `stages:\n`;
    gitlabCI += stages.map((s) => `  - ${s}`).join("\n");
    gitlabCI += `\n\n`;

    for (const stage of stages) {
      gitlabCI += `${stage}:\n`;
      gitlabCI += `  stage: ${stage}\n`;
      gitlabCI += `  script:\n`;
      gitlabCI += `    - npm ci\n`;
      gitlabCI += `    - npm run ${stage}\n`;
      gitlabCI += `\n`;
    }

    return gitlabCI;
  }

  /**
   * Generate Azure Pipelines configuration
   */
  private generateAzurePipelines(stages: string[]): string {
    let azure = `trigger:\n`;
    azure += `- main\n\n`;
    azure += `pool:\n`;
    azure += `  vmImage: 'ubuntu-latest'\n\n`;

    azure += `stages:\n`;

    for (const stage of stages) {
      azure += `- stage: ${stage}\n`;
      azure += `  jobs:\n`;
      azure += `  - job: ${stage}\n`;
      azure += `    steps:\n`;
      azure += `    - task: UseNode@1\n`;
      azure += `      inputs:\n`;
      azure += `        versionSpec: '18.x'\n`;
      azure += `    - script: |\n`;
      azure += `        npm ci\n`;
      azure += `        npm run ${stage}\n`;
      azure += `      displayName: 'Run ${stage}'\n`;
      azure += `\n`;
    }

    return azure;
  }

  /**
   * Generate .dockerignore file
   */
  generateDockerignore(): string {
    return `node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
.env.*.local
coverage
.nyc_output
dist
build
*.md
.DS_Store
`;
  }

  /**
   * Generate health check endpoint
   */
  generateHealthCheck(path: string = "/health"): string {
    return `/**
 * Health check endpoint for ${path}
 */
export async function handler(req: Request, res: Response) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  return res.status(200).json(health);
}
`;
  }
}

export default DeploymentManifestGenerator;

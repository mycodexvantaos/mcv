export type EdgeNodeStatus = 'online' | 'offline' | 'deploying' | 'draining' | 'error';
export type ModelLoadStatus = 'loaded' | 'loading' | 'error';

export interface EdgeNodeResources {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  storageUsage: number;
}

export interface EdgeNodeModel {
  id: string;
  name: string;
  status: ModelLoadStatus;
}

export interface EdgeNodeTraffic {
  requestsPerSecond: number;
  avgLatencyMs: number;
}

export interface EdgeNodeDeployment {
  currentVersion: string;
  targetVersion: string | null;
  lastDeployedAt: string;
  deployedBy: string;
}

export interface EdgeNode {
  id: string;
  name: string;
  region: string;
  status: EdgeNodeStatus;
  deployment: EdgeNodeDeployment;
  resources: EdgeNodeResources;
  models: EdgeNodeModel[];
  traffic: EdgeNodeTraffic;
}

export type DeploymentStep = 'build' | 'test' | 'stage' | 'deploy' | 'verify';
export type DeploymentStepStatus = 'pending' | 'running' | 'success' | 'failed';

export interface DeploymentPipelineStep {
  step: DeploymentStep;
  status: DeploymentStepStatus;
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

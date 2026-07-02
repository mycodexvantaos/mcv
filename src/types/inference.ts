export type ModelStatus = 'active' | 'idle' | 'draining' | 'error';
export type ModelProvider = 'googleai' | 'openai' | 'anthropic' | 'local';

export interface ModelInstance {
  id: string;
  name: string;
  provider: ModelProvider;
  status: ModelStatus;
  endpoint: string;
  apiKeyRef: string;
  maxConcurrent: number;
  currentLoad: number;
}

export interface InferenceMetricsPoint {
  timestamp: string;
  modelId: string;
  requestsPerMinute: number;
  avgLatencyP50Ms: number;
  avgLatencyP99Ms: number;
  tokenInput: number;
  tokenOutput: number;
  errorCount: number;
}

export interface ModelRouting {
  modelId: string;
  provider: ModelProvider;
  weight: number;
  priority: number;
  fallbackModelId: string | null;
}

export interface InferenceMonitor {
  models: ModelInstance[];
  metrics: InferenceMetricsPoint[];
  routing: ModelRouting[];
}

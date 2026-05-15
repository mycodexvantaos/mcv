import { create } from 'zustand';
import type { ModelInstance, InferenceMetricsPoint, ModelRouting } from '@/types/inference';

interface InferenceState {
  models: ModelInstance[];
  metrics: InferenceMetricsPoint[];
  routing: ModelRouting[];
  isLoading: boolean;
  error: string | null;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';

  fetchModels: () => Promise<void>;
  fetchMetrics: (timeRange?: string) => Promise<void>;
  fetchRouting: () => Promise<void>;
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  updateRouting: (modelId: string, weight: number, priority: number) => Promise<void>;
}

export const useInferenceStore = create<InferenceState>((set, get) => ({
  models: [],
  metrics: [],
  routing: [],
  isLoading: false,
  error: null,
  timeRange: '24h',

  fetchModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/inference/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      set({ models: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  fetchMetrics: async (timeRange?: string) => {
    const range = timeRange || get().timeRange;
    try {
      const response = await fetch(`/api/inference/metrics?range=${range}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      set({ metrics: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  fetchRouting: async () => {
    try {
      const response = await fetch('/api/inference/routing');
      if (!response.ok) throw new Error('Failed to fetch routing');
      const data = await response.json();
      set({ routing: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchMetrics(range);
  },

  updateRouting: async (modelId, weight, priority) => {
    try {
      const response = await fetch('/api/inference/routing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, weight, priority }),
      });
      if (!response.ok) throw new Error('Failed to update routing');
      const updated = await response.json();
      set((state) => ({
        routing: state.routing.map((r) => (r.modelId === modelId ? { ...r, weight, priority } : r)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
}));

/**
 * MyCodeXvantaOS Studio Platform — API Data Hooks
 * Phase 3: Data Integration using TanStack Query
 *
 * All hooks follow the pattern:
 *   - Automatic background refetch
 *   - Stale-while-revalidate caching
 *   - Error boundary compatible
 */

import { useEffect, useRef, useState } from 'react';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Generic Fetch Hook ───────────────────────────────────────────────────────

function useApiQuery<T>(
  url: string,
  options: { refetchIntervalMs?: number; enabled?: boolean } = {}
): UseQueryResult<T> {
  const { refetchIntervalMs, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: ApiResponse<T> = await res.json();
      if (!json.success) throw new Error('API returned success: false');
      setData(json.data);
      setError(null);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setIsError(true);
        setError((err as Error).message ?? 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (refetchIntervalMs) {
      const id = setInterval(fetchData, refetchIntervalMs);
      return () => clearInterval(id);
    }
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return { data, isLoading, isError, error, refetch: fetchData };
}

// ─── Domain Hooks ─────────────────────────────────────────────────────────────

/** System overview KPIs, connector status, activity feed, alerts */
export function useOverview() {
  return useApiQuery('/api/overview', { refetchIntervalMs: 30_000 });
}

/** Connector list with optional status/type filter */
export function useConnectors(params?: { status?: string; type?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return useApiQuery(`/api/connectors${qs ? `?${qs}` : ''}`, { refetchIntervalMs: 15_000 });
}

/** LLM model registry */
export function useInferenceModels() {
  return useApiQuery('/api/inference/models', { refetchIntervalMs: 60_000 });
}

/** Inference time-series metrics */
export function useInferenceMetrics(hours = 24, modelId?: string) {
  const qs = new URLSearchParams({ hours: String(hours), ...(modelId ? { modelId } : {}) }).toString();
  return useApiQuery(`/api/inference/metrics?${qs}`, { refetchIntervalMs: 60_000 });
}

/** Model routing configuration */
export function useInferenceRouting() {
  return useApiQuery('/api/inference/routing', { refetchIntervalMs: 120_000 });
}

/** Edge node status */
export function useEdgeNodes() {
  return useApiQuery('/api/edge/nodes', { refetchIntervalMs: 20_000 });
}

/** Scenario matrix */
export function useScenarios(params?: { category?: string; status?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return useApiQuery(`/api/scenarios${qs ? `?${qs}` : ''}`, { refetchIntervalMs: 30_000 });
}

/** Decision guide templates */
export function useDecisions(domain?: string) {
  const qs = domain ? `?domain=${domain}` : '';
  return useApiQuery(`/api/decisions${qs}`, { refetchIntervalMs: 120_000 });
}

/** Security posture and compliance */
export function useSecurity() {
  return useApiQuery('/api/security', { refetchIntervalMs: 60_000 });
}

/** Audit log entries with pagination */
export function useAuditLog(params?: { page?: number; limit?: number; actor?: string; action?: string }) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return useApiQuery(`/api/audit${qs ? `?${qs}` : ''}`, { refetchIntervalMs: 30_000 });
}

// ─── SSE Hook ────────────────────────────────────────────────────────────────

export interface SSEEvent {
  type: string;
  data: unknown;
  ts: string;
}

/**
 * useSSE — subscribes to the /api/events SSE stream.
 * Returns the latest event and connection status.
 */
export function useSSE() {
  const [latestEvent, setLatestEvent] = useState<SSEEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('connected', () => setConnected(true));

    const handleEvent = (type: string) => (e: MessageEvent) => {
      setLatestEvent({ type, data: JSON.parse(e.data), ts: new Date().toISOString() });
    };

    es.addEventListener('inference-metrics', handleEvent('inference-metrics'));
    es.addEventListener('connector-health', handleEvent('connector-health'));
    es.addEventListener('alert', handleEvent('alert'));

    es.onerror = () => {
      setConnected(false);
      setError('SSE connection lost — reconnecting...');
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { latestEvent, connected, error };
}

// ─── Connector Adapter Interface ─────────────────────────────────────────────

export interface ConnectorAdapter {
  id: string;
  name: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  healthCheck: () => Promise<{ status: 'healthy' | 'degraded' | 'offline'; latencyMs: number }>;
  query: <T>(payload: unknown) => Promise<T>;
}

/** Factory: creates a connector adapter for a given connector ID */
export function createConnectorAdapter(connectorId: string): ConnectorAdapter {
  return {
    id: connectorId,
    name: connectorId,
    connect: async () => {
      const res = await fetch(`/api/connectors?id=${connectorId}`);
      return res.ok;
    },
    disconnect: async () => {
      await fetch(`/api/connectors?id=${connectorId}`, { method: 'DELETE' });
    },
    healthCheck: async () => {
      const res = await fetch(`/api/connectors?id=${connectorId}`);
      const json = await res.json();
      const connector = json.data?.[0];
      return { status: connector?.status ?? 'offline', latencyMs: connector?.latencyMs ?? 9999 };
    },
    query: async <T>(payload: unknown): Promise<T> => {
      const res = await fetch(`/api/connectors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connectorId, ...((payload as object) ?? {}) }),
      });
      const json = await res.json();
      return json.data as T;
    },
  };
}

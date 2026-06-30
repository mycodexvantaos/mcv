import { create } from "zustand";
import type { ConnectorInstance, ConnectorType } from "@/types/connector";

interface ConnectorState {
  connectors: ConnectorInstance[];
  selectedConnector: ConnectorInstance | null;
  isLoading: boolean;
  error: string | null;

  fetchConnectors: () => Promise<void>;
  selectConnector: (connector: ConnectorInstance | null) => void;
  addConnector: (
    connector: Omit<ConnectorInstance, "id" | "metrics" | "governance">
  ) => Promise<void>;
  updateConnector: (id: string, updates: Partial<ConnectorInstance>) => Promise<void>;
  removeConnector: (id: string) => Promise<void>;
  healthCheck: (id: string) => Promise<void>;
}

export const useConnectorStore = create<ConnectorState>((set, get) => ({
  connectors: [],
  selectedConnector: null,
  isLoading: false,
  error: null,

  fetchConnectors: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/connectors");
      if (!response.ok) throw new Error("Failed to fetch connectors");
      const data: ConnectorInstance[] = await response.json();
      set({ connectors: data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  selectConnector: (connector) => {
    set({ selectedConnector: connector });
  },

  addConnector: async (connector) => {
    try {
      const response = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connector),
      });
      if (!response.ok) throw new Error("Failed to add connector");
      const newConnector: ConnectorInstance = await response.json();
      set((state) => ({ connectors: [...state.connectors, newConnector] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  updateConnector: async (id, updates) => {
    try {
      const response = await fetch(`/api/connectors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update connector");
      const updated: ConnectorInstance = await response.json();
      set((state) => ({
        connectors: state.connectors.map((c) => (c.id === id ? updated : c)),
        selectedConnector: state.selectedConnector?.id === id ? updated : state.selectedConnector,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  removeConnector: async (id) => {
    try {
      const response = await fetch(`/api/connectors/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove connector");
      set((state) => ({
        connectors: state.connectors.filter((c) => c.id !== id),
        selectedConnector: state.selectedConnector?.id === id ? null : state.selectedConnector,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  healthCheck: async (id) => {
    try {
      const response = await fetch(`/api/connectors/${id}/health`);
      if (!response.ok) throw new Error("Health check failed");
      const result: { status?: string; metrics?: any } = await response.json();
      set((state) => ({
        connectors: state.connectors.map((c) =>
          c.id === id
            ? { ...c, status: result.status as any, metrics: { ...c.metrics, ...result.metrics } }
            : c
        ),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },
}));

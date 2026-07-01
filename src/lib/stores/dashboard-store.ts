import { create } from 'zustand';
import type { SystemOverview, Alert, SystemStatus } from '@/types/dashboard';

interface DashboardState {
  overview: SystemOverview | null;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
  activeAlerts: Alert[];

  fetchOverview: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  setLastSync: (timestamp: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overview: null,
  isLoading: false,
  error: null,
  lastSync: null,
  activeAlerts: [],

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/overview');
      if (!response.ok) throw new Error('Failed to fetch overview');
      const data: SystemOverview & { alerts?: Alert[] } = await response.json();
      set({
        overview: data,
        activeAlerts: data.alerts || [],
        isLoading: false,
        lastSync: new Date().toISOString(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  acknowledgeAlert: (alertId: string) => {
    set((state) => ({
      activeAlerts: state.activeAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  },

  setLastSync: (timestamp: string) => {
    set({ lastSync: timestamp });
  },
}));

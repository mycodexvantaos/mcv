import { create } from 'zustand';
import type { Alert, Severity } from '@/types/dashboard';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: 'n1',
      title: 'System Started',
      message: 'MyCodeXvantaOS Admin Console initialized successfully.',
      severity: 'low',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ],
  unreadCount: 1,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `n_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(
        0,
        state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  dismissNotification: (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, state.unreadCount - (notification && !notification.read ? 1 : 0)),
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

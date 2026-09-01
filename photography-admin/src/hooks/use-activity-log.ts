'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ActivityLogEntry {
  id: string;
  action: string;
  category: 'user' | 'booking' | 'payment' | 'photographer' | 'dispute' | 'review' | 'settings' | 'system' | 'auth';
  description: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  adminName?: string;
  timestamp: string;
}

interface ActivityLogStore {
  logs: ActivityLogEntry[];
  addLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: ActivityLogEntry['category']) => ActivityLogEntry[];
  getLogsByTarget: (targetType: string, targetId: string) => ActivityLogEntry[];
  getRecentLogs: (count: number) => ActivityLogEntry[];
}

export const useActivityLogStore = create<ActivityLogStore>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (entry) => {
        const newEntry: ActivityLogEntry = {
          ...entry,
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          logs: [newEntry, ...state.logs].slice(0, 500), // Keep last 500 entries
        }));
      },

      clearLogs: () => set({ logs: [] }),

      getLogsByCategory: (category) => {
        return get().logs.filter((log) => log.category === category);
      },

      getLogsByTarget: (targetType, targetId) => {
        return get().logs.filter(
          (log) => log.targetType === targetType && log.targetId === targetId
        );
      },

      getRecentLogs: (count) => {
        return get().logs.slice(0, count);
      },
    }),
    {
      name: 'admin-activity-log',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook to log admin actions with convenience methods
 */
export function useActivityLog() {
  const { addLog, logs, getLogsByCategory, getLogsByTarget, getRecentLogs, clearLogs } =
    useActivityLogStore();

  const logAction = (
    action: string,
    category: ActivityLogEntry['category'],
    description: string,
    options?: { targetId?: string; targetType?: string; metadata?: Record<string, unknown> }
  ) => {
    addLog({
      action,
      category,
      description,
      ...options,
    });
  };

  return {
    logs,
    logAction,
    clearLogs,
    getLogsByCategory,
    getLogsByTarget,
    getRecentLogs,
    // Convenience methods
    logUserAction: (action: string, desc: string, userId?: string) =>
      logAction(action, 'user', desc, { targetId: userId, targetType: 'user' }),
    logBookingAction: (action: string, desc: string, bookingId?: string) =>
      logAction(action, 'booking', desc, { targetId: bookingId, targetType: 'booking' }),
    logPaymentAction: (action: string, desc: string, paymentId?: string) =>
      logAction(action, 'payment', desc, { targetId: paymentId, targetType: 'payment' }),
    logSettingsAction: (action: string, desc: string) =>
      logAction(action, 'settings', desc),
    logAuthAction: (action: string, desc: string) =>
      logAction(action, 'auth', desc),
    logSystemAction: (action: string, desc: string) =>
      logAction(action, 'system', desc),
  };
}

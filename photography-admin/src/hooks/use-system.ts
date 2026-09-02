'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: string;
  environment: string;
  database: {
    status: string;
    latency: string;
    engine: string;
  };
  server: {
    status: string;
    port: number;
    memoryUsedMB: number;
    nodeVersion: string;
  };
  paymentGateway: {
    status: string;
    provider: string;
    mode: string;
  };
  storage: {
    status: string;
    mode: string;
    provider: string;
  };
  services: {
    name: string;
    status: string;
    uptime: string;
    responseTime: string;
  }[];
  resources?: {
    label: string;
    value: number;
    color: string;
  }[];
  apiMetrics?: {
    code: string;
    count: number;
    pct: number;
    color: string;
  }[];
  totals?: {
    totalRequests: number;
    avgLatencyMs: number;
  };
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: string;
}

export function useSystemHealth() {
  return useQuery<SystemHealth, Error>({
    queryKey: ['admin', 'system', 'health'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/health');
      return extractData(res);
    },
    refetchInterval: 3000,
  });
}

export function useFeatureFlags() {
  return useQuery<FeatureFlag[], Error>({
    queryKey: ['admin', 'system', 'flags'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/flags');
      return extractData(res) || [];
    },
  });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await api.patch<any>(`/admin/system/flags/${id}`, { enabled });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'flags'] });
      toast.success(data?.message || 'Feature flag updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useCronJobs() {
  return useQuery<CronJob[], Error>({
    queryKey: ['admin', 'system', 'crons'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/crons');
      return extractData(res) || [];
    },
    refetchInterval: 30000,
  });
}

export function useToggleMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceMode: boolean) => {
      const res = await api.post<any>('/admin/system/maintenance', { maintenanceMode });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'health'] });
      toast.success(data?.message || 'Maintenance setting updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export interface RateLimitRule {
  id: string;
  endpoint: string;
  limit: number;
  window: string;
  current: number;
}

export function useRateLimits() {
  return useQuery<RateLimitRule[], Error>({
    queryKey: ['admin', 'system', 'ratelimits'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/ratelimits');
      return extractData(res) || [];
    },
  });
}

export function useUpdateRateLimits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (limits: RateLimitRule[]) => {
      const res = await api.put<any>('/admin/system/ratelimits', { limits });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'ratelimits'] });
      toast.success(data?.message || 'Rate limits saved and committed to database!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// LIVE SYSTEM QUEUES
// ============================================

export interface QueueData {
  name: string;
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export function useQueues() {
  return useQuery<QueueData[], Error>({
    queryKey: ['admin', 'system', 'queues'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/queues');
      return extractData(res) || [];
    },
    refetchInterval: 15000,
  });
}

// ============================================
// PERSISTENT DATABASE BACKUPS
// ============================================

export interface BackupItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
  status: string;
}

export function useBackups() {
  return useQuery<BackupItem[], Error>({
    queryKey: ['admin', 'system', 'backups'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/backups');
      return extractData(res) || [];
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<any>('/admin/system/backups', {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'backups'] });
      toast.success(data?.message || 'Database backup created and saved!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<any>(`/admin/system/backups/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'backups'] });
      toast.success(data?.message || 'Backup snapshot deleted!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// PERSISTENT A/B TESTING
// ============================================

export interface AbTest {
  id: string;
  name: string;
  status: 'running' | 'paused';
  startDate: string;
  variants: string[];
  traffic: number[];
  conversions: number[];
}

export function useAbTests() {
  return useQuery<AbTest[], Error>({
    queryKey: ['admin', 'system', 'abtests'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/system/abtests');
      return extractData(res) || [];
    },
  });
}

export function useToggleAbTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<any>(`/admin/system/abtests/${id}/toggle`, {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'abtests'] });
      toast.success(data?.message || 'A/B test status updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

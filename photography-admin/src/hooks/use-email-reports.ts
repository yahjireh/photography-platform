'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';
export type ReportType = 'revenue' | 'bookings' | 'users' | 'photographers' | 'disputes' | 'full_summary';

export interface EmailReportConfig {
  id: string;
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  enabled: boolean;
  lastSentAt?: string;
  nextSendAt?: string;
  includeCharts: boolean;
  createdAt: string;
}

export interface CreateReportConfig {
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  includeCharts: boolean;
}

/**
 * Fetch all configured email report schedules
 */
export function useEmailReports() {
  return useQuery<EmailReportConfig[]>({
    queryKey: ['admin', 'email-reports'],
    queryFn: async () => {
      try {
        const response = await api.get<EmailReportConfig[]>('/admin/reports/schedules');
        return response.data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new email report schedule
 */
export function useCreateEmailReport() {
  const queryClient = useQueryClient();

  return useMutation<EmailReportConfig, Error, CreateReportConfig>({
    mutationFn: async (config) => {
      const response = await api.post<EmailReportConfig>('/admin/reports/schedules', config);
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-reports'] });
      toast.success('Email report schedule created');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Toggle a report schedule on/off
 */
export function useToggleEmailReport() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; enabled: boolean }>({
    mutationFn: async ({ id, enabled }) => {
      await api.patch(`/admin/reports/schedules/${id}`, { enabled });
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-reports'] });
      toast.success(enabled ? 'Report schedule enabled' : 'Report schedule paused');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Delete a report schedule
 */
export function useDeleteEmailReport() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/admin/reports/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-reports'] });
      toast.success('Report schedule deleted');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Send a report immediately (one-off)
 */
export function useSendReportNow() {
  return useMutation<void, Error, { type: ReportType; recipients: string[] }>({
    mutationFn: async ({ type, recipients }) => {
      await api.post('/admin/reports/send-now', { type, recipients });
    },
    onSuccess: () => {
      toast.success('Report sent successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

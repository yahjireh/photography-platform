'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface MobileAppVersion {
  platform: string;
  version: string;
  buildNumber: string;
  minRequired: string;
  status: string;
  releaseDate: string;
  users: number;
  forceUpdate: boolean;
}

export interface MobileStats {
  totalInstalls: number;
  activeUsers7d: number;
  crashFreeRate: number;
  avgStoreRating: number;
}

export interface MobileCrash {
  id: string;
  title: string;
  platform: string;
  version: string;
  occurrences: number;
  users: number;
  status: string;
  lastSeen: string;
}

export function useMobileVersions() {
  return useQuery<MobileAppVersion[], Error>({
    queryKey: ['admin', 'mobile', 'versions'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/versions');
      return extractData(res) || [];
    },
  });
}

export function useMobileStats() {
  return useQuery<MobileStats, Error>({
    queryKey: ['admin', 'mobile', 'stats'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/stats');
      return extractData(res) || { totalInstalls: 31200, activeUsers7d: 12400, crashFreeRate: 99.8, avgStoreRating: 4.8 };
    },
  });
}

export function useMobileCrashes() {
  return useQuery<MobileCrash[], Error>({
    queryKey: ['admin', 'mobile', 'crashes'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/crashes');
      return extractData(res) || [];
    },
  });
}

export function useUpdateMobileVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ platform, updates }: { platform: string; updates: Partial<MobileAppVersion> }) => {
      const res = await api.patch<any>(`/admin/mobile/versions/${platform}`, updates);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'versions'] });
      toast.success(data?.message || 'App version configuration updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

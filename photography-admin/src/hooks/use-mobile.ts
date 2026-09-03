'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

// ============================================
// 1. APP VERSIONS
// ============================================

export interface MobileAppVersion {
  id: string;
  platform: 'iOS' | 'Android';
  version: string;
  buildNumber: string;
  minRequired: string;
  status: 'live' | 'beta' | 'deprecated';
  releaseDate: string;
  users: number;
  forceUpdate: boolean;
  softUpdate: boolean;
  releaseNotes?: string;
  storeUrl?: string;
}

export function useMobileVersions() {
  return useQuery<MobileAppVersion[], Error>({
    queryKey: ['admin', 'mobile', 'versions'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/versions');
      return extractData(res) || [];
    },
    refetchInterval: 30000,
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

export function useBroadcastSoftUpdate() {
  return useMutation({
    mutationFn: async (platform: string) => {
      const res = await api.post<any>(`/admin/mobile/versions/${platform}/soft-update`, {});
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Soft update notice broadcast to all mobile users!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useCreateMobileVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newVersion: Partial<MobileAppVersion>) => {
      const res = await api.post<any>('/admin/mobile/versions', newVersion);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'versions'] });
      toast.success(data?.message || 'New app release created and published!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// 2. MOBILE STATS
// ============================================

export interface MobileStats {
  totalInstalls: number;
  activeUsers7d: number;
  crashFreeRate: number;
  avgStoreRating: number;
  totalReviews?: number;
  totalBookingsMobile?: number;
  change?: string;
}

export function useMobileStats() {
  return useQuery<MobileStats, Error>({
    queryKey: ['admin', 'mobile', 'stats'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/stats');
      return extractData(res) || { totalInstalls: 0, activeUsers7d: 0, crashFreeRate: 100, avgStoreRating: 0, totalReviews: 0, change: 'Live' };
    },
    refetchInterval: 10000,
  });
}

// ============================================
// 3. PUSH CAMPAIGNS
// ============================================

export interface MobilePushCampaign {
  id: string;
  title: string;
  body: string;
  platform: string;
  audience: string;
  deepLink?: string;
  status: 'Sent' | 'Scheduled';
  sentAt: string;
  targetCount: number;
}

export function useMobileCampaigns() {
  return useQuery<MobilePushCampaign[], Error>({
    queryKey: ['admin', 'mobile', 'campaigns'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/campaigns');
      return extractData(res) || [];
    },
  });
}

export function useCreateMobileCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; body: string; platform: string; audience: string; deepLink?: string }) => {
      const res = await api.post<any>('/admin/mobile/campaigns', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'campaigns'] });
      toast.success(data?.message || 'Push campaign sent successfully!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// 4. IN-APP MESSAGES
// ============================================

export interface MobileInAppMessage {
  id: string;
  title: string;
  body: string;
  type: 'Banner' | 'Modal' | 'Full Screen' | 'Bottom Sheet';
  trigger: string;
  active: boolean;
  createdAt: string;
  views: number;
  clicks: number;
  deepLink?: string;
}

export function useMobileInAppMessages() {
  return useQuery<MobileInAppMessage[], Error>({
    queryKey: ['admin', 'mobile', 'messages'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/messages');
      return extractData(res) || [];
    },
  });
}

export function useCreateMobileInAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; body: string; type: string; trigger: string; deepLink?: string }) => {
      const res = await api.post<any>('/admin/mobile/messages', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'messages'] });
      toast.success(data?.message || 'In-app message scheduled!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useToggleMobileInAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<any>(`/admin/mobile/messages/${id}/toggle`, {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'messages'] });
      toast.success(data?.message || 'In-app message status updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useDeleteMobileInAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<any>(`/admin/mobile/messages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'messages'] });
      toast.success('In-app message removed!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// 5. CRASH REPORTS
// ============================================

export interface MobileCrash {
  id: string;
  title: string;
  platform: string;
  version: string;
  occurrences: number;
  users: number;
  status: 'open' | 'investigating' | 'resolved' | 'monitoring';
  lastSeen: string;
  stackTrace?: string;
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

export function useUpdateMobileCrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch<any>(`/admin/mobile/crashes/${id}`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'crashes'] });
      toast.success(data?.message || 'Crash status updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useClearResolvedCrashes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<any>('/admin/mobile/crashes/clear', {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'crashes'] });
      toast.success(data?.message || 'Resolved crashes cleared!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// 6. MOBILE FEATURE FLAGS
// ============================================

export interface MobileFeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'production' | 'staging' | 'development';
}

export function useMobileFlags() {
  return useQuery<MobileFeatureFlag[], Error>({
    queryKey: ['admin', 'mobile', 'flags'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/flags');
      return extractData(res) || [];
    },
  });
}

export function useUpdateMobileFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await api.patch<any>(`/admin/mobile/flags/${id}`, { enabled });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'flags'] });
      toast.success(data?.message || 'Mobile feature flag updated and synced to all devices!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

// ============================================
// 7. MOBILE A/B TESTING
// ============================================

export interface MobileAbTest {
  id: string;
  name: string;
  platform: string;
  status: 'running' | 'paused';
  startDate: string;
  variants: string[];
  traffic: number[];
  conversions: number[];
}

export function useMobileAbTests() {
  return useQuery<MobileAbTest[], Error>({
    queryKey: ['admin', 'mobile', 'abtests'],
    queryFn: async () => {
      const res = await api.get<any>('/admin/mobile/abtests');
      return extractData(res) || [];
    },
  });
}

export function useCreateMobileAbTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; platform: string; variants: string[]; traffic?: number[] }) => {
      const res = await api.post<any>('/admin/mobile/abtests', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'abtests'] });
      toast.success(data?.message || 'Mobile A/B test created!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useToggleMobileAbTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<any>(`/admin/mobile/abtests/${id}/toggle`, {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'abtests'] });
      toast.success(data?.message || 'A/B test status updated!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

export function useResetMobileAbTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<any>(`/admin/mobile/abtests/${id}/reset`, {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mobile', 'abtests'] });
      toast.success(data?.message || 'A/B test metrics reset!');
    },
    onError: (err) => {
      toast.error(handleApiError(err));
    },
  });
}

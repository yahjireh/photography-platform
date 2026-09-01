/**
 * Settings Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { api, extractData, handleApiError, ApiResponse } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface Settings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    currency: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  commissionRates: {
    FREE: number;
    PRO: number;
    ENTERPRISE: number;
  };
  subscription: {
    PRO: {
      monthly: number;
      yearly: number;
    };
    ENTERPRISE: {
      monthly: number;
      yearly: number;
    };
  };
  payment: {
    paystackPublicKey?: string;
    minimumWithdrawal: number;
    processingTime: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  policies: {
    maxFileSize: number;
    maxImagesPerBooking: number;
    allowedFileTypes: string[];
  };
}

export function useSettings() {
  return useQuery<Settings, Error>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get<Settings>('/admin/settings');
      return extractData(response) as Settings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSettings(
  options?: UseMutationOptions<ApiResponse<Settings>, Error, Partial<Settings>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await api.patch<Settings>('/admin/settings', updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

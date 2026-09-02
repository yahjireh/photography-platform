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
    supportPhone?: string;
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
    paystackSecretKey?: string;
    minimumWithdrawal: number;
    processingTime: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    bookingAlerts?: boolean;
    paymentAlerts?: boolean;
    disputeAlerts?: boolean;
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
  ipWhitelist?: string[];
}

export function useSettings() {
  return useQuery<Settings, Error>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get<Settings>('/admin/settings');
      return extractData(response) as Settings;
    },
    staleTime: 0, // Always load fresh from database
    refetchOnWindowFocus: true,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(data?.message || 'Settings saved and persisted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

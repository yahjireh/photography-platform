'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorStatus {
  enabled: boolean;
  verifiedAt?: string;
  backupCodesRemaining: number;
}

/**
 * Hook to check 2FA status for the current admin
 */
export function useTwoFactorStatus() {
  return useQuery<TwoFactorStatus>({
    queryKey: ['admin', '2fa', 'status'],
    queryFn: async () => {
      try {
        const response = await api.get<TwoFactorStatus>('/admin/2fa/status');
        return response.data.data || { enabled: false, backupCodesRemaining: 0 };
      } catch {
        return { enabled: false, backupCodesRemaining: 0 };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to initiate 2FA setup (generates secret + QR code)
 */
export function useSetupTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation<TwoFactorSetup, Error>({
    mutationFn: async () => {
      const response = await api.post<TwoFactorSetup>('/admin/2fa/setup');
      return response.data.data!;
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Hook to verify and enable 2FA with a TOTP code
 */
export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      await api.post('/admin/2fa/verify', { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', '2fa', 'status'] });
      toast.success('Two-factor authentication enabled successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Hook to disable 2FA
 */
export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { code: string; password: string }>({
    mutationFn: async ({ code, password }) => {
      await api.post('/admin/2fa/disable', { code, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', '2fa', 'status'] });
      toast.success('Two-factor authentication disabled');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Hook to regenerate backup codes
 */
export function useRegenerateBackupCodes() {
  const queryClient = useQueryClient();

  return useMutation<string[], Error, { password: string }>({
    mutationFn: async ({ password }) => {
      const response = await api.post<{ backupCodes: string[] }>('/admin/2fa/backup-codes', { password });
      return response.data.data!.backupCodes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', '2fa', 'status'] });
      toast.success('New backup codes generated');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Stateful hook for the 2FA setup flow
 */
export function useTwoFactorSetupFlow() {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'backup' | 'complete'>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);

  const setup = useSetupTwoFactor();
  const verify = useVerifyTwoFactor();

  const startSetup = async () => {
    try {
      const data = await setup.mutateAsync();
      setSetupData(data);
      setStep('setup');
    } catch {
      // error handled in hook
    }
  };

  const verifyCode = async (code: string) => {
    try {
      await verify.mutateAsync({ code });
      setStep('backup');
    } catch {
      // error handled in hook
    }
  };

  const complete = () => {
    setStep('complete');
    setSetupData(null);
  };

  const reset = () => {
    setStep('idle');
    setSetupData(null);
  };

  return {
    step,
    setupData,
    startSetup,
    verifyCode,
    complete,
    reset,
    isSettingUp: setup.isPending,
    isVerifying: verify.isPending,
  };
}

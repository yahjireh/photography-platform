/**
 * Authentication Hooks
 * Handles login, logout, and token management
 */

'use client';

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { api, tokenManager, handleApiError, ApiResponse } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Login credentials type
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login response type (matches backend snake_case format)
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    profile_image_url: string | null;
    is_verified: boolean;
  };
  token: string;
}

// ============================================
// FAILED LOGIN TRACKING
// ============================================

const LOGIN_ATTEMPTS_KEY = 'admin_login_attempts';
const LOCKOUT_KEY = 'admin_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const loginTracker = {
  getAttempts: (): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0', 10);
  },
  incrementAttempts: (): number => {
    if (typeof window === 'undefined') return 0;
    const attempts = loginTracker.getAttempts() + 1;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION_MS));
    }
    return attempts;
  },
  resetAttempts: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  },
  isLockedOut: (): boolean => {
    if (typeof window === 'undefined') return false;
    const lockoutUntil = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutUntil) return false;
    if (Date.now() > parseInt(lockoutUntil, 10)) {
      loginTracker.resetAttempts();
      return false;
    }
    return true;
  },
  getLockoutRemaining: (): number => {
    if (typeof window === 'undefined') return 0;
    const lockoutUntil = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutUntil) return 0;
    const remaining = parseInt(lockoutUntil, 10) - Date.now();
    return remaining > 0 ? remaining : 0;
  },
  getRemainingAttempts: (): number => {
    return Math.max(0, MAX_ATTEMPTS - loginTracker.getAttempts());
  },
};

/**
 * useLogin Hook
 * Handles user login with failed attempt tracking
 */
export function useLogin(
  options?: UseMutationOptions<ApiResponse<LoginResponse>, Error, LoginCredentials>
) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Check lockout before attempting
      if (loginTracker.isLockedOut()) {
        const mins = Math.ceil(loginTracker.getLockoutRemaining() / 60000);
        throw new Error(`Account temporarily locked. Try again in ${mins} minutes.`);
      }
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Reset failed attempts on success
        loginTracker.resetAttempts();

        // Store token
        tokenManager.setToken(data.data.token);

        // Check if user is admin
        if (data.data.user.user_type !== 'ADMIN') {
          tokenManager.removeToken();
          toast.error('Access denied. Admin privileges required.');
          return;
        }

        // Show success message
        const fullName = `${data.data.user.first_name} ${data.data.user.last_name}`;
        toast.success(`Welcome back, ${fullName}!`);

        // Redirect to dashboard
        router.push('/');
        router.refresh();
      } else {
        // Track failed attempt
        const attempts = loginTracker.incrementAttempts();
        const remaining = loginTracker.getRemainingAttempts();
        if (remaining > 0) {
          toast.error(`${data.message || 'Login failed'}. ${remaining} attempts remaining.`);
        } else {
          toast.error('Too many failed attempts. Account locked for 15 minutes.');
        }
      }
    },
    onError: (error) => {
      // Track failed attempt
      loginTracker.incrementAttempts();
      const errorMessage = handleApiError(error);
      const remaining = loginTracker.getRemainingAttempts();
      if (remaining > 0 && !errorMessage.includes('locked')) {
        toast.error(`${errorMessage}. ${remaining} attempts remaining.`);
      } else {
        toast.error(errorMessage);
      }
    },
    ...options,
  });
}

/**
 * useLogout Hook
 * Handles user logout
 */
export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Call logout endpoint (optional, if you have one)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignore logout API errors, still clear local tokens
        console.error('Logout API error:', error);
      }
    },
    onSuccess: () => {
      // Clear tokens
      tokenManager.removeToken();

      // Show message
      toast.success('Logged out successfully');

      // Redirect to login
      router.push('/login');
      router.refresh();
    },
    onError: (error) => {
      // Even if API fails, clear tokens and redirect
      tokenManager.removeToken();
      router.push('/login');
      router.refresh();
    },
  });
}

/**
 * useAuth Hook
 * Gets current authentication state
 */
export function useAuth() {
  const isAuthenticated = typeof window !== 'undefined' && !!tokenManager.getToken();

  return {
    isAuthenticated,
    token: tokenManager.getToken(),
  };
}

/**
 * Redirect if not authenticated
 * Use this in pages that require authentication
 */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (typeof window !== 'undefined' && !isAuthenticated) {
    router.push('/login');
  }

  return { isAuthenticated };
}

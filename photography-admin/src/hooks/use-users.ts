/**
 * User Management Hooks
 * Handles CRUD operations for users
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { api, extractPaginatedData, extractData, handleApiError, ApiResponse, PaginatedResponse } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import toast from 'react-hot-toast';

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  emailVerified: boolean;
  phoneVerified: boolean;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  photographer?: {
    id: string;
    verificationStatus: string;
    tier: string;
  };
  bookingsAsClient?: Array<{
    id: string;
    status: string;
    totalAmount: number;
  }>;
}

/**
 * User filters type
 */
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

/**
 * useUsers Hook
 * Fetches all users with filtering and pagination
 */
export function useUsers(
  filters?: UserFilters,
) {
  const queryParams = new URLSearchParams();

  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.userType) queryParams.append('userType', filters.userType);
  if (filters?.emailVerified !== undefined) queryParams.append('emailVerified', filters.emailVerified.toString());
  if (filters?.phoneVerified !== undefined) queryParams.append('phoneVerified', filters.phoneVerified.toString());

  return useQuery<PaginatedResponse<User>['data'], Error>({
    queryKey: [...QUERY_KEYS.USERS, filters],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/users?${queryParams.toString()}`);
      const rawData = extractPaginatedData(response);

      // Transform users data: convert snake_case to camelCase
      const transformedUsers = rawData.users?.map((user: any) => ({
        id: user.id,
        email: user.email,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
        phoneNumber: user.phone_number,
        avatarUrl: user.profile_image_url,
        userType: user.user_type,
        emailVerified: !!user.is_verified || !!user.email_verified_at || !!user.email_verified || user.user_type === 'ADMIN',
        phoneVerified: !!user.phone_number || !!user.phone_verified,
        city: user.location_city,
        country: user.location_country,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        photographer: user.photographers ? {
          id: user.photographers.id,
          verificationStatus: user.photographers.verification_status,
          tier: user.photographers.tier,
        } : undefined,
        bookingsAsClient: user.bookings_bookings_client_idTousers?.map((booking: any) => ({
          id: booking.id,
          status: booking.status,
          totalAmount: parseFloat(booking.total_amount) || 0,
        })),
      })) || [];

      return {
        users: transformedUsers,
        pagination: rawData.pagination,
      } as PaginatedResponse<User>['data'];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

/**
 * useUser Hook
 * Fetches a single user by ID
 */
export function useUser(
  userId: string,
) {
  return useQuery<User, Error>({
    queryKey: QUERY_KEYS.USER_DETAIL(userId),
    queryFn: async () => {
      const response = await api.get<any>(`/admin/users/${userId}`);
      const user = extractData(response);

      // Transform user data
      return {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
        phoneNumber: user.phone_number,
        avatarUrl: user.profile_image_url,
        userType: user.user_type,
        emailVerified: !!user.is_verified || !!user.email_verified_at || !!user.email_verified || user.user_type === 'ADMIN',
        phoneVerified: !!user.phone_number || !!user.phone_verified,
        city: user.location_city,
        country: user.location_country,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        photographer: user.photographers ? {
          id: user.photographers.id,
          verificationStatus: user.photographers.verification_status,
          tier: user.photographers.tier,
        } : undefined,
        bookingsAsClient: user.bookings_bookings_client_idTousers?.map((booking: any) => ({
          id: booking.id,
          status: booking.status,
          totalAmount: parseFloat(booking.total_amount) || 0,
        })),
      } as User;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * useUpdateUser Hook
 * Updates user details
 */
export function useUpdateUser(
  options?: UseMutationOptions<ApiResponse<User>, Error, { userId: string; updates: Partial<User> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      const response = await api.patch<User>(`/admin/users/${userId}`, updates);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_DETAIL(variables.userId) });

      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

/**
 * Create a new user
 */
export function useCreateUser(
  options?: UseMutationOptions<ApiResponse<User>, Error, {
    email: string;
    fullName: string;
    phoneNumber?: string;
    userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
    city?: string;
    country?: string;
  }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post<User>('/admin/users', userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

/**
 * useSuspendUser Hook
 * Suspends or unsuspends a user
 */
export function useSuspendUser(
  options?: UseMutationOptions<ApiResponse<User>, Error, { userId: string; suspended: boolean; reason?: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, suspended, reason }) => {
      const response = await api.post<User>(`/admin/users/${userId}/suspend`, { suspended, reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_DETAIL(variables.userId) });

      toast.success(variables.suspended ? 'User suspended successfully' : 'User unsuspended successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

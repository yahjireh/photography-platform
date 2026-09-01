/**
 * Photographer Management Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { api, extractPaginatedData, extractData, handleApiError, ApiResponse, PaginatedResponse } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export interface Photographer {
  id: string;
  user_id: string;
  business_name: string;
  bio?: string;
  years_experience?: number;
  hourly_rate?: number;
  day_rate?: number;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  tier: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';
  created_at: string;
  total_bookings?: number;
  total_revenue?: number;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    profile_image_url?: string;
    location_city?: string;
    bookings_bookings_photographer_idTousers?: any[];
  };
  portfolio_items?: any[];
  reviews?: Array<{
    rating: number;
  }>;
  bookings_bookings_photographer_idTousers?: any[];
  avg_rating?: number;
}

export interface PhotographerFilters {
  page?: number;
  limit?: number;
  search?: string;
  verificationStatus?: string;
  tier?: string;
  minRating?: number;
}

export function usePhotographers(
  filters?: PhotographerFilters,
) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.verificationStatus) queryParams.append('verificationStatus', filters.verificationStatus);
  if (filters?.tier) queryParams.append('tier', filters.tier);
  if (filters?.minRating) queryParams.append('minRating', filters.minRating.toString());

  return useQuery<PaginatedResponse<Photographer>['data'], Error>({
    queryKey: [...QUERY_KEYS.PHOTOGRAPHERS, filters],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/photographers?${queryParams.toString()}`);
      const rawData = extractPaginatedData(response);

      // Transform photographers data
      const transformedPhotographers = rawData.photographers?.map((photographer: any) => ({
        ...photographer,
        // Map camelCase computed fields to snake_case
        avg_rating: photographer.avgRating,
        total_bookings: photographer.totalBookings,
        total_revenue: photographer.totalRevenue,
        // Extract tier from subscriptions object
        tier: photographer.subscriptions?.tier || 'FREE',
      })) || [];

      return {
        photographers: transformedPhotographers,
        pagination: rawData.pagination,
      } as PaginatedResponse<Photographer>['data'];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

export function usePhotographer(
  photographerId: string,
) {
  return useQuery<Photographer, Error>({
    queryKey: QUERY_KEYS.PHOTOGRAPHER_DETAIL(photographerId),
    queryFn: async () => {
      const response = await api.get<any>(`/admin/photographers/${photographerId}`);
      const photographer = extractData(response);

      // Transform photographer data
      return {
        ...photographer,
        // Map camelCase computed fields to snake_case
        avg_rating: photographer.avgRating,
        total_bookings: photographer.totalBookings,
        total_revenue: photographer.totalRevenue,
        // Extract tier from subscriptions object
        tier: photographer.subscriptions?.tier || 'FREE',
      } as Photographer;
    },
    enabled: !!photographerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePendingVerifications() {
  return useQuery<Photographer[], Error>({
    queryKey: QUERY_KEYS.PENDING_VERIFICATIONS,
    queryFn: async () => {
      const response = await api.get<Photographer[]>('/admin/photographers/pending');
      return extractData(response) as Photographer[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useVerifyPhotographer(
  options?: UseMutationOptions<ApiResponse<Photographer>, Error, { photographerId: string; action: 'approve' | 'reject'; reason?: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photographerId, action, reason }) => {
      const response = await api.post<Photographer>(`/admin/photographers/${photographerId}/verify`, { action, reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_VERIFICATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHER_DETAIL(variables.photographerId) });

      toast.success(`Photographer ${variables.action}d successfully`);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

export function useUpdatePhotographerTier(
  options?: UseMutationOptions<ApiResponse<Photographer>, Error, { photographerId: string; tier: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photographerId, tier }) => {
      const response = await api.patch<Photographer>(`/admin/photographers/${photographerId}/tier`, { tier });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHER_DETAIL(variables.photographerId) });

      toast.success('Photographer tier updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

/**
 * Update photographer details
 */
export function useUpdatePhotographer(
  options?: UseMutationOptions<ApiResponse<Photographer>, Error, { photographerId: string; updates: Partial<Photographer> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photographerId, updates }) => {
      const response = await api.patch<Photographer>(`/admin/photographers/${photographerId}`, updates);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHER_DETAIL(variables.photographerId) });

      toast.success('Photographer updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

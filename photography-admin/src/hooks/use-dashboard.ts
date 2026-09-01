/**
 * Dashboard Hooks
 * Handles dashboard statistics and widgets data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api, extractData, handleApiError, ApiResponse } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';

/**
 * Dashboard stats type (matches backend response format)
 */
export interface DashboardStats {
  users: {
    total: number;
    growth: number;
    label: string;
  };
  photographers: {
    total: number;
    growth: number;
    label: string;
  };
  bookings: {
    total: number;
    active: number;
    growth: number;
    label: string;
  };
  revenue: {
    total: number;
    growth: number;
    label: string;
  };
  pendingVerifications: number;
  openDisputes: number;
  pendingPayouts: number;
}

/**
 * Revenue data type (matches backend camelCase format)
 */
export interface RevenueData {
  byDate: Array<{
    date: string;
    amount: number;
  }>;
  byOccasion: Array<{
    occasion: string;
    amount: number;
  }>;
  total: number;
}

/**
 * Recent booking type (matches backend snake_case format)
 */
export interface RecentBooking {
  id: string;
  booking_number: string;
  status: string;
  occasion_type: string;
  event_date: string;
  total_amount: number;
  created_at: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_image_url?: string;
    name?: string; // Computed field
    avatar?: string; // Computed field
  };
  photographer: {
    id: string;
    first_name: string;
    last_name: string;
    business_name?: string;
    name?: string; // Computed field
    avatar?: string; // Computed field
  };
}

/**
 * Top photographer type (matches backend camelCase format)
 */
export interface TopPhotographer {
  id: string;
  name: string;
  avatarUrl: string | null;
  completedBookings: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
}

/**
 * useDashboardStats Hook
 * Fetches dashboard statistics
 */
export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: QUERY_KEYS.DASHBOARD_STATS,
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/admin/dashboard/stats');
      return extractData(response) as DashboardStats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useDashboardRevenue Hook
 * Fetches revenue data for charts
 */
export function useDashboardRevenue(
  timeRange: string = '30d',
) {
  return useQuery<RevenueData, Error>({
    queryKey: [...QUERY_KEYS.DASHBOARD_REVENUE, timeRange],
    queryFn: async () => {
      const response = await api.get<RevenueData>(`/admin/dashboard/revenue?timeRange=${timeRange}`);
      return extractData(response) as RevenueData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * useRecentBookings Hook
 * Fetches recent bookings for dashboard widget
 */
export function useRecentBookings() {
  return useQuery<RecentBooking[], Error>({
    queryKey: ['dashboard', 'recent-bookings'],
    queryFn: async () => {
      const response = await api.get<any>('/admin/dashboard/recent-bookings');
      const data = extractData(response);

      // Transform the data: backend uses long Prisma relation names
      return data.map((booking: any) => {
        const clientRelation = booking.users_bookings_client_idTousers;
        const photographerRelation = booking.users_bookings_photographer_idTousers;

        return {
          ...booking,
          // Convert string amounts to numbers
          total_amount: parseFloat(booking.total_amount) || 0,
          deposit_amount: parseFloat(booking.deposit_amount) || 0,
          balance_amount: parseFloat(booking.balance_amount) || 0,
          platform_commission: parseFloat(booking.platform_commission) || 0,
          client: clientRelation ? {
            id: clientRelation.id,
            first_name: clientRelation.first_name,
            last_name: clientRelation.last_name,
            email: clientRelation.email,
            profile_image_url: clientRelation.profile_image_url,
            name: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
            avatar: clientRelation.profile_image_url || undefined
          } : {
            id: '',
            first_name: '',
            last_name: '',
            email: '',
            name: 'Unknown',
            avatar: undefined
          },
          photographer: photographerRelation ? {
            id: photographerRelation.id,
            first_name: photographerRelation.first_name,
            last_name: photographerRelation.last_name,
            name: `${photographerRelation.first_name || ''} ${photographerRelation.last_name || ''}`.trim() || 'Unknown Photographer',
            avatar: photographerRelation.profile_image_url || undefined
          } : {
            id: '',
            first_name: '',
            last_name: '',
            name: 'Unknown Photographer',
            avatar: undefined
          }
        };
      }) as RecentBooking[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useTopPhotographers Hook
 * Fetches top performing photographers
 */
export function useTopPhotographers() {
  return useQuery<TopPhotographer[], Error>({
    queryKey: ['dashboard', 'top-photographers'],
    queryFn: async () => {
      const response = await api.get<TopPhotographer[]>('/admin/dashboard/top-photographers');
      return extractData(response) as TopPhotographer[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

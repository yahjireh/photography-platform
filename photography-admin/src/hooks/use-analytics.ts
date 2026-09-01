/**
 * Analytics Hooks
 * Comprehensive analytics data for admin dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api, extractData, adminAPI } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';

// ============================================
// TYPES
// ============================================

export interface AnalyticsMetric {
  value: number;
  change: number;
  previousValue: number;
}

export interface AnalyticsData {
  timeRange: {
    value: string;
    startDate: string;
    endDate: string;
    days: number;
  };
  metrics: {
    revenue: AnalyticsMetric;
    bookings: AnalyticsMetric;
    photographers: AnalyticsMetric;
    users: AnalyticsMetric;
    completionRate: AnalyticsMetric;
  };
  charts: {
    revenueOverTime: Array<{
      date: string;
      total: number;
    }>;
    revenueByOccasion: Array<{
      occasion: string;
      total: number;
    }>;
    bookingsByStatus: Array<{
      status: string;
      count: number;
    }>;
  };
  topPhotographers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    booking_count: number;
    total_revenue: number;
    avg_rating: number | null;
  }>;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    activePhotographers: number;
    platformUsers: number;
    completionRate: number;
  };
}

// Legacy interface for backward compatibility
export interface AnalyticsOverview {
  totalRevenue: number;
  totalBookings: number;
  activePhotographers: number;
  platformUsers: number;
  completionRate: number;
}

// ============================================
// HOOKS
// ============================================

/**
 * Comprehensive analytics data with trends and charts
 */
export function useAnalytics(
  timeRange: string = '30d',
) {
  return useQuery<AnalyticsData, Error>({
    queryKey: [...QUERY_KEYS.ANALYTICS_OVERVIEW, timeRange, 'comprehensive'],
    queryFn: async () => {
      const response = await adminAPI.get<AnalyticsData>(`/analytics/overview?timeRange=${timeRange}`);
      return extractData(response) as AnalyticsData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Legacy hook - returns simple analytics overview
 * Kept for backward compatibility
 */
export function useAnalyticsOverview(
  timeRange: string = '30d',
) {
  return useQuery<AnalyticsOverview, Error>({
    queryKey: [...QUERY_KEYS.ANALYTICS_OVERVIEW, timeRange],
    queryFn: async () => {
      const response = await api.get<AnalyticsOverview>(`/admin/analytics/overview?timeRange=${timeRange}`);
      return extractData(response) as AnalyticsOverview;
    },
    staleTime: 5 * 60 * 1000,
  });
}

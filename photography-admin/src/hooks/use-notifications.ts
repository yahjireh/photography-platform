/**
 * Notifications Hook
 * React Query hooks for fetching and managing admin notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export type NotificationCategory = 'DISPUTE' | 'KYC' | 'USER' | 'BOOKING' | 'PAYMENT' | 'REVIEW';

export interface Notification {
  id: string;
  category?: NotificationCategory;
  type: 'NEW_BOOKING' | 'PAYMENT_RECEIVED' | 'NEW_REVIEW' | 'DISPUTE_OPENED' | 'VERIFICATION_REQUEST' | 'NEW_USER' | string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  categoryCounts?: Record<string, number>;
}

// ============================================
// QUERY KEYS
// ============================================

export const notificationKeys = {
  all: ['admin', 'notifications'] as const,
  list: (params?: { unreadOnly?: boolean }) => [...notificationKeys.all, 'list', params] as const,
};

// ============================================
// API FUNCTIONS
// ============================================

async function fetchNotifications(params?: { unreadOnly?: boolean }): Promise<NotificationsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.unreadOnly) {
    queryParams.append('unreadOnly', 'true');
  }

  const response = await adminAPI.get(`/notifications?${queryParams.toString()}`);
  return (response.data.data || response.data) as NotificationsResponse;
}

async function markAsRead(notificationId: string): Promise<void> {
  await adminAPI.patch(`/notifications/${notificationId}/read`);
}

async function markAllAsRead(): Promise<void> {
  await adminAPI.patch('/notifications/read-all');
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch all notifications (polls every 15s or updates via WebSocket)
 */
export function useNotifications(params?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
}

/**
 * Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

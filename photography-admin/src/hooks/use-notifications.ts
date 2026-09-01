/**
 * Notifications Hook
 * React Query hooks for fetching and managing admin notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string;
  type: 'NEW_BOOKING' | 'PAYMENT_RECEIVED' | 'NEW_REVIEW' | 'DISPUTE_OPENED' | 'VERIFICATION_REQUEST';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ============================================
// QUERY KEYS
// ============================================

export const notificationKeys = {
  all: ['notifications'] as const,
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

// ============================================
// HOOKS
// ============================================

/**
 * Fetch all notifications
 */
export function useNotifications(params?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    refetchInterval: 30000, // Refetch every 30 seconds
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
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

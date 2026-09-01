'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export type BulkActionType =
  | 'suspend'
  | 'unsuspend'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'verify'
  | 'send_email'
  | 'send_notification'
  | 'export';

export type BulkEntityType = 'users' | 'photographers' | 'bookings' | 'reviews' | 'disputes';

interface BulkActionResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Hook for managing selection state across a table/list
 */
export function useSelectionState<T extends string = string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const toggleAll = useCallback(
    (allIds: T[]) => {
      if (selectedIds.size === allIds.length) {
        deselectAll();
      } else {
        selectAll(allIds);
      }
    },
    [selectedIds, selectAll, deselectAll]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    toggleAll,
    hasSelection: selectedIds.size > 0,
    selectedArray: Array.from(selectedIds),
  };
}

/**
 * Hook for executing bulk actions against the API
 */
export function useBulkAction(entityType: BulkEntityType) {
  const queryClient = useQueryClient();

  // Map entity types to their query keys for invalidation
  const queryKeyMap: Record<BulkEntityType, readonly string[]> = {
    users: QUERY_KEYS.USERS,
    photographers: QUERY_KEYS.PHOTOGRAPHERS,
    bookings: QUERY_KEYS.BOOKINGS,
    reviews: QUERY_KEYS.REVIEWS,
    disputes: QUERY_KEYS.DISPUTES,
  };

  return useMutation<
    BulkActionResult,
    Error,
    { action: BulkActionType; ids: string[]; reason?: string; metadata?: Record<string, unknown> }
  >({
    mutationFn: async ({ action, ids, reason, metadata }) => {
      const response = await api.post<BulkActionResult>(`/admin/${entityType}/bulk`, {
        action,
        ids,
        reason,
        ...metadata,
      });
      return response.data.data || { total: ids.length, succeeded: ids.length, failed: 0, errors: [] };
    },
    onSuccess: (result, { action }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: queryKeyMap[entityType] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

      if (result.failed > 0) {
        toast.success(
          `Bulk ${action}: ${result.succeeded}/${result.total} succeeded, ${result.failed} failed`
        );
      } else {
        toast.success(`Bulk ${action} completed: ${result.succeeded} items processed`);
      }
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

/**
 * Convenience hook: Bulk suspend users
 */
export function useBulkSuspendUsers() {
  const bulk = useBulkAction('users');

  return {
    ...bulk,
    suspend: (ids: string[], reason?: string) =>
      bulk.mutate({ action: 'suspend', ids, reason }),
    unsuspend: (ids: string[]) =>
      bulk.mutate({ action: 'unsuspend', ids }),
  };
}

/**
 * Convenience hook: Bulk delete users
 */
export function useBulkDeleteUsers() {
  const bulk = useBulkAction('users');

  return {
    ...bulk,
    deleteUsers: (ids: string[]) =>
      bulk.mutate({ action: 'delete', ids }),
  };
}

/**
 * Convenience hook: Bulk approve/reject photographers
 */
export function useBulkVerifyPhotographers() {
  const bulk = useBulkAction('photographers');

  return {
    ...bulk,
    approve: (ids: string[]) =>
      bulk.mutate({ action: 'approve', ids }),
    reject: (ids: string[], reason?: string) =>
      bulk.mutate({ action: 'reject', ids, reason }),
  };
}

/**
 * Convenience hook: Bulk moderate reviews
 */
export function useBulkModerateReviews() {
  const bulk = useBulkAction('reviews');

  return {
    ...bulk,
    approve: (ids: string[]) =>
      bulk.mutate({ action: 'approve', ids }),
    reject: (ids: string[], reason?: string) =>
      bulk.mutate({ action: 'reject', ids, reason }),
    deleteReviews: (ids: string[]) =>
      bulk.mutate({ action: 'delete', ids }),
  };
}

/**
 * Reusable bulk action bar component props
 */
export interface BulkActionBarProps {
  selectedCount: number;
  onDeselectAll: () => void;
  entityType: BulkEntityType;
  actions: Array<{
    label: string;
    action: BulkActionType;
    variant: 'default' | 'danger' | 'warning' | 'success';
    requireConfirmation?: boolean;
    confirmMessage?: string;
  }>;
  onAction: (action: BulkActionType) => void;
  isPending: boolean;
}

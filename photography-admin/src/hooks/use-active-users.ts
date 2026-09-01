/**
 * Active Users Hooks
 * Hooks for fetching recently active users
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI, extractData } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';

// ============================================
// TYPES
// ============================================

export interface ActiveUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  updatedAt: string;
}

export interface ActiveUsersResponse {
  users: ActiveUser[];
  totalActive: number;
}

// ============================================
// HOOKS
// ============================================

/**
 * Get recently active users (last 7 days)
 */
export function useActiveUsers() {
  return useQuery<ActiveUsersResponse, Error>({
    queryKey: QUERY_KEYS.ACTIVE_USERS,
    queryFn: async () => {
      const response = await adminAPI.get<ActiveUsersResponse>('/active-users');
      return extractData(response) as ActiveUsersResponse;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Admin Profile Hook
 * React Query hooks for fetching and updating admin user profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, extractData } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface AdminProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_image_url: string | null;
  location_city?: string | null;
  location_country?: string | null;
  user_type: 'ADMIN' | 'CLIENT' | 'PHOTOGRAPHER';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_image_url?: string | null;
}

// ============================================
// QUERY KEYS
// ============================================

export const adminProfileKeys = {
  all: ['admin-profile'] as const,
  detail: () => [...adminProfileKeys.all, 'detail'] as const,
};

// ============================================
// API FUNCTIONS
// ============================================

async function fetchAdminProfile(): Promise<AdminProfile> {
  const response = await adminAPI.get<AdminProfile>('/profile');
  return extractData(response);
}

async function updateProfile(data: UpdateProfileData): Promise<AdminProfile> {
  const response = await adminAPI.patch<AdminProfile>('/profile', data);
  return extractData(response);
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch current admin user profile
 */
export function useAdminProfile() {
  return useQuery({
    queryKey: adminProfileKeys.detail(),
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update admin profile
 */
export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update the cached profile data
      queryClient.setQueryData(adminProfileKeys.detail(), data);
    },
  });
}

/**
 * Get admin full name
 */
export function useAdminFullName() {
  const { data: profile } = useAdminProfile();
  if (!profile) return 'Admin';
  return `${profile.first_name} ${profile.last_name}`.trim() || 'Admin';
}

/**
 * Get admin initials
 */
export function useAdminInitials() {
  const { data: profile } = useAdminProfile();
  if (!profile) return 'AD';
  const firstInitial = profile.first_name?.[0] || '';
  const lastInitial = profile.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'AD';
}

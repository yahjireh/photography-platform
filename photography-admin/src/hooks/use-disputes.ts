/**
 * Disputes Hooks
 * Hooks for managing disputes and resolutions
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, extractData, extractPaginatedData, handleApiError } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface DisputeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  profileImageUrl?: string | null;
}

export interface DisputeBooking {
  id: string;
  bookingNumber: string;
  occasionType: string;
  eventDate: string;
  totalAmount: number;
  status: string;
}

export interface DisputeEvidence {
  id: string;
  fileType: 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  fileName: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  uploaderName: string;
  uploaderType: string;
  uploadedAt: string;
}

export interface DisputeResponse {
  id: string;
  responderType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  responderName: string;
  message: string;
  createdAt: string;
}

export interface DisputeTimelineItem {
  id: string;
  type: 'CREATED' | 'RESPONSE_ADDED' | 'EVIDENCE_ADDED' | 'STATUS_CHANGED' | 'RESOLVED' | 'CLOSED';
  description: string;
  actor: string;
  timestamp: string;
}

export interface DisputeParty {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  locationCity?: string;
  locationCountry?: string;
  is_verified?: boolean;
}

export interface Dispute {
  id: string;
  bookingId: string;
  raisedById: string;
  raisedAgainstId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  priority: string;
  evidenceUrls?: any;
  evidence: DisputeEvidence[];
  responses: DisputeResponse[];
  timeline: DisputeTimelineItem[];
  adminNotes?: string | null;
  resolution?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  bookings: DisputeBooking;
  booking: DisputeBooking & { eventLocation?: string };
  client: DisputeParty;
  photographer: DisputeParty;
  // Raw Prisma relation names (kept for backward compatibility)
  usersDisputesRaisedByIdTousers: DisputeUser;
  usersDisputesRaisedAgainstIdTousers: DisputeUser;
  usersDisputesResolvedByIdTousers?: DisputeUser | null;
  // Computed clean fields (added by transformation)
  raisedBy?: DisputeUser & { name: string };
  raisedAgainst?: DisputeUser & { name: string };
  resolvedBy?: DisputeUser & { name: string };
}

export interface DisputesFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

export interface DisputesResponse {
  disputes: Dispute[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ResolveDisputeData {
  resolution: string;
  status: 'RESOLVED' | 'CLOSED';
  adminNotes?: string;
}

export interface UpdateDisputeData {
  priority?: string;
  adminNotes?: string;
  status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
}

// ============================================
// HOOKS
// ============================================

/**
 * Get all disputes with filtering and pagination
 */
export function useDisputes(
  filters?: DisputesFilters,
) {
  const queryParams = new URLSearchParams();

  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.priority) queryParams.append('priority', filters.priority);
  if (filters?.search) queryParams.append('search', filters.search);

  const queryString = queryParams.toString();
  const url = `/disputes${queryString ? `?${queryString}` : ''}`;

  return useQuery<DisputesResponse, Error>({
    queryKey: [...QUERY_KEYS.DISPUTES, filters],
    queryFn: async () => {
      const response = await adminAPI.get<any>(url);
      const data = extractPaginatedData(response);

      // Transform disputes data: convert string amounts and add computed fields
      const transformedDisputes = data.disputes?.map((dispute: any) => ({
        ...dispute,
        bookings: dispute.bookings ? {
          ...dispute.bookings,
          totalAmount: parseFloat(dispute.bookings.totalAmount) || 0,
        } : undefined,
        raisedBy: dispute.usersDisputesRaisedByIdTousers ? {
          ...dispute.usersDisputesRaisedByIdTousers,
          name: `${dispute.usersDisputesRaisedByIdTousers.firstName || ''} ${dispute.usersDisputesRaisedByIdTousers.lastName || ''}`.trim(),
        } : undefined,
        raisedAgainst: dispute.usersDisputesRaisedAgainstIdTousers ? {
          ...dispute.usersDisputesRaisedAgainstIdTousers,
          name: `${dispute.usersDisputesRaisedAgainstIdTousers.firstName || ''} ${dispute.usersDisputesRaisedAgainstIdTousers.lastName || ''}`.trim(),
        } : undefined,
        resolvedBy: dispute.usersDisputesResolvedByIdTousers ? {
          ...dispute.usersDisputesResolvedByIdTousers,
          name: `${dispute.usersDisputesResolvedByIdTousers.firstName || ''} ${dispute.usersDisputesResolvedByIdTousers.lastName || ''}`.trim(),
        } : undefined,
      })) || [];

      return {
        disputes: transformedDisputes,
        pagination: data.pagination,
      } as DisputesResponse;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

/**
 * Get dispute by ID
 */
export function useDispute(
  id: string,
) {
  return useQuery<Dispute, Error>({
    queryKey: QUERY_KEYS.DISPUTE_DETAIL(id),
    queryFn: async () => {
      const response = await adminAPI.get<any>(`/disputes/${id}`);
      const dispute = extractData(response);

      // Transform dispute data: convert string amounts and add computed fields
      return {
        ...dispute,
        bookings: dispute.bookings ? {
          ...dispute.bookings,
          totalAmount: parseFloat(dispute.bookings.totalAmount) || 0,
        } : undefined,
        raisedBy: dispute.usersDisputesRaisedByIdTousers ? {
          ...dispute.usersDisputesRaisedByIdTousers,
          name: `${dispute.usersDisputesRaisedByIdTousers.firstName || ''} ${dispute.usersDisputesRaisedByIdTousers.lastName || ''}`.trim(),
        } : undefined,
        raisedAgainst: dispute.usersDisputesRaisedAgainstIdTousers ? {
          ...dispute.usersDisputesRaisedAgainstIdTousers,
          name: `${dispute.usersDisputesRaisedAgainstIdTousers.firstName || ''} ${dispute.usersDisputesRaisedAgainstIdTousers.lastName || ''}`.trim(),
        } : undefined,
        resolvedBy: dispute.usersDisputesResolvedByIdTousers ? {
          ...dispute.usersDisputesResolvedByIdTousers,
          name: `${dispute.usersDisputesResolvedByIdTousers.firstName || ''} ${dispute.usersDisputesResolvedByIdTousers.lastName || ''}`.trim(),
        } : undefined,
      } as Dispute;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Resolve a dispute
 */
export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation<Dispute, Error, { id: string; data: ResolveDisputeData }>({
    mutationFn: async ({ id, data }) => {
      const response = await adminAPI.patch<Dispute>(`/disputes/${id}/resolve`, data);
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      // Invalidate disputes list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISPUTES });

      // Update specific dispute cache
      queryClient.setQueryData(QUERY_KEYS.DISPUTE_DETAIL(variables.id), data);

      // Invalidate dashboard stats (affects open disputes count)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

      toast.success('Dispute resolved successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Update dispute (priority, notes, status)
 */
export function useUpdateDispute() {
  const queryClient = useQueryClient();

  return useMutation<Dispute, Error, { id: string; data: UpdateDisputeData }>({
    mutationFn: async ({ id, data }) => {
      const response = await adminAPI.patch<Dispute>(`/disputes/${id}`, data);
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      // Invalidate disputes list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISPUTES });

      // Update specific dispute cache
      queryClient.setQueryData(QUERY_KEYS.DISPUTE_DETAIL(variables.id), data);

      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

      toast.success('Dispute updated successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Helper hook to get dispute statistics
 */
export function useDisputeStats() {
  const { data } = useDisputes({ limit: 1 });

  return {
    totalDisputes: data?.pagination.total || 0,
  };
}

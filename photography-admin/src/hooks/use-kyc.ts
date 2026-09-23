/**
 * KYC Verification Hooks
 * Hooks for managing photographer KYC verification
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData, handleApiError } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

// ============================================
// TYPES & ENUMS
// ============================================

export type KYCStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO' | 'SUSPENDED';
export type IDType = 'GHANA_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';
export type CheckResult = 'PASS' | 'FAIL' | 'UNCLEAR';
export type PayoutMethod = 'BANK' | 'MOMO';
export type MomoNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
export type NameMatch = 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
export type PortfolioQuality = 'GOOD' | 'BORDERLINE' | 'POOR';
export type OriginalityFlag = 'ORIGINAL' | 'SUSPECTED_STOLEN' | 'UNCLEAR';
export type YearsExperience = 'ZERO_ONE' | 'TWO_FOUR' | 'FIVE_NINE' | 'TEN_PLUS';
export type PhotoCategory = 'WEDDING' | 'PORTRAIT' | 'EVENTS' | 'FASHION' | 'PRODUCT' | 'REAL_ESTATE' | 'DOCUMENTARY' | 'MOBILE_PHOTOGRAPHY' | 'PHOTOJOURNALISM' | 'VIDEOGRAPHY' | 'OTHER';
export type ReasonCode =
  | 'ID_NOT_CLEAR'
  | 'ID_EXPIRED'
  | 'NAME_MISMATCH'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_PAYOUT_DETAILS'
  | 'PORTFOLIO_INSUFFICIENT'
  | 'PORTFOLIO_SUSPECTED_STOLEN'
  | 'PAYMENT_DETAILS_INCOMPLETE'
  | 'PAYMENT_NAME_MISMATCH'
  | 'POLICY_VIOLATION'
  | 'OTHER';

export type RequestInfoItem =
  | 'ID_NOT_CLEAR'
  | 'ID_EXPIRED'
  | 'SELFIE_MISSING'
  | 'PORTFOLIO_TOO_SMALL'
  | 'PORTFOLIO_UNCLEAR'
  | 'PAYMENT_NAME_MISMATCH'
  | 'PAYMENT_DETAILS_INCOMPLETE'
  | 'OTHER';

export interface KYCDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  uploaded_at: string;
}

export interface KYCAuditEvent {
  id: string;
  event_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  admin_user_id: string;
  admin_name: string;
  action_notes?: string;
  created_at: string;
}

export interface PhotographerKYC {
  id: string;
  photographer_id: string;
  user_id: string;

  // Status
  kyc_status: KYCStatus;
  submitted_at?: string;
  last_updated_at: string;
  approved_at?: string;
  rejected_at?: string;

  // Identity
  identity: {
    legal_name: string;
    date_of_birth: string;
    age: number;
    nationality: string;
    id_type: IDType;
    id_number: string;
    identity_check_result?: CheckResult;
    identity_fail_reason_code?: ReasonCode;
    identity_notes?: string;
  };

  // Contact
  contact: {
    email: string;
    email_verified: boolean;
    phone: string;
    phone_verified: boolean;
    city?: string;
    region?: string;
    service_area?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    contact_check_result?: CheckResult;
    contact_notes?: string;
  };

  // Portfolio
  portfolio: {
    categories: PhotoCategory[];
    years_experience?: YearsExperience;
    portfolio_link?: string;
    portfolio_check_result?: CheckResult;
    portfolio_quality?: PortfolioQuality;
    originality_flag?: OriginalityFlag;
    portfolio_notes?: string;
  };

  // Payment
  payment: {
    payout_method: PayoutMethod;
    account_holder_name: string;
    bank_name?: string;
    bank_account_number?: string;
    momo_network?: MomoNetwork;
    momo_number?: string;
    payout_name_match: NameMatch;
    payout_check_result?: CheckResult;
    payout_notes?: string;
  };

  // Access Controls
  access_controls: {
    is_search_visible: boolean;
    can_accept_bookings: boolean;
    can_receive_payouts: boolean;
    kyc_verified_badge: boolean;
  };

  // Decision
  decision_reason_code?: ReasonCode;
  decision_notes?: string;
  request_info_items?: RequestInfoItem[];
  reviewed_by?: string;
  reviewed_at?: string;

  // Related Data
  documents: KYCDocument[];
  packages?: any[];
  photographer: {
    id: string;
    display_name: string;
    business_name: string;
  };
  audit_timeline: KYCAuditEvent[];
}

export interface KYCDecisionPayload {
  action: 'approve' | 'reject' | 'request_more_info' | 'suspend';
  decision_reason_code?: ReasonCode;
  decision_notes: string;
  request_info_items?: RequestInfoItem[];
  access_controls?: {
    is_search_visible?: boolean;
    can_accept_bookings?: boolean;
    can_receive_payouts?: boolean;
    kyc_verified_badge?: boolean;
  };
}

export interface UpdateKYCReviewPayload {
  section: 'identity' | 'contact' | 'portfolio' | 'payment';
  check_result?: CheckResult;
  notes?: string;
  [key: string]: any;
}

// ============================================
// HOOKS
// ============================================

/**
 * Get KYC details by photographer ID
 */
export function usePhotographerKYC(
  photographerId: string,
) {
  return useQuery<PhotographerKYC, Error>({
    queryKey: ['photographer-kyc', photographerId],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/photographers/${photographerId}/kyc`);
      return extractData(response) as PhotographerKYC;
    },
    enabled: !!photographerId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get all pending KYC submissions
 */
export function usePendingKYCSubmissions() {
  return useQuery<PhotographerKYC[], Error>({
    queryKey: ['kyc-pending'],
    queryFn: async () => {
      const response = await api.get<any>('/admin/kyc/pending');
      return extractData(response) as PhotographerKYC[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

/**
 * Update KYC review section
 */
export function useUpdateKYCReview() {
  const queryClient = useQueryClient();

  return useMutation<PhotographerKYC, Error, { photographerId: string; data: UpdateKYCReviewPayload }>({
    mutationFn: async ({ photographerId, data }) => {
      const response = await api.patch<PhotographerKYC>(
        `/admin/photographers/${photographerId}/kyc/review`,
        data
      );
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-kyc', variables.photographerId] });
      queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });

      toast.success('KYC review updated');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error('Failed to update review', {
        description: message,
      });
    },
  });
}

/**
 * Make KYC decision (approve, reject, request more info, suspend)
 */
export function useKYCDecision() {
  const queryClient = useQueryClient();

  return useMutation<PhotographerKYC, Error, { photographerId: string; decision: KYCDecisionPayload }>({
    mutationFn: async ({ photographerId, decision }) => {
      const response = await api.post<PhotographerKYC>(
        `/admin/photographers/${photographerId}/kyc/decision`,
        decision
      );
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-kyc', variables.photographerId] });
      queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOGRAPHERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

      const actionText = {
        approve: 'approved',
        reject: 'rejected',
        request_more_info: 'marked for more information',
        suspend: 'suspended',
      }[variables.decision.action];

      toast.success(`KYC ${actionText}`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error('Failed to process decision', {
        description: message,
      });
    },
  });
}

/**
 * Update access controls
 */
export function useUpdateKYCAccessControls() {
  const queryClient = useQueryClient();

  return useMutation<PhotographerKYC, Error, {
    photographerId: string;
    controls: {
      is_search_visible?: boolean;
      can_accept_bookings?: boolean;
      can_receive_payouts?: boolean;
      kyc_verified_badge?: boolean;
    };
  }>({
    mutationFn: async ({ photographerId, controls }) => {
      const response = await api.patch<PhotographerKYC>(
        `/admin/photographers/${photographerId}/kyc/access-controls`,
        controls
      );
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-kyc', variables.photographerId] });

      toast.success('Access controls updated');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error('Failed to update access controls', {
        description: message,
      });
    },
  });
}

/**
 * Verify/reject a document
 */
export function useVerifyKYCDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, {
    photographerId: string;
    documentId: string;
    verified: boolean;
    rejectionReason?: string;
  }>({
    mutationFn: async ({ photographerId, documentId, verified, rejectionReason }) => {
      await api.patch(
        `/admin/photographers/${photographerId}/kyc/documents/${documentId}`,
        { verified, rejection_reason: rejectionReason }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-kyc', variables.photographerId] });

      toast.success(variables.verified ? 'Document verified' : 'Document rejected');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error('Failed to update document', {
        description: message,
      });
    },
  });
}

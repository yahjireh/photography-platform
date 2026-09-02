/**
 * Payment Management Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api, extractPaginatedData, extractData, PaginatedResponse, handleApiError } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  stage: 'DEPOSIT' | 'BALANCE';
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
  paystackReference?: string;
  createdAt: string;
  releaseApproved?: boolean;
  releasedAt?: string;
  approvedBy?: string;
  booking: {
    id: string;
    bookingNumber: string;
    occasionType: string;
    client: {
      id: string;
      fullName: string;
      email: string;
    };
    photographer: {
      id: string;
      businessName: string;
    };
  };
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  stage?: string;
}

interface PaymentsQueryResult {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function usePayments(
  filters?: PaymentFilters,
) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.stage) queryParams.append('stage', filters.stage);

  return useQuery<PaymentsQueryResult, Error>({
    queryKey: [...QUERY_KEYS.PAYMENTS, filters],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/payments?${queryParams.toString()}`);
      const rawData = extractPaginatedData(response);

      // Transform payments data
      const transformedPayments = rawData.payments?.map((payment: any) => {
        const bookingRelation = payment.bookings;
        const clientRelation = bookingRelation?.users_bookings_client_idTousers;
        const photographerRelation = bookingRelation?.users_bookings_photographer_idTousers;

        return {
          id: payment.id,
          bookingId: payment.booking_id,
          amount: parseFloat(payment.amount) || 0,
          stage: payment.payment_stage,
          status: payment.status,
          paystackReference: payment.paystack_reference,
          createdAt: payment.created_at,
          booking: bookingRelation ? {
            id: bookingRelation.id,
            bookingNumber: bookingRelation.booking_number,
            occasionType: bookingRelation.occasion_type,
            client: clientRelation ? {
              id: clientRelation.id,
              fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
              email: clientRelation.email,
            } : {
              id: '',
              fullName: 'Unknown',
              email: '',
            },
            photographer: photographerRelation ? {
              id: photographerRelation.id,
              businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
            } : {
              id: '',
              businessName: 'Unknown Photographer',
            },
          } : undefined,
        };
      }) || [];

      return {
        payments: transformedPayments,
        pagination: rawData.pagination,
      } as PaymentsQueryResult;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

export function usePayment(
  paymentId: string,
) {
  return useQuery<Payment, Error>({
    queryKey: QUERY_KEYS.PAYMENT_DETAIL(paymentId),
    queryFn: async () => {
      const response = await api.get<any>(`/admin/payments/${paymentId}`);
      const payment = extractData(response);

      // Transform payment data
      const bookingRelation = payment.bookings;
      const clientRelation = bookingRelation?.users_bookings_client_idTousers;
      const photographerRelation = bookingRelation?.users_bookings_photographer_idTousers;

      return {
        id: payment.id,
        bookingId: payment.booking_id,
        amount: parseFloat(payment.amount) || 0,
        stage: payment.payment_stage,
        status: payment.status,
        paystackReference: payment.paystack_reference,
        createdAt: payment.created_at,
        booking: bookingRelation ? {
          id: bookingRelation.id,
          bookingNumber: bookingRelation.booking_number,
          occasionType: bookingRelation.occasion_type,
          client: clientRelation ? {
            id: clientRelation.id,
            fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
            email: clientRelation.email,
          } : {
            id: '',
            fullName: 'Unknown',
            email: '',
          },
          photographer: photographerRelation ? {
            id: photographerRelation.id,
            businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
          } : {
            id: '',
            businessName: 'Unknown Photographer',
          },
        } : undefined,
      } as Payment;
    },
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Approve payment release to photographer
 * - DEPOSIT stage: Released when photographer shows up
 * - BALANCE stage: Released after photos are delivered
 */
export function useApprovePaymentRelease() {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, { paymentId: string; stage: 'DEPOSIT' | 'BALANCE' }>(
    {
      mutationFn: async ({ paymentId, stage }) => {
        const response = await api.post<Payment>(`/admin/payments/${paymentId}/approve-release`, { stage });
        return extractData(response);
      },
      onSuccess: (data, variables) => {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT_DETAIL(variables.paymentId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });

        const stageText = variables.stage === 'DEPOSIT' ? 'initial deposit' : 'balance';
        toast.success(`${stageText} payment release approved`, {
          description: `Funds will be released to the photographer's account.`,
        });
      },
      onError: (error) => {
        const message = handleApiError(error);
        toast.error('Failed to approve payment release', {
          description: message,
        });
      },
    }
  );
}

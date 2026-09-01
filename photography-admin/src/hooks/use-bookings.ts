/**
 * Booking Management Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { api, extractPaginatedData, extractData, handleApiError, ApiResponse, PaginatedResponse } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  occasionType: string;
  eventDate: string;
  eventDuration: number;
  eventLocation: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  specialRequests?: string;
  createdAt: string;
  depositPaid?: boolean;
  fullPaymentPaid?: boolean;
  balancePaid?: boolean;
  clientConfirmedArrivalAt?: string | null;
  workDeliveryStatus?: string | null;
  accessPin?: string | null;
  deliveryUrl?: string | null;
  deliveryNotes?: string | null;
  client: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  photographer: {
    id: string;
    businessName: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  contractUrl?: string;
  payments?: any[];
  photos?: any[];
  messages?: any[];
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  occasionType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useBookings(
  filters?: BookingFilters,
) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.occasionType) queryParams.append('occasionType', filters.occasionType);
  if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

  return useQuery<PaginatedResponse<Booking>['data'], Error>({
    queryKey: [...QUERY_KEYS.BOOKINGS, filters],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/bookings?${queryParams.toString()}`);
      const rawData = extractPaginatedData(response);

      // Transform bookings data: backend uses snake_case and Prisma relation names
      const transformedBookings = rawData.bookings?.map((booking: any) => {
        const clientRelation = booking.users_bookings_client_idTousers;
        const photographerRelation = booking.users_bookings_photographer_idTousers;

        return {
          id: booking.id,
          bookingNumber: booking.booking_number,
          status: booking.status,
          occasionType: booking.occasion_type,
          eventDate: booking.event_date,
          eventDuration: booking.estimated_hours || 0,
          eventLocation: booking.event_location,
          // Convert string amounts to numbers
          totalAmount: parseFloat(booking.total_amount) || 0,
          depositAmount: parseFloat(booking.deposit_amount) || 0,
          remainingAmount: parseFloat(booking.balance_amount) || 0,
          specialRequests: booking.special_requirements,
          depositPaid: booking.deposit_paid,
          fullPaymentPaid: booking.full_payment_paid,
          balancePaid: booking.balance_paid,
          clientConfirmedArrivalAt: booking.client_confirmed_arrival_at,
          workDeliveryStatus: booking.work_delivery_status,
          accessPin: booking.access_pin,
          deliveryUrl: booking.delivery_url,
          deliveryNotes: booking.delivery_notes,
          createdAt: booking.created_at,
          client: clientRelation ? {
            id: clientRelation.id,
            fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
            email: clientRelation.email,
            avatarUrl: clientRelation.profile_image_url || undefined,
          } : {
            id: '',
            fullName: 'Unknown',
            email: '',
          },
          photographer: photographerRelation ? {
            id: photographerRelation.id,
            businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
            user: {
              id: photographerRelation.id,
              fullName: `${photographerRelation.first_name || ''} ${photographerRelation.last_name || ''}`.trim(),
              email: photographerRelation.email,
            },
          } : {
            id: '',
            businessName: 'Unknown Photographer',
          },
          payments: booking.payments,
          photos: booking.photos,
          messages: booking.messages,
        };
      }) || [];

      return {
        bookings: transformedBookings,
        pagination: rawData.pagination,
      } as PaginatedResponse<Booking>['data'];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

export function useBooking(
  bookingId: string,
) {
  return useQuery<Booking, Error>({
    queryKey: QUERY_KEYS.BOOKING_DETAIL(bookingId),
    queryFn: async () => {
      const response = await api.get<any>(`/admin/bookings/${bookingId}`);
      const booking = extractData(response);

      // Transform booking data
      const clientRelation = booking.users_bookings_client_idTousers;
      const photographerRelation = booking.users_bookings_photographer_idTousers;

      return {
        id: booking.id,
        bookingNumber: booking.booking_number,
        status: booking.status,
        occasionType: booking.occasion_type,
        eventDate: booking.event_date,
        eventDuration: booking.estimated_hours || 0,
        eventLocation: booking.event_location,
        totalAmount: parseFloat(booking.total_amount) || 0,
        depositAmount: parseFloat(booking.deposit_amount) || 0,
        remainingAmount: parseFloat(booking.balance_amount) || 0,
        specialRequests: booking.special_requirements,
        depositPaid: booking.deposit_paid,
        fullPaymentPaid: booking.full_payment_paid,
        balancePaid: booking.balance_paid,
        clientConfirmedArrivalAt: booking.client_confirmed_arrival_at,
        workDeliveryStatus: booking.work_delivery_status,
        accessPin: booking.access_pin,
        deliveryUrl: booking.delivery_url,
        deliveryNotes: booking.delivery_notes,
        createdAt: booking.created_at,
        client: clientRelation ? {
          id: clientRelation.id,
          fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
          email: clientRelation.email,
          avatarUrl: clientRelation.profile_image_url || undefined,
        } : {
          id: '',
          fullName: 'Unknown',
          email: '',
        },
        photographer: photographerRelation ? {
          id: photographerRelation.id,
          businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
          user: {
            id: photographerRelation.id,
            fullName: `${photographerRelation.first_name || ''} ${photographerRelation.last_name || ''}`.trim(),
            email: photographerRelation.email,
          },
        } : {
          id: '',
          businessName: 'Unknown Photographer',
        },
        payments: booking.payments,
        photos: booking.photos,
        messages: booking.messages,
      } as Booking;
    },
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateBookingStatus(
  options?: UseMutationOptions<ApiResponse<Booking>, Error, { bookingId: string; status: string; reason?: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status, reason }) => {
      const response = await api.patch<Booking>(`/admin/bookings/${bookingId}/status`, { status, reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKING_DETAIL(variables.bookingId) });

      toast.success('Booking status updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

export function useFlagBooking(
  options?: UseMutationOptions<ApiResponse<any>, Error, { bookingId: string; reason: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const response = await api.post<any>(`/admin/bookings/${bookingId}/flag`, { reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKING_DETAIL(variables.bookingId) });

      toast.success('Booking has been flagged for review');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

export function useConfirmDepositRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, notes }: { bookingId: string; notes?: string }) => {
      const response = await api.post<any>(`/admin/bookings/${bookingId}/confirm-deposit-release`, { notes });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKING_DETAIL(variables.bookingId) });
      toast.success('Escrow deposit released to photographer successfully!');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useVerifyDeliverables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, approved, notes }: { bookingId: string; approved: boolean; notes?: string }) => {
      const response = await api.post<any>(`/admin/bookings/${bookingId}/verify-deliverables`, { approved, notes });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKING_DETAIL(variables.bookingId) });
      toast.success('Deliverables verified & remaining balance released to photographer!');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

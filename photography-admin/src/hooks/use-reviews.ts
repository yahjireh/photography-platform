/**
 * Review Management Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { api, extractPaginatedData, extractData, handleApiError, ApiResponse, PaginatedResponse } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export interface Review {
  id: string;
  bookingId: string;
  photographerId: string;
  clientId: string;
  rating: number;
  comment?: string;
  hidden: boolean;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  photographer: {
    id: string;
    businessName: string;
  };
  booking: {
    id: string;
    bookingNumber: string;
    occasionType: string;
    eventDate?: string;
  };
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
  hidden?: boolean;
}

export function useReviews(
  filters?: ReviewFilters,
) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.rating) queryParams.append('rating', filters.rating.toString());
  if (filters?.hidden !== undefined) queryParams.append('hidden', filters.hidden.toString());

  return useQuery<PaginatedResponse<Review>['data'], Error>({
    queryKey: [...QUERY_KEYS.REVIEWS, filters],
    queryFn: async () => {
      const response = await api.get<any>(`/admin/reviews?${queryParams.toString()}`);
      const rawData = extractPaginatedData(response);

      // Transform reviews data
      const transformedReviews = rawData.reviews?.map((review: any) => {
        const clientRelation = review.users_reviews_reviewer_idTousers;
        const photographerRelation = review.users_reviews_reviewee_idTousers;
        const bookingRelation = review.bookings;

        return {
          id: review.id,
          bookingId: review.booking_id,
          photographerId: review.reviewee_id,
          clientId: review.reviewer_id,
          rating: review.rating,
          comment: review.comment,
          hidden: !review.is_visible,
          createdAt: review.created_at,
          client: clientRelation ? {
            id: clientRelation.id,
            fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
            avatarUrl: clientRelation.profile_image_url,
          } : {
            id: '',
            fullName: 'Unknown',
          },
          photographer: photographerRelation ? {
            id: photographerRelation.id,
            businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
          } : {
            id: '',
            businessName: 'Unknown Photographer',
          },
          booking: bookingRelation ? {
            id: bookingRelation.id,
            bookingNumber: bookingRelation.booking_number,
            occasionType: bookingRelation.occasion_type,
            eventDate: bookingRelation.event_date,
          } : undefined,
        };
      }) || [];

      return {
        reviews: transformedReviews,
        pagination: rawData.pagination,
      } as PaginatedResponse<Review>['data'];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
}

export function useReview(
  reviewId: string,
) {
  return useQuery<Review, Error>({
    queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId),
    queryFn: async () => {
      const response = await api.get<any>(`/admin/reviews/${reviewId}`);
      const review = extractData(response);

      // Transform review data
      const clientRelation = review.users_reviews_reviewer_idTousers;
      const photographerRelation = review.users_reviews_reviewee_idTousers;
      const bookingRelation = review.bookings;

      return {
        id: review.id,
        bookingId: review.booking_id,
        photographerId: review.reviewee_id,
        clientId: review.reviewer_id,
        rating: review.rating,
        comment: review.comment,
        hidden: !review.is_visible,
        createdAt: review.created_at,
        client: clientRelation ? {
          id: clientRelation.id,
          fullName: `${clientRelation.first_name || ''} ${clientRelation.last_name || ''}`.trim() || 'Unknown',
          avatarUrl: clientRelation.profile_image_url,
        } : {
          id: '',
          fullName: 'Unknown',
        },
        photographer: photographerRelation ? {
          id: photographerRelation.id,
          businessName: photographerRelation.business_name || `${photographerRelation.first_name} ${photographerRelation.last_name}`.trim(),
        } : {
          id: '',
          businessName: 'Unknown Photographer',
        },
        booking: bookingRelation ? {
          id: bookingRelation.id,
          bookingNumber: bookingRelation.booking_number,
          occasionType: bookingRelation.occasion_type,
          eventDate: bookingRelation.event_date,
        } : undefined,
      } as Review;
    },
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useModerateReview(
  options?: UseMutationOptions<ApiResponse<Review>, Error, { reviewId: string; action: 'hide' | 'show' | 'flag'; reason?: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, action, reason }) => {
      const response = await api.patch<Review>(`/admin/reviews/${reviewId}/moderate`, { action, reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW_DETAIL(variables.reviewId) });

      toast.success(`Review ${variables.action}ed successfully`);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

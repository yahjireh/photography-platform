import { useState, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Review } from '../types';

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPhotographerReviews = useCallback(async (photographerId: string): Promise<Review[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/reviews/photographer/${photographerId}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const mapped: Review[] = res.data.data.map((r: any) => {
          const user = r.users_reviews_reviewer_idTousers || r.users || r.reviewer || {};
          const name = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (r.userName || 'Verified Client');
          const avatar = user.profile_image_url || null;
          const timeStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

          return {
            id: r.id,
            photographerId: r.photographer_id || r.reviewee_id,
            userName: name,
            userImage: avatar,
            userAvatar: avatar,
            rating: Number(r.rating) || 5,
            comment: r.comment || '',
            timestamp: timeStr,
            date: timeStr
          };
        });
        setReviews(mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('Could not fetch reviews from API:', err.message);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  const submitReview = async (reviewData: {
    bookingId: string;
    photographerId: string;
    rating: number;
    comment: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/reviews', {
        bookingId: reviewData.bookingId,
        revieweeId: reviewData.photographerId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      if (res.data?.success) {
        return res.data.data;
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reviews,
    isLoading,
    error,
    getPhotographerReviews,
    submitReview
  };
};

export default useReviews;

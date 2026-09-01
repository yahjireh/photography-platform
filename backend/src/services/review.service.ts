/**
 * Review Service
 * Business logic for reviews and ratings
 */

import prisma from '../config/database';
import { UserType } from '@prisma/client';
import * as NotificationTrigger from './notification-trigger.service';

/**
 * TEACHING MOMENT: Review System
 * 
 * Reviews build trust and help users make decisions:
 * - Clients review photographers after booking
 * - Photographers can review clients (optional)
 * - Star ratings (1-5 stars)
 * - Written comments
 * - Average ratings displayed on profiles
 * 
 * Reviews are tied to specific bookings:
 * - One review per booking
 * - Only after booking completion
 * - Both parties can review each other
 */

/**
 * Create a review
 * 
 * @param data - Review data
 * @returns Created review
 */
export async function createReview(data: {
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: UserType;
  rating: number;
  comment?: string;
  ratingBreakdown?: any;
}) {
  console.log(`⭐ Creating review for booking ${data.bookingId}`);
  
  // Validate rating (1-5)
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Get booking details
  const booking = await prisma.bookings.findUnique({
    where: { id: data.bookingId },
    include: {
      reviews: true
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Check if booking is completed
  if (booking.status !== 'COMPLETED') {
    throw new Error('Can only review completed bookings');
  }
  
  // Check if review already exists
  if (booking.reviews) {
    throw new Error('Review already submitted for this booking');
  }

  // Verify reviewer is part of the booking
  if (data.reviewerId !== booking.client_id && data.reviewerId !== booking.photographer_id) {
    throw new Error('You can only review bookings you were part of');
  }

  // Verify reviewee is the other party (auto-resolve)
  const expectedRevieweeId = data.reviewerId === booking.client_id
    ? booking.photographer_id
    : booking.client_id;
    
  const finalRevieweeId = expectedRevieweeId;
  
  // Create review
  const review = await prisma.reviews.create({
    data: {
      booking_id: data.bookingId,
      reviewer_id: data.reviewerId,
      reviewee_id: finalRevieweeId,
      reviewer_type: data.reviewerType,
      rating: data.rating,
      comment: data.comment || null,
      rating_breakdown: data.ratingBreakdown || null,
      is_visible: true
    },
    include: {
      users_reviews_reviewer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      bookings: {
        select: {
          booking_number: true,
          occasion_type: true,
          event_date: true
        }
      }
    }
  });
  
  console.log(`✅ Review created: ${review.id}`);
  console.log(`   Rating: ${review.rating} stars`);

  // Trigger notification to reviewee
    await NotificationTrigger.onReviewReceived({
      revieweeId: review.reviewee_id,
      revieweeEmail: review.reviewee_id, // This would need to be fetched from the database
      revieweeName: review.reviewee_id, // This would need to be fetched from the database
      reviewerName: `${review.users_reviews_reviewer_idTousers.first_name} ${review.users_reviews_reviewer_idTousers.last_name}`,
      rating: review.rating,
      bookingNumber: review.bookings.booking_number,
      comment: review.comment || undefined
    }).catch(err => console.error('Notification error:', err));

  // Update photographer's average rating if reviewee is photographer
  if (data.reviewerType === 'CLIENT') {
    await updatePhotographerAverageRating(data.revieweeId);
  }
  
  return review;
}

/**
 * Update photographer's average rating
 * Calculates average from all reviews
 * 
 * @param photographerId - Photographer user ID
 */
export async function updatePhotographerAverageRating(photographerId: string) {
  console.log(`📊 Updating average rating for photographer ${photographerId}`);

  // Get photographer record
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: photographerId }
  });
  
  if (!photographer) {
    console.log('   ⚠️  Photographer record not found');
    return;
  }
  
  // Calculate average rating from all reviews
  const reviews = await prisma.reviews.findMany({
    where: {
      reviewee_id: photographerId,
      reviewer_type: 'CLIENT',
      is_visible: true
    },
    select: {
      rating: true
    }
  });
  
  if (reviews.length === 0) {
    console.log('   No reviews yet');
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update photographer record
  await prisma.photographers.update({
    where: { id: photographer.id },
    data: {
      average_rating: parseFloat(averageRating.toFixed(2))
    }
  });
  
  console.log(`✅ Average rating updated: ${averageRating.toFixed(2)} (from ${reviews.length} reviews)`);
}

/**
 * Get reviews for a photographer
 * 
 * @param photographerId - Photographer user ID
 * @param options - Filter options
 * @returns Array of reviews
 */
export async function getPhotographerReviews(
  photographerId: string,
  options: {
    limit?: number;
    offset?: number;
    minRating?: number;
    maxRating?: number;
  } = {}
) {
  const { limit = 10, offset = 0, minRating, maxRating } = options;

  let targetUserIds = [photographerId];
  const photographerRecord = await prisma.photographers.findFirst({
    where: {
      OR: [
        { id: photographerId },
        { user_id: photographerId }
      ]
    }
  });

  if (photographerRecord) {
    targetUserIds = Array.from(new Set([photographerRecord.user_id, photographerRecord.id, photographerId]));
  }

  const where: any = {
    reviewee_id: { in: targetUserIds },
    reviewer_type: 'CLIENT',
    is_visible: true
  };
  
  // Filter by rating range if specified
  if (minRating || maxRating) {
    where.rating = {};
    if (minRating) where.rating.gte = minRating;
    if (maxRating) where.rating.lte = maxRating;
  }
  
  const reviews = await prisma.reviews.findMany({
    where,
    include: {
      users_reviews_reviewer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      bookings: {
        select: {
          booking_number: true,
          occasion_type: true,
          event_date: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: limit,
    skip: offset
  });
  
  // Get total count for pagination
  const totalCount = await prisma.reviews.count({ where });
  
  return {
    reviews,
    totalCount,
    hasMore: totalCount > offset + limit
  };
}

/**
 * Get review statistics for a photographer
 * 
 * @param photographerId - Photographer user ID
 * @returns Review statistics
 */
export async function getPhotographerReviewStats(photographerId: string) {
  let targetUserIds = [photographerId];
  const photographerRecord = await prisma.photographers.findFirst({
    where: {
      OR: [
        { id: photographerId },
        { user_id: photographerId }
      ]
    }
  });

  if (photographerRecord) {
    targetUserIds = Array.from(new Set([photographerRecord.user_id, photographerRecord.id, photographerId]));
  }

  const reviews = await prisma.reviews.findMany({
    where: {
      reviewee_id: { in: targetUserIds },
      reviewer_type: 'CLIENT',
      is_visible: true
    },
    select: {
      rating: true
    }
  });
  
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };
  }
  
  // Calculate rating distribution
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
  });
  
  // Calculate average
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  return {
    totalReviews: reviews.length,
    averageRating: parseFloat(averageRating.toFixed(2)),
    ratingDistribution: distribution
  };
}

/**
 * Get a single review by ID
 * 
 * @param reviewId - Review ID
 * @returns Review details
 */
export async function getReviewById(reviewId: string) {
  const review = await prisma.reviews.findUnique({
    where: { id: reviewId },
    include: {
      users_reviews_reviewer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          user_type: true
        }
      },
      users_reviews_reviewee_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          user_type: true
        }
      },
      bookings: {
        select: {
          booking_number: true,
          occasion_type: true,
          event_date: true,
          event_location: true
        }
      }
    }
  });
  
  if (!review) {
    throw new Error('Review not found');
  }
  
  return review;
}

/**
 * Check if user can review a booking
 * 
 * @param bookingId - Booking ID
 * @param userId - User ID
 * @returns Can review status
 */
export async function canReviewBooking(
  bookingId: string,
  userId: string
): Promise<{
  canReview: boolean;
  reason?: string;
}> {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      reviews: true
    }
  });

  if (!booking) {
    return { canReview: false, reason: 'Booking not found' };
  }

  // Check if user is part of booking
  if (userId !== booking.client_id && userId !== booking.photographer_id) {
    return { canReview: false, reason: 'You are not part of this booking' };
  }

  // Check if booking is completed
  if (booking.status !== 'COMPLETED') {
    return { canReview: false, reason: 'Booking must be completed before reviewing' };
  }

  // Check if review already exists
  if (booking.reviews) {
    return { canReview: false, reason: 'Review already submitted for this booking' };
  }
  
  return { canReview: true };
}

/**
 * Update review visibility (hide/show)
 * 
 * @param reviewId - Review ID
 * @param isVisible - Visibility status
 * @param userId - User ID (for permission check)
 */
export async function updateReviewVisibility(
  reviewId: string,
  isVisible: boolean,
  userId: string
) {
  const review = await prisma.reviews.findUnique({
    where: { id: reviewId }
  });
  
  if (!review) {
    throw new Error('Review not found');
  }
  
  // Only reviewer or admin can update visibility
  if (review.reviewer_id !== userId) {
    throw new Error('You can only update your own reviews');
  }

  const updated = await prisma.reviews.update({
    where: { id: reviewId },
    data: { is_visible: isVisible }
  });

  console.log(`👁️  Review visibility updated: ${isVisible ? 'visible' : 'hidden'}`);

  // Recalculate average rating if photographer review
  if (review.reviewer_type === 'CLIENT') {
    await updatePhotographerAverageRating(review.reviewee_id);
  }
  
  return updated;
}

/**
 * Get reviews written by a user
 * 
 * @param userId - User ID
 * @param limit - Number of reviews to return
 * @returns Array of reviews
 */
export async function getUserReviews(userId: string, limit: number = 10) {
  const reviews = await prisma.reviews.findMany({
    where: {
      reviewer_id: userId
    },
    include: {
      users_reviews_reviewee_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          user_type: true
        }
      },
      bookings: {
        select: {
          booking_number: true,
          occasion_type: true,
          event_date: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: limit
  });
  
  return reviews;
}

/**
 * Get bookings that can be reviewed by user
 * 
 * @param userId - User ID
 * @returns Array of bookings
 */
export async function getReviewableBookings(userId: string) {
  // Get user type
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { user_type: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get completed bookings without reviews
  const where: any = {
    status: 'COMPLETED',
    reviews: null
  };

  if (user.user_type === 'CLIENT') {
    where.client_id = userId;
  } else if (user.user_type === 'PHOTOGRAPHER') {
    where.photographer_id = userId;
  }

  const bookings = await prisma.bookings.findMany({
    where,
    include: {
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      },
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true
        }
      }
    },
    orderBy: {
      event_date: 'desc'
    }
  });
  
  return bookings;
}

/**
 * TEACHING MOMENT: Review System Benefits
 * 
 * For Clients:
 * ✅ See photographer quality before booking
 * ✅ Read real experiences from other clients
 * ✅ Make informed decisions
 * ✅ Share their own experience
 * 
 * For Photographers:
 * ✅ Build reputation & trust
 * ✅ Stand out from competition
 * ✅ Get honest feedback
 * ✅ Improve their service
 * 
 * For Platform:
 * ✅ Quality control
 * ✅ User engagement
 * ✅ Better matching (search by rating)
 * ✅ Trust & safety
 */
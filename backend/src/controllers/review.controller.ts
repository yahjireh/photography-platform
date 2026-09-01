/**
 * Review Controller
 * HTTP handlers for reviews and ratings
 */

import { Request, Response } from 'express';
import * as ReviewService from '../services/review.service';
import { UserType } from '@prisma/client';

/**
 * Create a review
 * POST /api/reviews
 */
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewerId = req.user!.user_id;
    const reviewerType = req.user!.user_type as UserType;
    
    const { bookingId, revieweeId, rating, comment, ratingBreakdown } = req.body;
    
    // Validation
    if (!bookingId || !revieweeId || !rating) {
      res.status(400).json({
        success: false,
        message: 'Booking ID, reviewee ID, and rating are required'
      });
      return;
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
      return;
    }
    
    if (comment && comment.length < 10) {
      res.status(400).json({
        success: false,
        message: 'Comment must be at least 10 characters'
      });
      return;
    }
    
    if (comment && comment.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
      return;
    }
    
    // Create review
    const review = await ReviewService.createReview({
      bookingId,
      reviewerId,
      revieweeId,
      reviewerType,
      rating,
      comment,
      ratingBreakdown
    });
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
    
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
  }
}

/**
 * Get photographer reviews
 * GET /api/reviews/photographer/:photographerId
 */
export async function getPhotographerReviews(req: Request, res: Response): Promise<void> {
  try {
    const { photographerId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
    const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;
    
    if (!photographerId) {
      res.status(400).json({
        success: false,
        message: 'Photographer ID is required'
      });
      return;
    }
    
    const result = await ReviewService.getPhotographerReviews(photographerId, {
      limit,
      offset,
      minRating,
      maxRating
    });
    
    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.totalCount,
        limit,
        offset,
        hasMore: result.hasMore
      }
    });
    
  } catch (error: any) {
    console.error('Get photographer reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
}

/**
 * Get photographer review statistics
 * GET /api/reviews/photographer/:photographerId/stats
 */
export async function getPhotographerReviewStats(req: Request, res: Response): Promise<void> {
  try {
    const { photographerId } = req.params;
    
    if (!photographerId) {
      res.status(400).json({
        success: false,
        message: 'Photographer ID is required'
      });
      return;
    }
    
    const stats = await ReviewService.getPhotographerReviewStats(photographerId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('Get photographer stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics'
    });
  }
}

/**
 * Get single review by ID
 * GET /api/reviews/:id
 */
export async function getReviewById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Review ID is required'
      });
      return;
    }
    
    const review = await ReviewService.getReviewById(id);
    
    res.status(200).json({
      success: true,
      data: review
    });
    
  } catch (error: any) {
    console.error('Get review error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Review not found'
    });
  }
}

/**
 * Check if user can review a booking
 * GET /api/reviews/can-review/:bookingId
 */
export async function canReviewBooking(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { bookingId } = req.params;
    
    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
      return;
    }
    
    const result = await ReviewService.canReviewBooking(bookingId, userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('Can review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check review eligibility'
    });
  }
}

/**
 * Update review visibility
 * PATCH /api/reviews/:id/visibility
 */
export async function updateReviewVisibility(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const { isVisible } = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Review ID is required'
      });
      return;
    }
    
    if (typeof isVisible !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isVisible must be a boolean'
      });
      return;
    }
    
    const review = await ReviewService.updateReviewVisibility(id, isVisible, userId);
    
    res.status(200).json({
      success: true,
      message: `Review ${isVisible ? 'shown' : 'hidden'} successfully`,
      data: review
    });
    
  } catch (error: any) {
    console.error('Update review visibility error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update visibility'
    });
  }
}

/**
 * Get user's own reviews (reviews they wrote)
 * GET /api/reviews/my-reviews
 */
export async function getMyReviews(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const reviews = await ReviewService.getUserReviews(userId, limit);
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
    
  } catch (error: any) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
}

/**
 * Get bookings that can be reviewed
 * GET /api/reviews/reviewable-bookings
 */
export async function getReviewableBookings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    const bookings = await ReviewService.getReviewableBookings(userId);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
    
  } catch (error: any) {
    console.error('Get reviewable bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get bookings'
    });
  }
}

/**
 * TEACHING MOMENT: Review API Design
 * 
 * PUBLIC ROUTES (no auth):
 * - GET /api/reviews/photographer/:id - View photographer reviews
 * - GET /api/reviews/photographer/:id/stats - View rating statistics
 * - GET /api/reviews/:id - View single review
 * 
 * PROTECTED ROUTES (auth required):
 * - POST /api/reviews - Submit review
 * - GET /api/reviews/my-reviews - My submitted reviews
 * - GET /api/reviews/reviewable-bookings - Bookings I can review
 * - GET /api/reviews/can-review/:bookingId - Check if can review
 * - PATCH /api/reviews/:id/visibility - Hide/show my review
 * 
 * This design allows:
 * - Public can browse reviews (transparency)
 * - Only booking participants can review
 * - Users can manage their own reviews
 */
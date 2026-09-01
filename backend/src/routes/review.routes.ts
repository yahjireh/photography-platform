/**
 * Review Routes
 * API endpoints for reviews and ratings
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ReviewController from '../controllers/review.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Route Organization
 * 
 * Public routes:
 * - View photographer reviews
 * - View review statistics
 * - View single review
 * 
 * Protected routes:
 * - Submit review
 * - Get own reviews
 * - Check review eligibility
 * - Update review visibility
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Get photographer reviews
 * GET /api/reviews/photographer/:photographerId
 * 
 * Query params:
 * - limit: Number of reviews (default: 10)
 * - offset: Pagination offset (default: 0)
 * - min_rating: Filter by minimum rating (1-5)
 * - max_rating: Filter by maximum rating (1-5)
 */
router.get(
  '/photographer/:photographerId',
  ReviewController.getPhotographerReviews
);

/**
 * Get photographer review statistics
 * GET /api/reviews/photographer/:photographerId/stats
 * 
 * Returns:
 * - Total reviews
 * - Average rating
 * - Rating distribution (1-5 stars)
 */
router.get(
  '/photographer/:photographerId/stats',
  ReviewController.getPhotographerReviewStats
);


// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * Submit a review
 * POST /api/reviews
 * 
 * Body: {
 *   "booking_id": "booking-uuid",
 *   "reviewee_id": "user-uuid",
 *   "rating": 5,
 *   "comment": "Great photographer!",
 *   "rating_breakdown": {
 *     "professionalism": 5,
 *     "quality": 5,
 *     "communication": 4,
 *     "value": 5
 *   }
 * }
 */
router.post(
  '/',
  authenticate,
  ReviewController.createReview
);

/**
 * Get user's own reviews
 * GET /api/reviews/my-reviews?limit=10
 */
router.get(
  '/my-reviews',
  authenticate,
  ReviewController.getMyReviews
);

/**
 * Get bookings that can be reviewed
 * GET /api/reviews/reviewable-bookings
 * 
 * Returns completed bookings without reviews
 */
router.get(
  '/reviewable-bookings',
  authenticate,
  ReviewController.getReviewableBookings
);

/**
 * Check if user can review a specific booking
 * GET /api/reviews/can-review/:booking_id
 */
router.get(
  '/can-review/:bookingId',
  authenticate,
  ReviewController.canReviewBooking
);

/**
 * Update review visibility (hide/show)
 * PATCH /api/reviews/:id/visibility
 *
 * Body: {
 *   "is_visible": false
 * }
 */
router.patch(
  '/:id/visibility',
  authenticate,
  ReviewController.updateReviewVisibility
);

/**
 * Get single review by ID
 * GET /api/reviews/:id
 */
router.get(
  '/:id',
  ReviewController.getReviewById
);
/**
 * TEACHING MOMENT: Route Order
 * 
 * IMPORTANT: Specific routes BEFORE parameterized routes!
 * 
 * ✅ CORRECT ORDER:
 * 1. /photographer/:photographer_id
 * 2. /photographer/:photographer_id/stats
 * 3. /my-reviews
 * 4. /reviewable-bookings
 * 5. /can-review/:booking_id
 * 6. /:id
 * 
 * ❌ WRONG ORDER:
 * 1. /:id (would match everything!)
 * 2. /my-reviews (never reached)
 * 
 * Express matches routes in order, so put specific routes first!
 */

export default router;
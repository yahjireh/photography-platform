/**
 * Availability Routes
 * API endpoints for availability management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as AvailabilityController from '../controllers/availability.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Route Organization
 * 
 * Photographer-only routes (protected):
 * - Set availability (single, bulk, recurring)
 * - Get own calendar
 * - Delete availability
 * 
 * Public routes:
 * - Check photographer availability
 * - Search available photographers
 */

// ============================================
// PHOTOGRAPHER ROUTES (Protected)
// ============================================

/**
 * Set availability for a single date
 * POST /api/availability
 * 
 * Body: {
 *   "date": "2026-02-15",
 *   "start_time": "09:00",
 *   "end_time": "17:00",
 *   "status": "AVAILABLE",
 *   "notes": "Optional notes"
 * }
 */
router.post(
  '/',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.setAvailability
);

/**
 * Set availability for multiple dates (bulk)
 * POST /api/availability/bulk
 * 
 * Body: {
 *   "dates": ["2026-02-15", "2026-02-16", "2026-02-17"],
 *   "start_time": "09:00",
 *   "end_time": "17:00",
 *   "status": "AVAILABLE"
 * }
 */
router.post(
  '/bulk',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.setBulkAvailability
);

/**
 * Set recurring availability pattern
 * POST /api/availability/recurring
 * 
 * Body: {
 *   "start_date": "2026-02-01",
 *   "end_date": "2026-02-28",
 *   "days_of_week": [1, 3, 5],
 *   "start_time": "09:00",
 *   "end_time": "17:00",
 *   "status": "AVAILABLE"
 * }
 */
router.post(
  '/recurring',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.setRecurringAvailability
);

/**
 * Get own availability for a date range
 * GET /api/availability/range?start=2026-02-01&end=2026-02-28
 */
router.get(
  '/range',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.getAvailabilityRange
);

/**
 * Get month calendar view
 * GET /api/availability/calendar/:year/:month
 * 
 * Example: GET /api/availability/calendar/2026/2
 */
router.get(
  '/calendar/:year/:month',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.getMonthCalendar
);

/**
 * Get upcoming booked dates
 * GET /api/availability/upcoming-bookings?limit=10
 */
router.get(
  '/upcoming-bookings',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.getUpcomingBookedDates
);

/**
 * Delete availability
 * DELETE /api/availability/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorize('PHOTOGRAPHER'),
  AvailabilityController.deleteAvailability
);

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Check if photographer is available on a specific date
 * GET /api/availability/check/:photographer_id/:date
 *
 * Example: GET /api/availability/check/photographer-uuid/2026-02-15
 */
router.get(
  '/check/:photographerId/:date',
  AvailabilityController.checkAvailability
);

/**
 * Search for available photographers
 * GET /api/availability/search?date=2026-02-15&occasion_type=WEDDING&location_city=Accra
 */
router.get(
  '/search',
  AvailabilityController.searchAvailablePhotographers
);

/**
 * TEACHING MOMENT: Route Order Matters!
 * 
 * Notice we put specific routes BEFORE parameterized routes:
 * 
 * ✅ CORRECT ORDER:
 * 1. POST /bulk
 * 2. POST /recurring
 * 3. GET /range
 * 4. GET /calendar/:year/:month
 * 5. GET /upcoming-bookings
 * 6. GET /search
 * 7. GET /check/:photographer_id/:date
 * 8. DELETE /:id
 * 
 * If /:id was first, a request to /bulk would match /:id with id="bulk"!
 */

export default router;
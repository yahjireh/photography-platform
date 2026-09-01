/**
 * Booking Routes
 * API endpoints for booking management & escrow payment lifecycle
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createBookingController,
  getBooking,
  getMyBookings,
  acceptBookingController,
  rejectBookingController,
  cancelBookingController,
  updateBudgetController,
  updateBookingDetailsController,
  checkWorkAccessController,
  payDepositController,
  confirmArrivalController,
  deliverWorkController,
  payBalanceController,
  createDisputeController
} from '../controllers/booking.controller';

const router = express.Router();

// ============================================
// GENERAL BOOKING ROUTES
// ============================================

// Create new booking (CLIENT)
router.post('/', authenticate, authorize('CLIENT'), createBookingController);

// Get my bookings (CLIENT or PHOTOGRAPHER)
router.get('/my-bookings', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), getMyBookings);

// Get specific booking details
router.get('/:id', authenticate, getBooking);

// ============================================
// EDIT BOOKING & NEGOTIATION
// ============================================
router.patch('/:id/edit', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), updateBookingDetailsController);
router.put('/:id', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), updateBookingDetailsController);
router.patch('/:id/budget', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), updateBudgetController);
router.patch('/:id/negotiate', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), updateBudgetController);

// ============================================
// DELIVERABLES & WORK ACCESS
// ============================================
router.get('/:id/work-access', authenticate, checkWorkAccessController);

// ============================================
// ESCROW LIFECYCLE - CLIENT ACTIONS
// ============================================
router.patch('/:id/pay-deposit', authenticate, authorize('CLIENT'), payDepositController);
router.patch('/:id/confirm-arrival', authenticate, authorize('CLIENT'), confirmArrivalController);
router.patch('/:id/pay-balance', authenticate, authorize('CLIENT'), payBalanceController);

// ============================================
// ESCROW LIFECYCLE - PHOTOGRAPHER ACTIONS
// ============================================
router.patch('/:id/accept', authenticate, authorize('PHOTOGRAPHER'), acceptBookingController);
router.patch('/:id/reject', authenticate, authorize('PHOTOGRAPHER'), rejectBookingController);
router.patch('/:id/deliver-work', authenticate, authorize('PHOTOGRAPHER'), deliverWorkController);

// ============================================
// DISPUTES & CANCELLATION
// ============================================
router.post('/:id/disputes', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), createDisputeController);
router.patch('/:id/cancel', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), cancelBookingController);

export default router;
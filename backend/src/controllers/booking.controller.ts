/**
 * Booking Controller
 * Handles HTTP requests for booking operations & escrow lifecycle
 */


import * as NotificationTrigger from '../services/notification-trigger.service';
import { Request, Response } from 'express';
import { OccasionType, BookingStatus } from '@prisma/client';
import {
  createBooking,
  getBookingById,
  getClientBookings,
  getPhotographerBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  updateBookingBudget,
  updateBookingDetails,
  checkWorkAccess,
  payDeposit,
  confirmPhotographerArrival,
  deliverWork,
  payBalance,
  createDispute
} from '../services/booking.service';

/**
 * Create new booking (CLIENT only)
 * POST /api/bookings
 */
export async function createBookingController(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user!.user_id;
    
    const {
      photographerId,
      occasionType,
      packageId,
      eventLocation,
      eventLatitude,
      eventLongitude,
      eventDate,
      eventStartTime,
      eventEndTime,
      estimatedHours,
      daysCount,
      isMultiday,
      budgetOffered,
      totalAmount,
      specialRequirements
    } = req.body;
    
    if (!photographerId || !occasionType || !eventLocation || !eventDate || !eventStartTime) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: photographerId, occasionType, eventLocation, eventDate, eventStartTime'
      });
      return;
    }

    const calculatedTotal = Number(totalAmount || budgetOffered || 500);
    if (calculatedTotal <= 0) {
      res.status(400).json({
        success: false,
        message: 'Total amount must be greater than 0'
      });
      return;
    }
    
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid event date format'
      });
      return;
    }
    
    const booking = await createBooking({
      clientId,
      photographerId,
      occasionType: occasionType as OccasionType,
      packageId,
      eventLocation,
      eventLatitude,
      eventLongitude,
      eventDate: parsedDate,
      eventStartTime,
      eventEndTime,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 2,
      daysCount: daysCount ? Number(daysCount) : 1,
      isMultiday: !!isMultiday,
      budgetOffered: budgetOffered ? Number(budgetOffered) : undefined,
      totalAmount: calculatedTotal,
      specialRequirements
    });

    // Fire & forget notification
    try {
      if (booking.users_bookings_photographer_idTousers && booking.users_bookings_client_idTousers) {
        NotificationTrigger.onBookingCreated({
          photographerId: booking.photographer_id,
          photographerEmail: booking.users_bookings_photographer_idTousers.email,
          photographerName: `${booking.users_bookings_photographer_idTousers.first_name} ${booking.users_bookings_photographer_idTousers.last_name}`,
          clientName: `${booking.users_bookings_client_idTousers.first_name} ${booking.users_bookings_client_idTousers.last_name}`,
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          occasionType: booking.occasion_type,
          eventDate: booking.event_date.toISOString().split('T')[0],
          eventLocation: booking.event_location,
          totalAmount: Number(booking.total_amount)
        }).catch(err => console.error('Notification error:', err));
      }
    } catch (_) {}
    
    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: booking
    });
    
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
}

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
export async function getBooking(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    
    const booking = await getBookingById(id, userId);
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    const status = error.message?.includes('permission') ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to retrieve booking'
    });
  }
}

/**
 * Get all bookings for current user
 * GET /api/bookings/my-bookings
 */
export async function getMyBookings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const userType = req.user!.user_type;
    const { status, upcoming } = req.query;
    
    const filters: any = {};
    if (status) {
      filters.status = status as BookingStatus;
    }
    if (upcoming === 'true') {
      filters.upcoming = true;
    }
    
    let bookings;
    if (userType === 'CLIENT') {
      bookings = await getClientBookings(userId, filters);
    } else if (userType === 'PHOTOGRAPHER') {
      bookings = await getPhotographerBookings(userId, filters);
    } else {
      res.status(403).json({
        success: false,
        message: 'Only clients and photographers can access bookings'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error: any) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings'
    });
  }
}

/**
 * Accept booking (PHOTOGRAPHER only)
 * PATCH /api/bookings/:id/accept
 */
export async function acceptBookingController(req: Request, res: Response): Promise<void> {
  try {
    const photographerId = req.user!.user_id;
    const { id } = req.params;
    const { deliveryDeadlineDays } = req.body;
    
    const booking = await acceptBooking(
      id, 
      photographerId, 
      deliveryDeadlineDays ? Number(deliveryDeadlineDays) : undefined
    );

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Accept booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept booking'
    });
  }
}

/**
 * Reject booking (PHOTOGRAPHER only)
 * PATCH /api/bookings/:id/reject
 */
export async function rejectBookingController(req: Request, res: Response): Promise<void> {
  try {
    const photographerId = req.user!.user_id;
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await rejectBooking(id, photographerId, reason);

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      data: booking
    });
  } catch (error: any) {
    console.error('Reject booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject booking'
    });
  }
}

/**
 * Update budget / negotiate (CLIENT or PHOTOGRAPHER)
 * PATCH /api/bookings/:id/budget
 */
export async function updateBudgetController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const { newBudget } = req.body;

    if (!newBudget || Number(newBudget) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid newBudget amount is required'
      });
      return;
    }

    const updated = await updateBookingBudget(id, userId, Number(newBudget));
    res.status(200).json({
      success: true,
      message: 'Booking budget updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Update budget error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update budget'
    });
  }
}

/**
 * Edit whole booking (category, package, location, date, time, duration, budget, notes)
 * PATCH /api/bookings/:id/edit
 * PUT /api/bookings/:id
 */
export async function updateBookingDetailsController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const {
      occasionType,
      packageId,
      eventLocation,
      eventLatitude,
      eventLongitude,
      eventDate,
      eventStartTime,
      eventEndTime,
      estimatedHours,
      daysCount,
      isMultiday,
      budgetOffered,
      totalAmount,
      specialRequirements
    } = req.body;

    const parsedDate = eventDate ? new Date(eventDate) : undefined;

    const updated = await updateBookingDetails(id, userId, {
      occasionType: occasionType as OccasionType | undefined,
      packageId,
      eventLocation,
      eventLatitude,
      eventLongitude,
      eventDate: parsedDate,
      eventStartTime,
      eventEndTime,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      daysCount: daysCount ? Number(daysCount) : undefined,
      isMultiday,
      budgetOffered: budgetOffered ? Number(budgetOffered) : undefined,
      totalAmount: totalAmount ? Number(totalAmount) : undefined,
      specialRequirements
    });

    res.status(200).json({
      success: true,
      message: 'Booking details updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Update booking details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update booking details'
    });
  }
}

/**
 * Check Work Access / Deliverables status
 * GET /api/bookings/:id/work-access
 */
export async function checkWorkAccessController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;

    const accessInfo = await checkWorkAccess(id, userId);

    res.status(200).json({
      success: true,
      data: accessInfo
    });
  } catch (error: any) {
    console.error('Check work access error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to check work access'
    });
  }
}

/**
 * Client pays deposit / full amount (CLIENT only)
 * PATCH /api/bookings/:id/pay-deposit
 */
export async function payDepositController(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user!.user_id;
    const { id } = req.params;
    const { isFullPayment, paymentMethodId, channel } = req.body;

    const booking = await payDeposit(id, clientId, {
      isFullPayment: !!isFullPayment,
      paymentMethodId,
      channel
    });

    res.status(200).json({
      success: true,
      message: isFullPayment 
        ? 'Full session amount deposited into platform escrow' 
        : 'Deposit secured in platform escrow',
      data: booking
    });
  } catch (error: any) {
    console.error('Pay deposit error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process deposit'
    });
  }
}

/**
 * Client confirms photographer arrival on site (CLIENT only)
 * PATCH /api/bookings/:id/confirm-arrival
 */
export async function confirmArrivalController(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user!.user_id;
    const { id } = req.params;

    const booking = await confirmPhotographerArrival(id, clientId);

    res.status(200).json({
      success: true,
      message: 'Arrival confirmed! Initial deposit released to photographer.',
      data: booking
    });
  } catch (error: any) {
    console.error('Confirm arrival error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm arrival'
    });
  }
}

/**
 * Photographer delivers finished work (PHOTOGRAPHER only)
 * PATCH /api/bookings/:id/deliver-work
 */
export async function deliverWorkController(req: Request, res: Response): Promise<void> {
  try {
    const photographerId = req.user!.user_id;
    const { id } = req.params;
    const { deliveryUrl, accessPin, deliveryNotes } = req.body;

    if (!deliveryUrl) {
      res.status(400).json({
        success: false,
        message: 'deliveryUrl is required'
      });
      return;
    }

    const booking = await deliverWork(id, photographerId, {
      deliveryUrl,
      accessPin,
      deliveryNotes
    });

    res.status(200).json({
      success: true,
      message: 'Work deliverables submitted successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Deliver work error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to deliver work'
    });
  }
}

/**
 * Client pays remaining 60% balance (CLIENT only)
 * PATCH /api/bookings/:id/pay-balance
 */
export async function payBalanceController(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user!.user_id;
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    const booking = await payBalance(id, clientId, { paymentMethodId });

    res.status(200).json({
      success: true,
      message: 'Remaining balance settled! Access PIN and gallery unlocked.',
      data: booking
    });
  } catch (error: any) {
    console.error('Pay balance error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to settle balance'
    });
  }
}

/**
 * Raise a dispute (CLIENT or PHOTOGRAPHER)
 * POST /api/bookings/:id/disputes
 */
export async function createDisputeController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const { reason, description, evidenceUrls } = req.body;

    if (!reason || !description) {
      res.status(400).json({
        success: false,
        message: 'Reason and description are required to raise a dispute'
      });
      return;
    }

    const dispute = await createDispute(id, userId, {
      reason,
      description,
      evidenceUrls
    });

    res.status(201).json({
      success: true,
      message: 'Dispute submitted for admin review',
      data: dispute
    });
  } catch (error: any) {
    console.error('Create dispute error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to raise dispute'
    });
  }
}

/**
 * Cancel booking (CLIENT or PHOTOGRAPHER)
 * PATCH /api/bookings/:id/cancel
 */
export async function cancelBookingController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await cancelBooking(id, userId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel booking'
    });
  }
}
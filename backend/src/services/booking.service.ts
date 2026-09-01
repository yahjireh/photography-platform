/**
 * Booking Service
 * Business logic for booking management and escrow payment lifecycle
 */

import prisma from '../config/database';
import { OccasionType, BookingStatus, NotificationType } from '@prisma/client';
import { DEPOSIT_PERCENTAGE, BALANCE_PERCENTAGE, generateBookingNumber } from '../config/constants';
import * as AvailabilityService from './availability.service';
import * as NotificationTrigger from './notification-trigger.service';

interface CreateBookingData {
  clientId: string;
  photographerId: string;
  occasionType: OccasionType;
  packageId?: string;
  eventLocation: string;
  eventLatitude?: number;
  eventLongitude?: number;
  eventDate: Date;
  eventStartTime: string;  // "09:00"
  eventEndTime?: string;   // "17:00"
  estimatedHours?: number;
  daysCount?: number;
  isMultiday?: boolean;
  budgetOffered?: number;
  totalAmount: number;
  specialRequirements?: string;
}

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingData) {
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: data.photographerId },
    include: {
      subscriptions: true
    }
  });
  
  if (!photographer) {
    throw new Error('Photographer not found');
  }
  
  if (photographer.verification_status !== 'VERIFIED') {
    throw new Error('Can only book verified photographers');
  }
  
  if (data.clientId === data.photographerId) {
    throw new Error('You cannot book yourself');
  }
  
  // Validate event date is in future
  const now = new Date();
  if (data.eventDate <= now) {
    throw new Error('Event date must be in the future');
  }
  
  let finalAmount = data.totalAmount;
  let deliveryDeadlineDays = 7;

  // If package chosen, retrieve package details
  if (data.packageId) {
    const pkg = await prisma.packages.findUnique({
      where: { id: data.packageId }
    });
    if (pkg) {
      finalAmount = data.budgetOffered ? data.budgetOffered : Number(pkg.price);
      deliveryDeadlineDays = pkg.delivery_days || 7;
    }
  }

  const depositAmount = finalAmount * DEPOSIT_PERCENTAGE;
  const balanceAmount = finalAmount * BALANCE_PERCENTAGE;
  
  const commissionRate = photographer.subscriptions?.commission_rate || 0.15;
  const platformCommission = finalAmount * Number(commissionRate);
  const bookingNumber = generateBookingNumber();
  
  const [startHour, startMinute] = data.eventStartTime.split(':').map(Number);
  const eventStartDateTime = new Date(data.eventDate);
  eventStartDateTime.setHours(startHour, startMinute, 0, 0);
  
  let eventEndDateTime: Date | undefined;
  if (data.eventEndTime) {
    const [endHour, endMinute] = data.eventEndTime.split(':').map(Number);
    eventEndDateTime = new Date(data.eventDate);
    eventEndDateTime.setHours(endHour, endMinute, 0, 0);
  }

  // Check availability
  const availabilityCheck = await AvailabilityService.checkAvailability(
    data.photographerId,
    data.eventDate
  );

  if (!availabilityCheck.isAvailable) {
    throw new Error(`Photographer is not available on this date. ${availabilityCheck.reason || ''}`);
  }
  
  const booking = await prisma.bookings.create({
    data: {
      booking_number: bookingNumber,
      client_id: data.clientId,
      photographer_id: data.photographerId,
      occasion_type: data.occasionType,
      package_id: data.packageId || null,
      event_location: data.eventLocation,
      event_latitude: data.eventLatitude,
      event_longitude: data.eventLongitude,
      event_date: data.eventDate,
      event_start_time: eventStartDateTime,
      event_end_time: eventEndDateTime,
      estimated_hours: data.estimatedHours || 2,
      days_count: data.daysCount || 1,
      is_multiday: !!data.isMultiday,
      budget_offered: data.budgetOffered ? data.budgetOffered : finalAmount,
      total_amount: finalAmount,
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
      platform_commission: platformCommission,
      special_requirements: data.specialRequirements,
      delivery_deadline_days: deliveryDeadlineDays,
      status: 'PENDING'
    },
    include: {
      packages: true,
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          profile_image_url: true
        }
      },
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          profile_image_url: true
        }
      }
    }
  });

  // Notify photographer
  try {
    await prisma.notifications.create({
      data: {
        user_id: data.photographerId,
        type: NotificationType.BOOKING_REQUEST,
        title: 'New Inbound Shoot Brief',
        message: `New ${data.occasionType} brief received from ${booking.users_bookings_client_idTousers?.first_name} for ₵${finalAmount}.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
  
  return booking;
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string, userId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      packages: true,
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          profile_image_url: true,
          location_city: true,
          location_country: true
        }
      },
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          profile_image_url: true,
          location_city: true,
          location_country: true
        }
      },
      payments: true,
      booking_photos: true,
      disputes: true,
      messages: {
        orderBy: { created_at: 'desc' },
        take: 10
      }
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('You do not have permission to view this booking');
  }
  
  return booking;
}

/**
 * Get all bookings for a client
 */
export async function getClientBookings(
  clientId: string,
  filters?: {
    status?: BookingStatus;
    upcoming?: boolean;
  }
) {
  const where: any = {
    client_id: clientId
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.upcoming) {
    where.event_date = {
      gte: new Date()
    };
  }

  const bookings = await prisma.bookings.findMany({
    where,
    include: {
      packages: true,
      disputes: true,
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          location_city: true,
          location_country: true,
          phone_number: true
        }
      },
      payments: {
        select: {
          id: true,
          payment_stage: true,
          amount: true,
          status: true,
          hold_status: true
        }
      }
    },
    orderBy: [
      { event_date: 'asc' },
      { created_at: 'desc' }
    ]
  });
  
  return bookings;
}

/**
 * Get all bookings for a photographer
 */
export async function getPhotographerBookings(
  photographerId: string,
  filters?: {
    status?: BookingStatus;
    upcoming?: boolean;
  }
) {
  const where: any = {
    photographer_id: photographerId
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.upcoming) {
    where.event_date = {
      gte: new Date()
    };
  }

  const bookings = await prisma.bookings.findMany({
    where,
    include: {
      packages: true,
      disputes: true,
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          location_city: true,
          phone_number: true
        }
      },
      payments: {
        select: {
          id: true,
          payment_stage: true,
          amount: true,
          status: true,
          hold_status: true
        }
      }
    },
    orderBy: [
      { event_date: 'asc' },
      { created_at: 'desc' }
    ]
  });
  
  return bookings;
}

/**
 * Photographer accepts booking with delivery turnaround promise
 */
export async function acceptBooking(
  bookingId: string, 
  photographerId: string,
  deliveryDeadlineDays?: number
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.photographer_id !== photographerId) {
    throw new Error('Only the assigned photographer can accept this booking');
  }

  if (booking.status !== 'PENDING') {
    throw new Error(`Cannot accept booking with status: ${booking.status}`);
  }

  const days = Math.min(Math.max(deliveryDeadlineDays || booking.delivery_deadline_days || 7, 1), 30);
  const deliveryDeadline = new Date(Date.now() + days * 86400000);

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      status: 'ACCEPTED',
      accepted_at: new Date(),
      delivery_deadline_days: days,
      delivery_deadline: deliveryDeadline
    },
    include: {
      packages: true,
      users_bookings_client_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      },
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });

  // Mark photographer calendar date as BOOKED in availability
  try {
    const photogRecord = await prisma.photographers.findUnique({
      where: { user_id: photographerId }
    });

    if (photogRecord) {
      const existingAvail = await prisma.availability.findFirst({
        where: {
          photographer_id: photogRecord.id,
          available_date: booking.event_date
        }
      });

      if (existingAvail) {
        await prisma.availability.update({
          where: { id: existingAvail.id },
          data: { status: 'BOOKED', notes: `Booking ${booking.booking_number}` }
        });
      } else {
        await prisma.availability.create({
          data: {
            photographer_id: photogRecord.id,
            available_date: booking.event_date,
            status: 'BOOKED',
            notes: `Booking ${booking.booking_number}`
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not auto-mark availability to BOOKED:', err);
  }

  // Notify client of approval
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.client_id,
        type: NotificationType.BOOKING_ACCEPTED,
        title: 'Brief Approved by Photographer',
        message: `Your booking #${booking.booking_number} has been approved! Promised turnaround: ${days} days. Please proceed with the deposit to secure the date.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Photographer rejects booking
 */
export async function rejectBooking(
  bookingId: string,
  photographerId: string,
  reason?: string
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.photographer_id !== photographerId) {
    throw new Error('Only the assigned photographer can reject this booking');
  }

  if (booking.status !== 'PENDING') {
    throw new Error(`Cannot reject booking with status: ${booking.status}`);
  }

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      status: 'REJECTED',
      cancellation_reason: reason || 'Declined by photographer'
    }
  });

  // Notify client
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.client_id,
        type: NotificationType.BOOKING_REJECTED,
        title: 'Booking Request Declined',
        message: `Your shoot request #${booking.booking_number} could not be accepted at this time.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Update/Negotiate booking budget
 */
export async function updateBookingBudget(
  bookingId: string,
  userId: string,
  newBudget: number
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('Unauthorized to update this booking budget');
  }

  if (booking.status !== 'PENDING' && booking.status !== 'ACCEPTED') {
    throw new Error('Can only negotiate budget before deposit is settled');
  }

  const depositAmount = newBudget * DEPOSIT_PERCENTAGE;
  const balanceAmount = newBudget * BALANCE_PERCENTAGE;

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      total_amount: newBudget,
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
      budget_offered: newBudget
    },
    include: {
      packages: true
    }
  });

  return updated;
}

/**
 * Edit whole booking (category, package, location, date, time, duration, multiday, budget, notes)
 */
export async function updateBookingDetails(
  bookingId: string,
  userId: string,
  data: {
    occasionType?: OccasionType;
    packageId?: string | null;
    eventLocation?: string;
    eventLatitude?: number;
    eventLongitude?: number;
    eventDate?: Date;
    eventStartTime?: string;
    eventEndTime?: string;
    estimatedHours?: number;
    daysCount?: number;
    isMultiday?: boolean;
    budgetOffered?: number;
    totalAmount?: number;
    specialRequirements?: string;
  }
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      packages: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('Unauthorized to edit this booking');
  }

  if (booking.deposit_paid || (booking.status !== 'PENDING' && booking.status !== 'ACCEPTED')) {
    throw new Error('Cannot edit booking details after deposit has been secured or shoot is confirmed');
  }

  const updatePayload: any = {};

  if (data.occasionType) {
    const occasionMap: Record<string, string> = {
      'portrait': 'PORTRAIT',
      'wedding': 'WEDDING',
      'fashion': 'PORTRAIT',
      'events': 'CORPORATE_EVENT',
      'event': 'CORPORATE_EVENT',
      'corporate': 'CORPORATE_EVENT',
      'corporate_event': 'CORPORATE_EVENT',
      'product': 'PRODUCT_SHOOT',
      'product_shoot': 'PRODUCT_SHOOT',
      'commercial': 'PRODUCT_SHOOT',
      'birthday': 'BIRTHDAY',
      'conference': 'CONFERENCE',
      'family': 'FAMILY_SHOOT',
      'real_estate': 'REAL_ESTATE',
      'sports': 'SPORTS',
      'graduation': 'GRADUATION'
    };
    const norm = occasionMap[String(data.occasionType).toLowerCase()] || String(data.occasionType).toUpperCase();
    updatePayload.occasion_type = norm as OccasionType;
  }

  const parseTimeToDate = (timeStr?: string): Date | undefined => {
    if (!timeStr) return undefined;
    if (timeStr.includes('T')) return new Date(timeStr);
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const d = new Date(0);
      d.setUTCHours(h, m, 0, 0);
      return d;
    }
    return undefined;
  };

  if (data.packageId !== undefined) updatePayload.package_id = data.packageId;
  if (data.eventLocation) updatePayload.event_location = data.eventLocation;
  if (data.eventLatitude !== undefined) updatePayload.event_latitude = data.eventLatitude;
  if (data.eventLongitude !== undefined) updatePayload.event_longitude = data.eventLongitude;
  if (data.eventDate) updatePayload.event_date = new Date(data.eventDate);
  if (data.eventStartTime) updatePayload.event_start_time = parseTimeToDate(data.eventStartTime);
  if (data.eventEndTime !== undefined) updatePayload.event_end_time = parseTimeToDate(data.eventEndTime);
  if (data.estimatedHours !== undefined) updatePayload.estimated_hours = data.estimatedHours;
  if (data.daysCount !== undefined) updatePayload.days_count = data.daysCount;
  if (data.isMultiday !== undefined) updatePayload.is_multiday = data.isMultiday;
  if (data.specialRequirements !== undefined) updatePayload.special_requirements = data.specialRequirements;

  const newTotal = data.totalAmount || data.budgetOffered;
  if (newTotal && Number(newTotal) > 0) {
    updatePayload.total_amount = Number(newTotal);
    updatePayload.deposit_amount = Number(newTotal) * DEPOSIT_PERCENTAGE;
    updatePayload.balance_amount = Number(newTotal) * BALANCE_PERCENTAGE;
    updatePayload.budget_offered = Number(newTotal);
  }

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: updatePayload,
    include: {
      packages: true,
      users_bookings_photographer_idTousers: true,
      users_bookings_client_idTousers: true
    }
  });

  // Notify other party of updated brief
  const otherUserId = userId === booking.client_id ? booking.photographer_id : booking.client_id;
  try {
    await prisma.notifications.create({
      data: {
        user_id: otherUserId,
        type: NotificationType.BOOKING_REQUEST,
        title: 'Booking Brief Updated',
        message: `Booking #${booking.booking_number} details have been updated.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to send update notification:', err);
  }

  return updated;
}

/**
 * Client pays deposit (or full amount) -> held in platform escrow
 */
export async function payDeposit(
  bookingId: string,
  clientId: string,
  options: {
    isFullPayment?: boolean;
    paymentMethodId?: string;
    channel?: string;
  }
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== clientId) {
    throw new Error('Only the client can pay for this booking');
  }

  if (booking.status !== 'ACCEPTED' && booking.status !== 'CONFIRMED') {
    throw new Error(`Cannot pay deposit for booking in status: ${booking.status}`);
  }

  const isFull = !!options.isFullPayment;
  const paymentAmount = isFull ? Number(booking.total_amount) : Number(booking.deposit_amount);
  const paymentRef = `ESCROW_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // Record escrow payment in payments table
  await prisma.payments.create({
    data: {
      booking_id: bookingId,
      paystack_reference: paymentRef,
      payment_stage: isFull ? 'BALANCE' : 'DEPOSIT',
      amount: paymentAmount,
      status: 'SUCCESSFUL',
      hold_status: 'HELD',
      held_at: new Date(),
      release_notes: isFull ? 'Full payment held in platform escrow' : '40% initial deposit held in platform escrow'
    }
  });

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      deposit_paid: true,
      deposit_paid_at: new Date(),
      full_payment_paid: isFull,
      status: 'CONFIRMED',
      confirmed_at: new Date()
    },
    include: {
      packages: true,
      payments: true,
      users_bookings_photographer_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });

  // Notify photographer
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.photographer_id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Shoot Deposit Secured in Escrow',
        message: `Client has deposited ₵${paymentAmount} into platform escrow for booking #${booking.booking_number}. Funds will release upon arrival check-in.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Client confirms photographer arrived on site -> releases initial deposit from escrow
 */
export async function confirmPhotographerArrival(
  bookingId: string,
  clientId: string
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      payments: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== clientId) {
    throw new Error('Only the client can confirm photographer arrival');
  }

  if (!booking.deposit_paid) {
    throw new Error('Cannot confirm arrival before deposit is paid');
  }

  // Release initial deposit payment record from platform escrow to photographer
  const heldDeposit = booking.payments.find(p => p.hold_status === 'HELD' && p.payment_stage === 'DEPOSIT');
  if (heldDeposit) {
    await prisma.payments.update({
      where: { id: heldDeposit.id },
      data: {
        hold_status: 'RELEASED_TO_PHOTOGRAPHER',
        released_at: new Date(),
        release_notes: 'Initial deposit released upon client arrival check-in'
      }
    });
  }

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      client_confirmed_arrival_at: new Date(),
      status: 'IN_PROGRESS',
      shoot_started_at: new Date()
    },
    include: {
      packages: true,
      payments: true
    }
  });

  // Notify photographer
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.photographer_id,
        type: NotificationType.SHOOT_STARTED,
        title: 'Arrival Confirmed & Deposit Released',
        message: `Client confirmed check-in for booking #${booking.booking_number}! Initial deposit has been released to your payout balance.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Photographer delivers finished work material with protected Access PIN
 */
export async function deliverWork(
  bookingId: string,
  photographerId: string,
  data: {
    deliveryUrl: string;
    accessPin?: string;
    deliveryNotes?: string;
  }
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      payments: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.photographer_id !== photographerId) {
    throw new Error('Only the assigned photographer can deliver work for this booking');
  }

  const pin = data.accessPin || Math.floor(1000 + Math.random() * 9000).toString();

  // If full payment was paid initially, automatically complete and release final balance
  let isComplete = false;
  if (booking.full_payment_paid) {
    isComplete = true;
    const heldBalance = booking.payments.find(p => p.hold_status === 'HELD' && p.payment_stage === 'BALANCE');
    if (heldBalance) {
      await prisma.payments.update({
        where: { id: heldBalance.id },
        data: {
          hold_status: 'RELEASED_TO_PHOTOGRAPHER',
          released_at: new Date(),
          release_notes: 'Final balance released upon delivery'
        }
      });
    }
  }

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      work_delivery_status: 'DELIVERED',
      delivery_url: data.deliveryUrl,
      access_pin: pin,
      delivery_notes: data.deliveryNotes || 'Session deliverables ready for download.',
      photos_delivered_at: new Date(),
      shoot_completed_at: booking.shoot_completed_at || new Date(),
      balance_paid: booking.full_payment_paid ? true : booking.balance_paid,
      balance_paid_at: booking.full_payment_paid ? new Date() : booking.balance_paid_at,
      status: isComplete ? 'COMPLETED' : booking.status
    },
    include: {
      packages: true,
      payments: true
    }
  });

  // Notify client
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.client_id,
        type: NotificationType.PHOTOS_DELIVERED,
        title: 'Session Deliverables Ready',
        message: isComplete
          ? `Your photographer has delivered your gallery! Access PIN: ${pin}`
          : `Deliverables for booking #${booking.booking_number} are uploaded. Pay remaining balance to unlock full access.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number, accessPin: isComplete ? pin : undefined }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Client pays remaining 60% balance -> releases PIN and unlocks delivery
 */
export async function payBalance(
  bookingId: string,
  clientId: string,
  _options?: {
    paymentMethodId?: string;
  }
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== clientId) {
    throw new Error('Only the client can pay the balance for this booking');
  }

  if (!booking.deposit_paid) {
    throw new Error('Deposit must be paid first before paying balance');
  }

  const balanceAmount = Number(booking.balance_amount);
  const paymentRef = `BAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // Record balance payment record
  await prisma.payments.create({
    data: {
      booking_id: bookingId,
      paystack_reference: paymentRef,
      payment_stage: 'BALANCE',
      amount: balanceAmount,
      status: 'SUCCESSFUL',
      hold_status: 'RELEASED_TO_PHOTOGRAPHER',
      held_at: new Date(),
      released_at: new Date(),
      release_notes: 'Final balance settled by client'
    }
  });

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      balance_paid: true,
      balance_paid_at: new Date(),
      status: 'COMPLETED'
    },
    include: {
      packages: true,
      payments: true,
      users_bookings_client_idTousers: true,
      users_bookings_photographer_idTousers: true
    }
  });

  // Trigger dispatch of PIN to client via SMS, Email, and in-app message
  try {
    const clientUser = updated.users_bookings_client_idTousers;
    const photographerUser = updated.users_bookings_photographer_idTousers;

    if (clientUser && updated.access_pin) {
      NotificationTrigger.onDeliverablesPinReleased({
        clientId: clientUser.id,
        clientEmail: clientUser.email,
        clientPhone: clientUser.phone_number,
        clientName: `${clientUser.first_name} ${clientUser.last_name || ''}`.trim(),
        photographerName: `${photographerUser.first_name} ${photographerUser.last_name || ''}`.trim(),
        bookingId: updated.id,
        bookingNumber: updated.booking_number,
        accessPin: updated.access_pin,
        deliveryUrl: updated.delivery_url || 'https://clickflicks.art/gallery'
      }).catch(err => console.error('PIN release notification error:', err));
    }
  } catch (err) {
    console.warn('Failed to trigger PIN release dispatch:', err);
  }

  // Notify photographer of final balance settlement
  try {
    await prisma.notifications.create({
      data: {
        user_id: booking.photographer_id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Final Balance Payment Settled',
        message: `Client settled remaining ₵${balanceAmount} balance for booking #${booking.booking_number}! Funds released to your balance.`,
        data: { bookingId: booking.id, bookingNumber: booking.booking_number }
      }
    });
  } catch (err) {
    console.warn('Failed to create notification:', err);
  }

  return updated;
}

/**
 * Check Work Access / Deliverables status
 * Checks if balance is paid and returns PIN & Link or prompts payment
 */
export async function checkWorkAccess(bookingId: string, userId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      users_bookings_photographer_idTousers: true,
      users_bookings_client_idTousers: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('Unauthorized to view deliverables for this booking');
  }

  const isDelivered = booking.work_delivery_status === 'DELIVERED';
  const isPaid = booking.full_payment_paid || booking.balance_paid;
  const balanceDue = Number(booking.balance_amount) || Math.round(Number(booking.total_amount) * BALANCE_PERCENTAGE);

  if (!isDelivered) {
    return {
      hasAccess: false,
      isDelivered: false,
      isPaid,
      balanceDue,
      message: 'Photographer has not uploaded session deliverables yet.'
    };
  }

  if (!isPaid) {
    return {
      hasAccess: false,
      isDelivered: true,
      isPaid: false,
      balanceDue,
      deliveryUrl: booking.delivery_url,
      message: 'Deliverables are uploaded! Settle remaining balance to unlock your Access PIN and full resolution assets.'
    };
  }

  return {
    hasAccess: true,
    isDelivered: true,
    isPaid: true,
    balanceDue: 0,
    deliveryUrl: booking.delivery_url,
    accessPin: booking.access_pin,
    deliveryNotes: booking.delivery_notes,
    message: 'Deliverables verified! Access PIN has been dispatched to your email, phone, and inbox.'
  };
}

/**
 * Raise a dispute on a booking
 */
export async function createDispute(
  bookingId: string,
  userId: string,
  data: {
    reason: string;
    description: string;
    evidenceUrls?: string[];
  }
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('Unauthorized to raise dispute on this booking');
  }

  const againstId = booking.client_id === userId ? booking.photographer_id : booking.client_id;

  const dispute = await prisma.disputes.create({
    data: {
      booking_id: bookingId,
      raised_by_id: userId,
      raised_against_id: againstId,
      reason: data.reason,
      description: data.description,
      evidence_urls: data.evidenceUrls || [],
      status: 'OPEN',
      priority: 'MEDIUM'
    }
  });

  await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      status: 'DISPUTED'
    }
  });

  return dispute;
}

/**
 * Client cancels booking
 */
export async function cancelBooking(
  bookingId: string,
  clientId: string,
  reason?: string
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.client_id !== clientId) {
    throw new Error('Only the client can cancel this booking');
  }

  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new Error(`Cannot cancel booking with status: ${booking.status}`);
  }

  const updated = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancellation_reason: reason || 'Cancelled by client'
    }
  });

  return updated;
}
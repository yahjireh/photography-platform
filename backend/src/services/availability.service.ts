/**
 * Availability Service
 * Business logic for photographer availability management
 */

import prisma from '../config/database';
import { AvailabilityStatus, BookingStatus } from '@prisma/client';

/**
 * TEACHING MOMENT: Availability System
 * 
 * Photographers need to manage their schedule:
 * - Mark dates as AVAILABLE (free to book)
 * - Mark dates as BLOCKED (vacation, personal time)
 * - System auto-marks as BOOKED when booking confirmed
 * 
 * This prevents:
 * - Double bookings
 * - Booking conflicts
 * - Manual schedule management
 */

/**
 * Set availability for a specific date
 * 
 * @param data - Availability data
 * @returns Created availability record
 */
/**
 * Convert time string (HH:MM) to DateTime object
 * Prisma expects DateTime even for @db.Time fields
 */
function convertTimeToDateTime(timeString?: string): Date | null {
  if (!timeString) return null;
  
  // Create a DateTime with dummy date (1970-01-01) and the provided time
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date('1970-01-01');
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function setAvailability(data: {
  photographerId: string;
  availableDate: Date;
  startTime?: string;
  endTime?: string;
  status: AvailabilityStatus;
  notes?: string;
}) {
  console.log(`📅 Setting availability for ${data.availableDate.toISOString().split('T')[0]}`);
  
  // Convert time strings to DateTime objects
  const startTimeDate = convertTimeToDateTime(data.startTime);
  const endTimeDate = convertTimeToDateTime(data.endTime);
  
  // Check if availability already exists for this date
  const existing = await prisma.availability.findFirst({
    where: {
      photographer_id: data.photographerId,
      available_date: data.availableDate
    }
  });
  
  if (existing) {
    // Update existing
    const updated = await prisma.availability.update({
      where: { id: existing.id },
      data: {
        start_time: startTimeDate,
        end_time: endTimeDate,
        status: data.status,
        notes: data.notes || null
      }
    });

    console.log(`✅ Updated existing availability: ${updated.id}`);
    return updated;
  }

  // Create new
  const availability = await prisma.availability.create({
    data: {
      photographer_id: data.photographerId,
      available_date: data.availableDate,
      start_time: startTimeDate,
      end_time: endTimeDate,
      status: data.status,
      notes: data.notes || null
    }
  });
  
  console.log(`✅ Created availability: ${availability.id}`);
  return availability;
}

/**
 * Set availability for multiple dates (bulk operation)
 * 
 * @param data - Bulk availability data
 * @returns Array of created/updated records
 */
export async function setBulkAvailability(data: {
  photographerId: string;
  dates: Date[];
  startTime?: string;
  endTime?: string;
  status: AvailabilityStatus;
  notes?: string;
}) {
  console.log(`📅 Setting bulk availability for ${data.dates.length} dates`);
  
  const results = [];
  
  for (const date of data.dates) {
    const availability = await setAvailability({
      photographerId: data.photographerId,
      availableDate: date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      notes: data.notes
    });
    
    results.push(availability);
  }
  
  console.log(`✅ Set availability for ${results.length} dates`);
  return results;
}

/**
 * Set recurring availability pattern
 * Example: "Available every Monday and Wednesday, 9 AM - 5 PM"
 * 
 * @param data - Recurring pattern data
 * @returns Array of created records
 */
export async function setRecurringAvailability(data: {
  photographerId: string;
  startDate: Date;
  endDate: Date;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime?: string;
  endTime?: string;
  status: AvailabilityStatus;
  notes?: string;
}) {
  console.log(`🔄 Setting recurring availability: Days ${data.daysOfWeek.join(', ')}`);
  
  const dates: Date[] = [];
  const current = new Date(data.startDate);
  
  // Generate all dates that match the pattern
  while (current <= data.endDate) {
    const dayOfWeek = current.getDay();
    
    if (data.daysOfWeek.includes(dayOfWeek)) {
      dates.push(new Date(current));
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  console.log(`   Generated ${dates.length} dates from pattern`);
  
  // Set availability for all dates
  return await setBulkAvailability({
    photographerId: data.photographerId,
    dates,
    startTime: data.startTime,
    endTime: data.endTime,
    status: data.status,
    notes: data.notes
  });
}

/**
 * Check if photographer is available on a specific date
 * 
 * @param photographerId - Photographer ID
 * @param date - Date to check
 * @returns Availability record or null
 */
export async function checkAvailability(
  photographerId: string,
  date: Date
): Promise<{
  isAvailable: boolean;
  availability: any | null;
  reason?: string;
}> {
  // Normalize date to ignore time component
  const searchDate = new Date(date);
  searchDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(searchDate.getTime() + 24 * 60 * 60 * 1000);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (searchDate < today) {
    return {
      isAvailable: false,
      availability: null,
      reason: 'Date is in the past'
    };
  }

  // Find photographer record by id or user_id
  const pRecord = await prisma.photographers.findFirst({
    where: {
      OR: [
        { id: photographerId },
        { user_id: photographerId }
      ]
    }
  });

  const pId = pRecord ? pRecord.id : photographerId;
  const uId = pRecord ? pRecord.user_id : photographerId;

  // 1. Check if explicitly marked in availability table
  const availability = await prisma.availability.findFirst({
    where: {
      OR: [
        { photographer_id: pId },
        { photographer_id: uId }
      ],
      available_date: {
        gte: searchDate,
        lt: nextDay
      }
    }
  });

  if (availability) {
    if (availability.status === 'BLOCKED') {
      return {
        isAvailable: false,
        availability,
        reason: 'Date is blocked by photographer'
      };
    }
    if (availability.status === 'BOOKED') {
      return {
        isAvailable: false,
        availability,
        reason: 'Date is already booked'
      };
    }
    return {
      isAvailable: true,
      availability
    };
  }

  // 2. Check if there is an active booking on this date
  const activeBooking = await prisma.bookings.findFirst({
    where: {
      OR: [
        { photographer_id: pId },
        { photographer_id: uId }
      ],
      event_date: {
        gte: searchDate,
        lt: nextDay
      },
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]
      }
    }
  });

  if (activeBooking) {
    return {
      isAvailable: false,
      availability: null,
      reason: 'Photographer has a booked session on this date'
    };
  }

  // Default: Photographer is open and available
  return {
    isAvailable: true,
    availability: null
  };
}

/**
 * Get photographer's availability for a date range
 * 
 * @param photographerId - Photographer ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of availability records
 */
export async function getAvailabilityRange(
  photographerId: string,
  startDate: Date,
  endDate: Date
) {
  const availabilities = await prisma.availability.findMany({
    where: {
      photographer_id: photographerId,
      available_date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      available_date: 'asc'
    }
  });
  
  return availabilities;
}

/**
 * Get calendar view for a month
 * Returns a structured calendar with availability info
 * 
 * @param photographerId - Photographer ID
 * @param year - Year (e.g., 2026)
 * @param month - Month (1-12)
 * @returns Calendar data with availability
 */
export async function getMonthCalendar(
  photographerId: string,
  year: number,
  month: number
) {
  // Get first and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  console.log(`📆 Getting calendar for ${year}-${month}`);
  console.log(`   Range: ${firstDay.toISOString().split('T')[0]} to ${lastDay.toISOString().split('T')[0]}`);
  
  // Get all availability records for this month
  const availabilities = await getAvailabilityRange(
    photographerId,
    firstDay,
    lastDay
  );
  
  // Create a map for quick lookup
  const availabilityMap = new Map();
  availabilities.forEach(av => {
    const dateKey = av.available_date.toISOString().split('T')[0];
    availabilityMap.set(dateKey, av);
  });
  
  // Generate calendar days
  const days = [];
  const current = new Date(firstDay);
  
  while (current <= lastDay) {
    const dateKey = current.toISOString().split('T')[0];
    const availability = availabilityMap.get(dateKey);
    
    days.push({
      date: new Date(current),
      dayOfWeek: current.getDay(),
      dayOfMonth: current.getDate(),
      status: availability?.status || 'UNSET',
      availability: availability || null,
      isToday: isToday(current),
      isPast: isPast(current)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return {
    year,
    month,
    firstDay,
    lastDay,
    totalDays: days.length,
    days,
    summary: {
      available: days.filter(d => d.status === 'AVAILABLE').length,
      booked: days.filter(d => d.status === 'BOOKED').length,
      blocked: days.filter(d => d.status === 'BLOCKED').length,
      unset: days.filter(d => d.status === 'UNSET').length
    }
  };
}

/**
 * Mark date as booked (called when booking is confirmed)
 * 
 * @param photographerId - Photographer ID
 * @param date - Date to mark as booked
 * @param bookingId - Booking ID reference
 */
export async function markAsBooked(
  photographerId: string,
  date: Date,
  bookingId: string
) {
  console.log(`🔒 Marking date as BOOKED: ${date.toISOString().split('T')[0]}`);
  
  const existing = await prisma.availability.findFirst({
    where: {
      photographer_id: photographerId,
      available_date: date
    }
  });

  if (existing) {
    // Update existing
    await prisma.availability.update({
      where: { id: existing.id },
      data: {
        status: 'BOOKED',
        notes: `Booked - Booking ID: ${bookingId}`
      }
    });
  } else {
    // Create new record as booked
    await prisma.availability.create({
      data: {
        photographer_id: photographerId,
        available_date: date,
        status: 'BOOKED',
        notes: `Booked - Booking ID: ${bookingId}`
      }
    });
  }
  
  console.log(`✅ Date marked as BOOKED`);
}

/**
 * Mark date as available again (called when booking is cancelled)
 * 
 * @param photographerId - Photographer ID
 * @param date - Date to mark as available
 */
export async function markAsAvailable(
  photographerId: string,
  date: Date
) {
  console.log(`🔓 Marking date as AVAILABLE: ${date.toISOString().split('T')[0]}`);
  
  const existing = await prisma.availability.findFirst({
    where: {
      photographer_id: photographerId,
      available_date: date
    }
  });

  if (existing) {
    await prisma.availability.update({
      where: { id: existing.id },
      data: {
        status: 'AVAILABLE',
        notes: null
      }
    });

    console.log(`✅ Date marked as AVAILABLE`);
  }
}

/**
 * Delete availability record
 * 
 * @param availabilityId - Availability ID
 * @param photographerId - Photographer ID (for permission check)
 */
export async function deleteAvailability(
  availabilityId: string,
  photographerId: string
) {
  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId }
  });
  
  if (!availability) {
    throw new Error('Availability not found');
  }

  if (availability.photographer_id !== photographerId) {
    throw new Error('You can only delete your own availability');
  }
  
  if (availability.status === 'BOOKED') {
    throw new Error('Cannot delete booked dates. Cancel the booking first.');
  }
  
  await prisma.availability.delete({
    where: { id: availabilityId }
  });
  
  console.log(`🗑️  Availability deleted: ${availabilityId}`);
}

/**
 * Search for available photographers on a specific date
 * 
 * @param date - Date to search
 * @param occasionType - Optional occasion type filter
 * @returns Array of available photographers
 */
export async function searchAvailablePhotographers(data: {
  date: Date;
  occasionType?: string;
  locationCity?: string;
}) {
  // Normalize date to ignore time component
  const searchDate = new Date(data.date);
  searchDate.setHours(0, 0, 0, 0);
  
  console.log(`🔍 Searching for available photographers on ${searchDate.toISOString().split('T')[0]}`);
  
  // Find all photographers with AVAILABLE status on this date
  const availabilities = await prisma.availability.findMany({
    where: {
      available_date: {
        gte: searchDate,
        lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) // Next day
      },
      status: 'AVAILABLE'
    },
    include: {
      photographers: {
        include: {
          users: true,
          subscriptions: true
        }
      }
    }
  });

  // Filter by occasion type if specified
  let photographers = availabilities.map(av => av.photographers);
  
  if (data.occasionType) {
    photographers = photographers.filter(p => 
      p.services.includes(data.occasionType as any)
    );
  }
  
  // Filter by location if specified
  if (data.locationCity) {
    photographers = photographers.filter(p =>
      p.users.location_city?.toLowerCase() === data.locationCity?.toLowerCase()
    );
  }

  console.log(`✅ Found ${photographers.length} available photographers`);

  return photographers.map(p => ({
    photographerId: p.id,
    userId: p.user_id,
    name: `${p.users.first_name} ${p.users.last_name}`,
    email: p.users.email,
    locationCity: p.users.location_city,
    services: p.services,
    averageRating: p.average_rating,
    hourlyRate: p.hourly_rate,
    dayRate: p.day_rate,
    subscriptionTier: p.subscriptions?.tier || 'FREE'
  }));
}

/**
 * Get photographer's upcoming booked dates
 * 
 * @param photographerId - Photographer ID
 * @param limit - Number of dates to return
 * @returns Array of booked dates
 */
export async function getUpcomingBookedDates(
  photographerId: string,
  limit: number = 10
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bookedDates = await prisma.availability.findMany({
    where: {
      photographer_id: photographerId,
      status: 'BOOKED',
      available_date: {
        gte: today
      }
    },
    orderBy: {
      available_date: 'asc'
    },
    take: limit
  });
  
  return bookedDates;
}

/**
 * HELPER FUNCTIONS
 */

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * TEACHING MOMENT: Availability System Benefits
 * 
 * For Photographers:
 * ✅ Manage schedule in one place
 * ✅ Prevent double bookings automatically
 * ✅ Set recurring availability (weekly schedule)
 * ✅ Block personal time (vacation, etc.)
 * 
 * For Clients:
 * ✅ See real-time availability
 * ✅ Only book available dates
 * ✅ Faster booking confirmation
 * ✅ Less back-and-forth communication
 * 
 * For Platform:
 * ✅ Better user experience
 * ✅ Fewer booking conflicts
 * ✅ Reduced cancellations
 * ✅ Improved search functionality
 */
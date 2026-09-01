/**
 * Availability Controller
 * HTTP handlers for availability management
 */

import { Request, Response } from 'express';
import { AvailabilityStatus } from '@prisma/client';
import * as AvailabilityService from '../services/availability.service';
import prisma from '../config/database';

/**
 * Format DateTime to time string (HH:MM)
 * Converts "1970-01-01T09:00:00.000Z" → "09:00"
 */
function formatTimeString(date: Date | null): string | null {
  if (!date) return null;
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format availability record for response
 * Converts DateTime times to clean "HH:MM" strings
 */
function formatAvailabilityResponse(availability: any) {
  return {
    ...availability,
    startTime: formatTimeString(availability.start_time),
    endTime: formatTimeString(availability.end_time)
  };
}

/**
 * Set availability for a single date
 * POST /api/availability
 */
export async function setAvailability(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { date, startTime, endTime, status, notes } = req.body;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required'
      });
      return;
    }
    
    if (!status || !['AVAILABLE', 'BLOCKED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be AVAILABLE or BLOCKED'
      });
      return;
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }
    
    const availability = await AvailabilityService.setAvailability({
      photographerId,
      availableDate: parsedDate,
      startTime,
      endTime,
      status: status as AvailabilityStatus,
      notes
    });
    
    res.status(200).json({
      success: true,
      message: 'Availability set successfully',
      data: formatAvailabilityResponse(availability)
    });
    
  } catch (error: any) {
    console.error('Set availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set availability'
    });
  }
}

/**
 * Set availability for multiple dates (bulk)
 * POST /api/availability/bulk
 */
export async function setBulkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { dates, startTime, endTime, status, notes } = req.body;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Dates array is required'
      });
      return;
    }
    
    if (!status || !['AVAILABLE', 'BLOCKED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be AVAILABLE or BLOCKED'
      });
      return;
    }
    
    // Parse all dates
    const parsedDates = dates.map(d => new Date(d));
    if (parsedDates.some(d => isNaN(d.getTime()))) {
      res.status(400).json({
        success: false,
        message: 'One or more dates are invalid'
      });
      return;
    }
    
    const availabilities = await AvailabilityService.setBulkAvailability({
      photographerId,
      dates: parsedDates,
      startTime,
      endTime,
      status: status as AvailabilityStatus,
      notes
    });
    
    res.status(200).json({
      success: true,
      message: `Availability set for ${availabilities.length} dates`,
      data: availabilities.map(formatAvailabilityResponse)
    });
    
  } catch (error: any) {
    console.error('Set bulk availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set bulk availability'
    });
  }
}

/**
 * Set recurring availability pattern
 * POST /api/availability/recurring
 * 
 * Body example:
 * {
 *   "startDate": "2026-02-01",
 *   "endDate": "2026-02-28",
 *   "daysOfWeek": [1, 3, 5],  // Monday, Wednesday, Friday
 *   "startTime": "09:00",
 *   "endTime": "17:00",
 *   "status": "AVAILABLE"
 * }
 */
export async function setRecurringAvailability(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { startDate, endDate, daysOfWeek, startTime, endTime, status, notes } = req.body;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
      return;
    }
    
    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Days of week array is required (0-6, where 0=Sunday)'
      });
      return;
    }
    
    if (!status || !['AVAILABLE', 'BLOCKED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be AVAILABLE or BLOCKED'
      });
      return;
    }
    
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }
    
    if (parsedEndDate < parsedStartDate) {
      res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
      return;
    }
    
    const availabilities = await AvailabilityService.setRecurringAvailability({
      photographerId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      daysOfWeek,
      startTime,
      endTime,
      status: status as AvailabilityStatus,
      notes
    });
    
    res.status(200).json({
      success: true,
      message: `Recurring availability set for ${availabilities.length} dates`,
      data: availabilities.map(formatAvailabilityResponse)
    });
    
  } catch (error: any) {
    console.error('Set recurring availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set recurring availability'
    });
  }
}

/**
 * Check availability for a specific date
 * GET /api/availability/check/:photographerId/:date
 */
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { photographerId, date } = req.params;
    
    if (!photographerId || !date) {
      res.status(400).json({
        success: false,
        message: 'Photographer ID and date are required'
      });
      return;
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }
    
    const result = await AvailabilityService.checkAvailability(photographerId, parsedDate);
    
    res.status(200).json({
      success: true,
      data: {
        isAvailable: result.isAvailable,
        availability: result.availability ? formatAvailabilityResponse(result.availability) : null,
        reason: result.reason
      }
    });
    
  } catch (error: any) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check availability'
    });
  }
}

/**
 * Get availability for a date range
 * GET /api/availability/range?start=2026-02-01&end=2026-02-28
 */
export async function getAvailabilityRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { start, end } = req.query;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    if (!start || !end) {
      res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
      return;
    }
    
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }
    
    const availabilities = await AvailabilityService.getAvailabilityRange(
      photographerId,
      startDate,
      endDate
    );
    
    res.status(200).json({
      success: true,
      count: availabilities.length,
      data: availabilities.map(formatAvailabilityResponse)
    });
    
  } catch (error: any) {
    console.error('Get availability range error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get availability range'
    });
  }
}

/**
 * Get month calendar view
 * GET /api/availability/calendar/:year/:month
 */
export async function getMonthCalendar(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { year, month } = req.params;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        success: false,
        message: 'Invalid year or month'
      });
      return;
    }
    
    const calendar = await AvailabilityService.getMonthCalendar(
      photographerId,
      yearNum,
      monthNum
    );
    
    // Format times in calendar days
    const formattedCalendar = {
      ...calendar,
      days: calendar.days.map(day => ({
        ...day,
        availability: day.availability ? formatAvailabilityResponse(day.availability) : null
      }))
    };
    
    res.status(200).json({
      success: true,
      data: formattedCalendar
    });
    
  } catch (error: any) {
    console.error('Get month calendar error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get month calendar'
    });
  }
}

/**
 * Delete availability
 * DELETE /api/availability/:id
 */
export async function deleteAvailability(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Availability ID is required'
      });
      return;
    }
    
    await AvailabilityService.deleteAvailability(id, photographerId);
    
    res.status(200).json({
      success: true,
      message: 'Availability deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Delete availability error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete availability'
    });
  }
}

/**
 * Search for available photographers
 * GET /api/availability/search?date=2026-02-15&occasionType=WEDDING&locationCity=Accra
 */
export async function searchAvailablePhotographers(req: Request, res: Response): Promise<void> {
  try {
    const { date, occasionType, locationCity } = req.query;
    
    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required'
      });
      return;
    }
    
    const parsedDate = new Date(date as string);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
      return;
    }
    
    const photographers = await AvailabilityService.searchAvailablePhotographers({
      date: parsedDate,
      occasionType: occasionType as string,
      locationCity: locationCity as string
    });
    
    res.status(200).json({
      success: true,
      count: photographers.length,
      data: photographers
    });
    
  } catch (error: any) {
    console.error('Search available photographers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search photographers'
    });
  }
}

/**
 * Get upcoming booked dates
 * GET /api/availability/upcoming-bookings
 */
export async function getUpcomingBookedDates(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get photographer record for this user
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    const photographerId = photographer.id;
    
    const bookedDates = await AvailabilityService.getUpcomingBookedDates(
      photographerId,
      limit
    );
    
    res.status(200).json({
      success: true,
      count: bookedDates.length,
      data: bookedDates.map(formatAvailabilityResponse)
    });
    
  } catch (error: any) {
    console.error('Get upcoming booked dates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get upcoming bookings'
    });
  }
}

/**
 * TEACHING MOMENT: Availability API Design
 * 
 * We provide multiple ways to set availability:
 * 
 * 1. SINGLE DATE
 *    POST /api/availability
 *    - Quick one-off availability setting
 * 
 * 2. BULK DATES
 *    POST /api/availability/bulk
 *    - Set multiple specific dates at once
 *    - Good for: "I'm available Feb 1, 5, 10, 15"
 * 
 * 3. RECURRING PATTERN
 *    POST /api/availability/recurring
 *    - Set weekly schedule
 *    - Good for: "Available every Mon/Wed/Fri for next month"
 * 
 * This flexibility makes the system easy to use for photographers!
 */
/**
 * User Controller
 * Handles user profile operations (requires authentication)
 */

import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Get current user's profile
 * GET /api/users/me
 * 
 * TEACHING MOMENT: Protected Route
 * 
 * This route requires authentication
 * The authenticate middleware runs BEFORE this function
 * So we know req.user exists and contains valid user data
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    /**
     * STEP 1: Get user ID from authenticated request
     * 
     * TEACHING MOMENT: How do we know who's requesting?
     * 
     * req.user was set by authenticate middleware!
     * It contains: { userId, email, userType }
     * 
     * We use ! (non-null assertion) because TypeScript thinks
     * req.user might be undefined, but we KNOW it exists
     * (the middleware wouldn't call next() if it didn't)
     */
    const userId = req.user!.user_id;
    
    /**
     * STEP 2: Fetch full user data from database
     * 
     * TEACHING MOMENT: Why fetch from database?
     * 
     * JWT token only contains basic info (id, email, userType)
     * To get full profile (phone, location, etc.), we query database
     */
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        profile_image_url: true,
        location_city: true,
        location_country: true,
        user_type: true,
        is_verified: true,
        is_active: true,
        created_at: true,
        // Include photographer profile if user is a photographer
        photographers: {
          select: {
            id: true,
            bio: true,
            services: true,
            years_experience: true,
            hourly_rate: true,
            day_rate: true,
            portfolio_website: true,
            instagram_handle: true,
            verification_status: true,
            average_rating: true,
            total_bookings: true,
            subscriptions: {
              select: {
                tier: true,
                monthly_price: true,
                commission_rate: true,
                status: true,
                end_date: true
              }
            }
          }
        }
      }
    });
    
    /**
     * STEP 3: Handle user not found
     * 
     * This shouldn't happen (token has valid userId),
     * but good to check anyway!
     */
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    /**
     * STEP 4: Return user profile
     */
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
}

/**
 * Update current user's profile
 * PATCH /api/users/me
 * 
 * TEACHING MOMENT: PATCH vs PUT
 * 
 * PATCH - Update partial data (send only fields to change)
 * PUT - Replace entire resource (send all fields)
 * 
 * We use PATCH because user might only update their name,
 * not their entire profile
 */
export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    /**
     * STEP 1: Extract allowed fields from request body
     * 
     * TEACHING MOMENT: Data validation & security
     * 
     * We only allow updating certain fields
     * Users shouldn't be able to update:
     * - id (never!)
     * - email (requires verification flow)
     * - userType (security!)
     * - isVerified (only admin can do this)
     */
    const {
      firstName,
      lastName,
      phoneNumber,
      locationCity,
      locationCountry,
      profileImageUrl  // In real app, this would be uploaded to Cloudflare R2
    } = req.body;
    
    /**
     * STEP 2: Build update object with only provided fields
     * 
     * TEACHING MOMENT: Optional fields
     * 
     * We only include fields that were actually sent
     * If firstName not in request body, we don't update it
     */
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (locationCity !== undefined) updateData.location_city = locationCity;
    if (locationCountry !== undefined) updateData.location_country = locationCountry;
    if (profileImageUrl !== undefined) updateData.profile_image_url = profileImageUrl;
    
    /**
     * STEP 3: Update user in database
     */
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        profile_image_url: true,
        location_city: true,
        location_country: true,
        user_type: true,
        is_verified: true,
        updated_at: true
      }
    });
    
    /**
     * STEP 4: Return updated profile
     */
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
}

/**
 * Example: Photographer-only endpoint
 * GET /api/users/photographer-stats
 * 
 * TEACHING MOMENT: Role-specific endpoints
 * 
 * This route will use authorize('PHOTOGRAPHER') middleware
 * Only photographers can access it
 */
export async function getPhotographerStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    /**
     * Find photographer by userId
     * (Remember: photographers table has one-to-one relationship with users)
     */
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        average_rating: true,
        total_bookings: true,
        verification_status: true,
        subscriptions: {
          select: {
            tier: true,
            commission_rate: true,
            end_date: true
          }
        },
        // Count portfolio items
        portfolio_items: {
          select: { id: true }
        }
      }
    });
    
    if (!photographer) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
      return;
    }
    
    /**
     * Calculate stats
     */
    const stats = {
      totalBookings: photographer.total_bookings,
      averageRating: photographer.average_rating,
      portfolioItemsCount: photographer.portfolio_items.length,
      verificationStatus: photographer.verification_status,
      subscription: photographer.subscriptions
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get photographer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photographer statistics'
    });
  }
}

/**
 * SUMMARY: How these controllers work with middleware
 * 
 * 1. Client sends request with JWT token in header
 * 2. authenticate middleware verifies token
 * 3. authenticate middleware sets req.user
 * 4. Controller function executes
 * 5. Controller uses req.user.userId to know who's requesting
 * 6. Controller queries database for user-specific data
 * 7. Controller returns response
 * 
 * If authentication fails at step 2, controller never executes!
 */
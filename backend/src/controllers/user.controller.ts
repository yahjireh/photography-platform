/**
 * User Controller
 * Handles user profile operations (requires authentication)
 */

import { Request, Response } from 'express';
import path from 'path';
import prisma from '../config/database';
import * as StorageService from '../services/storage.service';

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
        wallet_balance: true,
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
      profileImageUrl,
      profile_image_url
    } = req.body;
    
    /**
     * STEP 2: Build update object with only provided fields
     */
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (locationCity !== undefined) updateData.location_city = locationCity;
    if (locationCountry !== undefined) updateData.location_country = locationCountry;
    
    let imageToSave = profileImageUrl !== undefined ? profileImageUrl : profile_image_url;
    if (imageToSave && typeof imageToSave === 'string' && imageToSave.startsWith('data:image/')) {
      try {
        const matches = imageToSave.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `avatar-${userId}-${Date.now()}.${ext}`;
          imageToSave = await StorageService.uploadFile(buffer, filename, 'avatars');
          console.log(`☁️ Base64 avatar saved to storage for user ${userId}: ${imageToSave}`);
        }
      } catch (uploadErr) {
        console.error('Failed to upload base64 avatar to storage:', uploadErr);
      }
    }
    if (imageToSave !== undefined) updateData.profile_image_url = imageToSave;
    
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
 * Upload profile avatar image (multipart form-data)
 * POST /api/users/avatar
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const publicUrl = await StorageService.uploadFile(file.buffer, filename, 'avatars');

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { profile_image_url: publicUrl },
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

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded and updated successfully',
      data: {
        avatarUrl: publicUrl,
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar'
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
 * Delete current user's account and all associated resources
 * DELETE /api/users/me
 */
export async function deleteCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { reason, reason_details } = req.body || {};

    // 1. Record feedback survey in system_settings for analytics
    try {
      const existingSettings = await prisma.system_settings.findUnique({
        where: { key: 'account_deletion_feedback' }
      });
      const logs = existingSettings && Array.isArray(existingSettings.value) ? (existingSettings.value as any[]) : [];
      logs.push({
        userId,
        reason: reason || 'Not specified',
        details: reason_details || '',
        deletedAt: new Date().toISOString()
      });
      await prisma.system_settings.upsert({
        where: { key: 'account_deletion_feedback' },
        create: { key: 'account_deletion_feedback', value: logs },
        update: { value: logs }
      });
    } catch (feedbackErr) {
      console.warn('Could not record account deletion feedback:', feedbackErr);
    }

    // 2. Cascade delete bookings and related items if any exist
    const userBookings = await prisma.bookings.findMany({
      where: {
        OR: [
          { client_id: userId },
          { photographer_id: userId }
        ]
      },
      select: { id: true }
    });
    const bookingIds = userBookings.map(b => b.id);

    if (bookingIds.length > 0) {
      await prisma.booking_photos.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.payments.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.reviews.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.disputes.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.messages.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.bookings.deleteMany({ where: { id: { in: bookingIds } } });
    }

    // Direct user messages, reviews, disputes
    await prisma.messages.deleteMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }]
      }
    });
    await prisma.reviews.deleteMany({
      where: {
        OR: [{ reviewer_id: userId }, { reviewee_id: userId }]
      }
    });
    await prisma.disputes.deleteMany({
      where: {
        OR: [{ raised_by_id: userId }, { raised_against_id: userId }, { resolved_by_id: userId }]
      }
    });

    // 3. Clean up photographer-specific dependencies if user is a photographer
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId }
    });

    if (photographer) {
      // Delete availability, packages, portfolio, subscriptions, paystack subaccount
      await prisma.availability.deleteMany({ where: { photographer_id: photographer.id } });
      await prisma.packages.deleteMany({ where: { photographer_id: photographer.id } });
      await prisma.portfolio_items.deleteMany({ where: { photographer_id: photographer.id } });
      await prisma.subscriptions.deleteMany({ where: { photographer_id: photographer.id } });
      await prisma.paystack_subaccounts.deleteMany({ where: { photographer_id: photographer.id } });

      // Clean up KYC records
      const kyc = await prisma.photographer_kyc.findUnique({
        where: { photographer_id: photographer.id }
      });
      if (kyc) {
        await prisma.photographer_kyc_documents.deleteMany({ where: { kyc_id: kyc.id } });
        await prisma.photographer_kyc_audit.deleteMany({ where: { kyc_id: kyc.id } });
        await prisma.photographer_kyc.delete({ where: { id: kyc.id } });
      }

      await prisma.photographers.delete({ where: { id: photographer.id } });
    }

    // 4. Clean up user payment methods, notifications, and transactions
    await prisma.user_payment_methods.deleteMany({ where: { user_id: userId } });
    await prisma.notifications.deleteMany({ where: { user_id: userId } });
    await prisma.wallet_transactions.deleteMany({ where: { user_id: userId } });

    // 5. Finally delete the user account
    await prisma.users.delete({
      where: { id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully and permanently deleted'
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
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
/**
 * Photographer Controller
 * Handles HTTP requests for photographer operations
 */

import { Request, Response } from 'express';
import {
  updatePhotographerProfile,
  getOwnPhotographerProfile,
  getPhotographerPublicProfile,
  searchPhotographers,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../services/photographer.service';
import { OccasionType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * TEACHING MOMENT: Controller Responsibilities
 * 
 * Controllers:
 * 1. Extract data from request (body, params, query)
 * 2. Validate input
 * 3. Call service to do the work
 * 4. Send HTTP response
 * 
 * Controllers should be thin - most logic is in services!
 */

/**
 * Update photographer profile
 * PATCH /api/photographers/profile
 * 
 * PROTECTED: Must be logged in as photographer
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    /**
     * TEACHING MOMENT: Data Validation
     * 
     * Validate input before passing to service
     * Catch bad data early with clear error messages
     */
    const {
      bio,
      services,
      equipmentList,
      yearsExperience,
      hourlyRate,
      dayRate,
      portfolioWebsite,
      instagramHandle
    } = req.body;
    
    // Validate services array if provided
    if (services && !Array.isArray(services)) {
      res.status(400).json({
        success: false,
        message: 'Services must be an array'
      });
      return;
    }
    
    // Validate equipment list if provided
    if (equipmentList && !Array.isArray(equipmentList)) {
      res.status(400).json({
        success: false,
        message: 'Equipment list must be an array'
      });
      return;
    }
    
    // Validate numeric fields
    if (yearsExperience !== undefined && (yearsExperience < 0 || yearsExperience > 100)) {
      res.status(400).json({
        success: false,
        message: 'Years of experience must be between 0 and 100'
      });
      return;
    }
    
    if (hourlyRate !== undefined && hourlyRate < 0) {
      res.status(400).json({
        success: false,
        message: 'Hourly rate cannot be negative'
      });
      return;
    }
    
    if (dayRate !== undefined && dayRate < 0) {
      res.status(400).json({
        success: false,
        message: 'Day rate cannot be negative'
      });
      return;
    }
    
    /**
     * Call service to update profile
     */
    const updated = await updatePhotographerProfile(userId, {
      bio,
      services,
      equipmentList,
      yearsExperience,
      hourlyRate,
      dayRate,
      portfolioWebsite,
      instagramHandle
    });
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated
    });
    
  } catch (error) {
    console.error('Update photographer profile error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
}

/**
 * Get own photographer profile (private - full details)
 * GET /api/photographers/me
 * 
 * PROTECTED: Must be logged in as photographer
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    const profile = await getOwnPhotographerProfile(userId);
    
    res.status(200).json({
      success: true,
      data: profile
    });
    
  } catch (error) {
    console.error('Get photographer profile error:', error);
    
    if (error instanceof Error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  }
}

/**
 * Get photographer public profile
 * GET /api/photographers/:id
 * 
 * PUBLIC: Anyone can view
 */
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    /**
     * TEACHING MOMENT: Route Parameters
     * 
     * URL: /api/photographers/abc123
     * req.params.id = "abc123"
     * 
     * This is how we get dynamic values from URL!
     */
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Photographer ID is required'
      });
      return;
    }
    
    const profile = await getPhotographerPublicProfile(id);
    
    res.status(200).json({
      success: true,
      data: profile
    });
    
  } catch (error) {
    console.error('Get public profile error:', error);
    
    if (error instanceof Error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  }
}

/**
 * Search photographers
 * GET /api/photographers/search
 * 
 * PUBLIC: Anyone can search
 * 
 * Query parameters:
 * - locationCity: Filter by city
 * - occasionType: Filter by service type
 * - minRating: Minimum average rating
 * - maxHourlyRate: Maximum hourly rate
 * - limit: Results per page (default 20)
 * - offset: Pagination offset
 */
export async function searchPhotographersController(req: Request, res: Response): Promise<void> {
  try {
    /**
     * TEACHING MOMENT: Query Parameters
     * 
     * URL: /api/photographers/search?locationCity=Accra&minRating=4
     * req.query = { locationCity: 'Accra', minRating: '4' }
     * 
     * Note: All query params are strings! Need to parse numbers.
     */
    const {
      locationCity,
      occasionType,
      minRating,
      maxHourlyRate,
      limit,
      offset
    } = req.query;
    
    /**
     * Parse and validate query parameters
     */
    const filters: any = {};
    
    if (locationCity) filters.locationCity = locationCity as string;
    
    if (occasionType) {
      // Validate occasion type
      const validTypes = Object.values(OccasionType);
      if (!validTypes.includes(occasionType as OccasionType)) {
        res.status(400).json({
          success: false,
          message: `Invalid occasion type. Must be one of: ${validTypes.join(', ')}`
        });
        return;
      }
      filters.occasionType = occasionType as OccasionType;
    }
    
    if (minRating) {
      const rating = parseFloat(minRating as string);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        res.status(400).json({
          success: false,
          message: 'Minimum rating must be between 0 and 5'
        });
        return;
      }
      filters.minRating = rating;
    }
    
    if (maxHourlyRate) {
      const rate = parseFloat(maxHourlyRate as string);
      if (isNaN(rate) || rate < 0) {
        res.status(400).json({
          success: false,
          message: 'Maximum hourly rate must be a positive number'
        });
        return;
      }
      filters.maxHourlyRate = rate;
    }
    
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
        return;
      }
      filters.limit = limitNum;
    }
    
    if (offset) {
      const offsetNum = parseInt(offset as string);
      if (isNaN(offsetNum) || offsetNum < 0) {
        res.status(400).json({
          success: false,
          message: 'Offset must be a non-negative number'
        });
        return;
      }
      filters.offset = offsetNum;
    }
    
    /**
     * Execute search
     */
    const photographers = await searchPhotographers(filters);
    
    res.status(200).json({
      success: true,
      count: photographers.length,
      data: photographers
    });
    
  } catch (error) {
    console.error('Search photographers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search photographers'
    });
  }
}

/**
 * Add portfolio item
 * POST /api/photographers/portfolio
 * 
 * PROTECTED: Must be logged in as photographer
 */
export async function addPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    
    const {
      imageUrl,
      thumbnailUrl,
      title,
      description,
      occasionType,
      isFeatured
    } = req.body;
    
    /**
     * Validate required fields
     */
    if (!imageUrl || !thumbnailUrl || !occasionType) {
      res.status(400).json({
        success: false,
        message: 'Image URL, thumbnail URL, and occasion type are required'
      });
      return;
    }
    
    /**
     * Validate occasion type
     */
    const validTypes = Object.values(OccasionType);
    if (!validTypes.includes(occasionType)) {
      res.status(400).json({
        success: false,
        message: `Invalid occasion type. Must be one of: ${validTypes.join(', ')}`
      });
      return;
    }
    
    /**
     * TEACHING MOMENT: Future Enhancement
     * 
     * In production, imageUrl and thumbnailUrl would come from:
     * 1. Client uploads image file
     * 2. Backend uploads to Cloudflare R2
     * 3. R2 returns URL
     * 4. URL saved to database
     * 
     * For now, we accept URLs directly for testing
     */
    
    const portfolioItem = await addPortfolioItem(userId, {
      imageUrl,
      thumbnailUrl,
      title,
      description,
      occasionType,
      isFeatured
    });
    
    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      data: portfolioItem
    });
    
  } catch (error) {
    console.error('Add portfolio item error:', error);
    
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add portfolio item'
      });
    }
  }
}

/**
 * Update portfolio item
 * PATCH /api/photographers/portfolio/:id
 * 
 * PROTECTED: Must be logged in as photographer (owner)
 */
export async function updatePortfolio(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Portfolio item ID is required'
      });
      return;
    }
    
    const { title, description, occasionType, isFeatured } = req.body;
    
    /**
     * Validate occasion type if provided
     */
    if (occasionType) {
      const validTypes = Object.values(OccasionType);
      if (!validTypes.includes(occasionType)) {
        res.status(400).json({
          success: false,
          message: `Invalid occasion type. Must be one of: ${validTypes.join(', ')}`
        });
        return;
      }
    }
    
    const updated = await updatePortfolioItem(userId, id, {
      title,
      description,
      occasionType,
      isFeatured
    });
    
    res.status(200).json({
      success: true,
      message: 'Portfolio item updated successfully',
      data: updated
    });
    
  } catch (error) {
    console.error('Update portfolio item error:', error);
    
    if (error instanceof Error) {
      const status = error.message.includes('permission') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update portfolio item'
      });
    }
  }
}

/**
 * Delete portfolio item
 * DELETE /api/photographers/portfolio/:id
 * 
 * PROTECTED: Must be logged in as photographer (owner)
 */
export async function deletePortfolio(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Portfolio item ID is required'
      });
      return;
    }
    
    await deletePortfolioItem(userId, id);
    
    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    
    if (error instanceof Error) {
      const status = error.message.includes('permission') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete portfolio item'
      });
    }
  }
}

/**
 * Submit Photographer KYC
 * POST /api/photographers/kyc
 */
export async function submitKYC(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const {
      businessName,
      businessType,
      registeredCity,
      ghanaCardNumber,
      ghanaCardFront,
      ghanaCardBack,
      tinNumber: _tinNumber,
      yearsExperience,
      portfolioLinks,
      preferredBank,
      accountNumber,
      categories,
      equipmentList
    } = req.body;

    // 1. Get or create photographer
    let photographer = await prisma.photographers.findUnique({
      where: { user_id: userId },
      include: { users: true }
    });

    if (!photographer) {
      photographer = await prisma.photographers.create({
        data: {
          user_id: userId,
          bio: `${businessName || 'Artisan Studio'} • ${businessType || 'Solo Independent'}`,
          verification_status: 'PENDING',
          portfolio_website: portfolioLinks || '',
          equipment_list: equipmentList || []
        },
        include: { users: true }
      });
    } else {
      await prisma.photographers.update({
        where: { id: photographer.id },
        data: {
          bio: `${businessName || photographer.bio || 'Artisan Studio'} • ${businessType || 'Solo Independent'}`,
          portfolio_website: portfolioLinks || photographer.portfolio_website,
          equipment_list: equipmentList || photographer.equipment_list,
          verification_status: 'PENDING'
        }
      });
    }

    const user = photographer.users;
    const now = new Date();

    // Map experience
    let expEnum: any = 'TWO_FOUR';
    if (yearsExperience && yearsExperience.includes('10+')) expEnum = 'TEN_PLUS';
    else if (yearsExperience && (yearsExperience.includes('5-9') || yearsExperience.includes('5'))) expEnum = 'FIVE_NINE';
    else if (yearsExperience && yearsExperience.includes('0-1')) expEnum = 'ZERO_ONE';

    // Map payout method
    const isMomo = !preferredBank || preferredBank.toLowerCase().includes('momo') || preferredBank.toLowerCase().includes('mobile') || preferredBank.toLowerCase().includes('mtn');
    const payoutMethod = isMomo ? 'MOMO' : 'BANK';
    const momoNet = preferredBank?.toLowerCase().includes('telecel') || preferredBank?.toLowerCase().includes('vodafone') ? 'VODAFONE' : (preferredBank?.toLowerCase().includes('airtel') ? 'AIRTELTIGO' : 'MTN');

    // 2. Upsert photographer_kyc
    const kyc = await prisma.photographer_kyc.upsert({
      where: { photographer_id: photographer.id },
      create: {
        photographer_id: photographer.id,
        user_id: userId,
        kyc_status: 'SUBMITTED',
        submitted_at: now,
        last_updated_at: now,
        legal_name: `${user.first_name} ${user.last_name}`,
        date_of_birth: new Date('2000-01-01'),
        nationality: 'Ghana',
        id_type: 'GHANA_CARD',
        id_number: ghanaCardNumber || 'PENDING_VERIFICATION',
        email: user.email,
        email_verified: user.is_verified,
        phone: user.phone_number || accountNumber || 'N/A',
        phone_verified: !!user.phone_number,
        city: registeredCity || user.location_city || 'Accra',
        region: 'Greater Accra',
        categories: (categories && categories.length > 0) ? categories : ['PORTRAIT', 'WEDDING'],
        years_experience: expEnum,
        portfolio_link: portfolioLinks || photographer.portfolio_website || '',
        payout_method: payoutMethod,
        account_holder_name: `${user.first_name} ${user.last_name}`,
        bank_name: isMomo ? null : preferredBank,
        bank_account_number: isMomo ? null : accountNumber,
        momo_network: isMomo ? momoNet : null,
        momo_number: isMomo ? (accountNumber || user.phone_number || '') : null,
        is_search_visible: true,
        can_accept_bookings: true,
        can_receive_payouts: true
      },
      update: {
        kyc_status: 'SUBMITTED',
        submitted_at: now,
        last_updated_at: now,
        id_number: ghanaCardNumber || undefined,
        city: registeredCity || undefined,
        portfolio_link: portfolioLinks || undefined,
        payout_method: payoutMethod,
        bank_name: isMomo ? null : preferredBank,
        bank_account_number: isMomo ? null : accountNumber,
        momo_network: isMomo ? momoNet : null,
        momo_number: isMomo ? accountNumber : null
      }
    });

    // 3. Insert documents if provided
    if (ghanaCardFront && typeof ghanaCardFront === 'string' && ghanaCardFront.length > 10) {
      await prisma.photographer_kyc_documents.create({
        data: {
          photographer_id: photographer.id,
          kyc_id: kyc.id,
          document_type: 'GHANA_CARD_FRONT',
          file_name: 'ghana_card_front.jpg',
          file_url: ghanaCardFront,
          is_verified: false
        }
      });
    }

    if (ghanaCardBack && typeof ghanaCardBack === 'string' && ghanaCardBack.length > 10) {
      await prisma.photographer_kyc_documents.create({
        data: {
          photographer_id: photographer.id,
          kyc_id: kyc.id,
          document_type: 'GHANA_CARD_BACK',
          file_name: 'ghana_card_back.jpg',
          file_url: ghanaCardBack,
          is_verified: false
        }
      });
    }

    // 4. Audit entry
    await prisma.photographer_kyc_audit.create({
      data: {
        photographer_id: photographer.id,
        kyc_id: kyc.id,
        event_type: 'submitted',
        field_name: 'kyc_status',
        old_value: 'DRAFT',
        new_value: 'SUBMITTED',
        admin_user_id: userId,
        admin_name: `${user.first_name} ${user.last_name}`,
        action_notes: 'KYC on-boarding completed by photographer applicant.'
      }
    });

    res.status(200).json({
      success: true,
      message: 'KYC submission received successfully',
      data: kyc
    });
  } catch (error: any) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC verification',
      error: error.message
    });
  }
}

/**
 * TEACHING MOMENT: Error Handling Pattern
 * 
 * All controllers follow same pattern:
 * 
 * try {
 *   1. Extract data from request
 *   2. Validate input
 *   3. Call service
 *   4. Send success response
 * } catch (error) {
 *   5. Log error
 *   6. Check error type
 *   7. Send appropriate error response
 * }
 * 
 * This consistent pattern makes code predictable and maintainable!
 */
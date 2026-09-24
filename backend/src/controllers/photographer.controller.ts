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
      instagramHandle,
      service_area,
      serviceArea,
      region,
      business_name,
      businessName,
      emergency_contact_name,
      emergencyContactName,
      emergency_contact_phone,
      emergencyContactPhone
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
      instagramHandle,
      service_area,
      serviceArea,
      region,
      business_name,
      businessName,
      emergency_contact_name,
      emergencyContactName,
      emergency_contact_phone,
      emergencyContactPhone
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
 * Get Current Photographer KYC status & draft data
 * GET /api/photographers/kyc/me
 */
export async function getMyKYC(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId },
      include: {
        photographer_kyc: {
          include: {
            documents: {
              where: { deleted_at: null }
            }
          }
        },
        packages: true,
        users: true
      }
    });

    if (!photographer) {
      res.status(404).json({ success: false, message: 'Photographer not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        photographer,
        kyc: photographer.photographer_kyc,
        packages: photographer.packages,
        documents: photographer.photographer_kyc?.documents || [],
        user: photographer.users
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Submit / Update Photographer KYC (Supports progressive step saving)
 * POST /api/photographers/kyc
 */
export async function submitKYC(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const {
      businessName,
      businessType,
      registeredCity,
      region,
      serviceArea,
      dateOfBirth,
      ghanaCardNumber,
      ghanaCardFront,
      ghanaCardBack,
      faceVerificationVideo,
      yearsExperience,
      portfolioLinks,
      preferredBank,
      accountNumber,
      accountName,
      emergencyContactName,
      emergencyContactPhone,
      categories,
      packages,
      isDraft = false
    } = req.body;

    // 1. Get or create photographer profile
    let photographer = await prisma.photographers.findUnique({
      where: { user_id: userId },
      include: { users: true }
    });

    if (!photographer) {
      photographer = await prisma.photographers.create({
        data: {
          user_id: userId,
          business_name: businessName || null,
          service_area: serviceArea || registeredCity || 'Accra',
          region: region || 'Greater Accra',
          bio: `${businessName || 'Artisan Studio'} • ${businessType || 'Solo Independent'}`,
          verification_status: 'PENDING',
          portfolio_website: portfolioLinks || '',
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          services: (categories && categories.length > 0) ? categories : ['PORTRAIT', 'WEDDING']
        },
        include: { users: true }
      });
    } else {
      photographer = await prisma.photographers.update({
        where: { id: photographer.id },
        data: {
          business_name: businessName || photographer.business_name,
          service_area: serviceArea || registeredCity || photographer.service_area,
          region: region || photographer.region,
          bio: businessName ? `${businessName} • ${businessType || 'Solo Independent'}` : photographer.bio,
          portfolio_website: portfolioLinks || photographer.portfolio_website,
          emergency_contact_name: emergencyContactName || photographer.emergency_contact_name,
          emergency_contact_phone: emergencyContactPhone || photographer.emergency_contact_phone,
          services: (categories && categories.length > 0) ? categories : photographer.services,
          verification_status: 'PENDING'
        },
        include: { users: true }
      });
    }

    if (!photographer || !photographer.users) {
      res.status(404).json({
        success: false,
        message: 'Photographer profile or user account not found'
      });
      return;
    }

    const user = photographer.users;
    const now = new Date();

    // Map experience enum safely
    let expEnum: any = 'TWO_FOUR';
    if (yearsExperience) {
      if (yearsExperience.includes('10+')) expEnum = 'TEN_PLUS';
      else if (yearsExperience.includes('5-9') || yearsExperience.includes('5-10') || yearsExperience.includes('5')) expEnum = 'FIVE_NINE';
      else if (yearsExperience.includes('0-1') || yearsExperience.includes('1-2')) expEnum = 'ZERO_ONE';
    }

    // Map payout method
    const isMomo = !preferredBank || preferredBank.toLowerCase().includes('momo') || preferredBank.toLowerCase().includes('mobile') || preferredBank.toLowerCase().includes('mtn') || preferredBank.toLowerCase().includes('telecel') || preferredBank.toLowerCase().includes('vodafone') || preferredBank.toLowerCase().includes('airtel');
    const payoutMethod = isMomo ? 'MOMO' : 'BANK';
    let momoNet: any = 'MTN';
    if (preferredBank?.toLowerCase().includes('telecel') || preferredBank?.toLowerCase().includes('vodafone')) {
      momoNet = 'VODAFONE';
    } else if (preferredBank?.toLowerCase().includes('airtel') || preferredBank?.toLowerCase().includes('tigo')) {
      momoNet = 'AIRTELTIGO';
    }

    const kycStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    // Parse date of birth safely
    let parsedDob: Date = new Date('1998-01-01');
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    // 2. Upsert photographer_kyc
    const kyc = await prisma.photographer_kyc.upsert({
      where: { photographer_id: photographer.id },
      create: {
        photographer_id: photographer.id,
        user_id: userId,
        kyc_status: kycStatus,
        submitted_at: isDraft ? null : now,
        last_updated_at: now,
        legal_name: `${user.first_name} ${user.last_name}`,
        date_of_birth: parsedDob,
        nationality: 'Ghana',
        id_type: 'GHANA_CARD',
        id_number: ghanaCardNumber || 'PENDING_ENTRY',
        email: user.email,
        email_verified: !!user.is_verified,
        phone: user.phone_number || accountNumber || 'N/A',
        phone_verified: !!user.is_verified,
        city: registeredCity || user.location_city || 'Accra',
        region: region || 'Greater Accra',
        service_area: serviceArea || `${registeredCity || 'Accra'} & Surrounding`,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        categories: (categories && categories.length > 0) ? categories : ['PORTRAIT', 'MOBILE_PHOTOGRAPHY'],
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
        kyc_status: kycStatus,
        submitted_at: isDraft ? undefined : now,
        last_updated_at: now,
        date_of_birth: dateOfBirth ? parsedDob : undefined,
        id_number: ghanaCardNumber || undefined,
        city: registeredCity || undefined,
        region: region || undefined,
        service_area: serviceArea || undefined,
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
        portfolio_link: portfolioLinks || undefined,
        categories: (categories && categories.length > 0) ? categories : undefined,
        legal_name: businessName || undefined,
        account_holder_name: accountName || undefined,
        payout_method: payoutMethod,
        bank_name: isMomo ? null : preferredBank,
        bank_account_number: isMomo ? null : accountNumber,
        momo_network: isMomo ? momoNet : null,
        momo_number: isMomo ? (accountNumber || undefined) : null
      }
    });

    // 3. Insert or update documents
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

    if (faceVerificationVideo && typeof faceVerificationVideo === 'string' && faceVerificationVideo.length > 10) {
      await prisma.photographer_kyc_documents.create({
        data: {
          photographer_id: photographer.id,
          kyc_id: kyc.id,
          document_type: 'FACE_VERIFICATION_VIDEO',
          file_name: 'biometric_liveness_video.webm',
          file_url: faceVerificationVideo,
          is_verified: false
        }
      });
    }

    // 4. Save Packages if provided
    if (Array.isArray(packages) && packages.length > 0) {
      for (const pkg of packages) {
        if (pkg.name && pkg.price) {
          // If pkg has an existing ID, update it; otherwise create
          if (pkg.id && !pkg.id.startsWith('temp-')) {
            await prisma.packages.update({
              where: { id: pkg.id },
              data: {
                name: pkg.name,
                description: pkg.description || '',
                occasion_type: pkg.occasionType || 'PORTRAIT',
                price: Number(pkg.price),
                delivery_days: Number(pkg.deliveryDays || 7),
                features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? [pkg.features] : []),
                image_url: pkg.imageUrl || pkg.image_url || null
              }
            }).catch(() => null);
          } else {
            await prisma.packages.create({
              data: {
                photographer_id: photographer.id,
                name: pkg.name,
                description: pkg.description || '',
                occasion_type: pkg.occasionType || 'PORTRAIT',
                price: Number(pkg.price),
                delivery_days: Number(pkg.deliveryDays || 7),
                features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? [pkg.features] : []),
                image_url: pkg.imageUrl || pkg.image_url || null
              }
            });
          }
        }
      }

      // If photographer has packages and no hourly_rate, set hourly_rate to lowest package rate
      const validPackagePrices = packages
        .map(p => Number(p.price))
        .filter(pr => !isNaN(pr) && pr > 0);
      if (validPackagePrices.length > 0 && (!photographer.hourly_rate || Number(photographer.hourly_rate) <= 0)) {
        const minPackagePrice = Math.min(...validPackagePrices);
        await prisma.photographers.update({
          where: { id: photographer.id },
          data: { hourly_rate: minPackagePrice }
        }).catch(() => null);
      }
    }

    // 5. Audit entry
    await prisma.photographer_kyc_audit.create({
      data: {
        photographer_id: photographer.id,
        kyc_id: kyc.id,
        event_type: isDraft ? 'draft_saved' : 'submitted',
        field_name: 'kyc_status',
        old_value: 'DRAFT',
        new_value: kycStatus,
        admin_user_id: userId,
        admin_name: `${user.first_name} ${user.last_name}`,
        action_notes: isDraft ? 'Progressive KYC draft saved' : 'KYC application submitted by photographer.'
      }
    });

    res.status(200).json({
      success: true,
      message: isDraft ? 'KYC draft saved successfully' : 'KYC submission received successfully',
      data: kyc
    });
  } catch (error: any) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process KYC verification',
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
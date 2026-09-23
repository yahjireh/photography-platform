/**
 * Photographer Service
 * Business logic for photographer profile and portfolio management
 */

import prisma from '../config/database';
import { OccasionType } from '@prisma/client';

/**
 * TEACHING MOMENT: Service Layer Pattern
 * 
 * Services contain the business logic and database operations
 * Controllers call services to do the actual work
 * 
 * Benefits:
 * - Reusable logic (can be called from different controllers)
 * - Easier to test
 * - Separation of concerns
 */

/**
 * Interface for updating photographer profile
 */
interface UpdatePhotographerProfileData {
  bio?: string;
  services?: OccasionType[];
  equipmentList?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  dayRate?: number;
  portfolioWebsite?: string;
  instagramHandle?: string;
  service_area?: string;
  serviceArea?: string;
  region?: string;
  business_name?: string;
  businessName?: string;
  emergency_contact_name?: string;
  emergencyContactName?: string;
  emergency_contact_phone?: string;
  emergencyContactPhone?: string;
}

/**
 * Interface for creating portfolio item
 */
interface CreatePortfolioItemData {
  imageUrl: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;
  occasionType: OccasionType;
  isFeatured?: boolean;
}

/**
 * Update photographer profile
 * 
 * @param userId - User ID of the photographer
 * @param data - Profile data to update
 * @returns Updated photographer profile
 */
export async function updatePhotographerProfile(
  userId: string,
  data: UpdatePhotographerProfileData
) {
  /**
   * TEACHING MOMENT: Find or Create Pattern
   * 
   * We need to find the photographer record by userId
   * Remember: User and Photographer are separate tables with 1-to-1 relationship
   */
  
  // First, find the photographer by userId
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });
  
  if (!photographer) {
    throw new Error('Photographer profile not found');
  }
  
  /**
   * TEACHING MOMENT: Partial Updates
   * 
   * We only update fields that were provided
   * Build update object with only non-undefined values
   */
  const updateData: any = {};
  
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.services !== undefined) updateData.services = data.services;
  if (data.equipmentList !== undefined) updateData.equipment_list = data.equipmentList;
  if (data.yearsExperience !== undefined) updateData.years_experience = data.yearsExperience;
  if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
  if (data.dayRate !== undefined) updateData.day_rate = data.dayRate;
  if (data.portfolioWebsite !== undefined) updateData.portfolio_website = data.portfolioWebsite;
  if (data.instagramHandle !== undefined) updateData.instagram_handle = data.instagramHandle;
  if (data.service_area !== undefined || data.serviceArea !== undefined) {
    updateData.service_area = data.service_area || data.serviceArea;
  }
  if (data.region !== undefined) updateData.region = data.region;
  if (data.business_name !== undefined || data.businessName !== undefined) {
    updateData.business_name = data.business_name || data.businessName;
  }
  if (data.emergency_contact_name !== undefined || data.emergencyContactName !== undefined) {
    updateData.emergency_contact_name = data.emergency_contact_name || data.emergencyContactName;
  }
  if (data.emergency_contact_phone !== undefined || data.emergencyContactPhone !== undefined) {
    updateData.emergency_contact_phone = data.emergency_contact_phone || data.emergencyContactPhone;
  }
  
  /**
   * Update the photographer profile
   */
  const updatedPhotographer = await prisma.photographers.update({
    where: { id: photographer.id },
    data: updateData,
    include: {
      users: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          location_city: true,
          location_country: true,
          profile_image_url: true
        }
      },
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
  });
  
  return updatedPhotographer;
}

/**
 * Get photographer profile by user ID (for the photographer themselves)
 * Includes private information
 * 
 * @param userId - User ID of the photographer
 * @returns Photographer profile with full details
 */
export async function getOwnPhotographerProfile(userId: string) {
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: userId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          profile_image_url: true,
          location_city: true,
          location_country: true,
          is_verified: true,
          created_at: true
        }
      },
      subscriptions: true,
      portfolio_items: {
        orderBy: [
          { is_featured: 'desc' },  // Featured items first
          { display_order: 'asc' },
          { created_at: 'desc' }
        ]
      },
      paystack_subaccounts: true,
      photographer_kyc: true
    }
  });
  
  if (!photographer) {
    throw new Error('Photographer profile not found');
  }
  
  return photographer;
}

/**
 * Get photographer profile by ID (public view)
 * Only includes public information
 * 
 * @param photographerId - Photographer ID
 * @returns Public photographer profile
 */
export async function getPhotographerPublicProfile(photographerId: string) {
  /**
   * TEACHING MOMENT: Public vs Private Data
   * 
   * When showing photographer profile to potential clients:
   * - Include: bio, portfolio, ratings, services, pricing
   * - Exclude: email, phone, subscription details, payment info
   */
  const photographer = await prisma.photographers.findUnique({
    where: { id: photographerId },
    select: {
      id: true,
      bio: true,
      services: true,
      equipment_list: true,
      years_experience: true,
      hourly_rate: true,
      day_rate: true,
      portfolio_website: true,
      instagram_handle: true,
      verification_status: true,
      average_rating: true,
      total_bookings: true,
      created_at: true,
      users: {
        select: {
          first_name: true,
          last_name: true,
          profile_image_url: true,
          location_city: true,
          location_country: true
        }
      },
      portfolio_items: {
        orderBy: [
          { is_featured: 'desc' },
          { display_order: 'asc' },
          { created_at: 'desc' }
        ]
      },
      subscriptions: {
        select: {
          tier: true  // Show tier (FREE, PRO, ENTERPRISE) for credibility
        }
      }
    }
  });
  
  if (!photographer) {
    throw new Error('Photographer not found');
  }
  
  return photographer;
}

/**
 * Search photographers by location and filters
 * 
 * @param filters - Search filters
 * @returns List of photographers matching criteria
 */
export async function searchPhotographers(filters: {
  locationCity?: string;
  occasionType?: OccasionType;
  minRating?: number;
  maxHourlyRate?: number;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  /**
   * TEACHING MOMENT: Dynamic Query Building
   * 
   * Build Prisma where clause based on provided filters
   * Only add conditions for filters that were provided
   */
  const where: any = {
   verification_status: 'VERIFIED'  // Only show verified photographers
  };

  // Filter by location
  if (filters.locationCity) {
    where.users = {
      location_city: {
        contains: filters.locationCity,
        mode: 'insensitive'  // Case-insensitive search
      }
    };
  }
  
  // Filter by service type
  if (filters.occasionType) {
    where.services = {
      has: filters.occasionType
    };
  }
  
  // Filter by minimum rating
  if (filters.minRating) {
    where.average_rating = {
      gte: filters.minRating
    };
  }

  // Filter by maximum hourly rate
  if (filters.maxHourlyRate) {
    where.hourly_rate = {
      lte: filters.maxHourlyRate
    };
  }
  
  /**
   * Execute search query
   */
  const photographers = await prisma.photographers.findMany({
    where,
    select: {
      id: true,
      user_id: true,
      bio: true,
      services: true,
      years_experience: true,
      hourly_rate: true,
      day_rate: true,
      verification_status: true,
      average_rating: true,
      total_bookings: true,
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image_url: true,
          location_city: true,
          location_country: true,
          is_verified: true
        }
      },
      portfolio_items: {
        take: 3,  // Only show 3 sample images in search results
        where: { is_featured: true },
        orderBy: { created_at: 'desc' }
      },
      subscriptions: {
        select: {
          tier: true,
          featured_listing_weight: true
        }
      }
    },
    orderBy: [
      { subscriptions: { featured_listing_weight: 'desc' } },  // Featured listings first
      { average_rating: 'desc' },  // Then by rating
      { total_bookings: 'desc' }   // Then by experience
    ],
    take: filters.limit || 20,
    skip: filters.offset || 0
  });
  
  return photographers;
}

/**
 * Add portfolio item
 * 
 * @param userId - User ID of photographer
 * @param data - Portfolio item data
 * @returns Created portfolio item
 */
export async function addPortfolioItem(
  userId: string,
  data: CreatePortfolioItemData
) {
  /**
   * TEACHING MOMENT: Ownership Verification
   * 
   * Before creating portfolio item, verify user is a photographer
   * This prevents non-photographers from adding portfolio items
   */
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photographer) {
    throw new Error('Only photographers can add portfolio items');
  }

  /**
   * Get current max display order
   * New items go to the end by default
   */
  const maxOrder = await prisma.portfolio_items.aggregate({
    where: { photographer_id: photographer.id },
    _max: { display_order: true }
  });

  const displayOrder = (maxOrder._max.display_order || 0) + 1;
  
  /**
   * Create portfolio item
   */
  const portfolioItem = await prisma.portfolio_items.create({
    data: {
      photographer_id: photographer.id,
      image_url: data.imageUrl,
      thumbnail_url: data.thumbnailUrl,
      title: data.title,
      description: data.description,
      occasion_type: data.occasionType,
      is_featured: data.isFeatured || false,
      display_order: displayOrder
    }
  });
  
  return portfolioItem;
}

/**
 * Update portfolio item
 * 
 * @param userId - User ID of photographer
 * @param portfolioItemId - Portfolio item ID
 * @param data - Data to update
 * @returns Updated portfolio item
 */
export async function updatePortfolioItem(
  userId: string,
  portfolioItemId: string,
  data: Partial<CreatePortfolioItemData>
) {
  /**
   * TEACHING MOMENT: Ownership Check
   * 
   * Verify that the portfolio item belongs to this photographer
   * Prevent photographers from editing each other's portfolios!
   */
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photographer) {
    throw new Error('Photographer not found');
  }

  // Check if portfolio item exists and belongs to this photographer
  const portfolioItem = await prisma.portfolio_items.findUnique({
    where: { id: portfolioItemId }
  });

  if (!portfolioItem) {
    throw new Error('Portfolio item not found');
  }

  if (portfolioItem.photographer_id !== photographer.id) {
    throw new Error('You do not have permission to update this portfolio item');
  }
  
  /**
   * Update the portfolio item
   */
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.occasionType !== undefined) updateData.occasion_type = data.occasionType;
  if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;
  
  const updated = await prisma.portfolio_items.update({
    where: { id: portfolioItemId },
    data: updateData
  });
  
  return updated;
}

/**
 * Delete portfolio item
 * 
 * @param userId - User ID of photographer
 * @param portfolioItemId - Portfolio item ID
 */
export async function deletePortfolioItem(
  userId: string,
  portfolioItemId: string
) {
  /**
   * Same ownership check as update
   */
  const photographer = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photographer) {
    throw new Error('Photographer not found');
  }

  const portfolioItem = await prisma.portfolio_items.findUnique({
    where: { id: portfolioItemId }
  });

  if (!portfolioItem) {
    throw new Error('Portfolio item not found');
  }

  if (portfolioItem.photographer_id !== photographer.id) {
    throw new Error('You do not have permission to delete this portfolio item');
  }
  
  /**
   * Delete the portfolio item
   */
  await prisma.portfolio_items.delete({
    where: { id: portfolioItemId }
  });
  
  return { success: true };
}

/**
 * TEACHING MOMENT: Why Separate Services?
 * 
 * Having separate service functions allows us to:
 * 1. Reuse logic across different controllers
 * 2. Test business logic independently
 * 3. Keep controllers thin (they just handle HTTP)
 * 4. Change database implementation without touching controllers
 * 
 * Example reuse:
 * - Controller calls getPhotographerPublicProfile()
 * - Admin dashboard also calls same function
 * - Mobile app API uses same function
 * - Logic written once, used everywhere!
 */
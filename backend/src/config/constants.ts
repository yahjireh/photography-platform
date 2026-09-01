/**
 * Business Constants
 * All business rules and configuration values in one place
 * This makes it easy to change rules without digging through code
 */

// ============================================
// PAYMENT CONFIGURATION
// ============================================

/**
 * What percentage of total amount is paid as deposit
 * Example: ₵1000 booking → ₵400 deposit (40%)
 */
export const DEPOSIT_PERCENTAGE = 0.40; // 40%

/**
 * Remaining balance after deposit
 * Example: ₵1000 booking → ₵600 balance (60%)
 */
export const BALANCE_PERCENTAGE = 0.60; // 60%

/**
 * Service charge for refund processing (as decimal)
 * Example: ₵400 refund → ₵380 after 5% service charge
 */
export const SERVICE_CHARGE_RATE = 0.05; // 5%

// ============================================
// SUBSCRIPTION TIERS & PRICING
// ============================================

/**
 * Subscription tier configuration
 * Each tier has different benefits and commission rates
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    monthlyPrice: 0,
    commissionRate: 0.15,           // 15% platform commission
    featuredListingWeight: 0,        // Appears last in search results
    canAcceptAdvanceBookings: true,
    maxAdvanceBookingDays: 30,       // Can only book 30 days ahead
    features: [
      'Basic profile',
      'Accept bookings',
      '15% commission per booking',
      'Standard search ranking'
    ]
  },
  PRO: {
    name: 'Pro',
    monthlyPrice: 50,                // ₵50 per month
    commissionRate: 0.10,            // 10% platform commission (reduced!)
    featuredListingWeight: 5,        // Appears higher in search
    canAcceptAdvanceBookings: true,
    maxAdvanceBookingDays: 90,       // Can book 90 days ahead
    features: [
      'Enhanced profile',
      'Priority support',
      '10% commission per booking',
      'Featured in search results',
      'Analytics dashboard',
      'Advanced booking up to 90 days'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyPrice: 100,               // ₵100 per month
    commissionRate: 0.05,            // 5% platform commission (lowest!)
    featuredListingWeight: 10,       // Appears first in search
    canAcceptAdvanceBookings: true,
    maxAdvanceBookingDays: 365,      // Can book full year ahead
    features: [
      'Premium profile with badge',
      'Dedicated account manager',
      '5% commission per booking',
      'Top position in search results',
      'Advanced analytics & insights',
      'Unlimited advance bookings',
      'API access',
      'Custom branding options'
    ]
  }
} as const;

/**
 * Get commission rate based on subscription tier
 */
export function getCommissionRate(tier: 'FREE' | 'PRO' | 'ENTERPRISE'): number {
  return SUBSCRIPTION_TIERS[tier].commissionRate;
}

/**
 * Get subscription price based on tier
 */
export function getSubscriptionPrice(tier: 'FREE' | 'PRO' | 'ENTERPRISE'): number {
  return SUBSCRIPTION_TIERS[tier].monthlyPrice;
}

// ============================================
// CANCELLATION POLICY
// ============================================

/**
 * Cancellation rules based on hours before event
 * Returns refund percentage (0-100)
 */
export function getCancellationRefundPercentage(hoursBeforeEvent: number): number {
  if (hoursBeforeEvent > 48) {
    // More than 48 hours: Full refund minus service charge
    return 100 - (SERVICE_CHARGE_RATE * 100);  // 95%
  } else if (hoursBeforeEvent >= 24 && hoursBeforeEvent <= 48) {
    // 24-48 hours: 50% refund
    return 50;
  } else {
    // Less than 24 hours: No refund
    return 0;
  }
}

/**
 * Calculate refund amount based on cancellation time
 * @param depositAmount - Amount client paid as deposit
 * @param hoursBeforeEvent - Hours until event starts
 * @returns Refund amount to return to client
 */
export function calculateRefundAmount(
  depositAmount: number, 
  hoursBeforeEvent: number
): number {
  const refundPercentage = getCancellationRefundPercentage(hoursBeforeEvent);
  return (depositAmount * refundPercentage) / 100;
}

/**
 * Example usage:
 * 
 * Client paid ₵400 deposit
 * Cancels 72 hours before event (>48 hours)
 * Refund: ₵400 * 95% = ₵380 (₵20 service charge)
 * 
 * Client paid ₵400 deposit
 * Cancels 36 hours before event (24-48 hours)
 * Refund: ₵400 * 50% = ₵200
 * 
 * Client paid ₵400 deposit
 * Cancels 12 hours before event (<24 hours)
 * Refund: ₵0
 */

// ============================================
// PHOTO DELIVERY DEADLINES
// ============================================

/**
 * Maximum days photographer has to deliver photos after shoot
 */
export const PHOTO_DELIVERY_DEADLINE_DAYS = 14;

/**
 * Warning threshold - send reminder to photographer
 * Example: Send reminder 3 days before deadline
 */
export const PHOTO_DELIVERY_WARNING_DAYS = 11; // Day 11 = 3 days before deadline

/**
 * Late delivery penalty (optional - you can implement this later)
 * Percentage of payment to withhold if photos are late
 */
export const LATE_DELIVERY_PENALTY_RATE = 0.10; // 10% penalty

/**
 * Calculate photo delivery deadline date
 * @param shootCompletedAt - Date when shoot was completed
 * @returns Deadline date for photo delivery
 */
export function calculatePhotoDeliveryDeadline(shootCompletedAt: Date): Date {
  const deadline = new Date(shootCompletedAt);
  deadline.setDate(deadline.getDate() + PHOTO_DELIVERY_DEADLINE_DAYS);
  return deadline;
}

/**
 * Check if photos are overdue
 */
export function isPhotoDeliveryOverdue(shootCompletedAt: Date): boolean {
  const deadline = calculatePhotoDeliveryDeadline(shootCompletedAt);
  const now = new Date();
  return now > deadline;
}

// ============================================
// BOOKING CONFIGURATION
// ============================================

/**
 * Minimum hours notice required for bookings
 * Example: Client can't book photographer 2 hours from now
 */
export const MINIMUM_BOOKING_NOTICE_HOURS = 24; // Must book at least 24 hours in advance

/**
 * Minimum booking duration in hours
 * Example: Can't book photographer for just 30 minutes
 */
export const MINIMUM_BOOKING_HOURS = 1;

/**
 * Maximum booking duration in hours
 * Example: Can't book for more than 12 hours in one booking
 */
export const MAXIMUM_BOOKING_HOURS = 12;

/**
 * Auto-reject booking after X hours of no response
 * If photographer doesn't respond, booking automatically rejected
 */
export const AUTO_REJECT_BOOKING_HOURS = 24;

// ============================================
// SEARCH & DISCOVERY
// ============================================

/**
 * Maximum search radius in kilometers
 * How far to search for photographers from client's location
 */
export const MAX_SEARCH_RADIUS_KM = 50;

/**
 * Default search radius if not specified
 */
export const DEFAULT_SEARCH_RADIUS_KM = 20;

/**
 * Number of photographers to show per page in search results
 */
export const PHOTOGRAPHERS_PER_PAGE = 20;

// ============================================
// RATING & REVIEW
// ============================================

/**
 * Minimum rating value (1 star)
 */
export const MIN_RATING = 1;

/**
 * Maximum rating value (5 stars)
 */
export const MAX_RATING = 5;

/**
 * Minimum review comment length
 */
export const MIN_REVIEW_LENGTH = 10;

/**
 * Maximum review comment length
 */
export const MAX_REVIEW_LENGTH = 1000;

// ============================================
// VERIFICATION & KYC
// ============================================

/**
 * Required documents for photographer verification
 */
export const REQUIRED_KYC_DOCUMENTS = [
  'NATIONAL_ID',           // Government-issued ID
  'PROOF_OF_ADDRESS',      // Utility bill or bank statement
  'PROFESSIONAL_PORTFOLIO' // Sample work
] as const;

/**
 * Minimum portfolio items required for verification
 */
export const MIN_PORTFOLIO_ITEMS = 5;

/**
 * Maximum portfolio items allowed
 */
export const MAX_PORTFOLIO_ITEMS = 50;

// ============================================
// FILE UPLOAD LIMITS
// ============================================

/**
 * Maximum file size for portfolio images (in MB)
 */
export const MAX_PORTFOLIO_IMAGE_SIZE_MB = 10;

/**
 * Maximum file size for booking photos (in MB)
 */
export const MAX_BOOKING_PHOTO_SIZE_MB = 15;

/**
 * Maximum file size for profile images (in MB)
 */
export const MAX_PROFILE_IMAGE_SIZE_MB = 5;

/**
 * Allowed image formats
 */
export const ALLOWED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
] as const;

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * Send email notification for these event types
 */
export const EMAIL_NOTIFICATION_TYPES = [
  'BOOKING_REQUEST',
  'BOOKING_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PHOTOS_DELIVERED',
  'SUBSCRIPTION_EXPIRING'
] as const;

/**
 * Send push notification for these event types
 */
export const PUSH_NOTIFICATION_TYPES = [
  'BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_REJECTED',
  'MESSAGE_RECEIVED',
  'PHOTOS_UPLOADED'
] as const;

// ============================================
// BUSINESS HOURS (Optional)
// ============================================

/**
 * Platform support hours (for admin/customer support)
 */
export const SUPPORT_HOURS = {
  start: '08:00',  // 8 AM
  end: '20:00',    // 8 PM
  timezone: 'Africa/Accra'
} as const;

// ============================================
// DISPUTE RESOLUTION
// ============================================

/**
 * Maximum days to raise a dispute after booking completion
 */
export const DISPUTE_WINDOW_DAYS = 7;

/**
 * Maximum days for admin to resolve a dispute
 */
export const DISPUTE_RESOLUTION_DEADLINE_DAYS = 14;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate total platform earnings from a booking
 */
export function calculatePlatformEarnings(
  totalAmount: number,
  commissionRate: number
): number {
  return totalAmount * commissionRate;
}

/**
 * Calculate photographer earnings from a booking
 */
export function calculatePhotographerEarnings(
  totalAmount: number,
  commissionRate: number
): number {
  return totalAmount * (1 - commissionRate);
}

/**
 * Generate unique booking number
 * Format: BK-YYYYMMDD-XXXX
 * Example: BK-20260107-1234
 * 
 * @returns Unique booking number string
 */
export function generateBookingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  
  return `BK-${year}${month}${day}-${random}`;
}

/**
 * Example: BK-20260107-3847
 */
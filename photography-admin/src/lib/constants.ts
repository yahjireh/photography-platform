/**
 * Constants & Configuration
 * All configuration values and enums in one place
 */

// ============================================
// API CONFIGURATION
// ============================================

/**
 * Base URL for backend API
 * This comes from environment variable
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clickflicks-api.onrender.com/api';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/admin/login',
  LOGOUT: '/admin/logout',
  
  // Dashboard
  STATS: '/admin/dashboard/stats',
  REVENUE: '/admin/dashboard/revenue',
  
  // Users
  USERS: '/admin/users',
  USER_DETAIL: (id: string) => `/admin/users/${id}`,
  
  // Photographers
  PHOTOGRAPHERS: '/admin/photographers',
  PHOTOGRAPHER_DETAIL: (id: string) => `/admin/photographers/${id}`,
  PENDING_VERIFICATIONS: '/admin/photographers/pending',
  VERIFY_PHOTOGRAPHER: (id: string) => `/admin/photographers/${id}/verify`,
  
  // Bookings
  BOOKINGS: '/admin/bookings',
  BOOKING_DETAIL: (id: string) => `/admin/bookings/${id}`,
  
  // Payments
  PAYMENTS: '/admin/payments',
  PAYMENT_DETAIL: (id: string) => `/admin/payments/${id}`,
  
  // Disputes
  DISPUTES: '/admin/disputes',
  DISPUTE_DETAIL: (id: string) => `/admin/disputes/${id}`,
  RESOLVE_DISPUTE: (id: string) => `/admin/disputes/${id}/resolve`,
  
  // Reviews
  REVIEWS: '/admin/reviews',
  REVIEW_DETAIL: (id: string) => `/admin/reviews/${id}`,
  MODERATE_REVIEW: (id: string) => `/admin/reviews/${id}/moderate`,
  
  // Analytics
  ANALYTICS_OVERVIEW: '/admin/analytics/overview',
  ANALYTICS_REVENUE: '/admin/analytics/revenue',
  ANALYTICS_BOOKINGS: '/admin/analytics/bookings',
  ANALYTICS_GEOGRAPHIC: '/admin/analytics/geographic',
  
  // Settings
  SETTINGS: '/admin/settings',
} as const;

// ============================================
// PAGINATION
// ============================================

/**
 * Default items per page
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Available page size options
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ============================================
// DATE RANGES
// ============================================

/**
 * Predefined date range options for analytics
 */
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
} as const;

/**
 * Labels for date ranges
 */
export const DATE_RANGE_LABELS = {
  [DATE_RANGES.TODAY]: 'Today',
  [DATE_RANGES.YESTERDAY]: 'Yesterday',
  [DATE_RANGES.LAST_7_DAYS]: 'Last 7 Days',
  [DATE_RANGES.LAST_30_DAYS]: 'Last 30 Days',
  [DATE_RANGES.THIS_MONTH]: 'This Month',
  [DATE_RANGES.LAST_MONTH]: 'Last Month',
  [DATE_RANGES.THIS_YEAR]: 'This Year',
  [DATE_RANGES.CUSTOM]: 'Custom Range',
} as const;

// ============================================
// BOOKING STATUS
// ============================================

/**
 * Booking status values
 */
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;

/**
 * Booking status labels (human-readable)
 */
export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.ACCEPTED]: 'Accepted',
  [BOOKING_STATUS.REJECTED]: 'Rejected',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.IN_PROGRESS]: 'In Progress',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.DISPUTED]: 'Disputed',
} as const;

// ============================================
// PAYMENT STATUS
// ============================================

/**
 * Payment status values
 */
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.SUCCESSFUL]: 'Successful',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
} as const;

// ============================================
// VERIFICATION STATUS
// ============================================

/**
 * Photographer verification status
 */
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

/**
 * Verification status labels
 */
export const VERIFICATION_STATUS_LABELS = {
  [VERIFICATION_STATUS.PENDING]: 'Pending',
  [VERIFICATION_STATUS.VERIFIED]: 'Verified',
  [VERIFICATION_STATUS.REJECTED]: 'Rejected',
} as const;

// ============================================
// USER TYPES
// ============================================

/**
 * User types
 */
export const USER_TYPE = {
  CLIENT: 'CLIENT',
  PHOTOGRAPHER: 'PHOTOGRAPHER',
  ADMIN: 'ADMIN',
} as const;

/**
 * User type labels
 */
export const USER_TYPE_LABELS = {
  [USER_TYPE.CLIENT]: 'Client',
  [USER_TYPE.PHOTOGRAPHER]: 'Photographer',
  [USER_TYPE.ADMIN]: 'Admin',
} as const;

// ============================================
// OCCASION TYPES
// ============================================

/**
 * Event occasion types
 */
export const OCCASION_TYPES = [
  'WEDDING',
  'BIRTHDAY',
  'CORPORATE_EVENT',
  'CONFERENCE',
  'PRODUCT_SHOOT',
  'PORTRAIT',
  'FAMILY_SHOOT',
  'REAL_ESTATE',
  'SPORTS',
  'GRADUATION',
  'MOBILE_PHOTOGRAPHY',
  'PHOTOJOURNALISM',
  'VIDEOGRAPHY',
  'OTHER',
] as const;

/**
 * Occasion type labels
 */
export const OCCASION_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  CORPORATE_EVENT: 'Corporate Event',
  CONFERENCE: 'Conference',
  PRODUCT_SHOOT: 'Product Shoot',
  PORTRAIT: 'Portrait',
  FAMILY_SHOOT: 'Family Shoot',
  REAL_ESTATE: 'Real Estate',
  SPORTS: 'Sports',
  GRADUATION: 'Graduation',
  MOBILE_PHOTOGRAPHY: 'Mobile Photography',
  PHOTOJOURNALISM: 'Photojournalism',
  VIDEOGRAPHY: 'Videography',
  OTHER: 'Other',
};

// ============================================
// SUBSCRIPTION TIERS
// ============================================

/**
 * Photographer subscription tiers
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

/**
 * Subscription tier labels
 */
export const SUBSCRIPTION_TIER_LABELS = {
  [SUBSCRIPTION_TIERS.FREE]: 'Free',
  [SUBSCRIPTION_TIERS.PRO]: 'Pro',
  [SUBSCRIPTION_TIERS.ENTERPRISE]: 'Enterprise',
} as const;

/**
 * Commission rates by tier
 */
export const SUBSCRIPTION_COMMISSION_RATES = {
  [SUBSCRIPTION_TIERS.FREE]: 0.15,        // 15%
  [SUBSCRIPTION_TIERS.PRO]: 0.10,         // 10%
  [SUBSCRIPTION_TIERS.ENTERPRISE]: 0.05,  // 5%
} as const;

// ============================================
// CHART COLORS
// ============================================

/**
 * Color palette for charts
 * Matches the premium design aesthetic
 */
export const CHART_COLORS = {
  primary: 'hsl(180, 80%, 45%)',        // Bright teal
  secondary: 'hsl(45, 90%, 55%)',       // Gold
  success: 'hsl(142, 76%, 36%)',        // Green
  warning: 'hsl(38, 92%, 50%)',         // Orange
  danger: 'hsl(0, 84%, 60%)',           // Red
  info: 'hsl(199, 89%, 48%)',           // Blue
  purple: 'hsl(271, 81%, 56%)',         // Purple
  pink: 'hsl(330, 81%, 60%)',           // Pink
} as const;

/**
 * Chart color array (for multi-series charts)
 */
export const CHART_COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.danger,
];

// ============================================
// TOAST CONFIGURATION
// ============================================

/**
 * Toast notification durations (ms)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Maximum file size (in bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  DOCUMENTS: ['application/pdf'],
} as const;

// ============================================
// WIDGET CONFIGURATION
// ============================================

/**
 * Available widget types
 */
export const WIDGET_TYPES = {
  STATS_CARD: 'stats-card',
  RECENT_BOOKINGS: 'recent-bookings',
  REVENUE_CHART: 'revenue-chart',
  BOOKING_TRENDS: 'booking-trends',
  TOP_PHOTOGRAPHERS: 'top-photographers',
  GEOGRAPHIC_DISTRIBUTION: 'geographic-distribution',
  QUICK_ACTIONS: 'quick-actions',
} as const;

/**
 * Widget size options
 */
export const WIDGET_SIZES = {
  SMALL: 'small',      // 1/4 width
  MEDIUM: 'medium',    // 1/2 width
  LARGE: 'large',      // 3/4 width
  FULL: 'full',        // Full width
} as const;

// ============================================
// NAVIGATION
// ============================================

/**
 * Main navigation routes
 */
export const ROUTES = {
  HOME: '/',
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  PHOTOGRAPHERS: '/photographers',
  PHOTOGRAPHER_DETAIL: (id: string) => `/photographers/${id}`,
  PENDING_VERIFICATIONS: '/photographers/pending',
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: (id: string) => `/payments/${id}`,
  DISPUTES: '/disputes',
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  REVIEWS: '/reviews',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

// ============================================
// QUERY KEYS (for React Query)
// ============================================

/**
 * React Query cache keys
 * Used for caching and invalidating data
 */
export const QUERY_KEYS = {
  // Dashboard
  DASHBOARD_STATS: ['dashboard', 'stats'],
  DASHBOARD_REVENUE: ['dashboard', 'revenue'],
  
  // Users
  USERS: ['users'],
  USER_DETAIL: (id: string) => ['users', id],
  
  // Photographers
  PHOTOGRAPHERS: ['photographers'],
  PHOTOGRAPHER_DETAIL: (id: string) => ['photographers', id],
  PENDING_VERIFICATIONS: ['photographers', 'pending'],
  
  // Bookings
  BOOKINGS: ['bookings'],
  BOOKING_DETAIL: (id: string) => ['bookings', id],
  
  // Payments
  PAYMENTS: ['payments'],
  PAYMENT_DETAIL: (id: string) => ['payments', id],
  
  // Disputes
  DISPUTES: ['disputes'],
  DISPUTE_DETAIL: (id: string) => ['disputes', id],
  
  // Reviews
  REVIEWS: ['reviews'],
  REVIEW_DETAIL: (id: string) => ['reviews', id],
  
  // Analytics
  ANALYTICS_OVERVIEW: ['analytics', 'overview'],
  ANALYTICS_REVENUE: ['analytics', 'revenue'],
  ANALYTICS_BOOKINGS: ['analytics', 'bookings'],
  ANALYTICS_GEOGRAPHIC: ['analytics', 'geographic'],

  // Admin
  NOTIFICATIONS: ['admin', 'notifications'],
  ADMIN_PROFILE: ['admin', 'profile'],
  ACTIVE_USERS: ['admin', 'active-users'],
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

/**
 * Standard animation durations (ms)
 * For consistent animations across app
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

/**
 * Responsive breakpoints (matches Tailwind)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * TEACHING MOMENT: Why use 'as const'?
 * 
 * Without 'as const':
 * const STATUS = { PENDING: 'PENDING' }
 * typeof STATUS.PENDING = string (any string!)
 * 
 * With 'as const':
 * const STATUS = { PENDING: 'PENDING' } as const
 * typeof STATUS.PENDING = 'PENDING' (specific string!)
 * 
 * This gives us better type safety!
 */
/**
 * Dashboard TypeScript Type Definitions
 * All types for admin dashboard components and data
 */

// ============================================
// DASHBOARD STATISTICS
// ============================================

/**
 * Dashboard Overview Statistics
 * Used in stats cards on homepage
 */
export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalPhotographers: number;
  
  // Growth percentages (can be negative)
  revenueGrowth: number;
  bookingsGrowth: number;
  usersGrowth: number;
  photographersGrowth: number;
  
  // Additional metrics
  activeBookings: number;
  completedBookings: number;
  pendingVerifications: number;
  activeDisputes: number;
}

/**
 * Revenue data point for charts
 */
export interface RevenueDataPoint {
  date: string;           // ISO date string
  revenue: number;        // Total revenue for that period
  bookings: number;       // Number of bookings
  commission: number;     // Platform commission earned
}

/**
 * Booking trend data
 */
export interface BookingTrendData {
  month: string;          // e.g., "Jan", "Feb", "Mar"
  bookings: number;       // Total bookings
  completed: number;      // Completed bookings
  cancelled: number;      // Cancelled bookings
}

// ============================================
// USER & PHOTOGRAPHER DATA
// ============================================

/**
 * User data structure
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  profileImageUrl: string | null;
  phoneNumber: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;      // ISO date string
  updatedAt: string;
}

/**
 * Photographer profile data
 */
export interface Photographer {
  id: string;
  userId: string;
  user: User;             // Nested user data
  bio: string | null;
  services: string[];     // Array of OccasionType values
  yearsExperience: number | null;
  hourlyRate: number | null;
  dayRate: number | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  averageRating: number;
  totalBookings: number;
  portfolioWebsite: string | null;
  instagramHandle: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Top photographer for leaderboard widget
 */
export interface TopPhotographer {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  growthPercentage: number;
}

// ============================================
// BOOKING DATA
// ============================================

/**
 * Booking status enum
 */
export type BookingStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

/**
 * Booking data structure
 */
export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  photographerId: string;
  client: User;
  photographer: Photographer;
  occasionType: string;
  eventLocation: string;
  eventDate: string;      // ISO date string
  eventStartTime: string;
  eventEndTime: string | null;
  estimatedHours: number | null;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  platformCommission: number;
  status: BookingStatus;
  specialRequirements: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recent booking for dashboard widget
 */
export interface RecentBooking {
  id: string;
  bookingNumber: string;
  clientName: string;
  photographerName: string;
  occasionType: string;
  eventDate: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
}

// ============================================
// PAYMENT DATA
// ============================================

/**
 * Payment status enum
 */
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';

/**
 * Payment data structure
 */
export interface Payment {
  id: string;
  bookingId: string;
  booking?: Booking;
  paystackReference: string;
  paymentStage: 'DEPOSIT' | 'BALANCE';
  amount: number;
  status: PaymentStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  holdStatus?: 'HELD' | 'RELEASED_TO_PHOTOGRAPHER' | 'REFUNDED_TO_CLIENT';
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// DISPUTE DATA
// ============================================

/**
 * Dispute status
 */
export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

/**
 * Dispute data structure
 */
export interface Dispute {
  id: string;
  bookingId: string;
  booking: Booking;
  raisedBy: string;       // User ID
  raisedByUser: User;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// REVIEW DATA
// ============================================

/**
 * Review data structure
 */
export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewer: User;
  reviewee: User;
  rating: number;         // 1-5
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
}

// ============================================
// NOTIFICATION DATA
// ============================================

/**
 * Notification type enum
 */
export type NotificationType = 
  | 'BOOKING_REQUEST'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'SHOOT_STARTED'
  | 'SHOOT_COMPLETED'
  | 'PHOTOS_UPLOADED'
  | 'PHOTOS_DELIVERED'
  | 'REVIEW_RECEIVED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'KYC_VERIFIED'
  | 'KYC_REJECTED';

/**
 * Notification data structure
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;       // Additional JSON data
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ============================================
// WIDGET CONFIGURATION
// ============================================

/**
 * Widget types available in dashboard
 */
export type WidgetType = 
  | 'stats-card'
  | 'recent-bookings'
  | 'revenue-chart'
  | 'booking-trends'
  | 'top-photographers'
  | 'geographic-distribution'
  | 'quick-actions';

/**
 * Widget configuration for drag & drop grid
 */
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;       // Order in grid
  size: 'small' | 'medium' | 'large' | 'full';
  isVisible: boolean;
}

/**
 * Widget grid layout
 */
export interface WidgetGridLayout {
  widgets: Widget[];
  columns: number;        // Grid columns (e.g., 12)
}

// ============================================
// FILTER & PAGINATION
// ============================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;           // Current page (1-indexed)
  limit: number;          // Items per page
  total?: number;         // Total items (returned from API)
  totalPages?: number;    // Total pages (calculated)
}

/**
 * Sorting parameters
 */
export interface SortParams {
  field: string;          // Field to sort by
  order: 'asc' | 'desc';  // Sort direction
}

/**
 * Filter parameters for bookings
 */
export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];
  dateFrom?: string;      // ISO date string
  dateTo?: string;
  occasionType?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;   // Search in booking number or names
}

/**
 * Filter parameters for users
 */
export interface UserFilters {
  userType?: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  isVerified?: boolean;
  isActive?: boolean;
  searchQuery?: string;   // Search in name or email
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// FORM DATA TYPES
// ============================================

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Dispute resolution form data
 */
export interface DisputeResolutionFormData {
  resolution: string;
  action: 'refund_client' | 'pay_photographer' | 'split_payment' | 'no_action';
  refundAmount?: number;
  photographerAmount?: number;
  notes?: string;
}

/**
 * Photographer verification form data
 */
export interface PhotographerVerificationFormData {
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  notes?: string;
}

// ============================================
// CHART DATA TYPES
// ============================================

/**
 * Chart data point (generic)
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: unknown;     // Allow additional properties
}

/**
 * Revenue distribution by occasion type
 */
export interface RevenueByOccasion {
  occasionType: string;
  revenue: number;
  bookings: number;
  percentage: number;
}

/**
 * Geographic distribution data
 */
export interface GeographicData {
  city: string;
  country: string;
  users: number;
  photographers: number;
  bookings: number;
  latitude: number;
  longitude: number;
}

// ============================================
// SETTINGS TYPES
// ============================================

/**
 * System settings
 */
export interface SystemSettings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  
  // Commission rates
  freeCommissionRate: number;
  proCommissionRate: number;
  enterpriseCommissionRate: number;
  
  // Subscription prices
  proMonthlyPrice: number;
  enterpriseMonthlyPrice: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Dropdown option (for select inputs)
 */
export interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Date range
 */
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

/**
 * Export these types for use in components
 */
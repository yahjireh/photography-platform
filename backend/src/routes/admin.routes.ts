/**
 * Admin Routes
 * All routes require ADMIN role authentication
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  // Dashboard
  getDashboardStats,
  getDashboardRevenue,
  getRecentBookings,
  getTopPhotographers,

  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserSuspension,

  // Photographer Management
  getAllPhotographers,
  getPhotographerById,
  getPendingVerifications,
  verifyPhotographer,
  updatePhotographerTier,

  // KYC Management
  getPhotographerKYC,
  getPendingKYCSubmissions,
  updateKYCReview,
  makeKYCDecision,
  updateKYCAccessControls,
  verifyKYCDocument,

  // Booking Management
  getAllBookings,
  getBookingById,
  updateBookingStatus,

  // Payment Management
  getAllPayments,
  getPaymentById,
  approvePaymentRelease,

  // Dispute Management
  getAllDisputes,
  getDisputeById,
  resolveDispute,
  updateDispute,

  // Review Management
  getAllReviews,
  getReviewById,
  moderateReview,

  // Analytics
  getAnalyticsOverview,

  // Settings
  getSettings,
  updateSettings,

  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // Profile
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,

  // Active Users
  getActiveUsers,

  // Escrow & Deliverables
  confirmDepositRelease,
  verifyAndReleaseBalance,

  // Communication Hub
  getCommunicationMessages,
  sendCommunicationMessage,
  getCommunicationTemplates,
  updateCommunicationTemplate,

  // System
  getSystemHealth,
  getFeatureFlags,
  updateFeatureFlag,
  getCronJobs,
  toggleMaintenanceMode,

  // Mobile Apps
  getMobileAppVersions,
  updateMobileAppVersion,
  getMobileStats,
  getMobileCrashes,

  // Report Schedules
  getReportSchedules,
  createReportSchedule,
  updateReportSchedule,
  deleteReportSchedule,
  sendReportNow
} from '../controllers/admin.controller';
import * as TwoFactorController from '../controllers/two-factor.controller';

const router = express.Router();

/**
 * IMPORTANT: All routes here require authentication + ADMIN role
 * We apply these middleware to ALL routes at once
 */
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================
// DASHBOARD ROUTES
// ============================================

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue data for charts
 */
router.get('/dashboard/revenue', getDashboardRevenue);

/**
 * GET /api/admin/dashboard/recent-bookings
 * Get recent bookings for dashboard widget
 */
router.get('/dashboard/recent-bookings', getRecentBookings);

/**
 * GET /api/admin/dashboard/top-photographers
 * Get top performing photographers
 */
router.get('/dashboard/top-photographers', getTopPhotographers);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 */
router.get('/users', getAllUsers);

/**
 * GET /api/admin/users/:id
 * Get user details by ID
 */
router.get('/users/:id', getUserById);

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
router.patch('/users/:id', updateUser);

/**
 * POST /api/admin/users/:id/suspend
 * Suspend/unsuspend user account
 */
router.post('/users/:id/suspend', toggleUserSuspension);

// ============================================
// PHOTOGRAPHER MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/photographers
 * Get all photographers with filtering
 */
router.get('/photographers', getAllPhotographers);

/**
 * GET /api/admin/photographers/pending
 * Get pending photographer verifications
 * NOTE: This must come BEFORE /:id route
 */
router.get('/photographers/pending', getPendingVerifications);

/**
 * GET /api/admin/photographers/:id
 * Get photographer details by ID
 */
router.get('/photographers/:id', getPhotographerById);

/**
 * POST /api/admin/photographers/:id/verify
 * Approve or reject photographer verification
 */
router.post('/photographers/:id/verify', verifyPhotographer);

/**
 * PATCH /api/admin/photographers/:id/tier
 * Update photographer subscription tier
 */
router.patch('/photographers/:id/tier', updatePhotographerTier);

// ============================================
// KYC MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/kyc/pending
 * Get all pending KYC submissions
 * NOTE: This must come BEFORE the /:id route
 */
router.get('/kyc/pending', getPendingKYCSubmissions);

/**
 * GET /api/admin/photographers/:id/kyc
 * Get KYC details for a photographer
 */
router.get('/photographers/:id/kyc', getPhotographerKYC);

/**
 * PATCH /api/admin/photographers/:id/kyc/review
 * Update KYC review section (identity, contact, portfolio, payment)
 */
router.patch('/photographers/:id/kyc/review', updateKYCReview);

/**
 * POST /api/admin/photographers/:id/kyc/decision
 * Make KYC decision (approve, reject, request_more_info, suspend)
 */
router.post('/photographers/:id/kyc/decision', makeKYCDecision);

/**
 * PATCH /api/admin/photographers/:id/kyc/access-controls
 * Update platform access controls for photographer
 */
router.patch('/photographers/:id/kyc/access-controls', updateKYCAccessControls);

/**
 * PATCH /api/admin/photographers/:id/kyc/documents/:documentId
 * Verify or reject a KYC document
 */
router.patch('/photographers/:id/kyc/documents/:documentId', verifyKYCDocument);

// ============================================
// BOOKING MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/bookings
 * Get all bookings with filtering
 */
router.get('/bookings', getAllBookings);

/**
 * GET /api/admin/bookings/:id
 * Get booking details by ID
 */
router.get('/bookings/:id', getBookingById);

/**
 * PATCH /api/admin/bookings/:id/status
 * Update booking status (admin override)
 */
router.patch('/bookings/:id/status', updateBookingStatus);

/**
 * POST /api/admin/bookings/:id/confirm-deposit-release
 * Release escrow deposit to photographer
 */
router.post('/bookings/:id/confirm-deposit-release', confirmDepositRelease);

/**
 * POST /api/admin/bookings/:id/verify-deliverables
 * Verify deliverables link and Access PIN, release remaining balance
 */
router.post('/bookings/:id/verify-deliverables', verifyAndReleaseBalance);

// ============================================
// PAYMENT MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/payments
 * Get all payments/transactions
 */
router.get('/payments', getAllPayments);

/**
 * GET /api/admin/payments/:id
 * Get payment details by ID
 */
router.get('/payments/:id', getPaymentById);

/**
 * POST /api/admin/payments/:id/approve-release
 * Approve escrow release for a payment
 */
router.post('/payments/:id/approve-release', approvePaymentRelease);

// ============================================
// DISPUTE MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/disputes
 * Get all disputes with filtering
 */
router.get('/disputes', getAllDisputes);

/**
 * GET /api/admin/disputes/:id
 * Get dispute details by ID
 */
router.get('/disputes/:id', getDisputeById);

/**
 * PATCH /api/admin/disputes/:id
 * Update dispute details (priority, admin notes, etc.)
 */
router.patch('/disputes/:id', updateDispute);

/**
 * PATCH /api/admin/disputes/:id/resolve
 * Resolve a dispute
 */
router.patch('/disputes/:id/resolve', resolveDispute);

// ============================================
// REVIEW MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/reviews
 * Get all reviews for moderation
 */
router.get('/reviews', getAllReviews);

/**
 * GET /api/admin/reviews/:id
 * Get review details by ID
 */
router.get('/reviews/:id', getReviewById);

/**
 * PATCH /api/admin/reviews/:id/moderate
 * Moderate review (hide/show, flag, etc.)
 */
router.patch('/reviews/:id/moderate', moderateReview);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * GET /api/admin/analytics/overview
 * Get analytics overview
 */
router.get('/analytics/overview', getAnalyticsOverview);

// ============================================
// SETTINGS ROUTES
// ============================================

/**
 * GET /api/admin/settings
 * Get platform settings
 */
router.get('/settings', getSettings);

/**
 * PATCH /api/admin/settings
 * Update platform settings
 */
router.patch('/settings', updateSettings);

// ============================================
// COMMUNICATION HUB ROUTES
// ============================================

/**
 * GET /api/admin/communication/messages
 * Get sent communications and notifications
 */
router.get('/communication/messages', getCommunicationMessages);

/**
 * POST /api/admin/communication/send
 * Dispatch broadcast notification / announcement
 */
router.post('/communication/send', sendCommunicationMessage);

/**
 * GET /api/admin/communication/templates
 * Get email/SMS/push templates
 */
router.get('/communication/templates', getCommunicationTemplates);

/**
 * PATCH /api/admin/communication/templates/:id
 * Update template
 */
router.patch('/communication/templates/:id', updateCommunicationTemplate);

// ============================================
// SYSTEM MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/system/health & GET /api/admin/health
 * Real system health check
 */
router.get('/system/health', getSystemHealth);
router.get('/health', getSystemHealth);

/**
 * GET /api/admin/system/flags
 * Get feature flags
 */
router.get('/system/flags', getFeatureFlags);

/**
 * PATCH /api/admin/system/flags/:id
 * Update feature flag
 */
router.patch('/system/flags/:id', updateFeatureFlag);

/**
 * GET /api/admin/system/crons
 * Get cron jobs
 */
router.get('/system/crons', getCronJobs);

/**
 * POST /api/admin/system/maintenance
 * Toggle maintenance mode
 */
router.post('/system/maintenance', toggleMaintenanceMode);

// ============================================
// MOBILE APPS ROUTES
// ============================================

/**
 * GET /api/admin/mobile/versions
 * Get app versions
 */
router.get('/mobile/versions', getMobileAppVersions);

/**
 * PATCH /api/admin/mobile/versions/:platform
 * Update app version config
 */
router.patch('/mobile/versions/:platform', updateMobileAppVersion);

/**
 * GET /api/admin/mobile/stats
 * Get mobile usage stats
 */
router.get('/mobile/stats', getMobileStats);

/**
 * GET /api/admin/mobile/crashes
 * Get crash reports
 */
router.get('/mobile/crashes', getMobileCrashes);

// ============================================
// NOTIFICATION ROUTES
// ============================================

/**
 * GET /api/admin/notifications
 * Get admin notifications
 */
router.get('/notifications', getNotifications);

/**
 * PATCH /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', markNotificationAsRead);

/**
 * PATCH /api/admin/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/notifications/read-all', markAllNotificationsAsRead);

// ============================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================

/**
 * GET /api/admin/2fa/status
 */
router.get('/2fa/status', TwoFactorController.getStatus);

/**
 * POST /api/admin/2fa/setup
 */
router.post('/2fa/setup', TwoFactorController.setup);

/**
 * POST /api/admin/2fa/verify
 */
router.post('/2fa/verify', TwoFactorController.verify);

/**
 * POST /api/admin/2fa/disable
 */
router.post('/2fa/disable', TwoFactorController.disable);

/**
 * POST /api/admin/2fa/backup-codes
 */
router.post('/2fa/backup-codes', TwoFactorController.regenerateBackupCodes);

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /api/admin/profile
 * Get current admin user profile
 */
router.get('/profile', getAdminProfile);

/**
 * PATCH /api/admin/profile
 * Update current admin user profile
 */
router.patch('/profile', updateAdminProfile);
router.put('/profile', updateAdminProfile);

/**
 * PUT & PATCH /api/admin/profile/password
 * Update current admin user password
 */
router.put('/profile/password', changeAdminPassword);
router.patch('/profile/password', changeAdminPassword);

// ============================================
// ACTIVE USERS ROUTES
// ============================================

/**
 * GET /api/admin/active-users
 * Get recently active users
 */
router.get('/active-users', getActiveUsers);

// ============================================
// EMAIL REPORTS SCHEDULES ROUTES
// ============================================
router.get('/reports/schedules', getReportSchedules);
router.post('/reports/schedules', createReportSchedule);
router.patch('/reports/schedules/:id', updateReportSchedule);
router.delete('/reports/schedules/:id', deleteReportSchedule);
router.post('/reports/send-now', sendReportNow);

export default router;

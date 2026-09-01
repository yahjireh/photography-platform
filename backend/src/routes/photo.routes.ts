/**
 * Photo Routes
 * Handles photo upload, viewing, delivery, and download
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as PhotoController from '../controllers/photo.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Route Organization
 * 
 * Photo routes are organized by resource:
 * 
 * /api/bookings/:id/photos     - Photos for a booking
 * /api/photos/:id              - Single photo operations
 * 
 * This follows RESTful conventions!
 */

// ============================================
// BOOKING PHOTO ROUTES
// ============================================

/**
 * Upload photos to booking
 * POST /api/bookings/:id/photos
 * 
 * Requires: Photographer authentication
 * Body: multipart/form-data with 'photos' field (max 20 files)
 * 
 * Example using Thunder Client:
 * - Method: POST
 * - URL: {{baseUrl}}/api/bookings/{{booking_id}}/photos
 * - Headers: Authorization: Bearer {{photographerToken}}
 * - Body: Form
 *   - photos: [select multiple image files]
 */
router.post(
  '/bookings/:id/photos',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PhotoController.uploadMiddleware,  // Multer processes upload first
  PhotoController.uploadPhotos
);

/**
 * Get all photos for a booking
 * GET /api/bookings/:id/photos
 * 
 * Requires: Authentication (client or photographer)
 * Returns: Array of photos with URLs
 */
router.get(
  '/bookings/:id/photos',
  authenticate,
  PhotoController.getBookingPhotos
);

/**
 * Mark photos as delivered
 * POST /api/bookings/:id/photos/deliver
 * 
 * Requires: Photographer authentication
 * 
 * What this does:
 * - Updates all photos to status: DELIVERED
 * - Sets booking.photosDeliveredAt
 * - Changes booking.status to COMPLETED
 * - Makes booking eligible for balance release
 */
router.post(
  '/bookings/:id/photos/deliver',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PhotoController.deliverPhotos
);

/**
 * Download all photos as ZIP
 * GET /api/bookings/:id/photos/download-all
 * 
 * Requires: Authentication (client or photographer)
 * Returns: ZIP file with all booking photos
 */
router.get(
  '/bookings/:id/photos/download-all',
  authenticate,
  PhotoController.downloadAllPhotos
);

// ============================================
// INDIVIDUAL PHOTO ROUTES
// ============================================

/**
 * Get single photo
 * GET /api/photos/:photoId
 * 
 * Requires: Authentication (client or photographer)
 * Returns: Photo details with URLs
 */
router.get(
  '/photos/:photoId',
  authenticate,
  PhotoController.getPhoto
);

/**
 * Download single photo
 * GET /api/photos/:photoId/download
 * 
 * Requires: Authentication (client or photographer)
 * Returns: Image file
 */
router.get(
  '/photos/:photoId/download',
  authenticate,
  PhotoController.downloadPhoto
);

/**
 * Delete photo
 * DELETE /api/photos/:photoId
 * 
 * Requires: Photographer authentication
 * Note: Can only delete before photos are delivered
 */
router.delete(
  '/photos/:photoId',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PhotoController.deletePhoto
);

/**
 * COMPLETE PHOTO FLOW:
 * 
 * 1. UPLOAD PHOTOS
 *    POST /api/bookings/:id/photos
 *    Body: multipart/form-data with photos
 *    
 *    Process:
 *    - Validate images (size, type)
 *    - Compress images (reduce file size)
 *    - Generate thumbnails
 *    - Upload to storage (local or R2)
 *    - Save to database
 * 
 * 2. VIEW PHOTOS
 *    GET /api/bookings/:id/photos
 *    Returns: Array of photos with URLs
 *    
 *    Client can display:
 *    - Thumbnails in gallery view
 *    - Full images when clicked
 * 
 * 3. DELIVER PHOTOS
 *    POST /api/bookings/:id/photos/deliver
 *    
 *    Updates:
 *    - Photos status → DELIVERED
 *    - Booking status → COMPLETED
 *    - Triggers notification to client
 * 
 * 4. DOWNLOAD PHOTOS
 *    Single: GET /api/photos/:photoId/download
 *    All: GET /api/bookings/:id/photos/download-all
 *    
 *    Returns: Image file or ZIP
 * 
 * 5. BALANCE RELEASE (Admin)
 *    POST /api/payments/balance/release
 *    
 *    Checks:
 *    - Photos delivered? ✓
 *    - Releases remaining 60% to photographer
 */

export default router;
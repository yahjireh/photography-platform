/**
 * Photo Controller
 * HTTP handlers for photo upload, delivery, and download
 */

import { Request, Response } from 'express';
import multer from 'multer';
import * as PhotoService from '../services/photo.service';
import { STORAGE_CONFIG } from '../config/storage';

/**
 * Configure Multer for file uploads
 * Store in memory (buffer) for processing
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: STORAGE_CONFIG.image.maxFileSizeBytes,
    files: STORAGE_CONFIG.limits.maxPhotosPerUpload
  },
  fileFilter: (_req, file, cb) => {
    if (STORAGE_CONFIG.image.allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
    }
  }
});

/**
 * Export multer middleware for routes
 */
export const uploadMiddleware = upload.array('photos', STORAGE_CONFIG.limits.maxPhotosPerUpload);

/**
 * Upload photos to booking
 * POST /api/bookings/:id/photos
 * 
 * Requires: Photographer authentication
 * Body: multipart/form-data with 'photos' field
 */
export async function uploadPhotos(req: Request, res: Response) {
  try {
    const { id: bookingId } = req.params;
    const photographerId = req.user?.user_id;
    
    if (!photographerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos uploaded'
      });
    }
    
    console.log(`\n📸 Upload request from photographer ${req.user?.email}`);
    console.log(`   Booking: ${bookingId}`);
    console.log(`   Files: ${files.length}`);
    
    // Upload photos
    const uploadedPhotos = await PhotoService.uploadBookingPhotos(
      bookingId,
      photographerId,
      files
    );
    
    return res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos,
      totalPhotos: uploadedPhotos.length
    });
    
  } catch (error: any) {
    console.error('❌ Upload photos error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to upload photos'
    });
  }
}

/**
 * Get all photos for a booking
 * GET /api/bookings/:id/photos
 * 
 * Requires: Authentication (client or photographer)
 */
export async function getBookingPhotos(req: Request, res: Response) {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const photos = await PhotoService.getBookingPhotos(bookingId, userId);
    
    return res.status(200).json({
      success: true,
      photos,
      totalPhotos: photos.length
    });
    
  } catch (error: any) {
    console.error('❌ Get photos error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get photos'
    });
  }
}

/**
 * Get single photo
 * GET /api/photos/:photoId
 * 
 * Requires: Authentication (client or photographer)
 */
export async function getPhoto(req: Request, res: Response) {
  try {
    const { photoId } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const photo = await PhotoService.getPhoto(photoId, userId);
    
    return res.status(200).json({
      success: true,
      photo
    });
    
  } catch (error: any) {
    console.error('❌ Get photo error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get photo'
    });
  }
}

/**
 * Delete photo
 * DELETE /api/photos/:photoId
 * 
 * Requires: Photographer authentication
 */
export async function deletePhoto(req: Request, res: Response) {
  try {
    const { photoId } = req.params;
    const photographerId = req.user?.user_id;
    
    if (!photographerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    await PhotoService.deletePhoto(photoId, photographerId);
    
    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Delete photo error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete photo'
    });
  }
}

/**
 * Mark photos as delivered
 * POST /api/bookings/:id/photos/deliver
 * 
 * Requires: Photographer authentication
 */
export async function deliverPhotos(req: Request, res: Response) {
  try {
    const { id: bookingId } = req.params;
    const photographerId = req.user?.user_id;
    
    if (!photographerId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    console.log(`\n📬 Deliver photos request`);
    console.log(`   Photographer: ${req.user?.email}`);
    console.log(`   Booking: ${bookingId}`);
    
    const booking = await PhotoService.deliverPhotos(bookingId, photographerId);
    
    return res.status(200).json({
      success: true,
      message: 'Photos delivered successfully',
      booking: {
        id: booking.id,
        bookingNumber: booking.booking_number,
        status: booking.status,
        photosDeliveredAt: booking.photos_delivered_at,
        totalPhotos: booking.booking_photos.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Deliver photos error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to deliver photos'
    });
  }
}

/**
 * Download single photo
 * GET /api/photos/:photoId/download
 * 
 * Requires: Authentication (client or photographer)
 */
export async function downloadPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    const { buffer, filename } = await PhotoService.downloadPhoto(photoId, userId);
    
    // Send file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    return;
    
  } catch (error: any) {
    console.error('❌ Download photo error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to download photo'
    });
    return;
  }
}

/**
 * Download all photos as ZIP
 * GET /api/bookings/:id/photos/download-all
 * 
 * Requires: Authentication (client or photographer)
 */
export async function downloadAllPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    console.log(`\n📦 Download all photos`);
    console.log(`   User: ${req.user?.email}`);
    console.log(`   Booking: ${bookingId}`);
    
    const { stream, filename } = await PhotoService.downloadAllPhotos(bookingId, userId);
    
    // Send ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    stream.pipe(res);
    return;
    
  } catch (error: any) {
    console.error('❌ Download all photos error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to download photos'
    });
    return;
  }
}

/**
 * TEACHING MOMENT: File Upload with Multer
 * 
 * Multer is middleware for handling multipart/form-data (file uploads)
 * 
 * Configuration:
 * - storage: multer.memoryStorage() - keeps files in memory (Buffer)
 * - limits: file size, number of files
 * - fileFilter: validates file types
 * 
 * Usage in routes:
 * router.post('/photos', uploadMiddleware, uploadPhotos)
 *                        ^^^^^^^^^^^^^^^^
 *                        Multer middleware processes upload first
 * 
 * Then in controller:
 * const files = req.files as Express.Multer.File[];
 * Each file has: buffer, originalname, mimetype, size
 * 
 * Client sends:
 * POST /api/bookings/123/photos
 * Content-Type: multipart/form-data
 * Body: photos=[file1, file2, file3]
 */
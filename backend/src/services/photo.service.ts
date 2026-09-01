/**
 * Photo Service
 * Business logic for photo upload, delivery, and download
 */

import prisma from '../config/database';
import * as NotificationTrigger from '../services/notification-trigger.service';
import * as StorageService from '../services/storage.service';
import * as ImageService from '../services/image.service';
import { STORAGE_CONFIG } from '../config/storage';
import archiver from 'archiver';
import { Readable } from 'stream';
import 'multer';

/**
 * Upload photos to a booking
 * 
 * @param bookingId - Booking ID
 * @param photographerId - Photographer user ID
 * @param files - Array of uploaded files
 * @returns Uploaded photos
 */
export async function uploadBookingPhotos(
  bookingId: string,
  photographerId: string,
  files: Express.Multer.File[]
): Promise<any[]> {
  
  console.log(`📸 Uploading ${files.length} photos for booking ${bookingId}`);
  
  // Get booking with photographer check
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      users_bookings_photographer_idTousers: {
        include: {
          photographers: true
        }
      },
      booking_photos: true
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Verify photographer owns this booking
  if (booking.users_bookings_photographer_idTousers.id !== photographerId) {
    throw new Error('You can only upload photos to your own bookings');
  }

  // Check booking status - must be completed
  if (booking.status !== 'IN_PROGRESS' && booking.shoot_completed_at === null) {
    throw new Error('Can only upload photos after shoot is completed');
  }

  // Check photo limit
  const currentPhotoCount = booking.booking_photos.length;
  if (currentPhotoCount + files.length > STORAGE_CONFIG.limits.maxPhotosPerBooking) {
    throw new Error(
      `Exceeds photo limit. Current: ${currentPhotoCount}, Maximum: ${STORAGE_CONFIG.limits.maxPhotosPerBooking}`
    );
  }
  
  // Check files per upload limit
  if (files.length > STORAGE_CONFIG.limits.maxPhotosPerUpload) {
    throw new Error(`Maximum ${STORAGE_CONFIG.limits.maxPhotosPerUpload} photos per upload`);
  }
  
  // Process and upload each photo
  const uploadedPhotos = [];
  
  for (const file of files) {
    try {
      console.log(`\n📤 Processing: ${file.originalname}`);
      
      // Process image (compress, generate thumbnail)
      const processed = await ImageService.processImage(file);
      
      // Upload compressed image
      const imageUrl = await StorageService.uploadFile(
        processed.compressedBuffer,
        processed.filename,
        'photos'
      );
      
      // Upload thumbnail
      const thumbnailUrl = await StorageService.uploadFile(
        processed.thumbnailBuffer,
        processed.thumbnailFilename,
        'thumbnails'
      );
      
      // Save to database
      const photo = await prisma.booking_photos.create({
        data: {
          booking_id: bookingId,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          file_size_bytes: processed.fileSizeBytes,
          status: 'UPLOADED'
        }
      });
      
      console.log(`✅ Photo uploaded: ${photo.id}`);
      
      uploadedPhotos.push(photo);
      
    } catch (error: any) {
      console.error(`❌ Failed to process ${file.originalname}:`, error.message);
      // Continue with other files
    }
  }
  
  console.log(`\n🎉 Successfully uploaded ${uploadedPhotos.length}/${files.length} photos`);
  
  return uploadedPhotos;
}

/**
 * Get all photos for a booking
 * 
 * @param bookingId - Booking ID
 * @param userId - User ID (for permission check)
 * @returns Photos array
 */
export async function getBookingPhotos(
  bookingId: string,
  userId: string
): Promise<any[]> {
  
  // Get booking with permission check
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      booking_photos: {
        orderBy: { uploaded_at: 'desc' }
      }
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Check if user is client or photographer
  if (booking.client_id !== userId && booking.photographer_id !== userId) {
    throw new Error('You can only view photos for your own bookings');
  }

  return booking.booking_photos;
}

/**
 * Get single photo
 * 
 * @param photoId - Photo ID
 * @param userId - User ID (for permission check)
 * @returns Photo details
 */
export async function getPhoto(
  photoId: string,
  userId: string
): Promise<any> {
  
  const photo = await prisma.booking_photos.findUnique({
    where: { id: photoId },
    include: {
      bookings: true
    }
  });
  
  if (!photo) {
    throw new Error('Photo not found');
  }
  
  // Check permission
  if (photo.bookings.client_id !== userId && photo.bookings.photographer_id !== userId) {
    throw new Error('You can only view photos for your own bookings');
  }
  
  return photo;
}

/**
 * Delete photo
 * Only photographer can delete, only before delivery
 * 
 * @param photoId - Photo ID
 * @param photographerId - Photographer user ID
 */
export async function deletePhoto(
  photoId: string,
  photographerId: string
): Promise<void> {
  
  const photo = await prisma.booking_photos.findUnique({
    where: { id: photoId },
    include: {
      bookings: {
        include: {
          users_bookings_photographer_idTousers: true
        }
      }
    }
  });
  
  if (!photo) {
    throw new Error('Photo not found');
  }
  
  // Check photographer permission
  if (photo.bookings.users_bookings_photographer_idTousers.id !== photographerId) {
    throw new Error('You can only delete photos from your own bookings');
  }

  // Can't delete after delivery
  if (photo.status === 'DELIVERED' || photo.delivered_at) {
    throw new Error('Cannot delete photos after delivery');
  }

  // Extract filename from URL
  const filename = photo.image_url.split('/').pop()!;
  const thumbnailFilename = photo.thumbnail_url.split('/').pop()!;
  
  // Delete from storage
  await StorageService.deleteFile(filename, 'photos');
  await StorageService.deleteFile(thumbnailFilename, 'thumbnails');
  
  // Delete from database
  await prisma.booking_photos.delete({
    where: { id: photoId }
  });
  
  console.log(`🗑️  Photo deleted: ${photoId}`);
}

/**
 * Mark photos as delivered
 * 
 * @param bookingId - Booking ID
 * @param photographerId - Photographer user ID
 * @returns Updated booking
 */
export async function deliverPhotos(
  bookingId: string,
  photographerId: string
): Promise<any> {
  
  console.log(`📬 Delivering photos for booking ${bookingId}`);
  
  // Get booking
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      users_bookings_photographer_idTousers: {
        include: {
          photographers: true
        }
      },
      booking_photos: true,
      users_bookings_client_idTousers: true
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Verify photographer
  if (booking.users_bookings_photographer_idTousers.id !== photographerId) {
    throw new Error('You can only deliver photos for your own bookings');
  }

  // Check if photos exist
  if (booking.booking_photos.length === 0) {
    throw new Error('No photos uploaded yet. Please upload photos first.');
  }

  // Check if already delivered
  if (booking.photos_delivered_at) {
    throw new Error('Photos already delivered');
  }
  
  // Update all photos to DELIVERED
  await prisma.booking_photos.updateMany({
    where: {
      booking_id: bookingId,
      status: 'UPLOADED'
    },
    data: {
      status: 'DELIVERED',
      delivered_at: new Date()
    }
  });
  
  // Update booking
  const updatedBooking = await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      photos_delivered_at: new Date(),
      status: 'COMPLETED' // Booking is now complete
    },
    include: {
      booking_photos: true
    }
  });
  
  console.log(`✅ Photos delivered! Status: COMPLETED`);
  console.log(`   Total photos: ${booking.booking_photos.length}`);
  console.log(`   Booking now eligible for balance payment release`);

  // TODO: Send notification to client
  // After photos marked as delivered
  NotificationTrigger.onPhotosDelivered({
    clientId: booking.client_id,
    clientEmail: booking.users_bookings_client_idTousers.email,
    clientName: `${booking.users_bookings_client_idTousers.first_name} ${booking.users_bookings_client_idTousers.last_name}`,
    bookingId: booking.id,
    bookingNumber: booking.booking_number,
    photoCount: booking.booking_photos.length
  }).catch(err => console.error('Notification error:', err));
  
  return updatedBooking;
}

/**
 * Download single photo
 * 
 * @param photoId - Photo ID
 * @param userId - User ID (for permission check)
 * @returns File buffer and filename
 */
export async function downloadPhoto(
  photoId: string,
  userId: string
): Promise<{ buffer: Buffer; filename: string }> {
  
  // Get photo with permission check
  const photo = await getPhoto(photoId, userId);
  
  // Extract filename from URL
  const filename = photo.image_url.split('/').pop()!;
  
  // Get file from storage
  const buffer = await StorageService.getFile(filename, 'photos');
  
  console.log(`📥 Downloaded photo: ${photoId}`);
  
  return {
    buffer,
    filename
  };
}

/**
 * Download all photos as ZIP
 * 
 * @param bookingId - Booking ID
 * @param userId - User ID (for permission check)
 * @returns ZIP stream
 */
export async function downloadAllPhotos(
  bookingId: string,
  userId: string
): Promise<{ stream: Readable; filename: string }> {
  
  console.log(`📦 Creating ZIP of all photos for booking ${bookingId}`);
  
  // Get all photos
  const photos = await getBookingPhotos(bookingId, userId);
  
  if (photos.length === 0) {
    throw new Error('No photos to download');
  }
  
  // Get booking for filename
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId }
  });
  
  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Add each photo to ZIP
  for (const photo of photos) {
    const filename = photo.image_url.split('/').pop()!;
    const buffer = await StorageService.getFile(filename, 'photos');

    archive.append(buffer, { name: filename });
    console.log(`  Added to ZIP: ${filename}`);
  }

  // Finalize archive
  archive.finalize();

  const zipFilename = `${booking!.booking_number}-photos.zip`;
  
  console.log(`✅ ZIP created: ${zipFilename} (${photos.length} photos)`);
  
  return {
    stream: archive,
    filename: zipFilename
  };
}

/**
 * TEACHING MOMENT: Photo Delivery Flow
 * 
 * 1. Photographer completes shoot
 *    └─ booking.status = IN_PROGRESS
 *    └─ booking.shootCompletedAt = timestamp
 * 
 * 2. Photographer uploads photos
 *    └─ Process images (compress, thumbnail)
 *    └─ Upload to storage (local or R2)
 *    └─ Save records to database
 *    └─ photos.status = UPLOADED
 * 
 * 3. Photographer marks as delivered
 *    └─ Update all photos: status = DELIVERED
 *    └─ Update booking: photosDeliveredAt = timestamp
 *    └─ Update booking: status = COMPLETED
 *    └─ Send notification to client
 * 
 * 4. Client downloads photos
 *    └─ Single photo or all as ZIP
 *    └─ Uses signed URLs (R2) or direct URLs (local)
 * 
 * 5. Admin releases balance payment
 *    └─ Checks booking.photosDeliveredAt exists
 *    └─ Transfers remaining 60% to photographer
 *    └─ Transaction complete! 🎉
 */
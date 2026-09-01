/**
 * Image Processing Service
 * Handles image compression, thumbnails, and validation
 */

import sharp from 'sharp';
import { STORAGE_CONFIG } from '../config/storage';

/**
 * Validate uploaded file
 * 
 * @param file - Multer file object
 * @throws Error if validation fails
 */
export function validateImage(file: Express.Multer.File): void {
  // Check file type
  if (!STORAGE_CONFIG.image.allowedFormats.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type. Allowed: ${STORAGE_CONFIG.image.allowedFormats.join(', ')}`
    );
  }
  
  // Check file size
  if (file.size > STORAGE_CONFIG.image.maxFileSizeBytes) {
    throw new Error(
      `File too large. Maximum size: ${STORAGE_CONFIG.image.maxFileSizeMB}MB`
    );
  }
  
  console.log(`✅ Image validated: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
}

/**
 * Generate unique filename
 * 
 * @param originalName - Original filename
 * @returns Unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop() || 'jpg';
  
  return `photo-${timestamp}-${random}.${extension}`;
}

/**
 * Compress and optimize image
 * 
 * @param buffer - Original image buffer
 * @returns Compressed image buffer
 */
export async function compressImage(buffer: Buffer): Promise<Buffer> {
  const { quality, maxWidth, maxHeight } = STORAGE_CONFIG.image.compression;
  
  console.log('🔄 Compressing image...');
  
  const compressed = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality, progressive: true })
    .toBuffer();
  
  const originalSize = (buffer.length / 1024 / 1024).toFixed(2);
  const compressedSize = (compressed.length / 1024 / 1024).toFixed(2);
  const savings = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
  
  console.log(`✅ Compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% savings)`);
  
  return compressed;
}

/**
 * Generate thumbnail
 * 
 * @param buffer - Original image buffer
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  const { width, height, quality } = STORAGE_CONFIG.image.thumbnail;
  
  console.log(`🖼️  Generating thumbnail (${width}x${height})...`);
  
  const thumbnail = await sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality })
    .toBuffer();
  
  const thumbnailSize = (thumbnail.length / 1024).toFixed(2);
  console.log(`✅ Thumbnail created: ${thumbnailSize}KB`);
  
  return thumbnail;
}

/**
 * Process uploaded image
 * Creates compressed version and thumbnail
 * 
 * @param file - Multer file object
 * @returns Processed image data
 */
export async function processImage(file: Express.Multer.File): Promise<{
  originalBuffer: Buffer;
  compressedBuffer: Buffer;
  thumbnailBuffer: Buffer;
  filename: string;
  thumbnailFilename: string;
  fileSizeBytes: number;
}> {
  console.log('📸 Processing image:', file.originalname);
  
  // Validate
  validateImage(file);
  
  // Generate unique filenames
  const filename = generateUniqueFilename(file.originalname);
  const thumbnailFilename = `thumb-${filename}`;
  
  // Get original buffer
  const originalBuffer = file.buffer;
  
  // Compress image
  const compressedBuffer = await compressImage(originalBuffer);
  
  // Generate thumbnail
  const thumbnailBuffer = await generateThumbnail(originalBuffer);
  
  return {
    originalBuffer,
    compressedBuffer,
    thumbnailBuffer,
    filename,
    thumbnailFilename,
    fileSizeBytes: compressedBuffer.length
  };
}

/**
 * Get image metadata
 * 
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length
  };
}

/**
 * TEACHING MOMENT: Why Image Processing?
 * 
 * 1. COMPRESSION
 *    - Reduces file size by 60-80%
 *    - Faster uploads/downloads
 *    - Lower storage costs
 *    - Better mobile experience
 * 
 * 2. THUMBNAILS
 *    - Quick preview loading
 *    - Gallery views load fast
 *    - Uses much less bandwidth
 * 
 * 3. STANDARDIZATION
 *    - All images same max dimensions
 *    - Consistent quality
 *    - No massive files
 * 
 * Example:
 * Original: 8MB, 4000x3000px
 * After processing: 1.5MB, 2400x1800px (same visual quality!)
 * Thumbnail: 50KB, 400x400px
 * 
 * Total savings: 80%+ storage and bandwidth!
 */
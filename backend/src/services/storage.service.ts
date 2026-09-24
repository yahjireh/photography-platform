/**
 * Storage Service
 * Handles file storage with conditional local/R2 support
 */

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_CONFIG } from '../config/storage';

/**
 * Initialize S3 client for Cloudflare R2
 */
let s3Client: S3Client | null = null;

if (STORAGE_CONFIG.mode === 'r2') {
  s3Client = new S3Client({
    region: STORAGE_CONFIG.r2.region,
    endpoint: STORAGE_CONFIG.r2.endpoint,
    credentials: {
      accessKeyId: STORAGE_CONFIG.r2.accessKeyId!,
      secretAccessKey: STORAGE_CONFIG.r2.secretAccessKey!
    }
  });
}

/**
 * Ensure local directories exist
 */
function ensureLocalDirectories(): void {
  const dirs = [
    STORAGE_CONFIG.local.uploadsDir,
    STORAGE_CONFIG.local.photosDir,
    STORAGE_CONFIG.local.thumbnailsDir,
    path.join(STORAGE_CONFIG.local.uploadsDir, 'avatars'),
    path.join(STORAGE_CONFIG.local.uploadsDir, 'kyc')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      } catch (err: any) {
        console.warn(`Could not create directory ${dir}:`, err.message);
      }
    }
  });
}

// Initialize directories on startup
ensureLocalDirectories();

/**
 * Save file locally to disk
 */
function saveToLocalDisk(file: Buffer, filename: string, folder: string): string {
  const folderPath = folder === 'photos' 
    ? STORAGE_CONFIG.local.photosDir 
    : folder === 'thumbnails'
    ? STORAGE_CONFIG.local.thumbnailsDir
    : path.join(STORAGE_CONFIG.local.uploadsDir, folder);
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, filename);
  fs.writeFileSync(filePath, file);

  const publicUrl = `${STORAGE_CONFIG.local.baseUrl}/${folder}/${filename}`;
  console.log(`💾 Saved locally: ${filePath} (${publicUrl})`);
  return publicUrl;
}

/**
 * Upload file to storage
 * 
 * @param file - File buffer
 * @param filename - Target filename
 * @param folder - Subfolder ('photos', 'thumbnails', 'avatars', or 'kyc')
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  folder: 'photos' | 'thumbnails' | 'avatars' | 'kyc' = 'photos'
): Promise<string> {
  if (STORAGE_CONFIG.mode === 'local' || !s3Client) {
    return saveToLocalDisk(file, filename, folder);
  } else {
    // CLOUDFLARE R2 STORAGE with graceful fallback
    try {
      const key = `${folder}/${filename}`;
      
      let contentType = 'image/jpeg';
      const lower = filename.toLowerCase();
      if (lower.endsWith('.png')) contentType = 'image/png';
      else if (lower.endsWith('.webp')) contentType = 'image/webp';
      else if (lower.endsWith('.gif')) contentType = 'image/gif';

      const command = new PutObjectCommand({
        Bucket: STORAGE_CONFIG.r2.bucket,
        Key: key,
        Body: file,
        ContentType: contentType
      });
      
      await s3Client.send(command);
      
      // Return public URL
      const publicUrl = `${STORAGE_CONFIG.r2.publicUrl}/${key}`;
      console.log(`☁️  Uploaded to R2: ${key}`);
      return publicUrl;
    } catch (r2Err: any) {
      console.warn(`⚠️ R2 upload failed (${r2Err.message}), falling back to local disk storage...`);
      return saveToLocalDisk(file, filename, folder);
    }
  }
}

/**
 * Get file from storage
 * 
 * @param filename - Filename to retrieve
 * @param folder - Subfolder
 * @returns File buffer
 */
export async function getFile(
  filename: string,
  folder: 'photos' | 'thumbnails' = 'photos'
): Promise<Buffer> {
  
  if (STORAGE_CONFIG.mode === 'local') {
    // LOCAL STORAGE
    const folderPath = folder === 'photos' 
      ? STORAGE_CONFIG.local.photosDir 
      : STORAGE_CONFIG.local.thumbnailsDir;
    
    const filePath = path.join(folderPath, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    return fs.readFileSync(filePath);
    
  } else {
    // CLOUDFLARE R2 STORAGE
    const key = `${folder}/${filename}`;
    
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.r2.bucket,
      Key: key
    });
    
    const response = await s3Client!.send(command);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
}

/**
 * Delete file from storage
 * 
 * @param filename - Filename to delete
 * @param folder - Subfolder
 */
export async function deleteFile(
  filename: string,
  folder: 'photos' | 'thumbnails' = 'photos'
): Promise<void> {
  
  if (STORAGE_CONFIG.mode === 'local') {
    // LOCAL STORAGE
    const folderPath = folder === 'photos' 
      ? STORAGE_CONFIG.local.photosDir 
      : STORAGE_CONFIG.local.thumbnailsDir;
    
    const filePath = path.join(folderPath, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted locally: ${filePath}`);
    }
    
  } else {
    // CLOUDFLARE R2 STORAGE
    const key = `${folder}/${filename}`;
    
    const command = new DeleteObjectCommand({
      Bucket: STORAGE_CONFIG.r2.bucket,
      Key: key
    });
    
    await s3Client!.send(command);
    
    console.log(`🗑️  Deleted from R2: ${key}`);
  }
}

/**
 * Generate signed download URL (for R2 only)
 * Local storage returns direct URL
 * 
 * @param filename - Filename
 * @param folder - Subfolder
 * @param expiresIn - URL expiration in seconds (default 1 hour)
 * @returns Signed URL
 */
export async function getSignedDownloadUrl(
  filename: string,
  folder: 'photos' | 'thumbnails' = 'photos',
  expiresIn: number = 3600
): Promise<string> {
  
  if (STORAGE_CONFIG.mode === 'local') {
    // LOCAL STORAGE - return direct URL
    return `${STORAGE_CONFIG.local.baseUrl}/${folder}/${filename}`;
    
  } else {
    // CLOUDFLARE R2 - generate signed URL
    const key = `${folder}/${filename}`;
    
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.r2.bucket,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(s3Client!, command, { expiresIn });
    
    return signedUrl;
  }
}

/**
 * Get file stats (size, etc.)
 * 
 * @param filename - Filename
 * @param folder - Subfolder
 * @returns File stats
 */
export async function getFileStats(
  filename: string,
  folder: 'photos' | 'thumbnails' = 'photos'
): Promise<{ size: number }> {
  
  if (STORAGE_CONFIG.mode === 'local') {
    // LOCAL STORAGE
    const folderPath = folder === 'photos' 
      ? STORAGE_CONFIG.local.photosDir 
      : STORAGE_CONFIG.local.thumbnailsDir;
    
    const filePath = path.join(folderPath, filename);
    const stats = fs.statSync(filePath);
    
    return { size: stats.size };
    
  } else {
    // CLOUDFLARE R2 STORAGE
    // For R2, we'd need to fetch and check size
    // For now, return estimated size
    const file = await getFile(filename, folder);
    return { size: file.length };
  }
}

/**
 * TEACHING MOMENT: Storage Abstraction
 * 
 * This service provides a unified interface for file storage.
 * The SAME functions work for both local and R2 storage!
 * 
 * uploadFile() - saves to local disk OR R2 bucket
 * getFile() - reads from local disk OR R2 bucket
 * deleteFile() - removes from local disk OR R2 bucket
 * 
 * Just change STORAGE_MODE in .env to switch!
 * 
 * Development: STORAGE_MODE=local
 * Production: STORAGE_MODE=r2
 */
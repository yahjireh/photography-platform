/**
 * Storage Configuration
 * Handles both local storage (development) and Cloudflare R2 (production)
 */

export const STORAGE_CONFIG = {
  // Storage mode: 'local' or 'r2'
  mode: process.env.STORAGE_MODE || 'local',
  
  // Local storage settings
  local: {
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
    photosDir: process.env.PHOTOS_DIR || './uploads/photos',
    thumbnailsDir: process.env.THUMBNAILS_DIR || './uploads/thumbnails',
    baseUrl: process.env.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads'
  },
  
  // Cloudflare R2 settings (S3-compatible)
  r2: {
    endpoint: process.env.R2_ENDPOINT 
      ? process.env.R2_ENDPOINT.replace(/\/+$/, '').replace(/\/[^/]+$/, (match) => {
          // If the URL ends with the bucket name (e.g. /clickflicks), remove it
          const bucket = process.env.R2_BUCKET || 'clickflicks';
          return match.slice(1) === bucket ? '' : match;
        })
      : undefined,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || (process.env as any).R2_SECRET_ACCESS,
    bucket: process.env.R2_BUCKET || 'clickflicks',
    region: process.env.R2_REGION || 'auto',
    publicUrl: process.env.R2_PUBLIC_URL ? process.env.R2_PUBLIC_URL.replace(/\/+$/, '') : undefined // e.g., https://your-bucket.r2.dev
  },
  
  // Image processing settings
  image: {
    maxFileSizeMB: 15,
    maxFileSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    thumbnail: {
      width: 400,
      height: 400,
      quality: 80
    },
    compression: {
      quality: 85,
      maxWidth: 2400,
      maxHeight: 2400
    }
  },
  
  // Upload limits
  limits: {
    maxPhotosPerBooking: 100,
    maxPhotosPerUpload: 20
  }
};

/**
 * Validate storage configuration
 */
export function validateStorageConfig(): void {
  console.log('📦 Storage Configuration:');
  console.log(`   Mode: ${STORAGE_CONFIG.mode}`);
  
  if (STORAGE_CONFIG.mode === 'local') {
    console.log(`   Local directory: ${STORAGE_CONFIG.local.photosDir}`);
    console.log(`   ⚠️  Using LOCAL storage (development mode)`);
  } else if (STORAGE_CONFIG.mode === 'r2') {
    if (!STORAGE_CONFIG.r2.endpoint || 
        !STORAGE_CONFIG.r2.accessKeyId || 
        !STORAGE_CONFIG.r2.secretAccessKey) {
      throw new Error('R2 storage credentials not configured. Check environment variables.');
    }
    console.log(`   Bucket: ${STORAGE_CONFIG.r2.bucket}`);
    console.log(`   ✅ Using Cloudflare R2 (production mode)`);
  } else {
    throw new Error(`Invalid storage mode: ${STORAGE_CONFIG.mode}. Must be 'local' or 'r2'`);
  }
  
  console.log(`   Max file size: ${STORAGE_CONFIG.image.maxFileSizeMB}MB`);
  console.log(`   Max photos per upload: ${STORAGE_CONFIG.limits.maxPhotosPerUpload}`);
}
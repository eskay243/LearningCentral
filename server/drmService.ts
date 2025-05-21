import { EncryptJWT, jwtDecrypt } from 'jose';
import crypto from 'crypto';
import type { User } from '@shared/schema';

// DRM protection types
export enum DrmProtectionType {
  NONE = 'none',
  BASIC = 'basic',           // Simple encryption
  WATERMARKED = 'watermark', // Content with user-specific watermarks
  TIMED = 'timed',           // Time-limited access
  PREMIUM = 'premium'        // Full protection (encryption + watermark + device limits)
}

// Secret key for encryption - in production, use a secure key management system
const DRM_SECRET = new TextEncoder().encode(
  process.env.DRM_SECRET_KEY || crypto.randomBytes(32).toString('hex')
);

/**
 * Encrypt content with DRM protection
 */
export async function encryptContent(content: string, drmType: DrmProtectionType): Promise<string> {
  if (drmType === DrmProtectionType.NONE) {
    return content;
  }
  
  try {
    const encryptedContent = await new EncryptJWT({ content })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime('30d') // For timed content, set appropriate expiry
      .encrypt(DRM_SECRET);
    
    return encryptedContent;
  } catch (error) {
    console.error('Error encrypting content:', error);
    throw new Error('Failed to apply DRM protection');
  }
}

/**
 * Decrypt DRM-protected content
 */
export async function decryptContent(encryptedContent: string, user: User): Promise<string> {
  try {
    const { payload } = await jwtDecrypt(encryptedContent, DRM_SECRET);
    return payload.content as string;
  } catch (error) {
    console.error('DRM decryption error:', error);
    throw new Error('Access denied: Unable to decrypt protected content');
  }
}

/**
 * Apply watermark to content based on user information
 */
export function applyWatermark(content: string, user: User): string {
  if (!content) return content;
  
  const userWatermark = `This content is licensed to ${user.firstName || ''} ${user.lastName || ''} (${user.email || user.id})`;
  
  // For text content
  if (!content.includes('<video') && !content.includes('<img')) {
    return `${content}\n\n${userWatermark}`;
  }
  
  // For HTML content with videos/images
  return content.replace('</body>', `
    <div class="drm-watermark" style="position: fixed; bottom: 20px; right: 20px; opacity: 0.7; 
    background: rgba(0,0,0,0.5); color: white; padding: 8px; border-radius: 4px; z-index: 1000;">
      ${userWatermark}
    </div>
    </body>
  `);
}

/**
 * Check if user has access to DRM-protected content
 */
export async function hasAccessToProtectedContent(
  userId: string, 
  courseId: number, 
  lessonId: number,
  storage: any
): Promise<boolean> {
  try {
    // Check if user is enrolled in the course
    const enrollment = await storage.getCourseEnrollment({ userId, courseId });
    
    if (!enrollment || enrollment.paymentStatus !== 'paid') {
      return false;
    }
    
    // Check if user has permission to access this specific lesson
    const lesson = await storage.getLesson(lessonId);
    
    // If it's a preview lesson, allow access regardless of DRM status
    if (lesson.isPreview) {
      return true;
    }
    
    return !!enrollment;
  } catch (error) {
    console.error('Error checking DRM access:', error);
    return false;
  }
}

/**
 * Generate a secure video streaming URL with expiring token
 */
export async function generateSecureVideoUrl(videoUrl: string, user: User): Promise<string> {
  if (!videoUrl) return '';
  
  // Create a JWT token with short expiry (30 minutes)
  const token = await new EncryptJWT({
    uid: user.id,
    resource: videoUrl,
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .encrypt(DRM_SECRET);
  
  // Return the secure URL with token
  return `/api/protected-video?token=${encodeURIComponent(token)}`;
}
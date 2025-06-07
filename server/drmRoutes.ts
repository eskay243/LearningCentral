import { Router, Request, Response } from 'express';
import { 
  encryptContent, 
  decryptContent, 
  applyWatermark, 
  hasAccessToProtectedContent,
  generateSecureVideoUrl,
  DrmProtectionType 
} from './drmService';
import { isAuthenticated, hasRole } from './simpleAuth';
import { UserRole } from '@shared/schema';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';
import { jwtDecrypt } from 'jose';
import crypto from 'crypto';

const router = Router();

// DRM Secret key
const DRM_SECRET = new TextEncoder().encode(
  process.env.DRM_SECRET_KEY || crypto.randomBytes(32).toString('hex')
);

// Enable/disable DRM for a lesson
router.post('/admin/lessons/:lessonId/drm', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res: Response) => {
  try {
    const { lessonId } = req.params;
    const { drmType } = req.body;

    if (!Object.values(DrmProtectionType).includes(drmType)) {
      return res.status(400).json({ message: "Invalid DRM type" });
    }
    
    // Get the current lesson
    const lesson = await storage.getLesson(parseInt(lessonId));
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    
    // Apply DRM to the lesson
    if (drmType !== DrmProtectionType.NONE && lesson.content) {
      // Encrypt the content based on DRM type
      const protectedContent = await encryptContent(lesson.content, drmType);
      
      // Update the lesson with protected content and DRM type
      await storage.updateLesson(lesson.id, {
        ...lesson,
        content: protectedContent,
        drm: drmType
      });
    } else if (drmType === DrmProtectionType.NONE && lesson.drm !== DrmProtectionType.NONE) {
      // If we're removing DRM, we need to decrypt the content
      try {
        if (lesson.content) {
          const decryptedContent = await decryptContent(lesson.content, req.user);
          await storage.updateLesson(lesson.id, {
            ...lesson,
            content: decryptedContent,
            drm: DrmProtectionType.NONE
          });
        }
      } catch (decryptError) {
        // If we can't decrypt (e.g., not valid JWT), just update the DRM type
        await storage.updateLesson(lesson.id, {
          ...lesson,
          drm: DrmProtectionType.NONE
        });
      }
    }
    
    res.json({ message: "DRM settings updated successfully" });
  } catch (error) {
    console.error("Error updating DRM settings:", error);
    res.status(500).json({ message: "Failed to update DRM settings" });
  }
});

// Get protected lesson content
router.get('/lessons/:lessonId/protected-content', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.claims.sub;
    
    // Get the lesson
    const lesson = await storage.getLesson(parseInt(lessonId));
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    
    // If the lesson has no DRM or is a preview, return the content directly
    if (lesson.drm === DrmProtectionType.NONE || lesson.isPreview) {
      return res.json({ content: lesson.content, drm: lesson.drm });
    }
    
    // Check if the user has access to this protected content
    const hasAccess = await hasAccessToProtectedContent(
      userId, 
      lesson.module?.courseId || 0, 
      lesson.id,
      storage
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this content. Please enroll in the course." });
    }
    
    // Decrypt the content
    try {
      const decryptedContent = await decryptContent(lesson.content, req.user);
      
      // Apply watermark for watermarked or premium content
      if (
        lesson.drm === DrmProtectionType.WATERMARKED || 
        lesson.drm === DrmProtectionType.PREMIUM
      ) {
        const watermarkedContent = applyWatermark(decryptedContent, req.user);
        return res.json({ content: watermarkedContent, drm: lesson.drm });
      }
      
      return res.json({ content: decryptedContent, drm: lesson.drm });
    } catch (error) {
      return res.status(403).json({ message: "Unable to access protected content" });
    }
  } catch (error) {
    console.error("Error getting protected lesson content:", error);
    res.status(500).json({ message: "Failed to retrieve protected content" });
  }
});

// Stream protected video content
router.get('/protected-video', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: "Missing access token" });
    }
    
    try {
      // Verify the token
      const { payload } = await jwtDecrypt(token as string, DRM_SECRET);
      const { uid, resource } = payload as { uid: string, resource: string };
      
      // Verify the user ID matches
      if (uid !== req.user.claims.sub) {
        return res.status(403).json({ message: "Invalid access token" });
      }
      
      // If resource is a local file, stream it
      if (resource.startsWith('/')) {
        if (!fs.existsSync(resource)) {
          return res.status(404).json({ message: "Video not found" });
        }
        
        // Get file details
        const stat = fs.statSync(resource);
        const fileSize = stat.size;
        const range = req.headers.range;
        
        if (range) {
          // Handle range requests for video seeking
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(resource, { start, end });
          
          // Set streaming headers
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
          });
          
          file.pipe(res);
        } else {
          // Stream the entire file
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
          });
          
          fs.createReadStream(resource).pipe(res);
        }
      } else {
        // For remote resources, redirect to signed URL
        res.redirect(resource);
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(403).json({ message: "Invalid or expired access token" });
    }
  } catch (error) {
    console.error("Error streaming protected video:", error);
    res.status(500).json({ message: "Failed to stream protected video" });
  }
});

// Generate secure streaming URL for video
router.get('/lessons/:lessonId/secure-video-url', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { lessonId } = req.params;
    
    // Get the lesson
    const lesson = await storage.getLesson(parseInt(lessonId));
    if (!lesson || !lesson.videoUrl) {
      return res.status(404).json({ message: "Video content not found" });
    }
    
    // If no DRM or is preview, return the video URL directly
    if (lesson.drm === DrmProtectionType.NONE || lesson.isPreview) {
      return res.json({ videoUrl: lesson.videoUrl });
    }
    
    // Check if user has access to this protected content
    const hasAccess = await hasAccessToProtectedContent(
      req.user.claims.sub, 
      lesson.module?.courseId || 0, 
      lesson.id,
      storage
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this video. Please enroll in the course." });
    }
    
    // Generate secure video URL
    const secureUrl = await generateSecureVideoUrl(lesson.videoUrl, req.user);
    res.json({ videoUrl: secureUrl });
  } catch (error) {
    console.error("Error generating secure video URL:", error);
    res.status(500).json({ message: "Failed to generate secure video URL" });
  }
});

export default router;
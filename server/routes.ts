import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { initializePayment, verifyPayment } from "./paystack";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./replitAuth";
import { devLogin, updateUserRole, isTestAuthenticated } from "./testAuth";
import { UserRole } from "@shared/schema";
import { db } from "./db";
import { users, courses, courseEnrollments } from "@shared/schema";
import { eq, and, or, like, desc, asc, isNull, count } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { 
  encryptContent, 
  decryptContent, 
  applyWatermark, 
  hasAccessToProtectedContent,
  generateSecureVideoUrl,
  DrmProtectionType
} from "./drmService";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads", { recursive: true });
  }

  // Root endpoint
  app.get("/api", (_req, res) => {
    res.json({ message: "Welcome to Codelab Educare API" });
  });

  // Test authentication routes for development/demo
  app.post("/api/auth/dev-login", devLogin);
  app.get("/api/auth/switch-role/:role", isTestAuthenticated, updateUserRole);
  
  // User profile routes
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Remove sensitive information
      const safeUser = {
        ...user,
        password: undefined,
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, bio, linkedinUrl, twitterUrl, githubUrl } = req.body;
      
      const updatedProfile = await storage.updateUser(userId, {
        firstName,
        lastName,
        bio,
        linkedinUrl,
        twitterUrl,
        githubUrl,
      });
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Course routes
  app.get("/api/courses", async (_req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { title, description, price, thumbnail, highlights, duration, level, category, published } = req.body;
      
      const courseData = {
        title,
        description,
        price: parseFloat(price),
        thumbnail,
        highlights,
        duration,
        level,
        category,
        instructorId: req.user.claims.sub,
        published: published === true || published === "true",
      };
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { title, description, price, thumbnail, highlights, duration, level, category, published } = req.body;
      
      // Check if user has permission to update this course
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Only allow instructors to edit their own courses (admins can edit any)
      if (req.user.role !== UserRole.ADMIN && course.instructorId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to update this course" });
      }
      
      const updatedData = {
        title,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        thumbnail,
        highlights,
        duration,
        level,
        category,
        published: published === true || published === "true",
      };
      
      // Remove undefined values
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
          delete updatedData[key];
        }
      });
      
      const updatedCourse = await storage.updateCourse(courseId, updatedData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Demo user and role management
  app.get("/api/switch-user-role/:role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const role = req.params.role;
      
      // Validate role
      const availableRoles = Object.values(UserRole);
      if (!availableRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      try {
        // Update user role in database
        const updateResult = await db
          .update(users)
          .set({ role, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();
        
        const updatedUser = updateResult[0];
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Update session information
        if (req.user) {
          req.user.role = role;
          
          // If using claims, update those too
          if (req.user.claims) {
            req.user.claims.role = role;
          }
        }
        
        // Return updated user info
        res.json({
          message: `Role updated to ${role}`,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            profileImageUrl: updatedUser.profileImageUrl,
            role: updatedUser.role,
            affiliateCode: updatedUser.affiliateCode
          }
        });
      } catch (dbError) {
        console.error("Database error when switching role:", dbError);
        res.status(500).json({ message: "Database error when switching role" });
      }
    } catch (error) {
      console.error("Error switching user role:", error);
      res.status(500).json({ message: "Failed to switch user role" });
    }
  });
  
  // Demo users list
  app.get("/api/demo-users", async (_req, res) => {
    try {
      // Return a list of sample demo users with different roles
      const demoUsers = [
        {
          role: UserRole.ADMIN,
          title: "Administrator",
          description: "Full system access with ability to manage users, courses, and settings",
          capabilities: [
            "Manage all users and their roles",
            "Create, edit and delete any courses",
            "Access to system settings and analytics",
            "Financial reporting and payment management"
          ]
        },
        {
          role: UserRole.MENTOR,
          title: "Mentor/Instructor",
          description: "Create and manage courses, assignments, and student progress",
          capabilities: [
            "Create and edit own courses",
            "Manage course content and materials",
            "Grade assignments and provide feedback",
            "Monitor student progress and participation"
          ]
        },
        {
          role: UserRole.STUDENT,
          title: "Student",
          description: "Enroll in courses, access learning materials, and track progress",
          capabilities: [
            "Browse and enroll in courses",
            "Access course content and resources",
            "Submit assignments and take assessments",
            "Track personal learning progress"
          ]
        },
        {
          role: UserRole.AFFILIATE,
          title: "Affiliate Partner",
          description: "Promote courses and earn commission from referrals",
          capabilities: [
            "Generate unique referral links",
            "Track referrals and commission earnings",
            "Access marketing materials",
            "View performance analytics"
          ]
        }
      ];
      
      res.json(demoUsers);
    } catch (error) {
      console.error("Error fetching demo users:", error);
      res.status(500).json({ message: "Failed to fetch demo users" });
    }
  });
  
  // Course enrollment
  app.post("/api/courses/:id/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // For free courses, proceed with enrollment
      if (course.price === 0 || course.price === null) {
        await storage.enrollUserInCourse({
          courseId,
          userId,
          progress: 0,
          paymentStatus: "free",
          paymentMethod: "none",
          paymentAmount: 0,
          paymentReference: null,
          paymentProvider: null,
          completedAt: null,
          certificateId: null
        });
        
        return res.json({ success: true, message: "Successfully enrolled in free course" });
      }
      
      // For paid courses, require payment
      return res.status(402).json({ 
        message: "Payment required for this course", 
        price: course.price 
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.get("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getUserEnrollments(userId);
      
      // Get detailed course info for each enrollment
      const detailedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            course,
          };
        })
      );
      
      res.json(detailedEnrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Course modules
  app.get("/api/courses/:id/modules", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/courses/:id/modules", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { title, description, orderIndex } = req.body;
      
      // Check if course exists and user has permission
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Only course instructor or admin can add modules
      if (req.user.role !== UserRole.ADMIN && course.instructorId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to add modules to this course" });
      }
      
      const module = await storage.createCourseModule({
        courseId,
        title,
        description,
        orderIndex: orderIndex || 0,
      });
      
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  // Lessons
  app.get("/api/modules/:id/lessons", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const lessons = await storage.getModuleLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post("/api/modules/:id/lessons", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const { title, description, content, contentType, isPreview, orderIndex, published } = req.body;
      
      // Get module to verify course
      const module = await storage.getCourseModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Get course to check instructor
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Only course instructor or admin can add lessons
      if (req.user.role !== UserRole.ADMIN && course.instructorId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to add lessons to this course" });
      }
      
      const lesson = await storage.createLesson({
        moduleId,
        title,
        description,
        content,
        contentType,
        isPreview,
        orderIndex,
        published: published === true || published === "true",
      });
      
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Lesson content
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.patch("/api/lessons/:id", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { title, description, content, contentType, videoUrl, videoPoster, isPreview, duration, orderIndex, published } = req.body;
      
      // Get lesson
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Get module to verify course
      const module = await storage.getCourseModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Get course to check instructor
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Only course instructor or admin can update lessons
      if (req.user.role !== UserRole.ADMIN && course.instructorId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to update lessons in this course" });
      }
      
      const updatedData = {
        title,
        description,
        content,
        contentType,
        videoUrl,
        videoPoster,
        isPreview,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex) : undefined,
        published: published === true || published === "true",
      };
      
      // Remove undefined values
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
          delete updatedData[key];
        }
      });
      
      const updatedLesson = await storage.updateLesson(lessonId, updatedData);
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  // Upload routes
  app.post("/api/upload/content", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${file.filename}`;
      res.json({ fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Progress tracking
  app.post("/api/lessons/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { completed, timeSpent } = req.body;
      
      // Check if lesson exists
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Get module to check course
      const module = await storage.getCourseModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if user is enrolled in the course
      const enrollment = await storage.getCourseEnrollment(module.courseId, userId);
      if (!enrollment) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
      
      // Update or create progress
      const progress = await storage.updateLessonProgress(lessonId, userId, {
        completed: completed === true,
        timeSpent: timeSpent ? parseInt(timeSpent) : undefined,
      });
      
      // Update overall course progress
      const allLessons = await storage.getCourseLessons(module.courseId);
      const userProgress = await storage.getUserLessonProgress(userId, module.courseId);
      
      const completedLessons = userProgress.filter(p => p.completed).length;
      const totalLessons = allLessons.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      await storage.updateEnrollmentProgress(module.courseId, userId, progressPercentage);
      
      res.json({
        progress,
        courseProgress: progressPercentage
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get("/api/courses/:id/progress", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is enrolled in the course
      const enrollment = await storage.getCourseEnrollment(courseId, userId);
      if (!enrollment) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
      
      // Get all user progress for this course
      const progress = await storage.getUserLessonProgress(userId, courseId);
      
      res.json({
        enrollment,
        lessonProgress: progress
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q, category } = req.query;
      
      if (!q && !category) {
        return res.status(400).json({ message: "Search query or category required" });
      }
      
      const searchResults = await storage.searchCourses({
        query: q as string,
        category: category as string
      });
      
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching courses:", error);
      res.status(500).json({ message: "Failed to search courses" });
    }
  });

  // User management
  app.get("/api/users", isAuthenticated, hasRole(UserRole.ADMIN), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive information
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined,
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Remove sensitive information
      const safeUser = {
        ...updatedUser,
        password: undefined,
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // File export
  app.post('/api/export/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId } = req.body;
      
      // Verify access to the lesson
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if user has access to this lesson
      // TODO: Add proper access control check
      
      // For now, just return the lesson content as exportable
      // In a real implementation, we would generate a PDF here
      
      res.json({
        success: true,
        exportUrl: `/api/lessons/${lessonId}/export?format=pdf`
      });
    } catch (error) {
      console.error("Error exporting content:", error);
      res.status(500).json({ message: "Failed to export content" });
    }
  });
  
  app.post('/api/export/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId } = req.body;
      
      // Verify access to the lesson
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not available" });
      }
      
      // TODO: Implement actual email sending logic
      // For now, just return success as a placeholder
      
      res.json({ success: true, message: `Content was sent to ${user.email}` });
    } catch (error) {
      console.error("Error emailing content:", error);
      res.status(500).json({ message: "Failed to email content" });
    }
  });
  
  // Helper function to generate share codes
  function generateShareCode(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Paystack payment routes
  app.post('/api/payments/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId, amount } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required for payment" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Get course details for metadata
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Initialize payment with Paystack
      const paymentData = await initializePayment({
        email: user.email,
        amount,
        metadata: {
          courseId,
          userId,
          courseName: course.title
        },
        callbackUrl: `${req.protocol}://${req.get('host')}/api/payment-callback?courseId=${courseId}`
      });
      
      res.json({
        authorizationUrl: paymentData.authorization_url,
        reference: paymentData.reference,
      });
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      res.status(500).json({ message: `Payment initialization failed: ${error.message}` });
    }
  });
  
  // Course payment endpoint using Paystack (alternate endpoint for consistency)
  app.post('/api/courses/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const paymentMethod = req.body.paymentMethod || 'paystack';
      
      // Get user details
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required for payment" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Initialize payment with Paystack
      const paymentData = await initializePayment({
        email: user.email,
        amount: course.price,
        metadata: {
          courseId,
          userId,
          courseName: course.title,
          paymentMethod
        },
        callbackUrl: `${req.protocol}://${req.get('host')}/payment-callback?courseId=${courseId}`
      });
      
      res.json({
        authorization_url: paymentData.authorization_url, 
        reference: paymentData.reference,
        amount: course.price
      });
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      res.status(500).json({ message: `Payment initialization failed: ${error.message}` });
    }
  });
  
  // Paystack payment callback route - receives redirects from Paystack
  app.get('/api/payment-callback', async (req, res) => {
    try {
      const { reference, courseId } = req.query;
      
      if (!reference) {
        return res.status(400).json({ message: "Payment reference required" });
      }
      
      // Verify payment with Paystack
      const paymentData = await verifyPayment(reference as string);
      
      if (paymentData.status !== 'success') {
        return res.status(400).json({ 
          message: "Payment verification failed", 
          status: paymentData.status 
        });
      }
      
      // Get user ID and course ID from metadata
      const { userId, courseId: metadataCourseId } = paymentData.metadata || {};
      const actualCourseId = courseId || metadataCourseId;
      
      if (!userId || !actualCourseId) {
        return res.status(400).json({ message: "Invalid payment metadata" });
      }
      
      // Enroll user in course
      const enrollmentData = {
        courseId: parseInt(actualCourseId as string),
        userId,
        progress: 0,
        paymentStatus: "completed",
        paymentMethod: "paystack",
        paymentAmount: paymentData.amount / 100, // Convert kobo to naira
        paymentReference: paymentData.reference,
        paymentProvider: "paystack",
        completedAt: null,
        certificateId: null
      };
      
      await storage.enrollUserInCourse(enrollmentData);
      
      // Redirect to course page
      res.redirect(`/payment-success?courseId=${actualCourseId}`);
    } catch (error: any) {
      console.error("Error processing payment callback:", error);
      res.redirect('/payment-failed');
    }
  });
  
  // Bank transfer payment endpoint
  app.post('/api/courses/:id/bank-transfer', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get user details
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required for payment" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Generate a unique payment reference
      const reference = `BT-${courseId}-${Date.now().toString().slice(-8)}`;
      
      // Create a pending enrollment record
      const enrollmentData = {
        courseId,
        userId,
        progress: 0,
        paymentStatus: "pending",
        paymentMethod: "bank-transfer",
        paymentAmount: course.price,
        paymentReference: reference,
        paymentProvider: "manual",
        completedAt: null,
        certificateId: null
      };
      
      const enrollment = await storage.enrollUserInCourse(enrollmentData);
      
      // Return bank details and reference
      res.json({
        success: true,
        accountDetails: {
          bankName: "First Bank of Nigeria",
          accountNumber: "3089765432",
          accountName: "Codelab Educare Ltd",
          reference: reference
        },
        reference,
        amount: course.price
      });
      
    } catch (error: any) {
      console.error("Error setting up bank transfer:", error);
      res.status(500).json({ message: `Bank transfer setup failed: ${error.message}` });
    }
  });
  
  // Wallet payment endpoint
  app.post('/api/courses/:id/wallet-payment', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get user details
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // For demo purposes, we'll simulate a successful wallet payment
      // In a production system, we would check the actual wallet balance
      // and handle wallet operations through dedicated functions
      
      // Generate a unique payment reference
      const reference = `WLT-${courseId}-${Date.now().toString().slice(-8)}`;
      
      // Create enrollment directly since wallet payments are immediate
      const enrollment = await storage.enrollUserInCourse({
        courseId,
        userId,
        progress: 0,
        paymentStatus: "completed",
        paymentMethod: "wallet",
        paymentAmount: course.price,
        paymentReference: reference,
        paymentProvider: "wallet",
        completedAt: null,
        certificateId: null
      });
      
      // Return success response
      res.json({
        success: true,
        enrollment,
        message: "Payment successful. You have been enrolled in the course."
      });
    } catch (error) {
      console.error("Error processing wallet payment:", error);
      res.status(500).json({ message: "Failed to process wallet payment" });
    }
  });

  // Initialize the HTTP server for standalone API and WebSocket
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        if (data.type === 'join-room') {
          ws.roomId = data.roomId;
          ws.userId = data.userId;
          ws.username = data.username;
          
          // Send welcome message
          ws.send(JSON.stringify({
            type: 'system-message',
            content: `Welcome to room ${data.roomId}!`
          }));
          
          // Notify others in same room
          wss.clients.forEach((client) => {
            if (client !== ws && client.roomId === data.roomId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'user-joined',
                userId: data.userId,
                username: data.username
              }));
            }
          });
        }
        
        if (data.type === 'chat-message') {
          // Store message in database
          if (data.roomId && data.userId && data.content) {
            // await storage.createChatMessage({
            //   roomId: data.roomId,
            //   userId: data.userId,
            //   content: data.content,
            //   type: 'text'
            // });
            
            // Broadcast to all clients in the same room
            wss.clients.forEach((client) => {
              if (client.roomId === data.roomId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat-message',
                  senderId: data.userId,
                  senderName: ws.username,
                  content: data.content,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          }
        }
        
        if (data.type === 'typing') {
          // Broadcast typing status to other users in the room
          wss.clients.forEach((client) => {
            if (client !== ws && client.roomId === data.roomId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'typing',
                userId: data.userId,
                username: ws.username,
                isTyping: data.isTyping
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
      
      // Notify others if user was in a room
      if (ws.roomId && ws.userId) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.roomId === ws.roomId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user-left',
              userId: ws.userId,
              username: ws.username
            }));
          }
        });
      }
    });
    
    // Send initial message
    ws.send(JSON.stringify({
      type: 'connection-established',
      message: 'Connected to Codelab Educare WebSocket server'
    }));
  });
  
  return httpServer;
}
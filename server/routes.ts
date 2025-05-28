import { type Express, type Request } from "express";
import * as expressModule from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Mock data for UI display when database is not fully connected
const mockData = {
  courses: Array(6).fill(null).map((_, i) => ({
    id: i + 1,
    title: `Web Development ${i + 1}`,
    description: 'Learn modern web development with React, Node.js, and PostgreSQL',
    coverImage: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
    price: 25000,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    enrolledStudents: Math.floor(Math.random() * 200),
    rating: 4.5 + (Math.random() * 0.5),
    instructor: 'Dr. Adeola Johnson',
    categories: ['Programming', 'Web Development'],
    isNew: i < 2,
    isFeatured: i % 3 === 0,
    duration: '12 weeks',
    completionRate: 78 + (Math.floor(Math.random() * 20)),
    lastUpdated: '2 weeks ago'
  })),
  upcomingClasses: Array(3).fill(null).map((_, i) => ({
    id: i + 1,
    title: `Advanced JavaScript Concepts`,
    date: '2023-07-15',
    time: '10:00 AM',
    duration: '2 hours',
    instructor: 'Prof. Chinedu Okonkwo',
    courseName: 'Full-Stack JavaScript',
    courseId: 2,
    status: i === 0 ? 'live' : 'scheduled',
    meetingUrl: 'https://meet.zoom.us/123456789'
  })),
  studentProgress: Array(5).fill(null).map((_, i) => ({
    id: i + 1,
    studentName: `Student ${i + 1}`,
    profileImage: 'https://avatars.githubusercontent.com/u/12345678',
    course: 'React Development',
    progress: 30 + Math.floor(Math.random() * 70),
    lastActivity: '3 hours ago',
    status: i % 3 === 0 ? 'at-risk' : (i % 2 === 0 ? 'inactive' : 'active')
  })),
  recentActivity: Array(10).fill(null).map((_, i) => ({
    id: i + 1,
    type: ['completed', 'submitted', 'joined', 'commented', 'message'][i % 5],
    content: `Activity ${i + 1} related to course content or assessment`,
    timestamp: '2 hours ago',
    user: `User ${i + 1}`,
    userImage: 'https://avatars.githubusercontent.com/u/12345678',
    link: {
      url: '/courses/1',
      text: 'View Details'
    }
  }))
};
import { setupAuth, isAuthenticated, hasRole } from "./replitAuth";
import { z } from "zod";
import { UserRole, Currency } from "@shared/schema";
import { initializePayment, verifyPayment } from "./paystack";
import { setUserAsAdmin } from "./admin-setup";
import { registerAssessmentRoutes } from "./assessmentRoutes";
import { registerAnalyticsRoutes } from "./analyticsRoutes";
import { registerCommunicationRoutes } from "./registerCommunicationRoutes";
import { registerCodeCompanionRoutes } from "./codeCompanionRoutes";
import { setupWebSocketServer } from "./websocketServer";
import certificateRoutes from "./certificateRoutes";
import drmRoutes from "./drmRoutes";


// Set up storage for uploaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      cb(null, false);
      return;
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard data endpoints with fallback to mock data
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      // In future, get this from database
      res.json({
        students: { count: 1250, change: 12.5 },
        courses: { count: 48, change: 8.3 },
        revenue: { amount: 825000, change: 15.2, currency: 'NGN' },
        completionRate: { rate: 83.7, change: 4.2 }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });
  
  app.get('/api/dashboard/courses', async (req, res) => {
    try {
      res.json(mockData.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });
  
  app.get('/api/dashboard/upcoming-classes', async (req, res) => {
    try {
      res.json(mockData.upcomingClasses);
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming classes' });
    }
  });
  
  app.get('/api/dashboard/student-progress', async (req, res) => {
    try {
      res.json(mockData.studentProgress);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      res.status(500).json({ error: 'Failed to fetch student progress' });
    }
  });
  
  app.get('/api/dashboard/recent-activity', async (req, res) => {
    try {
      res.json(mockData.recentActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  });
  // Initialize authentication without waiting for system settings
  try {
    // We'll properly initialize system settings later
    console.log("Skipping system settings initialization for now");
  } catch (error) {
    console.error("Error initializing system settings:", error);
  }
  // Setup authentication middleware first
  try {
    await setupAuth(app);
  } catch (error) {
    console.error("Error setting up authentication:", error);
    // Continue without auth for development purposes
  }
  
  // Now add the role-switching endpoint (after auth is set up)
  app.get("/api/switch-user-role/:role", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.claims?.sub) {
        return res.status(401).json({ message: "You must be logged in to switch roles" });
      }

      const userId = req.user.claims.sub;
      const { role } = req.params;
      
      // Validate role parameter
      if (!Object.values(UserRole).includes(role as any)) {
        return res.status(400).json({ 
          message: "Invalid role specified", 
          validRoles: Object.values(UserRole) 
        });
      }
      
      // Update the current user's role
      const updatedUser = await storage.upsertUser({
        id: userId,
        role: role as any,
      });
      
      // Also update the session with the new role
      if (req.user) {
        req.user.role = role as any;
      }
      
      res.json({
        message: `Your role has been updated to ${role}`,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error switching user role:", error);
      res.status(500).json({ message: "Failed to switch user role" });
    }
  });
  
  // Serve uploads directory as static files
  app.use('/uploads', expressModule.default.static(uploadsDir));
  
  // Register assessment routes
  registerAssessmentRoutes(app);
  
  // Register analytics routes
  registerAnalyticsRoutes(app);
  
  // Register communication routes
  registerCommunicationRoutes(app);
  
  // Register Code Companion routes
  registerCodeCompanionRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // User should now include both database user and claims
      if (req.user && req.user.id) {
        res.json(req.user);
      } else if (req.user && req.user.claims && req.user.claims.sub) {
        // Fallback to fetching user from database if not included
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          // Combine with claims
          res.json({
            ...user,
            claims: req.user.claims
          });
        } else {
          throw new Error("User not found in database");
        }
      } else {
        throw new Error("Invalid user data in session");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // Setup admin user - this endpoint will make the currently logged in user an admin
  app.post('/api/setup-admin', isAuthenticated, async (req: any, res) => {
    try {
      // Get user ID from either the user object directly or from claims
      const userId = req.user.id || (req.user.claims && req.user.claims.sub);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user session data" });
      }
      
      const updatedUser = await setUserAsAdmin(userId);
      
      if (!updatedUser) {
        return res.status(400).json({ message: "Failed to set user as admin" });
      }
      
      res.json({ 
        message: "You have been successfully set as an admin", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error setting up admin:", error);
      res.status(500).json({ message: "An error occurred while setting up admin" });
    }
  });
  
  // Admin routes
  app.get('/api/admin/users', isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const users = await storage.getUsersByRole();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Course image upload endpoint
  app.post('/api/upload/course-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate a unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `course-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const newPath = path.join('./uploads', fileName);
      
      // Move file to final location
      fs.renameSync(req.file.path, newPath);
      
      // Return the URL
      const imageUrl = `/uploads/${fileName}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
  
  // Categories management endpoints
  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const { value, label } = req.body;
      
      if (!value || !label) {
        return res.status(400).json({ error: 'Value and label are required' });
      }
      
      // Store category in database or return success
      res.json({ message: 'Category added successfully', category: { value, label } });
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });
  
  app.get('/api/categories', async (req, res) => {
    try {
      // Return categories from database or defaults
      const categories = [
        { value: "javascript", label: "JavaScript" },
        { value: "python", label: "Python" },
        { value: "sql", label: "SQL" },
        { value: "web", label: "Web Development" },
        { value: "data", label: "Data Science" },
        { value: "mobile", label: "Mobile Development" },
        { value: "design", label: "Design" },
        { value: "marketing", label: "Marketing" },
        { value: "business", label: "Business" },
        { value: "other", label: "Other" },
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Categories fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
  
  // Course Management Routes
  app.get('/api/courses', async (req, res) => {
    try {
      const { published } = req.query;
      const isPublished = published === 'true' ? true : 
                        published === 'false' ? false : 
                        undefined;
      
      const courses = await storage.getCourses({ published: isPublished });
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
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

  app.post('/api/courses', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const courseData = {
        title: req.body.title,
        description: req.body.description,
        thumbnail: req.body.thumbnail,
        price: parseFloat(req.body.price) || 0,
        isPublished: req.body.isPublished || false,
        category: req.body.category,
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((tag: string) => tag.trim()) : req.body.tags) : [],
      };
      
      const course = await storage.createCourse(courseData);
      
      // Assign the creator as a mentor for this course if they're a mentor
      if (req.user) {
        // Get user ID and role - either directly from user object or from claims
        const userId = req.user.id || (req.user.claims && req.user.claims.sub);
        const userRole = req.user.role || (req.user.claims && req.user.claims.role);
        
        if (userId && userRole === UserRole.MENTOR) {
          await storage.assignMentorToCourse({
            courseId: course.id,
            mentorId: userId,
            commission: 80  // Default commission for course creator
          });
        }
      }
      
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/courses/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Check if user is a mentor for this course or an admin
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.user.claims;
      const isMentor = user.role === UserRole.MENTOR;
      const isAdmin = user.role === UserRole.ADMIN;
      
      if (isMentor && !isAdmin) {
        const mentors = await storage.getMentorsByCourse(courseId);
        const isCourseMentor = mentors.some(mentor => mentor.id === user.sub);
        
        if (!isCourseMentor) {
          return res.status(403).json({ message: "You do not have permission to update this course" });
        }
      }
      
      const courseData = {
        title: req.body.title,
        description: req.body.description,
        thumbnail: req.body.thumbnail,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : undefined,
        isPublished: req.body.isPublished,
        category: req.body.category,
        tags: req.body.tags,
      };
      
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });
  
  // Course Module Routes
  app.get('/api/courses/:id/modules', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const modules = await storage.getModulesByCourse(courseId);
      
      // For each module, fetch its lessons
      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => {
          const lessons = await storage.getLessonsByModule(module.id);
          return {
            ...module,
            lessons
          };
        })
      );
      
      res.json(modulesWithLessons);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });
  
  app.post('/api/modules', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const moduleData = {
        courseId: req.body.courseId,
        title: req.body.title,
        description: req.body.description,
        orderIndex: req.body.orderIndex || 0
      };
      
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });
  
  // Lesson Routes
  app.get('/api/modules/:moduleId/lessons', async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const lessons = await storage.getLessonsByModule(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });
  
  app.post('/api/lessons', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const lessonData = {
        moduleId: req.body.moduleId,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        contentType: req.body.contentType || "text",
        isPreview: req.body.isPreview || false,
        orderIndex: req.body.orderIndex || 0,
        published: true,
        duration: req.body.duration || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        videoUrl: req.body.videoUrl || null,
        videoPoster: req.body.videoPoster || null,
        videoProgress: null,
        completionCriteria: req.body.completionCriteria || null,
        estimatedTime: req.body.estimatedTime || null,
        difficulty: req.body.difficulty || "beginner",
        prerequisites: req.body.prerequisites || null,
        drm: req.body.drm || null,
        videoProvider: req.body.videoProvider || null,
        isLive: req.body.isLive || false,
        scheduledAt: req.body.scheduledAt || null,
        notes: req.body.notes || null,
        requiresAuth: req.body.requiresAuth || false
      };
      
      const lesson = await storage.createLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });
  
  // Course Enrollment Routes
  // Get all enrolled courses for the current user
  app.get('/api/user/enrollments', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get user ID from either the user object directly or from claims
      const userId = req.user.id || (req.user.claims && req.user.claims.sub);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      
      // Get all enrollments for this user
      const enrollments = await storage.getEnrolledCourses(userId);
      
      if (!enrollments || enrollments.length === 0) {
        return res.json([]);
      }
      
      // Get course details for each enrollment
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          if (!course) return null;
          
          return {
            ...course,
            progress: enrollment.progress,
            enrollmentId: enrollment.id,
            enrolledAt: enrollment.enrolledAt,
            paymentStatus: enrollment.paymentStatus
          };
        })
      );
      
      // Filter out null values (courses that may have been deleted)
      const validCourses = enrolledCourses.filter(course => course !== null);
      
      res.json(validCourses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
  });
  
  // Get enrollment for a specific course
  app.get('/api/courses/:id/enrollment', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get user ID from either the user object directly or from claims
      const userId = req.user.id || (req.user.claims && req.user.claims.sub);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      
      const enrollment = await storage.getCourseEnrollment(courseId, userId);
      res.json(enrollment || null);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });
  
  app.post('/api/courses/:id/enroll', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get user ID from either the user object directly or from claims
      const userId = req.user.id || (req.user.claims && req.user.claims.sub);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getCourseEnrollment(courseId, userId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }
      
      // Get course details to check price
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      let enrollmentData: any = {
        courseId,
        userId,
        progress: 0
      };
      
      // Handle free courses immediately
      if (course.price <= 0) {
        enrollmentData.paymentStatus = "completed";
        const enrollment = await storage.enrollUserInCourse(enrollmentData);
        return res.status(201).json(enrollment);
      }
      
      // For paid courses, handle payment or create pending enrollment
      // For now we'll create a pending enrollment that will be updated after payment
      enrollmentData.paymentStatus = "pending";
      enrollmentData.paymentAmount = course.price;
      
      const enrollment = await storage.enrollUserInCourse(enrollmentData);
      
      res.status(201).json({
        enrollment,
        requiresPayment: true,
        amount: course.price
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });
  
  // Handle file uploads for user creation
  app.post('/api/admin/users', isAuthenticated, hasRole(UserRole.ADMIN), upload.single('profileImage'), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, bio, commissionRate } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Generate the profile image URL if an image was uploaded
      let profileImageUrl = "";
      if (req.file) {
        // Create a URL relative to the server
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        profileImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }
      
      // Create a new user
      const newUser = await storage.createUser({
        id: String(Date.now()), // Generate a temporary ID
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        role: role || "student",
        bio: bio || "",
        profileImageUrl: profileImageUrl,
        password // This will be hashed by the storage layer
      });
      
      // If the user is a mentor, set their commission rate
      if (role === 'mentor' && commissionRate) {
        // Create a system setting for this mentor's default commission
        await storage.updateSystemSetting(
          `mentor.${newUser.id}.defaultCommission`, 
          String(commissionRate), 
          (req.user as any)?.claims?.sub
        );
      }
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.patch('/api/admin/users/:id', isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { commissionRate, ...userData } = req.body;
      
      // Update the user's basic information
      const updatedUser = await storage.updateUser(id, userData);
      
      // If the user is a mentor and commission rate is provided, update it
      if (updatedUser.role === 'mentor' && commissionRate !== undefined) {
        // Update the mentor's commission rate in system settings
        await storage.updateSystemSetting(
          `mentor.${id}.defaultCommission`, 
          String(commissionRate), 
          (req.user as any)?.claims?.sub
        );
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user as admin:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // User routes
  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow users to update their own profile, or admins to update any profile
      const userId = req.user.claims.sub;
      const userToUpdate = await storage.getUser(userId);
      
      if (req.params.id !== userId && userToUpdate?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Unauthorized to update other users" });
      }
      
      // For regular users, only allow certain fields to be updated
      let updateData = req.body;
      if (userToUpdate?.role !== UserRole.ADMIN) {
        // Regular users can only update these fields
        const { firstName, lastName, bio, profileImageUrl } = req.body;
        updateData = { firstName, lastName, bio, profileImageUrl };
      }
      
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const published = req.query.published === 'true';
      const courses = await storage.getCourses({ published });
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
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

  app.post('/api/courses', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      
      // If the creator is a mentor, assign them to the course
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === UserRole.MENTOR) {
        // Check if mentor has a custom commission rate
        const mentorCommissionSetting = await storage.getSystemSetting(`mentor.${userId}.defaultCommission`);
        const commissionRate = mentorCommissionSetting ? parseFloat(mentorCommissionSetting.value) : 37;
        
        await storage.assignMentorToCourse({
          courseId: course.id,
          mentorId: userId,
          commission: commissionRate, // Use mentor's custom rate or default
        });
      }
      
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch('/api/courses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is authorized to update this course
      if (user?.role !== UserRole.ADMIN) {
        const mentors = await storage.getMentorsByCourse(courseId);
        const isMentor = mentors.some(mentor => mentor.id === userId);
        
        if (!isMentor) {
          return res.status(403).json({ message: "Unauthorized to update this course" });
        }
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Module routes
  app.get('/api/courses/:courseId/modules', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const modules = await storage.getModulesByCourse(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post('/api/modules', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const module = await storage.createModule(req.body);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  // Lesson routes
  app.get('/api/modules/:moduleId/lessons', async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await storage.getLessonsByModule(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post('/api/lessons', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const lesson = await storage.createLesson(req.body);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Live session routes
  app.get('/api/live-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { courseId, limit } = req.query;
      
      const options: { courseId?: number; limit?: number } = {};
      
      // Add query parameters if provided
      if (courseId) {
        options.courseId = parseInt(courseId as string);
      }
      
      if (limit) {
        options.limit = parseInt(limit as string);
      }
      
      // Get upcoming live sessions
      const upcomingSessions = await storage.getUpcomingLiveSessions(options);
      
      // Add lesson information to each session
      const sessionsWithDetails = await Promise.all(
        upcomingSessions.map(async (session) => {
          const lesson = await storage.getLesson(session.lessonId);
          return {
            ...session,
            lessonTitle: lesson?.title || "Untitled Lesson",
            lessonDescription: lesson?.description || "",
          };
        })
      );
      
      res.json(sessionsWithDetails);
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      res.status(500).json({ message: "Failed to fetch live sessions" });
    }
  });

  app.post('/api/live-sessions', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const session = await storage.createLiveSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating live session:", error);
      res.status(500).json({ message: "Failed to create live session" });
    }
  });
  
  // Get single live session by ID
  app.get('/api/live-sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getLiveSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Live session not found" });
      }
      
      // Get the lesson information for this session
      const lesson = await storage.getLesson(session.lessonId);
      
      // Get attendance for this session
      const attendees = await storage.getLiveSessionAttendees(sessionId);
      
      // Return enhanced session with lesson details and attendance
      res.json({
        ...session,
        lessonTitle: lesson?.title || "Untitled Lesson",
        lessonDescription: lesson?.description || "",
        attendees
      });
    } catch (error) {
      console.error("Error fetching live session:", error);
      res.status(500).json({ message: "Failed to fetch live session" });
    }
  });
  
  // Record attendance for a live session
  app.post('/api/live-sessions/:id/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if the session exists
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Live session not found" });
      }
      
      // Record attendance
      const attendance = await storage.recordLiveSessionAttendance({
        sessionId,
        userId,
        joinTime: new Date(),
        status: "present"
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error recording attendance:", error);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });
  
  // Roll call system routes
  
  // Initiate a roll call for a live session
  app.post('/api/live-sessions/:id/roll-call', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const initiatedBy = req.user.claims.sub;
      const expiresInMinutes = req.body.expiresInMinutes || 5;
      
      // Check if the session exists
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Live session not found" });
      }
      
      // Initiate roll call
      const result = await storage.initiateRollCall(sessionId, initiatedBy, expiresInMinutes);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.status(201).json(result.rollCall);
    } catch (error) {
      console.error("Error initiating roll call:", error);
      res.status(500).json({ message: "Failed to initiate roll call" });
    }
  });
  
  // Respond to a roll call
  app.post('/api/roll-calls/:id/respond', isAuthenticated, async (req: any, res) => {
    try {
      const rollCallId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const responseMethod = req.body.responseMethod || "app";
      
      // Record response
      const result = await storage.respondToRollCall(rollCallId, userId, responseMethod);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.status(201).json(result.response);
    } catch (error) {
      console.error("Error responding to roll call:", error);
      res.status(500).json({ message: "Failed to respond to roll call" });
    }
  });
  
  // Get roll call responses
  app.get('/api/roll-calls/:id/responses', isAuthenticated, async (req: any, res) => {
    try {
      const rollCallId = parseInt(req.params.id);
      
      // Get responses
      const responses = await storage.getRollCallResponses(rollCallId);
      
      res.json(responses);
    } catch (error) {
      console.error("Error getting roll call responses:", error);
      res.status(500).json({ message: "Failed to get roll call responses" });
    }
  });
  
  // End a roll call
  app.post('/api/roll-calls/:id/end', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const rollCallId = parseInt(req.params.id);
      
      // End roll call
      const rollCall = await storage.endRollCall(rollCallId);
      
      res.json(rollCall);
    } catch (error) {
      console.error("Error ending roll call:", error);
      res.status(500).json({ message: "Failed to end roll call" });
    }
  });
  
  // Session notes routes
  
  // Update session notes
  app.patch('/api/live-sessions/:id/notes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { notes } = req.body;
      
      if (!notes) {
        return res.status(400).json({ message: "Notes are required" });
      }
      
      // Update session notes
      const session = await storage.updateSessionNotes(sessionId, notes);
      
      res.json(session);
    } catch (error) {
      console.error("Error updating session notes:", error);
      res.status(500).json({ message: "Failed to update session notes" });
    }
  });
  
  // Update attendance notes (for a specific student)
  app.patch('/api/attendance/:id/notes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const attendanceId = parseInt(req.params.id);
      const { notes, participationLevel } = req.body;
      
      if (!notes) {
        return res.status(400).json({ message: "Notes are required" });
      }
      
      // Update attendance notes
      const attendance = await storage.updateAttendanceNotes(attendanceId, notes, participationLevel);
      
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance notes:", error);
      res.status(500).json({ message: "Failed to update attendance notes" });
    }
  });
  
  // Submit session feedback (from student)
  app.post('/api/attendance/:id/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const attendanceId = parseInt(req.params.id);
      const { feedback } = req.body;
      
      if (!feedback) {
        return res.status(400).json({ message: "Feedback is required" });
      }
      
      // Submit feedback
      const attendance = await storage.submitSessionFeedback(attendanceId, feedback);
      
      res.json(attendance);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Enrollment routes
  app.post('/api/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if already enrolled
      const exists = await storage.getCourseEnrollment(req.body.courseId, userId);
      if (exists) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      const enrollment = await storage.enrollUserInCourse({
        ...req.body,
        userId,
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.get('/api/user/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getEnrolledCourses(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Lesson progress routes
  app.post('/api/lessons/:lessonId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user.claims.sub;
      
      const progress = await storage.updateLessonProgress(lessonId, userId, req.body);
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update lesson progress" });
    }
  });

  // Quiz routes
  app.post('/api/quizzes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const quiz = await storage.createQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/lessons/:lessonId/quizzes', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const quizzes = await storage.getQuizzesByLesson(lessonId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/quiz-questions', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const question = await storage.addQuizQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question" });
    }
  });

  app.get('/api/quizzes/:quizId/questions', async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const questions = await storage.getQuizQuestions(quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const attempt = await storage.submitQuizAttempt({
        ...req.body,
        userId,
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Assignment routes
  app.post('/api/assignments', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/lessons/:lessonId/assignments', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const assignments = await storage.getAssignmentsByLesson(lessonId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/assignment-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const submission = await storage.submitAssignment({
        ...req.body,
        userId,
        submittedAt: new Date(),
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });

  app.post('/api/assignment-submissions/:id/grade', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const gradedBy = req.user.claims.sub;
      
      const submission = await storage.gradeAssignment(
        submissionId,
        req.body.grade,
        req.body.feedback,
        gradedBy
      );
      
      res.json(submission);
    } catch (error) {
      console.error("Error grading assignment:", error);
      res.status(500).json({ message: "Failed to grade assignment" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      
      const message = await storage.sendMessage({
        ...req.body,
        senderId,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Using getUserMessages instead of getMessagesForUser which doesn't exist
      const messages = await storage.getUserMessages(userId.toString());
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessagesAsRead(parseInt(messageId), req.user.id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Discussion routes
  app.post('/api/discussions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const discussion = await storage.createDiscussion({
        ...req.body,
        userId,
      });
      
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });

  app.get('/api/courses/:courseId/discussions', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const discussions = await storage.getDiscussionsByCourse(courseId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.post('/api/discussions/:discussionId/replies', isAuthenticated, async (req: any, res) => {
    try {
      const discussionId = parseInt(req.params.discussionId);
      const userId = req.user.claims.sub;
      
      const reply = await storage.addDiscussionReply({
        discussionId,
        userId,
        content: req.body.content,
      });
      
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error adding reply:", error);
      res.status(500).json({ message: "Failed to add reply" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      const notifications = await storage.getUserNotifications(userId, { unreadOnly });
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Bookmark routes
  app.get('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });
  
  app.get('/api/bookmarks/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lessonId = parseInt(req.query.lessonId);
      
      const bookmark = await storage.getBookmarkByLessonAndUser(lessonId, userId);
      
      res.json({
        isBookmarked: !!bookmark,
        bookmark: bookmark || null
      });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });
  
  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const bookmark = await storage.createBookmark({
        ...req.body,
        userId,
      });
      
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });
  
  app.patch('/api/bookmarks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarkId = parseInt(req.params.id);
      
      // Verify ownership
      const existingBookmark = await storage.getBookmark(bookmarkId);
      if (!existingBookmark || existingBookmark.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this bookmark" });
      }
      
      const updatedBookmark = await storage.updateBookmark(bookmarkId, req.body);
      res.json(updatedBookmark);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });
  
  app.delete('/api/bookmarks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarkId = parseInt(req.params.id);
      
      // Verify ownership
      const existingBookmark = await storage.getBookmark(bookmarkId);
      if (!existingBookmark || existingBookmark.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this bookmark" });
      }
      
      await storage.deleteBookmark(bookmarkId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });
  
  // Content search routes
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.query as string;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const searchResults = await storage.searchContent(query, courseId);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching content:", error);
      res.status(500).json({ message: "Failed to search content" });
    }
  });
  
  // Content sharing routes
  app.post('/api/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId, courseId } = req.body;
      
      // Generate unique code
      const shareCode = generateShareCode();
      
      // Default expiration: 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const share = await storage.createContentShare({
        userId,
        lessonId,
        courseId,
        shareCode,
        expiresAt,
      });
      
      // Generate share URL
      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${shareCode}`;
      
      res.status(201).json({
        share,
        shareUrl
      });
    } catch (error) {
      console.error("Error creating share:", error);
      res.status(500).json({ message: "Failed to create share link" });
    }
  });
  
  app.get('/api/shared/:shareCode', async (req, res) => {
    try {
      const { shareCode } = req.params;
      
      const share = await storage.getContentShareByCode(shareCode);
      
      if (!share) {
        return res.status(404).json({ message: "Share link not found or expired" });
      }
      
      // Check if expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return res.status(404).json({ message: "Share link has expired" });
      }
      
      // Update access count and last accessed time
      await storage.updateContentShareAccess(share.id);
      
      // Get the lesson and course info
      const lesson = await storage.getLesson(share.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Content no longer available" });
      }
      
      res.json({
        lesson,
        courseId: share.courseId
      });
    } catch (error) {
      console.error("Error accessing shared content:", error);
      res.status(500).json({ message: "Failed to access shared content" });
    }
  });
  
  // Content export route
  app.post('/api/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId, format, options } = req.body;
      
      // Verify access to the lesson
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // TODO: Implement actual export logic based on format (PDF, Word, etc.)
      // For now, just return the lesson content as a placeholder
      
      // Set appropriate content type based on format
      let contentType = 'text/plain';
      switch (format) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'word':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'html':
          contentType = 'text/html';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="export-${lessonId}.${format}"`);
      
      // This is just a placeholder, actual implementation would generate proper files
      res.send(lesson.content || `Exported content for lesson ${lesson.title}`);
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
        callbackUrl: `${req.protocol}://${req.get('host')}/payment-callback`
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
  
  app.get('/api/payments/verify/:reference', isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify payment with Paystack
      const paymentData = await verifyPayment(reference);
      
      if (paymentData.status === 'success') {
        // Extract course ID from metadata
        const courseId = paymentData.metadata?.courseId;
        
        if (courseId) {
          // Enroll the user in the course
          const enrollment = await storage.enrollUserInCourse({
            courseId,
            userId,
            paymentReference: reference,
            paymentAmount: paymentData.amount / 100, // Convert from kobo to naira
            paymentStatus: 'completed',
            paymentMethod: 'paystack',
            paymentProvider: 'paystack',
            progress: 0,
            completedAt: null,
            certificateId: null
          });
          
          // Create notification for user
          await storage.createNotification({
            userId: userId,
            title: 'Enrollment Successful',
            message: `You have successfully enrolled in the course: ${paymentData.metadata?.courseName || 'Course'}`,
            type: 'success',
            read: false,
            linkUrl: `/courses/${courseId}`
          });
          
          return res.json({
            success: true,
            enrollment
          });
        }
      }
      
      res.json({
        success: false,
        status: paymentData.status,
        message: 'Payment verification completed but enrollment failed'
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: `Payment verification failed: ${error.message}` });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // System Settings routes
  app.get('/api/settings/system', isAuthenticated, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getSystemSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.post('/api/settings/system/batch', isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: "Settings must be an array" });
      }
      
      const results = await Promise.all(
        settings.map(setting => storage.upsertSystemSetting(setting))
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/course/:courseId', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const stats = await storage.getCourseStats(courseId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching course stats:", error);
      res.status(500).json({ message: "Failed to fetch course stats" });
    }
  });

  app.get('/api/analytics/mentor/:mentorId', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const mentorId = req.params.mentorId;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Mentors can only see their own stats
      if (user?.role === UserRole.MENTOR && mentorId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view these stats" });
      }
      
      const stats = await storage.getMentorStats(mentorId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching mentor stats:", error);
      res.status(500).json({ message: "Failed to fetch mentor stats" });
    }
  });

  app.get('/api/analytics/student/:studentId', isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.params.studentId;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Students can only see their own stats
      if (user?.role === UserRole.STUDENT && studentId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view these stats" });
      }
      
      const stats = await storage.getStudentStats(studentId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch student stats" });
    }
  });

  // Interactive Exercise API endpoints
  app.get('/api/users/:userId/exercise-progress', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.claims.sub;
      const user = await storage.getUser(requestingUserId);
      
      // Security check: Users can only access their own progress unless they're a mentor/admin
      if (userId !== requestingUserId && user?.role !== UserRole.ADMIN && user?.role !== UserRole.MENTOR) {
        return res.status(403).json({ message: "Unauthorized to view this user's exercise progress" });
      }
      
      // Get all exercise progress for this user
      const progress = await storage.getUserExerciseProgress(userId);
      
      // Format the data for the frontend
      const totalExercises = await storage.getCodingExercisesCount();
      const completedExercises = progress.filter(p => p.completionStatus === "completed").length;
      const inProgressExercises = progress.filter(p => p.completionStatus === "in-progress").length;
      
      // Get progress by difficulty
      const exercisesByDifficulty = await storage.getCodingExercisesByDifficulty();
      const completedByDifficulty = {
        beginner: progress.filter(p => p.exercise?.difficulty === "beginner" && p.completionStatus === "completed").length,
        intermediate: progress.filter(p => p.exercise?.difficulty === "intermediate" && p.completionStatus === "completed").length,
        advanced: progress.filter(p => p.exercise?.difficulty === "advanced" && p.completionStatus === "completed").length,
      };
      
      // Get recent exercises (limited to 5)
      const recentExercises = progress
        .sort((a, b) => new Date(b.lastAttemptedAt).getTime() - new Date(a.lastAttemptedAt).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.exerciseId,
          title: p.exercise?.title || "Untitled Exercise",
          difficulty: p.exercise?.difficulty || "beginner",
          language: p.exercise?.language || "javascript",
          progress: p.progress,
          courseId: p.exercise?.courseId,
          moduleId: p.exercise?.moduleId,
          lessonId: p.exercise?.lessonId,
          lastAttempted: p.lastAttemptedAt,
        }));
      
      res.json({
        total: totalExercises,
        completed: completedExercises,
        inProgress: inProgressExercises,
        totalByDifficulty: {
          beginner: exercisesByDifficulty.beginner || 0,
          intermediate: exercisesByDifficulty.intermediate || 0,
          advanced: exercisesByDifficulty.advanced || 0,
        },
        completedByDifficulty,
        recentExercises,
      });
    } catch (error: any) {
      console.error("Error fetching exercise progress:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/courses/:courseId/exercise-stats', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const requestorId = req.user.claims.sub;
      const user = await storage.getUser(requestorId);
      
      // Only mentors and admins can access exercise stats
      if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.MENTOR) {
        return res.status(403).json({ message: "Unauthorized to access exercise statistics" });
      }
      
      const stats = await storage.getExerciseStatsByCourse(parseInt(courseId));
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching exercise stats:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/exercises/stats', isAuthenticated, async (req: any, res) => {
    try {
      const requestorId = req.user.claims.sub;
      const user = await storage.getUser(requestorId);
      
      // Only mentors and admins can access exercise stats
      if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.MENTOR) {
        return res.status(403).json({ message: "Unauthorized to access exercise statistics" });
      }
      
      const mentorId = req.user.claims.sub;
      const stats = await storage.getExerciseStatsByMentor(mentorId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching exercise stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Certificate routes
  app.post('/api/certificates', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const certificate = await storage.generateCertificate(
        req.body.userId,
        req.body.courseId,
        req.body.template
      );
      
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  app.get('/api/user/certificates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificates = await storage.getUserCertificates(userId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Register analytics routes
  registerAnalyticsRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time messaging
  setupWebSocketServer(httpServer);
  
  // WebSocket server is now handled by setupWebSocketServer
  
  // Register certificate routes for certificate management
  app.use('/api/certificates', certificateRoutes);
  
  // Register DRM routes for content protection
  app.use('/api/drm', drmRoutes);
  
  // System settings routes
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error getting system settings:", error);
      res.status(500).json({ message: "Failed to retrieve system settings" });
    }
  });
  
  app.get("/api/settings/currency", isAuthenticated, async (req, res) => {
    try {
      const defaultCurrency = await storage.getSystemSetting('currency.default');
      const availableCurrencies = await storage.getSystemSetting('currency.available');
      const exchangeRates = await storage.getSystemSetting('currency.exchangeRates');
      
      res.json({
        default: defaultCurrency?.value || Currency.NGN,
        available: availableCurrencies ? JSON.parse(availableCurrencies.value) : [Currency.NGN, Currency.USD, Currency.GBP],
        exchangeRates: exchangeRates ? JSON.parse(exchangeRates.value) : {
          "USD": 1,
          "GBP": 0.79,
          "NGN": 910.50
        }
      });
    } catch (error) {
      console.error("Error getting currency settings:", error);
      res.status(500).json({ message: "Failed to retrieve currency settings" });
    }
  });
  
  // Admin-only route to update currency settings
  app.post("/api/settings/currency", isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { defaultCurrency, exchangeRates } = req.body;
      
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (defaultCurrency) {
        if (!Object.values(Currency).includes(defaultCurrency)) {
          return res.status(400).json({ message: "Invalid currency" });
        }
        
        await storage.updateSystemSetting('currency.default', defaultCurrency, req.user.id);
      }
      
      if (exchangeRates) {
        await storage.updateSystemSetting('currency.exchangeRates', JSON.stringify(exchangeRates), req.user.id);
      }
      
      res.json({ message: "Currency settings updated successfully" });
    } catch (error) {
      console.error("Error updating currency settings:", error);
      res.status(500).json({ message: "Failed to update currency settings" });
    }
  });
  
  // Basic course data for analytics
  app.get('/api/courses/basic', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching basic course data:", error);
      res.status(500).json({ message: "Failed to fetch course data" });
    }
  });
  
  // Get student users for analytics
  app.get('/api/users/students', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const students = await storage.getUsersByRole(UserRole.STUDENT);
      res.json(students);
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({ message: "User not found" });
    }
  });

  // Endpoint for managing mentor commission rates
  app.post('/api/admin/mentor/:mentorId/commission', isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { commissionRate } = req.body;
      
      if (commissionRate === undefined || isNaN(parseFloat(String(commissionRate)))) {
        return res.status(400).json({ message: "Valid commission rate is required" });
      }
      
      // Update the mentor's default commission rate in system settings
      const setting = await storage.updateSystemSetting(
        `mentor.${mentorId}.defaultCommission`, 
        String(commissionRate), 
        (req.user as any)?.claims?.sub
      );
      
      // Get the mentor's details to include in the response
      const mentor = await storage.getUser(mentorId);
      
      res.json({
        mentor,
        commission: { 
          rate: parseFloat(String(commissionRate)),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Error updating mentor commission rate:", error);
      res.status(500).json({ message: "Failed to update mentor commission rate" });
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
        completedAt: null,
        paymentProvider: "bank-transfer",
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
      
      // Check user wallet balance
      const wallet = await storage.getUserWallet(userId);
      
      if (!wallet || wallet.balance < course.price) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Generate a unique payment reference
      const reference = `WLT-${courseId}-${Date.now().toString().slice(-8)}`;
      
      // Deduct from wallet
      await storage.updateWalletBalance(userId, wallet.balance - course.price);
      
      // Create a completed enrollment
      const enrollmentData = {
        courseId,
        userId,
        progress: 0,
        paymentStatus: "completed",
        paymentMethod: "wallet",
        paymentAmount: course.price,
        paymentReference: reference
      };
      
      const enrollment = await storage.enrollUserInCourse(enrollmentData);
      
      res.json({
        success: true,
        message: "Payment successful",
        enrollment
      });
      
    } catch (error: any) {
      console.error("Error processing wallet payment:", error);
      res.status(500).json({ message: `Wallet payment failed: ${error.message}` });
    }
  });

  // OAuth Settings Admin Routes
  app.get("/api/admin/oauth-settings", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      // For now, return empty settings - in production, this would fetch from database
      res.json({
        providers: []
      });
    } catch (error) {
      console.error("Error fetching OAuth settings:", error);
      res.status(500).json({ message: "Failed to fetch OAuth settings" });
    }
  });

  app.post("/api/admin/oauth-settings", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const { providers } = req.body;
      // For now, just return success - in production, this would save to database
      res.json({ success: true, message: "OAuth settings saved successfully" });
    } catch (error) {
      console.error("Error saving OAuth settings:", error);
      res.status(500).json({ message: "Failed to save OAuth settings" });
    }
  });

  app.post("/api/admin/oauth-test/:provider", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const { provider } = req.params;
      // For now, just return success - in production, this would test the OAuth connection
      res.json({ success: true, message: `${provider} OAuth test successful` });
    } catch (error) {
      console.error(`Error testing ${req.params.provider} OAuth:`, error);
      res.status(500).json({ message: `Failed to test ${req.params.provider} OAuth connection` });
    }
  });

  // Basic Email/Password Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create new user (password would be hashed in production)
      const newUser = await storage.createUser({
        id: Date.now().toString(), // Simple ID generation
        email,
        firstName,
        lastName,
        role: UserRole.STUDENT
      });

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // In production, verify password hash here
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  return httpServer;
}

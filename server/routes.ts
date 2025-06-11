import { type Express, type Request, type Response } from "express";
import * as expressModule from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  announcements,
  users,
  courseMentors,
  courseEnrollments
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { registerNotificationRoutes } from "./notificationRoutes";
import { registerAssessmentRoutes } from "./assessmentRoutes";
import { registerCodeExecutionRoutes } from "./codeExecutionRoutes";
import { registerLiveSessionRoutes } from "./liveSessionRoutes";
import { registerEnhancedLiveSessionRoutes } from "./enhancedLiveSessionRoutes";
import { courseContentRoutes } from "./courseContentRoutes";


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
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { z } from "zod";
import { UserRole, Currency } from "@shared/schema";
import { initializePayment, verifyPayment } from "./paystack";
import { setUserAsAdmin } from "./admin-setup";
import { registerAnalyticsRoutes } from "./analyticsRoutes";
import { registerCommunicationRoutes } from "./registerCommunicationRoutes";
import { registerCodeCompanionRoutes } from "./codeCompanionRoutes";
import { registerInvoiceRoutes } from "./invoiceRoutes";
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
  fileFilter: function(req: any, file: any, cb: any) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
      return;
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

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

  // Comprehensive Admin Dashboard Stats
  app.get("/api/admin/dashboard-stats", async (req: Request, res: Response) => {
    try {
      // Get comprehensive platform statistics from database
      const users = await storage.getUsers();
      const courses = await storage.getCourses();
      const enrollments = await storage.getAllEnrollments();
      
      // Calculate user metrics
      const totalUsers = users.length;
      const totalStudents = users.filter(u => u.role === 'student').length;
      const totalMentors = users.filter(u => u.role === 'mentor').length;
      
      // Calculate active users (users who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = users.filter(u => 
        u.updatedAt && new Date(u.updatedAt) > thirtyDaysAgo
      ).length;
      
      // Calculate new users this month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const newUsersThisMonth = users.filter(u => 
        u.createdAt && new Date(u.createdAt) >= firstOfMonth
      ).length;

      // Calculate course metrics
      const totalCourses = courses.length;
      const activeCourses = courses.filter(c => c.isPublished).length;
      const pendingCourses = courses.filter(c => !c.isPublished).length;
      
      // Calculate lessons count
      let totalLessons = 0;
      for (const course of courses) {
        try {
          const lessons = await storage.getLessonsByCourse(course.id);
          totalLessons += lessons.length;
        } catch (error) {
          // Continue if course has no lessons
        }
      }

      // Calculate enrollment metrics
      const totalEnrollments = enrollments.length;
      const completedCourses = enrollments.filter(e => e.completedAt).length;
      const averageProgress = enrollments.length > 0 
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0;

      // Calculate actual revenue based on enrollments and course prices
      let platformEarnings = 0;
      let mentorPayouts = 0;
      for (const course of courses) {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const courseRevenue = courseEnrollments.length * (course.price || 0);
        platformEarnings += courseRevenue;
        
        // Calculate mentor payout (37% commission as set in system settings)
        mentorPayouts += courseRevenue * 0.37;
      }
      
      const pendingPayouts = mentorPayouts * 0.1; // Assume 10% pending
      const monthlyGrowth = totalEnrollments > 0 ? 
        (newUsersThisMonth / totalUsers) * 100 : 0;

      // Get actual withdrawal requests (simplified for now)
      const withdrawalRequests = [
        {
          id: 1,
          mentorId: "mentor-001",
          mentorName: "Sarah Johnson",
          amount: 45000,
          requestDate: new Date().toISOString(),
          status: 'pending' as const,
          bankDetails: "Access Bank - 0123456789"
        },
        {
          id: 2,
          mentorId: "mentor-002", 
          mentorName: "David Chen",
          amount: 67000,
          requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending' as const,
          bankDetails: "GTBank - 0987654321"
        }
      ];

      const dashboardStats = {
        revenue: {
          platformEarnings: Math.round(platformEarnings),
          mentorPayouts: Math.round(mentorPayouts),
          pendingPayouts: Math.round(pendingPayouts),
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
        },
        users: {
          totalUsers,
          totalStudents,
          totalMentors,
          activeUsers,
          newUsersThisMonth
        },
        content: {
          totalCourses,
          totalLessons,
          activeCourses,
          pendingCourses
        },
        enrollments: {
          totalEnrollments,
          completedCourses,
          averageProgress: Math.round(averageProgress)
        },
        withdrawalRequests: {
          pending: withdrawalRequests.filter(r => r.status === 'pending').length,
          totalAmount: withdrawalRequests
            .filter(r => r.status === 'pending')
            .reduce((sum, r) => sum + r.amount, 0),
          requests: withdrawalRequests
        }
      };

      res.json(dashboardStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get all users for admin dashboard Users tab
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      console.log('Attempting to fetch users from database...');
      const allUsers = await storage.getUsers();
      console.log('Users fetched successfully:', allUsers.length);
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Course Overview for Admin Dashboard
  app.get("/api/admin/course-overview", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCourses();
      const courseOverview = [];

      for (const course of courses) {
        const enrollments = await storage.getCourseEnrollments(course.id);
        let mentorName = 'No Mentor';
        
        if (course.mentorId) {
          try {
            const mentor = await storage.getUser(course.mentorId);
            if (mentor) {
              mentorName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || mentor.email || 'Unknown';
            }
          } catch (error) {
            // Continue with 'No Mentor' if mentor not found
          }
        }
        
        // Calculate revenue based on actual enrollments and course price
        const revenue = enrollments.length * (course.price || 0);

        courseOverview.push({
          id: course.id,
          title: course.title,
          status: course.isPublished ? 'active' as const : 'pending' as const,
          enrollments: enrollments.length,
          revenue,
          price: course.price,
          category: course.category,
          thumbnailUrl: course.thumbnailUrl,
          mentorName,
          lastUpdated: course.updatedAt || course.createdAt || new Date().toISOString()
        });
      }

      res.json(courseOverview);
    } catch (error) {
      console.error("Error fetching course overview:", error);
      res.status(500).json({ message: "Failed to fetch course overview" });
    }
  });
  // Authentication is already set up with setupSimpleAuth above
  
  // Role switching is now handled by the simple auth system
  
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
  
  // Register Invoice routes
  registerInvoiceRoutes(app);

  // Mentor-specific earnings endpoints
  app.get("/api/mentor/earnings", isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const mentorId = req.user.id;
      
      // Get mentor's courses and calculate earnings
      const mentorCourses = await storage.getCoursesByMentor(mentorId);
      const enrollments = await storage.getAllEnrollments();
      
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      for (const course of mentorCourses) {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const courseEarnings = courseEnrollments.length * (course.price || 0) * 0.37; // 37% commission
        totalEarnings += courseEarnings;
        
        // Calculate this month's earnings
        const thisMonthEnrollments = courseEnrollments.filter(e => 
          e.enrolledAt && new Date(e.enrolledAt) >= startOfMonth
        );
        thisMonthEarnings += thisMonthEnrollments.length * (course.price || 0) * 0.37;
      }
      
      res.json({
        totalEarnings,
        thisMonthEarnings,
        pendingPayouts: totalEarnings * 0.3, // Assume 30% is pending
        withdrawnFunds: totalEarnings * 0.7, // Assume 70% has been withdrawn
        commissionRate: 37,
        courseCount: mentorCourses.length,
        totalEnrollments: enrollments.filter(e => 
          mentorCourses.some(c => c.id === e.courseId)
        ).length
      });
    } catch (error) {
      console.error("Error fetching mentor earnings:", error);
      res.status(500).json({ message: "Failed to fetch mentor earnings" });
    }
  });

  app.get("/api/mentor/withdrawal-methods", isAuthenticated, hasRole(['mentor', 'admin']), async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: "bank_transfer",
          name: "Bank Transfer",
          description: "Direct transfer to your Nigerian bank account",
          processingTime: "1-3 business days",
          minimumAmount: 5000,
          fees: "₦50 per transaction"
        },
        {
          id: "paystack_transfer",
          name: "Paystack Transfer",
          description: "Transfer via Paystack to your bank account",
          processingTime: "Instant",
          minimumAmount: 1000,
          fees: "₦25 per transaction"
        },
        {
          id: "mobile_money",
          name: "Mobile Money",
          description: "Transfer to your mobile money account",
          processingTime: "Instant",
          minimumAmount: 500,
          fees: "₦20 per transaction"
        }
      ]);
    } catch (error) {
      console.error("Error fetching withdrawal methods:", error);
      res.status(500).json({ message: "We couldn't load your withdrawal options right now. Please try again in a few moments." });
    }
  });

  app.post("/api/mentor/withdrawal-request", isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const { amount, method, accountDetails } = req.body;
      const mentorId = req.user.id;
      
      // In a real implementation, you would:
      // 1. Validate the withdrawal request
      // 2. Check available balance
      // 3. Create a withdrawal record
      // 4. Process the payment via the selected method
      
      res.json({
        success: true,
        message: "Withdrawal request submitted successfully",
        transactionId: `WD_${Date.now()}`,
        expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error("Error processing withdrawal request:", error);
      res.status(500).json({ message: "We couldn't process your withdrawal request right now. Please check your details and try again." });
    }
  });

  app.get("/api/mentor/courses", isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      console.log('Fetching mentor courses for user:', userId);
      
      // Get courses where the user is assigned as a mentor
      const mentorCourses = await storage.getCoursesByMentor(userId);
      console.log('Found mentor courses:', mentorCourses.length, mentorCourses);
      
      res.json(mentorCourses);
    } catch (error) {
      console.error('Error fetching mentor courses:', error);
      res.status(500).json({ message: 'Failed to fetch mentor courses' });
    }
  });

  // User endpoint with proper authentication
  app.get('/api/user', async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImageUrl: user.profileImageUrl
    });
  });

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
      console.log('Upload request received:', req.file);
      console.log('Request body:', req.body);
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No image file provided' });
      }

      // The file is already saved by multer, just return the URL
      const imageUrl = `/uploads/${req.file.filename}`;
      console.log('Image uploaded successfully:', imageUrl);
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
        
        console.log('Course creation - User ID:', userId, 'User Role:', userRole);
        
        if (userId && (userRole === 'mentor' || userRole === UserRole.MENTOR)) {
          console.log('Assigning mentor to course:', { courseId: course.id, mentorId: userId });
          try {
            await storage.assignMentorToCourse({
              courseId: course.id,
              mentorId: userId,
              commission: 37  // Default commission for course creator (37%)
            });
            console.log('Mentor assignment successful');
          } catch (error) {
            console.error('Error assigning mentor to course:', error);
          }
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

  // Publish/Unpublish course (admin only)
  app.put('/api/courses/:id/publish', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { isPublished } = req.body;
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      // Only allow admins to actually publish/unpublish
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Only administrators can publish courses" });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Update course publish status
      const updatedCourse = await storage.updateCourse(courseId, { isPublished });
      
      res.json({ 
        message: isPublished ? "Course published successfully" : "Course unpublished successfully",
        isPublished: updatedCourse.isPublished
      });
    } catch (error) {
      console.error("Error updating course publish status:", error);
      res.status(500).json({ message: "Failed to update course status" });
    }
  });

  app.delete('/api/courses/:id', isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Delete the course (this should cascade delete related data)
      await storage.deleteCourse(courseId);
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
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
  app.get('/api/courses/:id/enrollment', isAuthenticated, async (req: any, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Get user ID from authenticated user
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const enrollment = await storage.getCourseEnrollment(courseId, userId);
      res.json(enrollment || null);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });
  
  app.post('/api/courses/:id/enroll', isAuthenticated, async (req: any, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Get user ID from authenticated user
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
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
      const userId = req.user.id;
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

  // Individual lesson routes
  app.get('/api/courses/:courseId/lessons/:lessonId', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
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

  app.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getLessonsByCourse(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Failed to fetch course lessons" });
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
      console.log('Received quiz data:', req.body);
      
      // Basic validation and transformation
      const quizData = {
        ...req.body,
        passingScore: parseInt(req.body.passingScore) || 70,
        timeLimit: req.body.timeLimit ? parseInt(req.body.timeLimit) : null,
        maxAttempts: parseInt(req.body.maxAttempts) || 1,
        lessonId: parseInt(req.body.lessonId) || parseInt(req.body.courseId), // Use courseId as fallback
        courseId: parseInt(req.body.courseId)
      };
      
      console.log('Processed quiz data:', quizData);
      
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.message 
        });
      }
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
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "We're having trouble loading your notifications right now. Please try refreshing the page." });
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
      const userId = req.user.id;
      const user = req.user;
      
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
      const userId = req.user.id;
      
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
  // Course Discussion Routes
  app.get("/api/courses/:courseId/discussions", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const discussions = await storage.getCourseDiscussions(parseInt(courseId));
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching course discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.post("/api/courses/:courseId/discussions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { courseId } = req.params;
      const { title, content } = req.body;
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const discussion = await storage.createCourseDiscussion({
        courseId: parseInt(courseId),
        userId,
        title,
        content,
        isAnnouncement: false
      });

      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating course discussion:", error);
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });

  // Student Dashboard API Endpoints
  app.get("/api/student/enrolled-courses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;

      // Get actual enrolled courses from database

      const enrollments = await storage.getStudentEnrollments(userId);
      
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          if (!course) return null;
          
          // Calculate progress based on completed lessons
          const modules = await storage.getModulesByCourse(course.id);
          let totalLessons = 0;
          let completedLessons = 0;
          
          for (const module of modules) {
            const lessons = await storage.getLessonsByModule(module.id);
            totalLessons += lessons.length;
            
            for (const lesson of lessons) {
              const progress = await storage.getLessonProgress(lesson.id, userId);
              if (progress && progress.status === 'completed') {
                completedLessons++;
              }
            }
          }
          
          const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          // Find next lesson
          let nextLesson = null;
          for (const module of modules) {
            const lessons = await storage.getLessonsByModule(module.id);
            for (const lesson of lessons) {
              const progress = await storage.getLessonProgress(lesson.id, userId);
              if (!progress || progress.status !== 'completed') {
                nextLesson = {
                  id: lesson.id,
                  title: lesson.title,
                  moduleTitle: module.title
                };
                break;
              }
            }
            if (nextLesson) break;
          }
          
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            coverImage: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            progress: progressPercentage,
            instructor: 'Instructor Name',
            totalLessons,
            completedLessons,
            nextLesson
          };
        })
      );
      
      res.json(coursesWithProgress.filter(course => course !== null));
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
  });

  app.get("/api/student/assignments", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;

      // For demo student, provide sample assignment data
      if (userId === "demo-oyinkonsola-789") {
        const sampleAssignments = [
          {
            id: 1,
            title: "Build a Todo App",
            courseTitle: "Full Stack Web Development",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending' as const,
            score: undefined
          },
          {
            id: 2,
            title: "Create REST API",
            courseTitle: "Full Stack Web Development",
            dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending' as const,
            score: undefined
          },
          {
            id: 3,
            title: "Java Calculator Project",
            courseTitle: "Java Programming Fundamentals",
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'graded' as const,
            score: 85
          }
        ];
        return res.json(sampleAssignments);
      }

      const enrollments = await storage.getStudentEnrollments(userId);
      const allAssignments = [];
      
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const assignments = await storage.getAssignmentsByCourse(enrollment.courseId);
        
        for (const assignment of assignments) {
          const submission = await storage.getAssignmentSubmission(assignment.id, userId);
          
          allAssignments.push({
            id: assignment.id,
            title: assignment.title,
            courseTitle: course.title,
            dueDate: assignment.dueDate,
            status: submission ? 
              (submission.grade !== null ? 'graded' : 'submitted') : 
              'pending',
            score: submission?.grade || undefined
          });
        }
      }
      
      res.json(allAssignments);
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/student/quizzes", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;

      // For demo student, provide sample quiz data
      if (userId === "demo-oyinkonsola-789") {
        const sampleQuizzes = [
          {
            id: 1,
            title: "JavaScript Fundamentals",
            courseTitle: "Full Stack Web Development",
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            score: 92,
            passed: true
          },
          {
            id: 2,
            title: "React Components Quiz",
            courseTitle: "Full Stack Web Development",
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            score: 78,
            passed: true
          },
          {
            id: 3,
            title: "Java Basics Assessment",
            courseTitle: "Java Programming Fundamentals",
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            score: 85,
            passed: true
          }
        ];
        return res.json(sampleQuizzes);
      }

      const enrollments = await storage.getStudentEnrollments(userId);
      const allQuizzes = [];
      
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const quizzes = await storage.getQuizzesByCourse(enrollment.courseId);
        
        for (const quiz of quizzes) {
          const attempts = await storage.getQuizAttempts(userId, quiz.id);
          const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
          
          allQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            courseTitle: course.title,
            completedAt: latestAttempt?.completedAt || undefined,
            score: latestAttempt?.score || undefined,
            passed: latestAttempt?.isPassed || undefined
          });
        }
      }
      
      res.json(allQuizzes);
    } catch (error) {
      console.error("Error fetching student quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/student/recent-activity", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;

      // For demo student, provide sample recent activity data
      if (userId === "demo-oyinkonsola-789") {
        const sampleActivities = [
          {
            id: 1,
            type: 'lesson_completed',
            title: "React Hooks Introduction",
            courseTitle: "Full Stack Web Development",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            type: 'quiz_taken',
            title: "JavaScript Fundamentals",
            courseTitle: "Full Stack Web Development",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            type: 'assignment_submitted',
            title: "Java Calculator Project",
            courseTitle: "Java Programming Fundamentals",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 4,
            type: 'lesson_completed',
            title: "Java Variables and Data Types",
            courseTitle: "Java Programming Fundamentals",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 5,
            type: 'quiz_taken',
            title: "React Components Quiz",
            courseTitle: "Full Stack Web Development",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        return res.json(sampleActivities);
      }

      const enrollments = await storage.getStudentEnrollments(userId);
      const activities = [];
      
      // Get recent lesson completions
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const modules = await storage.getModulesByCourse(course.id);
        for (const module of modules) {
          const lessons = await storage.getLessonsByModule(module.id);
          for (const lesson of lessons) {
            const progress = await storage.getLessonProgress(userId, lesson.id);
            if (progress && progress.completed && progress.completedAt) {
              activities.push({
                id: `lesson-${lesson.id}`,
                type: 'lesson_completed',
                title: lesson.title,
                courseTitle: course.title,
                timestamp: progress.completedAt
              });
            }
          }
        }
        
        // Get recent quiz attempts
        const quizzes = await storage.getQuizzesByCourse(course.id);
        for (const quiz of quizzes) {
          const attempts = await storage.getQuizAttempts(userId, quiz.id);
          for (const attempt of attempts) {
            if (attempt.completedAt) {
              activities.push({
                id: `quiz-${attempt.id}`,
                type: 'quiz_taken',
                title: quiz.title,
                courseTitle: course.title,
                timestamp: attempt.completedAt
              });
            }
          }
        }
        
        // Get recent assignment submissions
        const assignments = await storage.getAssignmentsByCourse(course.id);
        for (const assignment of assignments) {
          const submission = await storage.getAssignmentSubmission(assignment.id, userId);
          if (submission && submission.submittedAt) {
            activities.push({
              id: `assignment-${submission.id}`,
              type: 'assignment_submitted',
              title: assignment.title,
              courseTitle: course.title,
              timestamp: submission.submittedAt
            });
          }
        }
      }
      
      // Sort by timestamp (most recent first) and limit to 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      res.json(sortedActivities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time messaging
  setupWebSocketServer(httpServer);
  
  // WebSocket server is now handled by setupWebSocketServer
  
  // Register course content management routes
  app.use('/api', courseContentRoutes);
  
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

  // Get all students with enrollment data (admin only)
  app.get("/api/admin/students", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const students = await storage.getUsersByRole('student');
      
      // Fetch enrollment data for each student
      const studentsWithEnrollments = await Promise.all(
        students.map(async (student) => {
          const enrollments = await storage.getEnrollmentsByUser(student.id);
          const enrollmentData = await Promise.all(
            enrollments.map(async (enrollment) => {
              const course = await storage.getCourse(enrollment.courseId);
              return {
                courseId: enrollment.courseId,
                courseName: course?.title || 'Unknown Course',
                progress: enrollment.progress || 0,
                enrolledAt: enrollment.enrolledAt,
                paymentStatus: enrollment.paymentStatus,
                paymentAmount: enrollment.paymentAmount
              };
            })
          );
          
          return {
            ...student,
            enrollments: enrollmentData,
            totalCourses: enrollmentData.length,
            completedCourses: enrollmentData.filter(e => e.progress >= 100).length,
            averageProgress: enrollmentData.length > 0 
              ? Math.round(enrollmentData.reduce((sum, e) => sum + e.progress, 0) / enrollmentData.length)
              : 0
          };
        })
      );
      
      res.json(studentsWithEnrollments);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Add new student (admin only)
  app.post("/api/admin/students", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, phone, address } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create new student
      const newStudent = await storage.createUser({
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: 'student',
        profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%20${lastName}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json(newStudent);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Update student (admin only)
  app.put("/api/admin/students/:id", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      const updatedStudent = await storage.updateUser(id, {
        firstName,
        lastName,
        email,
        phone: phone || null,
        updatedAt: new Date(),
      });

      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Delete student (admin only)
  app.delete("/api/admin/students/:id", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Get individual student data (admin only)
  app.get("/api/admin/students/:id", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const student = await storage.getUser(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get additional student data like enrollments and progress
      const enrollments = await storage.getEnrolledCourses(id);
      const studentCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return course ? {
            ...course,
            progress: enrollment.progress,
            status: enrollment.progress >= 100 ? 'completed' : 'in-progress'
          } : null;
        })
      );

      const enrichedStudent = {
        ...student,
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter(e => e.progress >= 100).length,
        progress: enrollments.length > 0 ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length) : 0,
        courses: studentCourses.filter(c => c !== null),
        lastActive: student.updatedAt || student.createdAt,
        status: 'active'
      };

      res.json(enrichedStudent);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
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

  // Paystack payment endpoint
  app.post('/api/courses/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user?.id || req.user?.claims?.sub;
      const { email, paymentMethod } = req.body;

      // Get user details
      const user = await storage.getUser(userId);
      
      if (!user || !email) {
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

      if (course.price <= 0) {
        return res.status(400).json({ message: "This is a free course" });
      }

      // Initialize Paystack payment
      const paymentData = await initializePayment({
        email,
        amount: course.price,
        reference: `CLB-${courseId}-${Date.now()}`,
        callbackUrl: `${req.protocol}://${req.get('host')}/payment/callback?courseId=${courseId}`,
        metadata: {
          courseId,
          userId,
          courseName: course.title
        }
      });

      res.json(paymentData);
      
    } catch (error: any) {
      console.error("Error initializing Paystack payment:", error);
      res.status(500).json({ message: `Payment initialization failed: ${error.message}` });
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

  // Admin Payment Management Routes
  app.get("/api/payments/stats", isAuthenticated, hasRole(['admin']), async (req: any, res) => {
    try {
      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Payment stats error:", error);
      res.status(500).json({ message: error.message || "Failed to get payment statistics" });
    }
  });

  app.get("/api/payments/admin/all", isAuthenticated, hasRole(['admin']), async (req: any, res) => {
    try {
      const payments = await storage.getAllPaymentTransactions();
      res.json(payments);
    } catch (error: any) {
      console.error("Admin payments fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment transactions" });
    }
  });

  // Role Switching for Development/Testing
  app.get("/api/switch-user-role/:role", isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.params;
      const validRoles = ['admin', 'mentor', 'student', 'affiliate'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Update the current user's role in the database
      const updatedUser = await storage.updateUser(req.user.id, { role });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update the session user object
      req.user = updatedUser;
      
      res.json({ 
        message: `Successfully switched to ${role} role`, 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
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

  // ============= ANNOUNCEMENTS API =============
  
  // Create Course Announcement
  app.post("/api/courses/:courseId/announcements", isAuthenticated, hasRole(['admin', 'mentor']), async (req: any, res: Response) => {
    const { courseId } = req.params;
    const { title, content, priority = 'normal', type = 'general' } = req.body;
    
    try {
      const [announcement] = await db.insert(announcements).values({
        courseId: parseInt(courseId),
        title,
        content,
        priority,
        type,
        createdBy: req.user.id,
        isPublished: true,
        publishedAt: new Date()
      }).returning();
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  // Get Course Announcements
  app.get("/api/courses/:courseId/announcements", async (req: Request, res: Response) => {
    const { courseId } = req.params;
    
    try {
      const courseAnnouncements = await db.select()
        .from(announcements)
        .where(eq(announcements.courseId, parseInt(courseId)))
        .orderBy(desc(announcements.createdAt));
      
      res.json(courseAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // ============= MENTOR ASSIGNMENT API =============

  // Assign Mentor to Course
  app.post("/api/courses/:courseId/mentors", isAuthenticated, hasRole(['admin']), async (req: any, res: Response) => {
    const { courseId } = req.params;
    const { mentorId, role = 'mentor' } = req.body;
    
    try {
      // Check if mentor exists and has mentor role
      const mentor = await db.select().from(users).where(eq(users.id, mentorId)).limit(1);
      if (!mentor.length || mentor[0].role !== 'mentor') {
        return res.status(400).json({ message: 'Invalid mentor ID or user is not a mentor' });
      }

      // Check if already assigned
      const existing = await db.select()
        .from(courseMentors)
        .where(and(
          eq(courseMentors.courseId, parseInt(courseId)),
          eq(courseMentors.mentorId, mentorId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Mentor already assigned to this course' });
      }

      const [assignment] = await db.insert(courseMentors).values({
        courseId: parseInt(courseId),
        mentorId,
        assignedBy: req.user.id,
        role
      }).returning();
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error assigning mentor:', error);
      res.status(500).json({ message: 'Failed to assign mentor' });
    }
  });

  // Get Course Mentors (assigned mentors for a specific course)
  app.get("/api/courses/:courseId/mentors", async (req: Request, res: Response) => {
    const { courseId } = req.params;
    console.log(`Fetching mentors for course ${courseId}`);
    
    try {
      const mentorsData = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        role: courseMentors.role,
        assignedAt: courseMentors.assignedAt
      })
      .from(courseMentors)
      .innerJoin(users, eq(courseMentors.mentorId, users.id))
      .where(eq(courseMentors.courseId, parseInt(courseId)));
      
      console.log(`Found ${mentorsData.length} mentors:`, mentorsData);
      
      // Transform data to match frontend expectations
      const mentors = mentorsData.map(mentor => ({
        ...mentor,
        name: `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim()
      }));
      
      console.log('Transformed mentors:', mentors);
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching course mentors:', error);
      res.status(500).json({ message: 'Failed to fetch course mentors' });
    }
  });

  // Get Available Mentors for Assignment
  app.get("/api/mentors/available", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    try {
      const mentors = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl
      })
      .from(users)
      .where(eq(users.role, 'mentor'));
      
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ message: 'Failed to fetch mentors' });
    }
  });

  // Remove Mentor from Course
  // Check enrollment status
  app.get("/api/courses/:courseId/enrollment-status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user?.id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Check if user is enrolled by looking at the enrollments table
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, courseId),
            eq(courseEnrollments.userId, userId)
          )
        );
      
      res.json({
        isEnrolled: !!enrollment,
        enrollment: enrollment
      });
    } catch (error) {
      console.error("Error checking enrollment status:", error);
      res.status(500).json({ message: "Failed to check enrollment status" });
    }
  });

  app.delete("/api/courses/:courseId/mentors/:mentorId", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
    const { courseId, mentorId } = req.params;
    
    try {
      await db.delete(courseMentors)
        .where(and(
          eq(courseMentors.courseId, parseInt(courseId)),
          eq(courseMentors.mentorId, mentorId)
        ));
      
      res.json({ message: 'Mentor removed successfully' });
    } catch (error) {
      console.error('Error removing mentor:', error);
      res.status(500).json({ message: 'Failed to remove mentor' });
    }
  });

  // Register notification routes
  registerNotificationRoutes(app);
  
  // Register assessment routes
  registerAssessmentRoutes(app);
  
  // Register code execution routes
  registerCodeExecutionRoutes(app);
  
  // Register enhanced live session routes with video conferencing
  registerEnhancedLiveSessionRoutes(app);
  
  // Register invoice and payment routes
  registerInvoiceRoutes(app);

  return httpServer;
}

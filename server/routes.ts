import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./replitAuth";
import { z } from "zod";
import { UserRole } from "@shared/schema";
import { initializePayment, verifyPayment } from "./paystack";
import { setUserAsAdmin } from "./admin-setup";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Setup admin user - this endpoint will make the currently logged in user an admin
  app.post('/api/setup-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  
  app.post('/api/admin/users', isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, bio, profileImageUrl } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Create a new user
      const newUser = await storage.createUser({
        id: String(Date.now()), // Generate a temporary ID
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        role: role || "student",
        bio: bio || "",
        profileImageUrl: profileImageUrl || "",
        password // This will be hashed by the storage layer
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.patch('/api/admin/users/:id', isAuthenticated, hasRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, req.body);
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
        await storage.assignMentorToCourse({
          courseId: course.id,
          mentorId: userId,
          commission: 37, // Default commission rate
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
      
      // If mentor, only show their sessions
      let mentorId;
      if (user?.role === UserRole.MENTOR) {
        mentorId = userId;
      }
      
      const sessions = await storage.getUpcomingLiveSessions(mentorId);
      res.json(sessions);
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
      const messages = await storage.getMessagesForUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(messageId);
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

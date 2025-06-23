import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { storage } from "./storage";

async function initializeDemoData() {
  try {
    console.log("Initializing demo data...");
    
    // Check if student user exists and has enrollments
    const studentEnrollments = await storage.getStudentEnrollments("demo-oyinkonsola-789");
    
    if (studentEnrollments.length === 0) {
      // Create demo courses if they don't exist
      const courses = await storage.getCourses();
      let webDevCourse = courses.find(c => c.title?.includes("Web Development"));
      let javaCourse = courses.find(c => c.title?.includes("Java"));
      
      if (!webDevCourse) {
        webDevCourse = await storage.createCourse({
          title: "Full Stack Web Development",
          description: "Learn modern web development with React, Node.js, and databases",
          thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80",
          isPublished: true,
          price: 29900,
          currency: "NGN",
          level: "beginner",
          duration: 12,
          categoryId: 1
        });
      }
      
      if (!javaCourse) {
        javaCourse = await storage.createCourse({
          title: "Java Programming Fundamentals",
          description: "Master Java programming from basics to advanced concepts",
          thumbnail: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1769&q=80",
          isPublished: true,
          price: 24900,
          currency: "NGN",
          level: "beginner",
          duration: 8,
          categoryId: 1
        });
      }
      
      // Enroll student in courses
      await storage.enrollUserInCourse({
        userId: "demo-oyinkonsola-789",
        courseId: webDevCourse.id,
        enrollmentType: "paid",
        paymentStatus: "completed"
      });
      
      await storage.enrollUserInCourse({
        userId: "demo-oyinkonsola-789",
        courseId: javaCourse.id,
        enrollmentType: "paid",
        paymentStatus: "completed"
      });
      
      // Create demo modules and lessons for progress tracking
      const webDevModule = await storage.createModule({
        courseId: webDevCourse.id,
        title: "Introduction to Web Development",
        description: "Learn the fundamentals of web development",
        orderIndex: 1
      });
      
      const webDevLesson1 = await storage.createLesson({
        moduleId: webDevModule.id,
        title: "HTML Basics",
        description: "Learn HTML fundamentals",
        content: "Introduction to HTML tags and structure",
        type: "video",
        orderIndex: 1,
        duration: 45
      });
      
      const webDevLesson2 = await storage.createLesson({
        moduleId: webDevModule.id,
        title: "CSS Styling",
        description: "Learn CSS for styling web pages",
        content: "CSS selectors, properties, and layout",
        type: "video",
        orderIndex: 2,
        duration: 60
      });
      
      // Mark first lesson as completed for progress
      await storage.updateLessonProgress(webDevLesson1.id, "demo-oyinkonsola-789", {
        completed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        timeSpent: 45
      });
      
      // Create demo mentors with proper course assignments
      const mentorUsers = await storage.getUsers();
      const existingMentors = mentorUsers.filter(user => user.role === 'mentor');
      
      if (existingMentors.length === 0) {
        // Create demo mentors
        const mentor1 = await storage.createUser({
          email: "john.mentor@example.com",
          firstName: "John",
          lastName: "Smith",
          role: "mentor"
        });
        
        const mentor2 = await storage.createUser({
          email: "sarah.dev@example.com", 
          firstName: "Sarah",
          lastName: "Johnson",
          role: "mentor"
        });
        
        // Assign mentors to courses
        await storage.updateCourse(webDevCourse.id, { mentorId: mentor1.id });
        await storage.updateCourse(javaCourse.id, { mentorId: mentor2.id });
        
        console.log("Demo mentors created and assigned to courses");
      }

      console.log("Demo data initialized successfully");
    } else {
      console.log("Demo data already exists");
    }
  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware will be configured in auth.ts via setupAuth()

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

(async () => {
  let server;
  
  try {
    server = await registerRoutes(app);

    // Demo data initialization temporarily disabled
    // await initializeDemoData();

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`Error handling request: ${message}`);
      res.status(status).json({ message });
    });
  } catch (error) {
    console.error('Failed to register routes:', error);
    // Create a simple HTTP server if route registration failed
    server = createServer(app);
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  try {
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (error) {
    console.error('Failed to setup frontend:', error);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})().catch(error => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});

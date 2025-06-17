import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const userRole = user?.role;
      
      console.log(`Notification request - isAuthenticated: ${!!req.isAuthenticated()} user: ${!!user} userRole: ${userRole}`);
      
      if (!user || !userRole) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`About to generate notifications for user ${user.id} with role ${userRole}`);
      
      const notifications: any[] = [];
      const now = new Date();
      
      if (userRole === 'student') {
        // Messages
        notifications.push({
          id: Date.now() + 1,
          title: "New Messages",
          message: "You have 2 unread messages",
          type: "info",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString()
        });

        // Course updates
        notifications.push({
          id: Date.now() + 2,
          title: "Course Welcome",
          message: "Welcome to your new course! Start learning today.",
          type: "success",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
        });

        // Assignments
        notifications.push({
          id: Date.now() + 3,
          title: "Assignment Due",
          message: "You have 2 assignments due this week",
          type: "warning",
          priority: "high",
          isRead: false,
          createdAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString()
        });

        // Quizzes
        notifications.push({
          id: Date.now() + 4,
          title: "New Quiz Available",
          message: "New quiz available in JavaScript Fundamentals",
          type: "info",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
        });
      }

      if (userRole === 'mentor') {
        // Student submissions
        notifications.push({
          id: Date.now() + 4,
          title: "Grading Required",
          message: "5 new assignment submissions require grading",
          type: "warning",
          priority: "high",
          isRead: false,
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
        });

        // Course performance
        notifications.push({
          id: Date.now() + 5,
          title: "Course Analytics",
          message: "Your React course has 85% completion rate this month",
          type: "success",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
        });

        // Payment notifications
        notifications.push({
          id: Date.now() + 6,
          title: "Payment Ready",
          message: "₦45,000 payout is ready for withdrawal",
          type: "success",
          priority: "high",
          isRead: false,
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
        });

        // New student enrollments
        notifications.push({
          id: Date.now() + 7,
          title: "New Enrollments",
          message: "3 new students enrolled in your courses today",
          type: "info",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
        });

        // Student queries
        notifications.push({
          id: Date.now() + 8,
          title: "Student Questions",
          message: "2 students asked questions in your courses",
          type: "info",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString()
        });
      }

      if (userRole === 'admin') {
        // System overview
        notifications.push({
          id: Date.now() + 8,
          title: "Revenue Update",
          message: "Platform revenue increased by 12% this month",
          type: "success",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
        });

        // User activity
        notifications.push({
          id: Date.now() + 9,
          title: "New Registrations",
          message: "25 new user registrations this week",
          type: "info",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
        });

        // Course reviews
        notifications.push({
          id: Date.now() + 10,
          title: "Approval Required",
          message: "8 courses pending approval from mentors",
          type: "warning",
          priority: "high",
          isRead: false,
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
        });

        // Payment processing
        notifications.push({
          id: Date.now() + 11,
          title: "Payout Processed",
          message: "₦125,000 in mentor payouts processed successfully",
          type: "success",
          priority: "medium",
          isRead: false,
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
        });

        // System alerts
        notifications.push({
          id: Date.now() + 12,
          title: "System Maintenance",
          message: "Scheduled maintenance window this Sunday 2-4 AM",
          type: "info",
          priority: "low",
          isRead: false,
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
        });

        // Support tickets
        notifications.push({
          id: Date.now() + 13,
          title: "Support Tickets",
          message: "4 new support tickets require attention",
          type: "warning",
          priority: "high",
          isRead: false,
          createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
        });
      }

      const response = {
        notifications,
        timestamp: Date.now(),
        totalCount: notifications.length,
        unreadCount: notifications.filter(n => !n.isRead).length
      };

      console.log(`Generated ${notifications.length} notifications for user ${user.id} (${userRole})`);
      
      // Set cache-busting headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(response);
    } catch (error) {
      console.error('Error generating notifications:', error);
      res.status(500).json({ 
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // In a real app, this would update the database
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/mark-all-read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // In a real app, this would update all notifications for the user
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // In a real app, this would delete the notification from the database
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
}
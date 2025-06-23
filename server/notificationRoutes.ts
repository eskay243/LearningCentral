import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`Fetching real notifications for user ${user.id} with role ${user.role}`);
      
      // Get real notifications from database
      const notifications = await storage.getNotifications(user.id, {
        limit: 20,
        offset: 0
      });

      // Get unread count
      const unreadCount = await storage.getUnreadNotificationCount(user.id);
      
      console.log(`Found ${notifications.length} notifications for user ${user.id}, ${unreadCount} unread`);
      
      res.json({ 
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          isRead: n.isRead,
          actionUrl: n.actionUrl,
          metadata: n.metadata,
          createdAt: n.createdAt
        })),
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Add real database-driven notification management routes
  app.put("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(parseInt(id));
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(parseInt(id));
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Create a demo notification endpoint for testing
  app.post("/api/notifications/demo", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let notification;
      
      if (user.role === 'student') {
        notification = await storage.createNotification({
          userId: user.id,
          title: "Welcome to the LMS!",
          message: "Start exploring your courses and track your progress.",
          type: "success",
          priority: "medium",
          actionUrl: "/student/courses"
        });
      } else if (user.role === 'mentor') {
        notification = await storage.createNotification({
          userId: user.id,
          title: "New Demo Student Enrolled",
          message: "A demo student has enrolled in your course. Commission earned: ₦185.00",
          type: "success", 
          priority: "high",
          actionUrl: "/mentor/earnings"
        });
      } else if (user.role === 'admin') {
        notification = await storage.createNotification({
          userId: user.id,
          title: "System Demo Notification",
          message: "Demo payment of ₦500 processed successfully",
          type: "info",
          priority: "medium",
          actionUrl: "/admin/payments"
        });
      }

      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error creating demo notification:', error);
      res.status(500).json({ message: "Failed to create demo notification" });
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
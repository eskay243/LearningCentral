import { Express, Request, Response } from 'express';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';

interface NotificationRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function registerNotificationRoutes(app: Express) {
  // Get user notifications
  app.get('/api/notifications', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.put('/api/notifications/:id/read', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read
  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      await storage.deleteNotification(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

  // Create notification (for system use)
  app.post('/api/notifications', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const { userId, type, priority, title, message, actionUrl, metadata } = req.body;
      
      // Only admins can create notifications for other users
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const notification = await storage.createNotification({
        userId,
        type: type || 'info',
        priority: priority || 'medium',
        title,
        message,
        actionUrl,
        metadata
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  // Generate smart notifications based on user activity
  app.post('/api/notifications/generate-smart', isAuthenticated, async (req: NotificationRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      await generateSmartNotifications(userId, userRole);
      res.json({ success: true });
    } catch (error) {
      console.error('Error generating smart notifications:', error);
      res.status(500).json({ message: 'Failed to generate notifications' });
    }
  });
}

// Helper function to generate smart notifications based on user behavior
async function generateSmartNotifications(userId: string, userRole: string) {
  try {
    const notifications = [];

    if (userRole === 'mentor') {
      // Check for new student enrollments
      const recentEnrollments = await storage.getRecentMentorEnrollments(userId);
      if (recentEnrollments.length > 0) {
        notifications.push({
          userId,
          type: 'info',
          priority: 'medium',
          title: 'New Student Enrollments',
          message: `${recentEnrollments.length} students enrolled in your courses this week`,
          actionUrl: '/mentor-dashboard'
        });
      }

      // Check for pending payouts
      const pendingPayouts = await storage.getMentorPendingPayouts(userId);
      if (pendingPayouts > 0) {
        notifications.push({
          userId,
          type: 'success',
          priority: 'high',
          title: 'Payout Available',
          message: `You have ₦${pendingPayouts.toLocaleString()} available for withdrawal`,
          actionUrl: '/mentor-dashboard'
        });
      }

      // Check for course completion rates
      const lowPerformingCourses = await storage.getLowPerformingCourses(userId);
      if (lowPerformingCourses.length > 0) {
        notifications.push({
          userId,
          type: 'warning',
          priority: 'medium',
          title: 'Course Performance Alert',
          message: `${lowPerformingCourses.length} of your courses have low completion rates`,
          actionUrl: '/courses'
        });
      }
    }

    if (userRole === 'student') {
      // Check for overdue assignments
      const overdueAssignments = await storage.getOverdueAssignments(userId);
      if (overdueAssignments.length > 0) {
        notifications.push({
          userId,
          type: 'warning',
          priority: 'high',
          title: 'Overdue Assignments',
          message: `You have ${overdueAssignments.length} overdue assignments`,
          actionUrl: '/assignments'
        });
      }

      // Check for course progress
      const staleCourses = await storage.getStaleCourses(userId);
      if (staleCourses.length > 0) {
        notifications.push({
          userId,
          type: 'info',
          priority: 'medium',
          title: 'Continue Your Learning',
          message: `You haven't accessed ${staleCourses.length} courses in over a week`,
          actionUrl: '/courses'
        });
      }

      // Check for new course recommendations
      const recommendations = await storage.getCourseRecommendations(userId);
      if (recommendations.length > 0) {
        notifications.push({
          userId,
          type: 'info',
          priority: 'low',
          title: 'New Course Recommendations',
          message: `${recommendations.length} new courses match your interests`,
          actionUrl: '/courses'
        });
      }
    }

    if (userRole === 'admin') {
      // Check for system alerts
      const systemIssues = await storage.getSystemIssues();
      if (systemIssues.length > 0) {
        notifications.push({
          userId,
          type: 'error',
          priority: 'urgent',
          title: 'System Issues Detected',
          message: `${systemIssues.length} system issues require attention`,
          actionUrl: '/admin/system'
        });
      }

      // Check for pending course approvals
      const pendingCourses = await storage.getPendingCourseApprovals();
      if (pendingCourses.length > 0) {
        notifications.push({
          userId,
          type: 'info',
          priority: 'medium',
          title: 'Pending Course Approvals',
          message: `${pendingCourses.length} courses are awaiting approval`,
          actionUrl: '/admin/courses'
        });
      }

      // Check for mentor withdrawal requests
      const withdrawalRequests = await storage.getPendingWithdrawalRequests();
      if (withdrawalRequests.length > 0) {
        notifications.push({
          userId,
          type: 'info',
          priority: 'high',
          title: 'Withdrawal Requests',
          message: `${withdrawalRequests.length} mentor withdrawal requests pending`,
          actionUrl: '/admin/withdrawals'
        });
      }
    }

    // Create all notifications
    for (const notification of notifications) {
      await storage.createNotification(notification);
    }

  } catch (error) {
    console.error('Error generating smart notifications:', error);
  }
}
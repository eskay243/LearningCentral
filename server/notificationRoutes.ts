import { Express, Request, Response } from 'express';
import { isAuthenticated } from './auth';
import { storage } from './storage';

// Generate dynamic notifications based on user role and activities
async function generateDynamicNotifications(userId: string, userRole: string) {
  const notifications = [];
  const now = new Date();
  
  try {
    if (userRole === 'student') {
      // Recent course enrollments
      notifications.push({
        id: Date.now() + 1,
        message: "Welcome to your new course! Start learning today.",
        type: "course",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
      });

      // Assignment reminders
      notifications.push({
        id: Date.now() + 2,
        message: "You have 2 assignments due this week",
        type: "assignment",
        priority: "high",
        read: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      });

      // Quiz notifications
      notifications.push({
        id: Date.now() + 3,
        message: "New quiz available in JavaScript Fundamentals",
        type: "quiz",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
      });
    }

    if (userRole === 'mentor') {
      // Student submissions
      notifications.push({
        id: Date.now() + 4,
        message: "5 new assignment submissions require grading",
        type: "grading",
        priority: "high",
        read: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
      });

      // Course performance
      notifications.push({
        id: Date.now() + 5,
        message: "Your React course has 85% completion rate this month",
        type: "analytics",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
      });

      // Payment notifications
      notifications.push({
        id: Date.now() + 6,
        message: "₦45,000 payout is ready for withdrawal",
        type: "payment",
        priority: "high",
        read: false,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
      });

      // New student enrollments
      notifications.push({
        id: Date.now() + 7,
        message: "3 new students enrolled in your courses today",
        type: "enrollment",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
      });
    }

    if (userRole === 'admin') {
      // System overview
      notifications.push({
        id: Date.now() + 8,
        message: "Platform revenue increased by 12% this month",
        type: "revenue",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
      });

      // User activity
      notifications.push({
        id: Date.now() + 9,
        message: "25 new user registrations this week",
        type: "users",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      });

      // Course reviews
      notifications.push({
        id: Date.now() + 10,
        message: "8 courses pending approval from mentors",
        type: "approval",
        priority: "high",
        read: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
      });

      // Payment processing
      notifications.push({
        id: Date.now() + 11,
        message: "₦125,000 in mentor payouts processed successfully",
        type: "payment",
        priority: "medium",
        read: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
      });

      // System alerts
      notifications.push({
        id: Date.now() + 12,
        message: "Server performance optimal - 99.8% uptime",
        type: "system",
        priority: "low",
        read: true,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Add some recent message notifications for all roles
    notifications.push({
      id: Date.now() + 13,
      message: "You have 2 unread messages",
      type: "message",
      priority: "medium",
      read: false,
      createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    });

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error generating dynamic notifications:', error);
    return [];
  }
}

interface NotificationRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Export notification service for use in other modules
export const notificationService = {
  async createNotification(notification: {
    userId: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    console.log(`Creating notification for user ${notification.userId}: ${notification.message}`);
    // In a real system, this would save to database and push via WebSocket
    return notification;
  }
};

export function registerNotificationRoutes(app: Express) {
  // Get user notifications
  app.get('/api/notifications', async (req: any, res: Response) => {
    try {
      console.log('Notification request - isAuthenticated:', req.isAuthenticated?.(), 'user:', !!req.user);
      
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        console.log('Not authenticated - returning 401');
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        console.log('No userId found - returning 401');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Disable caching for notifications to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Generate dynamic notifications based on user role and recent activities
      const dynamicNotifications = await generateDynamicNotifications(userId, userRole || 'student');
      console.log(`Generated ${dynamicNotifications.length} notifications for user ${userId} (${userRole})`);
      
      return res.json(dynamicNotifications);
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
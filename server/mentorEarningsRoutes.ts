import { type Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./auth";

export function registerMentorEarningsRoutes(app: Express): void {
  
  // Get comprehensive mentor earnings data
  app.get('/api/mentor/earnings', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user?.role !== 'mentor') {
        return res.status(403).json({ message: 'Access denied. Mentor role required.' });
      }

      const mentorId = req.user.id;
      const { timeRange = '30' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange as string));

      // Get mentor's course enrollments within date range
      const enrollments = await storage.getMentorEnrollments(mentorId, startDate, endDate);
      
      // Calculate commission (37% of course price)
      const commissionRate = 0.37;
      let totalEarnings = 0;
      let currentMonthEarnings = 0;
      let completionBonuses = 0;
      let pendingPayouts = 0;
      
      const topCourses: Array<{
        courseId: string;
        courseName: string;
        completions: number;
        earnings: number;
      }> = [];

      const courseMap = new Map();
      
      for (const enrollment of enrollments) {
        const coursePrice = parseFloat(enrollment.course?.price || '0');
        const commission = coursePrice * commissionRate;
        
        totalEarnings += commission;
        
        // Check if enrollment is in current month
        const enrollmentDate = new Date(enrollment.enrolledAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (enrollmentDate.getMonth() === currentMonth && enrollmentDate.getFullYear() === currentYear) {
          currentMonthEarnings += commission;
        }
        
        // Add completion bonus if student completed the course
        if (enrollment.completedAt) {
          const completionBonus = coursePrice * 0.05; // 5% completion bonus
          completionBonuses += completionBonus;
          totalEarnings += completionBonus;
        } else {
          // If not completed, consider it pending
          pendingPayouts += commission;
        }
        
        // Track top courses
        const courseId = enrollment.courseId.toString();
        const courseName = enrollment.course?.title || 'Unknown Course';
        
        if (courseMap.has(courseId)) {
          const existing = courseMap.get(courseId);
          existing.completions += 1;
          existing.earnings += commission;
        } else {
          courseMap.set(courseId, {
            courseId,
            courseName,
            completions: 1,
            earnings: commission
          });
        }
      }
      
      // Convert map to array and sort by earnings
      const topCoursesArray = Array.from(courseMap.values())
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5);

      const avgCommissionPerCompletion = enrollments.length > 0 
        ? totalEarnings / enrollments.length 
        : 0;

      const earningsData = {
        totalEarnings: Math.round(totalEarnings),
        currentMonthEarnings: Math.round(currentMonthEarnings),
        completionBonuses: Math.round(completionBonuses),
        pendingPayouts: Math.round(pendingPayouts),
        avgCommissionPerCompletion: Math.round(avgCommissionPerCompletion),
        topCourses: topCoursesArray,
        commissionRate: commissionRate * 100, // Return as percentage
        totalEnrollments: enrollments.length,
        completedCourses: enrollments.filter(e => e.completedAt).length
      };

      res.json(earningsData);
    } catch (error) {
      console.error('Error fetching mentor earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings data' });
    }
  });

  // Get course completion analytics for dashboard
  app.get('/api/course-completion/stats', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user?.role !== 'admin' && req.user?.role !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { timeRange = '30' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange as string));

      // Get all enrollments for the time range
      let enrollments;
      if (req.user.role === 'admin') {
        enrollments = await storage.getAllEnrollments(startDate, endDate);
      } else {
        enrollments = await storage.getMentorEnrollments(req.user.id, startDate, endDate);
      }

      const totalEnrollments = enrollments.length;
      const completedCourses = enrollments.filter(e => e.completedAt).length;
      const inProgressCourses = totalEnrollments - completedCourses;
      const certificatesIssued = enrollments.filter(e => e.certificateGenerated).length;
      
      // Calculate average completion time
      const completedEnrollments = enrollments.filter(e => e.completedAt);
      let totalCompletionDays = 0;
      
      for (const enrollment of completedEnrollments) {
        const enrolledDate = new Date(enrollment.enrolledAt);
        const completedDate = new Date(enrollment.completedAt!);
        const daysDiff = Math.ceil((completedDate.getTime() - enrolledDate.getTime()) / (1000 * 3600 * 24));
        totalCompletionDays += daysDiff;
      }
      
      const averageCompletionTime = completedEnrollments.length > 0 
        ? Math.round(totalCompletionDays / completedEnrollments.length)
        : 0;
      
      const completionRate = totalEnrollments > 0 
        ? (completedCourses / totalEnrollments) * 100 
        : 0;

      // Get top performers (students with highest completion rates)
      const studentPerformance = await storage.getTopPerformingStudents(10);
      
      // Get recent completions
      const recentCompletions = enrollments
        .filter(e => e.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 10)
        .map(enrollment => ({
          id: enrollment.id,
          studentName: enrollment.student?.firstName 
            ? `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim()
            : enrollment.student?.email || 'Unknown Student',
          courseName: enrollment.course?.title || 'Unknown Course',
          completedAt: enrollment.completedAt!,
          finalScore: enrollment.finalScore || 0,
          certificateGenerated: !!enrollment.certificateGenerated,
          mentorCommission: enrollment.course?.price 
            ? Math.round(parseFloat(enrollment.course.price) * 0.37)
            : 0
        }));

      const statsData = {
        totalEnrollments,
        completedCourses,
        inProgressCourses,
        certificatesIssued,
        averageCompletionTime,
        completionRate: Math.round(completionRate * 100) / 100,
        topPerformers: studentPerformance,
        recentCompletions
      };

      res.json(statsData);
    } catch (error) {
      console.error('Error fetching completion stats:', error);
      res.status(500).json({ message: 'Failed to fetch completion statistics' });
    }
  });

  // Generate certificate endpoint
  app.post('/api/certificates/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { studentId, courseId } = req.body;
      
      if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Student ID and Course ID are required' });
      }

      // Check if user has permission
      if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Find the enrollment
      const enrollment = await storage.getEnrollmentByStudentAndCourse(studentId, courseId);
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }

      if (!enrollment.completedAt) {
        return res.status(400).json({ message: 'Course not completed yet' });
      }

      // Generate certificate (this would integrate with actual certificate generation service)
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Update enrollment with certificate info
      await storage.updateEnrollment(enrollment.id, {
        certificateGenerated: true,
        certificateId,
        certificateIssuedAt: new Date()
      });

      // Here you would typically:
      // 1. Generate the actual PDF certificate
      // 2. Store it in file system or cloud storage
      // 3. Send email to student with certificate

      res.json({
        success: true,
        certificateId,
        message: 'Certificate generated successfully'
      });

    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({ message: 'Failed to generate certificate' });
    }
  });

  // Process bulk completions
  app.post('/api/course-completion/process-bulk', isAuthenticated, hasRole(['admin']), async (req: any, res) => {
    try {
      // Get all enrollments that are completed but don't have certificates
      const pendingCertificates = await storage.getEnrollmentsPendingCertificates();
      
      let processedCount = 0;
      let certificatesGenerated = 0;

      for (const enrollment of pendingCertificates) {
        try {
          const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await storage.updateEnrollment(enrollment.id, {
            certificateGenerated: true,
            certificateId,
            certificateIssuedAt: new Date()
          });

          certificatesGenerated++;
        } catch (error) {
          console.error(`Failed to process enrollment ${enrollment.id}:`, error);
        }
        
        processedCount++;
      }

      res.json({
        success: true,
        processedCount,
        certificatesGenerated,
        message: `Processed ${processedCount} completions, generated ${certificatesGenerated} certificates`
      });

    } catch (error) {
      console.error('Error processing bulk completions:', error);
      res.status(500).json({ message: 'Failed to process bulk completions' });
    }
  });

  // Toggle auto-certificate generation
  app.post('/api/course-completion/auto-certificates', isAuthenticated, hasRole(['admin']), async (req: any, res) => {
    try {
      const { enabled } = req.body;
      
      // Store setting in database or configuration
      await storage.updateSystemSetting('auto_generate_certificates', enabled);
      
      res.json({
        success: true,
        enabled,
        message: `Auto-certificate generation ${enabled ? 'enabled' : 'disabled'}`
      });

    } catch (error) {
      console.error('Error updating auto-certificate setting:', error);
      res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  // Get live session analytics data
  app.get('/api/live-sessions/analytics', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user?.role !== 'admin' && req.user?.role !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { timeRange = '30', courseFilter = 'all' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange as string));

      // Get session analytics data
      let sessions;
      if (req.user.role === 'admin') {
        sessions = await storage.getSessionAnalytics(startDate, endDate, courseFilter);
      } else {
        sessions = await storage.getMentorSessionAnalytics(req.user.id, startDate, endDate, courseFilter);
      }

      // Transform data for analytics dashboard
      const analyticsData = sessions.map(session => ({
        id: session.id,
        title: session.title,
        scheduledAt: session.scheduledAt,
        duration: session.duration || 60,
        attendanceRate: session.attendanceData?.attendanceRate || 0,
        peakAttendance: session.attendanceData?.peakAttendance || 0,
        avgWatchTime: session.attendanceData?.avgWatchTime || 0,
        chatMessages: session.analytics?.chatMessages || 0,
        questionsAsked: session.analytics?.questionsAsked || 0,
        pollResponses: session.analytics?.pollResponses || 0,
        rating: session.analytics?.averageRating || 0,
        completionRate: session.attendanceData?.completionRate || 0
      }));

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching session analytics:', error);
      res.status(500).json({ message: 'Failed to fetch session analytics' });
    }
  });

  // Get overall metrics for analytics dashboard
  app.get('/api/live-sessions/metrics', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user?.role !== 'admin' && req.user?.role !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { timeRange = '30', courseFilter = 'all' } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange as string));

      // Get overall metrics
      const metrics = await storage.getSessionOverallMetrics(
        req.user.role === 'admin' ? null : req.user.id,
        startDate,
        endDate,
        courseFilter
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching overall metrics:', error);
      res.status(500).json({ message: 'Failed to fetch overall metrics' });
    }
  });
}
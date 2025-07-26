import { storage } from "./storage";
import { type Express } from "express";
import { isAuthenticated, hasRole } from "./auth";
import { UserRole } from "@shared/schema";

// Advanced Analytics Service for enhanced quiz and course analytics
export class AdvancedAnalyticsService {
  
  // Get comprehensive quiz analytics
  static async getQuizAnalytics(courseId?: number, mentorId?: number): Promise<any> {
    try {
      const analytics = {
        overview: {
          totalQuizzes: 0,
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          completionRate: 0
        },
        performanceMetrics: {
          scoreDistribution: {
            excellent: 0, // 90-100%
            good: 0,      // 75-89%
            average: 0,   // 60-74%
            poor: 0       // below 60%
          },
          difficultyAnalysis: {
            easy: { averageScore: 0, attempts: 0 },
            medium: { averageScore: 0, attempts: 0 },
            hard: { averageScore: 0, attempts: 0 }
          },
          timeAnalysis: {
            averageCompletionTime: 0,
            quickestCompletion: 0,
            slowestCompletion: 0
          }
        },
        trendsAndInsights: {
          weeklyProgress: [],
          topPerformingQuizzes: [],
          strugglingAreas: [],
          improvementAreas: []
        },
        studentInsights: {
          topPerformers: [],
          needsHelp: [],
          engagementMetrics: {
            activeStudents: 0,
            averageAttemptsPerStudent: 0,
            retakeRate: 0
          }
        }
      };

      // Get all quiz attempts filtered by course/mentor
      const quizAttempts = await storage.getFilteredQuizAttempts(courseId, mentorId);
      
      if (quizAttempts.length === 0) {
        return analytics;
      }

      // Calculate overview metrics
      analytics.overview.totalAttempts = quizAttempts.length;
      analytics.overview.totalQuizzes = new Set(quizAttempts.map(a => a.quizId)).size;
      
      const scores = quizAttempts.map(a => a.score || 0);
      analytics.overview.averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      
      const passedAttempts = quizAttempts.filter(a => (a.score || 0) >= 70);
      analytics.overview.passRate = Math.round((passedAttempts.length / quizAttempts.length) * 100);
      
      const completedAttempts = quizAttempts.filter(a => a.status === 'completed');
      analytics.overview.completionRate = Math.round((completedAttempts.length / quizAttempts.length) * 100);

      // Score distribution
      scores.forEach(score => {
        if (score >= 90) analytics.performanceMetrics.scoreDistribution.excellent++;
        else if (score >= 75) analytics.performanceMetrics.scoreDistribution.good++;
        else if (score >= 60) analytics.performanceMetrics.scoreDistribution.average++;
        else analytics.performanceMetrics.scoreDistribution.poor++;
      });

      // Time analysis (simulated for now)
      const completionTimes = quizAttempts
        .filter(a => a.completedAt && a.startedAt)
        .map(a => {
          const start = new Date(a.startedAt!).getTime();
          const end = new Date(a.completedAt!).getTime();
          return Math.round((end - start) / 60000); // minutes
        });

      if (completionTimes.length > 0) {
        analytics.performanceMetrics.timeAnalysis.averageCompletionTime = Math.round(
          completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        );
        analytics.performanceMetrics.timeAnalysis.quickestCompletion = Math.min(...completionTimes);
        analytics.performanceMetrics.timeAnalysis.slowestCompletion = Math.max(...completionTimes);
      }

      // Student insights
      const studentPerformance = await this.calculateStudentPerformanceMetrics(quizAttempts);
      analytics.studentInsights = studentPerformance;

      // Weekly progress (last 4 weeks)
      analytics.trendsAndInsights.weeklyProgress = await this.getWeeklyProgressData(quizAttempts);

      // Top performing quizzes
      analytics.trendsAndInsights.topPerformingQuizzes = await this.getTopPerformingQuizzes(quizAttempts);

      return analytics;
    } catch (error) {
      console.error("Error generating quiz analytics:", error);
      throw error;
    }
  }

  // Calculate student performance metrics
  static async calculateStudentPerformanceMetrics(quizAttempts: any[]): Promise<any> {
    const studentStats = new Map();

    // Group attempts by student
    quizAttempts.forEach(attempt => {
      const studentId = attempt.userId;
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          userId: studentId,
          attempts: [],
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          attemptsCount: 0
        });
      }
      
      const student = studentStats.get(studentId);
      student.attempts.push(attempt);
      student.totalScore += attempt.score || 0;
      student.attemptsCount++;
      student.bestScore = Math.max(student.bestScore, attempt.score || 0);
      student.averageScore = Math.round(student.totalScore / student.attemptsCount);
    });

    // Convert to arrays and sort
    const studentsArray = Array.from(studentStats.values());
    
    const topPerformers = studentsArray
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10)
      .map(async (student) => {
        const user = await storage.getUser(student.userId);
        return {
          userId: student.userId,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
          averageScore: student.averageScore,
          bestScore: student.bestScore,
          totalAttempts: student.attemptsCount
        };
      });

    const needsHelp = studentsArray
      .filter(s => s.averageScore < 60)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 10)
      .map(async (student) => {
        const user = await storage.getUser(student.userId);
        return {
          userId: student.userId,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
          averageScore: student.averageScore,
          strugglingAreas: ['Quiz completion', 'Understanding concepts'],
          recommendedActions: ['Extra practice', 'One-on-one mentoring']
        };
      });

    return {
      topPerformers: await Promise.all(topPerformers),
      needsHelp: await Promise.all(needsHelp),
      engagementMetrics: {
        activeStudents: studentsArray.length,
        averageAttemptsPerStudent: Math.round(
          studentsArray.reduce((sum, s) => sum + s.attemptsCount, 0) / studentsArray.length
        ),
        retakeRate: Math.round(
          (studentsArray.filter(s => s.attemptsCount > 1).length / studentsArray.length) * 100
        )
      }
    };
  }

  // Get weekly progress data
  static async getWeeklyProgressData(quizAttempts: any[]): Promise<any[]> {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const weekAttempts = quizAttempts.filter(attempt => {
        const attemptDate = new Date(attempt.createdAt);
        return attemptDate >= weekStart && attemptDate < weekEnd;
      });

      const weekData = {
        week: `Week ${4 - i}`,
        date: weekStart.toISOString().split('T')[0],
        attempts: weekAttempts.length,
        averageScore: weekAttempts.length > 0 
          ? Math.round(weekAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / weekAttempts.length)
          : 0,
        passRate: weekAttempts.length > 0
          ? Math.round((weekAttempts.filter(a => (a.score || 0) >= 70).length / weekAttempts.length) * 100)
          : 0
      };

      weeks.push(weekData);
    }

    return weeks;
  }

  // Get top performing quizzes
  static async getTopPerformingQuizzes(quizAttempts: any[]): Promise<any[]> {
    const quizStats = new Map();

    quizAttempts.forEach(attempt => {
      const quizId = attempt.quizId;
      if (!quizStats.has(quizId)) {
        quizStats.set(quizId, {
          quizId,
          attempts: [],
          totalScore: 0,
          averageScore: 0
        });
      }
      
      const quiz = quizStats.get(quizId);
      quiz.attempts.push(attempt);
      quiz.totalScore += attempt.score || 0;
      quiz.averageScore = Math.round(quiz.totalScore / quiz.attempts.length);
    });

    const quizArray = Array.from(quizStats.values())
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    return Promise.all(quizArray.map(async (quiz) => {
      // Get quiz details (simulated for now)
      return {
        quizId: quiz.quizId,
        title: `Quiz ${quiz.quizId}`,
        averageScore: quiz.averageScore,
        totalAttempts: quiz.attempts.length,
        difficulty: quiz.averageScore >= 80 ? 'Easy' : quiz.averageScore >= 60 ? 'Medium' : 'Hard'
      };
    }));
  }

  // Get course completion analytics
  static async getCourseCompletionAnalytics(courseId?: number, mentorId?: number): Promise<any> {
    try {
      const enrollments = mentorId 
        ? await storage.getMentorEnrollments(mentorId)
        : courseId 
        ? await storage.getEnrollmentsByCourse(courseId)
        : await storage.getAllEnrollments();

      const analytics = {
        overview: {
          totalEnrollments: enrollments.length,
          completedCourses: enrollments.filter(e => e.completedAt).length,
          inProgress: enrollments.filter(e => !e.completedAt && e.progress > 0).length,
          notStarted: enrollments.filter(e => !e.progress || e.progress === 0).length,
          averageCompletionTime: 0,
          overallCompletionRate: 0
        },
        progressDistribution: {
          '0-25%': 0,
          '26-50%': 0,
          '51-75%': 0,
          '76-99%': 0,
          '100%': 0
        },
        monthlyTrends: [],
        coursePerformance: [],
        studentEngagement: {
          highlyEngaged: 0,
          moderatelyEngaged: 0,
          lowEngagement: 0,
          averageSessionTime: 0,
          averageProgressPerWeek: 0
        }
      };

      // Calculate completion rate
      analytics.overview.overallCompletionRate = Math.round(
        (analytics.overview.completedCourses / analytics.overview.totalEnrollments) * 100
      );

      // Progress distribution
      enrollments.forEach(enrollment => {
        const progress = enrollment.progress || 0;
        if (progress === 0) analytics.progressDistribution['0-25%']++;
        else if (progress <= 25) analytics.progressDistribution['0-25%']++;
        else if (progress <= 50) analytics.progressDistribution['26-50%']++;
        else if (progress <= 75) analytics.progressDistribution['51-75%']++;
        else if (progress < 100) analytics.progressDistribution['76-99%']++;
        else analytics.progressDistribution['100%']++;
      });

      // Calculate average completion time
      const completedEnrollments = enrollments.filter(e => e.completedAt && e.enrolledAt);
      if (completedEnrollments.length > 0) {
        const totalDays = completedEnrollments.reduce((sum, enrollment) => {
          const start = new Date(enrollment.enrolledAt).getTime();
          const end = new Date(enrollment.completedAt!).getTime();
          return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }, 0);
        analytics.overview.averageCompletionTime = Math.round(totalDays / completedEnrollments.length);
      }

      // Monthly trends (last 6 months)
      analytics.monthlyTrends = await this.getMonthlyCompletionTrends(enrollments);

      return analytics;
    } catch (error) {
      console.error("Error generating course completion analytics:", error);
      throw error;
    }
  }

  // Get monthly completion trends
  static async getMonthlyCompletionTrends(enrollments: any[]): Promise<any[]> {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEnrollments = enrollments.filter(e => {
        const enrollDate = new Date(e.enrolledAt);
        return enrollDate >= monthStart && enrollDate <= monthEnd;
      });

      const monthCompletions = enrollments.filter(e => {
        if (!e.completedAt) return false;
        const completeDate = new Date(e.completedAt);
        return completeDate >= monthStart && completeDate <= monthEnd;
      });

      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        enrollments: monthEnrollments.length,
        completions: monthCompletions.length,
        completionRate: monthEnrollments.length > 0 
          ? Math.round((monthCompletions.length / monthEnrollments.length) * 100)
          : 0
      });
    }

    return months;
  }
}

// Routes for advanced analytics
export function registerAdvancedAnalyticsRoutes(app: Express): void {
  
  // Get comprehensive quiz analytics
  app.get('/api/analytics/quizzes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { courseId, timeRange = '30' } = req.query;
      const mentorId = req.user.role === UserRole.MENTOR ? req.user.id : undefined;
      
      const analytics = await AdvancedAnalyticsService.getQuizAnalytics(
        courseId ? parseInt(courseId) : undefined,
        mentorId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      res.status(500).json({ message: 'Failed to fetch quiz analytics' });
    }
  });

  // Get course completion analytics
  app.get('/api/analytics/course-completion', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { courseId, timeRange = '180' } = req.query;
      const mentorId = req.user.role === UserRole.MENTOR ? req.user.id : undefined;
      
      const analytics = await AdvancedAnalyticsService.getCourseCompletionAnalytics(
        courseId ? parseInt(courseId) : undefined,
        mentorId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching course completion analytics:', error);
      res.status(500).json({ message: 'Failed to fetch course completion analytics' });
    }
  });

  // Get student performance insights
  app.get('/api/analytics/student-performance', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { courseId, studentId, metric = 'overall' } = req.query;
      const mentorId = req.user.role === UserRole.MENTOR ? req.user.id : undefined;
      
      // Get detailed student performance data
      const performance = await storage.getStudentPerformanceAnalytics({
        courseId: courseId ? parseInt(courseId) : undefined,
        studentId: studentId ? parseInt(studentId) : undefined,
        mentorId,
        metric
      });
      
      res.json(performance);
    } catch (error) {
      console.error('Error fetching student performance analytics:', error);
      res.status(500).json({ message: 'Failed to fetch student performance analytics' });
    }
  });

  // Get learning outcomes analytics
  app.get('/api/analytics/learning-outcomes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { courseId, timeRange = '90' } = req.query;
      const mentorId = req.user.role === UserRole.MENTOR ? req.user.id : undefined;
      
      // Calculate learning outcomes and goal achievement
      const outcomes = await storage.getLearningOutcomesAnalytics({
        courseId: courseId ? parseInt(courseId) : undefined,
        mentorId,
        timeRange: parseInt(timeRange as string)
      });
      
      res.json(outcomes);
    } catch (error) {
      console.error('Error fetching learning outcomes analytics:', error);
      res.status(500).json({ message: 'Failed to fetch learning outcomes analytics' });
    }
  });

  // Export analytics data
  app.post('/api/analytics/export', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const { type, format, filters } = req.body;
      
      // Generate export based on type (quiz, completion, performance)
      const exportData = await storage.generateAnalyticsExport({
        type,
        format, // csv, xlsx, pdf
        filters,
        userId: req.user.id,
        userRole: req.user.role
      });
      
      res.setHeader('Content-Type', `application/${format}`);
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${Date.now()}.${format}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ message: 'Failed to export analytics data' });
    }
  });

  // Get real-time analytics dashboard data
  app.get('/api/analytics/dashboard', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const mentorId = req.user.role === UserRole.MENTOR ? req.user.id : undefined;
      
      // Get comprehensive dashboard data
      const [quizAnalytics, completionAnalytics] = await Promise.all([
        AdvancedAnalyticsService.getQuizAnalytics(undefined, mentorId),
        AdvancedAnalyticsService.getCourseCompletionAnalytics(undefined, mentorId)
      ]);
      
      const dashboardData = {
        quizAnalytics: {
          totalAttempts: quizAnalytics.overview.totalAttempts,
          averageScore: quizAnalytics.overview.averageScore,
          passRate: quizAnalytics.overview.passRate,
          weeklyProgress: quizAnalytics.trendsAndInsights.weeklyProgress
        },
        completionAnalytics: {
          totalEnrollments: completionAnalytics.overview.totalEnrollments,
          completionRate: completionAnalytics.overview.overallCompletionRate,
          averageCompletionTime: completionAnalytics.overview.averageCompletionTime,
          monthlyTrends: completionAnalytics.monthlyTrends
        },
        alerts: await storage.getAnalyticsAlerts(mentorId),
        insights: await storage.getAnalyticsInsights(mentorId)
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
    }
  });
}
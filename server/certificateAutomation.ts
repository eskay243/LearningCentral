import { storage } from "./storage";
import { type Express } from "express";
import { isAuthenticated, hasRole } from "./auth";
import { UserRole } from "@shared/schema";
import { sendCertificateEmail } from "./emailService";

// Automated certificate generation service
export class CertificateAutomationService {
  
  // Check and generate certificates for completed courses
  static async checkAndGenerateCertificates(): Promise<void> {
    try {
      console.log("[CERT-AUTO] Starting automated certificate generation check...");
      
      // Get all enrollments that are completed but don't have certificates
      const completedEnrollments = await storage.getCompletedEnrollmentsWithoutCertificates();
      
      console.log(`[CERT-AUTO] Found ${completedEnrollments.length} completed enrollments without certificates`);
      
      for (const enrollment of completedEnrollments) {
        try {
          await this.generateCertificateForEnrollment(enrollment);
        } catch (error) {
          console.error(`[CERT-AUTO] Failed to generate certificate for enrollment ${enrollment.id}:`, error);
        }
      }
      
      console.log("[CERT-AUTO] Automated certificate generation check completed");
    } catch (error) {
      console.error("[CERT-AUTO] Error in automated certificate generation:", error);
    }
  }

  // Generate certificate for a specific enrollment
  static async generateCertificateForEnrollment(enrollment: any): Promise<void> {
    try {
      console.log(`[CERT-AUTO] Generating certificate for enrollment ${enrollment.id}`);
      
      // Get course and student details
      const course = await storage.getCourse(enrollment.courseId);
      const student = await storage.getUser(enrollment.userId);
      
      if (!course || !student) {
        console.error(`[CERT-AUTO] Missing course or student data for enrollment ${enrollment.id}`);
        return;
      }

      // Generate unique certificate ID
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate final score (average of all completed assessments)
      const finalScore = await this.calculateFinalScore(enrollment.userId, enrollment.courseId);
      
      // Create certificate record
      const certificateData = {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        certificateId,
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email,
        courseName: course.title,
        completionDate: enrollment.completedAt || new Date(),
        issueDate: new Date(),
        finalScore,
        issuedBy: 'System',
        templateId: await this.getDefaultTemplateId(enrollment.courseId),
        status: 'issued',
        downloadUrl: `/api/certificates/${certificateId}/download`,
      };

      // Save certificate to database
      const certificate = await storage.createCertificate(certificateData);
      
      // Update enrollment with certificate info
      await storage.updateEnrollment(enrollment.id, {
        certificateGenerated: true,
        certificateId,
        certificateIssuedAt: new Date(),
        finalScore
      });

      // Generate certificate PDF and send via email
      try {
        // Generate certificate PDF buffer (placeholder for now)
        const certificateBuffer = Buffer.from(`Certificate for ${certificateData.studentName} - ${course.title}`);
        
        // Send certificate email to student
        if (student.email) {
          await sendCertificateEmail(
            student.email,
            certificateData.studentName,
            course.title,
            certificateBuffer
          );
          console.log(`[EMAIL] Certificate email sent to ${student.email}`);
        }
      } catch (error) {
        console.error('[EMAIL] Failed to send certificate email:', error);
      }

      // Send notification to student
      await storage.createNotification({
        userId: enrollment.userId,
        title: 'Certificate Issued!',
        message: `Congratulations! Your certificate for "${course.title}" has been generated and is ready for download.`,
        type: 'certificate',
        priority: 'high',
        metadata: {
          certificateId,
          courseId: enrollment.courseId,
          courseName: course.title
        }
      });

      // Notify mentor of student completion and certificate generation
      if (course.mentorId) {
        await storage.createNotification({
          userId: course.mentorId,
          title: 'Student Certificate Generated',
          message: `${certificateData.studentName} has completed "${course.title}" and received their certificate.`,
          type: 'achievement',
          priority: 'medium',
          metadata: {
            studentId: enrollment.userId,
            studentName: certificateData.studentName,
            courseId: enrollment.courseId,
            courseName: course.title,
            certificateId
          }
        });
      }

      console.log(`[CERT-AUTO] Certificate ${certificateId} generated successfully for enrollment ${enrollment.id}`);
      
    } catch (error) {
      console.error(`[CERT-AUTO] Error generating certificate for enrollment ${enrollment.id}:`, error);
    }
  }

  // Calculate final score for a student in a course
  static async calculateFinalScore(userId: number, courseId: number): Promise<number> {
    try {
      // Get all quiz attempts for this user and course
      const quizAttempts = await storage.getQuizAttemptsByUserAndCourse(userId, courseId);
      
      if (quizAttempts.length === 0) {
        return 100; // If no quizzes, assume full completion
      }

      // Calculate average score from all quiz attempts
      const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
      const averageScore = totalScore / quizAttempts.length;
      
      return Math.round(averageScore);
    } catch (error) {
      console.error("Error calculating final score:", error);
      return 85; // Default score
    }
  }

  // Get default certificate template for a course
  static async getDefaultTemplateId(courseId: number): Promise<number | null> {
    try {
      // Try to get course-specific template first
      const courseTemplate = await storage.getCertificateTemplateForCourse(courseId);
      if (courseTemplate) {
        return courseTemplate.id;
      }

      // Fall back to default template
      const defaultTemplate = await storage.getDefaultCertificateTemplate();
      return defaultTemplate?.id || null;
    } catch (error) {
      console.error("Error getting certificate template:", error);
      return null;
    }
  }

  // Check if student has completed all course requirements
  static async checkCourseCompletion(userId: number, courseId: number): Promise<boolean> {
    try {
      // Get all modules and lessons for the course
      const modules = await storage.getModulesByCourse(courseId);
      
      if (modules.length === 0) {
        return false;
      }

      let totalLessons = 0;
      let completedLessons = 0;

      for (const module of modules) {
        const lessons = module.lessons || await storage.getLessonsByModule(module.id);
        totalLessons += lessons.length;

        for (const lesson of lessons) {
          const progress = await storage.getLessonProgress(lesson.id, userId);
          if (progress && progress.status === 'completed') {
            completedLessons++;
          }
        }
      }

      // Course is completed if all lessons are completed
      const isCompleted = totalLessons > 0 && completedLessons === totalLessons;
      
      console.log(`[CERT-AUTO] Course completion check - User ${userId}, Course ${courseId}: ${completedLessons}/${totalLessons} lessons completed`);
      
      return isCompleted;
    } catch (error) {
      console.error("Error checking course completion:", error);
      return false;
    }
  }

  // Trigger certificate generation when lesson is completed
  static async onLessonCompleted(userId: number, lessonId: number): Promise<void> {
    try {
      // Get lesson and course info
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) return;

      const module = await storage.getModule(lesson.moduleId);
      if (!module) return;

      const courseId = module.courseId;

      // Check if entire course is now completed
      const isCompleted = await this.checkCourseCompletion(userId, courseId);
      
      if (isCompleted) {
        console.log(`[CERT-AUTO] Course ${courseId} completed by user ${userId}, triggering certificate generation`);
        
        // Update enrollment status to completed
        const enrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
        if (enrollment && !enrollment.completedAt) {
          await storage.updateEnrollment(enrollment.id, {
            completedAt: new Date(),
            progress: 100,
            status: 'completed'
          });

          // Generate certificate
          await this.generateCertificateForEnrollment({
            ...enrollment,
            completedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error in onLessonCompleted:", error);
    }
  }
}

// Routes for certificate automation management
export function registerCertificateAutomationRoutes(app: Express): void {
  
  // Trigger manual certificate generation for completed courses
  app.post('/api/certificates/auto-generate', isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      await CertificateAutomationService.checkAndGenerateCertificates();
      res.json({
        success: true,
        message: 'Automated certificate generation completed'
      });
    } catch (error) {
      console.error('Error in manual certificate generation:', error);
      res.status(500).json({ message: 'Failed to generate certificates' });
    }
  });

  // Get certificate automation statistics
  app.get('/api/certificates/automation-stats', isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const stats = await storage.getCertificateAutomationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching automation stats:', error);
      res.status(500).json({ message: 'Failed to fetch automation statistics' });
    }
  });

  // Configure certificate automation settings
  app.post('/api/certificates/automation-settings', isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const { enabled, autoGenerateOnCompletion, minPassingScore } = req.body;
      
      const settings = {
        enabled: enabled !== undefined ? enabled : true,
        autoGenerateOnCompletion: autoGenerateOnCompletion !== undefined ? autoGenerateOnCompletion : true,
        minPassingScore: minPassingScore || 70
      };

      await storage.updateSystemSetting('certificate_automation', JSON.stringify(settings));
      
      res.json({
        success: true,
        settings,
        message: 'Certificate automation settings updated'
      });
    } catch (error) {
      console.error('Error updating automation settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // Get certificate automation settings
  app.get('/api/certificates/automation-settings', isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const settingsValue = await storage.getSystemSetting('certificate_automation');
      const settings = settingsValue ? JSON.parse(settingsValue) : {
        enabled: true,
        autoGenerateOnCompletion: true,
        minPassingScore: 70
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching automation settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });
}

// Initialize certificate automation (call this in server startup)
export function initializeCertificateAutomation(): void {
  // Run certificate check every 30 minutes
  setInterval(async () => {
    const settings = await storage.getSystemSetting('certificate_automation');
    const config = settings ? JSON.parse(settings) : { enabled: true };
    
    if (config.enabled) {
      await CertificateAutomationService.checkAndGenerateCertificates();
    }
  }, 30 * 60 * 1000); // 30 minutes

  console.log("[CERT-AUTO] Certificate automation service initialized");
}
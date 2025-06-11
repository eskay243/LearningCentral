import type { Express } from "express";
import { storage } from "./storage";
import { assessmentGradingService } from "./assessmentGradingService";
import { insertAutomatedQuizSchema, insertQuizQuestionSchema, insertQuizAttemptSchema, insertQuizAnswerSchema, insertAssignmentRubricSchema, insertRubricCriteriaSchema, insertAssignmentGradeSchema, insertPeerReviewSchema, insertStudentProgressSchema, insertLearningAnalyticsSchema, insertCertificateTemplateSchema, insertGeneratedCertificateSchema } from "@shared/schema";
import { z } from "zod";

export function registerAssessmentRoutes(app: Express) {
  // Automated Quiz Management
  app.post("/api/quizzes", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const validatedData = insertAutomatedQuizSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const quiz = await storage.createAutomatedQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/quizzes", async (req, res) => {
    try {
      const { courseId } = req.query;
      const quizzes = courseId 
        ? await storage.getAutomatedQuizzesByCourse(Number(courseId))
        : await storage.getAllAutomatedQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getAutomatedQuiz(Number(req.params.id));
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      
      const questions = await storage.getQuizQuestions(quiz.id);
      res.json({ ...quiz, questions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const quiz = await storage.updateAutomatedQuiz(Number(req.params.id), req.body);
      res.json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      await storage.deleteAutomatedQuiz(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quiz Questions Management
  app.post("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const validatedData = insertQuizQuestionSchema.parse({
        ...req.body,
        quizId: Number(req.params.quizId)
      });
      
      const question = await storage.createQuizQuestion(validatedData);
      
      // Update quiz total questions count
      const questions = await storage.getQuizQuestions(Number(req.params.quizId));
      await storage.updateAutomatedQuiz(Number(req.params.quizId), { 
        totalQuestions: questions.length 
      });
      
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const question = await storage.updateQuizQuestion(Number(req.params.id), req.body);
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      await storage.deleteQuizQuestion(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quiz Taking and Grading
  app.post("/api/quizzes/:id/attempts", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const quiz = await storage.getAutomatedQuiz(Number(req.params.id));
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      
      // Check if quiz is available
      const now = new Date();
      if (quiz.availableFrom && now < quiz.availableFrom) {
        return res.status(400).json({ message: "Quiz not yet available" });
      }
      if (quiz.availableUntil && now > quiz.availableUntil) {
        return res.status(400).json({ message: "Quiz deadline has passed" });
      }
      
      // Check attempt limits
      const existingAttempts = await storage.getUserQuizAttempts(req.user.id, Number(req.params.id));
      if (existingAttempts.length >= quiz.maxAttempts) {
        return res.status(400).json({ message: "Maximum attempts reached" });
      }
      
      const attempt = await storage.createQuizAttempt({
        quizId: Number(req.params.id),
        userId: req.user.id,
        attemptNumber: existingAttempts.length + 1,
        status: "in_progress",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || ""
      });
      
      res.status(201).json(attempt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attempts/:attemptId/answers", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const { questionId, answer } = req.body;
      
      const answerRecord = await storage.createQuizAnswer({
        attemptId: Number(req.params.attemptId),
        questionId,
        answer,
        answeredAt: new Date()
      });
      
      res.status(201).json(answerRecord);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attempts/:attemptId/submit", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const attempt = await storage.getQuizAttempt(Number(req.params.attemptId));
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      
      if (attempt.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update attempt status
      const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
      await storage.updateQuizAttempt(Number(req.params.attemptId), {
        submittedAt: new Date(),
        status: "submitted",
        timeSpent
      });
      
      // Auto-grade the quiz
      const gradingResult = await assessmentGradingService.gradeQuizAttempt(Number(req.params.attemptId));
      
      res.json({
        attemptId: Number(req.params.attemptId),
        ...gradingResult
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/attempts/:attemptId/results", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const attempt = await storage.getQuizAttempt(Number(req.params.attemptId));
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      
      if (attempt.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const answers = await storage.getQuizAnswers(Number(req.params.attemptId));
      const questions = await storage.getQuizQuestions(attempt.quizId);
      
      const results = {
        attempt,
        questions: questions.map(q => {
          const answer = answers.find(a => a.questionId === q.id);
          return {
            ...q,
            studentAnswer: answer?.answer,
            pointsEarned: answer?.pointsEarned,
            isCorrect: answer?.isCorrect,
            feedback: answer?.feedback
          };
        })
      };
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Assignment Rubrics
  app.post("/api/rubrics", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const validatedData = insertAssignmentRubricSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const rubric = await storage.createAssignmentRubric(validatedData);
      res.status(201).json(rubric);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/rubrics", async (req, res) => {
    try {
      const { assignmentId, courseId } = req.query;
      let rubrics;
      
      if (assignmentId) {
        rubrics = await storage.getRubricsByAssignment(Number(assignmentId));
      } else if (courseId) {
        rubrics = await storage.getRubricsByCourse(Number(courseId));
      } else {
        rubrics = await storage.getAllRubrics();
      }
      
      res.json(rubrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rubrics/:id", async (req, res) => {
    try {
      const rubric = await storage.getAssignmentRubric(Number(req.params.id));
      if (!rubric) return res.status(404).json({ message: "Rubric not found" });
      
      const criteria = await storage.getRubricCriteria(rubric.id);
      res.json({ ...rubric, criteria });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rubrics/:rubricId/criteria", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const validatedData = insertRubricCriteriaSchema.parse({
        ...req.body,
        rubricId: Number(req.params.rubricId)
      });
      
      const criteria = await storage.createRubricCriteria(validatedData);
      res.status(201).json(criteria);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Assignment Grading
  app.post("/api/assignments/:assignmentId/grades", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const { studentId, rubricId, criteriaScores, overallFeedback } = req.body;
      
      const grade = await assessmentGradingService.gradeAssignmentWithRubric(
        Number(req.params.assignmentId),
        studentId,
        rubricId,
        criteriaScores,
        req.user.id,
        overallFeedback
      );
      
      res.status(201).json(grade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/assignments/:assignmentId/grades", async (req, res) => {
    try {
      const grades = await storage.getAssignmentGrades(Number(req.params.assignmentId));
      res.json(grades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Peer Review Management
  app.post("/api/assignments/:assignmentId/peer-reviews/assign", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const { rubricId } = req.body;
      await assessmentGradingService.assignPeerReviewers(Number(req.params.assignmentId), rubricId);
      
      res.json({ message: "Peer reviewers assigned successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/peer-reviews/assigned", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const reviews = await storage.getAssignedPeerReviews(req.user.id);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/peer-reviews/:reviewId/submit", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const { overallRating, overallFeedback, criteriaScores } = req.body;
      
      // Update peer review
      await storage.updatePeerReview(Number(req.params.reviewId), {
        overallRating,
        overallFeedback,
        status: "completed",
        submittedAt: new Date()
      });
      
      // If criteria scores provided, create grade entry
      if (criteriaScores && criteriaScores.length > 0) {
        const review = await storage.getPeerReview(Number(req.params.reviewId));
        if (review) {
          await assessmentGradingService.gradeAssignmentWithRubric(
            review.assignmentId,
            review.revieweeId,
            review.gradeId || 0, // This would need proper rubric ID handling
            criteriaScores,
            req.user.id,
            overallFeedback
          );
        }
      }
      
      res.json({ message: "Peer review submitted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Progress Tracking and Analytics
  app.get("/api/students/:studentId/progress", async (req, res) => {
    try {
      const { courseId } = req.query;
      
      if (courseId) {
        const progress = await storage.getStudentProgress(req.params.studentId, Number(courseId));
        const analytics = await storage.getLearningAnalytics(req.params.studentId, Number(courseId));
        
        res.json({
          progress,
          analytics
        });
      } else {
        const allProgress = await storage.getAllStudentProgress(req.params.studentId);
        res.json(allProgress);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:courseId/progress-report", async (req, res) => {
    try {
      const report = await assessmentGradingService.generateProgressReport(Number(req.params.courseId));
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Assessment Dashboard API endpoints
  app.get("/api/assessments/quizzes", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { courseId } = req.query;
      const quizzes = courseId 
        ? await storage.getAutomatedQuizzesByCourse(Number(courseId))
        : await storage.getAllAutomatedQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assessments/assignments", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { courseId } = req.query;
      const assignments = courseId 
        ? await storage.getAssignmentsByCourse(Number(courseId))
        : await storage.getAllAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assessments/rubrics", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { courseId } = req.query;
      const rubrics = courseId 
        ? await storage.getRubricsByCourse(Number(courseId))
        : await storage.getAllRubrics();
      res.json(rubrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assessments/analytics", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { courseId, studentId } = req.query;
      
      if (studentId && courseId) {
        const analytics = await storage.getLearningAnalytics(studentId as string, Number(courseId));
        res.json(analytics);
      } else {
        const allAnalytics = await storage.getAllLearningAnalytics();
        res.json(allAnalytics);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Certificate Management
  app.post("/api/certificate-templates", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const validatedData = insertCertificateTemplateSchema.parse(req.body);
      const template = await storage.createCertificateTemplate(validatedData);
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/certificate-templates", async (req, res) => {
    try {
      const { courseId } = req.query;
      const templates = courseId 
        ? await storage.getCertificateTemplatesByCourse(Number(courseId))
        : await storage.getAllCertificateTemplates();
      
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/certificates/generate", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const { userId, courseId, templateId } = req.body;
      
      const certificate = await assessmentGradingService.generateCertificate(
        userId,
        courseId,
        templateId
      );
      
      res.status(201).json(certificate);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/certificates", async (req, res) => {
    try {
      const { userId, courseId } = req.query;
      
      let certificates;
      if (userId && courseId) {
        certificates = await storage.getUserCourseCertificates(userId as string, Number(courseId));
      } else if (userId) {
        certificates = await storage.getUserCertificates(userId as string);
      } else {
        certificates = await storage.getAllCertificates();
      }
      
      res.json(certificates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/certificates/verify/:verificationCode", async (req, res) => {
    try {
      const certificate = await storage.getCertificateByVerificationCode(req.params.verificationCode);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      if (certificate.status !== "active") {
        return res.status(400).json({ message: "Certificate is not active" });
      }
      
      // Check expiry
      if (certificate.expiryDate && new Date() > certificate.expiryDate) {
        return res.status(400).json({ message: "Certificate has expired" });
      }
      
      res.json({
        valid: true,
        certificate: {
          certificateNumber: certificate.certificateNumber,
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          completionDate: certificate.completionDate,
          issueDate: certificate.issueDate,
          finalGrade: certificate.finalGrade
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics Dashboard Data
  app.get("/api/analytics/assessment-overview", async (req, res) => {
    try {
      const { courseId, timeRange } = req.query;
      
      // This would implement comprehensive analytics
      const analytics = {
        totalQuizzes: await storage.countQuizzesByCourse(Number(courseId)),
        totalAttempts: await storage.countQuizAttemptsByCourse(Number(courseId)),
        averageScore: await storage.getAverageQuizScoreByCourse(Number(courseId)),
        completionRate: await storage.getQuizCompletionRate(Number(courseId)),
        topPerformers: await storage.getTopPerformers(Number(courseId)),
        strugglingStudents: await storage.getStrugglingStudents(Number(courseId))
      };
      
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
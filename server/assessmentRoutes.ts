import { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./replitAuth";
import { UserRole } from "@shared/schema";

export function registerAssessmentRoutes(app: Express) {
  // Quiz Routes
  app.get('/api/quizzes', async (req, res) => {
    try {
      const { courseId, moduleId, lessonId } = req.query;
      const quizzes = await storage.getQuizzes({
        courseId: courseId ? Number(courseId) : undefined,
        moduleId: moduleId ? Number(moduleId) : undefined,
        lessonId: lessonId ? Number(lessonId) : undefined
      });
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });
  
  app.get('/api/quizzes/:id', async (req, res) => {
    try {
      const quiz = await storage.getQuiz(Number(req.params.id));
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });
  
  app.post('/api/quizzes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const quizData = req.body;
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });
  
  app.put('/api/quizzes/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const quizId = Number(req.params.id);
      const quizData = req.body;
      const quiz = await storage.updateQuiz(quizId, quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });
  
  app.get('/api/quizzes/:id/questions', async (req, res) => {
    try {
      const quizId = Number(req.params.id);
      const questions = await storage.getQuizQuestions(quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });
  
  app.post('/api/quiz-questions', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionData = req.body;
      const question = await storage.addQuizQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error adding quiz question:", error);
      res.status(500).json({ message: "Failed to add quiz question" });
    }
  });
  
  app.put('/api/quiz-questions/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      const questionData = req.body;
      const question = await storage.updateQuizQuestion(questionId, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating quiz question:", error);
      res.status(500).json({ message: "Failed to update quiz question" });
    }
  });
  
  app.delete('/api/quiz-questions/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      await storage.deleteQuizQuestion(questionId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      res.status(500).json({ message: "Failed to delete quiz question" });
    }
  });
  
  // Start a new quiz attempt
  app.post('/api/quiz-attempts/start', isAuthenticated, async (req: any, res) => {
    try {
      const { quizId } = req.body;
      const userId = req.user.claims.sub;
      
      // Check if user has already started an attempt for this quiz
      const existingAttempt = await storage.getActiveQuizAttempt(userId, quizId);
      if (existingAttempt) {
        return res.json(existingAttempt);
      }
      
      // Create new attempt
      const attempt = await storage.startQuizAttempt(userId, quizId);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error starting quiz attempt:", error);
      res.status(500).json({ message: "Failed to start quiz attempt" });
    }
  });

  // Save individual answer during quiz attempt
  app.post('/api/quiz-attempts/save-answer', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId, questionId, answer } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify the attempt belongs to the user
      const attempt = await storage.getQuizAttemptById(attemptId);
      if (!attempt || attempt.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to quiz attempt" });
      }
      
      await storage.saveQuizAnswer(attemptId, questionId, answer);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving quiz answer:", error);
      res.status(500).json({ message: "Failed to save answer" });
    }
  });

  // Submit complete quiz attempt
  app.post('/api/quiz-attempts/submit', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId, answers } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify the attempt belongs to the user
      const attempt = await storage.getQuizAttemptById(attemptId);
      if (!attempt || attempt.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to quiz attempt" });
      }
      
      const result = await storage.submitQuizAttempt(attemptId, answers);
      res.json(result);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Get quiz attempt results
  app.get('/api/quiz-attempts/:attemptId/results', isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = Number(req.params.attemptId);
      const userId = req.user.claims.sub;
      
      // Get the attempt and verify ownership
      const attempt = await storage.getQuizAttemptById(attemptId);
      if (!attempt || attempt.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to quiz results" });
      }
      
      // Get quiz details
      const quiz = await storage.getQuiz(attempt.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Get questions for detailed results
      const questions = await storage.getQuizQuestions(attempt.quizId);
      
      // Build detailed results with question text and explanations
      const gradedAnswers = attempt.answers.map((answer: any) => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          ...answer,
          questionText: question?.question || 'Question not found',
          correctAnswer: question?.correctAnswer || '',
          explanation: question?.explanation || ''
        };
      });
      
      const result = {
        ...attempt,
        quiz,
        gradedAnswers
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  // Get assignment for submission
  app.get('/api/assignments/:assignmentId', isAuthenticated, async (req, res) => {
    try {
      const assignmentId = Number(req.params.assignmentId);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  // Get user's existing submission for an assignment
  app.get('/api/assignments/:assignmentId/my-submission', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = Number(req.params.assignmentId);
      const userId = req.user.claims.sub;
      
      const submission = await storage.getUserAssignmentSubmission(userId, assignmentId);
      
      if (!submission) {
        return res.status(404).json({ message: "No submission found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Error fetching user submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  // Submit assignment (with file upload)
  app.post('/api/assignment-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const { assignmentId, submissionText, status } = req.body;
      const userId = req.user.claims.sub;
      
      // Handle file uploads if present
      const files = req.files || [];
      
      const submissionData = {
        assignmentId: Number(assignmentId),
        userId,
        submissionText: submissionText || '',
        submissionFiles: files.map((file: any) => ({
          name: file.originalname,
          size: file.size,
          path: file.path,
          mimetype: file.mimetype
        })),
        status: status || 'submitted',
        submittedAt: new Date()
      };
      
      const submission = await storage.createAssignmentSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });

  // Save assignment draft
  app.post('/api/assignment-submissions/draft', isAuthenticated, async (req: any, res) => {
    try {
      const { assignmentId, submissionText } = req.body;
      const userId = req.user.claims.sub;
      
      // Handle file uploads if present
      const files = req.files || [];
      
      const submissionData = {
        assignmentId: Number(assignmentId),
        userId,
        submissionText: submissionText || '',
        submissionFiles: files.map((file: any) => ({
          name: file.originalname,
          size: file.size,
          path: file.path,
          mimetype: file.mimetype
        })),
        status: 'draft',
        submittedAt: null
      };
      
      // Check if draft already exists
      const existingSubmission = await storage.getUserAssignmentSubmission(userId, Number(assignmentId));
      
      let submission;
      if (existingSubmission && existingSubmission.status === 'draft') {
        submission = await storage.updateAssignmentSubmission(existingSubmission.id, submissionData);
      } else {
        submission = await storage.createAssignmentSubmission(submissionData);
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Error saving assignment draft:", error);
      res.status(500).json({ message: "Failed to save draft" });
    }
  });
  
  app.get('/api/quizzes/:id/attempts', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const quizId = Number(req.params.id);
      const attempts = await storage.getQuizAttempts(quizId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });
  
  app.get('/api/users/:userId/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow users to view their own attempts, or mentors/admins to view any
      const currentUserId = req.user.claims.sub;
      const userToView = req.params.userId;
      const userRole = req.user.claims.role;
      
      if (userToView !== currentUserId && 
          userRole !== UserRole.ADMIN && 
          userRole !== UserRole.MENTOR) {
        return res.status(403).json({ message: "You can only view your own quiz attempts" });
      }
      
      const quizId = req.query.quizId ? Number(req.query.quizId) : undefined;
      const attempts = await storage.getUserQuizAttempts(userToView, quizId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching user quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch user quiz attempts" });
    }
  });
  
  app.get('/api/mentors/:mentorId/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      // Check if the user is the mentor in question or an admin
      const currentUserId = req.user.claims.sub;
      const mentorId = req.params.mentorId;
      const userRole = req.user.claims.role;
      
      if (mentorId !== currentUserId && userRole !== UserRole.ADMIN) {
        return res.status(403).json({ message: "You can only view your own quizzes" });
      }
      
      const quizzes = await storage.getQuizzesByMentor(mentorId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching mentor quizzes:", error);
      res.status(500).json({ message: "Failed to fetch mentor quizzes" });
    }
  });
  
  // Assignment Routes
  app.get('/api/assignments', async (req, res) => {
    try {
      const { courseId, moduleId, lessonId } = req.query;
      const assignments = await storage.getAssignments({
        courseId: courseId ? Number(courseId) : undefined,
        moduleId: moduleId ? Number(moduleId) : undefined,
        lessonId: lessonId ? Number(lessonId) : undefined
      });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  
  app.get('/api/assignments/:id', async (req, res) => {
    try {
      const assignment = await storage.getAssignment(Number(req.params.id));
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });
  
  app.post('/api/assignments', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assignmentData = req.body;
      
      // Convert dueDate string to Date object if provided
      if (assignmentData.dueDate && typeof assignmentData.dueDate === 'string') {
        assignmentData.dueDate = new Date(assignmentData.dueDate);
      }
      
      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });
  
  app.put('/api/assignments/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      const assignmentData = req.body;
      const assignment = await storage.updateAssignment(assignmentId, assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete('/api/assignments/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      await storage.deleteAssignment(assignmentId);
      res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });
  
  app.post('/api/assignment-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const submissionData = {
        ...req.body,
        userId: req.user.claims.sub
      };
      const submission = await storage.submitAssignment(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });
  
  app.get('/api/assignments/:id/submissions', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      const submissions = await storage.getAssignmentSubmissions(assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      res.status(500).json({ message: "Failed to fetch assignment submissions" });
    }
  });
  
  app.get('/api/assignment-submissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const submissionId = Number(req.params.id);
      const submission = await storage.getAssignmentSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Only allow the submitter, mentors, or admins to view the submission
      const currentUserId = req.user.claims.sub;
      const userRole = req.user.claims.role;
      
      if (submission.userId !== currentUserId && 
          userRole !== UserRole.ADMIN && 
          userRole !== UserRole.MENTOR) {
        return res.status(403).json({ message: "You don't have permission to view this submission" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Error fetching assignment submission:", error);
      res.status(500).json({ message: "Failed to fetch assignment submission" });
    }
  });
  
  app.post('/api/assignment-submissions/:id/grade', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const submissionId = Number(req.params.id);
      const { grade, feedback } = req.body;
      const gradedBy = req.user.claims.sub;
      
      const submission = await storage.gradeAssignment(submissionId, grade, feedback, gradedBy);
      res.json(submission);
    } catch (error) {
      console.error("Error grading assignment:", error);
      res.status(500).json({ message: "Failed to grade assignment" });
    }
  });
  
  app.get('/api/users/:userId/assignment-submissions', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow users to view their own submissions, or mentors/admins to view any
      const currentUserId = req.user.claims.sub;
      const userToView = req.params.userId;
      const userRole = req.user.claims.role;
      
      if (userToView !== currentUserId && 
          userRole !== UserRole.ADMIN && 
          userRole !== UserRole.MENTOR) {
        return res.status(403).json({ message: "You can only view your own assignment submissions" });
      }
      
      const assignmentId = req.query.assignmentId ? Number(req.query.assignmentId) : undefined;
      const submissions = await storage.getUserAssignmentSubmissions(userToView, assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching user assignment submissions:", error);
      res.status(500).json({ message: "Failed to fetch user assignment submissions" });
    }
  });
  
  app.get('/api/mentors/:mentorId/assignments', isAuthenticated, async (req: any, res) => {
    try {
      // Check if the user is the mentor in question or an admin
      const currentUserId = req.user.claims.sub;
      const mentorId = req.params.mentorId;
      const userRole = req.user.claims.role;
      
      if (mentorId !== currentUserId && userRole !== UserRole.ADMIN) {
        return res.status(403).json({ message: "You can only view your own assignments" });
      }
      
      const assignments = await storage.getAssignmentsByMentor(mentorId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching mentor assignments:", error);
      res.status(500).json({ message: "Failed to fetch mentor assignments" });
    }
  });

  // Advanced Assessment Routes
  app.get('/api/assessments', async (req, res) => {
    try {
      const { courseId, type, difficulty } = req.query;
      const assessments = await storage.getAssessments({
        courseId: courseId ? Number(courseId) : undefined,
        type: type as string,
        difficulty: difficulty as string
      });
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', async (req, res) => {
    try {
      const assessment = await storage.getAssessment(Number(req.params.id));
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.post('/api/assessments', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const assessmentData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.put('/api/assessments/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assessmentId = Number(req.params.id);
      const assessmentData = req.body;
      const assessment = await storage.updateAssessment(assessmentId, assessmentData);
      res.json(assessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.get('/api/assessments/:id/questions', async (req, res) => {
    try {
      const assessmentId = Number(req.params.id);
      const questions = await storage.getAssessmentQuestions(assessmentId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching assessment questions:", error);
      res.status(500).json({ message: "Failed to fetch assessment questions" });
    }
  });

  app.post('/api/assessment-questions', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionData = req.body;
      const question = await storage.addAssessmentQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error adding assessment question:", error);
      res.status(500).json({ message: "Failed to add assessment question" });
    }
  });

  app.put('/api/assessment-questions/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      const questionData = req.body;
      const question = await storage.updateAssessmentQuestion(questionId, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating assessment question:", error);
      res.status(500).json({ message: "Failed to update assessment question" });
    }
  });

  app.delete('/api/assessment-questions/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      await storage.deleteAssessmentQuestion(questionId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting assessment question:", error);
      res.status(500).json({ message: "Failed to delete assessment question" });
    }
  });

  app.post('/api/assessment-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const attemptData = {
        ...req.body,
        userId: req.user.claims.sub
      };
      const attempt = await storage.startAssessmentAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error starting assessment attempt:", error);
      res.status(500).json({ message: "Failed to start assessment attempt" });
    }
  });

  app.put('/api/assessment-attempts/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = Number(req.params.id);
      const { answers, submissionData } = req.body;
      const userId = req.user.claims.sub;
      
      const result = await storage.submitAssessmentAttempt(attemptId, answers, submissionData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error submitting assessment attempt:", error);
      res.status(500).json({ message: "Failed to submit assessment attempt" });
    }
  });

  app.get('/api/assessments/:id/attempts', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const assessmentId = Number(req.params.id);
      const attempts = await storage.getAssessmentAttempts(assessmentId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching assessment attempts:", error);
      res.status(500).json({ message: "Failed to fetch assessment attempts" });
    }
  });

  app.get('/api/users/:userId/assessment-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const userToView = req.params.userId;
      const userRole = req.user.claims.role;
      
      if (userToView !== currentUserId && 
          userRole !== UserRole.ADMIN && 
          userRole !== UserRole.MENTOR) {
        return res.status(403).json({ message: "You can only view your own assessment attempts" });
      }
      
      const assessmentId = req.query.assessmentId ? Number(req.query.assessmentId) : undefined;
      const attempts = await storage.getUserAssessmentAttempts(userToView, assessmentId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching user assessment attempts:", error);
      res.status(500).json({ message: "Failed to fetch user assessment attempts" });
    }
  });

  app.post('/api/assessment-attempts/:id/grade', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const attemptId = Number(req.params.id);
      const { scores, feedback, overrideScore } = req.body;
      const gradedBy = req.user.claims.sub;
      
      const result = await storage.gradeAssessmentAttempt(attemptId, scores, feedback, overrideScore, gradedBy);
      res.json(result);
    } catch (error) {
      console.error("Error grading assessment attempt:", error);
      res.status(500).json({ message: "Failed to grade assessment attempt" });
    }
  });

  // Rubric Management Routes
  app.get('/api/rubrics', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const { assessmentId } = req.query;
      const rubrics = await storage.getRubrics(assessmentId ? Number(assessmentId) : undefined);
      res.json(rubrics);
    } catch (error) {
      console.error("Error fetching rubrics:", error);
      res.status(500).json({ message: "Failed to fetch rubrics" });
    }
  });

  app.post('/api/rubrics', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
    try {
      const rubricData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const rubric = await storage.createRubric(rubricData);
      res.status(201).json(rubric);
    } catch (error) {
      console.error("Error creating rubric:", error);
      res.status(500).json({ message: "Failed to create rubric" });
    }
  });

  app.put('/api/rubrics/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const rubricId = Number(req.params.id);
      const rubricData = req.body;
      const rubric = await storage.updateRubric(rubricId, rubricData);
      res.json(rubric);
    } catch (error) {
      console.error("Error updating rubric:", error);
      res.status(500).json({ message: "Failed to update rubric" });
    }
  });

  // Grade Category Management
  app.get('/api/courses/:courseId/grade-categories', async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      const categories = await storage.getGradeCategories(courseId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching grade categories:", error);
      res.status(500).json({ message: "Failed to fetch grade categories" });
    }
  });

  app.post('/api/grade-categories', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createGradeCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating grade category:", error);
      res.status(500).json({ message: "Failed to create grade category" });
    }
  });

  app.put('/api/grade-categories/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const categoryData = req.body;
      const category = await storage.updateGradeCategory(categoryId, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating grade category:", error);
      res.status(500).json({ message: "Failed to update grade category" });
    }
  });

  // Course Grade Overview
  app.get('/api/courses/:courseId/grades', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      const grades = await storage.getCourseGrades(courseId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching course grades:", error);
      res.status(500).json({ message: "Failed to fetch course grades" });
    }
  });

  app.get('/api/users/:userId/grades', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const userToView = req.params.userId;
      const userRole = req.user.claims.role;
      
      if (userToView !== currentUserId && 
          userRole !== UserRole.ADMIN && 
          userRole !== UserRole.MENTOR) {
        return res.status(403).json({ message: "You can only view your own grades" });
      }
      
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      const grades = await storage.getUserGrades(userToView, courseId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching user grades:", error);
      res.status(500).json({ message: "Failed to fetch user grades" });
    }
  });
}
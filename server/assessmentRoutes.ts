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
  
  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const attemptData = {
        ...req.body,
        userId: req.user.claims.sub
      };
      const attempt = await storage.submitQuizAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
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
}
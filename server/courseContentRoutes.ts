import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { isAuthenticated, hasRole } from "./auth";
import { storage } from "./storage";
import { codeExecutionService } from "./codeExecutionService";
import { 
  insertVideoContentSchema,
  insertCodingChallengeSchema,
  insertAdvancedAssignmentSchema,
  insertAdvancedQuizSchema,
  videoContent,
  codingChallenges,
  advancedAssignments,
  advancedQuizzes,
  VideoContent,
  CodingChallenge,
  AdvancedAssignment,
  AdvancedQuiz
} from "@shared/schema";

const router = Router();

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and OGG videos are allowed.'));
    }
  }
});

// Video Upload and Management Routes
router.post('/videos/upload', isAuthenticated, hasRole(['mentor', 'admin']), uploadVideo.single('video'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const metadata = JSON.parse(req.body.metadata);
    const validatedData = insertVideoContentSchema.parse({
      ...metadata,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      format: path.extname(req.file.originalname).substring(1),
      uploadedBy: req.user.id,
      processingStatus: 'pending'
    });

    const video = await storage.createVideoContent(validatedData);

    // Simulate video processing (in production, this would be handled by a background job)
    setTimeout(async () => {
      try {
        await storage.updateVideoContent(video.id, {
          processingStatus: 'ready',
          processingProgress: 100,
          streamingUrl: `/api/videos/${video.id}/stream`,
          thumbnailUrl: `/api/videos/${video.id}/thumbnail`
        });
      } catch (error) {
        console.error('Video processing failed:', error);
        await storage.updateVideoContent(video.id, {
          processingStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 5000);

    res.status(201).json(video);
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      message: 'Video upload failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/videos/:videoId/stream', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const video = await storage.getVideoContent(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check access permissions
    if (video.accessLevel === 'restricted' || (!video.isPublic && video.accessLevel === 'premium')) {
      // Check if user has access to the course
      const hasAccess = await storage.checkUserCourseAccess(req.user.id, video.courseId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!fs.existsSync(video.filePath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(video.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(video.filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(video.filePath).pipe(res);
    }

    // Update view count and watch time
    await storage.updateVideoAnalytics(videoId, req.user.id);
  } catch (error) {
    console.error('Video streaming error:', error);
    res.status(500).json({ message: 'Failed to stream video' });
  }
});

router.get('/courses/:courseId/content', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const content = await storage.getCourseContent(courseId);
    res.json(content);
  } catch (error) {
    console.error('Failed to fetch course content:', error);
    res.status(500).json({ message: 'Failed to fetch course content' });
  }
});

// Coding Exercise Routes
router.post('/coding-exercises', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
  try {
    const validatedData = insertCodingChallengeSchema.parse({
      ...req.body,
      createdBy: req.user.id
    });

    const exercise = await storage.createCodingExercise(validatedData);
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Failed to create coding exercise:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create coding exercise' });
  }
});

router.post('/coding-exercises/:exerciseId/execute', isAuthenticated, async (req: any, res: Response) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId);
    const { code, language } = req.body;

    const exercise = await storage.getCodingExercise(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Execute the code
    let result;
    if (language === 'javascript') {
      result = await codeExecutionService.executeJavaScript(code);
    } else if (language === 'python') {
      result = await codeExecutionService.executePython(code);
    } else {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    // Run tests if available
    let testResults = [];
    if (exercise.testCases && Array.isArray(exercise.testCases)) {
      const tests = exercise.testCases.map((testCase: any) => ({
        test: testCase.input,
        expected: testCase.expectedOutput,
        name: testCase.description || 'Test'
      }));
      testResults = await codeExecutionService.runTests(code, tests, language);
    }

    // Store execution result
    await storage.createCodeExecution({
      challengeId: exerciseId,
      userId: req.user.id,
      sessionId: req.sessionID,
      code,
      language,
      status: result.success ? 'success' : 'error',
      output: result.output,
      errors: result.error,
      executionTime: result.executionTime,
      testResults: testResults,
      score: testResults.length > 0 ? (testResults.filter(t => t.passed).length / testResults.length) * exercise.points : 0
    });

    res.json({
      execution: result,
      tests: testResults,
      passed: testResults.length > 0 ? testResults.every(t => t.passed) : result.success
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ message: 'Code execution failed' });
  }
});

// Assignment Routes
router.post('/assignments', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
  try {
    const validatedData = insertAdvancedAssignmentSchema.parse({
      ...req.body,
      createdBy: req.user.id
    });

    const assignment = await storage.createAdvancedAssignment(validatedData);
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Failed to create assignment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

router.get('/assignments/:assignmentId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const assignment = await storage.getAdvancedAssignment(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Failed to fetch assignment:', error);
    res.status(500).json({ message: 'Failed to fetch assignment' });
  }
});

// Configure multer for assignment file uploads
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

router.post('/assignments/:assignmentId/submit', isAuthenticated, uploadAssignment.array('files', 10), async (req: any, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const { textSubmission, urlSubmission, codeSubmission } = req.body;

    const assignment = await storage.getAdvancedAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if submission is still allowed
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      if (!assignment.lateSubmissionAllowed) {
        return res.status(400).json({ message: 'Assignment deadline has passed' });
      }
    }

    const files = req.files?.map((file: any) => ({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    })) || [];

    const submission = await storage.createAdvancedAssignmentSubmission({
      assignmentId,
      userId: req.user.id,
      textSubmission,
      urlSubmission,
      codeSubmission,
      files: files,
      status: 'submitted'
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
});

// Quiz Routes
router.post('/quizzes', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
  try {
    const validatedData = insertAdvancedQuizSchema.parse({
      ...req.body,
      createdBy: req.user.id
    });

    const quiz = await storage.createAdvancedQuiz(validatedData);
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Failed to create quiz:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create quiz' });
  }
});

router.get('/quizzes/:quizId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const quiz = await storage.getAdvancedQuiz(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Don't send correct answers to students
    if (req.user.role === 'student') {
      quiz.questions = quiz.questions?.map((q: any) => ({
        ...q,
        correctAnswer: undefined,
        correctAnswers: undefined
      }));
    }

    res.json(quiz);
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

router.post('/quizzes/:quizId/attempt', isAuthenticated, async (req: any, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const quiz = await storage.getAdvancedQuiz(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.status(400).json({ message: 'Quiz is not published' });
    }

    // Check if user has remaining attempts
    const existingAttempts = await storage.getUserQuizAttempts(req.user.id, quizId);
    if (existingAttempts.length >= quiz.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts reached' });
    }

    const attempt = await storage.createAdvancedQuizAttempt({
      quizId,
      userId: req.user.id,
      attemptNumber: existingAttempts.length + 1,
      totalQuestions: quiz.questions?.length || 0
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Failed to start quiz attempt:', error);
    res.status(500).json({ message: 'Failed to start quiz attempt' });
  }
});

router.post('/quiz-attempts/:attemptId/submit', isAuthenticated, async (req: any, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId);
    const { answers } = req.body;

    const attempt = await storage.getAdvancedQuizAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    if (attempt.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    const quiz = await storage.getAdvancedQuiz(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Auto-grade the quiz
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];

    for (const answer of answers) {
      const question = quiz.questions?.find((q: any) => q.id === answer.questionId);
      if (!question) continue;

      maxScore += question.points || 1;
      let isCorrect = false;
      let pointsEarned = 0;

      // Auto-grade based on question type
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = answer.selectedOptions?.[0] === question.correctAnswer;
        pointsEarned = isCorrect ? (question.points || 1) : 0;
      } else if (question.type === 'short_answer') {
        // Simple string comparison (could be enhanced with fuzzy matching)
        isCorrect = answer.textAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
        pointsEarned = isCorrect ? (question.points || 1) : 0;
      }

      totalScore += pointsEarned;

      const answerRecord = await storage.createAdvancedQuizAnswer({
        attemptId,
        questionId: question.id,
        textAnswer: answer.textAnswer,
        selectedOptions: answer.selectedOptions,
        codeAnswer: answer.codeAnswer,
        isCorrect,
        pointsEarned,
        autoGraded: question.type !== 'essay'
      });

      gradedAnswers.push(answerRecord);
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= (quiz.passingScore || 70);

    // Update attempt with results
    const updatedAttempt = await storage.updateAdvancedQuizAttempt(attemptId, {
      status: 'submitted',
      submittedAt: new Date(),
      score: totalScore,
      maxScore,
      percentage,
      passed,
      questionsAnswered: answers.length
    });

    res.json({
      attempt: updatedAttempt,
      answers: gradedAnswers,
      passed,
      score: totalScore,
      maxScore,
      percentage
    });
  } catch (error) {
    console.error('Failed to submit quiz:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// Content Analytics Routes
router.get('/courses/:courseId/analytics', isAuthenticated, hasRole(['mentor', 'admin']), async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const analytics = await storage.getCourseContentAnalytics(courseId);
    res.json(analytics);
  } catch (error) {
    console.error('Failed to fetch course analytics:', error);
    res.status(500).json({ message: 'Failed to fetch course analytics' });
  }
});

export { router as courseContentRoutes };
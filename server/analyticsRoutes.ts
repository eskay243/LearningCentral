import { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./replitAuth";
import { UserRole } from "@shared/schema";

/**
 * Register the analytics routes for assessment performance tracking
 */
export function registerAnalyticsRoutes(app: Express) {
  // Get quiz analytics data - aggregated statistics for quizzes
  app.get('/api/analytics/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;
      
      // For mentors/admins viewing student data or their own data
      const isMentorOrAdmin = req.user.claims.role === UserRole.MENTOR || 
                             req.user.claims.role === UserRole.ADMIN;
      
      // Only allow mentors/admins to view other users' data
      if (userId !== req.user.claims.sub && !isMentorOrAdmin) {
        return res.status(403).json({ message: "You don't have permission to view this data" });
      }
      
      // Get quiz attempts for analysis
      const attempts = await storage.getUserQuizAttempts(userId);
      
      // Filter by course if specified
      const filteredAttempts = courseId 
        ? await filterAttemptsByCourse(attempts, courseId) 
        : attempts;
      
      if (!filteredAttempts.length) {
        return res.json({
          attemptCount: 0,
          averageScore: 0,
          passRate: 0,
          scoreDistribution: generateEmptyScoreDistribution(),
          quizzesByDifficulty: [],
          passFailRatio: [
            { name: "Pass", value: 0 },
            { name: "Fail", value: 0 },
          ],
          recentAttempts: []
        });
      }
      
      // Calculate analytics data
      const analytics = await calculateQuizAnalytics(filteredAttempts);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      res.status(500).json({ message: "Failed to fetch quiz analytics" });
    }
  });
  
  // Get assignment analytics data
  app.get('/api/analytics/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;
      
      // For mentors/admins viewing student data or their own data
      const isMentorOrAdmin = req.user.claims.role === UserRole.MENTOR || 
                             req.user.claims.role === UserRole.ADMIN;
      
      // Only allow mentors/admins to view other users' data
      if (userId !== req.user.claims.sub && !isMentorOrAdmin) {
        return res.status(403).json({ message: "You don't have permission to view this data" });
      }
      
      // Get assignment submissions for analysis
      const submissions = await storage.getUserAssignmentSubmissions(userId);
      
      // Filter by course if specified
      const filteredSubmissions = courseId 
        ? await filterSubmissionsByCourse(submissions, courseId) 
        : submissions;
      
      if (!filteredSubmissions.length) {
        return res.json({
          submissionCount: 0,
          averageGrade: 0,
          onTimeSubmissionRate: 0,
          lateSubmissions: 0,
          gradeDistribution: generateEmptyScoreDistribution(),
          assignmentsByType: [],
          recentSubmissions: []
        });
      }
      
      // Calculate analytics data
      const analytics = await calculateAssignmentAnalytics(filteredSubmissions);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching assignment analytics:", error);
      res.status(500).json({ message: "Failed to fetch assignment analytics" });
    }
  });
  
  // Get student performance data for mentors and admins
  app.get('/api/analytics/student-performance', isAuthenticated, hasRole([UserRole.MENTOR, UserRole.ADMIN]), async (req: any, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;
      
      // Get all enrollments for the course
      let enrollments = [];
      if (courseId) {
        // Get all enrollments for a specific course
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Check if the mentor is assigned to this course
        if (req.user.claims.role === UserRole.MENTOR) {
          const mentors = await storage.getMentorsByCourse(courseId);
          const isMentorForCourse = mentors.some(mentor => mentor.id === req.user.claims.sub);
          if (!isMentorForCourse) {
            return res.status(403).json({ message: "You are not a mentor for this course" });
          }
        }
        
        // Get all students enrolled in the course
        // For this we would fetch all enrollments and join with users
        // For now, we'll just fetch all enrollments for the course
        // TODO: Join with user data to get complete information
        const courseEnrollments = await storage.getCourseEnrollmentsByCourse(courseId);
        enrollments = courseEnrollments;
      } else if (req.user.claims.role === UserRole.MENTOR) {
        // For mentors, get enrollments for all courses they teach
        const mentorCourses = await storage.getCoursesByMentor(req.user.claims.sub);
        for (const course of mentorCourses) {
          const courseEnrollments = await storage.getCourseEnrollmentsByCourse(course.id);
          enrollments.push(...courseEnrollments);
        }
      } else {
        // For admins, get all enrollments across all courses if no specific course
        // This might be a heavy operation, so in practice you might want to paginate
        // or limit this somehow
        const allCourses = await storage.getCourses();
        for (const course of allCourses) {
          const courseEnrollments = await storage.getCourseEnrollmentsByCourse(course.id);
          enrollments.push(...courseEnrollments);
        }
      }
      
      // Calculate student performance analytics
      const analytics = await calculateStudentPerformanceAnalytics(enrollments);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching student performance analytics:", error);
      res.status(500).json({ message: "Failed to fetch student performance analytics" });
    }
  });
}

/**
 * Helper function to filter quiz attempts by course
 */
async function filterAttemptsByCourse(attempts: any[], courseId: number) {
  // This requires joining quiz with lesson to get the courseId
  // For now, let's assume we can get the course ID from the quiz ID
  // In a real implementation, you would join the quiz with its lesson, module, and course
  
  // Get all quizzes for the course
  const courseQuizzes = await storage.getQuizzes({ courseId });
  const quizIds = courseQuizzes.map(quiz => quiz.id);
  
  // Filter attempts by the quizzes in this course
  return attempts.filter(attempt => quizIds.includes(attempt.quizId));
}

/**
 * Helper function to filter assignment submissions by course
 */
async function filterSubmissionsByCourse(submissions: any[], courseId: number) {
  // Get all assignments for the course
  const courseAssignments = await storage.getAssignments({ courseId });
  const assignmentIds = courseAssignments.map(assignment => assignment.id);
  
  // Filter submissions by the assignments in this course
  return submissions.filter(submission => assignmentIds.includes(submission.assignmentId));
}

/**
 * Calculate quiz analytics from attempts data
 */
async function calculateQuizAnalytics(attempts: any[]) {
  // Calculate general statistics
  const attemptCount = attempts.length;
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const averageScore = attemptCount > 0 ? totalScore / attemptCount : 0;
  
  // Get all quizzes for these attempts to determine passing scores
  const quizIds = [...new Set(attempts.map(attempt => attempt.quizId))];
  const quizzes = await Promise.all(
    quizIds.map(quizId => storage.getQuiz(quizId))
  );
  
  // Create a map of quiz ID to passing score
  const quizPassingScores = new Map();
  quizzes.forEach(quiz => {
    if (quiz) quizPassingScores.set(quiz.id, quiz.passingScore);
  });
  
  // Count passed attempts
  const passedAttempts = attempts.filter(attempt => {
    const passingScore = quizPassingScores.get(attempt.quizId) || 70; // Default to 70% if not set
    return attempt.score >= passingScore;
  });
  
  const passRate = attemptCount > 0 ? passedAttempts.length / attemptCount : 0;
  
  // Calculate score distribution
  const scoreDistribution = calculateScoreDistribution(attempts);
  
  // Group quizzes by difficulty
  // Note: This would require having difficulty field on quizzes
  // For now, we'll create mock data
  const quizzesByDifficulty = [
    { difficulty: "Easy", avgScore: 80, count: Math.floor(quizIds.length / 3) },
    { difficulty: "Medium", avgScore: 70, count: Math.floor(quizIds.length / 3) },
    { difficulty: "Hard", avgScore: 60, count: quizIds.length - 2 * Math.floor(quizIds.length / 3) },
  ];
  
  // Calculate pass/fail ratio for pie chart
  const passFailRatio = [
    { name: "Pass", value: passedAttempts.length },
    { name: "Fail", value: attemptCount - passedAttempts.length },
  ];
  
  // Get recent attempts
  const recentAttempts = await getRecentQuizAttempts(attempts, 5);
  
  return {
    attemptCount,
    averageScore,
    passRate,
    scoreDistribution,
    quizzesByDifficulty,
    passFailRatio,
    recentAttempts
  };
}

/**
 * Calculate assignment analytics from submissions data
 */
async function calculateAssignmentAnalytics(submissions: any[]) {
  // Calculate general statistics
  const submissionCount = submissions.length;
  
  // Filter out submissions that don't have a grade yet
  const gradedSubmissions = submissions.filter(submission => submission.grade !== null);
  const totalGrade = gradedSubmissions.reduce((sum, submission) => sum + submission.grade, 0);
  const averageGrade = gradedSubmissions.length > 0 ? totalGrade / gradedSubmissions.length : 0;
  
  // Calculate on-time submissions
  // This would require having a due date on assignments and comparing with submission date
  // For now, we'll create mock data
  const lateSubmissions = Math.floor(submissionCount * 0.15); // Assume 15% are late
  const onTimeSubmissionRate = submissionCount > 0 ? (submissionCount - lateSubmissions) / submissionCount : 0;
  
  // Calculate grade distribution
  const gradeDistribution = calculateScoreDistribution(gradedSubmissions);
  
  // Group assignments by type
  // Note: This would require having a type field on assignments
  // For now, we'll create mock data
  const assignmentsByType = [
    { type: "Project", avgGrade: 85, count: Math.floor(submissions.length / 3) },
    { type: "Essay", avgGrade: 75, count: Math.floor(submissions.length / 3) },
    { type: "Exercise", avgGrade: 80, count: submissions.length - 2 * Math.floor(submissions.length / 3) },
  ];
  
  // Get recent submissions
  const recentSubmissions = await getRecentAssignmentSubmissions(submissions, 5);
  
  return {
    submissionCount,
    averageGrade,
    onTimeSubmissionRate,
    lateSubmissions,
    gradeDistribution,
    assignmentsByType,
    recentSubmissions
  };
}

/**
 * Calculate student performance analytics from enrollment data
 */
async function calculateStudentPerformanceAnalytics(enrollments: any[]) {
  // Count unique students
  const studentIds = [...new Set(enrollments.map(enrollment => enrollment.userId))];
  const studentCount = studentIds.length;
  
  // Calculate completion rate
  // This is based on course progress in the enrollments
  const completedEnrollments = enrollments.filter(enrollment => enrollment.progress >= 100);
  const completionRate = enrollments.length > 0 ? completedEnrollments.length / enrollments.length : 0;
  
  // Calculate average score across all enrollments
  // This would require fetching quiz attempts and assignment submissions for each student
  // For now, we'll use a placeholder value
  const averageScore = 75; // Placeholder
  
  // Get top performers and those needing improvement
  // This would require analyzing quiz and assignment performance across students
  // For now, we'll create mock data
  // In a real implementation, you'd likely join enrollment data with quiz/assignment data
  
  // Mock data for demonstration
  const topPerformers = [
    { name: "Student 1", score: 95, completed: 10, total: 10 },
    { name: "Student 2", score: 92, completed: 9, total: 10 },
    { name: "Student 3", score: 90, completed: 10, total: 10 },
  ];
  
  const needsImprovement = [
    { name: "Student 4", score: 60, completed: 5, total: 10 },
    { name: "Student 5", score: 65, completed: 6, total: 10 },
    { name: "Student 6", score: 68, completed: 6, total: 10 },
  ];
  
  // Assessment completion data for pie chart
  const assessmentCompletion = [
    { name: "Completed", value: Math.round(completionRate * 100) },
    { name: "Incomplete", value: 100 - Math.round(completionRate * 100) },
  ];
  
  return {
    studentCount,
    completionRate,
    averageScore,
    topPerformers,
    needsImprovement,
    assessmentCompletion
  };
}

/**
 * Helper function to calculate score distribution
 */
function calculateScoreDistribution(items: any[]) {
  // Create bins for score ranges
  const distribution = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];
  
  // Count items in each bin
  items.forEach(item => {
    const score = item.score || item.grade || 0;
    if (score <= 20) distribution[0].count++;
    else if (score <= 40) distribution[1].count++;
    else if (score <= 60) distribution[2].count++;
    else if (score <= 80) distribution[3].count++;
    else distribution[4].count++;
  });
  
  return distribution;
}

/**
 * Helper function to generate empty score distribution
 */
function generateEmptyScoreDistribution() {
  return [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];
}

/**
 * Helper function to get recent quiz attempts with details
 */
async function getRecentQuizAttempts(attempts: any[], limit: number) {
  // Sort attempts by date (newest first)
  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  // Take the most recent ones
  const recentAttempts = sortedAttempts.slice(0, limit);
  
  // Fetch quiz details for each attempt
  const detailedAttempts = await Promise.all(
    recentAttempts.map(async (attempt) => {
      const quiz = await storage.getQuiz(attempt.quizId);
      const quizTitle = quiz ? quiz.title : `Quiz ${attempt.quizId}`;
      const passingScore = quiz ? quiz.passingScore : 70;
      
      return {
        quizTitle,
        date: new Date(attempt.completedAt).toISOString().split('T')[0],
        score: attempt.score,
        passed: attempt.score >= passingScore
      };
    })
  );
  
  return detailedAttempts;
}

/**
 * Helper function to get recent assignment submissions with details
 */
async function getRecentAssignmentSubmissions(submissions: any[], limit: number) {
  // Sort submissions by date (newest first)
  const sortedSubmissions = [...submissions].sort((a, b) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  
  // Take the most recent ones
  const recentSubmissions = sortedSubmissions.slice(0, limit);
  
  // Fetch assignment details for each submission
  const detailedSubmissions = await Promise.all(
    recentSubmissions.map(async (submission) => {
      const assignment = await storage.getAssignment(submission.assignmentId);
      const assignmentTitle = assignment ? assignment.title : `Assignment ${submission.assignmentId}`;
      
      return {
        assignmentTitle,
        date: new Date(submission.submittedAt).toISOString().split('T')[0],
        grade: submission.grade,
        status: submission.grade !== null ? "graded" : "pending"
      };
    })
  );
  
  return detailedSubmissions;
}
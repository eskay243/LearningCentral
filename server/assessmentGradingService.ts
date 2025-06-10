import { storage } from "./storage";
import { 
  AutomatedQuiz, 
  QuizQuestion, 
  QuizAttempt, 
  QuizAnswer,
  AssignmentRubric,
  RubricCriteria,
  AssignmentGrade,
  PeerReview,
  StudentProgress,
  LearningAnalytics,
  GeneratedCertificate
} from "@shared/schema";

export class AssessmentGradingService {
  // Automated Quiz Grading
  async gradeQuizAttempt(attemptId: number): Promise<{ totalScore: number; percentage: number; passed: boolean }> {
    try {
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) throw new Error("Quiz attempt not found");

      const quiz = await storage.getAutomatedQuiz(attempt.quizId);
      if (!quiz) throw new Error("Quiz not found");

      const questions = await storage.getQuizQuestions(attempt.quizId);
      const answers = await storage.getQuizAnswers(attemptId);

      let totalScore = 0;
      let maxScore = 0;

      for (const question of questions) {
        maxScore += parseFloat(question.points.toString());
        const answer = answers.find(a => a.questionId === question.id);
        
        if (answer) {
          const score = await this.gradeQuestion(question, answer);
          totalScore += score;
          
          // Update answer with grading results
          await storage.updateQuizAnswer(answer.id, {
            pointsEarned: score.toString(),
            isCorrect: score > 0,
            autoGraded: true,
            gradedAt: new Date()
          });
        }
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentage >= parseFloat(quiz.passingScore.toString());

      // Update attempt with final scores
      await storage.updateQuizAttempt(attemptId, {
        totalScore: totalScore.toString(),
        maxScore: maxScore.toString(),
        percentage: percentage.toString(),
        passed,
        status: "graded",
        autoGraded: true
      });

      // Update student progress
      await this.updateStudentProgress(attempt.userId, quiz.courseId, "quiz");

      return { totalScore, percentage, passed };
    } catch (error) {
      console.error("Error grading quiz attempt:", error);
      throw error;
    }
  }

  private async gradeQuestion(question: QuizQuestion, answer: QuizAnswer): Promise<number> {
    const maxPoints = parseFloat(question.points.toString());
    
    switch (question.questionType) {
      case "multiple_choice":
        return this.gradeMultipleChoice(question, answer, maxPoints);
      
      case "true_false":
        return this.gradeTrueFalse(question, answer, maxPoints);
      
      case "short_answer":
        return this.gradeShortAnswer(question, answer, maxPoints);
      
      case "fill_blank":
        return this.gradeFillBlank(question, answer, maxPoints);
      
      case "matching":
        return this.gradeMatching(question, answer, maxPoints);
      
      default:
        // Essays require manual grading
        return 0;
    }
  }

  private gradeMultipleChoice(question: QuizQuestion, answer: QuizAnswer, maxPoints: number): number {
    const correctAnswers = question.correctAnswers as string[];
    const studentAnswers = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
    
    if (JSON.stringify(correctAnswers.sort()) === JSON.stringify(studentAnswers.sort())) {
      return maxPoints;
    }
    return 0;
  }

  private gradeTrueFalse(question: QuizQuestion, answer: QuizAnswer, maxPoints: number): number {
    const correctAnswer = (question.correctAnswers as string[])[0];
    const studentAnswer = answer.answer as string;
    
    return correctAnswer === studentAnswer ? maxPoints : 0;
  }

  private gradeShortAnswer(question: QuizQuestion, answer: QuizAnswer, maxPoints: number): number {
    const keywords = question.keywords as string[] || [];
    const correctAnswers = question.correctAnswers as string[] || [];
    const studentAnswer = (answer.answer as string).toLowerCase();
    
    // Check for exact matches first
    for (const correct of correctAnswers) {
      if (studentAnswer.includes(correct.toLowerCase())) {
        return maxPoints;
      }
    }
    
    // Check for keyword matches (partial credit)
    let keywordMatches = 0;
    for (const keyword of keywords) {
      if (studentAnswer.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    if (keywordMatches > 0 && keywords.length > 0) {
      return (keywordMatches / keywords.length) * maxPoints;
    }
    
    return 0;
  }

  private gradeFillBlank(question: QuizQuestion, answer: QuizAnswer, maxPoints: number): number {
    const correctAnswers = question.correctAnswers as string[];
    const studentAnswers = answer.answer as string[];
    
    if (!Array.isArray(studentAnswers)) return 0;
    
    let correctCount = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (studentAnswers[i]?.toLowerCase().trim() === correctAnswers[i]?.toLowerCase().trim()) {
        correctCount++;
      }
    }
    
    return (correctCount / correctAnswers.length) * maxPoints;
  }

  private gradeMatching(question: QuizQuestion, answer: QuizAnswer, maxPoints: number): number {
    const correctPairs = question.correctAnswers as { [key: string]: string };
    const studentPairs = answer.answer as { [key: string]: string };
    
    let correctMatches = 0;
    const totalPairs = Object.keys(correctPairs).length;
    
    for (const [key, value] of Object.entries(correctPairs)) {
      if (studentPairs[key] === value) {
        correctMatches++;
      }
    }
    
    return (correctMatches / totalPairs) * maxPoints;
  }

  // Assignment Rubric Grading
  async gradeAssignmentWithRubric(
    assignmentId: number, 
    studentId: string, 
    rubricId: number, 
    criteriaScores: { criteriaId: number; score: number; level: string; feedback?: string }[],
    gradedBy: string,
    overallFeedback?: string
  ): Promise<AssignmentGrade> {
    try {
      const rubric = await storage.getAssignmentRubric(rubricId);
      if (!rubric) throw new Error("Rubric not found");

      const criteria = await storage.getRubricCriteria(rubricId);
      
      let totalScore = 0;
      let maxScore = 0;

      // Calculate total score
      for (const criterion of criteria) {
        maxScore += parseFloat(criterion.maxPoints.toString()) * parseFloat(criterion.weight.toString());
        
        const criteriaScore = criteriaScores.find(cs => cs.criteriaId === criterion.id);
        if (criteriaScore) {
          totalScore += criteriaScore.score * parseFloat(criterion.weight.toString());
        }
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const letterGrade = this.calculateLetterGrade(percentage);

      // Create assignment grade
      const grade = await storage.createAssignmentGrade({
        assignmentId,
        studentId,
        rubricId,
        gradedBy,
        totalScore: totalScore.toString(),
        maxScore: maxScore.toString(),
        percentage: percentage.toString(),
        letterGrade,
        status: "graded",
        overallFeedback,
        gradedAt: new Date()
      });

      // Save criteria scores
      for (const criteriaScore of criteriaScores) {
        await storage.createCriteriaScore({
          gradeId: grade.id,
          criteriaId: criteriaScore.criteriaId,
          score: criteriaScore.score.toString(),
          maxScore: criteria.find(c => c.id === criteriaScore.criteriaId)?.maxPoints.toString() || "0",
          level: criteriaScore.level,
          feedback: criteriaScore.feedback
        });
      }

      // Update student progress
      const assignment = await storage.getAssignment(assignmentId);
      if (assignment?.courseId) {
        await this.updateStudentProgress(studentId, assignment.courseId, "assignment");
      }

      return grade;
    } catch (error) {
      console.error("Error grading assignment with rubric:", error);
      throw error;
    }
  }

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }

  // Peer Review Management
  async assignPeerReviewers(assignmentId: number, rubricId: number): Promise<void> {
    try {
      const rubric = await storage.getAssignmentRubric(rubricId);
      if (!rubric?.enablePeerReview) return;

      const submissions = await storage.getAssignmentSubmissions(assignmentId);
      const students = submissions.map(s => s.studentId);
      
      // Randomly assign peer reviewers
      for (const studentId of students) {
        const otherStudents = students.filter(s => s !== studentId);
        const selectedReviewers = this.shuffleArray(otherStudents).slice(0, rubric.peerReviewers);
        
        for (const reviewerId of selectedReviewers) {
          await storage.createPeerReview({
            assignmentId,
            reviewerId,
            revieweeId: studentId,
            status: "assigned",
            isAnonymous: true
          });
        }
      }
    } catch (error) {
      console.error("Error assigning peer reviewers:", error);
      throw error;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Progress Tracking and Analytics
  async updateStudentProgress(userId: string, courseId: number, activityType: "lesson" | "quiz" | "assignment"): Promise<void> {
    try {
      let progress = await storage.getStudentProgress(userId, courseId);
      
      if (!progress) {
        // Create new progress record
        const courseStats = await this.getCourseStats(courseId);
        progress = await storage.createStudentProgress({
          userId,
          courseId,
          totalLessons: courseStats.totalLessons,
          totalQuizzes: courseStats.totalQuizzes,
          totalAssignments: courseStats.totalAssignments,
          lastActivity: new Date()
        });
      }

      // Update based on activity type
      const updates: any = { lastActivity: new Date() };
      
      if (activityType === "lesson") {
        updates.completedLessons = progress.completedLessons + 1;
      } else if (activityType === "quiz") {
        updates.completedQuizzes = progress.completedQuizzes + 1;
        updates.averageQuizScore = await this.calculateAverageQuizScore(userId, courseId);
      } else if (activityType === "assignment") {
        updates.completedAssignments = progress.completedAssignments + 1;
        updates.averageAssignmentScore = await this.calculateAverageAssignmentScore(userId, courseId);
      }

      // Calculate overall progress
      const totalCompleted = (updates.completedLessons || progress.completedLessons) + 
                           (updates.completedQuizzes || progress.completedQuizzes) + 
                           (updates.completedAssignments || progress.completedAssignments);
      const totalItems = progress.totalLessons + progress.totalQuizzes + progress.totalAssignments;
      
      updates.overallProgress = totalItems > 0 ? (totalCompleted / totalItems * 100).toFixed(2) : "0.00";
      updates.currentGrade = await this.calculateCurrentGrade(userId, courseId);
      updates.gradeLetterEquivalent = this.calculateLetterGrade(parseFloat(updates.currentGrade));
      updates.isOnTrack = this.assessOnTrackStatus(progress, updates);

      await storage.updateStudentProgress(progress.id, updates);
      
      // Update learning analytics
      await this.updateLearningAnalytics(userId, courseId);
    } catch (error) {
      console.error("Error updating student progress:", error);
      throw error;
    }
  }

  private async getCourseStats(courseId: number): Promise<{ totalLessons: number; totalQuizzes: number; totalAssignments: number }> {
    // Implementation would fetch actual course statistics
    // For now, returning placeholder values
    return {
      totalLessons: 10,
      totalQuizzes: 5,
      totalAssignments: 3
    };
  }

  private async calculateAverageQuizScore(userId: string, courseId: number): Promise<string> {
    const attempts = await storage.getUserQuizAttempts(userId, courseId);
    if (attempts.length === 0) return "0.00";
    
    const totalScore = attempts.reduce((sum, attempt) => sum + parseFloat(attempt.percentage.toString()), 0);
    return (totalScore / attempts.length).toFixed(2);
  }

  private async calculateAverageAssignmentScore(userId: string, courseId: number): Promise<string> {
    const grades = await storage.getUserAssignmentGrades(userId, courseId);
    if (grades.length === 0) return "0.00";
    
    const totalScore = grades.reduce((sum, grade) => sum + parseFloat(grade.percentage.toString()), 0);
    return (totalScore / grades.length).toFixed(2);
  }

  private async calculateCurrentGrade(userId: string, courseId: number): Promise<string> {
    const quizAvg = parseFloat(await this.calculateAverageQuizScore(userId, courseId));
    const assignmentAvg = parseFloat(await this.calculateAverageAssignmentScore(userId, courseId));
    
    // Weighted average: 40% quizzes, 60% assignments
    const currentGrade = (quizAvg * 0.4) + (assignmentAvg * 0.6);
    return currentGrade.toFixed(2);
  }

  private assessOnTrackStatus(progress: StudentProgress, updates: any): boolean {
    const currentProgress = parseFloat(updates.overallProgress || progress.overallProgress.toString());
    const expectedProgress = this.calculateExpectedProgress(progress.createdAt);
    
    return currentProgress >= (expectedProgress * 0.8); // 80% of expected progress
  }

  private calculateExpectedProgress(startDate: Date): number {
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedDuration = 90; // 90 days course duration
    return Math.min((daysSinceStart / expectedDuration) * 100, 100);
  }

  private async updateLearningAnalytics(userId: string, courseId: number): Promise<void> {
    try {
      // This would implement sophisticated learning analytics
      // Including difficulty analysis, engagement metrics, and risk assessment
      const analytics = await storage.getLearningAnalytics(userId, courseId);
      
      const updates = {
        lastRiskAssessment: new Date(),
        // Additional analytics updates would go here
      };
      
      if (analytics) {
        await storage.updateLearningAnalytics(analytics.id, updates);
      } else {
        await storage.createLearningAnalytics({
          userId,
          courseId,
          ...updates
        });
      }
    } catch (error) {
      console.error("Error updating learning analytics:", error);
    }
  }

  // Certificate Generation
  async generateCertificate(userId: string, courseId: number, templateId: number): Promise<GeneratedCertificate> {
    try {
      const template = await storage.getCertificateTemplate(templateId);
      if (!template) throw new Error("Certificate template not found");

      const user = await storage.getUser(userId);
      const course = await storage.getCourse(courseId);
      const progress = await storage.getStudentProgress(userId, courseId);

      if (!user || !course || !progress) {
        throw new Error("Required data not found for certificate generation");
      }

      // Check if student meets requirements
      const meetsRequirements = await this.checkCertificateRequirements(userId, courseId, template);
      if (!meetsRequirements) {
        throw new Error("Student does not meet certificate requirements");
      }

      // Generate unique certificate number and verification code
      const certificateNumber = this.generateCertificateNumber();
      const verificationCode = this.generateVerificationCode();

      // Calculate final grade
      const finalGrade = parseFloat(progress.currentGrade?.toString() || "0");

      // Create certificate record
      const certificate = await storage.createGeneratedCertificate({
        templateId,
        userId,
        courseId,
        certificateNumber,
        studentName: `${user.firstName} ${user.lastName}`,
        courseName: course.title,
        finalGrade: finalGrade.toString(),
        completionDate: new Date(),
        verificationCode,
        status: "active"
      });

      // Generate certificate file (would integrate with PDF generation service)
      const certificateUrl = await this.generateCertificateFile(certificate, template, user, course);
      
      // Update certificate with file URL
      await storage.updateGeneratedCertificate(certificate.id, { certificateUrl });

      return { ...certificate, certificateUrl };
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw error;
    }
  }

  private async checkCertificateRequirements(userId: string, courseId: number, template: any): Promise<boolean> {
    const progress = await storage.getStudentProgress(userId, courseId);
    if (!progress) return false;

    const finalGrade = parseFloat(progress.currentGrade?.toString() || "0");
    const minGrade = parseFloat(template.minPassingGrade.toString());

    // Check minimum grade requirement
    if (finalGrade < minGrade) return false;

    // Check required assignments and quizzes completion
    // Implementation would verify specific requirements

    return true;
  }

  private generateCertificateNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `CERT-${timestamp}-${random}`;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async generateCertificateFile(certificate: any, template: any, user: any, course: any): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, returning a placeholder URL
    return `/certificates/${certificate.certificateNumber}.pdf`;
  }

  // Analytics and Reporting
  async generateProgressReport(courseId: number): Promise<any> {
    try {
      const students = await storage.getCourseStudents(courseId);
      const progressData = [];

      for (const student of students) {
        const progress = await storage.getStudentProgress(student.id, courseId);
        const analytics = await storage.getLearningAnalytics(student.id, courseId);
        
        progressData.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          overallProgress: progress?.overallProgress || 0,
          currentGrade: progress?.currentGrade || 0,
          isOnTrack: progress?.isOnTrack || false,
          riskLevel: analytics?.riskLevel || "low",
          lastActivity: progress?.lastActivity
        });
      }

      return {
        courseId,
        totalStudents: students.length,
        averageProgress: progressData.reduce((sum, p) => sum + parseFloat(p.overallProgress.toString()), 0) / progressData.length,
        studentsOnTrack: progressData.filter(p => p.isOnTrack).length,
        highRiskStudents: progressData.filter(p => p.riskLevel === "high").length,
        students: progressData
      };
    } catch (error) {
      console.error("Error generating progress report:", error);
      throw error;
    }
  }
}

export const assessmentGradingService = new AssessmentGradingService();
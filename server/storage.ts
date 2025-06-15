import {
  users,
  courses,
  modules,
  lessons,
  resources,
  quizzes,
  quizQuestions,
  quizAttempts,
  assignments,
  assignmentSubmissions,
  liveSessions,
  liveSessionAttendance,
  liveSessionRollCalls,
  liveSessionRollCallResponses,
  liveSessionMessages,
  liveSessionQA,
  videoProviderSettings,
  certificates,
  coupons,
  courseRatings,
  lessonProgress,
  courseEnrollments,
  mentorCourses,
  affiliateCommissions,
  courseDiscussions,
  discussionReplies,
  notifications,
  notificationSettings,
  codingExercises,
  exerciseProgress,
  systemSettings,
  Currency,
  // Communication related schema
  conversations,
  conversationParticipants,
  chatMessages,
  messageReactions,
  courseAnnouncements,
  announcements,
  courseMentors,
  // KYC (Know Your Customer) schema
  kycDocuments,
  kycVerificationHistory,
  // Assessment & Grading System schema
  automatedQuizzes,
  advancedQuizzes,
  advancedQuizQuestions,
  quizQuestions as newQuizQuestions,
  quizAttempts as newQuizAttempts,
  quizAnswers,
  assessmentQuizAttempts,
  assessmentQuizAnswers,
  assignmentRubrics,
  rubricCriteria,
  assignmentGrades,
  criteriaScores,
  peerReviews,
  studentProgress,
  learningAnalytics,
  certificateTemplates,
  generatedCertificates,
  // Regular types
  type User,
  type UpsertUser,
  type Course,
  type Certificate as CertificateType,
  type InsertCertificate,
  type SystemSettings,
  type Module,
  type Lesson,
  type Resource,
  type Quiz,
  type QuizQuestion,
  type QuizAttempt,
  type Assignment,
  type AssignmentSubmission,
  type LiveSession,
  type LiveSessionAttendance,
  type Certificate,
  type Coupon,
  type CourseRating,
  type LessonProgress,
  type CourseEnrollment,
  type MentorCourse,
  type AffiliateCommission,
  type CodingExercise,
  type ExerciseProgress,
  // Communication related types
  type Conversation,
  type ConversationParticipant,
  type ChatMessage,
  type MessageReaction,
  type CourseAnnouncement,
  type Notification,
  type NotificationSetting,
  type InsertConversation,
  type InsertConversationParticipant,
  type InsertChatMessage,
  type InsertMessageReaction,
  type InsertCourseAnnouncement,
  type InsertNotification,
  type InsertNotificationSetting,
  // Invoice and payment types
  invoices,
  paymentTransactions,
  type Invoice,
  type PaymentTransaction,
  type InsertInvoice,
  type InsertPaymentTransaction,
  // Assessment & Grading types
  type AutomatedQuiz,
  type QuizQuestion as NewQuizQuestion,
  type QuizAttempt as NewQuizAttempt,
  type QuizAnswer,
  type AssignmentRubric,
  type RubricCriteria,
  type AssignmentGrade,
  type CriteriaScore,
  type PeerReview,
  type StudentProgress,
  type LearningAnalytics,
  type CertificateTemplate,
  type GeneratedCertificate,
  UserRole,
} from "@shared/schema";
import { db } from "./db";
import { randomBytes } from 'crypto';
import { eq, and, or, like, desc, asc, isNull, count, sql, not, inArray, lt, gt, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: any): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
  
  // Communication operations
  getUserConversations(userId: string): Promise<any[]>;
  getConversationMessages(conversationId: number): Promise<any[]>;
  isConversationParticipant(userId: string, conversationId: number): Promise<boolean>;
  createConversation(data: Partial<InsertConversation>): Promise<Conversation>;
  addConversationParticipants(conversationId: number, participantIds: string[]): Promise<void>;
  sendMessage(data: Partial<InsertChatMessage>): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  getUserMessages(userId: string): Promise<any[]>;
  getAnnouncements(options: { limit: number, offset: number }): Promise<any[]>;
  getCourseAnnouncements(courseId: number, options: { limit: number, offset: number }): Promise<any[]>;
  getUsersByRole(role?: string): Promise<User[]>;
  
  // Course operations
  createCourse(courseData: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  updateCourse(id: number, courseData: Partial<Course>): Promise<Course>;
  getCourses(options?: { published?: boolean }): Promise<Course[]>;
  getCoursesByMentor(mentorId: string): Promise<Course[]>;
  getEnrolledCourses(userId: string): Promise<CourseEnrollment[]>;
  getCourseEnrollments(courseId: number): Promise<CourseEnrollment[]>;
  getAllEnrollments(): Promise<CourseEnrollment[]>;
  
  // Module & Lesson operations
  createModule(moduleData: Omit<Module, "id">): Promise<Module>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createLesson(lessonData: Omit<Lesson, "id">): Promise<Lesson>;
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  getLessonProgress(lessonId: number, userId: string): Promise<LessonProgress | undefined>;
  updateLessonProgress(lessonId: number, userId: string, progress: Partial<LessonProgress>): Promise<LessonProgress>;
  
  // Enrollment operations
  enrollUserInCourse(enrollment: Omit<CourseEnrollment, "id" | "enrolledAt">): Promise<CourseEnrollment>;
  getCourseEnrollment(courseId: number, userId: string): Promise<CourseEnrollment | undefined>;
  isUserEnrolledInCourse(userId: string, courseId: number): Promise<boolean>;
  updateCourseProgress(enrollmentId: number, progress: number): Promise<CourseEnrollment>;
  getStudentEnrollments(userId: string): Promise<CourseEnrollment[]>;
  getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]>;
  
  // Mentor operations
  assignMentorToCourse(mentorCourse: Omit<MentorCourse, "id" | "assignedAt">): Promise<MentorCourse>;
  getMentorsByCourse(courseId: number): Promise<User[]>;
  
  // Affiliate operations
  createAffiliateCommission(commission: Omit<AffiliateCommission, "id" | "createdAt">): Promise<AffiliateCommission>;
  getAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]>;
  
  // Quiz operations
  createQuiz(quizData: Omit<Quiz, "id">): Promise<Quiz>;
  getQuiz(quizId: number): Promise<Quiz | undefined>;
  updateQuiz(quizId: number, quizData: Partial<Quiz>): Promise<Quiz>;
  getQuizzes(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<Quiz[]>;
  getQuizzesByMentor(mentorId: string): Promise<Quiz[]>;
  getQuizzesByLesson(lessonId: number): Promise<Quiz[]>;
  addQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion>;
  updateQuizQuestion(questionId: number, questionData: Partial<QuizQuestion>): Promise<QuizQuestion>;
  deleteQuizQuestion(questionId: number): Promise<void>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  submitQuizAttempt(attemptData: Omit<QuizAttempt, "id" | "startedAt" | "completedAt">): Promise<QuizAttempt>;
  getQuizAttempts(quizId: number): Promise<QuizAttempt[]>;
  getUserQuizAttempts(userId: string, quizId?: number): Promise<QuizAttempt[]>;
  
  // Assignment operations
  createAssignment(assignmentData: Omit<Assignment, "id">): Promise<Assignment>;
  getAssignment(assignmentId: number): Promise<Assignment | undefined>;
  updateAssignment(assignmentId: number, assignmentData: Partial<Assignment>): Promise<Assignment>;
  getAssignments(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<Assignment[]>;
  getAssignmentsByMentor(mentorId: string): Promise<Assignment[]>;
  getAssignmentsByLesson(lessonId: number): Promise<Assignment[]>;
  submitAssignment(submissionData: Omit<AssignmentSubmission, "id" | "submittedAt">): Promise<AssignmentSubmission>;
  getAssignmentSubmission(submissionId: number): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissions(assignmentId: number): Promise<AssignmentSubmission[]>;
  getUserAssignmentSubmissions(userId: string, assignmentId?: number): Promise<AssignmentSubmission[]>;
  gradeAssignment(submissionId: number, grade: number, feedback: string, gradedBy: string): Promise<AssignmentSubmission>;
  
  // Live session operations
  createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession>;
  getLiveSession(sessionId: number): Promise<LiveSession | undefined>;
  getLiveSessionsByCourse(courseId: number): Promise<LiveSession[]>;
  getAllLiveSessions(): Promise<LiveSession[]>;
  getLiveSessionsByMentor(mentorId: string): Promise<LiveSession[]>;
  getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]>;
  getUpcomingSessionsForStudent(userId: string): Promise<LiveSession[]>;
  updateLiveSession(id: number, updates: Partial<LiveSession>): Promise<LiveSession>;
  recordAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance>;
  recordSessionAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance>;
  getLiveSessionAttendance(sessionId: number): Promise<LiveSessionAttendance[]>;
  getLiveSessionAttendanceByUser(userId: string): Promise<LiveSessionAttendance[]>;
  enrollStudentsInSession(sessionId: number, courseId: number): Promise<void>;
  getVideoProviderSettings(userId: string, provider: string): Promise<any>;
  getAllVideoProviderSettings(userId: string): Promise<any[]>;
  saveVideoProviderSettings(settingsData: any): Promise<any>;
  getSessionMessages(sessionId: number, page: number, limit: number): Promise<any[]>;
  createSessionQuestion(qaData: any): Promise<any>;
  
  // Communication - Conversations
  createConversation(conversationData: InsertConversation): Promise<Conversation>;
  getConversation(conversationId: number): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getCourseConversations(courseId: number): Promise<Conversation[]>;
  updateConversation(conversationId: number, updateData: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(conversationId: number): Promise<void>;
  
  // Communication - Participants
  addParticipantToConversation(participantData: InsertConversationParticipant): Promise<ConversationParticipant>;
  removeParticipantFromConversation(conversationId: number, userId: string): Promise<void>;
  getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]>;
  updateLastReadMessage(conversationId: number, userId: string, messageId: number): Promise<void>;
  
  // Communication - Messages
  createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(conversationId: number, options?: { limit?: number, before?: number }): Promise<ChatMessage[]>;
  updateChatMessage(messageId: number, content: string): Promise<ChatMessage>;
  deleteChatMessage(messageId: number): Promise<void>;
  
  // Communication - Reactions
  addMessageReaction(reactionData: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: number, userId: string, reaction: string): Promise<void>;
  getMessageReactions(messageId: number): Promise<MessageReaction[]>;
  
  // Announcements
  createCourseAnnouncement(announcementData: InsertCourseAnnouncement): Promise<CourseAnnouncement>;
  getCourseAnnouncement(announcementId: number): Promise<CourseAnnouncement | undefined>;
  updateCourseAnnouncement(announcementId: number, updateData: Partial<CourseAnnouncement>): Promise<CourseAnnouncement>;
  getCourseAnnouncementsByCourse(courseId: number): Promise<CourseAnnouncement[]>;
  getCourseAnnouncementsByUser(userId: string): Promise<CourseAnnouncement[]>;
  deleteCourseAnnouncement(announcementId: number): Promise<void>;
  
  // Course Announcements
  createAnnouncement(announcementData: any): Promise<any>;
  getAnnouncementsByCourse(courseId: number): Promise<any[]>;
  updateAnnouncement(announcementId: number, updateData: any): Promise<any>;
  deleteAnnouncement(announcementId: number): Promise<void>;
  
  // Mentor Assignment
  assignMentorToCourse(courseId: number, mentorId: string, assignedBy: string, role?: string): Promise<any>;
  removeMentorFromCourse(courseId: number, mentorId: string): Promise<void>;
  getCourseMentors(courseId: number): Promise<any[]>;
  getMentorCourses(mentorId: string): Promise<any[]>;
  updateMentorRole(courseId: number, mentorId: string, role: string): Promise<any>;
  
  // Certificates
  // Certificate Management
  issueCertificate(certificate: any): Promise<Certificate>;
  getCertificate(certificateId: number): Promise<Certificate | undefined>;
  getUserCertificates(userId: string): Promise<Certificate[]>;
  verifyCertificate(certificateId: number): Promise<{valid: boolean; certificate?: Certificate}>;
  generateVerificationCode(): Promise<string>;
  
  // Invoice Management
  createInvoice(invoiceData: InsertInvoice): Promise<Invoice>;
  getInvoice(invoiceId: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getUserInvoices(userId: string): Promise<Invoice[]>;
  updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date): Promise<Invoice>;
  generateInvoiceNumber(): Promise<string>;
  
  // Payment Transaction Management
  createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(transactionId: number): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionByReference(reference: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransaction(transactionId: number, updateData: Partial<PaymentTransaction>): Promise<PaymentTransaction>;
  updatePaymentTransactionStatus(reference: string, status: string, updateData?: any): Promise<PaymentTransaction>;
  getUserPaymentTransactions(userId: string): Promise<PaymentTransaction[]>;
  
  // Additional payment methods
  createPaymentRecord(paymentData: any): Promise<any>;
  getPaymentByReference(reference: string): Promise<any>;
  updatePaymentStatus(reference: string, status: string, paymentData?: any): Promise<any>;
  getUserPayments(userId: string): Promise<any[]>;
  getPaymentStats(): Promise<any>;
  getEnrollmentByUserAndCourse(userId: string, courseId: number): Promise<any>;
  createEnrollment(enrollmentData: any): Promise<any>;

  // Assessment & Grading System Methods
  createAutomatedQuiz(quizData: any): Promise<any>;
  getAllAutomatedQuizzes(): Promise<any[]>;
  getAutomatedQuizzesByCourse(courseId: number): Promise<any[]>;
  getAutomatedQuiz(quizId: number): Promise<any>;
  updateAutomatedQuiz(quizId: number, quizData: any): Promise<any>;
  deleteAutomatedQuiz(quizId: number): Promise<void>;
  
  getQuizQuestions(quizId: number): Promise<any[]>;
  createQuizQuestion(questionData: any): Promise<any>;
  updateQuizQuestion(questionId: number, questionData: any): Promise<any>;
  deleteQuizQuestion(questionId: number): Promise<void>;
  
  createQuizAttempt(attemptData: any): Promise<any>;
  getQuizAttempts(quizId: number): Promise<any[]>;
  getUserQuizAttempts(userId: string, quizId?: number): Promise<any[]>;
  getQuizAttempt(attemptId: number): Promise<any>;
  
  createAssignmentRubric(rubricData: any): Promise<any>;
  getAllRubrics(): Promise<any[]>;
  getRubricsByCourse(courseId: number): Promise<any[]>;
  getRubricsByAssignment(assignmentId: number): Promise<any[]>;
  getAssignmentRubric(rubricId: number): Promise<any>;
  
  createRubricCriteria(criteriaData: any): Promise<any>;
  getRubricCriteria(rubricId: number): Promise<any[]>;
  
  createAssignmentGrade(gradeData: any): Promise<any>;
  getAssignmentGrades(assignmentId: number): Promise<any[]>;
  
  createPeerReview(reviewData: any): Promise<any>;
  getPeerReviews(submissionId: number): Promise<any[]>;
  
  createStudentProgress(progressData: any): Promise<any>;
  getStudentProgress(studentId: string, courseId: number): Promise<any>;
  getAllStudentProgress(studentId: string): Promise<any[]>;
  updateStudentProgress(progressId: number, progressData: any): Promise<any>;
  
  createLearningAnalytics(analyticsData: any): Promise<any>;
  getLearningAnalytics(studentId: string, courseId: number): Promise<any>;
  getAllLearningAnalytics(): Promise<any[]>;
  
  createCertificateTemplate(templateData: any): Promise<any>;
  getAllCertificateTemplates(): Promise<any[]>;
  getCertificateTemplatesByCourse(courseId: number): Promise<any[]>;
  
  createGeneratedCertificate(certificateData: any): Promise<any>;
  getGeneratedCertificates(userId: string): Promise<any[]>;
  
  getAssignmentsByCourse(courseId: number): Promise<any[]>;
  getAllAssignments(): Promise<any[]>;

  // Coupons and ratings
  createCoupon(couponData: Omit<Coupon, "id" | "createdAt">): Promise<Coupon>;
  validateCoupon(couponCode: string): Promise<Coupon | undefined>;
  rateCourse(ratingData: Omit<CourseRating, "id" | "ratedAt">): Promise<CourseRating>;
  getCourseRatings(courseId: number): Promise<CourseRating[]>;
  
  // Discussions
  createCourseDiscussion(discussionData: Omit<any, "id" | "createdAt">): Promise<any>;
  getCourseDiscussions(courseId: number): Promise<any[]>;
  addDiscussionReply(replyData: Omit<any, "id" | "createdAt">): Promise<any>;
  
  // Notifications
  createNotification(notificationData: any): Promise<any>;
  getUserNotifications(userId: string): Promise<any[]>;
  markNotificationAsRead(notificationId: number): Promise<any>;
  
  // Bookmarks
  addBookmark(bookmarkData: any): Promise<any>;
  getUserBookmarks(userId: string): Promise<any[]>;
  removeBookmark(bookmarkId: number): Promise<void>;
  
  // Content sharing
  createContentShare(shareData: any): Promise<any>;
  getContentShareByCode(shareCode: string): Promise<any>;
  updateContentShareAccess(shareId: number): Promise<any>;
  
  // Interactive coding exercises
  createCodingExercise(exerciseData: Omit<CodingExercise, "id" | "createdAt" | "updatedAt">): Promise<CodingExercise>;
  getCodingExercise(exerciseId: number): Promise<CodingExercise | undefined>;
  getCodingExercises(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<CodingExercise[]>;
  updateCodingExercise(exerciseId: number, updateData: Partial<CodingExercise>): Promise<CodingExercise>;
  
  // Exercise progress tracking
  getExerciseProgress(exerciseId: number, userId: string): Promise<ExerciseProgress | undefined>;
  updateExerciseProgress(exerciseId: number, userId: string, progressData: Partial<ExerciseProgress>): Promise<ExerciseProgress>;
  getUserExerciseProgress(userId: string): Promise<ExerciseProgress[]>;
  getCodingExercisesCount(): Promise<number>;
  getCodingExercisesByDifficulty(): Promise<Record<string, number>>;
  getExerciseStatsByCourse(courseId: number): Promise<any[]>;
  getExerciseStatsByMentor(mentorId: string): Promise<any[]>;
  
  // Additional methods for lessons
  getLesson(lessonId: number): Promise<Lesson | undefined>;

  // Enhanced Live session implementation with video conferencing
  createLiveSession(sessionData: any): Promise<LiveSession>;
  updateLiveSession(sessionId: number, updateData: any): Promise<LiveSession>;
  deleteLiveSession(sessionId: number): Promise<void>;
  getLiveSessions(options?: { courseId?: number; status?: string; upcoming?: boolean }): Promise<LiveSession[]>;
  getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]>;
  getLiveSession(id: number): Promise<LiveSession | undefined>;
  
  // Session attendance methods
  recordSessionAttendance(attendanceData: any): Promise<any>;
  updateSessionAttendance(sessionId: number, userId: string, updateData: any): Promise<any>;
  getSessionAttendance(sessionId: number): Promise<any[]>;
  getActiveSessionAttendance(sessionId: number): Promise<any[]>;
  
  // Interactive features methods
  createSessionPoll(pollData: any): Promise<any>;
  submitPollResponse(responseData: any): Promise<any>;
  getPollResults(pollId: number): Promise<any>;
  createSessionQuestion(questionData: any): Promise<any>;
  answerSessionQuestion(questionId: number, answerData: any): Promise<any>;
  getSessionQuestions(sessionId: number): Promise<any[]>;
  createSessionMessage(messageData: any): Promise<any>;
  getSessionMessages(sessionId: number, options?: { limit?: number; before?: number }): Promise<any[]>;
  getSessionAnalytics(sessionId: number): Promise<any>;
  
  // Course content management methods
  getCourseContent(courseId: number): Promise<any>;
  createVideoContent(videoData: any): Promise<any>;
  getVideoContent(courseId: number): Promise<any[]>;
  updateVideoAnalytics(videoId: number, userId: string, watchTime: number, progress: number): Promise<void>;
  getCourseContentAnalytics(courseId: number): Promise<any>;
  
  // Advanced content methods
  createAdvancedAssignment(assignmentData: any): Promise<any>;
  getAdvancedAssignment(assignmentId: number): Promise<any>;
  createAdvancedAssignmentSubmission(submissionData: any): Promise<any>;
  createAdvancedQuiz(quizData: any): Promise<any>;
  getAdvancedQuiz(quizId: number): Promise<any>;
  createAdvancedQuizAttempt(attemptData: any): Promise<any>;
  getAdvancedQuizAttempt(attemptId: number): Promise<any>;
  createAdvancedQuizAnswer(answerData: any): Promise<any>;
  updateAdvancedQuizAttempt(attemptId: number, updateData: any): Promise<any>;
  createCodeExecution(executionData: any): Promise<any>;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  upsertUser(userData: UpsertUser): Promise<User>;
  
  // System settings operations
  getSystemSetting(key: string): Promise<SystemSettings | undefined>;
  getSystemSettings(category?: string): Promise<SystemSettings[]>;
  updateSystemSetting(key: string, value: string, userId?: string): Promise<SystemSettings>;
  setDefaultSystemSettings(): Promise<void>;

  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(options?: { isPublished?: boolean; mentorId?: string }): Promise<Course[]>;
  createCourse(courseData: Omit<Course, "id">): Promise<Course>;
  updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Module operations
  getModule(id: number): Promise<Module | undefined>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createModule(moduleData: Omit<Module, "id">): Promise<Module>;
  updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;

  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  createLesson(lessonData: Omit<Lesson, "id">): Promise<Lesson>;
  updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;

  // Enrollment operations
  enrollUserInCourse(userId: string, courseId: number, paymentData?: any): Promise<any>;
  getUserEnrollments(userId: string): Promise<any[]>;
  getCourseEnrollments(courseId: number): Promise<any[]>;
  getAllEnrollments(): Promise<any[]>;
  updateEnrollmentProgress(userId: string, courseId: number, progress: number): Promise<any>;
  getEnrollmentDetails(userId: string, courseId: number): Promise<any>;

  // Mentor operations
  assignMentorToCourse(mentorId: string, courseId: number, commission?: number): Promise<any>;
  getMentorCourses(mentorId: string): Promise<Course[]>;
  getMentorStats(mentorId: string): Promise<any>;

  // Certificate operations
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByVerificationCode(code: string): Promise<Certificate | undefined>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  generateCertificate(certificateData: InsertCertificate): Promise<Certificate>;

  // Live Session operations
  createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession>;
  updateLiveSession(id: number, sessionData: Partial<LiveSession>): Promise<LiveSession | undefined>;
  getLiveSession(id: number): Promise<LiveSession | undefined>;
  getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]>;

  // Other operations for notifications, discussions, etc.
  // These will be implemented as needed
}

export class DatabaseStorage implements IStorage {
  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async getSystemSettings(category?: string): Promise<SystemSettings[]> {
    let query = db.select().from(systemSettings);
    
    if (category) {
      query = query.where(eq(systemSettings.category, category));
    }
    
    return await query;
  }

  async updateSystemSetting(key: string, value: string, userId?: string): Promise<SystemSettings> {
    const existingSetting = await this.getSystemSetting(key);
    
    if (existingSetting) {
      const [updatedSetting] = await db
        .update(systemSettings)
        .set({ 
          value, 
          updatedAt: new Date(),
          updatedBy: userId || null
        })
        .where(eq(systemSettings.key, key))
        .returning();
      
      return updatedSetting;
    } else {
      const [newSetting] = await db
        .insert(systemSettings)
        .values({
          key,
          value,
          category: key.includes('.') ? key.split('.')[0] : 'general',
          updatedBy: userId || null
        })
        .returning();
      
      return newSetting;
    }
  }

  async setDefaultSystemSettings(): Promise<void> {
    try {
      // Check if settings already exist
      const existingSettings = await this.getSystemSettings();
      
      if (existingSettings.length === 0) {
        // Set default currency to NGN (Nigerian Naira) as requested
        await this.updateSystemSetting('currency.default', Currency.NGN);
      
        // Set available currencies
        await this.updateSystemSetting('currency.available', 
          JSON.stringify([Currency.NGN, Currency.USD, Currency.GBP]));
          
        // Set mentor commission rate default
        await this.updateSystemSetting('commission.mentor.rate', '37');
        
        // Set affiliate commission rate default
        await this.updateSystemSetting('commission.affiliate.rate', '4');
      }
    } catch (error) {
      console.error('Error setting default system settings:', error);
      // Continue execution even if system settings fail
    }
    
    try {
      // Set exchange rates (these should be updated regularly in production)
      await this.updateSystemSetting('currency.exchangeRates', 
        JSON.stringify({
          "USD": 1,
          "GBP": 0.79,
          "NGN": 910.50
        }));
    } catch (error) {
      console.error('Error setting exchange rates:', error);
      // Continue execution even if exchange rates fail
    }
      
    try {
      // Set system name
      await this.updateSystemSetting('system.name', 'Codelab Educare LMS');
    } catch (error) {
      console.error('Error setting system name:', error);
    }
    
    try {
      // Set system timezone
      await this.updateSystemSetting('system.timezone', 'Africa/Lagos');
    } catch (error) {
      console.error('Error setting system timezone:', error);
    }
  }
  
  // Live Session Operations  
  async createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession> {
    const [session] = await db
      .insert(liveSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getLiveSessionsByCourse(courseId: number): Promise<LiveSession[]> {
    // Get sessions directly linked to the course OR linked through lessons
    
    // First, get sessions directly linked to the course
    const directSessions = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.courseId, courseId))
      .orderBy(asc(liveSessions.startTime));
    
    // Then, get sessions linked through lessons (for backward compatibility)
    const courseModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, courseId));
    
    let lessonSessions: any[] = [];
    
    if (courseModules.length > 0) {
      const moduleIds = courseModules.map(module => module.id);
      
      const moduleLessons = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds));
      
      if (moduleLessons.length > 0) {
        const lessonIds = moduleLessons.map(lesson => lesson.id);
        
        lessonSessions = await db
          .select()
          .from(liveSessions)
          .where(inArray(liveSessions.lessonId, lessonIds))
          .orderBy(asc(liveSessions.startTime));
      }
    }
    
    // Combine both types of sessions and remove duplicates
    const allSessions = [...directSessions, ...lessonSessions];
    const uniqueSessions = allSessions.filter((session, index, self) => 
      index === self.findIndex(s => s.id === session.id)
    );
    
    // Sort by start time
    return uniqueSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  
  async getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]> {
    const now = new Date();
    
    // If we have a courseId filter, we need to get the lessons for that course first
    if (options?.courseId) {
      // Get modules for the course
      const courseModules = await db
        .select()
        .from(modules)
        .where(eq(modules.courseId, options.courseId));
      
      if (courseModules.length === 0) {
        return [];
      }
      
      const moduleIds = courseModules.map(module => module.id);
      
      // Get lessons for these modules
      const moduleLessons = await db
        .select()
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds));
      
      if (moduleLessons.length === 0) {
        return [];
      }
      
      const lessonIds = moduleLessons.map(lesson => lesson.id);
      
      // Get upcoming live sessions for these lessons
      // Execute the sessions query with proper filters
      const sessions = await db
        .select()
        .from(liveSessions)
        .where(and(
          eq(liveSessions.status, "scheduled"),
          inArray(liveSessions.lessonId, lessonIds)
        ))
        .orderBy(asc(liveSessions.startTime))
        .limit(options.limit || 100);
      
      return sessions;
    }
    
    // If no courseId filter, get all upcoming sessions
    // Get all upcoming sessions
    const sessions = await db
      .select()
      .from(liveSessions)
      .where(
        eq(liveSessions.status, "scheduled")
      )
      .orderBy(asc(liveSessions.startTime))
      .limit(options?.limit || 100);
    
    return sessions;
  }
  
  async updateLiveSession(id: number, updates: Partial<LiveSession>): Promise<LiveSession> {
    const [session] = await db
      .update(liveSessions)
      .set(updates)
      .where(eq(liveSessions.id, id))
      .returning();
    return session;
  }
  
  async getLiveSession(id: number): Promise<LiveSession | undefined> {
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id));
    return session;
  }

  async getUpcomingSessionsForStudent(userId: string): Promise<LiveSession[]> {
    // Get courses the student is enrolled in
    const enrollments = await db
      .select({ courseId: courseEnrollments.courseId })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));
    
    if (enrollments.length === 0) {
      return [];
    }
    
    const courseIds = enrollments.map(e => e.courseId);
    const now = new Date();
    
    // Get upcoming sessions for enrolled courses
    const sessions = await db
      .select()
      .from(liveSessions)
      .where(
        and(
          inArray(liveSessions.courseId, courseIds),
          gte(liveSessions.startTime, now),
          eq(liveSessions.status, "scheduled")
        )
      )
      .orderBy(asc(liveSessions.startTime))
      .limit(10);
    
    return sessions;
  }

  async getLiveSessionsByMentor(mentorId: string): Promise<LiveSession[]> {
    const sessions = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.mentorId, mentorId))
      .orderBy(desc(liveSessions.startTime));
    
    return sessions;
  }

  async getAllLiveSessions(): Promise<LiveSession[]> {
    const sessions = await db
      .select()
      .from(liveSessions)
      .orderBy(asc(liveSessions.startTime));
    
    return sessions;
  }



  async enrollStudentsInSession(sessionId: number, courseId: number): Promise<void> {
    // This is a placeholder implementation
    // In a real system, you might want to create enrollment records
    // or send notifications to enrolled students
    console.log(`Enrolling students from course ${courseId} in session ${sessionId}`);
  }

  async getVideoProviderSettings(userId: string, provider: string): Promise<any> {
    const [settings] = await db
      .select()
      .from(videoProviderSettings)
      .where(and(
        eq(videoProviderSettings.userId, userId),
        eq(videoProviderSettings.provider, provider)
      ));
    
    return settings;
  }

  async getAllVideoProviderSettings(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(videoProviderSettings)
      .where(eq(videoProviderSettings.userId, userId));
  }

  async saveVideoProviderSettings(settingsData: any): Promise<any> {
    const existingSettings = await this.getVideoProviderSettings(settingsData.userId, settingsData.provider);
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db
        .update(videoProviderSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(and(
          eq(videoProviderSettings.userId, settingsData.userId),
          eq(videoProviderSettings.provider, settingsData.provider)
        ))
        .returning();
      
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(videoProviderSettings)
        .values(settingsData)
        .returning();
      
      return created;
    }
  }




  
  async getLiveSessionAttendees(sessionId: number): Promise<LiveSessionAttendance[]> {
    const attendees = await db
      .select()
      .from(liveSessionAttendance)
      .where(eq(liveSessionAttendance.sessionId, sessionId))
      .orderBy(asc(liveSessionAttendance.joinTime));
    
    return attendees;
  }
  
  async recordLiveSessionAttendance(data: { sessionId: number, userId: string, joinTime: Date, status: string }): Promise<LiveSessionAttendance> {
    // Check if the user already has attendance record for this session
    const [existingRecord] = await db
      .select()
      .from(liveSessionAttendance)
      .where(and(
        eq(liveSessionAttendance.sessionId, data.sessionId),
        eq(liveSessionAttendance.userId, data.userId)
      ));
    
    if (existingRecord) {
      // Update existing record
      const [updated] = await db
        .update(liveSessionAttendance)
        .set({ 
          status: data.status,
          lastActivity: new Date()
        })
        .where(eq(liveSessionAttendance.id, existingRecord.id))
        .returning();
      
      return updated;
    }
    
    // Create new attendance record
    const [attendance] = await db
      .insert(liveSessionAttendance)
      .values({
        sessionId: data.sessionId,
        userId: data.userId,
        joinTime: data.joinTime,
      })
      .returning();
    
    return attendance;
  }
  
  // Roll call functionality methods
  
  async initiateRollCall(sessionId: number, initiatedBy: string, expiresInMinutes: number = 5): Promise<any> {
    // First check if there's an active roll call for this session
    const [activeRollCall] = await db
      .select()
      .from(liveSessionRollCalls)
      .where(and(
        eq(liveSessionRollCalls.sessionId, sessionId),
        eq(liveSessionRollCalls.status, "active")
      ));
      
    if (activeRollCall) {
      return { success: false, message: "There is already an active roll call for this session", rollCall: activeRollCall };
    }
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Create a new roll call
    const [rollCall] = await db
      .insert(liveSessionRollCalls)
      .values({
        sessionId,
        initiatedBy,
        initiatedAt: new Date(),
        expiresAt,
        status: "active"
      })
      .returning();
    
    return { success: true, rollCall };
  }
  
  async respondToRollCall(rollCallId: number, userId: string, responseMethod: string = "app"): Promise<any> {
    // Check if roll call exists and is active
    const [rollCall] = await db
      .select()
      .from(liveSessionRollCalls)
      .where(eq(liveSessionRollCalls.id, rollCallId));
      
    if (!rollCall) {
      return { success: false, message: "Roll call not found" };
    }
    
    if (rollCall.status !== "active") {
      return { success: false, message: `This roll call is ${rollCall.status}` };
    }
    
    // Check if already responded
    const [existingResponse] = await db
      .select()
      .from(liveSessionRollCallResponses)
      .where(and(
        eq(liveSessionRollCallResponses.rollCallId, rollCallId),
        eq(liveSessionRollCallResponses.userId, userId)
      ));
      
    if (existingResponse) {
      return { success: false, message: "You have already responded to this roll call", response: existingResponse };
    }
    
    // Record response
    const [response] = await db
      .insert(liveSessionRollCallResponses)
      .values({
        rollCallId,
        userId,
        responseTime: new Date(),
        responseMethod
      })
      .returning();
    
    // Update attendance record to mark as responded to roll call
    await db
      .update(liveSessionAttendance)
      .set({ respondedToRollCall: true })
      .where(and(
        eq(liveSessionAttendance.sessionId, rollCall.sessionId),
        eq(liveSessionAttendance.userId, userId)
      ));
    
    return { success: true, response };
  }
  
  async getRollCallResponses(rollCallId: number): Promise<any> {
    const responses = await db
      .select({
        response: liveSessionRollCallResponses,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(liveSessionRollCallResponses)
      .leftJoin(users, eq(liveSessionRollCallResponses.userId, users.id))
      .where(eq(liveSessionRollCallResponses.rollCallId, rollCallId))
      .orderBy(asc(liveSessionRollCallResponses.responseTime));
      
    return responses;
  }
  
  async endRollCall(rollCallId: number): Promise<any> {
    const [rollCall] = await db
      .update(liveSessionRollCalls)
      .set({ 
        status: "expired",
        updatedAt: new Date()
      })
      .where(eq(liveSessionRollCalls.id, rollCallId))
      .returning();
      
    return rollCall;
  }
  
  async updateSessionNotes(sessionId: number, notes: string): Promise<any> {
    const [session] = await db
      .update(liveSessions)
      .set({ 
        notes,
        updatedAt: new Date()
      })
      .where(eq(liveSessions.id, sessionId))
      .returning();
      
    return session;
  }
  
  async updateAttendanceNotes(attendanceId: number, notes: string, participationLevel?: string): Promise<any> {
    const updateData: any = { 
      notes,
      updatedAt: new Date()
    };
    
    if (participationLevel) {
      updateData.participationLevel = participationLevel;
    }
    
    const [attendance] = await db
      .update(liveSessionAttendance)
      .set(updateData)
      .where(eq(liveSessionAttendance.id, attendanceId))
      .returning();
      
    return attendance;
  }
  
  async submitSessionFeedback(attendanceId: number, feedback: string): Promise<any> {
    const [attendance] = await db
      .update(liveSessionAttendance)
      .set({ 
        feedback,
        updatedAt: new Date()
      })
      .where(eq(liveSessionAttendance.id, attendanceId))
      .returning();
      
    return attendance;
  }
  
  // This is replaced by the more detailed recordLiveSessionAttendance method
  // We're keeping this method for backward compatibility
  async recordAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance> {
    return this.recordLiveSessionAttendance({
      sessionId: attendanceData.sessionId,
      userId: attendanceData.userId,
      joinTime: attendanceData.joinTime || new Date(),
      status: attendanceData.status || "present"
    });
  }


  
  async getLiveSessionAttendance(sessionId: number): Promise<LiveSessionAttendance[]> {
    return db
      .select()
      .from(liveSessionAttendance)
      .where(eq(liveSessionAttendance.sessionId, sessionId));
  }
  
  async getLiveSessionAttendanceByUser(userId: string): Promise<LiveSessionAttendance[]> {
    return db
      .select()
      .from(liveSessionAttendance)
      .where(eq(liveSessionAttendance.userId, userId))
      .orderBy(desc(liveSessionAttendance.createdAt));
  }
  // Communication - Conversations


  async getConversation(conversationId: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    return conversation;
  }







  async deleteConversation(conversationId: number): Promise<void> {
    // First delete all participants
    await db
      .delete(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
    
    // Then delete all messages
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));
    
    // Finally delete the conversation
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));
  }

  // Communication - Participants
  async addParticipantToConversation(participantData: InsertConversationParticipant): Promise<ConversationParticipant> {
    // Check if participant already exists
    const [existingParticipant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, participantData.conversationId),
          eq(conversationParticipants.userId, participantData.userId)
        )
      );
    
    if (existingParticipant) {
      return existingParticipant;
    }
    
    const [participant] = await db
      .insert(conversationParticipants)
      .values(participantData)
      .returning();
    
    return participant;
  }

  async removeParticipantFromConversation(conversationId: number, userId: string): Promise<void> {
    await db
      .delete(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
  }

  async updateLastReadMessage(conversationId: number, userId: string, messageId: number): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ lastReadMessageId: messageId })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  // Communication - Messages
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    
    return message;
  }

  async getChatMessage(messageId: number): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));
    
    return message;
  }

  async getChatMessages(conversationId: number, options?: { limit?: number, before?: number }): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.sentAt));
    
    if (options?.before) {
      query = query.where(lt(chatMessages.id, options.before));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async updateChatMessage(messageId: number, content: string): Promise<ChatMessage> {
    const [message] = await db
      .update(chatMessages)
      .set({
        content,
        isEdited: true,
        editedAt: new Date()
      })
      .where(eq(chatMessages.id, messageId))
      .returning();
    
    return message;
  }

  async getUserMessages(userId: string): Promise<any[]> {
    try {
      // Get all conversations the user is part of
      const userConversations = await this.getUserConversations(userId);
      const conversationIds = userConversations.map(c => c.id);
      
      if (conversationIds.length === 0) {
        return [];
      }
      
      // Get messages from all these conversations
      const messages = await db
        .select({
          id: chatMessages.id,
          conversationId: chatMessages.conversationId,
          senderId: chatMessages.senderId,
          content: chatMessages.content,
          sentAt: chatMessages.sentAt,
          isRead: chatMessages.isRead,
          isEdited: chatMessages.isEdited,
          editedAt: chatMessages.editedAt
        })
        .from(chatMessages)
        .where(inArray(chatMessages.conversationId, conversationIds))
        .orderBy(desc(chatMessages.sentAt));
      
      // Get conversation details to include with each message
      const enhancedMessages = await Promise.all(
        messages.map(async (message) => {
          const conversation = userConversations.find(c => c.id === message.conversationId);
          return {
            ...message,
            conversationTitle: conversation?.title || 'Untitled Conversation',
            isPrivate: conversation?.isPrivate || false,
            participantCount: conversation?.participantCount || 0
          };
        })
      );
      
      return enhancedMessages;
    } catch (error) {
      console.error("Error fetching user messages:", error);
      return [];
    }
  }

  async deleteChatMessage(messageId: number): Promise<void> {
    // First delete all reactions
    await db
      .delete(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
    
    // Then delete the message
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, messageId));
  }

  // Communication - Reactions
  async addMessageReaction(reactionData: InsertMessageReaction): Promise<MessageReaction> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, reactionData.messageId),
          eq(messageReactions.userId, reactionData.userId),
          eq(messageReactions.reaction, reactionData.reaction)
        )
      );
    
    if (existingReaction) {
      return existingReaction;
    }
    
    const [reaction] = await db
      .insert(messageReactions)
      .values(reactionData)
      .returning();
    
    return reaction;
  }

  async removeMessageReaction(messageId: number, userId: string, reaction: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.reaction, reaction)
        )
      );
  }

  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
  }

  // Announcements
  async createCourseAnnouncement(announcementData: InsertCourseAnnouncement): Promise<CourseAnnouncement> {
    const [announcement] = await db
      .insert(courseAnnouncements)
      .values(announcementData)
      .returning();
    
    return announcement;
  }

  async getCourseAnnouncement(announcementId: number): Promise<CourseAnnouncement | undefined> {
    const [announcement] = await db
      .select()
      .from(courseAnnouncements)
      .where(eq(courseAnnouncements.id, announcementId));
    
    return announcement;
  }

  async updateCourseAnnouncement(announcementId: number, updateData: Partial<CourseAnnouncement>): Promise<CourseAnnouncement> {
    const [announcement] = await db
      .update(courseAnnouncements)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(courseAnnouncements.id, announcementId))
      .returning();
    
    return announcement;
  }

  async getCourseAnnouncementsByCourse(courseId: number): Promise<CourseAnnouncement[]> {
    return db
      .select()
      .from(courseAnnouncements)
      .where(eq(courseAnnouncements.courseId, courseId))
      .orderBy(desc(courseAnnouncements.publishedAt));
  }

  async getCourseAnnouncementsByUser(userId: string): Promise<CourseAnnouncement[]> {
    return db
      .select()
      .from(courseAnnouncements)
      .where(eq(courseAnnouncements.authorId, userId))
      .orderBy(desc(courseAnnouncements.publishedAt));
  }

  async deleteCourseAnnouncement(announcementId: number): Promise<void> {
    await db
      .delete(courseAnnouncements)
      .where(eq(courseAnnouncements.id, announcementId));
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      return allUsers;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }

  
  async createUser(userData: any): Promise<User> {
    try {
      
      // Create the user
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id || String(Date.now()),
          email: userData.email,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "student",
          profileImageUrl: userData.profileImageUrl || "",
          bio: userData.bio || "",
          // Additional fields as needed
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }





  // Interactive coding exercises
  async createCodingExercise(exerciseData: Omit<CodingExercise, "id" | "createdAt" | "updatedAt">): Promise<CodingExercise> {
    try {
      const [exercise] = await db
        .insert(codingExercises)
        .values({
          ...exerciseData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return exercise;
    } catch (error) {
      console.error("Error creating coding exercise:", error);
      throw error;
    }
  }

  async getCodingExercise(exerciseId: number): Promise<CodingExercise | undefined> {
    try {
      const [exercise] = await db
        .select()
        .from(codingExercises)
        .where(eq(codingExercises.id, exerciseId));
      return exercise;
    } catch (error) {
      console.error("Error fetching coding exercise:", error);
      return undefined;
    }
  }

  async getCodingExercises(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<CodingExercise[]> {
    try {
      let query = db.select().from(codingExercises);
      
      if (options) {
        if (options.courseId) {
          query = query.where(eq(codingExercises.courseId, options.courseId));
        }
        if (options.moduleId) {
          query = query.where(eq(codingExercises.moduleId, options.moduleId));
        }
        if (options.lessonId) {
          query = query.where(eq(codingExercises.lessonId, options.lessonId));
        }
      }
      
      return await query;
    } catch (error) {
      console.error("Error fetching coding exercises:", error);
      return [];
    }
  }

  async updateCodingExercise(exerciseId: number, updateData: Partial<CodingExercise>): Promise<CodingExercise> {
    try {
      const [exercise] = await db
        .update(codingExercises)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(codingExercises.id, exerciseId))
        .returning();
      return exercise;
    } catch (error) {
      console.error("Error updating coding exercise:", error);
      throw error;
    }
  }

  // Exercise progress tracking methods
  async getExerciseProgress(exerciseId: number, userId: string): Promise<ExerciseProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(exerciseProgress)
        .where(
          and(
            eq(exerciseProgress.exerciseId, exerciseId),
            eq(exerciseProgress.userId, userId)
          )
        );
      return progress;
    } catch (error) {
      console.error("Error fetching exercise progress:", error);
      return undefined;
    }
  }

  async updateExerciseProgress(
    exerciseId: number, 
    userId: string, 
    progressData: Partial<ExerciseProgress>
  ): Promise<ExerciseProgress> {
    try {
      // First check if progress exists
      const existingProgress = await this.getExerciseProgress(exerciseId, userId);
      
      let progress: ExerciseProgress;
      
      if (existingProgress) {
        // Update existing progress
        const [updatedProgress] = await db
          .update(exerciseProgress)
          .set({
            ...progressData,
            lastAttemptAt: new Date(),
            attemptCount: progressData.attemptCount !== undefined ? 
              progressData.attemptCount : 
              existingProgress.attemptCount + 1
          })
          .where(
            and(
              eq(exerciseProgress.exerciseId, exerciseId),
              eq(exerciseProgress.userId, userId)
            )
          )
          .returning();
        
        progress = updatedProgress;
      } else {
        // Create new progress
        const [newProgress] = await db
          .insert(exerciseProgress)
          .values({
            exerciseId,
            userId,
            status: progressData.status || "in_progress",
            currentCode: progressData.currentCode,
            lastAttemptAt: new Date(),
            attemptCount: 1,
            hintsUsed: progressData.hintsUsed || 0,
            timeSpent: progressData.timeSpent || 0,
          })
          .returning();
        
        progress = newProgress;
      }
      
      return progress;
    } catch (error) {
      console.error("Error updating exercise progress:", error);
      throw error;
    }
  }

  async getUserExerciseProgress(userId: string): Promise<ExerciseProgress[]> {
    try {
      const progress = await db
        .select({
          id: exerciseProgress.id,
          exerciseId: exerciseProgress.exerciseId,
          userId: exerciseProgress.userId,
          status: exerciseProgress.status,
          currentCode: exerciseProgress.currentCode,
          lastAttemptAt: exerciseProgress.lastAttemptAt,
          completedAt: exerciseProgress.completedAt,
          attemptCount: exerciseProgress.attemptCount,
          hintsUsed: exerciseProgress.hintsUsed,
          timeSpent: exerciseProgress.timeSpent,
          exercise: {
            id: codingExercises.id,
            title: codingExercises.title,
            difficulty: codingExercises.difficulty,
            language: codingExercises.language,
            courseId: codingExercises.courseId,
            moduleId: codingExercises.moduleId,
            lessonId: codingExercises.lessonId,
          }
        })
        .from(exerciseProgress)
        .leftJoin(codingExercises, eq(exerciseProgress.exerciseId, codingExercises.id))
        .where(eq(exerciseProgress.userId, userId));
      
      return progress;
    } catch (error) {
      console.error("Error fetching user exercise progress:", error);
      return [];
    }
  }

  async getCodingExercisesCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(codingExercises);
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error("Error counting coding exercises:", error);
      return 0;
    }
  }

  async getCodingExercisesByDifficulty(): Promise<Record<string, number>> {
    try {
      const result = await db
        .select({
          difficulty: codingExercises.difficulty,
          count: sql`count(*)`,
        })
        .from(codingExercises)
        .groupBy(codingExercises.difficulty);

      const countByDifficulty: Record<string, number> = {};
      for (const row of result) {
        countByDifficulty[row.difficulty] = Number(row.count);
      }
      return countByDifficulty;
    } catch (error) {
      console.error("Error counting exercises by difficulty:", error);
      return {};
    }
  }

  async getExerciseStatsByCourse(courseId: number): Promise<any[]> {
    try {
      // Get all exercises for this course
      const exercises = await db
        .select()
        .from(codingExercises)
        .where(eq(codingExercises.courseId, courseId));
      
      if (exercises.length === 0) {
        return [];
      }
      
      const exerciseIds = exercises.map(ex => ex.id);
      
      // Get all progress entries for these exercises
      const allProgress = await db
        .select({
          exerciseId: exerciseProgress.exerciseId,
          status: exerciseProgress.status,
          attemptCount: exerciseProgress.attemptCount,
          completedAt: exerciseProgress.completedAt,
        })
        .from(exerciseProgress)
        .where(inArray(exerciseProgress.exerciseId, exerciseIds));
      
      // Organize stats by exercise
      const stats = exercises.map(exercise => {
        const exerciseProgress = allProgress.filter(p => p.exerciseId === exercise.id);
        
        const totalAttempts = exerciseProgress.length;
        const completedCount = exerciseProgress.filter(p => p.status === "completed").length;
        const inProgressCount = exerciseProgress.filter(p => p.status === "in_progress").length;
        const notStartedCount = 0; // This is implied rather than stored
        
        const avgAttempts = totalAttempts > 0 
          ? exerciseProgress.reduce((sum, p) => sum + p.attemptCount, 0) / totalAttempts 
          : 0;
        
        return {
          exerciseId: exercise.id,
          title: exercise.title,
          difficulty: exercise.difficulty,
          language: exercise.language,
          totalAttempts,
          completedCount,
          inProgressCount,
          notStartedCount,
          avgAttempts,
          completionRate: totalAttempts > 0 ? (completedCount / totalAttempts) * 100 : 0,
        };
      });
      
      return stats;
    } catch (error) {
      console.error("Error fetching exercise stats by course:", error);
      return [];
    }
  }

  async getExerciseStatsByMentor(mentorId: string): Promise<any[]> {
    try {
      // Get courses taught by this mentor
      const mentorCourseIds = await db
        .select({ courseId: mentorCourses.courseId })
        .from(mentorCourses)
        .where(eq(mentorCourses.mentorId, mentorId));
      
      const courseIds = mentorCourseIds.map(mc => mc.courseId);
      
      if (courseIds.length === 0) {
        return [];
      }
      
      // Combine stats from all courses
      const allStats = [];
      for (const courseId of courseIds) {
        const courseStats = await this.getExerciseStatsByCourse(courseId);
        allStats.push(...courseStats);
      }
      
      return allStats;
    } catch (error) {
      console.error("Error fetching exercise stats by mentor:", error);
      return [];
    }
  }

  // Course Content Management Methods
  async getCourseContent(courseId: number): Promise<any> {
    try {
      // Get all content types for the course
      const videos = await this.getVideoContent(courseId);
      const assignments = await db.select().from(assignments).where(eq(assignments.courseId, courseId));
      const quizzes = await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
      const exercises = await this.getCodingExercises({ courseId });
      
      return {
        videos: videos || [],
        assignments: assignments || [],
        quizzes: quizzes || [],
        exercises: exercises || []
      };
    } catch (error) {
      console.error("Error fetching course content:", error);
      return { videos: [], assignments: [], quizzes: [], exercises: [] };
    }
  }

  async createVideoContent(videoData: any): Promise<any> {
    try {
      const [video] = await db
        .insert(lessons)
        .values({
          ...videoData,
          type: 'video',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return video;
    } catch (error) {
      console.error("Error creating video content:", error);
      throw error;
    }
  }

  async getVideoContent(courseId: number): Promise<any[]> {
    try {
      const videos = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, courseId));
      return videos;
    } catch (error) {
      console.error("Error fetching video content:", error);
      return [];
    }
  }

  async updateVideoAnalytics(videoId: number, userId: string, watchTime: number, progress: number): Promise<void> {
    try {
      // Update or create lesson progress
      await this.updateLessonProgress(videoId, userId, {
        status: progress >= 100 ? 'completed' : 'in_progress',
        completionPercentage: progress,
        timeSpent: watchTime,
        lastAccessedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating video analytics:", error);
    }
  }

  async getCourseContentAnalytics(courseId: number): Promise<any> {
    try {
      // Get content engagement analytics
      const totalVideos = await db.select({ count: sql`count(*)` }).from(lessons)
        .where(and(eq(lessons.courseId, courseId), eq(lessons.type, 'video')));
      
      const totalAssignments = await db.select({ count: sql`count(*)` }).from(assignments)
        .where(eq(assignments.courseId, courseId));
        
      const totalQuizzes = await db.select({ count: sql`count(*)` }).from(quizzes)
        .where(eq(quizzes.courseId, courseId));
        
      const totalExercises = await db.select({ count: sql`count(*)` }).from(codingExercises)
        .where(eq(codingExercises.courseId, courseId));

      return {
        totalVideos: Number(totalVideos[0]?.count || 0),
        totalAssignments: Number(totalAssignments[0]?.count || 0),
        totalQuizzes: Number(totalQuizzes[0]?.count || 0),
        totalExercises: Number(totalExercises[0]?.count || 0)
      };
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      return { totalVideos: 0, totalAssignments: 0, totalQuizzes: 0, totalExercises: 0 };
    }
  }

  // Advanced Assignment Methods
  async createAdvancedAssignment(assignmentData: any): Promise<any> {
    try {
      const [assignment] = await db
        .insert(assignments)
        .values({
          ...assignmentData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return assignment;
    } catch (error) {
      console.error("Error creating advanced assignment:", error);
      throw error;
    }
  }

  async getAdvancedAssignment(assignmentId: number): Promise<any> {
    try {
      const [assignment] = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, assignmentId));
      return assignment;
    } catch (error) {
      console.error("Error fetching advanced assignment:", error);
      return undefined;
    }
  }

  async createAdvancedAssignmentSubmission(submissionData: any): Promise<any> {
    try {
      const [submission] = await db
        .insert(assignmentSubmissions)
        .values({
          ...submissionData,
          submittedAt: new Date()
        })
        .returning();
      return submission;
    } catch (error) {
      console.error("Error creating assignment submission:", error);
      throw error;
    }
  }

  // Advanced Quiz Methods
  async createAdvancedQuiz(quizData: any): Promise<any> {
    try {
      const [quiz] = await db
        .insert(quizzes)
        .values({
          ...quizData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return quiz;
    } catch (error) {
      console.error("Error creating advanced quiz:", error);
      throw error;
    }
  }

  async getAdvancedQuiz(quizId: number): Promise<any> {
    try {
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId));
      return quiz;
    } catch (error) {
      console.error("Error fetching advanced quiz:", error);
      return undefined;
    }
  }

  async createAdvancedQuizAttempt(attemptData: any): Promise<any> {
    try {
      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          ...attemptData,
          startedAt: new Date()
        })
        .returning();
      return attempt;
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      throw error;
    }
  }

  async getAdvancedQuizAttempt(attemptId: number): Promise<any> {
    try {
      const [attempt] = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.id, attemptId));
      return attempt;
    } catch (error) {
      console.error("Error fetching quiz attempt:", error);
      return undefined;
    }
  }

  async createAdvancedQuizQuestion(questionData: any): Promise<any> {
    try {
      const [question] = await db
        .insert(advancedQuizQuestions)
        .values(questionData)
        .returning();
      return question;
    } catch (error) {
      console.error("Error creating advanced quiz question:", error);
      throw error;
    }
  }

  async createAdvancedQuizAnswer(answerData: any): Promise<any> {
    try {
      // Create quiz answer record (implement based on your schema)
      return { id: Date.now(), ...answerData };
    } catch (error) {
      console.error("Error creating quiz answer:", error);
      throw error;
    }
  }

  async updateAdvancedQuizAttempt(attemptId: number, updateData: any): Promise<any> {
    try {
      const [attempt] = await db
        .update(quizAttempts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();
      return attempt;
    } catch (error) {
      console.error("Error updating quiz attempt:", error);
      throw error;
    }
  }

  async createCodeExecution(executionData: any): Promise<any> {
    try {
      // Create code execution record
      return { 
        id: Date.now(), 
        ...executionData,
        executedAt: new Date(),
        status: 'completed'
      };
    } catch (error) {
      console.error("Error creating code execution:", error);
      throw error;
    }
  }

  // Enhanced Live Session Methods with Video Conferencing







  // Session Attendance Methods
  async recordSessionAttendance(attendanceData: any): Promise<any> {
    try {
      const [attendance] = await db
        .insert(liveSessionAttendance)
        .values({
          ...attendanceData,
          createdAt: new Date()
        })
        .returning();
      return attendance;
    } catch (error) {
      console.error("Error recording session attendance:", error);
      throw error;
    }
  }

  async updateSessionAttendance(sessionId: number, userId: string, updateData: any): Promise<any> {
    try {
      const [attendance] = await db
        .update(liveSessionAttendance)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(and(
          eq(liveSessionAttendance.sessionId, sessionId),
          eq(liveSessionAttendance.userId, userId)
        ))
        .returning();
      return attendance;
    } catch (error) {
      console.error("Error updating session attendance:", error);
      throw error;
    }
  }

  async getSessionAttendance(sessionId: number): Promise<any[]> {
    try {
      const attendance = await db
        .select({
          id: liveSessionAttendance.id,
          userId: liveSessionAttendance.userId,
          status: liveSessionAttendance.status,
          joinTime: liveSessionAttendance.joinTime,
          leaveTime: liveSessionAttendance.leave_time,
          userName: sql`${users.firstName} || ' ' || ${users.lastName}`,
          userEmail: users.email,
          userRole: users.role
        })
        .from(liveSessionAttendance)
        .leftJoin(users, eq(liveSessionAttendance.userId, users.id))
        .where(eq(liveSessionAttendance.sessionId, sessionId));
      return attendance;
    } catch (error) {
      console.error("Error fetching session attendance:", error);
      return [];
    }
  }

  async getActiveSessionAttendance(sessionId: number): Promise<any[]> {
    try {
      const attendance = await db
        .select()
        .from(liveSessionAttendance)
        .where(and(
          eq(liveSessionAttendance.sessionId, sessionId),
          eq(liveSessionAttendance.status, 'joined'),
          isNull(liveSessionAttendance.leaveTime)
        ));
      return attendance;
    } catch (error) {
      console.error("Error fetching active session attendance:", error);
      return [];
    }
  }

  // Interactive Features Methods
  async createSessionPoll(pollData: any): Promise<any> {
    try {
      const [poll] = await db
        .insert(liveSessionPolls)
        .values({
          ...pollData,
          createdAt: new Date()
        })
        .returning();
      return poll;
    } catch (error) {
      console.error("Error creating session poll:", error);
      throw error;
    }
  }

  async submitPollResponse(responseData: any): Promise<any> {
    try {
      const [response] = await db
        .insert(liveSessionPollResponses)
        .values({
          ...responseData,
          submittedAt: new Date()
        })
        .returning();
      return response;
    } catch (error) {
      console.error("Error submitting poll response:", error);
      throw error;
    }
  }

  async getPollResults(pollId: number): Promise<any> {
    try {
      const responses = await db
        .select({
          answer: liveSessionPollResponses.answer,
          count: sql`count(*)`,
        })
        .from(liveSessionPollResponses)
        .where(eq(liveSessionPollResponses.pollId, pollId))
        .groupBy(liveSessionPollResponses.answer);
      
      return {
        pollId,
        totalResponses: responses.reduce((sum, r) => sum + Number(r.count), 0),
        results: responses.map(r => ({
          answer: r.answer,
          count: Number(r.count)
        }))
      };
    } catch (error) {
      console.error("Error fetching poll results:", error);
      return { pollId, totalResponses: 0, results: [] };
    }
  }

  async createSessionQuestion(questionData: any): Promise<any> {
    try {
      const [question] = await db
        .insert(liveSessionQA)
        .values({
          ...questionData,
          askedAt: new Date()
        })
        .returning();
      return question;
    } catch (error) {
      console.error("Error creating session question:", error);
      throw error;
    }
  }

  async answerSessionQuestion(questionId: number, answerData: any): Promise<any> {
    try {
      const [question] = await db
        .update(liveSessionQA)
        .set({
          ...answerData,
          answeredAt: new Date()
        })
        .where(eq(liveSessionQA.id, questionId))
        .returning();
      return question;
    } catch (error) {
      console.error("Error answering session question:", error);
      throw error;
    }
  }

  async getSessionQuestions(sessionId: number): Promise<any[]> {
    try {
      const questions = await db
        .select({
          id: liveSessionQA.id,
          question: liveSessionQA.question,
          answer: liveSessionQA.answer,
          askedAt: liveSessionQA.askedAt,
          answeredAt: liveSessionQA.answeredAt,
          askedByName: sql`${users.firstName} || ' ' || ${users.lastName}`,
          isAnswered: sql`${liveSessionQA.answer} IS NOT NULL`
        })
        .from(liveSessionQA)
        .leftJoin(users, eq(liveSessionQA.askedBy, users.id))
        .where(eq(liveSessionQA.sessionId, sessionId))
        .orderBy(desc(liveSessionQA.askedAt));
      return questions;
    } catch (error) {
      console.error("Error fetching session questions:", error);
      return [];
    }
  }

  async createSessionMessage(messageData: any): Promise<any> {
    try {
      const [message] = await db
        .insert(liveSessionMessages)
        .values({
          ...messageData,
          sentAt: new Date()
        })
        .returning();
      return message;
    } catch (error) {
      console.error("Error creating session message:", error);
      throw error;
    }
  }

  async getSessionMessages(sessionId: number, options?: { limit?: number; before?: number }): Promise<any[]> {
    try {
      let query = db
        .select({
          id: liveSessionMessages.id,
          message: liveSessionMessages.message,
          sentAt: liveSessionMessages.sentAt,
          senderName: sql`${users.firstName} || ' ' || ${users.lastName}`,
          senderRole: users.role
        })
        .from(liveSessionMessages)
        .leftJoin(users, eq(liveSessionMessages.senderId, users.id))
        .where(eq(liveSessionMessages.sessionId, sessionId));

      if (options?.before) {
        query = query.where(lt(liveSessionMessages.id, options.before));
      }

      query = query.orderBy(desc(liveSessionMessages.sentAt));

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return await query;
    } catch (error) {
      console.error("Error fetching session messages:", error);
      return [];
    }
  }

  async getSessionAnalytics(sessionId: number): Promise<any> {
    try {
      const session = await this.getLiveSession(sessionId);
      const attendance = await this.getSessionAttendance(sessionId);
      
      const totalAttendees = attendance.length;
      const averageAttendanceTime = attendance.reduce((sum, a) => {
        if (a.joinTime && a.leaveTime) {
          return sum + (new Date(a.leaveTime).getTime() - new Date(a.joinTime).getTime());
        }
        return sum;
      }, 0) / totalAttendees || 0;

      const questionsCount = await db
        .select({ count: sql`count(*)` })
        .from(liveSessionQA)
        .where(eq(liveSessionQA.sessionId, sessionId));

      const pollsCount = await db
        .select({ count: sql`count(*)` })
        .from(liveSessionPolls)
        .where(eq(liveSessionPolls.sessionId, sessionId));

      return {
        sessionId,
        totalAttendees,
        averageAttendanceTime: Math.round(averageAttendanceTime / 1000 / 60), // minutes
        questionsAsked: Number(questionsCount[0]?.count || 0),
        pollsCreated: Number(pollsCount[0]?.count || 0),
        sessionDuration: session?.actualEndTime && session?.actualStartTime 
          ? Math.round((new Date(session.actualEndTime).getTime() - new Date(session.actualStartTime).getTime()) / 1000 / 60)
          : 0
      };
    } catch (error) {
      console.error("Error fetching session analytics:", error);
      return { sessionId, totalAttendees: 0, averageAttendanceTime: 0, questionsAsked: 0, pollsCreated: 0, sessionDuration: 0 };
    }
  }

  // Lesson operations for content features
  async getLesson(lessonId: number): Promise<Lesson | undefined> {
    try {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId));
      return lesson;
    } catch (error) {
      console.error("Error fetching lesson:", error);
      return undefined;
    }
  }

  // Quiz operations
  async createQuiz(quizData: Omit<Quiz, "id">): Promise<Quiz> {
    try {
      const [quiz] = await db
        .insert(quizzes)
        .values(quizData)
        .returning();
      return quiz;
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw new Error("Failed to create quiz");
    }
  }

  async getQuiz(quizId: number): Promise<Quiz | undefined> {
    try {
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId));
      return quiz;
    } catch (error) {
      console.error("Error fetching quiz:", error);
      return undefined;
    }
  }

  async updateQuiz(quizId: number, quizData: Partial<Quiz>): Promise<Quiz> {
    try {
      const [updatedQuiz] = await db
        .update(quizzes)
        .set(quizData)
        .where(eq(quizzes.id, quizId))
        .returning();
      return updatedQuiz;
    } catch (error) {
      console.error("Error updating quiz:", error);
      throw new Error("Failed to update quiz");
    }
  }

  async getQuizzes(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<Quiz[]> {
    try {
      let query = db.select().from(quizzes);
      
      if (options?.lessonId) {
        query = query.where(eq(quizzes.lessonId, options.lessonId));
      } else if (options?.moduleId) {
        // Get all lessons in the module, then filter quizzes by those lesson IDs
        const moduleLesson = await db
          .select({ id: lessons.id })
          .from(lessons)
          .where(eq(lessons.moduleId, options.moduleId));
        
        const lessonIds = moduleLesson.map(l => l.id);
        
        if (lessonIds.length > 0) {
          query = query.where(inArray(quizzes.lessonId, lessonIds));
        }
      } else if (options?.courseId) {
        // Get all modules in the course
        const courseModules = await db
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.courseId, options.courseId));
        
        const moduleIds = courseModules.map(m => m.id);
        
        if (moduleIds.length > 0) {
          // Get all lessons in those modules
          const moduleLessons = await db
            .select({ id: lessons.id })
            .from(lessons)
            .where(inArray(lessons.moduleId, moduleIds));
          
          const lessonIds = moduleLessons.map(l => l.id);
          
          if (lessonIds.length > 0) {
            query = query.where(inArray(quizzes.lessonId, lessonIds));
          }
        }
      }
      
      return await query;
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  }

  async getQuizzesByMentor(mentorId: string): Promise<any[]> {
    try {
      // Get courses taught by this mentor
      const mentorCourseList = await db
        .select({ courseId: mentorCourses.courseId })
        .from(mentorCourses)
        .where(eq(mentorCourses.mentorId, mentorId));
      
      const courseIds = mentorCourseList.map(mc => mc.courseId);
      
      if (courseIds.length === 0) {
        return [];
      }
      
      // Get all quizzes from these courses with lesson relationship data
      const allQuizzes = await db
        .select({
          id: quizzes.id,
          lessonId: quizzes.lessonId,
          title: quizzes.title,
          description: quizzes.description,
          passingScore: quizzes.passingScore,
          lesson: {
            id: lessons.id,
            moduleId: lessons.moduleId,
            title: lessons.title,
            courseId: modules.courseId
          }
        })
        .from(quizzes)
        .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .where(inArray(modules.courseId, courseIds));
      
      return allQuizzes;
    } catch (error) {
      console.error("Error fetching mentor quizzes:", error);
      return [];
    }
  }

  async getQuizzesByLesson(lessonId: number): Promise<Quiz[]> {
    try {
      return await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.lessonId, lessonId));
    } catch (error) {
      console.error("Error fetching lesson quizzes:", error);
      return [];
    }
  }

  async addQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    try {
      const [question] = await db
        .insert(quizQuestions)
        .values(questionData)
        .returning();
      return question;
    } catch (error) {
      console.error("Error adding quiz question:", error);
      throw new Error("Failed to add quiz question");
    }
  }

  async updateQuizQuestion(questionId: number, questionData: Partial<QuizQuestion>): Promise<QuizQuestion> {
    try {
      const [updatedQuestion] = await db
        .update(quizQuestions)
        .set(questionData)
        .where(eq(quizQuestions.id, questionId))
        .returning();
      return updatedQuestion;
    } catch (error) {
      console.error("Error updating quiz question:", error);
      throw new Error("Failed to update quiz question");
    }
  }

  async deleteQuizQuestion(questionId: number): Promise<void> {
    try {
      await db
        .delete(quizQuestions)
        .where(eq(quizQuestions.id, questionId));
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      throw new Error("Failed to delete quiz question");
    }
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    try {
      return await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quizId))
        .orderBy(quizQuestions.orderIndex);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  }

  async submitQuizAttempt(attemptData: Omit<QuizAttempt, "id" | "startedAt" | "completedAt">): Promise<QuizAttempt> {
    try {
      const now = new Date();
      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          ...attemptData,
          startedAt: now,
          completedAt: now
        })
        .returning();
      return attempt;
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      throw new Error("Failed to submit quiz attempt");
    }
  }

  async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    try {
      return await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.quizId, quizId))
        .orderBy(desc(quizAttempts.completedAt));
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      return [];
    }
  }



  // New quiz attempt methods for quiz-taking system
  async startQuizAttempt(userId: string, quizId: number): Promise<any> {
    try {
      // Get quiz info to determine max score
      const quiz = await this.getQuiz(quizId);
      const questions = await this.getQuizQuestions(quizId);
      const maxScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);

      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          quizId,
          userId,
          score: 0,
          maxScore,
          percentage: 0,
          answers: [],
          startedAt: new Date(),
          status: 'in_progress'
        })
        .returning();
      
      return attempt;
    } catch (error) {
      console.error("Error starting quiz attempt:", error);
      throw new Error("Failed to start quiz attempt");
    }
  }

  async getActiveQuizAttempt(userId: string, quizId: number): Promise<any> {
    try {
      const [attempt] = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            eq(quizAttempts.quizId, quizId),
            eq(quizAttempts.status, 'in_progress')
          )
        );
      
      return attempt;
    } catch (error) {
      console.error("Error getting active quiz attempt:", error);
      return null;
    }
  }

  async getQuizAttemptById(attemptId: number): Promise<any> {
    try {
      const [attempt] = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.id, attemptId));
      
      return attempt;
    } catch (error) {
      console.error("Error getting quiz attempt by ID:", error);
      return null;
    }
  }

  async saveQuizAnswer(attemptId: number, questionId: number, answer: string): Promise<void> {
    try {
      // Get current attempt
      const attempt = await this.getQuizAttemptById(attemptId);
      if (!attempt) {
        throw new Error("Quiz attempt not found");
      }

      // Parse existing answers or initialize
      let answers = Array.isArray(attempt.answers) ? attempt.answers : [];
      
      // Find existing answer for this question or create new one
      const existingIndex = answers.findIndex((a: any) => a.questionId === questionId);
      const answerData = { questionId, answer, timestamp: new Date().toISOString() };
      
      if (existingIndex >= 0) {
        answers[existingIndex] = answerData;
      } else {
        answers.push(answerData);
      }

      // Update attempt with new answers
      await db
        .update(quizAttempts)
        .set({ answers })
        .where(eq(quizAttempts.id, attemptId));
        
    } catch (error) {
      console.error("Error saving quiz answer:", error);
      throw new Error("Failed to save answer");
    }
  }

  async submitQuizAttempt(attemptId: number, answers: Record<number, string>): Promise<any> {
    try {
      // Get attempt and quiz data
      const attempt = await this.getQuizAttemptById(attemptId);
      if (!attempt) {
        throw new Error("Quiz attempt not found");
      }

      const questions = await this.getQuizQuestions(attempt.quizId);
      
      // Calculate score based on automatic grading
      let totalScore = 0;
      const gradedAnswers = [];

      for (const question of questions) {
        const userAnswer = answers[question.id];
        const points = question.points || 1;
        let earnedPoints = 0;
        let isCorrect = false;

        if (userAnswer && question.correctAnswer) {
          // Automatic grading for objective questions
          switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
              isCorrect = userAnswer.toString().toLowerCase().trim() === question.correctAnswer.toString().toLowerCase().trim();
              earnedPoints = isCorrect ? points : 0;
              break;
            
            case 'short_answer':
              // Simple string comparison for short answers
              const normalizedUser = userAnswer.toString().toLowerCase().trim();
              const normalizedCorrect = question.correctAnswer.toString().toLowerCase().trim();
              isCorrect = normalizedUser === normalizedCorrect;
              earnedPoints = isCorrect ? points : 0;
              break;
              
            default:
              // Essay and other subjective questions need manual grading
              earnedPoints = 0;
              isCorrect = false;
          }
        }

        totalScore += earnedPoints;
        gradedAnswers.push({
          questionId: question.id,
          answer: userAnswer || '',
          isCorrect,
          pointsEarned: earnedPoints,
          maxPoints: points
        });
      }

      const percentage = attempt.maxScore > 0 ? (totalScore / attempt.maxScore) * 100 : 0;
      const completedAt = new Date();
      
      // Calculate time spent
      const startTime = new Date(attempt.startedAt);
      const timeSpent = Math.floor((completedAt.getTime() - startTime.getTime()) / 1000);

      // Update attempt with final results
      const [updatedAttempt] = await db
        .update(quizAttempts)
        .set({
          score: totalScore,
          percentage: Math.round(percentage * 100) / 100,
          completedAt,
          timeSpent,
          status: 'completed',
          answers: gradedAnswers
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();

      return {
        ...updatedAttempt,
        gradedAnswers
      };
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      throw new Error("Failed to submit quiz attempt");
    }
  }

  // Assignment operations
  async createAssignment(assignmentData: Omit<Assignment, "id">): Promise<Assignment> {
    try {
      const [assignment] = await db
        .insert(assignments)
        .values(assignmentData)
        .returning();
      return assignment;
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw new Error("Failed to create assignment");
    }
  }

  async getAssignment(assignmentId: number): Promise<Assignment | undefined> {
    try {
      const [assignment] = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, assignmentId));
      return assignment;
    } catch (error) {
      console.error("Error fetching assignment:", error);
      return undefined;
    }
  }

  async updateAssignment(assignmentId: number, assignmentData: Partial<Assignment>): Promise<Assignment> {
    try {
      const [updatedAssignment] = await db
        .update(assignments)
        .set(assignmentData)
        .where(eq(assignments.id, assignmentId))
        .returning();
      return updatedAssignment;
    } catch (error) {
      console.error("Error updating assignment:", error);
      throw new Error("Failed to update assignment");
    }
  }

  async deleteAssignment(assignmentId: number): Promise<void> {
    try {
      await db
        .delete(assignments)
        .where(eq(assignments.id, assignmentId));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      throw new Error("Failed to delete assignment");
    }
  }

  async getAssignments(options?: { courseId?: number, moduleId?: number, lessonId?: number }): Promise<Assignment[]> {
    try {
      let query = db.select().from(assignments);
      
      if (options?.lessonId) {
        query = query.where(eq(assignments.lessonId, options.lessonId));
      } else if (options?.moduleId) {
        // Get all lessons in the module, then filter assignments by those lesson IDs
        const moduleLesson = await db
          .select({ id: lessons.id })
          .from(lessons)
          .where(eq(lessons.moduleId, options.moduleId));
        
        const lessonIds = moduleLesson.map(l => l.id);
        
        if (lessonIds.length > 0) {
          query = query.where(inArray(assignments.lessonId, lessonIds));
        }
      } else if (options?.courseId) {
        // Get all modules in the course
        const courseModules = await db
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.courseId, options.courseId));
        
        const moduleIds = courseModules.map(m => m.id);
        
        if (moduleIds.length > 0) {
          // Get all lessons in those modules
          const moduleLessons = await db
            .select({ id: lessons.id })
            .from(lessons)
            .where(inArray(lessons.moduleId, moduleIds));
          
          const lessonIds = moduleLessons.map(l => l.id);
          
          if (lessonIds.length > 0) {
            query = query.where(inArray(assignments.lessonId, lessonIds));
          }
        }
      }
      
      return await query;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }
  }

  async getAssignmentsByMentor(mentorId: string): Promise<any[]> {
    try {
      // Get courses taught by this mentor
      const mentorCourseList = await db
        .select({ courseId: mentorCourses.courseId })
        .from(mentorCourses)
        .where(eq(mentorCourses.mentorId, mentorId));
      
      const courseIds = mentorCourseList.map(mc => mc.courseId);
      
      if (courseIds.length === 0) {
        return [];
      }
      
      // Get all assignments from these courses with lesson relationship data
      const allAssignments = await db
        .select({
          id: assignments.id,
          lessonId: assignments.lessonId,
          title: assignments.title,
          description: assignments.description,
          dueDate: assignments.dueDate,
          rubric: assignments.rubric,
          lesson: {
            id: lessons.id,
            moduleId: lessons.moduleId,
            title: lessons.title,
            courseId: modules.courseId
          }
        })
        .from(assignments)
        .innerJoin(lessons, eq(assignments.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .where(inArray(modules.courseId, courseIds));
      
      return allAssignments;
    } catch (error) {
      console.error("Error fetching mentor assignments:", error);
      return [];
    }
  }

  async getAssignmentsByLesson(lessonId: number): Promise<Assignment[]> {
    try {
      return await db
        .select()
        .from(assignments)
        .where(eq(assignments.lessonId, lessonId));
    } catch (error) {
      console.error("Error fetching lesson assignments:", error);
      return [];
    }
  }

  async submitAssignment(submissionData: Omit<AssignmentSubmission, "id" | "submittedAt">): Promise<AssignmentSubmission> {
    try {
      const [submission] = await db
        .insert(assignmentSubmissions)
        .values({
          ...submissionData,
          submittedAt: new Date()
        })
        .returning();
      return submission;
    } catch (error) {
      console.error("Error submitting assignment:", error);
      throw new Error("Failed to submit assignment");
    }
  }

  async getAssignmentSubmission(submissionId: number): Promise<AssignmentSubmission | undefined> {
    try {
      const [submission] = await db
        .select()
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.id, submissionId));
      return submission;
    } catch (error) {
      console.error("Error fetching assignment submission:", error);
      return undefined;
    }
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<AssignmentSubmission[]> {
    try {
      return await db
        .select()
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.assignmentId, assignmentId))
        .orderBy(desc(assignmentSubmissions.submittedAt));
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      return [];
    }
  }

  async getUserAssignmentSubmissions(userId: string, assignmentId?: number): Promise<AssignmentSubmission[]> {
    try {
      let query = db
        .select()
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.userId, userId));
      
      if (assignmentId) {
        query = query.where(eq(assignmentSubmissions.assignmentId, assignmentId));
      }
      
      return await query.orderBy(desc(assignmentSubmissions.submittedAt));
    } catch (error) {
      console.error("Error fetching user assignment submissions:", error);
      return [];
    }
  }

  async getUserAssignmentSubmission(userId: string, assignmentId: number): Promise<any> {
    try {
      const [submission] = await db
        .select()
        .from(assignmentSubmissions)
        .where(
          and(
            eq(assignmentSubmissions.userId, userId),
            eq(assignmentSubmissions.assignmentId, assignmentId)
          )
        );
      return submission;
    } catch (error) {
      console.error("Error fetching user assignment submission:", error);
      return null;
    }
  }

  async updateAssignmentSubmission(submissionId: number, submissionData: Partial<any>): Promise<any> {
    try {
      const [updatedSubmission] = await db
        .update(assignmentSubmissions)
        .set(submissionData)
        .where(eq(assignmentSubmissions.id, submissionId))
        .returning();
      return updatedSubmission;
    } catch (error) {
      console.error("Error updating assignment submission:", error);
      throw new Error("Failed to update assignment submission");
    }
  }

  async gradeAssignment(submissionId: number, grade: number, feedback: string, gradedBy: string): Promise<AssignmentSubmission> {
    try {
      const [gradedSubmission] = await db
        .update(assignmentSubmissions)
        .set({
          grade,
          feedback,
          gradedBy,
          gradedAt: new Date()
        })
        .where(eq(assignmentSubmissions.id, submissionId))
        .returning();
      return gradedSubmission;
    } catch (error) {
      console.error("Error grading assignment:", error);
      throw new Error("Failed to grade assignment");
    }
  }

  async getCoursesByMentor(mentorId: string): Promise<Course[]> {
    try {
      // Get all course-mentor assignments for this mentor
      const mentorAssignments = await db
        .select()
        .from(courseMentors)
        .where(eq(courseMentors.mentorId, mentorId));

      // Get the actual courses
      const courseIds = mentorAssignments.map(assignment => assignment.courseId);
      if (courseIds.length === 0) return [];

      const courses = await db
        .select()
        .from(coursesTable)
        .where(inArray(coursesTable.id, courseIds));

      return courses;
    } catch (error) {
      console.error("Error fetching courses by mentor:", error);
      return [];
    }
  }
  
  // Course Management
  async createCourse(courseData: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course> {
    try {
      const [course] = await db
        .insert(courses)
        .values(courseData)
        .returning();
      return course;
    } catch (error) {
      console.error("Error creating course:", error);
      throw new Error("Failed to create course");
    }
  }

  async getCourse(id: number): Promise<Course | undefined> {
    try {
      const [course] = await db.select().from(courses).where(eq(courses.id, id));
      return course;
    } catch (error) {
      console.error("Error fetching course:", error);
      return undefined;
    }
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    try {
      const [updatedCourse] = await db
        .update(courses)
        .set({
          ...courseData,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))
        .returning();
      
      return updatedCourse;
    } catch (error) {
      console.error("Error updating course:", error);
      throw new Error("Failed to update course");
    }
  }

  async deleteCourse(id: number): Promise<boolean> {
    try {
      // Delete course and all related data (cascade deletes should handle this)
      await db.delete(courses).where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting course:", error);
      throw new Error("Failed to delete course");
    }
  }

  async getCourses(options?: { published?: boolean }): Promise<Course[]> {
    try {
      let query = db.select().from(courses);
      
      if (options?.published !== undefined) {
        query = query.where(eq(courses.isPublished, options.published));
      }
      
      const result = await query;
      return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  }

  async getCoursesByMentor(mentorId: string): Promise<Course[]> {
    try {
      // Use courseMentors table (course_mentors in database) instead of mentorCourses
      const coursesWithMentor = await db
        .select({
          course: courses
        })
        .from(courseMentors)
        .innerJoin(courses, eq(courseMentors.courseId, courses.id))
        .where(eq(courseMentors.mentorId, mentorId));
      
      return coursesWithMentor.map(row => row.course);
    } catch (error) {
      console.error("Error fetching mentor courses:", error);
      return [];
    }
  }

  async getAllEnrollments(): Promise<CourseEnrollment[]> {
    try {
      return await db
        .select()
        .from(courseEnrollments)
        .orderBy(desc(courseEnrollments.enrolledAt));
    } catch (error) {
      console.error("Error fetching all enrollments:", error);
      return [];
    }
  }

  async getCourseEnrollments(courseId: number): Promise<CourseEnrollment[]> {
    try {
      return await db
        .select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.courseId, courseId))
        .orderBy(desc(courseEnrollments.enrolledAt));
    } catch (error) {
      console.error("Error fetching course enrollments:", error);
      return [];
    }
  }

  async getEnrolledCourses(userId: string): Promise<CourseEnrollment[]> {
    try {
      return await db
        .select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.userId, userId))
        .orderBy(desc(courseEnrollments.enrolledAt));
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      return [];
    }
  }

  async getStudentEnrollments(userId: string): Promise<CourseEnrollment[]> {
    try {
      const result = await db
        .select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.userId, userId));
      return result.sort((a, b) => new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime());
    } catch (error) {
      console.error("Error fetching student enrollments:", error);
      return [];
    }
  }

  async getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]> {
    return this.getStudentEnrollments(userId);
  }

  // Module Management
  async createModule(moduleData: Omit<Module, "id">): Promise<Module> {
    try {
      const [module] = await db
        .insert(modules)
        .values(moduleData)
        .returning();
      
      return module;
    } catch (error) {
      console.error("Error creating module:", error);
      throw new Error("Failed to create module");
    }
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    try {
      return await db
        .select()
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(modules.orderIndex);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      return [];
    }
  }
  
  async getCourseEnrollmentsByCourse(courseId: number): Promise<CourseEnrollment[]> {
    try {
      return await db
        .select()
        .from(courseEnrollments)
        .where(eq(courseEnrollments.courseId, courseId))
        .orderBy(desc(courseEnrollments.enrolledAt));
    } catch (error) {
      console.error("Error fetching course enrollments:", error);
      return [];
    }
  }

  // Lesson Management
  async createLesson(lessonData: Omit<Lesson, "id">): Promise<Lesson> {
    try {
      const [lesson] = await db
        .insert(lessons)
        .values(lessonData)
        .returning();
      
      return lesson;
    } catch (error) {
      console.error("Error creating lesson:", error);
      throw new Error("Failed to create lesson");
    }
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    try {
      return await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, moduleId))
        .orderBy(lessons.orderIndex);
    } catch (error) {
      console.error("Error fetching module lessons:", error);
      return [];
    }
  }

  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    try {
      // Get all modules for the course first
      const courseModules = await db
        .select()
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(modules.orderIndex);

      // Get all lessons for all modules in the course
      const allLessons: Lesson[] = [];
      for (const module of courseModules) {
        const moduleLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(lessons.orderIndex);
        allLessons.push(...moduleLessons);
      }

      return allLessons;
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      return [];
    }
  }

  async getLessonProgress(lessonId: number, userId: string): Promise<LessonProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.userId, userId)
          )
        );
      
      return progress;
    } catch (error) {
      console.error("Error fetching lesson progress:", error);
      return undefined;
    }
  }

  async updateLessonProgress(
    lessonId: number, 
    userId: string, 
    progress: Partial<LessonProgress>
  ): Promise<LessonProgress> {
    try {
      // Check if progress exists
      const existingProgress = await this.getLessonProgress(lessonId, userId);
      
      if (existingProgress) {
        // Update existing progress
        const [updatedProgress] = await db
          .update(lessonProgress)
          .set({
            ...progress,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(lessonProgress.lessonId, lessonId),
              eq(lessonProgress.userId, userId)
            )
          )
          .returning();
        
        return updatedProgress;
      } else {
        // Create new progress
        const [newProgress] = await db
          .insert(lessonProgress)
          .values({
            lessonId,
            userId,
            status: progress.status || "in_progress",
            completionPercentage: progress.completionPercentage || 0,
            lastAccessedAt: new Date(),
            completedAt: progress.completedAt,
            timeSpent: progress.timeSpent || 0,
          })
          .returning();
        
        return newProgress;
      }
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      throw new Error("Failed to update lesson progress");
    }
  }

  // Enrollment Management
  async enrollUserInCourse(enrollment: Omit<CourseEnrollment, "id" | "enrolledAt">): Promise<CourseEnrollment> {
    try {
      const [newEnrollment] = await db
        .insert(courseEnrollments)
        .values(enrollment)
        .returning();
      
      return newEnrollment;
    } catch (error) {
      console.error("Error enrolling user in course:", error);
      throw new Error("Failed to enroll user in course");
    }
  }

  async getCourseEnrollment(courseId: number, userId: string): Promise<CourseEnrollment | undefined> {
    try {
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, courseId),
            eq(courseEnrollments.userId, userId)
          )
        );
      
      return enrollment;
    } catch (error) {
      console.error("Error fetching course enrollment:", error);
      return undefined;
    }
  }

  async isUserEnrolledInCourse(userId: string, courseId: number): Promise<boolean> {
    try {
      const enrollment = await this.getCourseEnrollment(courseId, userId);
      return !!enrollment;
    } catch (error) {
      console.error("Error checking course enrollment:", error);
      return false;
    }
  }

  async updateCourseProgress(enrollmentId: number, progress: number): Promise<CourseEnrollment> {
    try {
      const [updatedEnrollment] = await db
        .update(courseEnrollments)
        .set({ 
          progress,
          completedAt: progress >= 100 ? new Date() : null
        })
        .where(eq(courseEnrollments.id, enrollmentId))
        .returning();
      
      return updatedEnrollment;
    } catch (error) {
      console.error("Error updating course progress:", error);
      throw new Error("Failed to update course progress");
    }
  }
  
  // Mentor operations
  async assignMentorToCourse(mentorCourse: Omit<MentorCourse, "id" | "assignedAt">): Promise<MentorCourse> {
    try {
      const [assignment] = await db
        .insert(mentorCourses)
        .values(mentorCourse)
        .returning();
      
      return assignment;
    } catch (error) {
      console.error("Error assigning mentor to course:", error);
      throw new Error("Failed to assign mentor to course");
    }
  }
  
  async getMentorsByCourse(courseId: number): Promise<User[]> {
    try {
      const mentorsData = await db
        .select({
          user: users
        })
        .from(mentorCourses)
        .innerJoin(users, eq(mentorCourses.mentorId, users.id))
        .where(eq(mentorCourses.courseId, courseId));
      
      return mentorsData.map(row => row.user);
    } catch (error) {
      console.error("Error fetching course mentors:", error);
      return [];
    }
  }

  // Communication operations
  async getUserConversations(userId: string): Promise<any[]> {
    try {
      // Get all conversations where the user is a participant
      const participantData = await db
        .select({
          conversationId: conversationParticipants.conversationId
        })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId));
      
      const conversationIds = participantData.map(p => p.conversationId);
      
      if (conversationIds.length === 0) {
        return [];
      }
      
      // Get all conversations with their last message
      const conversationsWithData = await db
        .select({
          conversation: conversations,
          participants: conversationParticipants,
          lastMessage: db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, conversations.id))
            .orderBy(desc(chatMessages.sentAt))
            .limit(1)
            .as("lastMessage")
        })
        .from(conversations)
        .leftJoin(
          conversationParticipants,
          eq(conversations.id, conversationParticipants.conversationId)
        )
        .where(inArray(conversations.id, conversationIds));
      
      // Group by conversation and format the result
      const conversationMap = new Map();
      
      for (const row of conversationsWithData) {
        const { conversation, participants, lastMessage } = row;
        
        if (!conversationMap.has(conversation.id)) {
          conversationMap.set(conversation.id, {
            ...conversation,
            participants: [],
            lastMessage: lastMessage ? lastMessage[0] : null,
            unreadCount: 0
          });
        }
        
        const currentConv = conversationMap.get(conversation.id);
        
        if (participants && !currentConv.participants.some(p => p.userId === participants.userId)) {
          currentConv.participants.push(participants);
        }
      }
      
      // Get unread count for each conversation
      for (const conversationId of conversationIds) {
        const unreadCount = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.conversationId, conversationId),
              not(eq(chatMessages.senderId, userId)),
              eq(chatMessages.isRead, false)
            )
          );
        
        if (conversationMap.has(conversationId)) {
          conversationMap.get(conversationId).unreadCount = unreadCount[0]?.count || 0;
        }
      }
      
      // Get user data for all participants
      const allParticipantIds = [...new Set(
        Array.from(conversationMap.values())
          .flatMap(conv => conv.participants.map(p => p.userId))
      )];
      
      const userData = await db
        .select()
        .from(users)
        .where(inArray(users.id, allParticipantIds));
      
      const userMap = new Map(userData.map(user => [user.id, user]));
      
      // Format conversations for client use
      const result = Array.from(conversationMap.values()).map(conv => {
        // For one-on-one conversations, include other user info
        let otherUser = null;
        
        if (!conv.isGroup) {
          const otherParticipant = conv.participants.find(p => p.userId !== userId);
          if (otherParticipant) {
            otherUser = userMap.get(otherParticipant.userId) || null;
          }
        }
        
        return {
          id: conv.id,
          title: conv.title,
          isGroup: conv.isGroup,
          createdAt: conv.createdAt,
          participants: conv.participants.map(p => ({
            ...p,
            user: userMap.get(p.userId) || null
          })),
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      });
      
      // Sort by last message date (most recent first)
      result.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
        return dateB - dateA;
      });
      
      return result;
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      return [];
    }
  }
  
  async getConversationMessages(conversationId: number): Promise<any[]> {
    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(asc(chatMessages.sentAt));
      
      // Get all sender IDs
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      
      // Get user data for senders
      const senders = await db
        .select()
        .from(users)
        .where(inArray(users.id, senderIds));
      
      const senderMap = new Map(senders.map(user => [user.id, user]));
      
      // Add sender info to messages
      return messages.map(message => ({
        ...message,
        sender: senderMap.get(message.senderId) || null
      }));
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    }
  }
  
  async isConversationParticipant(userId: string, conversationId: number): Promise<boolean> {
    try {
      const participant = await db
        .select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.userId, userId),
            eq(conversationParticipants.conversationId, conversationId)
          )
        )
        .limit(1);
      
      return participant.length > 0;
    } catch (error) {
      console.error("Error checking conversation participant:", error);
      return false;
    }
  }
  
  async createConversation(data: Partial<InsertConversation>): Promise<Conversation> {
    try {
      const [conversation] = await db
        .insert(conversations)
        .values({
          creatorId: data.creatorId,
          title: data.title,
          isGroup: data.isGroup || false,
        })
        .returning();
      
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw new Error("Failed to create conversation");
    }
  }
  
  async addConversationParticipants(conversationId: number, participantIds: string[]): Promise<void> {
    try {
      const participants = participantIds.map(userId => ({
        conversationId,
        userId,
      }));
      
      await db
        .insert(conversationParticipants)
        .values(participants)
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error adding conversation participants:", error);
      throw new Error("Failed to add conversation participants");
    }
  }
  
  async sendMessage(data: Partial<InsertChatMessage>): Promise<ChatMessage> {
    try {
      const [message] = await db
        .insert(chatMessages)
        .values({
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          isRead: false,
        })
        .returning();
      
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }
  
  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    try {
      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(chatMessages.conversationId, conversationId),
            not(eq(chatMessages.senderId, userId)),
            eq(chatMessages.isRead, false)
          )
        );
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read");
    }
  }
  
  async getAnnouncements(options: { limit: number, offset: number }): Promise<any[]> {
    try {
      const { limit, offset } = options;
      
      const announcements = await db
        .select({
          announcement: courseAnnouncements,
          course: courses,
          creator: users
        })
        .from(courseAnnouncements)
        .leftJoin(courses, eq(courseAnnouncements.courseId, courses.id))
        .leftJoin(users, eq(courseAnnouncements.createdBy, users.id))
        .orderBy(desc(courseAnnouncements.createdAt))
        .limit(limit)
        .offset(offset);
      
      return announcements.map(row => ({
        ...row.announcement,
        course: row.course,
        creator: row.creator
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }
  }
  
  async getCourseAnnouncements(courseId: number, options: { limit: number, offset: number }): Promise<any[]> {
    try {
      const { limit, offset } = options;
      
      const announcementRows = await db
        .select({
          announcement: announcements,
          creator: users
        })
        .from(announcements)
        .leftJoin(users, eq(announcements.createdBy, users.id))
        .where(eq(announcements.courseId, courseId))
        .orderBy(desc(announcements.createdAt))
        .limit(limit)
        .offset(offset);
      
      return announcementRows.map(row => ({
        ...row.announcement,
        creator: row.creator
      }));
    } catch (error) {
      console.error("Error fetching course announcements:", error);
      return [];
    }
  }

  async createAnnouncement(announcementData: any): Promise<any> {
    try {
      const [announcement] = await db
        .insert(announcements)
        .values({
          courseId: announcementData.courseId,
          title: announcementData.title,
          content: announcementData.content,
          type: announcementData.type || 'general',
          priority: announcementData.priority || 'normal',
          isPublished: announcementData.isPublished || true,
          publishedAt: new Date(),
          createdBy: announcementData.createdBy
        })
        .returning();
      
      return announcement;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw new Error("Failed to create announcement");
    }
  }

  async getAnnouncementsByCourse(courseId: number): Promise<any[]> {
    try {
      const announcementRows = await db
        .select({
          announcement: announcements,
          creator: users
        })
        .from(announcements)
        .leftJoin(users, eq(announcements.createdBy, users.id))
        .where(eq(announcements.courseId, courseId))
        .orderBy(desc(announcements.createdAt));
      
      return announcementRows.map(row => ({
        ...row.announcement,
        creator: row.creator
      }));
    } catch (error) {
      console.error("Error fetching announcements by course:", error);
      return [];
    }
  }

  async updateAnnouncement(announcementId: number, updateData: any): Promise<any> {
    try {
      const [updatedAnnouncement] = await db
        .update(announcements)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(announcements.id, announcementId))
        .returning();
      
      return updatedAnnouncement;
    } catch (error) {
      console.error("Error updating announcement:", error);
      throw new Error("Failed to update announcement");
    }
  }

  async deleteAnnouncement(announcementId: number): Promise<void> {
    try {
      await db
        .delete(announcements)
        .where(eq(announcements.id, announcementId));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw new Error("Failed to delete announcement");
    }
  }
  
  async getUsersByRole(role?: string): Promise<User[]> {
    try {
      let query = db.select().from(users);
      
      if (role) {
        query = query.where(eq(users.role, role));
      }
      
      return await query.orderBy(asc(users.firstName));
    } catch (error) {
      console.error("Error fetching users by role:", error);
      return [];
    }
  }

  // Certificate methods
  async issueCertificate(certificateData: any): Promise<Certificate> {
    const verificationCode = await this.generateVerificationCode();
    
    const [certificate] = await db.insert(certificates).values({
      userId: certificateData.userId,
      courseId: certificateData.courseId,
      template: certificateData.template,
      verificationCode,
      status: "issued",
      templateStyle: certificateData.templateStyle,
      additionalNote: certificateData.additionalNote,
      issuedBy: certificateData.issuedBy
    }).returning();
    
    return certificate;
  }
  
  async getCertificate(certificateId: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, certificateId));
    return certificate;
  }
  
  async getAllCertificates(): Promise<Certificate[]> {
    try {
      const allCertificates = await db.select().from(certificates);
      return allCertificates;
    } catch (error) {
      console.error("Error fetching all certificates:", error);
      return [];
    }
  }
  
  async getAllCertificatesWithCourseDetails(): Promise<any[]> {
    try {
      const certificatesData = await db
        .select({
          certificate: certificates,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            level: courses.level,
            category: courses.category
          },
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(certificates)
        .leftJoin(courses, eq(certificates.courseId, courses.id))
        .leftJoin(users, eq(certificates.userId, users.id))
        .orderBy(desc(certificates.issuedAt));
      
      return certificatesData.map(data => ({
        ...data.certificate,
        courseTitle: data.course?.title || 'Unknown Course',
        courseDescription: data.course?.description || '',
        courseLevel: data.course?.level || '',
        courseCategory: data.course?.category || '',
        studentName: data.student ? 
          `${data.student.firstName || ''} ${data.student.lastName || ''}`.trim() : 
          'Unknown Student',
        studentEmail: data.student?.email || ''
      }));
    } catch (error) {
      console.error("Error fetching certificates with course details:", error);
      return [];
    }
  }
  
  async updateCertificateStatus(certificateId: number, status: string): Promise<Certificate | undefined> {
    try {
      const [updatedCertificate] = await db
        .update(certificates)
        .set({ status })
        .where(eq(certificates.id, certificateId))
        .returning();
      
      return updatedCertificate;
    } catch (error) {
      console.error("Error updating certificate status:", error);
      return undefined;
    }
  }
  
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.userId, userId));
  }
  
  async verifyCertificate(certificateId: number): Promise<{valid: boolean; certificate?: Certificate}> {
    const certificate = await this.getCertificate(certificateId);
    
    if (!certificate) {
      return { valid: false };
    }
    
    if (certificate.status === "revoked") {
      return { valid: false, certificate };
    }
    
    return { valid: true, certificate };
  }
  
  async generateVerificationCode(): Promise<string> {
    // Generate a unique 8 character verification code
    const code = randomBytes(4).toString('hex').toUpperCase();
    // Check if code already exists
    const [existingCert] = await db.select()
      .from(certificates)
      .where(eq(certificates.verificationCode, code));
      
    if (existingCert) {
      // If code already exists, generate a new one recursively
      return this.generateVerificationCode();
    }
    
    return code;
  }
  
  async generateCertificateNumber(): Promise<string> {
    // Generate a unique certificate ID with format: COD-YYYY-XXXXXXXX
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `COD-${year}-${randomPart}`;
  }

  async issueCertificate(certificateData: Omit<Certificate, "id" | "issuedAt">): Promise<Certificate> {
    try {
      const certificateId = await this.generateCertificateNumber();
      
      // Check if the user has completed the course
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.userId, certificateData.userId),
          eq(courseEnrollments.courseId, certificateData.courseId)
        ));
      
      if (!enrollment) {
        throw new Error("User is not enrolled in this course");
      }
      
      if (enrollment.progress < 100) {
        throw new Error("User has not completed this course yet");
      }
      
      // Create certificate
      const [certificate] = await db
        .insert(certificates)
        .values({
          id: certificateId,
          userId: certificateData.userId,
          courseId: certificateData.courseId,
          template: certificateData.template
        })
        .returning();
      
      // Update the enrollment record with the certificate ID
      await db
        .update(courseEnrollments)
        .set({ certificateId })
        .where(eq(courseEnrollments.id, enrollment.id));
      
      return certificate;
    } catch (error) {
      console.error("Error issuing certificate:", error);
      throw error;
    }
  }

  async getUserCertificates(userId: string): Promise<any[]> {
    try {
      const userCertificates = await db
        .select({
          certificate: certificates,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            thumbnail: courses.thumbnail
          }
        })
        .from(certificates)
        .leftJoin(courses, eq(certificates.courseId, courses.id))
        .where(eq(certificates.userId, userId))
        .orderBy(desc(certificates.issuedAt));
      
      return userCertificates.map(item => ({
        ...item.certificate,
        course: item.course
      }));
    } catch (error) {
      console.error("Error getting user certificates:", error);
      return [];
    }
  }

  async getCertificate(certificateId: string): Promise<Certificate | undefined> {
    try {
      const [result] = await db
        .select({
          certificate: certificates,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description
          },
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(certificates)
        .leftJoin(courses, eq(certificates.courseId, courses.id))
        .leftJoin(users, eq(certificates.userId, users.id))
        .where(eq(certificates.id, certificateId));
      
      if (!result) {
        return undefined;
      }
      
      return {
        ...result.certificate,
        course: result.course,
        user: result.user
      } as any;
    } catch (error) {
      console.error("Error getting certificate:", error);
      return undefined;
    }
  }

  async verifyCertificate(certificateId: string): Promise<{valid: boolean; certificate?: Certificate}> {
    try {
      const certificate = await this.getCertificate(certificateId);
      
      if (!certificate) {
        return { valid: false };
      }
      
      return {
        valid: true,
        certificate
      };
    } catch (error) {
      console.error("Error verifying certificate:", error);
      return { valid: false };
    }
  }

  // KYC (Know Your Customer) methods
  async submitKycApplication(kycData: any): Promise<any> {
    try {
      const [kycRecord] = await db
        .insert(kycDocuments)
        .values(kycData)
        .returning();
      
      // Create verification history entry
      await db
        .insert(kycVerificationHistory)
        .values({
          kycDocumentId: kycRecord.id,
          userId: kycData.userId,
          action: 'submitted',
          newStatus: 'pending',
          performedBy: kycData.userId,
          reason: 'Initial KYC submission',
          ipAddress: kycData.ipAddress,
          userAgent: kycData.userAgent
        });
      
      return kycRecord;
    } catch (error) {
      console.error("Error submitting KYC application:", error);
      throw error;
    }
  }

  async getKycStatus(userId: string): Promise<any> {
    try {
      const [kyc] = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, userId))
        .orderBy(desc(kycDocuments.submittedAt))
        .limit(1);
      
      if (!kyc) {
        return {
          hasSubmitted: false,
          status: null,
          verificationLevel: null
        };
      }
      
      return {
        hasSubmitted: true,
        status: kyc.verificationStatus,
        verificationLevel: kyc.verificationLevel,
        submittedAt: kyc.submittedAt,
        verifiedAt: kyc.verifiedAt,
        rejectionReason: kyc.rejectionReason,
        documentsComplete: kyc.documentsComplete,
        documentsVerified: kyc.documentsVerified
      };
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      return {
        hasSubmitted: false,
        status: null,
        verificationLevel: null
      };
    }
  }

  async getKycApplications(filters: {
    status?: string;
    userRole?: string;
    page: number;
    limit: number;
  }): Promise<any> {
    try {
      const { status, userRole, page, limit } = filters;
      const offset = (page - 1) * limit;
      
      let query = db
        .select({
          kyc: kycDocuments,
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(kycDocuments)
        .leftJoin(users, eq(kycDocuments.userId, users.id));
      
      const conditions = [];
      
      if (status) {
        conditions.push(eq(kycDocuments.verificationStatus, status));
      }
      
      if (userRole) {
        conditions.push(eq(kycDocuments.userRole, userRole));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const applications = await query
        .orderBy(desc(kycDocuments.submittedAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      let countQuery = db
        .select({ count: count() })
        .from(kycDocuments);
      
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      
      const [{ count: totalCount }] = await countQuery;
      
      return {
        applications: applications.map(item => ({
          ...item.kyc,
          user: item.user
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching KYC applications:", error);
      return {
        applications: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  async updateKycVerificationStatus(kycId: number, updateData: {
    status: string;
    reason?: string;
    notes?: string;
    verifiedBy: string;
  }): Promise<any> {
    try {
      const { status, reason, notes, verifiedBy } = updateData;
      
      // Get current KYC record
      const [currentKyc] = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.id, kycId));
      
      if (!currentKyc) {
        throw new Error('KYC application not found');
      }
      
      // Update KYC record
      const updateFields: any = {
        verificationStatus: status,
        lastUpdated: new Date()
      };
      
      if (status === 'approved') {
        updateFields.verifiedAt = new Date();
        updateFields.verifiedBy = verifiedBy;
        updateFields.documentsVerified = true;
      } else if (status === 'rejected') {
        updateFields.rejectionReason = reason;
      }
      
      const [updatedKyc] = await db
        .update(kycDocuments)
        .set(updateFields)
        .where(eq(kycDocuments.id, kycId))
        .returning();
      
      // Create verification history entry
      await db
        .insert(kycVerificationHistory)
        .values({
          kycDocumentId: kycId,
          userId: currentKyc.userId,
          action: status === 'approved' ? 'approved' : 'rejected',
          previousStatus: currentKyc.verificationStatus,
          newStatus: status,
          performedBy: verifiedBy,
          reason: reason || null,
          notes: notes || null
        });
      
      return updatedKyc;
    } catch (error) {
      console.error("Error updating KYC verification status:", error);
      throw error;
    }
  }

  // System settings additional methods
  async upsertSystemSetting(key: string, value: string, updatedBy: string): Promise<SystemSettings> {
    try {
      const [setting] = await db
        .insert(systemSettings)
        .values({
          key,
          value,
          updatedBy,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            updatedBy,
            updatedAt: new Date()
          }
        })
        .returning();
      return setting;
    } catch (error) {
      console.error(`Error upserting system setting ${key}:`, error);
      throw error;
    }
  }
  
  // Statistics methods
  async getCourseStats(): Promise<any> {
    try {
      const totalCourses = await db.select({ count: sql`count(*)` }).from(courses);
      const publishedCourses = await db.select({ count: sql`count(*)` }).from(courses)
        .where(eq(courses.published, true));
      const totalEnrollments = await db.select({ count: sql`count(*)` }).from(courseEnrollments);
      
      return {
        totalCourses: parseInt(totalCourses[0].count.toString() || '0'),
        publishedCourses: parseInt(publishedCourses[0].count.toString() || '0'),
        totalEnrollments: parseInt(totalEnrollments[0].count.toString() || '0')
      };
    } catch (error) {
      console.error("Error getting course stats:", error);
      return { totalCourses: 0, publishedCourses: 0, totalEnrollments: 0 };
    }
  }
  
  async getMentorStats(): Promise<any> {
    try {
      const totalMentors = await db.select({ count: sql`count(*)` }).from(users)
        .where(eq(users.role, 'mentor'));
      const activeMentors = await db.select({ count: sql`count(distinct ${mentorCourses.userId})` })
        .from(mentorCourses)
        .innerJoin(users, eq(mentorCourses.userId, users.id))
        .where(eq(users.role, 'mentor'));
      
      return {
        totalMentors: parseInt(totalMentors[0].count.toString() || '0'),
        activeMentors: parseInt(activeMentors[0].count.toString() || '0')
      };
    } catch (error) {
      console.error("Error getting mentor stats:", error);
      return { totalMentors: 0, activeMentors: 0 };
    }
  }
  
  async getStudentStats(): Promise<any> {
    try {
      const totalStudents = await db.select({ count: sql`count(*)` }).from(users)
        .where(eq(users.role, 'student'));
      const activeStudents = await db.select({ count: sql`count(distinct ${courseEnrollments.userId})` })
        .from(courseEnrollments)
        .innerJoin(users, eq(courseEnrollments.userId, users.id))
        .where(eq(users.role, 'student'));
      
      return {
        totalStudents: parseInt(totalStudents[0].count.toString() || '0'),
        activeStudents: parseInt(activeStudents[0].count.toString() || '0')
      };
    } catch (error) {
      console.error("Error getting student stats:", error);
      return { totalStudents: 0, activeStudents: 0 };
    }
  }
  
  // Notification functions - temporarily return empty array until schema is fixed
  async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      // Return empty array temporarily until notification schema is properly set up
      return [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }
  
  async createNotification(notification: any): Promise<any> {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values(notification)
        .returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const [updated] = await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  
  // Discussions
  async createDiscussion(discussion: any): Promise<any> {
    try {
      const [newDiscussion] = await db
        .insert(courseDiscussions)
        .values(discussion)
        .returning();
      return newDiscussion;
    } catch (error) {
      console.error("Error creating discussion:", error);
      throw error;
    }
  }
  
  async getDiscussionsByCourse(courseId: number): Promise<any[]> {
    try {
      const discussions = await db
        .select({
          discussion: courseDiscussions,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(courseDiscussions)
        .leftJoin(users, eq(courseDiscussions.authorId, users.id))
        .where(eq(courseDiscussions.courseId, courseId))
        .orderBy(desc(courseDiscussions.createdAt));
      
      return discussions.map(d => ({
        ...d.discussion,
        author: d.author
      }));
    } catch (error) {
      console.error("Error getting discussions for course:", error);
      return [];
    }
  }
  
  async addDiscussionReply(reply: any): Promise<any> {
    try {
      const [newReply] = await db
        .insert(discussionReplies)
        .values(reply)
        .returning();
      return newReply;
    } catch (error) {
      console.error("Error adding discussion reply:", error);
      throw error;
    }
  }
  
  // Bookmark functions
  async getUserBookmarks(userId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(desc(bookmarks.createdAt));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return [];
    }
  }
  
  async getBookmarkByLessonAndUser(lessonId: number, userId: string): Promise<any> {
    try {
      const [bookmark] = await db
        .select()
        .from(bookmarks)
        .where(and(
          eq(bookmarks.lessonId, lessonId),
          eq(bookmarks.userId, userId)
        ));
      return bookmark;
    } catch (error) {
      console.error("Error fetching bookmark:", error);
      return null;
    }
  }
  
  async createBookmark(bookmarkData: any): Promise<any> {
    try {
      const [bookmark] = await db
        .insert(bookmarks)
        .values(bookmarkData)
        .returning();
      return bookmark;
    } catch (error) {
      console.error("Error creating bookmark:", error);
      throw error;
    }
  }
  
  async getBookmark(bookmarkId: number): Promise<any> {
    try {
      const [bookmark] = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.id, bookmarkId));
      return bookmark;
    } catch (error) {
      console.error("Error fetching bookmark:", error);
      return null;
    }
  }
  
  async updateBookmark(bookmarkId: number, data: any): Promise<any> {
    try {
      const [updated] = await db
        .update(bookmarks)
        .set(data)
        .where(eq(bookmarks.id, bookmarkId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      throw error;
    }
  }
  
  async deleteBookmark(bookmarkId: number): Promise<boolean> {
    try {
      await db
        .delete(bookmarks)
        .where(eq(bookmarks.id, bookmarkId));
      return true;
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      return false;
    }
  }
  
  // Content search
  async searchContent(query: string): Promise<any[]> {
    try {
      // Perform basic search across content tables
      const courseResults = await db
        .select()
        .from(courses)
        .where(
          or(
            sql`${courses.title} ILIKE ${`%${query}%`}`,
            sql`${courses.description} ILIKE ${`%${query}%`}`
          )
        )
        .limit(10);
      
      const lessonResults = await db
        .select({
          lesson: lessons,
          course: {
            id: courses.id,
            title: courses.title
          }
        })
        .from(lessons)
        .leftJoin(modules, eq(lessons.moduleId, modules.id))
        .leftJoin(courses, eq(modules.courseId, courses.id))
        .where(
          or(
            sql`${lessons.title} ILIKE ${`%${query}%`}`,
            sql`${lessons.content} ILIKE ${`%${query}%`}`
          )
        )
        .limit(10);
      
      return [
        ...courseResults.map(course => ({ type: 'course', item: course })),
        ...lessonResults.map(result => ({ 
          type: 'lesson', 
          item: {
            ...result.lesson,
            course: result.course
          }
        }))
      ];
    } catch (error) {
      console.error("Error performing search:", error);
      return [];
    }
  }
  
  // Content sharing
  async createContentShare(shareData: any): Promise<any> {
    try {
      const [share] = await db
        .insert(contentShares)
        .values(shareData)
        .returning();
      return share;
    } catch (error) {
      console.error("Error creating content share:", error);
      throw error;
    }
  }
  
  async getContentShareByCode(code: string): Promise<any> {
    try {
      const [share] = await db
        .select()
        .from(contentShares)
        .where(eq(contentShares.shareCode, code));
      return share;
    } catch (error) {
      console.error("Error fetching content share:", error);
      return null;
    }
  }
  
  async updateContentShareAccess(shareId: number, accessData: any): Promise<any> {
    try {
      const [updated] = await db
        .update(contentShares)
        .set({
          lastAccessedAt: new Date(),
          accessCount: sql`${contentShares.accessCount} + 1`,
          ...accessData
        })
        .where(eq(contentShares.id, shareId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating content share access:", error);
      throw error;
    }
  }
  
  // Certificate generation
  async generateCertificate(certificateData: InsertCertificate): Promise<Certificate> {
    try {
      const [certificate] = await db
        .insert(certificates)
        .values(certificateData)
        .returning();
      return certificate;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw error;
    }
  }

  // Course Discussion methods
  async getCourseDiscussions(courseId: number): Promise<any[]> {
    try {
      const discussions = await db
        .select({
          discussion: courseDiscussions,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(courseDiscussions)
        .leftJoin(users, eq(courseDiscussions.userId, users.id))
        .where(eq(courseDiscussions.courseId, courseId))
        .orderBy(desc(courseDiscussions.createdAt));

      return discussions.map(row => ({
        ...row.discussion,
        userName: row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() : 'Anonymous',
        userRole: row.user?.role || 'student'
      }));
    } catch (error) {
      console.error("Error fetching course discussions:", error);
      return [];
    }
  }

  async createCourseDiscussion(discussionData: any): Promise<any> {
    try {
      const [discussion] = await db
        .insert(courseDiscussions)
        .values({
          courseId: discussionData.courseId,
          userId: discussionData.userId,
          title: discussionData.title,
          content: discussionData.content,
          isAnnouncement: discussionData.isAnnouncement || false,
          createdAt: new Date()
        })
        .returning();

      // Get user info to return with the discussion
      const user = await this.getUser(discussionData.userId);
      
      return {
        ...discussion,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Anonymous',
        userRole: user?.role || 'student'
      };
    } catch (error) {
      console.error("Error creating course discussion:", error);
      throw new Error("Failed to create discussion");
    }
  }

  // Invoice Management Methods
  async generateInvoiceNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    try {
      const invoiceNumber = await this.generateInvoiceNumber();
      
      const [invoice] = await db
        .insert(invoices)
        .values({
          ...invoiceData,
          invoiceNumber
        })
        .returning();

      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("Failed to create invoice");
    }
  }

  async getInvoice(invoiceId: number): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId));

      return invoice;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return undefined;
    }
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber));

      return invoice;
    } catch (error) {
      console.error("Error fetching invoice by number:", error);
      return undefined;
    }
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    try {
      const userInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt));

      return userInvoices;
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      return [];
    }
  }

  async updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date): Promise<Invoice> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (paidAt) {
        updateData.paidAt = paidAt;
      }

      const [invoice] = await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, invoiceId))
        .returning();

      return invoice;
    } catch (error) {
      console.error("Error updating invoice status:", error);
      throw new Error("Failed to update invoice status");
    }
  }

  // Payment Transaction Management Methods
  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    try {
      const [transaction] = await db
        .insert(paymentTransactions)
        .values(transactionData)
        .returning();

      return transaction;
    } catch (error) {
      console.error("Error creating payment transaction:", error);
      throw new Error("Failed to create payment transaction");
    }
  }

  async getPaymentTransaction(transactionId: number): Promise<PaymentTransaction | undefined> {
    try {
      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, transactionId));

      return transaction;
    } catch (error) {
      console.error("Error fetching payment transaction:", error);
      return undefined;
    }
  }

  async getPaymentTransactionByReference(reference: string): Promise<PaymentTransaction | undefined> {
    try {
      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.reference, reference));

      return transaction;
    } catch (error) {
      console.error("Error fetching payment transaction by reference:", error);
      return undefined;
    }
  }

  async updatePaymentTransaction(transactionId: number, updateData: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    try {
      const [transaction] = await db
        .update(paymentTransactions)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, transactionId))
        .returning();

      return transaction;
    } catch (error) {
      console.error("Error updating payment transaction:", error);
      throw new Error("Failed to update payment transaction");
    }
  }

  async updatePaymentTransactionStatus(reference: string, status: string, updateData?: any): Promise<PaymentTransaction> {
    try {
      const updateFields: any = {
        status,
        updatedAt: new Date()
      };

      if (updateData) {
        if (updateData.providerResponse) updateFields.providerResponse = updateData.providerResponse;
        if (updateData.fees !== undefined) updateFields.fees = updateData.fees;
        if (updateData.netAmount !== undefined) updateFields.netAmount = updateData.netAmount;
        if (updateData.channel) updateFields.channel = updateData.channel;
      }

      const [transaction] = await db
        .update(paymentTransactions)
        .set(updateFields)
        .where(eq(paymentTransactions.reference, reference))
        .returning();

      return transaction;
    } catch (error) {
      console.error("Error updating payment transaction status:", error);
      throw new Error("Failed to update payment transaction status");
    }
  }

  async getUserPaymentTransactions(userId: string): Promise<PaymentTransaction[]> {
    try {
      const transactions = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt));

      return transactions;
    } catch (error) {
      console.error("Error fetching user payment transactions:", error);
      return [];
    }
  }

  // Additional payment methods
  async createPaymentRecord(paymentData: any): Promise<any> {
    try {
      const [payment] = await db
        .insert(paymentTransactions)
        .values({
          userId: paymentData.userId,
          reference: paymentData.reference,
          amount: paymentData.amount,
          currency: paymentData.currency || 'NGN',
          status: paymentData.status,
          provider: paymentData.provider || 'paystack',
          providerReference: paymentData.providerReference,
          providerResponse: paymentData.providerResponse,
          fees: paymentData.fees || 0,
          netAmount: paymentData.netAmount || paymentData.amount,
          gateway: paymentData.gateway,
          channel: paymentData.channel
        })
        .returning();
      return payment;
    } catch (error) {
      console.error("Error creating payment record:", error);
      throw error;
    }
  }

  async getPaymentByReference(reference: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.reference, reference));
      return payment;
    } catch (error) {
      console.error("Error getting payment by reference:", error);
      return null;
    }
  }

  async getPaymentStats(): Promise<any> {
    try {
      // Get basic payment statistics
      const totalRevenue = await db
        .select({ total: sql`COALESCE(SUM(amount), 0)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'completed'));

      const totalTransactions = await db
        .select({ count: sql`COUNT(*)` })
        .from(paymentTransactions);

      const successfulTransactions = await db
        .select({ count: sql`COUNT(*)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'completed'));

      const pendingTransactions = await db
        .select({ count: sql`COUNT(*)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'pending'));

      const failedTransactions = await db
        .select({ count: sql`COUNT(*)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'failed'));

      const totalFees = await db
        .select({ total: sql`COALESCE(SUM(fees), 0)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'completed'));

      const netRevenue = await db
        .select({ total: sql`COALESCE(SUM(net_amount), 0)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'completed'));

      // Calculate average transaction value
      const avgTransaction = totalRevenue[0]?.total && successfulTransactions[0]?.count
        ? Number(totalRevenue[0].total) / Number(successfulTransactions[0].count)
        : 0;

      // Get monthly revenue trend (last 6 months)
      const monthlyRevenue = await db
        .select({
          month: sql`TO_CHAR(created_at, 'YYYY-MM')`,
          revenue: sql`COALESCE(SUM(amount), 0)`,
          transactions: sql`COUNT(*)`
        })
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.status, 'completed'),
            sql`created_at >= NOW() - INTERVAL '6 months'`
          )
        )
        .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM') DESC`);

      // Get top performing courses by revenue
      const topCourses = await db
        .select({
          courseId: enrollments.courseId,
          courseTitle: courses.title,
          revenue: sql`COALESCE(SUM(payment_amount), 0)`,
          enrollments: sql`COUNT(*)`
        })
        .from(enrollments)
        .leftJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.paymentStatus, 'completed'))
        .groupBy(enrollments.courseId, courses.title)
        .orderBy(sql`SUM(payment_amount) DESC`)
        .limit(10);

      return {
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        totalTransactions: Number(totalTransactions[0]?.count || 0),
        successfulTransactions: Number(successfulTransactions[0]?.count || 0),
        pendingTransactions: Number(pendingTransactions[0]?.count || 0),
        failedTransactions: Number(failedTransactions[0]?.count || 0),
        totalFees: Number(totalFees[0]?.total || 0),
        netRevenue: Number(netRevenue[0]?.total || 0),
        averageTransactionValue: avgTransaction,
        monthlyRevenue: monthlyRevenue.map(m => ({
          month: m.month,
          revenue: Number(m.revenue),
          transactions: Number(m.transactions)
        })),
        topCourses: topCourses.map(c => ({
          courseId: c.courseId,
          courseTitle: c.courseTitle,
          revenue: Number(c.revenue),
          enrollments: Number(c.enrollments)
        }))
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      throw error;
    }
  }

  async getAllPaymentTransactions(): Promise<any[]> {
    try {
      const payments = await db
        .select({
          id: paymentTransactions.id,
          reference: paymentTransactions.reference,
          userId: paymentTransactions.userId,
          userEmail: users.email,
          userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          courseId: paymentTransactions.courseId,
          courseTitle: courses.title,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          status: paymentTransactions.status,
          provider: paymentTransactions.provider,
          channel: paymentTransactions.channel,
          fees: paymentTransactions.fees,
          netAmount: paymentTransactions.netAmount,
          createdAt: paymentTransactions.createdAt,
          updatedAt: paymentTransactions.updatedAt
        })
        .from(paymentTransactions)
        .leftJoin(users, eq(paymentTransactions.userId, users.id))
        .leftJoin(courses, eq(paymentTransactions.courseId, courses.id))
        .orderBy(desc(paymentTransactions.createdAt));

      return payments;
    } catch (error) {
      console.error("Error getting all payment transactions:", error);
      throw error;
    }
  }

  async updatePaymentStatus(reference: string, status: string, paymentData?: any): Promise<any> {
    try {
      const updateData: any = { status };
      if (paymentData) {
        updateData.providerResponse = paymentData;
        if (status === 'success') {
          updateData.updatedAt = new Date();
        }
      }

      const [payment] = await db
        .update(paymentTransactions)
        .set(updateData)
        .where(eq(paymentTransactions.reference, reference))
        .returning();
      return payment;
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

  async getUserPayments(userId: string): Promise<any[]> {
    try {
      const payments = await db
        .select({
          payment: paymentTransactions,
          course: {
            id: courses.id,
            title: courses.title,
            thumbnail: courses.thumbnail
          }
        })
        .from(paymentTransactions)
        .leftJoin(invoices, eq(paymentTransactions.invoiceId, invoices.id))
        .leftJoin(courses, eq(invoices.courseId, courses.id))
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt));

      return payments.map(p => ({
        ...p.payment,
        course: p.course
      }));
    } catch (error) {
      console.error("Error getting user payments:", error);
      return [];
    }
  }

  async getPaymentStats(): Promise<any> {
    try {
      const stats = await db
        .select({
          totalRevenue: sql<number>`sum(${paymentTransactions.amount})`,
          totalTransactions: sql<number>`count(*)`,
          successfulPayments: sql<number>`count(case when ${paymentTransactions.status} = 'success' then 1 end)`,
          pendingPayments: sql<number>`count(case when ${paymentTransactions.status} = 'pending' then 1 end)`,
          failedPayments: sql<number>`count(case when ${paymentTransactions.status} = 'failed' then 1 end)`
        })
        .from(paymentTransactions);

      return stats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      };
    }
  }

  async getEnrollmentByUserAndCourse(userId: string, courseId: number): Promise<any> {
    try {
      const [enrollment] = await db
        .select()
        .from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        ));
      return enrollment;
    } catch (error) {
      console.error("Error getting enrollment:", error);
      return null;
    }
  }

  async createEnrollment(enrollmentData: any): Promise<any> {
    try {
      const [enrollment] = await db
        .insert(courseEnrollments)
        .values({
          userId: enrollmentData.userId,
          courseId: enrollmentData.courseId,
          progress: enrollmentData.progress || 0,
          paymentStatus: enrollmentData.paymentStatus,
          paymentMethod: enrollmentData.paymentMethod,
          paymentAmount: enrollmentData.paymentAmount,
          paymentReference: enrollmentData.paymentReference,
          paymentProvider: enrollmentData.paymentProvider || 'paystack',
          enrolledAt: new Date()
        })
        .returning();
      return enrollment;
    } catch (error) {
      console.error("Error creating enrollment:", error);
      throw error;
    }
  }

  // Assessment & Grading System Implementation
  async createAutomatedQuiz(quizData: any): Promise<any> {
    try {
      const [quiz] = await db.insert(automatedQuizzes).values({
        ...quizData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return quiz;
    } catch (error) {
      console.error("Error creating automated quiz:", error);
      throw error;
    }
  }

  async getAllAutomatedQuizzes(): Promise<any[]> {
    try {
      return await db.select().from(automatedQuizzes);
    } catch (error) {
      console.error("Error fetching automated quizzes:", error);
      return [];
    }
  }

  async getAutomatedQuizzesByCourse(courseId: number): Promise<any[]> {
    try {
      return await db.select().from(automatedQuizzes).where(eq(automatedQuizzes.courseId, courseId));
    } catch (error) {
      console.error("Error fetching quizzes by course:", error);
      return [];
    }
  }

  // Method removed - using getQuiz instead for basic quiz structure

  async updateAutomatedQuiz(quizId: number, quizData: any): Promise<any> {
    try {
      const [quiz] = await db.update(automatedQuizzes)
        .set({ ...quizData, updatedAt: new Date() })
        .where(eq(automatedQuizzes.id, quizId)).returning();
      return quiz;
    } catch (error) {
      console.error("Error updating automated quiz:", error);
      throw error;
    }
  }

  async deleteAutomatedQuiz(quizId: number): Promise<void> {
    try {
      await db.delete(automatedQuizzes).where(eq(automatedQuizzes.id, quizId));
    } catch (error) {
      console.error("Error deleting automated quiz:", error);
      throw error;
    }
  }

  async getQuiz(quizId: number): Promise<any> {
    try {
      const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
      return quiz;
    } catch (error) {
      console.error("Error fetching quiz:", error);
      throw error;
    }
  }

  async getAllQuizzes(): Promise<any[]> {
    try {
      const allQuizzes = await db.select().from(quizzes);
      return allQuizzes;
    } catch (error) {
      console.error("Error fetching all quizzes:", error);
      return [];
    }
  }

  async getQuizQuestions(quizId: number): Promise<any[]> {
    try {
      const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
      return questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer
      }));
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      throw error;
    }
  }

  async createQuizQuestion(questionData: any): Promise<any> {
    try {
      const [question] = await db.insert(quizQuestions).values({
        quizId: questionData.quizId,
        question: questionData.question,
        type: questionData.type,
        options: JSON.stringify(questionData.options || []),
        correctAnswer: JSON.stringify([questionData.correctAnswer]),
        points: questionData.points || 1,
        orderIndex: questionData.orderIndex || 0
      }).returning();
      return question;
    } catch (error) {
      console.error("Error creating quiz question:", error);
      throw error;
    }
  }

  async createQuizAttempt(attemptData: any): Promise<any> {
    try {
      const [attempt] = await db.insert(assessmentQuizAttempts).values({
        ...attemptData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return attempt;
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      throw error;
    }
  }

  async getQuizAttempts(quizId: number): Promise<any[]> {
    try {
      return await db.select().from(assessmentQuizAttempts).where(eq(assessmentQuizAttempts.quizId, quizId));
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      return [];
    }
  }

  async getUserQuizAttempts(userId: string, quizId?: number): Promise<any[]> {
    try {
      let query = db.select().from(assessmentQuizAttempts).where(eq(assessmentQuizAttempts.userId, userId));
      if (quizId) {
        query = query.where(eq(assessmentQuizAttempts.quizId, quizId));
      }
      return await query;
    } catch (error) {
      console.error("Error fetching user quiz attempts:", error);
      return [];
    }
  }

  async getQuizAttempt(attemptId: number): Promise<any> {
    try {
      const [attempt] = await db.select().from(assessmentQuizAttempts).where(eq(assessmentQuizAttempts.id, attemptId));
      return attempt;
    } catch (error) {
      console.error("Error fetching quiz attempt:", error);
      return null;
    }
  }

  async createAssignmentRubric(rubricData: any): Promise<any> {
    try {
      const [rubric] = await db.insert(assignmentRubrics).values({
        ...rubricData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return rubric;
    } catch (error) {
      console.error("Error creating assignment rubric:", error);
      throw error;
    }
  }

  async getAllRubrics(): Promise<any[]> {
    try {
      return await db.select().from(assignmentRubrics);
    } catch (error) {
      console.error("Error fetching all rubrics:", error);
      return [];
    }
  }

  async getRubricsByCourse(courseId: number): Promise<any[]> {
    try {
      return await db.select().from(assignmentRubrics).where(eq(assignmentRubrics.courseId, courseId));
    } catch (error) {
      console.error("Error fetching rubrics by course:", error);
      return [];
    }
  }

  async getRubricsByAssignment(assignmentId: number): Promise<any[]> {
    try {
      return await db.select().from(assignmentRubrics).where(eq(assignmentRubrics.assignmentId, assignmentId));
    } catch (error) {
      console.error("Error fetching rubrics by assignment:", error);
      return [];
    }
  }

  async getAssignmentRubric(rubricId: number): Promise<any> {
    try {
      const [rubric] = await db.select().from(assignmentRubrics).where(eq(assignmentRubrics.id, rubricId));
      return rubric;
    } catch (error) {
      console.error("Error fetching assignment rubric:", error);
      return null;
    }
  }

  async createRubricCriteria(criteriaData: any): Promise<any> {
    try {
      const [criteria] = await db.insert(rubricCriteria).values({
        ...criteriaData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return criteria;
    } catch (error) {
      console.error("Error creating rubric criteria:", error);
      throw error;
    }
  }

  async getRubricCriteria(rubricId: number): Promise<any[]> {
    try {
      return await db.select().from(rubricCriteria).where(eq(rubricCriteria.rubricId, rubricId));
    } catch (error) {
      console.error("Error fetching rubric criteria:", error);
      return [];
    }
  }

  async createAssignmentGrade(gradeData: any): Promise<any> {
    try {
      const [grade] = await db.insert(assignmentGrades).values({
        ...gradeData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return grade;
    } catch (error) {
      console.error("Error creating assignment grade:", error);
      throw error;
    }
  }

  async getAssignmentGrades(assignmentId: number): Promise<any[]> {
    try {
      return await db.select().from(assignmentGrades).where(eq(assignmentGrades.assignmentId, assignmentId));
    } catch (error) {
      console.error("Error fetching assignment grades:", error);
      return [];
    }
  }

  async createPeerReview(reviewData: any): Promise<any> {
    try {
      const [review] = await db.insert(peerReviews).values({
        ...reviewData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return review;
    } catch (error) {
      console.error("Error creating peer review:", error);
      throw error;
    }
  }

  async getPeerReviews(submissionId: number): Promise<any[]> {
    try {
      return await db.select().from(peerReviews).where(eq(peerReviews.submissionId, submissionId));
    } catch (error) {
      console.error("Error fetching peer reviews:", error);
      return [];
    }
  }

  async createStudentProgress(progressData: any): Promise<any> {
    try {
      const [progress] = await db.insert(studentProgress).values({
        ...progressData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return progress;
    } catch (error) {
      console.error("Error creating student progress:", error);
      throw error;
    }
  }

  async getStudentProgress(studentId: string, courseId: number): Promise<any> {
    try {
      const [progress] = await db.select().from(studentProgress)
        .where(and(eq(studentProgress.studentId, studentId), eq(studentProgress.courseId, courseId)));
      return progress;
    } catch (error) {
      console.error("Error fetching student progress:", error);
      return null;
    }
  }

  async getAllStudentProgress(studentId: string): Promise<any[]> {
    try {
      return await db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));
    } catch (error) {
      console.error("Error fetching all student progress:", error);
      return [];
    }
  }

  async updateStudentProgress(progressId: number, progressData: any): Promise<any> {
    try {
      const [progress] = await db.update(studentProgress)
        .set({ ...progressData, updatedAt: new Date() })
        .where(eq(studentProgress.id, progressId)).returning();
      return progress;
    } catch (error) {
      console.error("Error updating student progress:", error);
      throw error;
    }
  }

  async createLearningAnalytics(analyticsData: any): Promise<any> {
    try {
      const [analytics] = await db.insert(learningAnalytics).values({
        ...analyticsData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return analytics;
    } catch (error) {
      console.error("Error creating learning analytics:", error);
      throw error;
    }
  }

  async getLearningAnalytics(studentId: string, courseId: number): Promise<any> {
    try {
      const [analytics] = await db.select().from(learningAnalytics)
        .where(and(eq(learningAnalytics.studentId, studentId), eq(learningAnalytics.courseId, courseId)));
      return analytics;
    } catch (error) {
      console.error("Error fetching learning analytics:", error);
      return null;
    }
  }

  async getAllLearningAnalytics(): Promise<any[]> {
    try {
      return await db.select().from(learningAnalytics);
    } catch (error) {
      console.error("Error fetching all learning analytics:", error);
      return [];
    }
  }

  async createCertificateTemplate(templateData: any): Promise<any> {
    try {
      const [template] = await db.insert(certificateTemplates).values({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return template;
    } catch (error) {
      console.error("Error creating certificate template:", error);
      throw error;
    }
  }

  async getAllCertificateTemplates(): Promise<any[]> {
    try {
      return await db.select().from(certificateTemplates);
    } catch (error) {
      console.error("Error fetching certificate templates:", error);
      return [];
    }
  }

  async getCertificateTemplatesByCourse(courseId: number): Promise<any[]> {
    try {
      return await db.select().from(certificateTemplates).where(eq(certificateTemplates.courseId, courseId));
    } catch (error) {
      console.error("Error fetching certificate templates by course:", error);
      return [];
    }
  }

  async createGeneratedCertificate(certificateData: any): Promise<any> {
    try {
      const [certificate] = await db.insert(generatedCertificates).values({
        ...certificateData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return certificate;
    } catch (error) {
      console.error("Error creating generated certificate:", error);
      throw error;
    }
  }

  async getGeneratedCertificates(userId: string): Promise<any[]> {
    try {
      return await db.select().from(generatedCertificates).where(eq(generatedCertificates.studentId, userId));
    } catch (error) {
      console.error("Error fetching generated certificates:", error);
      return [];
    }
  }

  async getAssignmentsByCourse(courseId: number): Promise<any[]> {
    try {
      return await db.select().from(assignments).where(eq(assignments.lessonId, courseId));
    } catch (error) {
      console.error("Error fetching assignments by course:", error);
      return [];
    }
  }

  async getAllAssignments(): Promise<any[]> {
    try {
      return await db.select().from(assignments);
    } catch (error) {
      console.error("Error fetching all assignments:", error);
      return [];
    }
  }

  // Additional missing methods for Assessment Routes
  async createQuizAnswer(answerData: any): Promise<any> {
    try {
      const [answer] = await db.insert(assessmentQuizAnswers).values({
        ...answerData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return answer;
    } catch (error) {
      console.error("Error creating quiz answer:", error);
      throw error;
    }
  }

  async updateQuizAttempt(attemptId: number, attemptData: any): Promise<any> {
    try {
      const [attempt] = await db.update(assessmentQuizAttempts)
        .set({ ...attemptData, updatedAt: new Date() })
        .where(eq(assessmentQuizAttempts.id, attemptId)).returning();
      return attempt;
    } catch (error) {
      console.error("Error updating quiz attempt:", error);
      throw error;
    }
  }

  async getQuizAnswers(attemptId: number): Promise<any[]> {
    try {
      return await db.select().from(assessmentQuizAnswers).where(eq(assessmentQuizAnswers.attemptId, attemptId));
    } catch (error) {
      console.error("Error fetching quiz answers:", error);
      return [];
    }
  }

  async getAssignedPeerReviews(userId: string): Promise<any[]> {
    try {
      return await db.select().from(peerReviews).where(eq(peerReviews.reviewerId, userId));
    } catch (error) {
      console.error("Error fetching assigned peer reviews:", error);
      return [];
    }
  }

  async updatePeerReview(reviewId: number, reviewData: any): Promise<any> {
    try {
      const [review] = await db.update(peerReviews)
        .set({ ...reviewData, updatedAt: new Date() })
        .where(eq(peerReviews.id, reviewId)).returning();
      return review;
    } catch (error) {
      console.error("Error updating peer review:", error);
      throw error;
    }
  }

  async getPeerReview(reviewId: number): Promise<any> {
    try {
      const [review] = await db.select().from(peerReviews).where(eq(peerReviews.id, reviewId));
      return review;
    } catch (error) {
      console.error("Error fetching peer review:", error);
      return null;
    }
  }

  async getUserCourseCertificates(userId: string, courseId: number): Promise<any[]> {
    try {
      return await db.select().from(generatedCertificates)
        .where(and(eq(generatedCertificates.studentId, userId), eq(generatedCertificates.courseId, courseId)));
    } catch (error) {
      console.error("Error fetching user course certificates:", error);
      return [];
    }
  }

  async getCertificateByVerificationCode(verificationCode: string): Promise<any> {
    try {
      const [certificate] = await db.select().from(generatedCertificates)
        .where(eq(generatedCertificates.verificationCode, verificationCode));
      return certificate;
    } catch (error) {
      console.error("Error fetching certificate by verification code:", error);
      return null;
    }
  }

  // Analytics methods for Assessment Dashboard
  async countQuizzesByCourse(courseId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(automatedQuizzes)
        .where(eq(automatedQuizzes.courseId, courseId));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Error counting quizzes by course:", error);
      return 0;
    }
  }

  async countQuizAttemptsByCourse(courseId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(assessmentQuizAttempts)
        .innerJoin(automatedQuizzes, eq(assessmentQuizAttempts.quizId, automatedQuizzes.id))
        .where(eq(automatedQuizzes.courseId, courseId));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Error counting quiz attempts by course:", error);
      return 0;
    }
  }

  async getAverageQuizScoreByCourse(courseId: number): Promise<number> {
    try {
      const result = await db.select({ avg: sql`avg(${assessmentQuizAttempts.score})` })
        .from(assessmentQuizAttempts)
        .innerJoin(automatedQuizzes, eq(assessmentQuizAttempts.quizId, automatedQuizzes.id))
        .where(eq(automatedQuizzes.courseId, courseId));
      return Number(result[0]?.avg || 0);
    } catch (error) {
      console.error("Error getting average quiz score by course:", error);
      return 0;
    }
  }

  async getQuizCompletionRate(courseId: number): Promise<number> {
    try {
      const totalQuizzes = await this.countQuizzesByCourse(courseId);
      const completedAttempts = await db.select({ count: sql`count(*)` })
        .from(assessmentQuizAttempts)
        .innerJoin(automatedQuizzes, eq(assessmentQuizAttempts.quizId, automatedQuizzes.id))
        .where(and(eq(automatedQuizzes.courseId, courseId), eq(assessmentQuizAttempts.status, 'completed')));
      
      const completed = Number(completedAttempts[0]?.count || 0);
      return totalQuizzes > 0 ? (completed / totalQuizzes) * 100 : 0;
    } catch (error) {
      console.error("Error getting quiz completion rate:", error);
      return 0;
    }
  }

  async getTopPerformers(courseId: number, limit: number = 10): Promise<any[]> {
    try {
      return await db.select({
        userId: assessmentQuizAttempts.userId,
        averageScore: sql`avg(${assessmentQuizAttempts.score})`,
        totalAttempts: sql`count(*)`
      })
        .from(assessmentQuizAttempts)
        .innerJoin(automatedQuizzes, eq(assessmentQuizAttempts.quizId, automatedQuizzes.id))
        .where(eq(automatedQuizzes.courseId, courseId))
        .groupBy(assessmentQuizAttempts.userId)
        .orderBy(sql`avg(${assessmentQuizAttempts.score}) desc`)
        .limit(limit);
    } catch (error) {
      console.error("Error getting top performers:", error);
      return [];
    }
  }

  async getStrugglingStudents(courseId: number, threshold: number = 60): Promise<any[]> {
    try {
      return await db.select({
        userId: assessmentQuizAttempts.userId,
        averageScore: sql`avg(${assessmentQuizAttempts.score})`,
        totalAttempts: sql`count(*)`
      })
        .from(assessmentQuizAttempts)
        .innerJoin(automatedQuizzes, eq(assessmentQuizAttempts.quizId, automatedQuizzes.id))
        .where(eq(automatedQuizzes.courseId, courseId))
        .groupBy(assessmentQuizAttempts.userId)
        .having(sql`avg(${assessmentQuizAttempts.score}) < ${threshold}`)
        .orderBy(sql`avg(${assessmentQuizAttempts.score}) asc`);
    } catch (error) {
      console.error("Error getting struggling students:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
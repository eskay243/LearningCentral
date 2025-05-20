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
  certificates,
  coupons,
  courseRatings,
  lessonProgress,
  courseEnrollments,
  mentorCourses,
  affiliateCommissions,
  courseDiscussions,
  discussionReplies,
  notificationSettings,
  notifications,
  codingExercises,
  exerciseProgress,
  // Communication related schema
  conversations,
  conversationParticipants,
  chatMessages,
  messageReactions,
  courseAnnouncements,
  // Regular types
  type User,
  type UpsertUser,
  type Course,
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
  type InsertConversation,
  type InsertConversationParticipant,
  type InsertChatMessage,
  type InsertMessageReaction,
  type InsertCourseAnnouncement,
  UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, isNull, count, sql, not, inArray, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
  updateCourseProgress(enrollmentId: number, progress: number): Promise<CourseEnrollment>;
  
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
  getLiveSessionsByCourse(courseId: number): Promise<LiveSession[]>;
  getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]>;
  updateLiveSession(id: number, updates: Partial<LiveSession>): Promise<LiveSession>;
  recordAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance>;
  getLiveSessionAttendance(sessionId: number): Promise<LiveSessionAttendance[]>;
  getLiveSessionAttendanceByUser(userId: string): Promise<LiveSessionAttendance[]>;
  
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
  
  // Certificates
  issueCertificate(certificateData: Omit<Certificate, "id" | "issuedAt">): Promise<Certificate>;
  getUserCertificates(userId: string): Promise<Certificate[]>;
  
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

  // Live session implementation
  getUpcomingLiveSessions(options?: { courseId?: number; limit?: number }): Promise<LiveSession[]>;
  getLiveSession(id: number): Promise<LiveSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Live Session Operations
  async createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession> {
    const [session] = await db
      .insert(liveSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getLiveSessionsByCourse(courseId: number): Promise<LiveSession[]> {
    // First, get modules for the course
    const courseModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.courseId, courseId));
    
    if (courseModules.length === 0) {
      return [];
    }
    
    const moduleIds = courseModules.map(module => module.id);
    
    // Next, get lessons for these modules
    const moduleLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(inArray(lessons.moduleId, moduleIds));
    
    if (moduleLessons.length === 0) {
      return [];
    }
    
    const lessonIds = moduleLessons.map(lesson => lesson.id);
    
    // Finally, get live sessions for these lessons
    return db
      .select()
      .from(liveSessions)
      .where(inArray(liveSessions.lessonId, lessonIds))
      .orderBy(asc(liveSessions.startTime));
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
          gte(liveSessions.startTime, now),
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
      .where(and(
        gte(liveSessions.startTime, now),
        eq(liveSessions.status, "scheduled")
      ))
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
  
  async recordAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance> {
    const [attendance] = await db
      .insert(liveSessionAttendance)
      .values(attendanceData)
      .returning();
    return attendance;
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
      .orderBy(desc(liveSessionAttendance.joinedAt));
  }
  // Communication - Conversations
  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(conversationData).returning();
    return conversation;
  }

  async getConversation(conversationId: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    // Get all conversations where the user is a participant
    const userConversations = await db
      .select({
        conversationId: conversationParticipants.conversationId
      })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    if (userConversations.length === 0) {
      return [];
    }

    const conversationIds = userConversations.map(c => c.conversationId);
    
    return await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, conversationIds));
  }

  async getCourseConversations(courseId: number): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.courseId, courseId));
  }

  async updateConversation(conversationId: number, updateData: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }
  
  async createUser(userData: any): Promise<User> {
    try {
      // If password is provided, we would hash it here
      // For this implementation, we'll store it as is (not secure for production)
      // In a real app, you would use bcrypt: const hashedPassword = await bcrypt.hash(userData.password, 10);
      
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

  async getUsersByRole(role?: string): Promise<User[]> {
    try {
      let query = db.select().from(users);
      
      if (role) {
        query = query.where(eq(users.role, role));
      }
      
      const userList = await query;
      return userList;
    } catch (error) {
      console.error(`Error fetching users:`, error);
      return [];
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

  async getQuizzesByMentor(mentorId: string): Promise<Quiz[]> {
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
      
      // Get all quizzes from these courses
      const allQuizzes = [];
      for (const courseId of courseIds) {
        const quizzes = await this.getQuizzes({ courseId });
        allQuizzes.push(...quizzes);
      }
      
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

  async getUserQuizAttempts(userId: string, quizId?: number): Promise<QuizAttempt[]> {
    try {
      let query = db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, userId));
      
      if (quizId) {
        query = query.where(eq(quizAttempts.quizId, quizId));
      }
      
      return await query.orderBy(desc(quizAttempts.completedAt));
    } catch (error) {
      console.error("Error fetching user quiz attempts:", error);
      return [];
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

  async getAssignmentsByMentor(mentorId: string): Promise<Assignment[]> {
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
      
      // Get all assignments from these courses
      const allAssignments = [];
      for (const courseId of courseIds) {
        const assignments = await this.getAssignments({ courseId });
        allAssignments.push(...assignments);
      }
      
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

  async getCourses(options?: { published?: boolean }): Promise<Course[]> {
    try {
      let query = db.select().from(courses);
      
      if (options?.published !== undefined) {
        query = query.where(eq(courses.isPublished, options.published));
      }
      
      return await query.orderBy(desc(courses.createdAt));
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  }

  async getCoursesByMentor(mentorId: string): Promise<Course[]> {
    try {
      const coursesWithMentor = await db
        .select({
          course: courses
        })
        .from(mentorCourses)
        .innerJoin(courses, eq(mentorCourses.courseId, courses.id))
        .where(eq(mentorCourses.mentorId, mentorId));
      
      return coursesWithMentor.map(row => row.course);
    } catch (error) {
      console.error("Error fetching mentor courses:", error);
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
      
      const announcements = await db
        .select({
          announcement: courseAnnouncements,
          creator: users
        })
        .from(courseAnnouncements)
        .leftJoin(users, eq(courseAnnouncements.createdBy, users.id))
        .where(eq(courseAnnouncements.courseId, courseId))
        .orderBy(desc(courseAnnouncements.createdAt))
        .limit(limit)
        .offset(offset);
      
      return announcements.map(row => ({
        ...row.announcement,
        creator: row.creator
      }));
    } catch (error) {
      console.error("Error fetching course announcements:", error);
      return [];
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
}

export const storage = new DatabaseStorage();
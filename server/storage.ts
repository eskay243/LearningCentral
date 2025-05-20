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
  messages,
  announcements,
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
  type Message,
  type Announcement,
  type Certificate,
  type Coupon,
  type CourseRating,
  type LessonProgress,
  type CourseEnrollment,
  type MentorCourse,
  type AffiliateCommission,
  UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, isNull, count, sql, not, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
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
  getQuizzesByLesson(lessonId: number): Promise<Quiz[]>;
  addQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  submitQuizAttempt(attemptData: Omit<QuizAttempt, "id">): Promise<QuizAttempt>;
  getQuizAttempts(quizId: number, userId: string): Promise<QuizAttempt[]>;
  
  // Assignment operations
  createAssignment(assignmentData: Omit<Assignment, "id">): Promise<Assignment>;
  getAssignmentsByLesson(lessonId: number): Promise<Assignment[]>;
  submitAssignment(submissionData: Omit<AssignmentSubmission, "id">): Promise<AssignmentSubmission>;
  gradeAssignment(submissionId: number, grade: number, feedback: string, gradedBy: string): Promise<AssignmentSubmission>;
  
  // Live session operations
  createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession>;
  getUpcomingLiveSessions(mentorId?: string): Promise<LiveSession[]>;
  recordLiveSessionAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance>;
  
  // Message operations
  sendMessage(messageData: Omit<Message, "id" | "sentAt" | "readAt">): Promise<Message>;
  getMessagesForUser(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<Message>;
  
  // Course discussion operations
  createDiscussion(discussionData: Omit<CourseDiscussion, "id" | "createdAt">): Promise<CourseDiscussion>;
  getDiscussionsByCourse(courseId: number): Promise<CourseDiscussion[]>;
  addDiscussionReply(replyData: Omit<DiscussionReply, "id" | "createdAt">): Promise<DiscussionReply>;
  
  // Notification operations
  createNotification(notificationData: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  getUserNotifications(userId: string, options?: { unreadOnly?: boolean }): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
  
  // Statistics and analytics
  getCourseStats(courseId: number): Promise<any>;
  getMentorStats(mentorId: string): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
  
  // Certificate operations
  generateCertificate(userId: string, courseId: number, template: string): Promise<Certificate>;
  getUserCertificates(userId: string): Promise<Certificate[]>;
  
  // Bookmark operations
  createBookmark(bookmarkData: any): Promise<any>;
  getBookmark(bookmarkId: number): Promise<any>;
  getBookmarkByLessonAndUser(lessonId: number, userId: string): Promise<any>;
  getUserBookmarks(userId: string): Promise<any[]>;
  updateBookmark(bookmarkId: number, data: any): Promise<any>;
  deleteBookmark(bookmarkId: number): Promise<void>;
  
  // Content search
  searchContent(query: string, courseId?: number): Promise<any[]>;
  
  // Content sharing
  createContentShare(shareData: any): Promise<any>;
  getContentShareByCode(shareCode: string): Promise<any>;
  updateContentShareAccess(shareId: number): Promise<any>;
  
  // Interactive coding exercises
  createCodingExercise(exerciseData: Omit<CodingExercise, "id" | "createdAt" | "updatedAt">): Promise<CodingExercise>;
  getCodingExercise(exerciseId: number): Promise<CodingExercise | undefined>;
  getCodingExercises(options?: { moduleId?: number, lessonId?: number }): Promise<CodingExercise[]>;
  updateCodingExercise(exerciseId: number, updateData: Partial<CodingExercise>): Promise<CodingExercise>;
  
  // Exercise progress tracking
  getExerciseProgress(exerciseId: number, userId: string): Promise<ExerciseProgress | undefined>;
  updateExerciseProgress(exerciseId: number, userId: string, progressData: Partial<ExerciseProgress>): Promise<ExerciseProgress>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Course operations
  async createCourse(courseData: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return course;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({
        ...courseData,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async getCourses(options?: { published?: boolean }): Promise<Course[]> {
    let query = db.select().from(courses);
    
    if (options?.published !== undefined) {
      query = query.where(eq(courses.isPublished, options.published));
    }
    
    return await query.orderBy(desc(courses.createdAt));
  }

  async getCoursesByMentor(mentorId: string): Promise<Course[]> {
    return await db
      .select({
        course: courses,
      })
      .from(courses)
      .innerJoin(mentorCourses, eq(courses.id, mentorCourses.courseId))
      .where(eq(mentorCourses.mentorId, mentorId))
      .orderBy(desc(courses.createdAt))
      .then(rows => rows.map(row => row.course));
  }

  async getEnrolledCourses(userId: string): Promise<CourseEnrollment[]> {
    return await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId))
      .orderBy(desc(courseEnrollments.enrolledAt));
  }

  // Module & Lesson operations
  async createModule(moduleData: Omit<Module, "id">): Promise<Module> {
    const [module] = await db
      .insert(modules)
      .values(moduleData)
      .returning();
    return module;
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.orderIndex));
  }

  async createLesson(lessonData: Omit<Lesson, "id">): Promise<Lesson> {
    const [lesson] = await db
      .insert(lessons)
      .values(lessonData)
      .returning();
    return lesson;
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.orderIndex));
  }

  async getLessonProgress(lessonId: number, userId: string): Promise<LessonProgress | undefined> {
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
  }

  async updateLessonProgress(lessonId: number, userId: string, progress: Partial<LessonProgress>): Promise<LessonProgress> {
    // Check if progress record exists
    const existingProgress = await this.getLessonProgress(lessonId, userId);
    
    if (existingProgress) {
      // Update existing record
      const [updated] = await db
        .update(lessonProgress)
        .set({
          ...progress,
          lastAccessedAt: new Date(),
        })
        .where(
          and(
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.userId, userId)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(lessonProgress)
        .values({
          lessonId,
          userId,
          ...progress,
          lastAccessedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Enrollment operations
  async enrollUserInCourse(enrollmentData: Omit<CourseEnrollment, "id" | "enrolledAt">): Promise<CourseEnrollment> {
    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({
        ...enrollmentData,
        enrolledAt: new Date(),
      })
      .returning();
    return enrollment;
  }

  async getCourseEnrollment(courseId: number, userId: string): Promise<CourseEnrollment | undefined> {
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
  }

  async updateCourseProgress(enrollmentId: number, progress: number): Promise<CourseEnrollment> {
    const [updated] = await db
      .update(courseEnrollments)
      .set({
        progress,
        ...(progress >= 100 ? { completedAt: new Date() } : {}),
      })
      .where(eq(courseEnrollments.id, enrollmentId))
      .returning();
    return updated;
  }

  // Mentor operations
  async assignMentorToCourse(mentorCourseData: Omit<MentorCourse, "id" | "assignedAt">): Promise<MentorCourse> {
    const [mentorCourse] = await db
      .insert(mentorCourses)
      .values({
        ...mentorCourseData,
        assignedAt: new Date(),
      })
      .returning();
    return mentorCourse;
  }

  async getMentorsByCourse(courseId: number): Promise<User[]> {
    return await db
      .select({
        mentor: users,
      })
      .from(users)
      .innerJoin(mentorCourses, eq(users.id, mentorCourses.mentorId))
      .where(eq(mentorCourses.courseId, courseId))
      .then(rows => rows.map(row => row.mentor));
  }

  // Affiliate operations
  async createAffiliateCommission(commissionData: Omit<AffiliateCommission, "id" | "createdAt">): Promise<AffiliateCommission> {
    const [commission] = await db
      .insert(affiliateCommissions)
      .values({
        ...commissionData,
        createdAt: new Date(),
      })
      .returning();
    return commission;
  }

  async getAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
    return await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  // Quiz operations
  async createQuiz(quizData: Omit<Quiz, "id">): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(quizData)
      .returning();
    return quiz;
  }

  async getQuizzesByLesson(lessonId: number): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId));
  }

  async addQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    const [question] = await db
      .insert(quizQuestions)
      .values(questionData)
      .returning();
    return question;
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.orderIndex));
  }

  async submitQuizAttempt(attemptData: Omit<QuizAttempt, "id">): Promise<QuizAttempt> {
    const [attempt] = await db
      .insert(quizAttempts)
      .values(attemptData)
      .returning();
    return attempt;
  }

  async getQuizAttempts(quizId: number, userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, userId)
        )
      )
      .orderBy(desc(quizAttempts.completedAt));
  }

  // Assignment operations
  async createAssignment(assignmentData: Omit<Assignment, "id">): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async getAssignmentsByLesson(lessonId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.lessonId, lessonId));
  }

  async submitAssignment(submissionData: Omit<AssignmentSubmission, "id">): Promise<AssignmentSubmission> {
    const [submission] = await db
      .insert(assignmentSubmissions)
      .values(submissionData)
      .returning();
    return submission;
  }

  async gradeAssignment(submissionId: number, grade: number, feedback: string, gradedBy: string): Promise<AssignmentSubmission> {
    const [submission] = await db
      .update(assignmentSubmissions)
      .set({
        grade,
        feedback,
        gradedBy,
        gradedAt: new Date(),
      })
      .where(eq(assignmentSubmissions.id, submissionId))
      .returning();
    return submission;
  }

  // Live session operations
  async createLiveSession(sessionData: Omit<LiveSession, "id">): Promise<LiveSession> {
    const [session] = await db
      .insert(liveSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getUpcomingLiveSessions(mentorId?: string): Promise<LiveSession[]> {
    let query = db
      .select({
        session: liveSessions,
        lesson: lessons,
        module: modules,
        course: courses,
      })
      .from(liveSessions)
      .innerJoin(lessons, eq(liveSessions.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          eq(liveSessions.status, "scheduled"),
          sql`${liveSessions.startTime} > NOW()`
        )
      );
    
    if (mentorId) {
      query = query
        .innerJoin(mentorCourses, eq(courses.id, mentorCourses.courseId))
        .where(eq(mentorCourses.mentorId, mentorId));
    }
    
    const results = await query.orderBy(asc(liveSessions.startTime));
    
    return results.map(row => ({
      ...row.session,
      lesson: row.lesson,
      module: row.module,
      course: row.course,
    }));
  }

  async recordLiveSessionAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance> {
    const [attendance] = await db
      .insert(liveSessionAttendance)
      .values(attendanceData)
      .returning();
    return attendance;
  }

  // Message operations
  async sendMessage(messageData: Omit<Message, "id" | "sentAt" | "readAt">): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        sentAt: new Date(),
      })
      .returning();
    return message;
  }

  async getMessagesForUser(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.sentAt));
  }

  async markMessageAsRead(messageId: number): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({
        readAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  // Course discussion operations
  async createDiscussion(discussionData: Omit<CourseDiscussion, "id" | "createdAt">): Promise<CourseDiscussion> {
    const [discussion] = await db
      .insert(courseDiscussions)
      .values({
        ...discussionData,
        createdAt: new Date(),
      })
      .returning();
    return discussion;
  }

  async getDiscussionsByCourse(courseId: number): Promise<CourseDiscussion[]> {
    return await db
      .select()
      .from(courseDiscussions)
      .where(eq(courseDiscussions.courseId, courseId))
      .orderBy(desc(courseDiscussions.createdAt));
  }

  async addDiscussionReply(replyData: Omit<DiscussionReply, "id" | "createdAt">): Promise<DiscussionReply> {
    const [reply] = await db
      .insert(discussionReplies)
      .values({
        ...replyData,
        createdAt: new Date(),
      })
      .returning();
    return reply;
  }

  // Notification operations
  async createNotification(notificationData: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        createdAt: new Date(),
      })
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, options?: { unreadOnly?: boolean }): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (options?.unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  }

  // Statistics and analytics
  async getCourseStats(courseId: number): Promise<any> {
    const enrollmentsPromise = db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));
    
    const averageProgressPromise = db
      .select({ avgProgress: sql`AVG(${courseEnrollments.progress})` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));
    
    const completionsPromise = db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          not(isNull(courseEnrollments.completedAt))
        )
      );
    
    const [enrollments, averageProgress, completions] = await Promise.all([
      enrollmentsPromise,
      averageProgressPromise,
      completionsPromise
    ]);
    
    return {
      totalEnrollments: enrollments[0]?.count || 0,
      averageProgress: averageProgress[0]?.avgProgress || 0,
      completions: completions[0]?.count || 0,
    };
  }

  async getMentorStats(mentorId: string): Promise<any> {
    const coursesPromise = db
      .select({ count: count() })
      .from(mentorCourses)
      .where(eq(mentorCourses.mentorId, mentorId));
    
    const studentsPromise = db
      .select({ count: sql`COUNT(DISTINCT ${courseEnrollments.userId})` })
      .from(courseEnrollments)
      .innerJoin(mentorCourses, eq(courseEnrollments.courseId, mentorCourses.courseId))
      .where(eq(mentorCourses.mentorId, mentorId));
    
    const [courses, students] = await Promise.all([
      coursesPromise,
      studentsPromise
    ]);
    
    return {
      totalCourses: courses[0]?.count || 0,
      totalStudents: students[0]?.count || 0,
    };
  }

  async getStudentStats(studentId: string): Promise<any> {
    const enrollmentsPromise = db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, studentId));
    
    const completionsPromise = db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, studentId),
          not(isNull(courseEnrollments.completedAt))
        )
      );
    
    const averageProgressPromise = db
      .select({ avgProgress: sql`AVG(${courseEnrollments.progress})` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, studentId));
    
    const [enrollments, completions, averageProgress] = await Promise.all([
      enrollmentsPromise,
      completionsPromise,
      averageProgressPromise
    ]);
    
    return {
      totalEnrollments: enrollments[0]?.count || 0,
      completedCourses: completions[0]?.count || 0,
      averageProgress: averageProgress[0]?.avgProgress || 0,
    };
  }

  // Certificate operations
  async generateCertificate(userId: string, courseId: number, template: string): Promise<Certificate> {
    const certificateId = nanoid(10);
    
    const [certificate] = await db
      .insert(certificates)
      .values({
        id: certificateId,
        userId,
        courseId,
        template,
        issuedAt: new Date(),
      })
      .returning();
    
    // Update enrollment to include certificate ID
    await db
      .update(courseEnrollments)
      .set({
        certificateId,
      })
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      );
    
    return certificate;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }
  
  // Bookmark operations
  async createBookmark(bookmarkData: any): Promise<any> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(bookmarkData)
      .returning();
    return bookmark;
  }

  async getBookmark(bookmarkId: number): Promise<any> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, bookmarkId));
    return bookmark;
  }

  async getBookmarkByLessonAndUser(lessonId: number, userId: string): Promise<any> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.lessonId, lessonId),
          eq(bookmarks.userId, userId)
        )
      );
    return bookmark;
  }

  async getUserBookmarks(userId: string): Promise<any[]> {
    // Join with courses and lessons to get additional context
    return await db
      .select({
        id: bookmarks.id,
        userId: bookmarks.userId,
        lessonId: bookmarks.lessonId,
        courseId: bookmarks.courseId,
        title: bookmarks.title,
        note: bookmarks.note,
        timestamp: bookmarks.timestamp,
        contentSelection: bookmarks.contentSelection,
        createdAt: bookmarks.createdAt,
        updatedAt: bookmarks.updatedAt,
        courseName: courses.title,
        lessonName: lessons.title,
        contentType: lessons.contentType,
      })
      .from(bookmarks)
      .innerJoin(courses, eq(bookmarks.courseId, courses.id))
      .innerJoin(lessons, eq(bookmarks.lessonId, lessons.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async updateBookmark(bookmarkId: number, data: any): Promise<any> {
    // Remove any fields that shouldn't be updated directly
    const { id, userId, lessonId, courseId, createdAt, ...updateData } = data;
    
    // Set updatedAt to current time
    const updatedData = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    const [bookmark] = await db
      .update(bookmarks)
      .set(updatedData)
      .where(eq(bookmarks.id, bookmarkId))
      .returning();
    
    return bookmark;
  }

  async deleteBookmark(bookmarkId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, bookmarkId));
  }

  // Content search
  async searchContent(query: string, courseId?: number): Promise<any[]> {
    // Base query for lessons
    const lessonQuery = db
      .select({
        id: lessons.id,
        title: lessons.title,
        type: sql<string>`'lesson'`,
        contentType: lessons.contentType,
        courseId: modules.courseId,
        lessonId: lessons.id,
        courseName: courses.title,
        moduleName: modules.title,
        snippet: sql<string>`SUBSTRING(${lessons.content}, 1, 150)`,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          or(
            ilike(lessons.title, `%${query}%`),
            ilike(lessons.content || '', `%${query}%`),
            ilike(lessons.description || '', `%${query}%`)
          ),
          courseId ? eq(courses.id, courseId) : undefined
        )
      );

    // Query for resources
    const resourceQuery = db
      .select({
        id: resources.id,
        title: resources.title,
        type: sql<string>`'resource'`,
        contentType: resources.type,
        courseId: modules.courseId,
        lessonId: resources.lessonId,
        courseName: courses.title,
        moduleName: modules.title,
        snippet: resources.description,
      })
      .from(resources)
      .innerJoin(lessons, eq(resources.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          or(
            ilike(resources.title, `%${query}%`),
            ilike(resources.description || '', `%${query}%`)
          ),
          courseId ? eq(courses.id, courseId) : undefined
        )
      );

    // Query for modules
    const moduleQuery = db
      .select({
        id: modules.id,
        title: modules.title,
        type: sql<string>`'module'`,
        contentType: sql<string>`'module'`,
        courseId: modules.courseId,
        courseName: courses.title,
        snippet: modules.description,
      })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          or(
            ilike(modules.title, `%${query}%`),
            ilike(modules.description || '', `%${query}%`)
          ),
          courseId ? eq(courses.id, courseId) : undefined
        )
      );

    // Combine all results
    const lessonResults = await lessonQuery;
    const resourceResults = await resourceQuery;
    const moduleResults = await moduleQuery;

    // Combine and sort by relevance (simple implementation)
    const allResults = [...lessonResults, ...resourceResults, ...moduleResults];
    
    // Sort by exact title match first, then by title containing query
    return allResults.sort((a, b) => {
      // Exact title match gets highest priority
      if (a.title.toLowerCase() === query.toLowerCase()) return -1;
      if (b.title.toLowerCase() === query.toLowerCase()) return 1;
      
      // Title containing query gets next priority
      const aTitleContains = a.title.toLowerCase().includes(query.toLowerCase());
      const bTitleContains = b.title.toLowerCase().includes(query.toLowerCase());
      
      if (aTitleContains && !bTitleContains) return -1;
      if (!aTitleContains && bTitleContains) return 1;
      
      // Otherwise, sort by title alphabetically
      return a.title.localeCompare(b.title);
    });
  }

  // Content sharing
  async createContentShare(shareData: any): Promise<any> {
    const [share] = await db
      .insert(contentShares)
      .values(shareData)
      .returning();
    return share;
  }

  async getContentShareByCode(shareCode: string): Promise<any> {
    const [share] = await db
      .select()
      .from(contentShares)
      .where(eq(contentShares.shareCode, shareCode));
    return share;
  }

  async updateContentShareAccess(shareId: number): Promise<any> {
    const [share] = await db
      .update(contentShares)
      .set({
        lastAccessedAt: new Date(),
        accessCount: sql`${contentShares.accessCount} + 1`,
      })
      .where(eq(contentShares.id, shareId))
      .returning();
    
    return share;
  }

  // Lesson operations for content features
  async getLesson(lessonId: number): Promise<Lesson | undefined> {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));
    return lesson;
  }
}

export const storage = new DatabaseStorage();

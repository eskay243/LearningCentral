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
  codingExercises,
  exerciseProgress,
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
  type CodingExercise,
  type ExerciseProgress,
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
  createUser(userData: any): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
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
  getQuizzesByLesson(lessonId: number): Promise<Quiz[]>;
  addQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  saveQuizAttempt(attemptData: Omit<QuizAttempt, "id" | "createdAt">): Promise<QuizAttempt>;
  
  // Assignment operations
  createAssignment(assignmentData: Omit<Assignment, "id">): Promise<Assignment>;
  getAssignmentsByLesson(lessonId: number): Promise<Assignment[]>;
  submitAssignment(submissionData: Omit<AssignmentSubmission, "id" | "submittedAt">): Promise<AssignmentSubmission>;
  
  // Live session operations
  createLiveSession(sessionData: Omit<LiveSession, "id" | "createdAt">): Promise<LiveSession>;
  getLiveSessionsByCourse(courseId: number): Promise<LiveSession[]>;
  recordAttendance(attendanceData: Omit<LiveSessionAttendance, "id">): Promise<LiveSessionAttendance>;
  
  // Message operations
  createMessage(messageData: Omit<Message, "id" | "createdAt">): Promise<Message>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  
  // Announcements
  createAnnouncement(announcementData: Omit<Announcement, "id" | "createdAt">): Promise<Announcement>;
  getAnnouncementsByCourse(courseId: number): Promise<Announcement[]>;
  
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
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();
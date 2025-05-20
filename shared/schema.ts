import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  varchar,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles enum
export const UserRole = {
  ADMIN: "admin",
  MENTOR: "mentor",
  STUDENT: "student",
  AFFILIATE: "affiliate",
} as const;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  role: text("role").notNull().default(UserRole.STUDENT),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  stripeCustomerId: varchar("stripe_customer_id"),
  affiliateCode: varchar("affiliate_code").unique(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail"),
  price: real("price").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  category: text("category"),
  tags: text("tags").array(),
});

// CourseEnrollments table (many-to-many relationship)
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: real("progress").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentAmount: real("payment_amount"),
  paymentMethod: text("payment_method"),
  certificateId: varchar("certificate_id"),
});

// MentorCourses table (many-to-many relationship)
export const mentorCourses = pgTable("mentor_courses", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  commission: real("commission").notNull().default(37),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// AffiliateCommissions table
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => courseEnrollments.id),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
  commission: real("commission").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  status: text("status").notNull().default("pending"),
});

// Modules table (course content organization)
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // in seconds
  isLive: boolean("is_live").notNull().default(false),
  scheduledAt: timestamp("scheduled_at"),
  orderIndex: integer("order_index").notNull().default(0),
  notes: text("notes"),
});

// Resources table (downloadable materials)
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  isLocked: boolean("is_locked").notNull().default(true),
});

// Quiz table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
});

// QuizQuestions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  type: text("type").notNull().default("multiple_choice"),
  options: jsonb("options"),
  correctAnswer: jsonb("correct_answer").notNull(),
  points: integer("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
});

// QuizAttempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  isPassed: boolean("is_passed").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  answers: jsonb("answers").notNull(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  rubric: jsonb("rubric"),
});

// AssignmentSubmissions table
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileUrl: text("file_url").notNull(),
  submittedAt: timestamp("submitted_at").notNull(),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at"),
  gradedBy: varchar("graded_by").references(() => users.id),
});

// LiveSessions table
export const liveSessions = pgTable("live_sessions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  meetingUrl: text("meeting_url"),
  recordingUrl: text("recording_url"),
  status: text("status").notNull().default("scheduled"),
});

// LiveSessionAttendance table
export const liveSessionAttendance = pgTable("live_session_attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  watchedRecording: boolean("watched_recording").notNull().default(false),
  watchedRecordingAt: timestamp("watched_recording_at"),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isPlatformWide: boolean("is_platform_wide").notNull().default(false),
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  template: text("template").notNull(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discount: real("discount").notNull(),
  isPercentage: boolean("is_percentage").notNull().default(true),
  validUntil: timestamp("valid_until"),
  courseId: integer("course_id").references(() => courses.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
});

// CourseRatings table
export const courseRatings = pgTable("course_ratings", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// LessonProgress table
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("not_started"),
  progress: real("progress").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
});

// CourseDiscussions table
export const courseDiscussions = pgTable("course_discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isAnnouncement: boolean("is_announcement").notNull().default(false),
});

// DiscussionReplies table
export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull().references(() => courseDiscussions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NotificationSettings table
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  classReminders: boolean("class_reminders").notNull().default(true),
  assignmentReminders: boolean("assignment_reminders").notNull().default(true),
  messageNotifications: boolean("message_notifications").notNull().default(true),
  announcementNotifications: boolean("announcement_notifications").notNull().default(true),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  linkUrl: text("link_url"),
});

// Create Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users);
export const insertCourseSchema = createInsertSchema(courses);
export const insertModuleSchema = createInsertSchema(modules);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertLiveSessionSchema = createInsertSchema(liveSessions);
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);
export const insertMentorCourseSchema = createInsertSchema(mentorCourses);
export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions);

// Type definitions for the schema
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type LiveSession = typeof liveSessions.$inferSelect;
export type LiveSessionAttendance = typeof liveSessionAttendance.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type CourseRating = typeof courseRatings.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type MentorCourse = typeof mentorCourses.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type CourseDiscussion = typeof courseDiscussions.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

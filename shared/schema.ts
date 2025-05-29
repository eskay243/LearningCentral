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
  paymentReference: varchar("payment_reference"),
  paymentProvider: varchar("payment_provider").default("paystack"),
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
  content: text("content"),
  contentType: text("content_type").notNull().default("text"), // text, video, audio, interactive
  videoUrl: text("video_url"),
  videoPoster: text("video_poster"), // thumbnail image for video
  videoProvider: text("video_provider").default("native"), // native, youtube, vimeo, etc.
  duration: integer("duration"), // in seconds
  isLive: boolean("is_live").notNull().default(false),
  scheduledAt: timestamp("scheduled_at"),
  orderIndex: integer("order_index").notNull().default(0),
  notes: text("notes"),
  isPreview: boolean("is_preview").default(false), // free preview or premium content
  requiresAuth: boolean("requires_auth").default(true), // if content requires authentication
  drm: text("drm"), // DRM protection type if applicable
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resources table (downloadable materials)
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // pdf, doc, image, code, link, etc.
  url: text("url").notNull(),
  fileSize: integer("file_size"), // size in bytes
  thumbnailUrl: text("thumbnail_url"),
  isDownloadable: boolean("is_downloadable").default(true),
  requiresAuth: boolean("requires_auth").default(true),
  isPreview: boolean("is_preview").default(false), // available in course preview
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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
  mentorId: varchar("mentor_id").references(() => users.id), // The mentor/teacher hosting the session
  title: text("title").notNull(), // Session title
  description: text("description"), // Detailed description
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  meetingUrl: text("meeting_url"),
  recordingUrl: text("recording_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, in-progress, completed, cancelled
  notes: text("notes"), // Notes from the session
  materials: jsonb("materials"), // Links to study materials
  capacity: integer("capacity"), // Max number of participants
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LiveSessionAttendance table
export const liveSessionAttendance = pgTable("live_session_attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinTime: timestamp("join_time").notNull().defaultNow(), // Time user joined the session
  leftTime: timestamp("left_time"), // Time user left the session
  status: text("status").notNull().default("present"), // Status: present, absent, late, excused
  respondedToRollCall: boolean("responded_to_roll_call").default(false), // Roll call response
  participationLevel: text("participation_level"), // low, medium, high
  feedback: text("feedback"), // Student's feedback on the session
  notes: text("notes"), // Teacher notes about the student
  watchedRecording: boolean("watched_recording").notNull().default(false),
  watchedRecordingAt: timestamp("watched_recording_at"),
  lastActivity: timestamp("last_activity").defaultNow(), // Last activity timestamp
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LiveSessionRollCalls - tracks roll call instances during a live session
export const liveSessionRollCalls = pgTable("live_session_roll_calls", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  initiatedBy: varchar("initiated_by").notNull().references(() => users.id),
  initiatedAt: timestamp("initiated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // When the roll call expires
  status: text("status").notNull().default("active"), // active, expired, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LiveSessionRollCallResponses - tracks individual student responses to roll calls
export const liveSessionRollCallResponses = pgTable("live_session_roll_call_responses", {
  id: serial("id").primaryKey(),
  rollCallId: integer("roll_call_id").notNull().references(() => liveSessionRollCalls.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  responseTime: timestamp("response_time").notNull().defaultNow(),
  responseMethod: text("response_method").notNull().default("app"), // app, mobile, voice
  createdAt: timestamp("created_at").defaultNow(),
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



// Certificates table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  template: text("template").notNull(),
  certificateUrl: text("certificate_url"),
  verificationCode: varchar("verification_code").notNull().unique(),
  status: varchar("status", { enum: ["issued", "revoked"] }).default("issued"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;
export const insertCertificateSchema = createInsertSchema(certificates).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("general"), // general, urgent, update, reminder
  priority: text("priority").notNull().default("normal"), // low, normal, high
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CourseMentors table - many-to-many relationship between courses and mentors
export const courseMentors = pgTable("course_mentors", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  role: text("role").notNull().default("mentor"), // mentor, lead_mentor, teaching_assistant
  permissions: jsonb("permissions"), // specific permissions for this mentor on this course
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => [
  // Ensure a mentor can only be assigned once per course
  primaryKey({ columns: [table.courseId, table.mentorId] })
]);

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
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  progress: real("progress").notNull().default(0), // percentage
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent"), // in seconds
  playbackPosition: integer("playback_position").default(0), // video position in seconds
  notes: text("notes"), // user's personal notes
  bookmarks: jsonb("bookmarks"), // user bookmarks for content
  interactions: jsonb("interactions"), // click/engagement tracking
  deviceInfo: jsonb("device_info"), // device used for learning
  ipAddress: text("ip_address"), // for geographic tracking
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
// Define currency options
export const Currency = {
  USD: "USD",
  GBP: "GBP", 
  NGN: "NGN"
} as const;

// System Settings table for application-wide settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  category: varchar("category").notNull().default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, warning, success, error
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  isRead: boolean("read").notNull().default(false),
  actionUrl: text("link_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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



// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  note: text("note"),
  timestamp: integer("timestamp"), // For video content, timestamp in seconds
  contentSelection: text("content_selection"), // Selected text for text content
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Content shares table
export const contentShares = pgTable("content_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  shareCode: varchar("share_code").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  accessCount: integer("access_count").notNull().default(0),
});

// Interactive Coding Exercises table
export const codingExercises = pgTable("coding_exercises", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  moduleId: integer("module_id").references(() => modules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  initialCode: text("initial_code").notNull(),
  solution: text("solution").notNull(),
  language: text("language").notNull().default("javascript"),
  difficulty: text("difficulty").notNull().default("beginner"),
  hints: jsonb("hints").notNull().default([]),
  tests: jsonb("tests").notNull().default([]),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  tags: text("tags").array(),
});

// Exercise Progress table
export const exerciseProgress = pgTable("exercise_progress", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => codingExercises.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  currentCode: text("current_code"),
  lastAttemptAt: timestamp("last_attempt_at"),
  completedAt: timestamp("completed_at"),
  attemptCount: integer("attempt_count").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0),
  timeSpent: integer("time_spent"), // in seconds
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
export const insertCodingExerciseSchema = createInsertSchema(codingExercises);
export const insertExerciseProgressSchema = createInsertSchema(exerciseProgress);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertCourseMentorSchema = createInsertSchema(courseMentors);

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
export type CourseMentor = typeof courseMentors.$inferSelect;
// Certificate type is already defined above, removed duplicate
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
export type CodingExercise = typeof codingExercises.$inferSelect;
export type ExerciseProgress = typeof exerciseProgress.$inferSelect;

// Messaging and communication
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull().default("direct"), // direct, group, course
  courseId: integer("course_id").references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
  lastReadMessageId: integer("last_read_message_id"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 50 }).default("text"), // text, image, file, etc.
  attachmentUrl: varchar("attachment_url", { length: 255 }),
  sentAt: timestamp("sent_at").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  replyToId: integer("reply_to_id"),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reaction: varchar("reaction", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseAnnouncements = pgTable("course_announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPinned: boolean("is_pinned").default(false),
  attachmentUrl: varchar("attachment_url", { length: 255 }),
});

// Export types for messaging system
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type CourseAnnouncement = typeof courseAnnouncements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationSetting = typeof notificationSettings.$inferSelect;

// Create insert schemas
export const insertConversationSchema = createInsertSchema(conversations);
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export const insertCourseAnnouncementSchema = createInsertSchema(courseAnnouncements);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationSettingSchema = createInsertSchema(notificationSettings);

// Create insert types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type InsertCourseAnnouncement = z.infer<typeof insertCourseAnnouncementSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;

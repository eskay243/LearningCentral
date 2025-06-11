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
  decimal,
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
  password: varchar("password"),
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
  videoProvider: text("video_provider").default("native"), // native, youtube, vimeo, wistia, brightcove, jwplayer
  videoId: text("video_id"), // For external providers (YouTube video ID, Vimeo ID, etc.)
  videoEmbedUrl: text("video_embed_url"), // Direct embed URL for iframe
  videoQuality: text("video_quality").default("720p"), // 480p, 720p, 1080p, 4k
  videoMetadata: jsonb("video_metadata"), // Additional metadata like chapters, captions, etc.
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

// Enhanced LiveSessions table with video conferencing integration
export const liveSessions = pgTable("live_sessions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  mentorId: varchar("mentor_id").references(() => users.id), // The mentor/teacher hosting the session
  title: text("title").notNull(), // Session title
  description: text("description"), // Detailed description
  
  // Enhanced scheduling
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  timezone: text("timezone").notNull().default("UTC"),
  duration: integer("duration").notNull(), // duration in minutes
  
  // Video conferencing integration
  provider: text("provider").notNull().default("google_meet"), // google_meet, zoom, zoho
  meetingUrl: text("meeting_url"),
  meetingId: text("meeting_id"),
  meetingPassword: text("meeting_password"),
  hostKey: text("host_key"), // for zoom host controls
  
  // Recording and replay
  recordingUrl: text("recording_url"),
  recordingId: text("recording_id"),
  recordingPassword: text("recording_password"),
  autoRecord: boolean("auto_record").default(true),
  recordingSize: integer("recording_size"), // bytes
  recordingDuration: integer("recording_duration"), // seconds
  
  // Session management
  status: text("status").notNull().default("scheduled"), // scheduled, live, completed, cancelled
  maxAttendees: integer("max_attendees").default(100),
  capacity: integer("capacity"), // Max number of participants
  
  // Features
  waitingRoomEnabled: boolean("waiting_room_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  qnaEnabled: boolean("qna_enabled").default(true),
  breakoutRoomsEnabled: boolean("breakout_rooms_enabled").default(false),
  pollsEnabled: boolean("polls_enabled").default(true),
  
  // Recurrence
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"), // daily, weekly, monthly with config
  parentSessionId: integer("parent_session_id").references(() => liveSessions.id),
  
  // Notifications
  reminderSent: boolean("reminder_sent").default(false),
  followUpSent: boolean("follow_up_sent").default(false),
  
  // Content and materials
  agenda: text("agenda"),
  notes: text("notes"), // Notes from the session
  materials: jsonb("materials"), // Links to study materials
  requirements: text("requirements"), // what students need to prepare
  
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

// Live Session Chat Messages
export const liveSessionMessages = pgTable("live_session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, question, poll, reaction
  isPrivate: boolean("is_private").default(false),
  replyToId: integer("reply_to_id").references(() => liveSessionMessages.id),
  timestamp: timestamp("timestamp").defaultNow(),
  isModerated: boolean("is_moderated").default(false),
});

// Live Session Q&A
export const liveSessionQA = pgTable("live_session_qa", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  mentorId: varchar("mentor_id").references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer"),
  status: text("status").notNull().default("pending"), // pending, answered, dismissed
  upvotes: integer("upvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  askedAt: timestamp("asked_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

// Live Session Polls
export const liveSessionPolls = pgTable("live_session_polls", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // array of poll options
  pollType: text("poll_type").notNull().default("multiple_choice"), // multiple_choice, single_choice, text
  isAnonymous: boolean("is_anonymous").default(true),
  isActive: boolean("is_active").default(true),
  results: jsonb("results"), // poll results data
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

// Live Session Poll Responses
export const liveSessionPollResponses = pgTable("live_session_poll_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => liveSessionPolls.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  response: jsonb("response").notNull(), // user's poll response
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Calendar Integration Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // google, outlook, apple
  eventId: text("event_id").notNull(), // external calendar event ID
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, failed
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video Conferencing Provider Settings
export const videoProviderSettings = pgTable("video_provider_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // google_meet, zoom, zoho
  isDefault: boolean("is_default").default(false),
  settings: jsonb("settings").notNull(), // provider-specific settings
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Legacy discussion replies - replaced by enhanced discussionReplies table below

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



// Invoices table for payment tracking
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  amount: real("amount").notNull(),
  currency: varchar("currency").notNull().default("NGN"),
  status: varchar("status").notNull().default("pending"), // pending, paid, cancelled, refunded
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference"),
  paymentMethod: varchar("payment_method"), // paystack, bank_transfer, wallet
  description: text("description"),
  lineItems: jsonb("line_items").notNull().default([]),
  taxAmount: real("tax_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment transactions table for detailed tracking
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  reference: varchar("reference").notNull().unique(),
  amount: real("amount").notNull(),
  currency: varchar("currency").notNull().default("NGN"),
  status: varchar("status").notNull(), // pending, success, failed, cancelled
  provider: varchar("provider").notNull(), // paystack, bank, wallet
  providerReference: varchar("provider_reference"),
  providerResponse: jsonb("provider_response"),
  fees: real("fees").default(0),
  netAmount: real("net_amount"),
  gateway: varchar("gateway"),
  channel: varchar("channel"), // card, bank, ussd, qr
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  language: text("language").notNull().default("javascript"), // javascript, python, java, csharp, cpp, go, rust, typescript, php, ruby
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

// Assessment System Tables

// Assessments table - parent table for all assessments (quizzes, assignments)
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  moduleId: integer("module_id").references(() => modules.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // quiz, assignment, coding_challenge
  instructions: text("instructions"),
  timeLimit: integer("time_limit"), // in minutes
  attempts: integer("attempts").default(1), // number of allowed attempts
  dueDate: timestamp("due_date"),
  isPublished: boolean("is_published").default(false),
  passingScore: real("passing_score").default(70), // percentage
  weight: real("weight").default(1), // weight in final grade
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz Questions table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // multiple_choice, true_false, short_answer, code, essay
  options: jsonb("options"), // for multiple choice questions
  correctAnswer: text("correct_answer"), // for auto-graded questions
  points: real("points").default(1),
  explanation: text("explanation"), // shown after submission
  orderIndex: integer("order_index").default(0),
  metadata: jsonb("metadata"), // for storing additional question data
});

// Student Assessment Attempts table
export const assessmentAttempts = pgTable("assessment_attempts", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // in seconds
  score: real("score"), // calculated score
  maxScore: real("max_score"), // total possible points
  percentage: real("percentage"), // score percentage
  status: text("status").default("in_progress"), // in_progress, submitted, graded, late
  feedback: text("feedback"), // mentor feedback
  gradedBy: varchar("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
});

// Student Answers table
export const assessmentAnswers = pgTable("assessment_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => assessmentAttempts.id),
  questionId: integer("question_id").notNull().references(() => assessmentQuestions.id),
  answer: text("answer"), // student's answer
  isCorrect: boolean("is_correct"), // for auto-graded questions
  pointsEarned: real("points_earned").default(0),
  feedback: text("feedback"), // question-specific feedback
});

// Assessment Submissions table (for file uploads, projects, etc.)
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => assessmentAttempts.id),
  submissionText: text("submission_text"),
  submissionFiles: jsonb("submission_files"), // array of file metadata
  submissionUrl: text("submission_url"), // for web-based submissions
  codeSubmission: text("code_submission"), // for coding assignments
  language: text("language"), // programming language
  isLate: boolean("is_late").default(false),
  plagiarismScore: real("plagiarism_score"), // if plagiarism detection is enabled
});

// Rubrics table for detailed grading criteria
export const rubrics = pgTable("rubrics", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  criteria: text("criteria").notNull(),
  description: text("description"),
  maxPoints: real("max_points").notNull(),
  orderIndex: integer("order_index").default(0),
});

// Rubric Scores table
export const rubricScores = pgTable("rubric_scores", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => assessmentAttempts.id),
  rubricId: integer("rubric_id").notNull().references(() => rubrics.id),
  pointsEarned: real("points_earned").notNull(),
  feedback: text("feedback"),
});

// Grade Categories table
export const gradeCategories = pgTable("grade_categories", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  name: text("name").notNull(),
  weight: real("weight").notNull(), // percentage of final grade
  description: text("description"),
});

// Final Grades table
export const courseGrades = pgTable("course_grades", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentGrade: real("current_grade"), // current percentage
  finalGrade: real("final_grade"), // final locked grade
  letterGrade: text("letter_grade"), // A, B, C, etc.
  isComplete: boolean("is_complete").default(false),
  completedAt: timestamp("completed_at"),
  certificateIssued: boolean("certificate_issued").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Create Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users);
export const insertCourseSchema = createInsertSchema(courses);
export const insertModuleSchema = createInsertSchema(modules);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertOriginalQuizQuestionSchema = createInsertSchema(quizQuestions);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);
export const insertMentorCourseSchema = createInsertSchema(mentorCourses);
export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions);
export const insertCodingExerciseSchema = createInsertSchema(codingExercises);
export const insertExerciseProgressSchema = createInsertSchema(exerciseProgress);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertCourseMentorSchema = createInsertSchema(courseMentors);
export const insertAssessmentSchema = createInsertSchema(assessments);
export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions);
export const insertAssessmentAttemptSchema = createInsertSchema(assessmentAttempts);
export const insertAssessmentAnswerSchema = createInsertSchema(assessmentAnswers);
export const insertRubricSchema = createInsertSchema(rubrics);
export const insertGradeCategorySchema = createInsertSchema(gradeCategories);

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
export type LiveSessionRollCall = typeof liveSessionRollCalls.$inferSelect;
export type LiveSessionRollCallResponse = typeof liveSessionRollCallResponses.$inferSelect;
export type LiveSessionMessage = typeof liveSessionMessages.$inferSelect;
export type LiveSessionQA = typeof liveSessionQA.$inferSelect;
export type LiveSessionPoll = typeof liveSessionPolls.$inferSelect;
export type LiveSessionPollResponse = typeof liveSessionPollResponses.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type VideoProviderSetting = typeof videoProviderSettings.$inferSelect;
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

// Enhanced Interactive Coding Exercises with Real-time Feedback
export const codingChallenges = pgTable("coding_challenges", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  language: text("language").notNull(), // javascript, python, java, cpp, etc.
  starterCode: text("starter_code"),
  solutionCode: text("solution_code"),
  testCases: jsonb("test_cases").notNull(), // array of input/output test cases
  hiddenTestCases: jsonb("hidden_test_cases"), // test cases not visible to students
  hints: jsonb("hints"), // progressive hints system
  timeLimit: integer("time_limit").default(300), // seconds
  memoryLimit: integer("memory_limit").default(128), // MB
  maxAttempts: integer("max_attempts").default(5),
  points: integer("points").default(10),
  tags: text("tags").array(),
  prerequisites: jsonb("prerequisites"), // required skills/concepts
  learningObjectives: jsonb("learning_objectives"),
  executionEnvironment: text("execution_environment").default("sandbox"),
  allowedLibraries: jsonb("allowed_libraries"),
  isPublished: boolean("is_published").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Code Execution Results
export const codeExecutions = pgTable("code_executions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => codingChallenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  status: text("status").notNull(), // running, success, error, timeout
  output: text("output"),
  errors: text("errors"),
  executionTime: integer("execution_time"), // milliseconds
  memoryUsed: integer("memory_used"), // KB
  testResults: jsonb("test_results"), // detailed test case results
  hintsUsed: integer("hints_used").default(0),
  score: real("score").default(0),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Progressive Hints System
export const challengeHints = pgTable("challenge_hints", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => codingChallenges.id),
  hintLevel: integer("hint_level").notNull(),
  hintText: text("hint_text").notNull(),
  codeSnippet: text("code_snippet"),
  unlockAfterAttempts: integer("unlock_after_attempts").default(1),
  penaltyPoints: integer("penalty_points").default(0),
  orderIndex: integer("order_index").default(0),
});

// Student Code Submissions with Auto-grading
export const codingSubmissions = pgTable("coding_submissions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => codingChallenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  language: text("language").notNull(),
  status: text("status").notNull(), // submitted, grading, passed, failed, partial
  score: real("score").default(0),
  maxScore: real("max_score").notNull(),
  testsPassed: integer("tests_passed").default(0),
  totalTests: integer("total_tests").notNull(),
  executionTime: integer("execution_time"),
  memoryUsed: integer("memory_used"),
  attemptNumber: integer("attempt_number").default(1),
  hintsUsed: integer("hints_used").default(0),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
  isCompleted: boolean("is_completed").default(false),
});

// Advanced Quiz System with Multiple Question Types
export const advancedQuizzes = pgTable("advanced_quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  timeLimit: integer("time_limit"), // minutes
  attempts: integer("attempts").default(1),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  shuffleAnswers: boolean("shuffle_answers").default(false),
  showResults: boolean("show_results").default(true),
  passingScore: real("passing_score").default(70),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  isPublished: boolean("is_published").default(false),
  gradingMethod: text("grading_method").default("highest"), // highest, average, latest
  proctored: boolean("proctored").default(false),
  randomizeFromPool: boolean("randomize_from_pool").default(false),
  questionsPerAttempt: integer("questions_per_attempt"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced Question Types
export const advancedQuizQuestions = pgTable("advanced_quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => advancedQuizzes.id),
  questionType: text("question_type").notNull(), // multiple_choice, true_false, fill_blank, essay, code, matching, ordering, hotspot
  questionText: text("question_text").notNull(),
  questionHtml: text("question_html"), // rich content support
  mediaUrl: text("media_url"), // images, videos, audio
  points: real("points").default(1),
  difficulty: text("difficulty").default("medium"),
  explanation: text("explanation"),
  feedback: text("feedback"),
  timeLimit: integer("time_limit"), // per question time limit
  orderIndex: integer("order_index").default(0),
  isRequired: boolean("is_required").default(true),
  
  // Multiple Choice / True-False
  options: jsonb("options"), // [{id, text, isCorrect, feedback}]
  correctAnswers: jsonb("correct_answers"), // for multiple correct answers
  
  // Fill in the blanks
  blanks: jsonb("blanks"), // positions and correct answers
  
  // Code questions
  codeLanguage: text("code_language"),
  codeTemplate: text("code_template"),
  testCases: jsonb("test_cases"),
  
  // Matching questions
  matchingPairs: jsonb("matching_pairs"), // left and right items to match
  
  // Ordering questions
  orderItems: jsonb("order_items"), // items to be arranged in correct order
  
  // Hotspot questions (click on image)
  hotspots: jsonb("hotspots"), // clickable areas on image
  
  metadata: jsonb("metadata"), // additional question-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz Attempts with Enhanced Tracking
export const advancedQuizAttempts = pgTable("advanced_quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => advancedQuizzes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // seconds
  score: real("score"),
  maxScore: real("max_score"),
  percentage: real("percentage"),
  passed: boolean("passed").default(false),
  status: text("status").default("in_progress"), // in_progress, submitted, graded, abandoned
  questionsAnswered: integer("questions_answered").default(0),
  totalQuestions: integer("total_questions"),
  
  // Proctoring data
  browserLockdown: boolean("browser_lockdown").default(false),
  tabSwitches: integer("tab_switches").default(0),
  suspiciousActivity: jsonb("suspicious_activity"),
  webcamRecording: text("webcam_recording"),
  screenRecording: text("screen_recording"),
  
  // Analytics
  clickPattern: jsonb("click_pattern"),
  keystrokePattern: jsonb("keystroke_pattern"),
  timePerQuestion: jsonb("time_per_question"),
  
  metadata: jsonb("metadata"),
  gradedAt: timestamp("graded_at"),
  gradedBy: varchar("graded_by").references(() => users.id),
});

// Student Answers with Rich Support
export const advancedQuizAnswers = pgTable("advanced_quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => advancedQuizAttempts.id),
  questionId: integer("question_id").notNull().references(() => advancedQuizQuestions.id),
  
  // Different answer types
  textAnswer: text("text_answer"),
  selectedOptions: jsonb("selected_options"), // for multiple choice
  codeAnswer: text("code_answer"),
  fileUploads: jsonb("file_uploads"),
  matchingAnswer: jsonb("matching_answer"),
  orderingAnswer: jsonb("ordering_answer"),
  hotspotAnswer: jsonb("hotspot_answer"),
  
  isCorrect: boolean("is_correct"),
  partialCredit: real("partial_credit").default(0),
  pointsEarned: real("points_earned").default(0),
  autoGraded: boolean("auto_graded").default(false),
  
  timeSpent: integer("time_spent"), // seconds on this question
  attempts: integer("attempts").default(1),
  feedback: text("feedback"),
  
  answeredAt: timestamp("answered_at").defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
});

// Video Content Management System
export const videoContent = pgTable("video_content", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  
  // Video file information
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // bytes
  duration: integer("duration").notNull(), // seconds
  resolution: text("resolution"), // e.g., "1920x1080"
  format: text("format").notNull(), // mp4, webm, etc.
  
  // Streaming and delivery
  streamingUrl: text("streaming_url"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  
  // Access control and DRM
  accessLevel: text("access_level").default("premium"), // free, premium, restricted
  isPublic: boolean("is_public").default(false),
  allowDownload: boolean("allow_download").default(false),
  watermarkText: text("watermark_text"),
  drmProtected: boolean("drm_protected").default(false),
  
  // Processing status
  processingStatus: text("processing_status").default("pending"), // pending, processing, ready, failed
  processingProgress: integer("processing_progress").default(0), // 0-100
  processingError: text("processing_error"),
  
  // Analytics
  viewCount: integer("view_count").default(0),
  totalWatchTime: integer("total_watch_time").default(0), // seconds
  
  // Metadata
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Video Watch Progress Tracking
export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videoContent.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  currentTime: integer("current_time").default(0), // seconds
  watchedDuration: integer("watched_duration").default(0), // total seconds watched
  watchPercentage: real("watch_percentage").default(0), // 0-100
  completed: boolean("completed").default(false),
  
  // Session tracking
  sessionStart: timestamp("session_start").defaultNow(),
  lastWatched: timestamp("last_watched").defaultNow(),
  totalSessions: integer("total_sessions").default(1),
  
  // Quality and engagement
  playbackQuality: text("playback_quality"), // 720p, 1080p, etc.
  playbackSpeed: real("playback_speed").default(1.0),
  interactionEvents: jsonb("interaction_events"), // pauses, seeks, etc.
});

// Enhanced Assignment System with File Uploads
export const advancedAssignments = pgTable("advanced_assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  requirements: jsonb("requirements"), // detailed requirements
  
  // Submission settings
  submissionType: text("submission_type").notNull(), // file, text, url, code, mixed
  allowedFileTypes: jsonb("allowed_file_types"), // [.pdf, .doc, .zip]
  maxFileSize: integer("max_file_size").default(10), // MB
  maxFiles: integer("max_files").default(5),
  requiresUpload: boolean("requires_upload").default(false),
  
  // Timing
  dueDate: timestamp("due_date"),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  lateSubmissionAllowed: boolean("late_submission_allowed").default(true),
  latePenalty: real("late_penalty").default(10), // percentage per day
  
  // Grading
  maxPoints: real("max_points").default(100),
  gradingType: text("grading_type").default("points"), // points, rubric, pass_fail
  autoGrading: boolean("auto_grading").default(false),
  plagiarismCheck: boolean("plagiarism_check").default(false),
  
  // Collaboration
  groupAssignment: boolean("group_assignment").default(false),
  maxGroupSize: integer("max_group_size").default(1),
  peerReview: boolean("peer_review").default(false),
  
  isPublished: boolean("is_published").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment Submissions with File Support
export const advancedAssignmentSubmissions = pgTable("advanced_assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => advancedAssignments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  groupId: integer("group_id"), // for group assignments
  
  // Submission content
  textSubmission: text("text_submission"),
  urlSubmission: text("url_submission"),
  codeSubmission: text("code_submission"),
  codeLanguage: text("code_language"),
  
  // File uploads
  uploadedFiles: jsonb("uploaded_files"), // [{filename, url, size, type, uploadedAt}]
  totalFileSize: integer("total_file_size"), // bytes
  
  // Status and timing
  status: text("status").default("draft"), // draft, submitted, graded, returned
  submittedAt: timestamp("submitted_at"),
  isLate: boolean("is_late").default(false),
  lateDays: integer("late_days").default(0),
  
  // Grading
  score: real("score"),
  maxScore: real("max_score"),
  grade: text("grade"), // letter grade
  feedback: text("feedback"),
  rubricScores: jsonb("rubric_scores"),
  
  // Plagiarism
  plagiarismScore: real("plagiarism_score"),
  plagiarismReport: text("plagiarism_report"),
  
  // Revision system
  revisionNumber: integer("revision_number").default(1),
  allowResubmission: boolean("allow_resubmission").default(false),
  resubmissionDue: timestamp("resubmission_due"),
  
  gradedBy: varchar("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  returnedAt: timestamp("returned_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File Upload Management
export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => advancedAssignmentSubmissions.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  filePath: text("file_path").notNull(),
  fileUrl: text("file_url"),
  checksum: text("checksum"), // for integrity verification
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isProcessed: boolean("is_processed").default(false),
  processingStatus: text("processing_status"), // pending, processing, completed, failed
  metadata: jsonb("metadata"),
});

// Discussion Forums and Q&A
export const discussionForums = pgTable("discussion_forums", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  forumType: text("forum_type").default("general"), // general, qa, announcements, project
  isModerated: boolean("is_moderated").default(false),
  allowAnonymous: boolean("allow_anonymous").default(false),
  isLocked: boolean("is_locked").default(false),
  isPinned: boolean("is_pinned").default(false),
  orderIndex: integer("order_index").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion Topics/Threads
export const discussionTopics = pgTable("discussion_topics", {
  id: serial("id").primaryKey(),
  forumId: integer("forum_id").notNull().references(() => discussionForums.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").default("text"), // text, html, markdown
  
  // Topic properties
  topicType: text("topic_type").default("discussion"), // discussion, question, announcement
  isSticky: boolean("is_sticky").default(false),
  isLocked: boolean("is_locked").default(false),
  isAnonymous: boolean("is_anonymous").default(false),
  
  // Q&A specific
  isQuestion: boolean("is_question").default(false),
  hasAcceptedAnswer: boolean("has_accepted_answer").default(false),
  acceptedAnswerId: integer("accepted_answer_id"),
  
  // Engagement
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  replies: integer("replies").default(0),
  
  // Attachments
  attachments: jsonb("attachments"),
  
  // Moderation
  isApproved: boolean("is_approved").default(true),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  tags: text("tags").array(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion Replies
export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => discussionTopics.id),
  parentReplyId: integer("parent_reply_id").references(() => discussionReplies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  contentType: text("content_type").default("text"),
  
  // Reply properties
  isAnonymous: boolean("is_anonymous").default(false),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  isEndorsed: boolean("is_endorsed").default(false), // instructor endorsed
  
  // Engagement
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  
  // Attachments
  attachments: jsonb("attachments"),
  
  // Moderation
  isApproved: boolean("is_approved").default(true),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion Votes/Reactions
export const discussionVotes = pgTable("discussion_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topicId: integer("topic_id").references(() => discussionTopics.id),
  replyId: integer("reply_id").references(() => discussionReplies.id),
  voteType: text("vote_type").notNull(), // like, dislike, helpful, unhelpful
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Video Sessions with Enhanced Features
export const videoSessions = pgTable("video_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  
  // Session configuration
  sessionType: text("session_type").default("live"), // live, webinar, office_hours, group_study
  maxParticipants: integer("max_participants").default(50),
  requiresApproval: boolean("requires_approval").default(false),
  allowRecording: boolean("allow_recording").default(true),
  allowScreenShare: boolean("allow_screen_share").default(true),
  allowChat: boolean("allow_chat").default(true),
  allowBreakouts: boolean("allow_breakouts").default(false),
  
  // Scheduling
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  timeZone: text("time_zone").default("UTC"),
  
  // Meeting details
  meetingId: text("meeting_id"),
  meetingPassword: text("meeting_password"),
  joinUrl: text("join_url"),
  hostUrl: text("host_url"),
  
  // Recording
  recordingUrl: text("recording_url"),
  recordingSize: integer("recording_size"), // bytes
  recordingDuration: integer("recording_duration"), // seconds
  
  // Status
  status: text("status").default("scheduled"), // scheduled, live, ended, cancelled
  
  // Analytics
  totalParticipants: integer("total_participants").default(0),
  peakParticipants: integer("peak_participants").default(0),
  averageDuration: integer("average_duration"), // seconds
  
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Session Participants
export const videoSessionParticipants = pgTable("video_session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => videoSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Participation details
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  duration: integer("duration"), // seconds
  role: text("role").default("participant"), // host, moderator, participant, observer
  
  // Permissions
  canSpeak: boolean("can_speak").default(true),
  canVideo: boolean("can_video").default(true),
  canChat: boolean("can_chat").default(true),
  canScreenShare: boolean("can_screen_share").default(false),
  
  // Status
  status: text("status").default("invited"), // invited, joined, left, removed
  connectionQuality: text("connection_quality"), // poor, fair, good, excellent
  
  // Engagement
  microphoneTime: integer("microphone_time").default(0), // seconds speaking
  chatMessages: integer("chat_messages").default(0),
  reactionsGiven: integer("reactions_given").default(0),
  
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Assessment & Grading System

// Automated Quiz Grading System
export const automatedQuizzes = pgTable("automated_quizzes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  createdBy: varchar("created_by").references(() => users.id),
  
  // Quiz Configuration
  timeLimit: integer("time_limit"), // minutes
  totalQuestions: integer("total_questions").default(0),
  maxAttempts: integer("max_attempts").default(1),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70.00"),
  
  // Grading Settings
  autoGrade: boolean("auto_grade").default(true),
  showResults: boolean("show_results").default(true),
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  randomizeQuestions: boolean("randomize_questions").default(false),
  
  // Scheduling
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  
  // Status
  isPublished: boolean("is_published").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessmentQuizQuestions = pgTable("assessment_quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => automatedQuizzes.id, { onDelete: 'cascade' }),
  
  // Question Content
  question: text("question").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, short_answer, essay, fill_blank, matching
  explanation: text("explanation"),
  
  // Scoring
  points: decimal("points", { precision: 5, scale: 2 }).default("1.00"),
  
  // Options and Answers
  options: jsonb("options"), // Array of options for multiple choice
  correctAnswers: jsonb("correct_answers"), // Array of correct answers
  keywords: jsonb("keywords"), // Keywords for auto-grading short answers
  
  // Question Metadata
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  tags: jsonb("tags"),
  orderIndex: integer("order_index").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessmentQuizAttempts = pgTable("assessment_quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => automatedQuizzes.id),
  userId: varchar("user_id").references(() => users.id),
  
  // Attempt Details
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // seconds
  
  // Scoring
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).default("0.00"),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).default("0.00"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("0.00"),
  passed: boolean("passed").default(false),
  
  // Status
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, submitted, graded, expired
  autoGraded: boolean("auto_graded").default(false),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessmentQuizAnswers = pgTable("assessment_quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => assessmentQuizAttempts.id, { onDelete: 'cascade' }),
  questionId: integer("question_id").references(() => assessmentQuizQuestions.id),
  
  // Answer Content
  answer: jsonb("answer"), // Student's answer(s)
  isCorrect: boolean("is_correct"),
  pointsEarned: decimal("points_earned", { precision: 5, scale: 2 }).default("0.00"),
  
  // Grading
  autoGraded: boolean("auto_graded").default(false),
  manualGraded: boolean("manual_graded").default(false),
  gradedBy: varchar("graded_by").references(() => users.id),
  feedback: text("feedback"),
  
  answeredAt: timestamp("answered_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizAnswers = assessmentQuizAnswers;

// Assignment Rubrics System
export const assignmentRubrics = pgTable("assignment_rubrics", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  courseId: integer("course_id").references(() => courses.id),
  createdBy: varchar("created_by").references(() => users.id),
  
  // Rubric Configuration
  totalPoints: decimal("total_points", { precision: 5, scale: 2 }).default("100.00"),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70.00"),
  
  // Peer Review Settings
  enablePeerReview: boolean("enable_peer_review").default(false),
  peerReviewers: integer("peer_reviewers").default(3),
  peerReviewDeadline: timestamp("peer_review_deadline"),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rubricCriteria = pgTable("rubric_criteria", {
  id: serial("id").primaryKey(),
  rubricId: integer("rubric_id").references(() => assignmentRubrics.id, { onDelete: 'cascade' }),
  
  // Criteria Details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  maxPoints: decimal("max_points", { precision: 5, scale: 2 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.00"),
  
  // Performance Levels
  levels: jsonb("levels"), // Array of performance levels with descriptions and point ranges
  
  orderIndex: integer("order_index").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assignmentGrades = pgTable("assignment_grades", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  studentId: varchar("student_id").references(() => users.id),
  rubricId: integer("rubric_id").references(() => assignmentRubrics.id),
  gradedBy: varchar("graded_by").references(() => users.id),
  
  // Grading Details
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).default("0.00"),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).default("0.00"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("0.00"),
  letterGrade: varchar("letter_grade", { length: 5 }),
  
  // Status
  status: varchar("status", { length: 20 }).default("pending"), // pending, graded, reviewed
  isPeerReview: boolean("is_peer_review").default(false),
  
  // Feedback
  overallFeedback: text("overall_feedback"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const criteriaScores = pgTable("criteria_scores", {
  id: serial("id").primaryKey(),
  gradeId: integer("grade_id").references(() => assignmentGrades.id, { onDelete: 'cascade' }),
  criteriaId: integer("criteria_id").references(() => rubricCriteria.id),
  
  // Scoring
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  level: varchar("level", { length: 50 }), // Performance level achieved
  
  // Feedback
  feedback: text("feedback"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Peer Review System
export const peerReviews = pgTable("peer_reviews", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  revieweeId: varchar("reviewee_id").references(() => users.id),
  gradeId: integer("grade_id").references(() => assignmentGrades.id),
  
  // Review Status
  status: varchar("status", { length: 20 }).default("assigned"), // assigned, in_progress, completed
  isAnonymous: boolean("is_anonymous").default(true),
  
  // Review Content
  overallRating: integer("overall_rating").default(0), // 1-5 scale
  overallFeedback: text("overall_feedback"),
  
  // Quality Metrics
  helpfulnessRating: integer("helpfulness_rating"), // Rated by reviewee
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress Tracking System
export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  
  // Overall Progress
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }).default("0.00"), // percentage
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  
  // Assessment Progress
  completedQuizzes: integer("completed_quizzes").default(0),
  totalQuizzes: integer("total_quizzes").default(0),
  averageQuizScore: decimal("average_quiz_score", { precision: 5, scale: 2 }).default("0.00"),
  
  // Assignment Progress
  completedAssignments: integer("completed_assignments").default(0),
  totalAssignments: integer("total_assignments").default(0),
  averageAssignmentScore: decimal("average_assignment_score", { precision: 5, scale: 2 }).default("0.00"),
  
  // Engagement Metrics
  timeSpent: integer("time_spent").default(0), // total minutes
  loginStreak: integer("login_streak").default(0), // consecutive days
  lastActivity: timestamp("last_activity"),
  
  // Performance Indicators
  currentGrade: decimal("current_grade", { precision: 5, scale: 2 }),
  gradeLetterEquivalent: varchar("grade_letter_equivalent", { length: 5 }),
  isOnTrack: boolean("is_on_track").default(true),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningAnalytics = pgTable("learning_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  
  // Learning Patterns
  preferredStudyTime: varchar("preferred_study_time", { length: 20 }), // morning, afternoon, evening
  averageSessionDuration: integer("average_session_duration"), // minutes
  peakPerformanceDay: varchar("peak_performance_day", { length: 20 }),
  
  // Difficulty Analysis
  strugglingTopics: jsonb("struggling_topics"), // Array of topic IDs
  strongTopics: jsonb("strong_topics"), // Array of topic IDs
  recommendedTopics: jsonb("recommended_topics"), // AI-generated recommendations
  
  // Engagement Metrics
  forumParticipation: integer("forum_participation").default(0),
  questionsAsked: integer("questions_asked").default(0),
  helpGiven: integer("help_given").default(0),
  
  // Risk Assessment
  riskLevel: varchar("risk_level", { length: 20 }).default("low"), // low, medium, high
  interventionSuggested: boolean("intervention_suggested").default(false),
  lastRiskAssessment: timestamp("last_risk_assessment"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificate Generation System
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  
  // Template Design
  templateData: jsonb("template_data"), // SVG/HTML template with placeholders
  backgroundImage: varchar("background_image", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  
  // Certificate Requirements
  minPassingGrade: decimal("min_passing_grade", { precision: 5, scale: 2 }).default("70.00"),
  requiredAssignments: jsonb("required_assignments"), // Array of assignment IDs
  requiredQuizzes: jsonb("required_quizzes"), // Array of quiz IDs
  
  // Certificate Details
  credentialType: varchar("credential_type", { length: 50 }).default("completion"), // completion, achievement, mastery
  validityPeriod: integer("validity_period"), // months (null = no expiry)
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedCertificates = pgTable("generated_certificates", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => certificateTemplates.id),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  
  // Certificate Details
  certificateNumber: varchar("certificate_number", { length: 100 }).notNull().unique(),
  studentName: varchar("student_name", { length: 255 }).notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  
  // Achievement Data
  finalGrade: decimal("final_grade", { precision: 5, scale: 2 }),
  completionDate: timestamp("completion_date").notNull(),
  issueDate: timestamp("issue_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  
  // Certificate Files
  certificateUrl: varchar("certificate_url", { length: 500 }),
  verificationCode: varchar("verification_code", { length: 100 }).unique(),
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, revoked, expired
  downloadCount: integer("download_count").default(0),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional certificate data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment System Types
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type Rubric = typeof rubrics.$inferSelect;
export type RubricScore = typeof rubricScores.$inferSelect;
export type GradeCategory = typeof gradeCategories.$inferSelect;
export type CourseGrade = typeof courseGrades.$inferSelect;

// Enhanced Assessment & Grading Types
export type AutomatedQuiz = typeof automatedQuizzes.$inferSelect;
export type AssessmentQuizQuestion = typeof assessmentQuizQuestions.$inferSelect;
export type AssessmentQuizAttempt = typeof assessmentQuizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type AssignmentRubric = typeof assignmentRubrics.$inferSelect;
export type RubricCriteria = typeof rubricCriteria.$inferSelect;
export type AssignmentGrade = typeof assignmentGrades.$inferSelect;
export type CriteriaScore = typeof criteriaScores.$inferSelect;
export type PeerReview = typeof peerReviews.$inferSelect;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type LearningAnalytics = typeof learningAnalytics.$inferSelect;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type GeneratedCertificate = typeof generatedCertificates.$inferSelect;

// Enhanced Learning System Types
export type CodingChallenge = typeof codingChallenges.$inferSelect;
export type CodeExecution = typeof codeExecutions.$inferSelect;
export type ChallengeHint = typeof challengeHints.$inferSelect;
export type CodingSubmission = typeof codingSubmissions.$inferSelect;
export type AdvancedQuiz = typeof advancedQuizzes.$inferSelect;
export type AdvancedQuizQuestion = typeof advancedQuizQuestions.$inferSelect;
export type AdvancedQuizAttempt = typeof advancedQuizAttempts.$inferSelect;
export type AdvancedQuizAnswer = typeof advancedQuizAnswers.$inferSelect;
export type AdvancedAssignment = typeof advancedAssignments.$inferSelect;
export type AdvancedAssignmentSubmission = typeof advancedAssignmentSubmissions.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type DiscussionForum = typeof discussionForums.$inferSelect;
export type DiscussionTopic = typeof discussionTopics.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type DiscussionVote = typeof discussionVotes.$inferSelect;
export type VideoSession = typeof videoSessions.$inferSelect;
export type VideoSessionParticipant = typeof videoSessionParticipants.$inferSelect;

// Video Content Management Types
export type VideoContent = typeof videoContent.$inferSelect;
export type VideoProgress = typeof videoProgress.$inferSelect;

// Insert schemas for new tables
export const insertCodingChallengeSchema = createInsertSchema(codingChallenges);
export const insertCodeExecutionSchema = createInsertSchema(codeExecutions);
export const insertChallengeHintSchema = createInsertSchema(challengeHints);
export const insertCodingSubmissionSchema = createInsertSchema(codingSubmissions);
export const insertAdvancedQuizSchema = createInsertSchema(advancedQuizzes).extend({
  passingScore: z.coerce.number().min(0).max(100).default(70),
  timeLimit: z.coerce.number().optional(),
  attempts: z.coerce.number().min(1).default(1),
});
export const insertAdvancedQuizQuestionSchema = createInsertSchema(advancedQuizQuestions);
export const insertAdvancedQuizAttemptSchema = createInsertSchema(advancedQuizAttempts);
export const insertAdvancedQuizAnswerSchema = createInsertSchema(advancedQuizAnswers);
export const insertAdvancedAssignmentSchema = createInsertSchema(advancedAssignments);
export const insertAdvancedAssignmentSubmissionSchema = createInsertSchema(advancedAssignmentSubmissions);
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles);
export const insertDiscussionForumSchema = createInsertSchema(discussionForums);
export const insertDiscussionTopicSchema = createInsertSchema(discussionTopics);
export const insertDiscussionReplySchema = createInsertSchema(discussionReplies);
export const insertDiscussionVoteSchema = createInsertSchema(discussionVotes);
export const insertVideoSessionSchema = createInsertSchema(videoSessions);
export const insertVideoSessionParticipantSchema = createInsertSchema(videoSessionParticipants);

// Video Content Management Insert Schemas
export const insertVideoContentSchema = createInsertSchema(videoContent).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({
  id: true,
  sessionStart: true,
  lastWatched: true,
});

// Assessment & Grading Insert Schemas
export const insertAutomatedQuizSchema = createInsertSchema(automatedQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizQuestionSchema = createInsertSchema(assessmentQuizQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(assessmentQuizAttempts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentRubricSchema = createInsertSchema(assignmentRubrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRubricCriteriaSchema = createInsertSchema(rubricCriteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentGradeSchema = createInsertSchema(assignmentGrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPeerReviewSchema = createInsertSchema(peerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningAnalyticsSchema = createInsertSchema(learningAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedCertificateSchema = createInsertSchema(generatedCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Live Session Insert Schemas
export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveSessionAttendanceSchema = createInsertSchema(liveSessionAttendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveSessionMessageSchema = createInsertSchema(liveSessionMessages).omit({
  id: true,
  timestamp: true,
});

export const insertLiveSessionQASchema = createInsertSchema(liveSessionQA).omit({
  id: true,
  askedAt: true,
  answeredAt: true,
});

export const insertLiveSessionPollSchema = createInsertSchema(liveSessionPolls).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});

export const insertLiveSessionPollResponseSchema = createInsertSchema(liveSessionPollResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertVideoProviderSettingsSchema = createInsertSchema(videoProviderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert types
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type InsertLiveSessionAttendance = z.infer<typeof insertLiveSessionAttendanceSchema>;
export type InsertLiveSessionMessage = z.infer<typeof insertLiveSessionMessageSchema>;
export type InsertLiveSessionQA = z.infer<typeof insertLiveSessionQASchema>;
export type InsertLiveSessionPoll = z.infer<typeof insertLiveSessionPollSchema>;
export type InsertLiveSessionPollResponse = z.infer<typeof insertLiveSessionPollResponseSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertVideoProviderSettings = z.infer<typeof insertVideoProviderSettingsSchema>;

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
// Remove duplicate types - already declared above

// Create insert schemas
export const insertConversationSchema = createInsertSchema(conversations);
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export const insertCourseAnnouncementSchema = createInsertSchema(courseAnnouncements);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationSettingSchema = createInsertSchema(notificationSettings);
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true
});
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create insert types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type InsertCourseAnnouncement = z.infer<typeof insertCourseAnnouncementSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Create select types
export type Invoice = typeof invoices.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

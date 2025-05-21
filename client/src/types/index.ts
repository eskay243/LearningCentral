// User roles
export enum UserRole {
  ADMIN = "admin",
  MENTOR = "mentor",
  STUDENT = "student",
  AFFILIATE = "affiliate"
}

// Dashboard component types
export interface StatsCardItem {
  id?: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  iconBgClass?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface UpcomingClass {
  id: number;
  title: string;
  module: string;
  startTime: string;
  duration: number;
  enrolledCount: number;
  iconClass: string;
  iconBgClass: string;
}

export interface StudentProgressItem {
  id: string;
  name: string;
  course: string;
  progress: number;
  lastActive: string;
  avatar?: string;
}

export interface RecentActivityItem {
  id: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: string;
  title?: string;
  description?: string;
  time?: string; // For compatibility with existing components
  iconClass?: string;
  iconBgClass?: string;
}

export interface CourseCardItem {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  status: string;
  author?: string;
  category?: string;
  enrollments?: number;
  lastUpdated?: string;
  students?: number;
}

// Course types
export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  tags?: string[];
  enrollmentCount?: number;
}

// Module types
export interface Module {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: Lesson[];
}

// Lesson types
export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  content?: string;
  contentType: string;
  videoUrl?: string;
  videoPoster?: string;
  videoProvider?: string;
  duration?: number;
  isLive?: boolean;
  scheduledAt?: string;
  orderIndex: number;
  notes?: string;
  isPreview?: boolean;
  requiresAuth?: boolean;
  drm?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Enrollment types
export interface CourseEnrollment {
  id: number;
  courseId: number;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  paymentStatus: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProvider?: string;
  certificateId?: string;
}

// User type
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  affiliateCode?: string;
  claims?: {
    sub: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    iat?: number;
    exp?: number;
  };
}

// Messaging types
export interface Conversation {
  id: number;
  title: string | null;
  type: string;
  courseId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  participants?: ConversationParticipant[];
  isGroup?: boolean;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  typingUsers?: string[];
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: string;
  isAdmin?: boolean;
  joinedAt?: Date;
  lastReadMessageId?: number;
  user?: User;
}

export interface ChatMessage {
  id: number;
  content: string;
  conversationId: number;
  senderId: string;
  contentType: string | null;
  attachmentUrl: string | null;
  sentAt: Date | null;
  isEdited: boolean | null;
  editedAt: Date | null;
  replyToId: number | null;
  senderName?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: number;
  messageId: number;
  userId: string;
  reaction: string;
  createdAt?: Date;
}

export interface CourseAnnouncement {
  id: number;
  title: string;
  content: string;
  courseId: number | null;
  authorId: string;
  publishedAt: Date | null;
  updatedAt: Date | null;
  isPinned: boolean | null;
  attachmentUrl: string | null;
}

// Rich text editor interface
export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void>;
  onTypingStateChange: (isTyping: boolean) => void;
  attachment: { url: string; name: string; type: string; } | null;
  onAttachment: (fileUrl: string, fileName: string, fileType: string) => void;
  placeholder: string;
  className?: string;
}
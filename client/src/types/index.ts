export enum UserRole {
  ADMIN = "admin",
  MENTOR = "mentor",
  STUDENT = "student",
  AFFILIATE = "affiliate",
}

export enum DrmProtectionType {
  NONE = 'none',
  BASIC = 'basic',           // Simple encryption
  WATERMARKED = 'watermark', // Content with user-specific watermarks
  TIMED = 'timed',           // Time-limited access
  PREMIUM = 'premium'        // Full protection (encryption + watermark + device limits)
}

export interface LessonContent {
  id: number;
  title: string;
  content: string | null;
  videoUrl: string | null;
  drm: string | null;
  isPreview: boolean;
  moduleId: number;
}

export interface ProtectedContentResponse {
  content: string;
  drm: string | null;
}

// Dashboard Types for the new UI
export interface StatsCardItem {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export interface UpcomingClass {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  courseName: string;
  courseId: number;
  status: 'scheduled' | 'live' | 'completed';
  meetingUrl?: string;
}

export interface StudentProgressItem {
  id: number;
  studentName: string;
  profileImage?: string;
  course: string;
  progress: number;
  lastActivity: string;
  status: 'active' | 'at-risk' | 'inactive';
}

export interface RecentActivityItem {
  id: number;
  type: 'completed' | 'submitted' | 'joined' | 'commented' | 'message';
  content: string;
  timestamp: string;
  user?: string;
  userImage?: string;
  link?: {
    url: string;
    text: string;
  };
}

export interface CourseCardItem {
  id: number;
  title: string;
  description: string;
  coverImage?: string;
  progress?: number;
  instructor: string;
  price: number | null;
  enrolledStudents: number;
  rating: number;
  status: 'published' | 'draft' | 'archived';
  categories: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  completionRate?: number;
  lastUpdated: string;
  duration?: string;
  enrollmentStatus?: 'enrolled' | 'completed' | 'not-enrolled';
}

// User interface
export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

// Settings interface
export interface Settings {
  id: number;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailAlerts: boolean;
  language: string;
  currency: string;
  timezone: string;
  userId: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  coverImage?: string;
  price: number | null;
  currency?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  categories: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  enrolledCount?: number;
  rating?: number;
  isPopular?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}
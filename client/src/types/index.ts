// User roles
export enum UserRole {
  ADMIN = "admin",
  MENTOR = "mentor",
  STUDENT = "student",
  AFFILIATE = "affiliate"
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
}
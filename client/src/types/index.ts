export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  affiliateCode?: string;
}

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
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  isLive: boolean;
  scheduledAt?: string;
  orderIndex: number;
  notes?: string;
}

export interface Resource {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
  isLocked: boolean;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  passingScore: number;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  type: string;
  options: any;
  correctAnswer: any;
  points: number;
  orderIndex: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: string;
  score: number;
  isPassed: boolean;
  startedAt: string;
  completedAt: string;
  answers: any;
}

export interface Assignment {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  dueDate?: string;
  rubric?: any;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  userId: string;
  fileUrl: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface LiveSession {
  id: number;
  lessonId: number;
  startTime: string;
  endTime?: string;
  meetingUrl?: string;
  recordingUrl?: string;
  status: string;
  lesson?: Lesson;
  module?: Module;
  course?: Course;
}

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
  certificateId?: string;
}

export interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface Notification {
  id: number;
  userId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface CourseStats {
  totalEnrollments: number;
  averageProgress: number;
  completions: number;
}

export interface MentorStats {
  totalCourses: number;
  totalStudents: number;
}

export interface StudentStats {
  totalEnrollments: number;
  completedCourses: number;
  averageProgress: number;
}

export interface UpcomingClass {
  id: number;
  title: string;
  startTime: string;
  duration: number;
  enrolledCount: number;
  iconClass: string;
  iconBgClass: string;
  module: string;
}

export interface StudentProgressItem {
  id: string;
  name: string;
  course: string;
  progress: number;
  avatar: string;
}

export interface RecentActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  iconClass: string;
  iconBgClass: string;
}

export interface CourseCardItem {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  progress: number;
  status: string;
  students: number;
}

export interface StatsCardItem {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  iconBgClass: string;
}

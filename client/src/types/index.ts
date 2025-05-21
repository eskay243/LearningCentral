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
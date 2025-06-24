import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileText, Image, Video, Music, Archive } from 'lucide-react';

// Ensure upload directories exist
const messageAttachmentsDir = 'uploads/message-attachments';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync(messageAttachmentsDir)) {
  fs.mkdirSync(messageAttachmentsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageAttachmentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

// File filter for security
const fileFilter = (req: any, file: any, cb: any) => {
  // Allow most file types but exclude potentially dangerous ones
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3',
    'audio/webm',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    
    // Code files
    'text/javascript',
    'text/html',
    'text/css',
    'application/json',
    'text/xml',
    'application/xml'
  ];

  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.includes(fileExtension)) {
    cb(new Error('File type not allowed for security reasons'), false);
    return;
  }

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Allow other file types but log them
    console.log(`Allowing file with MIME type: ${file.mimetype}`);
    cb(null, true);
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'file-text';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'archive';
  return 'file-text';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
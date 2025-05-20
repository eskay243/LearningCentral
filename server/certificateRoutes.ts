import { Router } from 'express';
import { storage } from './storage';
import { isAuthenticated, hasRole } from './replitAuth';
import { UserRole } from '@shared/schema';

const router = Router();

// Issue a certificate manually (admin/mentor only)
router.post('/', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
  try {
    const { userId, courseId, template } = req.body;
    
    if (!userId || !courseId || !template) {
      return res.status(400).json({ message: "userId, courseId, and template are required" });
    }
    
    const certificate = await storage.issueCertificate({
      userId,
      courseId,
      template
    });
    
    res.status(201).json(certificate);
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    res.status(400).json({ message: error.message || "Failed to issue certificate" });
  }
});

// Get all certificates for the authenticated user
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    const certificates = await storage.getUserCertificates(userId);
    
    res.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

// Get a specific certificate by ID
router.get('/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    const certificate = await storage.getCertificate(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ message: "Failed to fetch certificate" });
  }
});

// Verify a certificate
router.get('/:id/verify', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    const verification = await storage.verifyCertificate(certificateId);
    
    res.json(verification);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ message: "Failed to verify certificate" });
  }
});

// Complete a course and auto-issue certificate
router.post('/courses/:id/complete', isAuthenticated, async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    // Check if user is enrolled in the course
    const enrollment = await storage.getCourseEnrollment(userId, courseId);
    
    if (!enrollment) {
      return res.status(400).json({ message: "You are not enrolled in this course" });
    }
    
    // Update enrollment as completed with 100% progress
    await storage.updateCourseProgress(enrollment.id, 100);
    
    // Check if the user already has a certificate for this course
    const userCertificates = await storage.getUserCertificates(userId);
    const existingCertificate = userCertificates.find(cert => cert.courseId === courseId);
    
    if (existingCertificate) {
      return res.json({ message: "Course completed. Certificate already issued.", certificate: existingCertificate });
    }
    
    // Auto-generate certificate
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const defaultTemplate = `<div class="certificate">
      <h1>Certificate of Completion</h1>
      <p>This is to certify that the student has successfully completed</p>
      <h2>${course.title}</h2>
      <p>Issued by Codelab Educare</p>
    </div>`;
    
    const certificate = await storage.issueCertificate({
      userId,
      courseId,
      template: defaultTemplate
    });
    
    res.status(201).json({ 
      message: "Congratulations! You have completed the course and earned a certificate.", 
      certificate 
    });
  } catch (error: any) {
    console.error("Error completing course:", error);
    res.status(500).json({ message: error.message || "Failed to complete course" });
  }
});

export default router;
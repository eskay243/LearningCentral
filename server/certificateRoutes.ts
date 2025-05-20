import { Router } from 'express';
import { storage } from './storage';
import { isAuthenticated, hasRole } from './replitAuth';
import { UserRole } from '@shared/schema';
import { randomBytes } from 'crypto';

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

// Get all certificates (admin/mentor only)
router.get('/all', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const certificates = await storage.getAllCertificates();
    res.json(certificates);
  } catch (error) {
    console.error("Error fetching all certificates:", error);
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

// Manual certificate issuance by admin/mentor
router.post('/issue-manual', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
  try {
    const { userId, courseId, templateStyle, additionalNote } = req.body;
    
    if (!userId || !courseId || !templateStyle) {
      return res.status(400).json({ message: "userId, courseId, and templateStyle are required" });
    }
    
    // Generate unique verification code
    const verificationCode = randomBytes(4).toString('hex').toUpperCase();
    
    // Get user and course details for the certificate content
    const user = await storage.getUser(userId);
    const course = await storage.getCourse(parseInt(courseId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Issue the certificate
    const certificate = await storage.issueCertificate({
      userId,
      courseId: parseInt(courseId),
      templateStyle,
      additionalNote,
      verificationCode,
      issuedBy: req.user.claims.sub, // Admin/mentor who is issuing the certificate
      status: "issued"
    });
    
    res.status(201).json(certificate);
  } catch (error: any) {
    console.error("Error issuing certificate manually:", error);
    res.status(400).json({ message: error.message || "Failed to issue certificate" });
  }
});

// Revoke a certificate (admin/mentor only)
router.post('/:id/revoke', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const certificateId = parseInt(req.params.id);
    
    // Update certificate status
    const updatedCertificate = await storage.updateCertificateStatus(certificateId, "revoked");
    
    if (!updatedCertificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json(updatedCertificate);
  } catch (error: any) {
    console.error("Error revoking certificate:", error);
    res.status(400).json({ message: error.message || "Failed to revoke certificate" });
  }
});

// Restore a revoked certificate (admin/mentor only)
router.post('/:id/restore', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const certificateId = parseInt(req.params.id);
    
    // Update certificate status
    const updatedCertificate = await storage.updateCertificateStatus(certificateId, "issued");
    
    if (!updatedCertificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json(updatedCertificate);
  } catch (error: any) {
    console.error("Error restoring certificate:", error);
    res.status(400).json({ message: error.message || "Failed to restore certificate" });
  }
});

// Download certificate as PDF
router.get('/:id/download', async (req, res) => {
  try {
    const certificateId = parseInt(req.params.id);
    
    const certificate = await storage.getCertificate(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    if (certificate.status === "revoked") {
      return res.status(400).json({ message: "This certificate has been revoked and cannot be downloaded" });
    }
    
    // In a real implementation, this would generate a PDF
    // For now, we'll just return the certificate data for frontend PDF generation
    res.json(certificate);
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({ message: "Failed to download certificate" });
  }
});

export default router;
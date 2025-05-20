import { Router } from 'express';
import { storage } from './storage';
import { isAuthenticated, hasRole } from './replitAuth';
import { UserRole } from '@shared/schema';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { certificates } from '@shared/schema';

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

// Get monthly certificate issuance statistics (admin/mentor only)
router.get('/analytics/monthly', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const result = await db.select({
      month: sql`to_char(${certificates.issuedAt}, 'YYYY-MM')`,
      count: sql`count(*)`,
    })
    .from(certificates)
    .groupBy(sql`to_char(${certificates.issuedAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${certificates.issuedAt}, 'YYYY-MM')`);
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching monthly certificate analytics:", error);
    res.status(500).json({ message: "Failed to fetch certificate analytics" });
  }
});

// Get certificate analytics by course (admin/mentor only)
router.get('/analytics/by-course', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    // Get all certificates with course information
    const certificatesWithCourses = await storage.getAllCertificatesWithCourseDetails();
    
    // Group them by course and count
    const courseStats = {};
    certificatesWithCourses.forEach(cert => {
      const courseTitle = cert.courseTitle || 'Unknown Course';
      courseStats[courseTitle] = (courseStats[courseTitle] || 0) + 1;
    });
    
    // Convert to array format for frontend charts
    const result = Object.entries(courseStats).map(([name, value]) => ({ name, value }));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching certificate analytics by course:", error);
    res.status(500).json({ message: "Failed to fetch certificate analytics" });
  }
});

// Get certificate status distribution (admin/mentor only)
router.get('/analytics/status', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const result = await db.select({
      status: certificates.status,
      count: sql`count(*)`,
    })
    .from(certificates)
    .groupBy(certificates.status);
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching certificate status analytics:", error);
    res.status(500).json({ message: "Failed to fetch certificate analytics" });
  }
});

// Get top certificate issuers (admin/mentor only)
router.get('/analytics/issuers', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const users = await storage.getUsers();
    const allCertificates = await storage.getAllCertificates();
    
    // Group certificates by issuer
    const issuerStats = {};
    allCertificates.forEach(cert => {
      if (cert.issuedBy) {
        issuerStats[cert.issuedBy] = (issuerStats[cert.issuedBy] || 0) + 1;
      }
    });
    
    // Convert to array and map to include issuer names
    const result = Object.entries(issuerStats)
      .map(([issuerId, count]) => {
        const issuer = users.find(user => user.id === issuerId);
        return {
          id: issuerId,
          name: issuer ? `${issuer.firstName || ''} ${issuer.lastName || ''}`.trim() || issuer.email : issuerId,
          count: count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching certificate issuers analytics:", error);
    res.status(500).json({ message: "Failed to fetch certificate analytics" });
  }
});

// Get student certification statistics (admin/mentor only)
router.get('/analytics/students', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const users = await storage.getUsers();
    const students = users.filter(user => user.role === UserRole.STUDENT);
    const allCertificates = await storage.getAllCertificates();
    
    // Get unique student IDs who have certificates
    const certifiedStudentIds = new Set(allCertificates.map(cert => cert.userId));
    
    // Calculate stats
    const totalStudents = students.length;
    const certifiedStudents = Array.from(certifiedStudentIds).length;
    
    res.json({
      totalStudents,
      certifiedStudents,
      certificationRate: totalStudents > 0 ? Math.round((certifiedStudents / totalStudents) * 100) : 0
    });
  } catch (error) {
    console.error("Error fetching student certification analytics:", error);
    res.status(500).json({ message: "Failed to fetch certificate analytics" });
  }
});

export default router;
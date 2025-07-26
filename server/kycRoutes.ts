import { type Express, type Request, type Response } from "express";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./auth";
import { UserRole } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Configure multer for KYC document uploads
const kycUpload = multer({
  dest: "uploads/kyc/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types for KYC documents
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and WEBP files are allowed.'));
    }
  }
});

// KYC verification levels and their requirements
const KYC_REQUIREMENTS = {
  basic: {
    level: "basic",
    name: "Basic Verification",
    description: "Identity verification with government-issued ID",
    requirements: ["Government-issued ID", "Proof of address"],
    benefits: ["Access to basic courses", "Standard withdrawal limits"],
    documentsRequired: 2
  },
  intermediate: {
    level: "intermediate", 
    name: "Intermediate Verification",
    description: "Enhanced verification with additional documentation",
    requirements: ["Government-issued ID", "Proof of address", "Bank statement", "Utility bill"],
    benefits: ["Access to premium courses", "Higher withdrawal limits", "Priority support"],
    documentsRequired: 4
  },
  advanced: {
    level: "advanced",
    name: "Advanced Verification", 
    description: "Comprehensive verification for high-value transactions",
    requirements: ["Government-issued ID", "Proof of address", "Bank statement", "Utility bill", "Employment verification", "Income proof"],
    benefits: ["Full platform access", "Unlimited withdrawals", "Premium features", "VIP support"],
    documentsRequired: 6
  }
};

// Document type definitions
const DOCUMENT_TYPES = {
  GOVERNMENT_ID: "government_id",
  PROOF_OF_ADDRESS: "proof_of_address", 
  BANK_STATEMENT: "bank_statement",
  UTILITY_BILL: "utility_bill",
  EMPLOYMENT_VERIFICATION: "employment_verification",
  INCOME_PROOF: "income_proof",
  PASSPORT: "passport",
  DRIVERS_LICENSE: "drivers_license",
  NATIONAL_ID: "national_id"
};

// Validation schemas
const kycSubmissionSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Complete address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  verificationLevel: z.enum(["basic", "intermediate", "advanced"]),
  employmentStatus: z.string().optional(),
  occupation: z.string().optional(),
  sourceOfIncome: z.string().optional(),
});

export function registerKycRoutes(app: Express): void {
  
  // Get KYC verification levels and requirements
  app.get("/api/kyc/requirements", (req, res) => {
    res.json({
      levels: Object.values(KYC_REQUIREMENTS),
      documentTypes: DOCUMENT_TYPES
    });
  });

  // Get current user's KYC status and documents
  app.get("/api/kyc/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kycDocument = await storage.getKycDocument(userId);
      
      if (!kycDocument) {
        return res.json({
          status: "not_started",
          verificationLevel: null,
          documentsUploaded: 0,
          documentsVerified: 0,
          canUpgrade: true
        });
      }

      const files = await storage.getKycDocumentFiles(kycDocument.id);
      const verifiedFiles = files.filter(f => f.verificationStatus === "approved");

      res.json({
        ...kycDocument,
        documentsUploaded: files.length,
        documentsVerified: verifiedFiles.length,
        files: files.map(f => ({
          id: f.id,
          documentType: f.documentType,
          fileName: f.fileName,
          verificationStatus: f.verificationStatus,
          uploadedAt: f.uploadedAt,
          verificationNotes: f.verificationNotes
        }))
      });
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      res.status(500).json({ message: "Failed to fetch KYC status" });
    }
  });

  // Submit KYC information
  app.post("/api/kyc/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Validate input data
      const validatedData = kycSubmissionSchema.parse(req.body);
      
      // Check if user already has KYC submission
      const existingKyc = await storage.getKycDocument(userId);
      
      if (existingKyc && existingKyc.verificationStatus === "approved") {
        return res.status(400).json({ 
          message: "KYC already approved. Contact support for changes." 
        });
      }

      const kycData = {
        userId,
        userRole,
        ...validatedData,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        verificationStatus: "pending" as const,
        documentsComplete: false,
        documentsVerified: false,
        submittedAt: new Date(),
        lastUpdated: new Date()
      };

      let kycDocument;
      if (existingKyc) {
        kycDocument = await storage.updateKycDocument(userId, kycData);
      } else {
        kycDocument = await storage.createKycDocument(kycData);
      }

      // Add history entry
      await storage.addKycVerificationHistory({
        kycDocumentId: kycDocument.id,
        userId,
        action: existingKyc ? "updated" : "submitted",
        newStatus: "pending",
        performedBy: userId,
        reason: "KYC information submitted"
      });

      res.status(201).json({
        message: "KYC information submitted successfully",
        kycDocument: {
          id: kycDocument.id,
          verificationStatus: kycDocument.verificationStatus,
          verificationLevel: kycDocument.verificationLevel
        }
      });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to submit KYC information" });
    }
  });

  // Upload KYC documents
  app.post("/api/kyc/upload-document", isAuthenticated, kycUpload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { documentType, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!documentType || !Object.values(DOCUMENT_TYPES).includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      // Get or create KYC document record
      let kycDocument = await storage.getKycDocument(userId);
      if (!kycDocument) {
        return res.status(400).json({ 
          message: "Please submit KYC information first" 
        });
      }

      // Create file record
      const fileData = {
        kycDocumentId: kycDocument.id,
        documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
        verificationStatus: "pending" as const,
        isActive: true
      };

      const uploadedFile = await storage.uploadKycDocumentFile(fileData);

      // Check if all required documents are uploaded
      const allFiles = await storage.getKycDocumentFiles(kycDocument.id);
      const verificationLevel = kycDocument.verificationLevel as keyof typeof KYC_REQUIREMENTS;
      const requirements = KYC_REQUIREMENTS[verificationLevel];
      const documentsComplete = allFiles.length >= requirements.documentsRequired;

      if (documentsComplete && !kycDocument.documentsComplete) {
        await storage.updateKycDocument(userId, { 
          documentsComplete: true,
          lastUpdated: new Date()
        });
      }

      // Add history entry
      await storage.addKycVerificationHistory({
        kycDocumentId: kycDocument.id,
        userId,
        action: "document_uploaded",
        newStatus: kycDocument.verificationStatus,
        performedBy: userId,
        reason: `Uploaded ${documentType} document`,
        notes: `File: ${req.file.originalname}`
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        file: {
          id: uploadedFile.id,
          documentType: uploadedFile.documentType,
          fileName: uploadedFile.fileName,
          verificationStatus: uploadedFile.verificationStatus,
          uploadedAt: uploadedFile.uploadedAt
        },
        documentsComplete
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get uploaded documents for current user
  app.get("/api/kyc/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kycDocument = await storage.getKycDocument(userId);
      
      if (!kycDocument) {
        return res.json([]);
      }

      const files = await storage.getKycDocumentFiles(kycDocument.id);
      
      res.json(files.map(f => ({
        id: f.id,
        documentType: f.documentType,
        fileName: f.fileName,
        verificationStatus: f.verificationStatus,
        uploadedAt: f.uploadedAt,
        verificationNotes: f.verificationNotes,
        verifiedAt: f.verifiedAt
      })));
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Delete uploaded document
  app.delete("/api/kyc/documents/:fileId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fileId = parseInt(req.params.fileId);
      
      const kycDocument = await storage.getKycDocument(userId);
      if (!kycDocument) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      const file = await storage.updateKycDocumentFileStatus(fileId, "deleted", "File deleted by user");
      
      // Add history entry
      await storage.addKycVerificationHistory({
        kycDocumentId: kycDocument.id,
        userId,
        action: "document_deleted",
        newStatus: kycDocument.verificationStatus,
        performedBy: userId,
        reason: `Deleted ${file.documentType} document`
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Get KYC verification history
  app.get("/api/kyc/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const kycDocument = await storage.getKycDocument(userId);
      
      if (!kycDocument) {
        return res.json([]);
      }

      const history = await storage.getKycVerificationHistory(kycDocument.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching KYC history:", error);
      res.status(500).json({ message: "Failed to fetch verification history" });
    }
  });

  // ADMIN ROUTES - KYC Management
  
  // Get all pending KYC submissions
  app.get("/api/admin/kyc/pending", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const pendingSubmissions = await storage.getPendingKycSubmissions();
      res.json(pendingSubmissions);
    } catch (error) {
      console.error("Error fetching pending KYC submissions:", error);
      res.status(500).json({ message: "Failed to fetch pending submissions" });
    }
  });

  // Get KYC statistics for admin dashboard
  app.get("/api/admin/kyc/statistics", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const stats = await storage.getKycStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching KYC statistics:", error);
      res.status(500).json({ message: "Failed to fetch KYC statistics" });
    }
  });

  // Get specific user's KYC details for admin review
  app.get("/api/admin/kyc/user/:userId", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userId = req.params.userId;
      const kycDocument = await storage.getKycDocument(userId);
      
      if (!kycDocument) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      const files = await storage.getKycDocumentFiles(kycDocument.id);
      const history = await storage.getKycVerificationHistory(kycDocument.id);

      res.json({
        ...kycDocument,
        files: files.map(f => ({
          id: f.id,
          documentType: f.documentType,
          fileName: f.fileName,
          filePath: f.filePath,
          verificationStatus: f.verificationStatus,
          uploadedAt: f.uploadedAt,
          verificationNotes: f.verificationNotes,
          verifiedAt: f.verifiedAt
        })),
        history
      });
    } catch (error) {
      console.error("Error fetching user KYC details:", error);
      res.status(500).json({ message: "Failed to fetch KYC details" });
    }
  });

  // Approve KYC document
  app.post("/api/admin/kyc/:userId/approve", isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const adminId = req.user.id;
      const { notes } = req.body;

      const approvedKyc = await storage.approveKycDocument(userId, adminId, notes);
      
      res.json({
        message: "KYC approved successfully",
        kycDocument: approvedKyc
      });
    } catch (error) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: "Failed to approve KYC" });
    }
  });

  // Reject KYC document
  app.post("/api/admin/kyc/:userId/reject", isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const adminId = req.user.id;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const rejectedKyc = await storage.rejectKycDocument(userId, adminId, reason);
      
      res.json({
        message: "KYC rejected successfully", 
        kycDocument: rejectedKyc
      });
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      res.status(500).json({ message: "Failed to reject KYC" });
    }
  });

  // Approve/reject individual document file
  app.post("/api/admin/kyc/file/:fileId/verify", isAuthenticated, hasRole([UserRole.ADMIN]), async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const { status, notes } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const verifiedFile = await storage.updateKycDocumentFileStatus(fileId, status, notes);
      
      res.json({
        message: `Document ${status} successfully`,
        file: verifiedFile
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Failed to verify document" });
    }
  });

  // Download KYC document (Admin only)
  app.get("/api/admin/kyc/download/:fileId", isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      // Get file details from database
      const files = await storage.getKycDocumentFiles(0); // This would need to be updated to get specific file
      const file = files.find(f => f.id === fileId);
      
      if (!file || !fs.existsSync(file.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(file.filePath, file.fileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });
}
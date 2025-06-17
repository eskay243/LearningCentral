import { Express, Request, Response } from 'express';
import { db } from './db';
import { studentKyc, users } from '../shared/schema';
import { insertStudentKycSchema } from '../shared/schema';
import { isAuthenticated, requireRole } from './auth';
import { eq, and } from 'drizzle-orm';

export function registerKycRoutes(app: Express) {
  // Submit KYC form for students
  app.post('/api/kyc/student/submit', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const formData = req.body;

      // Validate the form data
      const validatedData = insertStudentKycSchema.parse({
        ...formData,
        userId
      });

      // Check if KYC already exists for this user
      const existingKyc = await db.select()
        .from(studentKyc)
        .where(eq(studentKyc.userId, userId))
        .limit(1);

      let result;
      if (existingKyc.length > 0) {
        // Update existing KYC record
        result = await db.update(studentKyc)
          .set({
            ...validatedData,
            updatedAt: new Date(),
            status: 'pending' // Reset status to pending when resubmitted
          })
          .where(eq(studentKyc.userId, userId))
          .returning();
      } else {
        // Create new KYC record
        result = await db.insert(studentKyc)
          .values(validatedData)
          .returning();
      }

      // Update user's basic information if provided
      if (formData.firstName || formData.lastName) {
        await db.update(users)
          .set({
            firstName: formData.firstName,
            lastName: formData.lastName,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }

      res.json({
        success: true,
        message: 'KYC information submitted successfully',
        data: result[0]
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to submit KYC information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get KYC status for current user
  app.get('/api/kyc/student/status', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const kycRecord = await db.select()
        .from(studentKyc)
        .where(eq(studentKyc.userId, userId))
        .limit(1);

      if (kycRecord.length === 0) {
        return res.json({
          success: true,
          status: 'not_submitted',
          message: 'No KYC information found'
        });
      }

      res.json({
        success: true,
        status: kycRecord[0].status,
        data: {
          id: kycRecord[0].id,
          status: kycRecord[0].status,
          submittedAt: kycRecord[0].submittedAt,
          reviewedAt: kycRecord[0].reviewedAt,
          reviewComments: kycRecord[0].reviewComments
        }
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC status'
      });
    }
  });

  // Get KYC details for current user
  app.get('/api/kyc/student/details', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const kycRecord = await db.select()
        .from(studentKyc)
        .where(eq(studentKyc.userId, userId))
        .limit(1);

      if (kycRecord.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'No KYC information found'
        });
      }

      res.json({
        success: true,
        data: kycRecord[0]
      });
    } catch (error) {
      console.error('Error fetching KYC details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC details'
      });
    }
  });

  // Admin: Get all pending KYC submissions
  app.get('/api/admin/kyc/pending', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const pendingKyc = await db.select({
        id: studentKyc.id,
        userId: studentKyc.userId,
        firstName: studentKyc.firstName,
        lastName: studentKyc.lastName,
        email: studentKyc.email,
        status: studentKyc.status,
        submittedAt: studentKyc.submittedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName
      })
        .from(studentKyc)
        .leftJoin(users, eq(studentKyc.userId, users.id))
        .where(eq(studentKyc.status, 'pending'));

      res.json({
        success: true,
        data: pendingKyc
      });
    } catch (error) {
      console.error('Error fetching pending KYC submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending KYC submissions'
      });
    }
  });

  // Admin: Get KYC details for review
  app.get('/api/admin/kyc/:kycId', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const kycId = parseInt(req.params.kycId);

      const kycRecord = await db.select()
        .from(studentKyc)
        .where(eq(studentKyc.id, kycId))
        .limit(1);

      if (kycRecord.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'KYC record not found'
        });
      }

      res.json({
        success: true,
        data: kycRecord[0]
      });
    } catch (error) {
      console.error('Error fetching KYC record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC record'
      });
    }
  });

  // Admin: Approve or reject KYC submission
  app.post('/api/admin/kyc/:kycId/review', isAuthenticated, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      const kycId = parseInt(req.params.kycId);
      const { status, comments } = req.body;
      const reviewerId = req.user.id;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "approved" or "rejected"'
        });
      }

      const result = await db.update(studentKyc)
        .set({
          status,
          reviewComments: comments,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(studentKyc.id, kycId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'KYC record not found'
        });
      }

      res.json({
        success: true,
        message: `KYC ${status} successfully`,
        data: result[0]
      });
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review KYC submission'
      });
    }
  });

  // Admin: Get all KYC submissions with filters
  app.get('/api/admin/kyc/all', isAuthenticated, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build base query
      const baseQuery = db.select({
        id: studentKyc.id,
        userId: studentKyc.userId,
        firstName: studentKyc.firstName,
        lastName: studentKyc.lastName,
        email: studentKyc.email,
        verificationStatus: studentKyc.verificationStatus,
        submittedAt: studentKyc.submittedAt,
        reviewedAt: studentKyc.reviewedAt,
        reviewComments: studentKyc.reviewComments,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName
      })
        .from(studentKyc)
        .leftJoin(users, eq(studentKyc.userId, users.id));

      // Execute query with conditional filtering
      let kycRecords;
      if (status && typeof status === 'string') {
        kycRecords = await baseQuery
          .where(eq(studentKyc.verificationStatus, status))
          .limit(Number(limit))
          .offset(offset);
      } else {
        kycRecords = await baseQuery
          .limit(Number(limit))
          .offset(offset);
      }

      res.json({
        success: true,
        data: kycRecords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: kycRecords.length
        }
      });
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC submissions'
      });
    }
  });
}
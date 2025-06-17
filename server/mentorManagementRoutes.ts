import type { Express } from "express";
import { eq, desc, and, sql, gte, lte, avg, sum, count } from "drizzle-orm";
import { db } from "./db";
import { 
  mentorPayments, 
  mentorPerformance, 
  mentorRatings, 
  mentorActivityLog, 
  mentorBankDetails,
  users,
  courses,
  courseEnrollments,
  lessonProgress,
  insertMentorPaymentSchema,
  insertMentorPerformanceSchema,
  insertMentorRatingSchema,
  insertMentorActivityLogSchema,
  insertMentorBankDetailsSchema
} from "@shared/schema";

export function registerMentorManagementRoutes(app: Express) {
  
  // ===============================
  // MENTOR PAYMENT MANAGEMENT
  // ===============================
  
  // Get all mentor payments with filters
  app.get("/api/admin/mentor-payments", async (req, res) => {
    try {
      const { mentorId, status, fromDate, toDate, page = 1, limit = 20 } = req.query;
      
      let query = db.select({
        payment: mentorPayments,
        mentor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(mentorPayments)
      .leftJoin(users, eq(mentorPayments.mentorId, users.id))
      .orderBy(desc(mentorPayments.createdAt));

      // Apply filters
      const conditions = [];
      if (mentorId) conditions.push(eq(mentorPayments.mentorId, mentorId as string));
      if (status) conditions.push(eq(mentorPayments.status, status as string));
      if (fromDate) conditions.push(gte(mentorPayments.createdAt, new Date(fromDate as string)));
      if (toDate) conditions.push(lte(mentorPayments.createdAt, new Date(toDate as string)));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const offset = (Number(page) - 1) * Number(limit);
      const payments = await query.limit(Number(limit)).offset(offset);

      // Get total count for pagination
      const totalQuery = db.select({ count: count() }).from(mentorPayments);
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await totalQuery;

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching mentor payments:", error);
      res.status(500).json({ error: "Failed to fetch mentor payments" });
    }
  });

  // Get mentor payment summary
  app.get("/api/admin/mentor-payment-summary", async (req, res) => {
    try {
      const { mentorId, year, month } = req.query;
      
      const conditions = [];
      if (mentorId) conditions.push(eq(mentorPayments.mentorId, mentorId as string));
      if (year) {
        const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
        const endDate = month 
          ? new Date(Number(year), Number(month), 0)
          : new Date(Number(year) + 1, 0, 0);
        conditions.push(gte(mentorPayments.createdAt, startDate));
        conditions.push(lte(mentorPayments.createdAt, endDate));
      }

      let query = db.select({
        totalEarnings: sum(mentorPayments.amount),
        pendingAmount: sum(sql`CASE WHEN ${mentorPayments.status} = 'pending' THEN ${mentorPayments.amount} ELSE 0 END`),
        paidAmount: sum(sql`CASE WHEN ${mentorPayments.status} = 'paid' THEN ${mentorPayments.amount} ELSE 0 END`),
        totalTransactions: count(mentorPayments.id),
        courseCommissions: sum(sql`CASE WHEN ${mentorPayments.commissionType} = 'course' THEN ${mentorPayments.amount} ELSE 0 END`),
        sessionCommissions: sum(sql`CASE WHEN ${mentorPayments.commissionType} = 'live_session' THEN ${mentorPayments.amount} ELSE 0 END`),
        gradingCommissions: sum(sql`CASE WHEN ${mentorPayments.commissionType} = 'assignment_grading' THEN ${mentorPayments.amount} ELSE 0 END`)
      }).from(mentorPayments);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const [summary] = await query;
      res.json(summary);
    } catch (error) {
      console.error("Error fetching payment summary:", error);
      res.status(500).json({ error: "Failed to fetch payment summary" });
    }
  });

  // Create mentor payment
  app.post("/api/admin/mentor-payments", async (req, res) => {
    try {
      const paymentData = insertMentorPaymentSchema.parse(req.body);
      const [payment] = await db.insert(mentorPayments).values(paymentData).returning();
      
      // Log activity
      await db.insert(mentorActivityLog).values({
        mentorId: paymentData.mentorId,
        activityType: "payment_created",
        description: `Payment of ₦${paymentData.amount} created for ${paymentData.commissionType}`,
        metadata: { paymentId: payment.id, amount: paymentData.amount }
      });

      res.json(payment);
    } catch (error) {
      console.error("Error creating mentor payment:", error);
      res.status(500).json({ error: "Failed to create mentor payment" });
    }
  });

  // Update payment status
  app.patch("/api/admin/mentor-payments/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, transactionRef } = req.body;

      const updateData: any = { status, updatedAt: new Date() };
      if (status === "paid") {
        updateData.processedAt = new Date();
        if (transactionRef) updateData.transactionRef = transactionRef;
      }

      const [payment] = await db
        .update(mentorPayments)
        .set(updateData)
        .where(eq(mentorPayments.id, Number(id)))
        .returning();

      // Log activity
      await db.insert(mentorActivityLog).values({
        mentorId: payment.mentorId,
        activityType: "payment_updated",
        description: `Payment status updated to ${status}`,
        metadata: { paymentId: payment.id, status, transactionRef }
      });

      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  // ===============================
  // MENTOR PERFORMANCE TRACKING
  // ===============================

  // Get mentor performance data
  app.get("/api/admin/mentor-performance", async (req, res) => {
    try {
      const { mentorId, year, month, courseId } = req.query;
      
      const conditions = [];
      if (mentorId) conditions.push(eq(mentorPerformance.mentorId, mentorId as string));
      if (courseId) conditions.push(eq(mentorPerformance.courseId, Number(courseId)));
      if (year) conditions.push(eq(mentorPerformance.year, Number(year)));
      if (month) conditions.push(eq(mentorPerformance.month, Number(month)));

      let query = db.select({
        performance: mentorPerformance,
        mentor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        course: {
          id: courses.id,
          title: courses.title,
        }
      })
      .from(mentorPerformance)
      .leftJoin(users, eq(mentorPerformance.mentorId, users.id))
      .leftJoin(courses, eq(mentorPerformance.courseId, courses.id))
      .orderBy(desc(mentorPerformance.year), desc(mentorPerformance.month));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const performance = await query;
      res.json(performance);
    } catch (error) {
      console.error("Error fetching mentor performance:", error);
      res.status(500).json({ error: "Failed to fetch mentor performance" });
    }
  });

  // Calculate and update mentor performance metrics
  app.post("/api/admin/mentor-performance/calculate", async (req, res) => {
    try {
      const { mentorId, year, month } = req.body;
      
      // Get mentor's courses
      const mentorCourses = await db.select({
        courseId: courses.id,
        title: courses.title
      })
      .from(courses)
      .where(eq(courses.mentorId, mentorId));

      const performanceData = [];

      for (const course of mentorCourses) {
        // Calculate enrollments in the period
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const enrollments = await db.select({
          count: count(),
          completed: sum(sql`CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 ELSE 0 END`)
        })
        .from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.courseId, course.courseId),
          gte(courseEnrollments.enrolledAt, startDate),
          lte(courseEnrollments.enrolledAt, endDate)
        ));

        // Calculate average rating
        const ratings = await db.select({
          avgRating: avg(mentorRatings.rating)
        })
        .from(mentorRatings)
        .where(and(
          eq(mentorRatings.mentorId, mentorId),
          eq(mentorRatings.courseId, course.courseId)
        ));

        // Calculate earnings
        const earnings = await db.select({
          total: sum(mentorPayments.amount)
        })
        .from(mentorPayments)
        .where(and(
          eq(mentorPayments.mentorId, mentorId),
          eq(mentorPayments.sourceId, course.courseId),
          gte(mentorPayments.createdAt, startDate),
          lte(mentorPayments.createdAt, endDate)
        ));

        const performance = {
          mentorId,
          courseId: course.courseId,
          month,
          year,
          studentsEnrolled: enrollments[0]?.count || 0,
          studentsCompleted: enrollments[0]?.completed || 0,
          averageRating: ratings[0]?.avgRating || 0,
          totalEarnings: earnings[0]?.total || 0,
          completionRate: enrollments[0]?.count > 0 
            ? ((enrollments[0]?.completed || 0) / enrollments[0].count) * 100 
            : 0
        };

        performanceData.push(performance);
      }

      // Upsert performance data
      for (const data of performanceData) {
        await db.insert(mentorPerformance)
          .values(data)
          .onConflictDoUpdate({
            target: [mentorPerformance.mentorId, mentorPerformance.courseId, mentorPerformance.month, mentorPerformance.year],
            set: data
          });
      }

      res.json({ message: "Performance metrics calculated successfully", data: performanceData });
    } catch (error) {
      console.error("Error calculating performance:", error);
      res.status(500).json({ error: "Failed to calculate performance metrics" });
    }
  });

  // ===============================
  // MENTOR RATINGS MANAGEMENT
  // ===============================

  // Get mentor ratings
  app.get("/api/admin/mentor-ratings", async (req, res) => {
    try {
      const { mentorId, courseId, rating, page = 1, limit = 20 } = req.query;
      
      const conditions = [];
      if (mentorId) conditions.push(eq(mentorRatings.mentorId, mentorId as string));
      if (courseId) conditions.push(eq(mentorRatings.courseId, Number(courseId)));
      if (rating) conditions.push(eq(mentorRatings.rating, Number(rating)));

      let query = db.select({
        rating: mentorRatings,
        mentor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        course: {
          id: courses.id,
          title: courses.title,
        }
      })
      .from(mentorRatings)
      .leftJoin(users, eq(mentorRatings.mentorId, users.id))
      .leftJoin(users as any, eq(mentorRatings.studentId, users.id))
      .leftJoin(courses, eq(mentorRatings.courseId, courses.id))
      .orderBy(desc(mentorRatings.createdAt));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const offset = (Number(page) - 1) * Number(limit);
      const ratings = await query.limit(Number(limit)).offset(offset);

      res.json(ratings);
    } catch (error) {
      console.error("Error fetching mentor ratings:", error);
      res.status(500).json({ error: "Failed to fetch mentor ratings" });
    }
  });

  // Get mentor rating summary
  app.get("/api/admin/mentor-ratings/summary/:mentorId", async (req, res) => {
    try {
      const { mentorId } = req.params;
      
      const summary = await db.select({
        totalRatings: count(mentorRatings.id),
        averageRating: avg(mentorRatings.rating),
        fiveStars: sum(sql`CASE WHEN ${mentorRatings.rating} = 5 THEN 1 ELSE 0 END`),
        fourStars: sum(sql`CASE WHEN ${mentorRatings.rating} = 4 THEN 1 ELSE 0 END`),
        threeStars: sum(sql`CASE WHEN ${mentorRatings.rating} = 3 THEN 1 ELSE 0 END`),
        twoStars: sum(sql`CASE WHEN ${mentorRatings.rating} = 2 THEN 1 ELSE 0 END`),
        oneStar: sum(sql`CASE WHEN ${mentorRatings.rating} = 1 THEN 1 ELSE 0 END`)
      })
      .from(mentorRatings)
      .where(eq(mentorRatings.mentorId, mentorId));

      res.json(summary[0]);
    } catch (error) {
      console.error("Error fetching rating summary:", error);
      res.status(500).json({ error: "Failed to fetch rating summary" });
    }
  });

  // Update rating status (hide/flag)
  app.patch("/api/admin/mentor-ratings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [rating] = await db
        .update(mentorRatings)
        .set({ status, updatedAt: new Date() })
        .where(eq(mentorRatings.id, Number(id)))
        .returning();

      res.json(rating);
    } catch (error) {
      console.error("Error updating rating status:", error);
      res.status(500).json({ error: "Failed to update rating status" });
    }
  });

  // ===============================
  // MENTOR ACTIVITY TRACKING
  // ===============================

  // Get mentor activity log
  app.get("/api/admin/mentor-activity", async (req, res) => {
    try {
      const { mentorId, activityType, fromDate, toDate, page = 1, limit = 50 } = req.query;
      
      const conditions = [];
      if (mentorId) conditions.push(eq(mentorActivityLog.mentorId, mentorId as string));
      if (activityType) conditions.push(eq(mentorActivityLog.activityType, activityType as string));
      if (fromDate) conditions.push(gte(mentorActivityLog.createdAt, new Date(fromDate as string)));
      if (toDate) conditions.push(lte(mentorActivityLog.createdAt, new Date(toDate as string)));

      let query = db.select({
        activity: mentorActivityLog,
        mentor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(mentorActivityLog)
      .leftJoin(users, eq(mentorActivityLog.mentorId, users.id))
      .orderBy(desc(mentorActivityLog.createdAt));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const offset = (Number(page) - 1) * Number(limit);
      const activities = await query.limit(Number(limit)).offset(offset);

      res.json(activities);
    } catch (error) {
      console.error("Error fetching mentor activity:", error);
      res.status(500).json({ error: "Failed to fetch mentor activity" });
    }
  });

  // Log mentor activity
  app.post("/api/mentor-activity", async (req, res) => {
    try {
      const activityData = insertMentorActivityLogSchema.parse(req.body);
      const [activity] = await db.insert(mentorActivityLog).values(activityData).returning();
      res.json(activity);
    } catch (error) {
      console.error("Error logging mentor activity:", error);
      res.status(500).json({ error: "Failed to log mentor activity" });
    }
  });

  // ===============================
  // MENTOR BANK DETAILS MANAGEMENT
  // ===============================

  // Get mentor bank details
  app.get("/api/mentor-bank-details/:mentorId", async (req, res) => {
    try {
      const { mentorId } = req.params;
      
      const bankDetails = await db.select()
        .from(mentorBankDetails)
        .where(eq(mentorBankDetails.mentorId, mentorId))
        .orderBy(desc(mentorBankDetails.isDefault), desc(mentorBankDetails.createdAt));

      res.json(bankDetails);
    } catch (error) {
      console.error("Error fetching bank details:", error);
      res.status(500).json({ error: "Failed to fetch bank details" });
    }
  });

  // Add/Update mentor bank details
  app.post("/api/mentor-bank-details", async (req, res) => {
    try {
      const bankData = insertMentorBankDetailsSchema.parse(req.body);
      
      // If this is set as default, unset other defaults
      if (bankData.isDefault) {
        await db.update(mentorBankDetails)
          .set({ isDefault: false })
          .where(eq(mentorBankDetails.mentorId, bankData.mentorId));
      }

      const [bankDetail] = await db.insert(mentorBankDetails).values(bankData).returning();
      
      // Log activity
      await db.insert(mentorActivityLog).values({
        mentorId: bankData.mentorId,
        activityType: "bank_details_updated",
        description: `Bank details updated: ${bankData.bankName} - ${bankData.accountNumber}`,
        metadata: { bankId: bankDetail.id }
      });

      res.json(bankDetail);
    } catch (error) {
      console.error("Error saving bank details:", error);
      res.status(500).json({ error: "Failed to save bank details" });
    }
  });

  // Verify bank account
  app.patch("/api/mentor-bank-details/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [bankDetail] = await db
        .update(mentorBankDetails)
        .set({ isVerified: true, verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(mentorBankDetails.id, Number(id)))
        .returning();

      // Log activity
      await db.insert(mentorActivityLog).values({
        mentorId: bankDetail.mentorId,
        activityType: "bank_account_verified",
        description: `Bank account verified: ${bankDetail.bankName} - ${bankDetail.accountNumber}`,
        metadata: { bankId: bankDetail.id }
      });

      res.json(bankDetail);
    } catch (error) {
      console.error("Error verifying bank account:", error);
      res.status(500).json({ error: "Failed to verify bank account" });
    }
  });

  // ===============================
  // MENTOR DASHBOARD ANALYTICS
  // ===============================

  // Get comprehensive mentor dashboard data
  app.get("/api/mentor-dashboard/:mentorId", async (req, res) => {
    try {
      const { mentorId } = req.params;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get performance metrics for current month
      const performance = await db.select()
        .from(mentorPerformance)
        .where(and(
          eq(mentorPerformance.mentorId, mentorId),
          eq(mentorPerformance.month, currentMonth),
          eq(mentorPerformance.year, currentYear)
        ));

      // Get total earnings
      const earnings = await db.select({
        total: sum(mentorPayments.amount),
        pending: sum(sql`CASE WHEN ${mentorPayments.status} = 'pending' THEN ${mentorPayments.amount} ELSE 0 END`),
        paid: sum(sql`CASE WHEN ${mentorPayments.status} = 'paid' THEN ${mentorPayments.amount} ELSE 0 END`)
      })
      .from(mentorPayments)
      .where(eq(mentorPayments.mentorId, mentorId));

      // Get rating summary
      const ratings = await db.select({
        average: avg(mentorRatings.rating),
        total: count(mentorRatings.id)
      })
      .from(mentorRatings)
      .where(eq(mentorRatings.mentorId, mentorId));

      // Get recent activities
      const activities = await db.select()
        .from(mentorActivityLog)
        .where(eq(mentorActivityLog.mentorId, mentorId))
        .orderBy(desc(mentorActivityLog.createdAt))
        .limit(10);

      // Get mentor courses
      const mentorCourses = await db.select({
        course: courses,
        enrollments: count(courseEnrollments.id)
      })
      .from(courses)
      .leftJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .where(eq(courses.mentorId, mentorId))
      .groupBy(courses.id);

      res.json({
        performance: performance[0] || null,
        earnings: earnings[0],
        ratings: ratings[0],
        activities,
        courses: mentorCourses
      });
    } catch (error) {
      console.error("Error fetching mentor dashboard:", error);
      res.status(500).json({ error: "Failed to fetch mentor dashboard data" });
    }
  });
}
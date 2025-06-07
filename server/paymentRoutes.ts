import { Express } from "express";
import { isAuthenticated } from "./auth";
import { initializePayment, verifyPayment, listTransactions } from "./paystack";
import { storage } from "./storage";
import { generateInvoicePDF } from "./invoiceService";

export function registerPaymentRoutes(app: Express) {
  // Initialize payment for course enrollment
  app.post("/api/payments/initialize", isAuthenticated, async (req: any, res) => {
    try {
      const { courseId, amount, callbackUrl } = req.body;
      const userId = req.user?.id || req.user?.claims?.sub;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(400).json({ message: "User information not found" });
      }

      if (!courseId || !amount) {
        return res.status(400).json({ message: "Course ID and amount are required" });
      }

      // Check if user is already enrolled
      const existingEnrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }

      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Generate unique reference
      const reference = `CE_${courseId}_${userId}_${Date.now()}`;

      // Initialize payment with Paystack
      const paymentData = await initializePayment({
        email: userEmail,
        amount: amount,
        reference,
        callbackUrl,
        metadata: {
          courseId,
          userId,
          courseTitle: course.title,
          type: "course_enrollment"
        }
      });

      // Store payment record
      await storage.createPaymentRecord({
        reference: paymentData.reference,
        userId,
        courseId,
        amount,
        status: "pending",
        paymentMethod: "paystack",
        metadata: {
          access_code: paymentData.access_code,
          authorization_url: paymentData.authorization_url
        }
      });

      res.json(paymentData);
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ message: error.message || "Failed to initialize payment" });
    }
  });

  // Handle payment callback/verification
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      // Verify payment with Paystack
      const paymentData = await verifyPayment(reference);
      
      if (paymentData.status !== "success") {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      // Get payment record
      const paymentRecord = await storage.getPaymentByReference(reference);
      if (!paymentRecord) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Update payment status
      await storage.updatePaymentStatus(reference, "completed", paymentData);

      // Enroll user in course
      const enrollment = await storage.createEnrollment({
        userId: paymentRecord.userId,
        courseId: paymentRecord.courseId,
        progress: 0,
        paymentStatus: "completed",
        paymentMethod: "paystack",
        paymentAmount: paymentRecord.amount,
        paymentReference: reference,
        paymentProvider: "paystack",
        completedAt: null,
        certificateId: null
      });

      // Generate invoice
      const invoice = await generateInvoicePDF({
        userId: paymentRecord.userId,
        courseId: paymentRecord.courseId,
        amount: paymentRecord.amount,
        paymentReference: reference,
        paymentDate: new Date()
      });

      res.json({
        message: "Payment verified and enrollment completed",
        enrollment,
        invoice: invoice.invoiceNumber
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // Get payment callback page
  app.get("/payment/callback", async (req, res) => {
    const { reference, trxref } = req.query;
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      return res.redirect("/?payment=failed");
    }

    try {
      // Verify payment
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: paymentReference })
      });

      if (response.ok) {
        return res.redirect("/?payment=success");
      } else {
        return res.redirect("/?payment=failed");
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      return res.redirect("/?payment=failed");
    }
  });

  // Get user's payment history
  app.get("/api/payments/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(400).json({ message: "User information not found" });
      }

      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error: any) {
      console.error("Payment history error:", error);
      res.status(500).json({ message: error.message || "Failed to get payment history" });
    }
  });

  // Download invoice
  app.get("/api/payments/invoice/:invoiceNumber", isAuthenticated, async (req: any, res) => {
    try {
      const { invoiceNumber } = req.params;
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(400).json({ message: "User information not found" });
      }

      // Get invoice data
      const invoice = await storage.getInvoiceByNumber(invoiceNumber);
      
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF({
        userId: invoice.userId,
        courseId: invoice.courseId,
        amount: invoice.amount,
        paymentReference: invoice.paymentReference,
        paymentDate: invoice.paymentDate,
        invoiceNumber: invoice.invoiceNumber
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
      res.send(pdfBuffer.buffer);
    } catch (error: any) {
      console.error("Invoice download error:", error);
      res.status(500).json({ message: error.message || "Failed to download invoice" });
    }
  });

  // Get payment statistics (admin only)
  app.get("/api/payments/stats", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Payment stats error:", error);
      res.status(500).json({ message: error.message || "Failed to get payment statistics" });
    }
  });
}
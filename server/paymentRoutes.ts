import { Express } from "express";
import { isAuthenticated } from "./auth";
import { initializePayment, verifyPayment, listTransactions } from "./paystack";
import { storage } from "./storage";
import { generateInvoicePDF, generateReceiptPDF } from "./invoiceService";

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

      // Store payment transaction record
      await storage.createPaymentTransaction({
        userId,
        courseId,
        reference: paymentData.reference,
        amount,
        currency: "NGN",
        status: "pending",
        provider: "paystack",
        providerReference: paymentData.reference,
        providerResponse: paymentData,
        fees: 0,
        netAmount: amount,
        gateway: "paystack",
        channel: "card"
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
      
      if (!paymentData.status || paymentData.data?.status !== "success") {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      // Get payment transaction record
      const paymentRecord = await storage.getPaymentTransactionByReference(reference);
      if (!paymentRecord) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Update payment transaction status
      const transactionData = paymentData.data;
      await storage.updatePaymentTransactionStatus(reference, "success", {
        providerResponse: paymentData,
        fees: transactionData?.fees || 0,
        netAmount: (transactionData?.amount || 0) - (transactionData?.fees || 0),
        channel: transactionData?.channel || "card"
      });

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

  // Download receipt for a payment transaction
  app.get("/api/payments/:reference/receipt", isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(400).json({ message: "User information not found" });
      }

      // Check if user is admin or owns the payment
      const isAdmin = req.user?.role === "admin";
      
      if (!isAdmin) {
        // For non-admin users, verify they own this payment
        const payment = await storage.getPaymentByReference(reference);
        if (!payment || payment.userId !== userId) {
          return res.status(404).json({ message: "Payment not found" });
        }
      }

      // Get payment details for receipt
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const user = await storage.getUser(payment.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate simple text receipt
      const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      const receiptText = `
===============================================
            CODELAB EDUCARE
         PAYMENT RECEIPT
===============================================

Receipt Number: ${payment.reference}
Date: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}
Status: ${payment.status.toUpperCase()}

-----------------------------------------------
CUSTOMER DETAILS
-----------------------------------------------
Name: ${customerName}
Email: ${user.email}
Customer ID: ${user.id}

-----------------------------------------------
PAYMENT INFORMATION
-----------------------------------------------
Amount: ₦${Number(payment.amount).toLocaleString()}
Payment Method: ${payment.channel || 'Online Payment'}
Provider: ${payment.provider || 'Paystack'}
Reference: ${payment.providerReference || payment.reference}

-----------------------------------------------
TOTAL PAID: ₦${Number(payment.amount).toLocaleString()}
-----------------------------------------------

Thank you for your payment!
This is a computer-generated receipt.

Generated: ${new Date().toLocaleString('en-GB')}
===============================================
      `;

      // Set headers for text download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${reference}.txt"`);
      res.setHeader('Content-Length', Buffer.byteLength(receiptText, 'utf8').toString());
      
      res.send(receiptText);
    } catch (error: any) {
      console.error("Receipt download error:", error);
      res.status(500).json({ message: error.message || "Failed to download receipt" });
    }
  });

  // Process refund for a payment (admin only)
  app.post("/api/payments/:reference/refund", isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      const { amount, reason } = req.body;

      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get payment details
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status !== 'success') {
        return res.status(400).json({ message: "Only successful payments can be refunded" });
      }

      // For demo purposes, we'll just update the payment status
      // In a real implementation, you would integrate with the payment provider's refund API
      await storage.updatePaymentStatus(reference, 'refunded');

      res.json({ 
        success: true, 
        message: "Refund initiated successfully",
        refundAmount: amount 
      });
    } catch (error: any) {
      console.error("Refund processing error:", error);
      res.status(500).json({ message: error.message || "Failed to process refund" });
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
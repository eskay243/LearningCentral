import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { insertInvoiceSchema, insertPaymentTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { initializePayment, verifyPayment } from "./paystack";

export function registerInvoiceRoutes(app: Express) {
  // Create invoice for course enrollment
  app.post("/api/invoices/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId, amount, description, lineItems, taxAmount = 0, discountAmount = 0 } = req.body;

      // Validate required fields
      if (!courseId || !amount || !description) {
        return res.status(400).json({ 
          message: "Missing required fields: courseId, amount, description" 
        });
      }

      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user is already enrolled
      const existingEnrollment = await storage.getUserEnrollments(userId);
      const isAlreadyEnrolled = existingEnrollment.some(enrollment => enrollment.courseId === courseId);
      
      if (isAlreadyEnrolled) {
        return res.status(400).json({ message: "User is already enrolled in this course" });
      }

      // Create due date (7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Create invoice
      const invoiceData = {
        userId,
        courseId,
        amount: parseFloat(amount),
        currency: "NGN",
        status: "pending",
        dueDate,
        description,
        lineItems: lineItems || [{
          description: `Course: ${course.title}`,
          amount: parseFloat(amount),
          quantity: 1
        }],
        taxAmount: parseFloat(taxAmount),
        discountAmount: parseFloat(discountAmount),
        metadata: {
          courseId,
          courseName: course.title,
          userId
        }
      };

      const invoice = await storage.createInvoice(invoiceData);

      res.status(201).json({
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          dueDate: invoice.dueDate,
          description: invoice.description,
          lineItems: invoice.lineItems,
          courseName: course.title
        }
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get user invoices
  app.get("/api/invoices/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoices = await storage.getUserInvoices(userId);

      const invoicesWithCourseInfo = await Promise.all(
        invoices.map(async (invoice) => {
          let courseName = "N/A";
          if (invoice.courseId) {
            const course = await storage.getCourse(invoice.courseId);
            courseName = course?.title || "Unknown Course";
          }

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            currency: invoice.currency,
            status: invoice.status,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            description: invoice.description,
            lineItems: invoice.lineItems,
            courseName,
            createdAt: invoice.createdAt
          };
        })
      );

      res.json({
        success: true,
        invoices: invoicesWithCourseInfo
      });
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get specific invoice
  app.get("/api/invoices/:invoiceId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.invoiceId);

      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if user owns this invoice
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      let courseName = "N/A";
      if (invoice.courseId) {
        const course = await storage.getCourse(invoice.courseId);
        courseName = course?.title || "Unknown Course";
      }

      res.json({
        success: true,
        invoice: {
          ...invoice,
          courseName
        }
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Initialize payment for invoice
  app.post("/api/invoices/:invoiceId/pay", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.invoiceId);
      const { email, metadata } = req.body;

      // Get invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if user owns this invoice
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if invoice is already paid
      if (invoice.status === "paid") {
        return res.status(400).json({ message: "Invoice is already paid" });
      }

      // Check if invoice is expired
      if (new Date() > new Date(invoice.dueDate)) {
        return res.status(400).json({ message: "Invoice has expired" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      const userEmail = email || user?.email;

      if (!userEmail) {
        return res.status(400).json({ message: "Email is required for payment" });
      }

      // Generate unique reference
      const reference = `inv_${invoice.invoiceNumber}_${Date.now()}`;

      // Initialize Paystack payment
      const paymentData = {
        email: userEmail,
        amount: Math.round(invoice.amount * 100), // Convert to kobo
        reference,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          userId,
          courseId: invoice.courseId,
          ...metadata
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/callback`,
        channels: ['card', 'bank', 'ussd', 'qr', 'bank_transfer']
      };

      const paymentResponse = await paystackApi.initializeTransaction(paymentData);

      if (!paymentResponse.status) {
        return res.status(400).json({ 
          message: "Failed to initialize payment", 
          error: paymentResponse.message 
        });
      }

      // Create payment transaction record
      const transactionData = {
        invoiceId: invoice.id,
        userId,
        reference,
        amount: invoice.amount,
        currency: invoice.currency,
        status: "pending",
        provider: "paystack",
        providerReference: paymentResponse.data.reference,
        providerResponse: paymentResponse.data,
        gateway: "paystack",
        channel: "online"
      };

      await storage.createPaymentTransaction(transactionData);

      res.json({
        success: true,
        paymentUrl: paymentResponse.data.authorization_url,
        reference: paymentResponse.data.reference,
        accessCode: paymentResponse.data.access_code
      });
    } catch (error) {
      console.error("Error initializing invoice payment:", error);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  // Verify invoice payment
  app.post("/api/invoices/verify-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      // Get payment transaction
      const transaction = await storage.getPaymentTransactionByReference(reference);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Verify with Paystack
      const verification = await paystackApi.verifyTransaction(reference);

      if (!verification.status) {
        await storage.updatePaymentTransaction(transaction.id, {
          status: "failed",
          providerResponse: verification
        });

        return res.status(400).json({ 
          message: "Payment verification failed", 
          error: verification.message 
        });
      }

      const paymentData = verification.data;

      // Update transaction
      await storage.updatePaymentTransaction(transaction.id, {
        status: paymentData.status === "success" ? "success" : "failed",
        providerResponse: paymentData,
        fees: paymentData.fees ? paymentData.fees / 100 : 0,
        netAmount: paymentData.amount ? (paymentData.amount - (paymentData.fees || 0)) / 100 : 0,
        channel: paymentData.channel
      });

      if (paymentData.status === "success") {
        // Update invoice status
        const invoice = await storage.updateInvoiceStatus(
          transaction.invoiceId!, 
          "paid", 
          new Date()
        );

        // Enroll user in course if applicable
        if (invoice.courseId) {
          try {
            await storage.enrollUserInCourse(transaction.userId, invoice.courseId);
          } catch (enrollError) {
            console.error("Error enrolling user in course:", enrollError);
            // Continue even if enrollment fails
          }
        }

        res.json({
          success: true,
          message: "Payment verified successfully",
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            paidAt: invoice.paidAt
          },
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            amount: paymentData.amount / 100,
            status: paymentData.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment was not successful",
          status: paymentData.status
        });
      }
    } catch (error) {
      console.error("Error verifying invoice payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Get payment transactions for user
  app.get("/api/transactions/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserPaymentTransactions(userId);

      const transactionsWithInvoiceInfo = await Promise.all(
        transactions.map(async (transaction) => {
          let invoiceInfo = null;
          if (transaction.invoiceId) {
            const invoice = await storage.getInvoice(transaction.invoiceId);
            if (invoice) {
              let courseName = "N/A";
              if (invoice.courseId) {
                const course = await storage.getCourse(invoice.courseId);
                courseName = course?.title || "Unknown Course";
              }
              invoiceInfo = {
                invoiceNumber: invoice.invoiceNumber,
                description: invoice.description,
                courseName
              };
            }
          }

          return {
            id: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            provider: transaction.provider,
            channel: transaction.channel,
            fees: transaction.fees,
            netAmount: transaction.netAmount,
            createdAt: transaction.createdAt,
            invoice: invoiceInfo
          };
        })
      );

      res.json({
        success: true,
        transactions: transactionsWithInvoiceInfo
      });
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
}
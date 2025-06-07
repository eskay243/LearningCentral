import { storage } from "./storage";
import jsPDF from "jspdf";

interface InvoiceData {
  userId: string;
  courseId: number;
  amount: number;
  paymentReference: string;
  paymentDate: Date;
  invoiceNumber?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<{ buffer: Buffer; invoiceNumber: string }> {
  try {
    // Generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || await storage.generateInvoiceNumber();
    
    // Get user and course details
    const user = await storage.getUser(data.userId);
    const course = await storage.getCourse(data.courseId);
    
    if (!user || !course) {
      throw new Error("User or course not found");
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 30, { align: "center" });
    
    // Company details
    doc.setFontSize(12);
    doc.text("Codelab Educare", 20, 50);
    doc.text("Learning Management System", 20, 60);
    
    // Invoice details
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 80);
    doc.text(`Date: ${data.paymentDate.toLocaleDateString()}`, 20, 90);
    doc.text(`Payment Reference: ${data.paymentReference}`, 20, 100);
    
    // Customer details
    doc.text("Bill To:", 20, 120);
    doc.text(`${user.firstName || ''} ${user.lastName || ''}`, 20, 130);
    doc.text(`${user.email}`, 20, 140);
    
    // Course details
    doc.text("Course Details:", 20, 160);
    doc.text(`Course: ${course.title}`, 20, 170);
    doc.text(`Amount: ₦${data.amount.toLocaleString()}`, 20, 180);
    
    // Total
    doc.setFontSize(14);
    doc.text(`Total Amount: ₦${data.amount.toLocaleString()}`, 20, 200);
    
    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your enrollment!", 105, 250, { align: "center" });
    doc.text("This is a computer-generated invoice.", 105, 260, { align: "center" });
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Create invoice record in database
    await storage.createInvoice({
      invoiceNumber,
      userId: data.userId,
      courseId: data.courseId,
      amount: data.amount,
      currency: "NGN",
      status: "paid",
      dueDate: data.paymentDate,
      paidAt: data.paymentDate,
      paymentReference: data.paymentReference,
      paymentMethod: "paystack",
      description: `Course enrollment: ${course.title}`,
      lineItems: [{
        description: course.title,
        quantity: 1,
        unitPrice: data.amount,
        total: data.amount
      }],
      taxAmount: 0,
      discountAmount: 0
    });
    
    return { buffer: pdfBuffer, invoiceNumber };
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw new Error("Failed to generate invoice");
  }
}

export async function generateReceiptPDF(paymentReference: string): Promise<Buffer> {
  try {
    // Get payment details
    const payment = await storage.getPaymentByReference(paymentReference);
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // Get user details
    const user = await storage.getUser(payment.userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("PAYMENT RECEIPT", 105, 30, { align: "center" });
    
    // Company details
    doc.setFontSize(12);
    doc.text("Codelab Educare", 20, 50);
    doc.text("Learning Management System", 20, 60);
    
    // Receipt details
    doc.text(`Receipt #: ${payment.reference}`, 20, 80);
    doc.text(`Date: ${payment.createdAt.toLocaleDateString()}`, 20, 90);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 100);
    
    // Customer details
    doc.text("Paid By:", 20, 120);
    doc.text(`${user.firstName || ''} ${user.lastName || ''}`, 20, 130);
    doc.text(`${user.email}`, 20, 140);
    
    // Payment details
    doc.text("Payment Details:", 20, 160);
    doc.text(`Amount: ₦${payment.amount.toLocaleString()}`, 20, 170);
    doc.text(`Channel: ${payment.channel || 'Online'}`, 20, 180);
    doc.text(`Provider: ${payment.provider}`, 20, 190);
    
    // Total
    doc.setFontSize(14);
    doc.text(`Amount Paid: ₦${payment.amount.toLocaleString()}`, 20, 210);
    
    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your payment!", 105, 250, { align: "center" });
    doc.text("This is a computer-generated receipt.", 105, 260, { align: "center" });
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error("Failed to generate receipt");
  }
}
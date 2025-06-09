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
    
    // Create PDF document with specific settings for better compatibility
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Set document metadata
    doc.setProperties({
      title: `Receipt-${payment.reference}`,
      subject: 'Payment Receipt',
      author: 'Codelab Educare',
      creator: 'Codelab Educare LMS'
    });
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("PAYMENT RECEIPT", 105, 30, { align: "center" });
    
    // Company details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Codelab Educare", 20, 50);
    doc.text("Learning Management System", 20, 60);
    doc.text("Lagos, Nigeria", 20, 70);
    
    // Receipt details section
    doc.setFont('helvetica', 'bold');
    doc.text("Receipt Details:", 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt #: ${payment.reference}`, 20, 100);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}`, 20, 110);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 120);
    
    // Customer details section
    doc.setFont('helvetica', 'bold');
    doc.text("Customer Details:", 20, 140);
    doc.setFont('helvetica', 'normal');
    const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
    doc.text(`Name: ${customerName}`, 20, 150);
    doc.text(`Email: ${user.email}`, 20, 160);
    
    // Payment details section
    doc.setFont('helvetica', 'bold');
    doc.text("Payment Information:", 20, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount: ₦${Number(payment.amount).toLocaleString()}`, 20, 190);
    doc.text(`Payment Method: ${payment.channel || 'Online'}`, 20, 200);
    doc.text(`Provider: ${payment.provider || 'Paystack'}`, 20, 210);
    doc.text(`Transaction ID: ${payment.providerReference || payment.reference}`, 20, 220);
    
    // Total amount (highlighted)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total Amount Paid: ₦${Number(payment.amount).toLocaleString()}`, 20, 240);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Thank you for your payment!", 105, 270, { align: "center" });
    doc.text("This is a computer-generated receipt and does not require a signature.", 105, 280, { align: "center" });
    
    // Generate timestamp for the PDF
    const timestamp = new Date().toISOString();
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 20, 290);
    
    // Convert to buffer using binary string method for better compatibility
    const pdfOutput = doc.output('datauristring');
    const base64Data = pdfOutput.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error("Failed to generate receipt");
  }
}
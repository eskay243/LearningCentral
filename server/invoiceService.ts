import jsPDF from 'jspdf';
import { storage } from './storage';

interface InvoiceData {
  userId: string;
  courseId: number;
  amount: number;
  paymentReference: string;
  paymentDate: Date;
  invoiceNumber?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<{ buffer: Buffer; invoiceNumber: string }> {
  const { userId, courseId, amount, paymentReference, paymentDate } = data;
  
  // Generate invoice number if not provided
  const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Get user and course details
  const [user, course] = await Promise.all([
    storage.getUser(userId),
    storage.getCourse(courseId)
  ]);

  if (!user || !course) {
    throw new Error('User or course not found');
  }

  // Create PDF document
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(24);
  doc.setTextColor(128, 90, 213); // Purple color
  doc.text('Codelab Educare', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Learning Management System', 20, 40);
  doc.text('Lagos, Nigeria', 20, 48);
  doc.text('support@codelabeducare.com', 20, 56);
  
  // Invoice title
  doc.setFontSize(20);
  doc.text('INVOICE', 150, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNumber}`, 150, 45);
  doc.text(`Date: ${paymentDate.toLocaleDateString('en-NG')}`, 150, 52);
  doc.text(`Payment Ref: ${paymentReference}`, 150, 59);
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 70, 190, 70);
  
  // Bill to section
  doc.setFontSize(14);
  doc.text('Bill To:', 20, 85);
  
  doc.setFontSize(10);
  doc.text(`${user.firstName} ${user.lastName}`, 20, 95);
  doc.text(`${user.email}`, 20, 102);
  
  // Course details table
  doc.setFontSize(12);
  doc.text('Course Details:', 20, 120);
  
  // Table headers
  doc.setFillColor(248, 249, 250);
  doc.rect(20, 130, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.text('Description', 25, 137);
  doc.text('Amount', 155, 137);
  
  // Table content
  doc.text(course.title, 25, 150);
  doc.text(`₦${amount.toLocaleString('en-NG')}`, 155, 150);
  
  // Subtotal section
  doc.setLineWidth(0.2);
  doc.line(130, 165, 190, 165);
  
  doc.text('Subtotal:', 130, 175);
  doc.text(`₦${amount.toLocaleString('en-NG')}`, 155, 175);
  
  doc.text('Tax (0%):', 130, 182);
  doc.text('₦0.00', 155, 182);
  
  doc.setLineWidth(0.5);
  doc.line(130, 190, 190, 190);
  
  doc.setFontSize(12);
  doc.text('Total:', 130, 200);
  doc.text(`₦${amount.toLocaleString('en-NG')}`, 155, 200);
  
  // Payment status
  doc.setFillColor(220, 252, 231);
  doc.rect(20, 215, 170, 15, 'F');
  
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(10);
  doc.text('✓ PAID', 25, 225);
  doc.setTextColor(0, 0, 0);
  doc.text(`Payment completed on ${paymentDate.toLocaleDateString('en-NG')} via Paystack`, 45, 225);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing Codelab Educare!', 20, 260);
  doc.text('For support, contact us at support@codelabeducare.com', 20, 267);
  
  // Generate PDF buffer
  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);
  
  // Store invoice record
  await storage.createInvoice({
    invoiceNumber,
    userId,
    courseId,
    amount,
    paymentReference,
    paymentDate,
    status: 'paid'
  });
  
  return { buffer, invoiceNumber };
}

export async function generateReceiptPDF(paymentReference: string): Promise<Buffer> {
  // Get payment details
  const payment = await storage.getPaymentByReference(paymentReference);
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Generate invoice PDF (receipt is same format)
  const { buffer } = await generateInvoicePDF({
    userId: payment.userId,
    courseId: payment.courseId,
    amount: payment.amount,
    paymentReference: payment.reference,
    paymentDate: payment.createdAt || new Date()
  });
  
  return buffer;
}
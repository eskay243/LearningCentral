import { storage } from "./storage";
import PDFDocument from "pdfkit";

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
    
    // Create PDF document using PDFKit for better compatibility
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header with company branding
      doc.fontSize(24)
         .fillColor('#800080')
         .text('CODELAB EDUCARE', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#000000')
         .text('Payment Receipt', { align: 'center' })
         .moveDown(2);

      // Receipt information
      doc.fontSize(12)
         .text(`Receipt #: ${payment.reference}`, 50, doc.y)
         .text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}`, 350, doc.y - 12)
         .text(`Status: ${payment.status.toUpperCase()}`, 350, doc.y)
         .moveDown(2);

      // Customer Information Section
      doc.fontSize(14)
         .fillColor('#800080')
         .text('Customer Information', 50, doc.y)
         .moveDown(0.5);
      
      const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`Name: ${customerName}`, 50, doc.y)
         .text(`Email: ${user.email}`, 50, doc.y + 15)
         .moveDown(2);

      // Payment Details Section
      doc.fontSize(14)
         .fillColor('#800080')
         .text('Payment Details', 50, doc.y)
         .moveDown(0.5);
      
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`Amount: ₦${Number(payment.amount).toLocaleString()}`, 50, doc.y)
         .text(`Payment Method: ${payment.channel || 'Online'}`, 50, doc.y + 15)
         .text(`Provider: ${payment.provider || 'Paystack'}`, 50, doc.y + 30)
         .text(`Transaction ID: ${payment.providerReference || payment.reference}`, 50, doc.y + 45)
         .moveDown(2);

      // Total amount highlighted
      doc.fontSize(14)
         .fillColor('#800080')
         .text(`Total Amount Paid: ₦${Number(payment.amount).toLocaleString()}`, 50, doc.y)
         .moveDown(3);

      // Footer
      doc.fontSize(10)
         .fillColor('#808080')
         .text('Thank you for your payment!', { align: 'center' })
         .text('This is a computer-generated receipt and does not require a signature.', { align: 'center' })
         .moveDown(1)
         .text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 50, doc.y);

      // Finalize the PDF
      doc.end();
    });
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error("Failed to generate receipt");
  }
}
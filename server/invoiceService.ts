import { storage } from "./storage";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

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
    
    // Create PDF document using PDFKit with improved stream handling
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Receipt-${payment.reference}`,
            Author: 'Codelab Educare',
            Subject: 'Payment Receipt'
          }
        });

        // Use PassThrough stream for better buffer handling
        const stream = new PassThrough();
        const chunks: Buffer[] = [];

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });
        stream.on('error', reject);

        doc.pipe(stream);

        // Build PDF content
        doc.fontSize(20)
           .fillColor('#800080')
           .text('CODELAB EDUCARE', { align: 'center' });
        
        doc.moveDown(0.5)
           .fontSize(16)
           .fillColor('#000000')
           .text('PAYMENT RECEIPT', { align: 'center' });

        doc.moveDown(1.5);

        // Receipt details
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Receipt Number: ${payment.reference}`, 50)
           .text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}`, 300, doc.y - 14)
           .text(`Status: ${payment.status.toUpperCase()}`, 300, doc.y);

        doc.moveDown(1);

        // Customer section
        doc.fontSize(14)
           .fillColor('#800080')
           .text('CUSTOMER DETAILS');
        
        doc.moveDown(0.3);
        const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
        doc.fontSize(11)
           .fillColor('#000000')
           .text(`Name: ${customerName}`)
           .text(`Email: ${user.email}`)
           .text(`Customer ID: ${user.id}`);

        doc.moveDown(1);

        // Payment section
        doc.fontSize(14)
           .fillColor('#800080')
           .text('PAYMENT INFORMATION');
        
        doc.moveDown(0.3);
        doc.fontSize(11)
           .fillColor('#000000')
           .text(`Amount: ₦${Number(payment.amount).toLocaleString()}`)
           .text(`Payment Method: ${payment.channel || 'Online Payment'}`)
           .text(`Provider: ${payment.provider || 'Paystack'}`)
           .text(`Reference: ${payment.providerReference || payment.reference}`);

        doc.moveDown(1.5);

        // Total
        doc.fontSize(14)
           .fillColor('#800080')
           .text(`TOTAL PAID: ₦${Number(payment.amount).toLocaleString()}`);

        doc.moveDown(2);

        // Footer
        doc.fontSize(9)
           .fillColor('#666666')
           .text('Thank you for your payment!', { align: 'center' })
           .text('This is a computer-generated receipt.', { align: 'center' })
           .moveDown(0.5)
           .text(`Generated: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error("Failed to generate receipt");
  }
}
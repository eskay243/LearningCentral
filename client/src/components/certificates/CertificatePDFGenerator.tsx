import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import CertificateTemplate from './CertificateTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificatePDFGeneratorProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  verificationCode: string;
  templateStyle?: 'default' | 'modern' | 'classic';
  additionalNote?: string;
}

const CertificatePDFGenerator: React.FC<CertificatePDFGeneratorProps> = (props) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const certificateHTML = `
      <html>
        <head>
          <title>Certificate - ${props.studentName}</title>
          <style>
            body { margin: 0; padding: 0; }
            .print-container { 
              width: 100%; 
              height: 100vh; 
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate-container {
              width: 842px; /* A4 width in pixels at 96 DPI */
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            @media print {
              .certificate-container {
                box-shadow: none;
                width: 100%;
                height: 100%;
              }
            }
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          <div class="print-container">
            <div class="certificate-container">
              ${certificateRef.current?.innerHTML || ''}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(certificateHTML);
    printWindow.document.close();
  };
  
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      // Create canvas from the certificate element
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      // Calculate dimensions in mm for A4 paper
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`Certificate-${props.studentName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  
  return (
    <div className="space-y-6">
      <div ref={certificateRef} className="certificate-preview bg-white shadow-lg rounded-md overflow-hidden">
        <CertificateTemplate {...props} />
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={handlePrint}
          className="flex items-center space-x-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print Certificate</span>
        </Button>
        
        <Button 
          onClick={handleDownload}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </Button>
      </div>
    </div>
  );
};

export default CertificatePDFGenerator;
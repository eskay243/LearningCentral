import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';

interface CertificateGeneratorProps {
  studentName: string;
  courseTitle: string;
  dateCompleted: string;
  enrollmentId: number;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  studentName,
  courseTitle,
  dateCompleted,
  enrollmentId
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!certificateRef.current) return;

    try {
      // Create canvas from the certificate element
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions
      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = 210; // A4 height in mm (landscape)
      
      // Create PDF
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download the PDF
      const fileName = `${studentName.replace(/\s+/g, '_').toLowerCase()}_certificate.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <div 
        ref={certificateRef}
        className="w-full max-w-4xl mx-auto bg-white border-8 border-green-600 relative"
        style={{ aspectRatio: '297/210' }}
      >
        {/* Decorative borders */}
        <div className="absolute inset-4 border-2 border-green-400"></div>
        
        {/* Certificate content */}
        <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-green-700 tracking-wide">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="w-32 h-1 bg-green-500 mx-auto"></div>
          </div>

          {/* Main content */}
          <div className="text-center space-y-4 flex-1 flex flex-col justify-center">
            <p className="text-lg text-gray-700">This is to certify that</p>
            
            <h2 className="text-3xl font-bold text-gray-900 border-b-2 border-green-300 pb-2 px-8 inline-block">
              {studentName}
            </h2>
            
            <p className="text-lg text-gray-700">has successfully completed the course</p>
            
            <h3 className="text-2xl font-semibold text-green-700 px-4">
              "{courseTitle}"
            </h3>
            
            <div className="pt-4">
              <p className="text-base text-gray-600">Completed on: {dateCompleted}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end w-full pt-8">
            <div className="text-center">
              <div className="w-40 h-px bg-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Instructor Signature</p>
            </div>
            
            <div className="text-center">
              <h4 className="text-xl font-bold text-green-700">Codelab Educare</h4>
              <p className="text-sm text-gray-600">Digital Learning Platform</p>
            </div>
            
            <div className="text-center">
              <div className="w-40 h-px bg-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Date</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="text-xs text-gray-400 absolute bottom-2 right-4">
            Certificate ID: CERT-{enrollmentId}-{Date.now()}
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="text-center">
        <Button 
          onClick={generatePDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Certificate
        </Button>
      </div>
    </div>
  );
};

export default CertificateGenerator;
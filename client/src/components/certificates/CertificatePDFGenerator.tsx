import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import CertificateTemplate from './CertificateTemplate';
import { useToast } from "@/hooks/use-toast";

type CertificatePDFGeneratorProps = {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  verificationCode: string;
  instructorName?: string;
  templateStyle?: 'default' | 'modern' | 'classic';
};

const CertificatePDFGenerator: React.FC<CertificatePDFGeneratorProps> = ({
  studentName,
  courseTitle,
  issueDate,
  verificationCode,
  instructorName,
  templateStyle = 'default'
}) => {
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    toast({
      title: "Generating PDF...",
      description: "Your certificate is being prepared for download.",
    });

    try {
      // In a real implementation, we would:
      // 1. Either use a library like html2canvas + jsPDF
      // 2. Or make an API call to generate the PDF server-side

      // For now, we'll simulate the process with a timeout
      setTimeout(() => {
        toast({
          title: "PDF Ready",
          description: "Your certificate has been generated and is downloading.",
        });
        
        // Here we'd normally trigger the download, but for now we'll just open API endpoint
        window.open(`/api/certificates/${verificationCode}/download`, '_blank');
      }, 1500);
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="certificate-generator">
      <div className="mb-6 border rounded-md p-2" ref={certificateRef}>
        <CertificateTemplate
          studentName={studentName}
          courseTitle={courseTitle}
          issueDate={issueDate}
          verificationCode={verificationCode}
          instructorName={instructorName}
          templateStyle={templateStyle}
        />
      </div>
      
      <div className="flex justify-center">
        <Button onClick={generatePDF} className="w-full max-w-xs">
          <Download className="mr-2 h-4 w-4" />
          Download Certificate PDF
        </Button>
      </div>
    </div>
  );
};

export default CertificatePDFGenerator;
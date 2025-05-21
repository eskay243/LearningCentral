import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Award, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Certificates() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/api/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["/api/certificates"],
    enabled: isAuthenticated,
  });

  const handlePrint = (certificate: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${certificate.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .certificate { 
                border: 20px solid #0066cc; 
                padding: 40px; 
                width: 800px; 
                margin: 0 auto; 
                background-color: #ffffff;
                text-align: center;
                position: relative;
              }
              .certificate:after {
                content: '';
                top: 0px;
                left: 0px;
                bottom: 0px;
                right: 0px;
                position: absolute;
                background-image: url('/images/certificate-bg.png');
                background-size: 100% 100%;
                background-repeat: no-repeat;
                opacity: 0.1;
                z-index: -1;
              }
              h1 { font-size: 50px; margin-bottom: 20px; color: #0066cc; }
              h2 { font-size: 30px; margin-bottom: 20px; }
              p { font-size: 18px; margin-bottom: 10px; }
              .verification { margin-top: 40px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            ${certificate.template}
            <div class="verification">
              Verification Code: ${certificate.verificationCode}
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const downloadPDF = (certificate: any) => {
    // In a real implementation, this would call an API endpoint to generate a PDF
    toast({
      title: "PDF Download",
      description: "Your certificate PDF is being generated and will download shortly.",
    });
    
    // Simulate API call delay
    setTimeout(() => {
      window.open(`/api/certificates/${certificate.id}/download`, '_blank');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="text-muted-foreground mt-1">
            View, download, and share your achievement certificates
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      {isLoadingCertificates ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Award className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Certificates Yet</h3>
          <p className="text-muted-foreground max-w-md mt-2">
            Complete courses to earn certificates that showcase your achievements.
          </p>
          <Button className="mt-6" onClick={() => setLocation("/courses")}>
            Browse Courses
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {certificates.map((certificate: any) => (
            <Card key={certificate.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold truncate">
                    {certificate.courseTitle || "Course Certificate"}
                  </CardTitle>
                  <Badge variant={certificate.status === "issued" ? "default" : "destructive"} className="ml-2 flex-shrink-0">
                    {certificate.status === "issued" ? "Valid" : "Revoked"}
                  </Badge>
                </div>
                <CardDescription>
                  Issued on: {new Date(certificate.issuedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0 flex-1">
                <div 
                  className="certificate-preview bg-muted rounded-md p-4 mb-4 text-center h-40 sm:h-48 flex items-center justify-center overflow-hidden" 
                  dangerouslySetInnerHTML={{ __html: certificate.template }} 
                />
                <div className="text-sm text-muted-foreground mb-2 break-all">
                  <span className="block mb-1">Verification Code:</span> 
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{certificate.verificationCode}</code>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-center md:justify-between gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={() => handlePrint(certificate)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={() => downloadPDF(certificate)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 min-w-[80px]"
                  onClick={() => window.open(`/certificate/verify/${certificate.id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
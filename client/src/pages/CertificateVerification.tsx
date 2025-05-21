import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CertificateVerification() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [verificationCode, setVerificationCode] = useState("");
  const [manualVerifying, setManualVerifying] = useState(false);
  
  // Query for certificate verification if ID is provided in URL
  const { 
    data: verification, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: [`/api/certificates/verify/${id || "none"}`],
    enabled: !!id,
  });

  // Handle manual verification form submit
  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;
    
    setManualVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/certificates/verify-by-code", {
        verificationCode: verificationCode.trim()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.certificate?.id) {
          setLocation(`/certificate/verify/${data.certificate.id}`);
        }
      } else {
        // Handle error case
        setLocation(`/certificate/verify/invalid`);
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setManualVerifying(false);
    }
  };

  // If we're on the invalid page
  if (id === "invalid") {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Certificate Verification</h1>
          
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Invalid Certificate</AlertTitle>
            <AlertDescription>
              The certificate code you entered is invalid or could not be found in our system.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Try Another Verification</CardTitle>
              <CardDescription>
                Enter a certificate verification code to check its authenticity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Certificate Verification Code</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="verification-code"
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter code (e.g., A1B2C3D4)"
                    />
                    <Button type="submit" disabled={manualVerifying || !verificationCode}>
                      {manualVerifying ? 
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : 
                        <Search className="h-4 w-4 mr-2" />
                      }
                      Verify
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 md:mb-6">Certificate Verification</h1>
        
        {!id ? (
          <Card>
            <CardHeader>
              <CardTitle>Verify Certificate</CardTitle>
              <CardDescription>
                Enter a certificate verification code to check its authenticity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Certificate Verification Code</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="verification-code"
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter code (e.g., A1B2C3D4)"
                    />
                    <Button type="submit" disabled={manualVerifying || !verificationCode}>
                      {manualVerifying ? 
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : 
                        <Search className="h-4 w-4 mr-2" />
                      }
                      Verify
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : verification?.valid ? (
          <div className="space-y-6">
            <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 dark:text-green-300">Valid Certificate</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                This certificate has been verified as authentic and was issued by Codelab Educare.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>
                  Verified on: {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="certificate-preview bg-muted rounded-md p-3 sm:p-6 mb-4 sm:mb-6 overflow-auto" 
                  style={{ maxHeight: '500px' }}
                  dangerouslySetInnerHTML={{ __html: verification.certificate?.template }} 
                />
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Course</div>
                    <div className="text-lg">{verification.certificate?.courseTitle || "Course Certificate"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Issued To</div>
                    <div className="text-lg">{verification.certificate?.userName || "Student"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Issue Date</div>
                    <div className="text-lg">
                      {verification.certificate?.issuedAt ?
                        new Date(verification.certificate.issuedAt).toLocaleDateString() :
                        "Unknown"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Verification Code</div>
                    <code className="text-lg bg-muted px-2 py-1 rounded">
                      {verification.certificate?.verificationCode}
                    </code>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/certificate/verify")}
                >
                  Verify Another Certificate
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Invalid Certificate</AlertTitle>
              <AlertDescription>
                {verification?.message || "This certificate could not be verified or has been revoked."}
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Try Another Verification</CardTitle>
                <CardDescription>
                  Enter a certificate verification code to check its authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Certificate Verification Code</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="verification-code"
                        value={verificationCode} 
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter code (e.g., A1B2C3D4)"
                      />
                      <Button type="submit" disabled={manualVerifying || !verificationCode}>
                        {manualVerifying ? 
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : 
                          <Search className="h-4 w-4 mr-2" />
                        }
                        Verify
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
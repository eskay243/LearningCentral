import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Download, ArrowLeft } from "lucide-react";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/payment/callback");
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  const trxref = urlParams.get('trxref');

  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      const paymentRef = reference || trxref;
      if (!paymentRef) {
        throw new Error('No payment reference found');
      }

      const response = await apiRequest("POST", "/api/payments/verify", {
        reference: paymentRef
      });
      
      // Check if response is HTML (indicates routing issue)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Payment verification endpoint returned HTML instead of JSON');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPaymentStatus('success');
        setPaymentData(data);
        toast({
          title: "Payment Successful!",
          description: "You have been successfully enrolled in the course.",
        });
        
        // Invalidate relevant caches to refresh course data
        queryClient.invalidateQueries({ queryKey: ['/api/student/enrolled-courses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        
        if (data.courseId) {
          queryClient.invalidateQueries({ queryKey: ['/api/courses', data.courseId] });
        }
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: data.message || "Payment verification failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setPaymentStatus('failed');
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/payments/invoice/${paymentData.paymentReference}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${paymentData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    verifyPaymentMutation.mutate();
  }, []);

  const handleDownloadInvoice = () => {
    downloadInvoiceMutation.mutate();
  };

  const handleGoToCourse = () => {
    if (paymentData?.courseId) {
      setLocation(`/courses/${paymentData.courseId}`);
    } else {
      setLocation('/dashboard');
    }
  };

  const handleBackToHome = () => {
    setLocation('/');
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <h2 className="text-xl font-semibold">Verifying Payment</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Please wait while we verify your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                Congratulations! You have been successfully enrolled in:
              </p>
              <p className="font-semibold text-lg">{paymentData?.courseTitle}</p>
              <p className="text-sm text-gray-500">
                Payment Reference: {paymentData?.paymentReference}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleGoToCourse}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Start Learning
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownloadInvoice}
                disabled={downloadInvoiceMutation.isPending}
                className="w-full"
              >
                {downloadInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={handleBackToHome}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              Sorry, we couldn't process your payment. Please try again.
            </p>
            {reference && (
              <p className="text-sm text-gray-500">
                Reference: {reference}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBackToHome}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentCallback = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | null>(null);
  const [message, setMessage] = useState('');
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const url = new URL(window.location.href);
        const reference = url.searchParams.get('reference');
        
        if (reference) {
          const response = await apiRequest('GET', `/api/payments/verify/${reference}`);
          const data = await response.json();
          
          if (data.success) {
            setStatus('success');
            setMessage('Your payment was successful! You have been enrolled in the course.');
          } else {
            setStatus('failed');
            setMessage(data.message || 'Payment verification failed. Please contact support.');
          }
        } else {
          setStatus('failed');
          setMessage('No payment reference found. Please try enrolling again.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || 'An error occurred during payment verification.');
        
        toast({
          title: 'Payment Verification Failed',
          description: error.message || 'Please try again or contact support.',
          variant: 'destructive'
        });
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [toast]);
  
  const handleContinue = () => {
    if (status === 'success') {
      navigate('/dashboard');
    } else {
      navigate('/courses');
    }
  };
  
  return (
    <div className="container mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment {isVerifying ? 'Processing' : status === 'success' ? 'Successful' : 'Failed'}</CardTitle>
          <CardDescription>
            {isVerifying ? 'Verifying your payment...' : 'Payment verification complete'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader className="h-16 w-16 text-primary animate-spin mb-4" />
              <p>Please wait while we verify your payment...</p>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center justify-center p-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center mb-6">{message}</p>
              <Button onClick={handleContinue}>Continue to Dashboard</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center mb-6">{message}</p>
              <Button onClick={handleContinue} variant="outline">Return to Courses</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  courseTitle: string;
  price: number;
  onSuccess?: () => void;
}

const PaymentModal = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  price,
  onSuccess
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const response = await apiRequest('POST', '/api/payments/initialize', {
        courseId,
        amount: price
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment initialization failed');
      }
      
      const data = await response.json();
      
      // Redirect to Paystack hosted payment page
      window.location.href = data.authorizationUrl;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Could not initiate payment. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll in Course</DialogTitle>
          <DialogDescription>
            You are about to enroll in <span className="font-semibold">{courseTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Course Fee:</span>
              <span className="font-semibold">₦{price.toLocaleString()}</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">₦{price.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            You will be redirected to Paystack to complete your payment securely.
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay with Paystack'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Building2, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    price: number;
  };
  onPaymentSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, course, onPaymentSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank-transfer' | 'wallet'>('paystack');

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'paystack') {
        // Initialize Paystack payment
        const response = await apiRequest("POST", `/api/payments/initialize`, {
          courseId: course.id,
          amount: course.price * 100, // Convert to kobo
        });

        const paymentData = await response.json();

        if (paymentData.authorizationUrl) {
          // Open Paystack payment in a popup window
          const popup = window.open(
            paymentData.authorizationUrl,
            'paystack-payment',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );

          // Monitor the popup for completion
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              // Check payment status after popup closes
              setTimeout(() => {
                verifyPayment(paymentData.reference);
              }, 1000);
            }
          }, 1000);

          // Fallback timeout after 10 minutes
          setTimeout(() => {
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
          }, 600000);
        } else {
          throw new Error('Failed to initialize payment');
        }
      } else if (paymentMethod === 'bank-transfer') {
        // Handle bank transfer
        toast({
          title: "Bank Transfer Instructions",
          description: "Bank transfer details will be sent to your email. Please complete the transfer and upload proof of payment.",
        });
        onClose();
      } else if (paymentMethod === 'wallet') {
        // Handle wallet payment
        const response = await apiRequest("POST", `/api/courses/${course.id}/enroll`, {
          paymentMethod: 'wallet',
          amount: course.price,
        });

        if (response.ok) {
          toast({
            title: "Payment Successful",
            description: "You have been enrolled in the course using your wallet balance.",
          });
          onPaymentSuccess();
          onClose();
        } else {
          throw new Error('Insufficient wallet balance or payment failed');
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await apiRequest("POST", `/api/payment/verify`, {
        reference,
        courseId: course.id,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Payment Successful",
            description: "You have been successfully enrolled in the course!",
          });
          onPaymentSuccess();
          onClose();
        } else {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support if you believe this is an error.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast({
        title: "Payment Verification Error",
        description: "Unable to verify payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for "{course.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(course.price)}
            </div>
            <div className="text-sm text-muted-foreground">Course Fee</div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="paystack" id="paystack" />
                <Label htmlFor="paystack" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Card Payment (Paystack)</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                <Label htmlFor="bank-transfer" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Building2 className="w-4 h-4" />
                  <span>Bank Transfer</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet Balance</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
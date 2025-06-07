import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Shield, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    price: number;
    thumbnail?: string;
  };
  userEmail: string;
}

export function PaymentModal({ isOpen, onClose, course, userEmail }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/initialize", {
        courseId: course.id,
        email: userEmail,
        amount: course.price,
        callbackUrl: `${window.location.origin}/payment/callback`
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({
          title: "Payment Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = () => {
    setIsProcessing(true);
    paymentMutation.mutate();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Enrollment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Course Summary */}
          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {course.thumbnail && (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPrice(course.price)}
              </p>
            </div>
          </div>

          {/* Payment Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm">Secure payment powered by Paystack</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Instant access after payment</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">30-day money-back guarantee</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You'll be redirected to Paystack to complete your payment securely. 
              After successful payment, you'll be automatically enrolled in the course.
            </p>
          </div>

          {/* Payment Button */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700" 
              onClick={handlePayment}
              disabled={isProcessing || paymentMutation.isPending}
            >
              {isProcessing || paymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatPrice(course.price)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
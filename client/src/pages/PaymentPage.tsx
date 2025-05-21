import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/types";
import { ContextualHelp } from "@/components/ui/ContextualHelp";
import { formatCurrency } from "@/lib/currencyUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function PaymentPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank-transfer' | 'wallet'>('paystack');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
  });

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete payment",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, toast]);

  if (courseLoading || !course) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  // Using the consistent currency formatter from our utility
  const formatPrice = (amount: number) => {
    return formatCurrency(amount, 'NGN');
  };
  
  // Open confirmation dialog before processing payment
  const initiatePayment = () => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "User email not available",
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmation(true);
  };
  
  // Process payment after confirmation
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Different handling based on payment method
      if (paymentMethod === 'paystack') {
        const response = await fetch(`/api/courses/${id}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user?.email,
            paymentMethod: "paystack"
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Payment error response:", errorText);
          throw new Error('Payment initialization failed');
        }
        
        const data = await response.json();
        
        if (!data || (!data.authorization_url && !data.authorizationUrl)) {
          console.error("Invalid payment response:", data);
          throw new Error('Invalid payment response');
        }
        
        // Redirect to Paystack payment URL (handle both property naming conventions)
        window.location.href = data.authorization_url || data.authorizationUrl;
      } 
      else if (paymentMethod === 'bank-transfer') {
        // For bank transfer, we'll show the account details
        toast({
          title: "Bank Transfer Selected",
          description: "You'll be shown bank details to complete your payment",
        });
        
        try {
          const response = await fetch(`/api/courses/${id}/bank-transfer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Bank transfer error:", errorText);
            throw new Error('Bank transfer setup failed');
          }
          
          const data = await response.json();
          
          if (!data || !data.accountDetails) {
            throw new Error('Invalid bank transfer response');
          }
          
          // Store the reference from the server or generate one if needed
          const reference = data.reference || `CLB-${id}-${Date.now().toString().substring(8)}`;
          
          // Use the server-provided account details
          const accountDetails = data.accountDetails;
          
          // Navigate to bank transfer instructions page
          navigate(`/bank-transfer-instructions`, { 
            state: { 
              courseId: id,
              accountDetails, 
              amount: course?.price, 
              reference 
            }
          });
        } catch (error: any) {
          console.error("Bank transfer error:", error);
          toast({
            title: "Payment Setup Failed",
            description: error.message || "Could not setup bank transfer payment",
            variant: "destructive",
          });
        }
      }
      else if (paymentMethod === 'wallet') {
        // For wallet payments
        try {
          const response = await fetch(`/api/courses/${id}/wallet-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user?.email
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Wallet payment failed");
          }
          
          // Show success message
          toast({
            title: "Payment Successful",
            description: "Your payment was processed successfully using your wallet balance.",
          });
          
          // Redirect to course page
          navigate(`/courses/${id}/view`);
        } catch (error: any) {
          console.error("Wallet payment error:", error);
          toast({
            title: "Payment Failed",
            description: error.message || "Insufficient wallet balance",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was a problem processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
      <p className="text-gray-600 mb-8">
        You're one step away from enrolling in {course.title}
      </p>

      <div className="relative">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>{course.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Course Overview</h3>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
              </div>
              <div>
                <h3 className="font-medium">What You'll Learn</h3>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                  {course.highlights?.split('\n').map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  )) || <li>Comprehensive course content</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Course Duration</h3>
                <p className="text-sm text-gray-600 mt-1">{course.duration || '8 weeks'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <div className="relative">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Complete your payment securely</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span>Course Fee</span>
                    <span className="font-medium">{formatPrice(course.price || 0)}</span>
                  </div>
                  
                  {course.discountAmount > 0 && (
                    <div className="flex justify-between items-center pb-4 border-b text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(course.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(course.price || 0)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Payment Method</div>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as 'paystack' | 'bank-transfer' | 'wallet')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paystack" id="paystack" />
                      <Label htmlFor="paystack" className="flex items-center">
                        <span>Paystack (Card/USSD)</span>
                        <span className="ml-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                      <Label htmlFor="bank-transfer">Bank Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet">Wallet Balance</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button 
                  className="w-full" 
                  onClick={initiatePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                </Button>
              </CardFooter>
            </Card>
            
            <ContextualHelp 
              id="payment-help"
              title="Payment Options"
              content={
                <div>
                  <p>We offer multiple secure payment options:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Paystack:</strong> Pay with debit/credit card, USSD or bank transfers</li>
                    <li><strong>Bank Transfer:</strong> Manually transfer from your bank account</li>
                    <li><strong>Wallet:</strong> Use your existing account balance</li>
                  </ul>
                  <p className="mt-2">All payments are secure and your data is protected.</p>
                </div>
              }
              characterId="sammy"
              position="right"
              triggerOnFirstVisit={true}
            />
          </div>
        </div>
      </div>
      
      {/* Payment confirmation dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You're about to make a payment of {formatPrice(course.price || 0)} for {course.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Payment Method: {
                paymentMethod === 'paystack' ? 'Paystack (Card/USSD)' : 
                paymentMethod === 'bank-transfer' ? 'Bank Transfer' : 'Wallet Balance'
              }
            </p>
            <p className="text-sm text-gray-600 mt-2">
              By proceeding, you agree to our terms and conditions for course enrollment.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
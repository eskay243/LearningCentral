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
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, toast]);

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
        
        if (!data || !data.authorization_url) {
          console.error("Invalid payment response:", data);
          throw new Error('Invalid payment response');
        }
        
        // Redirect to Paystack payment URL
        window.location.href = data.authorization_url;
      } 
      else if (paymentMethod === 'bank-transfer') {
        // For bank transfer, we'll show the account details
        toast({
          title: "Bank Transfer Selected",
          description: "You'll be shown bank details to complete your payment",
        });
        
        // In a real app, we would get these details from the API
        const accountDetails = {
          bankName: "First Bank of Nigeria",
          accountNumber: "3089765432",
          accountName: "Codelab Educare Ltd",
          reference: `CLB-${id}-${Date.now().toString().substring(8)}`
        };
        
        // Navigate to bank transfer instructions page
        navigate(`/courses/${id}/bank-transfer`, { 
          state: { accountDetails, amount: course?.price }
        });
      }
      else if (paymentMethod === 'wallet') {
        // For wallet payments
        const response = await apiRequest("POST", `/api/courses/${id}/wallet-payment`, {
          email: user?.email,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Insufficient wallet balance");
        }
        
        const data = await response.json();
        
        // Show success message
        toast({
          title: "Payment Successful",
          description: "Your payment was processed successfully using your wallet balance.",
        });
        
        // Navigate to course view
        navigate(`/courses/${id}/view`);
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "There was a problem processing your payment",
        variant: "destructive",
      });
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <p>The course you're trying to enroll in doesn't exist.</p>
        <Button onClick={() => navigate("/courses")} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Complete Your Enrollment</h1>
      <p className="text-gray-600 mb-8">You're just one step away from accessing your course.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-medium mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="mb-4">
                <h3 className="font-medium mb-1">What you'll get:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Full access to all course content</li>
                  <li>Certificate of completion</li>
                  <li>Mentor support</li>
                  <li>Lifetime updates</li>
                </ul>
              </div>
              
              {course.mentorName && (
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                    {course.mentorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">Instructor: {course.mentorName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <ContextualHelp 
            id="course-details-help"
            title="Course Overview"
            content={
              <div>
                <p>This section shows you what you'll be learning in this course. Make sure it aligns with your learning goals before completing the payment.</p>
                <p className="mt-2">The instructor information shows who created the course and will be available to support your learning journey.</p>
              </div>
            }
            characterId="ada"
            position="left"
            triggerOnFirstVisit={true}
          />
        </div>

        <div className="relative">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Complete your payment securely with Paystack</CardDescription>
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
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex-1 cursor-pointer">
                      <div className="font-medium">Pay with Card</div>
                      <div className="text-sm text-gray-500">Debit/Credit Cards via Paystack</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                    <Label htmlFor="bank-transfer" className="flex-1 cursor-pointer">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-gray-500">Manual transfer to our account</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                      <div className="font-medium">Wallet Balance</div>
                      <div className="text-sm text-gray-500">Use your existing wallet balance</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                className="w-full" 
                onClick={initiatePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  paymentMethod === 'paystack' 
                    ? "Pay with Card" 
                    : paymentMethod === 'bank-transfer' 
                      ? "Pay with Bank Transfer" 
                      : "Pay with Wallet"
                )}
              </Button>
              
              <div className="text-center mt-4 text-sm text-gray-500">
                <p>Secure payment processing</p>
                <p className="mt-1">Your data is protected</p>
              </div>
              
              {/* Payment Confirmation Dialog */}
              <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Your Payment</DialogTitle>
                    <DialogDescription>
                      You're about to make a payment of {course && formatPrice(course.price || 0)} for the course "{course?.title}".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Course:</span>
                        <span>{course?.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Amount:</span>
                        <span>{course && formatPrice(course.price || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Payment Method:</span>
                        <span>
                          {paymentMethod === 'paystack' 
                            ? 'Card Payment (Paystack)' 
                            : paymentMethod === 'bank-transfer' 
                              ? 'Bank Transfer' 
                              : 'Wallet Balance'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row sm:justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowConfirmation(false)}
                      className="mb-2 sm:mb-0"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          
          <ContextualHelp 
            id="payment-process-help"
            title="Secure Payment"
            content={
              <div>
                <p>Your payment will be processed securely through Paystack, a trusted payment provider in Nigeria.</p>
                <p className="mt-2">After clicking the button, you'll be redirected to complete your payment with any of these methods:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Bank cards (Mastercard, Visa, Verve)</li>
                  <li>Bank transfers</li>
                  <li>USSD payments</li>
                  <li>Mobile money</li>
                </ul>
                <p className="mt-2">After successful payment, you'll be automatically enrolled in the course.</p>
              </div>
            }
            characterId="sammy"
            position="right"
            triggerOnFirstVisit={true}
          />
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function PaymentCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [courseId, setCourseId] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const referenceParam = params.get("reference");
    const courseIdParam = params.get("courseId");
    const statusParam = params.get("status");
    
    setCourseId(courseIdParam);
    
    if (statusParam === "success") {
      setStatus("success");
      toast({
        title: "Payment Successful",
        description: "Your enrollment has been confirmed",
      });
    } else if (statusParam === "error") {
      setStatus("error");
      toast({
        title: "Payment Failed",
        description: "There was a problem processing your payment",
        variant: "destructive",
      });
    } else {
      // If no status parameter, we need to check the payment status
      setStatus("loading");
      
      // Automatically redirect to course page after 5 seconds if loading
      const timer = setTimeout(() => {
        if (courseIdParam) {
          navigate(`/courses/${courseIdParam}/view`);
        } else {
          navigate("/courses");
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, toast]);
  
  const handleRedirect = () => {
    if (courseId && status === "success") {
      navigate(`/courses/${courseId}/view`);
    } else {
      navigate("/courses");
    }
  };
  
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {status === "loading" ? "Processing Payment..." : status === "success" ? "Payment Successful" : "Payment Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            {status === "loading" ? (
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-center text-gray-500">
                  We're confirming your payment. Please wait a moment...
                </p>
              </div>
            ) : status === "success" ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-center text-gray-700 mb-2">
                  Your payment has been successfully processed.
                </p>
                <p className="text-center text-gray-500">
                  You now have full access to the course. Happy learning!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-center text-gray-700 mb-2">
                  Your payment could not be processed.
                </p>
                <p className="text-center text-gray-500">
                  Please try again or contact support if the problem persists.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleRedirect} className="w-full">
              {status === "success" ? "Go to Course" : "Back to Courses"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
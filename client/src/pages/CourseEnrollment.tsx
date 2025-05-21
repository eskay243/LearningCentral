import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Course } from "@/types";

export default function CourseEnrollment() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch course details
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id
  });

  // Check if already enrolled
  const { data: enrollment } = useQuery({
    queryKey: [`/api/courses/${id}/enrollment`],
    enabled: !!id && isAuthenticated
  });

  useEffect(() => {
    // If already enrolled, redirect to course view
    if (enrollment) {
      setLocation(`/courses/${id}/view`);
    }
  }, [enrollment, id, setLocation]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleFreeEnrollment = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in this course",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", `/api/courses/${id}/enroll`, {
        userId: user?.id,
        paymentStatus: "free"
      });

      toast({
        title: "Success!",
        description: "You have been enrolled in this course",
      });

      setLocation(`/courses/${id}/view`);
    } catch (error) {
      toast({
        title: "Enrollment Failed",
        description: "There was a problem enrolling you in this course",
        variant: "destructive"
      });
    }
  };

  const handlePaystackPayment = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in this course",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await apiRequest("POST", `/api/courses/${id}/payment`, {
        userId: user?.id,
        courseId: id,
        email: user?.email,
        amount: course?.price
      });

      const data = await response.json();
      
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (error) {
      setIsProcessingPayment(false);
      toast({
        title: "Payment Initialization Failed",
        description: "There was a problem starting the payment process",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-12 w-1/4" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <p>The course you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation("/courses")} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Course Overview</h3>
                  <p>{course.description}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Professional certification upon completion</li>
                    <li>Access to all course materials</li>
                    <li>Interactive learning exercises</li>
                    <li>Mentor support</li>
                    <li>Lifetime access to updates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Course Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  {course.mentorName?.charAt(0) || "M"}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{course.mentorName || "Expert Instructor"}</h3>
                  <p className="text-sm text-gray-600">Professional Educator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollment</CardTitle>
              <CardDescription>Complete your enrollment here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-3xl font-bold">
                  {course.price > 0 ? formatCurrency(course.price, 'NGN') : "Free"}
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <div className="flex items-center mt-1">
                    <span className="text-gray-500 line-through mr-2">
                      {formatCurrency(course.originalPrice, 'NGN')}
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Save {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Full lifetime access</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access on mobile and desktop</span>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4">
              {course.price > 0 ? (
                <Button 
                  className="w-full" 
                  onClick={handlePaystackPayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Enroll Now with Paystack"
                  )}
                </Button>
              ) : (
                <Button className="w-full" onClick={handleFreeEnrollment}>
                  Enroll Now (Free)
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
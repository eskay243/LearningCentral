import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "./PaymentModal";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EnrollButtonProps {
  courseId: number;
  courseTitle: string;
  price: number;
  isEnrolled?: boolean;
  onEnrollSuccess?: () => void;
}

const EnrollButton = ({
  courseId,
  courseTitle,
  price,
  isEnrolled = false,
  onEnrollSuccess
}: EnrollButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = "/api/login";
      return;
    }

    if (isEnrolled) {
      // Already enrolled, navigate to course view
      window.location.href = `/courses/${courseId}`;
      return;
    }

    if (price > 0) {
      // Open payment modal for paid courses
      setModalOpen(true);
    } else {
      // Free course enrollment
      handleFreeEnrollment();
    }
  };

  const handleFreeEnrollment = async () => {
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          paymentStatus: 'free',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enroll in course');
      }

      toast({
        title: "Enrollment Successful",
        description: `You have successfully enrolled in ${courseTitle}`,
      });

      // Call the success callback if provided
      if (onEnrollSuccess) {
        onEnrollSuccess();
      }

      // Redirect to course view
      window.location.href = `/courses/${courseId}`;
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "An error occurred during enrollment",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button 
        onClick={handleEnrollClick} 
        className="w-full md:w-auto"
        variant={isEnrolled ? "outline" : "default"}
      >
        <LogIn className="mr-2 h-4 w-4" />
        {isEnrolled ? "Go to Course" : price > 0 ? `Enroll (₦${price.toLocaleString()})` : "Enroll for Free"}
      </Button>

      <PaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        courseId={courseId}
        courseTitle={courseTitle}
        price={price}
        onSuccess={onEnrollSuccess}
      />
    </>
  );
};

export default EnrollButton;
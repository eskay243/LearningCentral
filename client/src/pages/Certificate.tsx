import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award } from 'lucide-react';
import CertificateGenerator from '@/components/CertificateGenerator';
import { useAuth } from "@/hooks/useAuth";

interface EnrollmentData {
  id: number;
  courseId: number;
  userId: string;
  progress: number;
  completedAt: string | null;
  title: string;
  description: string;
  firstName: string;
  lastName: string;
}

export default function Certificate() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/certificate/:enrollmentId');
  const { user } = useAuth();
  
  const enrollmentId = params?.enrollmentId;

  const { data: enrollment, isLoading, error } = useQuery({
    queryKey: ['/api/student/enrollment', enrollmentId],
    queryFn: async () => {
      const response = await fetch(`/api/student/enrollment/${enrollmentId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch enrollment data');
      }
      return response.json() as EnrollmentData;
    },
    enabled: !!enrollmentId
  });

  if (!match || !enrollmentId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Certificate Request
          </h2>
          <Button onClick={() => setLocation('/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Certificate Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error ? 'Failed to load certificate data' : 'Enrollment not found'}
          </p>
          <Button onClick={() => setLocation('/student/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (enrollment.progress < 100) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Certificate Not Yet Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete the course to unlock your certificate. Current progress: {enrollment.progress}%
          </p>
          <Button onClick={() => setLocation('/student/courses')}>
            Continue Learning
          </Button>
        </div>
      </div>
    );
  }

  const studentName = `${enrollment.firstName} ${enrollment.lastName}`;
  const courseTitle = enrollment.title;
  const dateCompleted = enrollment.completedAt 
    ? new Date(enrollment.completedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/student/courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Certificate of Completion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {courseTitle}
          </p>
        </div>
      </div>

      {/* Certificate Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Your Achievement Certificate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CertificateGenerator
            studentName={studentName}
            courseTitle={courseTitle}
            dateCompleted={dateCompleted}
            enrollmentId={enrollment.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
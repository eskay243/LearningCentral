import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayIcon, BookOpenIcon, UsersIcon, ClockIcon } from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/courses")}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="relative h-64 bg-gradient-to-r from-purple-600 to-blue-600">
            {course.thumbnail && (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-200 text-lg">{course.description}</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Badge variant="secondary">{course.category}</Badge>
              <div className="flex items-center text-gray-600">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Self-paced</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                ₦{course.price?.toLocaleString()}
              </div>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <PlayIcon className="h-5 w-5 mr-2" />
                Enroll Now
              </Button>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>
                  Learn what this course covers and what you'll achieve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {course.description || "No detailed description available for this course."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  Detailed breakdown of lessons and modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <BookOpenIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Introduction Module</h3>
                      <p className="text-sm text-gray-600">Getting started with the basics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle>Course Mentors</CardTitle>
                <CardDescription>
                  Meet your instructors and guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No mentors assigned to this course yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Student Reviews</CardTitle>
                <CardDescription>
                  See what other students are saying
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600">No reviews available yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
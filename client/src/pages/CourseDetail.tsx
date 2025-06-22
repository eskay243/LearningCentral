import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Users, BookOpen, Clock, Star, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string | null;
  isPublished: boolean;
  thumbnail: string | null;
  mentorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest("GET", `/api/courses/${courseId}`);
        const courseData = await response.json();
        setCourse(courseData);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const canEdit = user && course && (user.role === 'admin' || course.mentorId === user.id);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 mb-4">{error || "Course not found"}</p>
            <Button onClick={() => setLocation("/my-courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/my-courses")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Button>
        
        {canEdit && (
          <Button 
            onClick={() => setLocation(`/courses/${course.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Course
          </Button>
        )}
      </div>

      {/* Course Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.category || 'General'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(course.updatedAt || course.createdAt || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={course.isPublished ? "default" : "secondary"}
                  className="text-sm"
                  title={course.isPublished ? "Course is live and visible to students" : "Course is hidden from students and still being developed"}
                >
                  {course.isPublished ? "✓ Published" : "📝 Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Course Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {course.description || "No description available."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Content Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Course modules and lessons will be displayed here.</p>
                <p className="text-sm mt-2">This feature is coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Price</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(course.price || 0)}
                </div>
                {user?.role === 'mentor' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your share: {formatCurrency((course.price || 0) * 0.37)}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  Enrolled Students: 0
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <Star className="h-4 w-4" />
                  Rating: Not yet rated
                </div>
              </div>

              {!course.isPublished && canEdit && (
                <div className="border-t pt-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Draft Mode:</strong> This course is not visible to students yet. 
                      Publish it when ready to make it available for enrollment.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation(`/courses/${course.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Content
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Students
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
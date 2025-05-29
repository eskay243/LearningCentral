import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Award, 
  TrendingUp,
  Clock,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { formatDate, formatTimeFromNow, getInitials } from "@/lib/utils";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading, error } = useQuery({
    queryKey: [`/api/admin/students/${id}`],
    enabled: !!id,
  });

  // Debug logging
  console.log("Student Profile Debug:", { id, student, isLoading, error });

  if (error) {
    console.error("Student Profile Error:", error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Student Profile</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">The student profile you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
            <p className="text-gray-600">Complete overview of student progress and information</p>
          </div>
        </div>
        <Button>
          <MessageCircle className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{student.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {student.email}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatDate(student.enrolledAt)}
                    </span>
                  </CardDescription>
                </div>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{student.totalCourses || 0}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{student.completedCourses || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{student.progress || 0}%</div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(student.courses || []).map((course: any) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <Progress value={course.progress || 0} className="flex-1 h-2" />
                        <span className="text-sm text-gray-600">{course.progress || 0}%</span>
                      </div>
                    </div>
                    <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>
                      {course.status || 'in-progress'}
                    </Badge>
                  </div>
                ))}
                {(!student.courses || student.courses.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No courses enrolled yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm font-medium">
                  {student.lastActive ? formatTimeFromNow(student.lastActive) : 'Never'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Study Time</span>
                <span className="text-sm font-medium">{student.totalStudyTime || '0h 0m'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assignments Completed</span>
                <span className="text-sm font-medium">{student.assignmentsCompleted || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="text-sm font-medium">{student.averageScore || 'N/A'}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(student.achievements || []).map((achievement: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{achievement.title}</div>
                      <div className="text-xs text-gray-600">{achievement.description}</div>
                    </div>
                  </div>
                ))}
                {(!student.achievements || student.achievements.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No achievements yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
              <Button variant="outline" className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Assign Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
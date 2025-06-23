import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Upload, 
  Eye, 
  Edit, 
  Settings, 
  Video,
  FileText,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CourseDeleteDialog } from "@/components/CourseDeleteDialog";
import { CoursePublishDialog } from "@/components/CoursePublishDialog";

export default function CourseManagementDashboard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  const { data: modules = [] } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: [`/api/courses/${id}/enrollments`],
    enabled: !!id,
  });

  // Type-safe access to course data
  const courseData = course as any;
  const modulesData = Array.isArray(modules) ? modules : [];
  const enrollmentsData = Array.isArray(enrollments) ? enrollments : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Course not found</h3>
        <Button onClick={() => setLocation("/my-courses")}>
          Back to My Courses
        </Button>
      </div>
    );
  }

  const totalLessons = modulesData.reduce((acc: number, module: any) => {
    return acc + (module.lessons?.length || 0);
  }, 0);

  const completionPercentage = Math.round(
    ((modulesData.length > 0 ? 20 : 0) + 
     (totalLessons > 0 ? 40 : 0) + 
     (courseData.thumbnail ? 20 : 0) + 
     (courseData.isPublished ? 20 : 0)) 
  );

  const getNextSteps = () => {
    const steps = [];
    if (modulesData.length === 0) {
      steps.push("Add course modules (chapters)");
    }
    if (totalLessons === 0) {
      steps.push("Create lessons for your modules");
    }
    if (!courseData.thumbnail) {
      steps.push("Upload a course thumbnail");
    }
    if (!courseData.isPublished) {
      steps.push("Publish your course");
    }
    return steps;
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setLocation("/my-courses")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{courseData.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={courseData.isPublished ? "default" : "secondary"}>
                {courseData.isPublished ? "Published" : "Draft"}
              </Badge>
              <span className="text-sm text-gray-500">
                {enrollmentsData.length} student{enrollmentsData.length !== 1 ? 's' : ''} enrolled
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setLocation(`/courses/${id}`)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Course
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/courses/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
          {!courseData.isPublished && (
            <CoursePublishDialog 
              course={{
                id: courseData.id,
                title: courseData.title,
                description: courseData.description,
                thumbnail: courseData.thumbnail,
                modules: modulesData,
                isPublished: courseData.isPublished,
              }}
            />
          )}
          <CourseDeleteDialog
            course={{
              id: courseData.id,
              title: courseData.title,
              isPublished: courseData.isPublished,
              enrollmentCount: enrollmentsData.length,
            }}
            onDeleteSuccess={() => setLocation("/my-courses")}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modulesData.length}</div>
                <p className="text-xs text-muted-foreground">Course chapters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lessons</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLessons}</div>
                <p className="text-xs text-muted-foreground">Total lessons</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrollments.length}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{(enrollments.length * (course.price || 0)).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Course Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle>Course Setup Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Status</span>
                  <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="w-full" />
                
                {getNextSteps().length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Next Steps:</h4>
                    <ul className="space-y-1">
                      {getNextSteps().map((step, index) => (
                        <li key={index} className="flex items-center text-sm text-muted-foreground">
                          <AlertCircle className="w-3 h-3 mr-2" />
                          {step}
                        </li>
                      ))}
                    </ul>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setLocation(`/courses/${id}/curriculum`)}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>Manage Curriculum</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("content")}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload Content</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/courses/${id}/edit`)}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Settings className="w-6 h-6" />
                  <span>Course Settings</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/courses/${id}`)}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Eye className="w-6 h-6" />
                  <span>Preview Course</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Modules Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Course Modules</CardTitle>
                <Button onClick={() => setLocation(`/courses/${id}/curriculum`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </CardHeader>
              <CardContent>
                {modules.length > 0 ? (
                  <div className="space-y-3">
                    {modules.map((module: any, index: number) => (
                      <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Module {index + 1}: {module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons?.length || 0} lesson{module.lessons?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/courses/${id}/curriculum`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                    <p className="text-muted-foreground mb-4">Start by creating your first module</p>
                    <Button onClick={() => setLocation(`/courses/${id}/curriculum`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Module
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Content Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setLocation(`/courses/${id}/curriculum`)}
                    >
                      <Video className="w-6 h-6" />
                      <span>Add Video</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setLocation(`/courses/${id}/curriculum`)}
                    >
                      <FileText className="w-6 h-6" />
                      <span>Add Document</span>
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload videos, documents, and other learning materials
                    </p>
                    <Button onClick={() => setLocation(`/courses/${id}/curriculum`)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Go to Content Manager
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{enrollment.studentName || 'Student'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {enrollment.progress || 0}% Complete
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students enrolled yet</h3>
                  <p className="text-muted-foreground">Students will appear here once they enroll in your course</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating</span>
                    <span className="font-medium">4.5/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-medium">₦{(enrollments.length * (course.price || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Course created successfully</span>
                  </div>
                  {modules.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Modules added</span>
                    </div>
                  )}
                  {course.isPublished ? (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Course published</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Course pending publication</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
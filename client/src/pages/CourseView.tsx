import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useAuth from "@/hooks/useAuth";
import { Course, Module, Lesson, User } from "@/types";
import { formatDate, formatDuration, formatCurrency, getInitials } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CourseView = () => {
  const params = useParams<{ id: string }>();
  const courseId = parseInt(params.id);
  const { user, isMentor, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState("content");
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch course data
  const { 
    data: course, 
    isLoading: isCourseLoading 
  } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch modules for this course
  const { 
    data: modules, 
    isLoading: isModulesLoading 
  } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  // Fetch lessons for current module
  const { 
    data: lessons, 
    isLoading: isLessonsLoading 
  } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${currentModuleId}/lessons`],
    enabled: !!currentModuleId,
  });

  // Fetch course mentors
  const { 
    data: mentors, 
    isLoading: isMentorsLoading 
  } = useQuery<User[]>({
    queryKey: [`/api/courses/${courseId}/mentors`],
    enabled: !!courseId,
  });

  // Fetch enrollment status if user is a student
  const { 
    data: enrollment, 
    isLoading: isEnrollmentLoading 
  } = useQuery({
    queryKey: [`/api/courses/${courseId}/enrollment`],
    enabled: !!courseId && !!user && !isMentor && !isAdmin,
  });

  // Set the first module as current when modules are loaded
  useEffect(() => {
    if (modules && modules.length > 0 && !currentModuleId) {
      setCurrentModuleId(modules[0].id);
    }
  }, [modules, currentModuleId]);

  // Set the first lesson as current when lessons are loaded
  useEffect(() => {
    if (lessons && lessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [lessons, currentLessonId]);

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }

    try {
      await apiRequest("POST", "/api/enrollments", {
        courseId,
        paymentStatus: course?.price ? "pending" : "free",
      });
      
      // Invalidate enrollment query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/enrollment`] });
      
      toast({
        title: "Successfully enrolled",
        description: course?.price ? "Please complete the payment to access all materials." : "You now have full access to the course.",
      });
      
      if (course?.price) {
        // Redirect to payment page if course is paid
        // window.location.href = `/checkout?courseId=${courseId}`;
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: "There was an error enrolling in this course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateLessonProgress = async (lessonId: number, progress: number) => {
    try {
      await apiRequest("POST", `/api/lessons/${lessonId}/progress`, {
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/enrollment`] });
    } catch (error) {
      console.error("Error updating lesson progress:", error);
    }
  };

  if (isCourseLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600">The course you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-6" asChild>
              <Link href="/courses">Back to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolled = enrollment && enrollment.id;
  const isPaid = isEnrolled && (enrollment.paymentStatus === "paid" || enrollment.paymentStatus === "free");

  return (
    <div className="p-4 md:p-6">
      {/* Course Header */}
      <div className="bg-white rounded-lg overflow-hidden shadow mb-6">
        <div className="h-48 md:h-64 bg-gray-200 relative">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h2 className="text-2xl font-bold">{course.title}</h2>
            </div>
          )}
          
          {/* Status Badge */}
          {(isMentor || isAdmin) && (
            <div className="absolute top-4 right-4">
              <Badge variant={course.isPublished ? "success" : "secondary"} className="text-sm px-3 py-1">
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-grow">
              <h1 className="text-2xl font-bold text-dark-800 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {course.category && (
                  <Badge variant="outline" className="text-sm">
                    {course.category}
                  </Badge>
                )}
                {course.tags && course.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Course stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <i className="ri-user-line mr-1"></i>
                  <span>{enrollment?.totalStudents || 0} students</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-book-open-line mr-1"></i>
                  <span>{modules?.length || 0} modules</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-time-line mr-1"></i>
                  <span>{enrollment?.totalDuration ? formatDuration(enrollment.totalDuration) : "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-calendar-line mr-1"></i>
                  <span>Last updated: {formatDate(course.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="md:w-72 w-full rounded-lg border border-gray-200 p-4">
              {course.price > 0 ? (
                <div className="text-2xl font-bold text-dark-800 mb-3">
                  {formatCurrency(course.price)}
                </div>
              ) : (
                <div className="text-lg font-medium text-green-600 mb-3">
                  Free Course
                </div>
              )}
              
              {isEnrolled ? (
                <div className="space-y-4">
                  {enrollment.progress < 100 ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Your progress</span>
                          <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                      <Button className="w-full" asChild>
                        <Link href={`/courses/${courseId}/learn`}>
                          Continue Learning
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center text-green-600 font-medium mb-2">
                        Course Completed
                      </div>
                      {enrollment.certificateId ? (
                        <Button variant="outline" className="w-full">
                          View Certificate
                        </Button>
                      ) : (
                        <Button className="w-full">
                          Get Certificate
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleEnroll}
                >
                  {course.price > 0 ? "Enroll Now" : "Start Learning"}
                </Button>
              )}
              
              {/* Mentors section */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Instructors:</h3>
                <div className="space-y-3">
                  {isMentorsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : mentors && mentors.length > 0 ? (
                    mentors.map(mentor => (
                      <div key={mentor.id} className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={mentor.profileImageUrl} />
                          <AvatarFallback>
                            {getInitials(`${mentor.firstName} ${mentor.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="ml-2 text-sm">
                          {mentor.firstName} {mentor.lastName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No instructors assigned</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          {/* Course modules & lessons */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Course Content</h2>
            </div>
            
            {isModulesLoading ? (
              <div className="p-6 animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : !modules || modules.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No content available for this course yet.</p>
                {(isMentor || isAdmin) && (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button>
                      Add Content
                    </Button>
                    <Link href={`/courses/${courseId}/exercises`}>
                      <Button variant="outline" className="w-full">
                        Manage Interactive Exercises
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setCurrentModuleId(module.id === currentModuleId ? null : module.id)}
                    >
                      <div>
                        <h3 className="text-md font-medium">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                        )}
                      </div>
                      <i className={`ri-arrow-${currentModuleId === module.id ? 'up' : 'down'}-s-line text-xl`}></i>
                    </div>
                    
                    {currentModuleId === module.id && (
                      <div className="mt-4 ml-4 space-y-2">
                        {isLessonsLoading ? (
                          <div className="animate-pulse space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-6 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                        ) : !lessons || lessons.length === 0 ? (
                          <p className="text-sm text-gray-500">No lessons in this module</p>
                        ) : (
                          lessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lesson.id} 
                              className={`flex justify-between items-center p-2 rounded hover:bg-gray-50 ${currentLessonId === lesson.id ? 'bg-gray-50' : ''}`}
                            >
                              <div className="flex items-center">
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs mr-3">
                                  {lessonIndex + 1}
                                </div>
                                <span className="text-sm">
                                  {lesson.title}
                                  {lesson.isLive && (
                                    <Badge variant="secondary" className="ml-2 text-xs">LIVE</Badge>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                {lesson.duration && (
                                  <span className="mr-3">{formatDuration(lesson.duration)}</span>
                                )}
                                <Button 
                                  size="sm" 
                                  variant={isPaid ? "default" : "outline"}
                                  onClick={() => {
                                    if (!isPaid) {
                                      toast({
                                        title: "Content locked",
                                        description: "Please enroll in this course to access the content.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    setCurrentLessonId(lesson.id);
                                  }}
                                  disabled={!isPaid && !isMentor && !isAdmin}
                                >
                                  {isPaid || isMentor || isAdmin ? "View" : "Locked"}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="discussions">
          <Card>
            <CardHeader>
              <CardTitle>Course Discussions</CardTitle>
              <CardDescription>
                Engage with fellow students and instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-gray-500">Discussion feature coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Course Announcements</CardTitle>
              <CardDescription>
                Important updates from your instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-gray-500">No announcements yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
              <CardDescription>
                See what others think about this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-gray-500">No reviews yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseView;

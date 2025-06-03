import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, BookOpen, FileText, Trophy, Clock, PlayCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface Course {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  progress: number;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  nextLesson?: {
    id: number;
    title: string;
    moduleTitle: string;
  };
}

interface Assignment {
  id: number;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

interface Quiz {
  id: number;
  title: string;
  courseTitle: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
}

interface RecentActivity {
  id: number;
  type: 'lesson_completed' | 'quiz_taken' | 'assignment_submitted';
  title: string;
  courseTitle: string;
  timestamp: string;
}

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: enrolledCourses, isLoading: coursesLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ['/api/student/enrolled-courses'],
    enabled: !!user && !authLoading,
    retry: 1,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError } = useQuery<Assignment[]>({
    queryKey: ['/api/student/assignments'],
    enabled: !!user && !authLoading,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  const { data: quizzes, isLoading: quizzesLoading, error: quizzesError } = useQuery<Quiz[]>({
    queryKey: ['/api/student/quizzes'],
    enabled: !!user && !authLoading,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery<RecentActivity[]>({
    queryKey: ['/api/student/recent-activity'],
    enabled: !!user && !authLoading,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  const pendingAssignments = assignments?.filter(a => a.status === 'pending') || [];
  const upcomingDeadlines = pendingAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const recentQuizzes = quizzes?.slice(0, 3) || [];
  const averageScore = quizzes?.length ? 
    Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / quizzes.length) : 0;

  // Show loading only if auth is loading or user is not authenticated yet
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cream-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show content loading state separately
  if (coursesLoading || assignmentsLoading || quizzesLoading || activityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cream-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cream-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Continue your learning journey
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrolledCourses?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingAssignments.length}
                  </p>
                  <p className="text-sm text-gray-600">Pending Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {averageScore}%
                  </p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentActivity?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Activities This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {enrolledCourses?.length === 0 ? (
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Enrolled Courses
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start your learning journey by enrolling in a course
                  </p>
                  <Link href="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledCourses?.map((course) => (
                  <Card key={course.id} className="border-0 shadow-md bg-white overflow-hidden">
                    <div className="aspect-video bg-gradient-to-r from-purple-400 to-purple-600 relative">
                      <img 
                        src={course.coverImage} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {course.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{course.completedLessons} of {course.totalLessons} lessons completed</span>
                          </div>
                        </div>

                        {course.nextLesson && (
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-purple-900 mb-1">
                              Next Lesson
                            </p>
                            <p className="text-sm text-purple-700">
                              {course.nextLesson.moduleTitle}: {course.nextLesson.title}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Link href={`/courses/${course.id}`} className="flex-1">
                            <Button className="w-full" variant="outline">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Continue Learning
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            {upcomingDeadlines.length > 0 && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2 text-orange-600" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingDeadlines.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.courseTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          Due {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-orange-600">
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-md bg-white">
              <CardHeader>
                <CardTitle>All Assignments</CardTitle>
                <CardDescription>Track your assignment progress</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments?.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{assignment.courseTitle}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {assignment.score && (
                            <span className="text-sm font-medium">
                              {assignment.score}%
                            </span>
                          )}
                          <Badge 
                            variant={assignment.status === 'graded' ? 'default' : 'outline'}
                            className={
                              assignment.status === 'graded' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <Card className="border-0 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>Your recent quiz results</CardDescription>
              </CardHeader>
              <CardContent>
                {recentQuizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No quizzes completed yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                          <p className="text-sm text-gray-600">{quiz.courseTitle}</p>
                          {quiz.completedAt && (
                            <p className="text-xs text-gray-500">
                              Completed: {new Date(quiz.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {quiz.score && (
                            <span className="text-lg font-bold text-gray-900">
                              {quiz.score}%
                            </span>
                          )}
                          {quiz.passed !== undefined && (
                            <Badge 
                              variant={quiz.passed ? 'default' : 'destructive'}
                              className={quiz.passed ? 'bg-green-100 text-green-800' : ''}
                            >
                              {quiz.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your learning activity timeline</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity?.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity?.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-full">
                          {activity.type === 'lesson_completed' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                          {activity.type === 'quiz_taken' && <Trophy className="h-4 w-4 text-purple-600" />}
                          {activity.type === 'assignment_submitted' && <FileText className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <p className="text-sm text-gray-600">{activity.courseTitle}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
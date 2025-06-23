import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookOpen, Trophy, Clock, PlayCircle, CheckCircle2, Code2, Brain, TrendingUp, Calendar, MessageCircle, Award, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Course {
  id: number;
  title: string;
  description: string;
  coverImage?: string;
  progress?: number;
  instructor?: string;
  totalLessons?: number;
  completedLessons?: number;
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

export default function StableStudentDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use fallback user data if authentication is failing
  const currentUser = user || {
    id: 'demo-student',
    firstName: 'Demo',
    lastName: 'Student',
    email: 'demo@example.com',
    role: 'student'
  };

  // Fetch real data from backend APIs
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/student/enrolled-courses'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/student/assignments'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/student/quizzes'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['/api/student/recent-activity'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch all available courses to show non-enrolled ones
  const { data: allCourses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: !isLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Filter courses into enrolled and available with proper typing
  const enrolledCourseIds = new Set(enrolledCourses.map(course => course.id));
  const availableCourses = (allCourses as any[]).filter((course: any) => !enrolledCourseIds.has(course.id));

  if (isLoading) {
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

  // Show loading state for data
  if (coursesLoading || assignmentsLoading || quizzesLoading || activityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cream-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser.firstName || 'Student'}! 👋
            </h1>
            <p className="text-xl text-gray-600">Loading your learning data...</p>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process real data for dashboard display
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length;
  const averageProgress = totalCourses > 0 
    ? Math.round(enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / totalCourses)
    : 0;

  const pendingAssignments = assignments.filter(a => a.status === 'pending') || [];
  const completedAssignments = assignments.filter(a => a.status === 'graded' || a.status === 'submitted') || [];
  
  const upcomingDeadlines = pendingAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const recentQuizzes = quizzes
    .filter(q => q.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3);

  const averageQuizScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / quizzes.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cream-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || 'Student'}! 👋
          </h1>
          <p className="text-xl text-gray-600">Ready to continue your learning journey?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setLocation('/coding-playground')}>
            <CardContent className="p-6 text-center">
              <Code2 className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Coding Playground</h3>
              <p className="text-sm text-purple-100">Practice coding skills</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setLocation('/courses')}>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Browse Courses</h3>
              <p className="text-sm text-blue-100">Discover new content</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setLocation('/assignments')}>
            <CardContent className="p-6 text-center">
              <CalendarDays className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Assignments</h3>
              <p className="text-sm text-green-100">Check deadlines</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setLocation('/quizzes')}>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Quizzes</h3>
              <p className="text-sm text-yellow-100">Test knowledge</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Assignments</CardTitle>
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pendingAssignments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{averageQuizScore}%</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Learning Level</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-gray-900">
                  Level {Math.floor(completedCourses + averageQuizScore / 20)}
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {averageQuizScore >= 80 ? 'Expert' : averageQuizScore >= 60 ? 'Advanced' : 'Beginner'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enrolled Courses */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">My Courses</CardTitle>
                <CardDescription>Continue where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg relative">
                      {/* Enrolled Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Enrolled
                        </Badge>
                      </div>
                      
                      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {course.instructor}</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={course.progress} className="flex-1" />
                          <span className="text-sm text-gray-600">{course.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </p>
                        {course.nextLesson && (
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => setLocation(`/courses/${course.id}/lessons/${course.nextLesson?.id}`)}
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Continue: {course.nextLesson.title}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No enrolled courses yet</p>
                    <p className="text-sm">Browse available courses below to start learning</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Learning Assistant */}
            {enrolledCourses.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg mt-6">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg text-gray-900">Smart Learning Assistant</CardTitle>
                  </div>
                  <CardDescription>Personalized suggestions based on your progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enrolledCourses.some(c => c.progress === 100) && (
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Course completed!</p>
                        <p className="text-sm text-gray-600">Ready for a quiz to test your knowledge?</p>
                      </div>
                    </div>
                  )}
                  {averageQuizScore > 0 && averageQuizScore < 70 && (
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                      <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Practice recommended</p>
                        <p className="text-sm text-gray-600">Your quiz scores suggest reviewing fundamentals</p>
                      </div>
                    </div>
                  )}
                  {enrolledCourses.some(c => c.progress > 50 && c.progress < 100) && (
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                      <PlayCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Great progress!</p>
                        <p className="text-sm text-gray-600">Complete the next lesson to maintain momentum</p>
                      </div>
                    </div>
                  )}
                  {pendingAssignments.length > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                      <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Deadlines approaching</p>
                        <p className="text-sm text-gray-600">
                          {pendingAssignments.length} assignment{pendingAssignments.length > 1 ? 's' : ''} due soon
                        </p>
                      </div>
                    </div>
                  )}
                  {averageQuizScore >= 80 && (
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                      <Award className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Excellent performance!</p>
                        <p className="text-sm text-gray-600">Consider exploring advanced courses</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Available Courses Section */}
            {availableCourses.length > 0 && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg mt-8">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Available Courses</CardTitle>
                  <CardDescription>Discover new courses to expand your skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableCourses.slice(0, 3).map((course: any) => (
                    <div key={course.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg relative">
                      {/* Available Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Available
                        </Badge>
                      </div>
                      
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {course.price > 0 ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                ₦{course.price.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Free
                              </Badge>
                            )}
                            {course.category && (
                              <Badge variant="outline" className="text-xs">
                                {course.category}
                              </Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                            onClick={() => setLocation(`/courses/${course.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableCourses.length > 3 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/courses')}
                        className="w-full"
                      >
                        View All {availableCourses.length} Available Courses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interactive Calendar */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg text-gray-900">Learning Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mini Calendar */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`day-${index}`} className="text-center font-medium text-gray-500 p-1">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    const currentDay = date.getDate();
                    const dayNumber = i - 5 + currentDay; // Rough calendar approximation
                    const isToday = dayNumber === currentDay;
                    const hasDeadline = upcomingDeadlines.some(a => 
                      new Date(a.dueDate).getDate() === dayNumber
                    );
                    
                    return (
                      <div 
                        key={i} 
                        className={`text-center p-1 rounded text-xs ${
                          isToday ? 'bg-purple-600 text-white font-bold' : 
                          hasDeadline ? 'bg-orange-100 text-orange-800' :
                          dayNumber > 0 && dayNumber <= 31 ? 'hover:bg-gray-100 cursor-pointer' : 
                          'text-gray-300'
                        }`}
                      >
                        {dayNumber > 0 && dayNumber <= 31 ? dayNumber : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Upcoming Events */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Upcoming Events</h4>
                  {upcomingDeadlines.length > 0 ? upcomingDeadlines.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-orange-600">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-500 text-center py-2">No upcoming deadlines</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visual Progress Analytics */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg text-gray-900">Learning Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quiz Score Trend */}
                {recentQuizzes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Quiz Performance Trend</h4>
                    <div className="flex items-end space-x-2 h-24">
                      {recentQuizzes.slice(0, 5).map((quiz, index) => (
                        <div key={quiz.id} className="flex flex-col items-center flex-1">
                          <div 
                            className="bg-gradient-to-t from-green-500 to-green-400 rounded-t w-full transition-all duration-300"
                            style={{ height: `${(quiz.score || 0)}%` }}
                          />
                          <div className="text-xs text-gray-600 mt-1 text-center">
                            {quiz.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Course Progress Overview */}
                {enrolledCourses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Course Completion</h4>
                    <div className="space-y-2">
                      {enrolledCourses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span className="truncate">{course.title}</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Insights */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Performance Insights</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="font-bold text-blue-600">{averageProgress}%</div>
                      <div className="text-xs text-gray-600">Avg Progress</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-bold text-green-600">{averageQuizScore}%</div>
                      <div className="text-xs text-gray-600">Quiz Average</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Center */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg text-gray-900">Message Center</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setLocation('/conversations')} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Chat with Mentors
                </Button>
                
                {/* Quick mentor contact for enrolled courses */}
                {enrolledCourses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Quick Contact</h4>
                    {enrolledCourses.slice(0, 2).map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{course.title}</p>
                          <p className="text-xs text-gray-600">Instructor: {course.instructor}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs px-2 py-1"
                          onClick={() => setLocation('/conversations')}
                        >
                          Message
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Achievement Badges */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Recent Achievements</h4>
                  <div className="flex flex-wrap gap-1">
                    {completedCourses > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        Course Completed
                      </Badge>
                    )}
                    {averageQuizScore >= 80 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        High Achiever
                      </Badge>
                    )}
                    {enrolledCourses.length >= 3 && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Knowledge Seeker
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
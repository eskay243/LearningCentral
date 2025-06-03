import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookOpen, Trophy, Clock, PlayCircle, CheckCircle2 } from "lucide-react";

export default function StableStudentDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
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

  // Static demo data to show dashboard functionality
  const enrolledCourses = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Learn the basics of JavaScript programming",
      coverImage: "/api/placeholder/300/200",
      progress: 65,
      instructor: "Sarah Johnson",
      totalLessons: 24,
      completedLessons: 15,
      nextLesson: {
        id: 16,
        title: "Async Programming",
        moduleTitle: "Advanced Concepts"
      }
    },
    {
      id: 2,
      title: "React Development",
      description: "Build modern web applications with React",
      coverImage: "/api/placeholder/300/200",
      progress: 40,
      instructor: "Mike Chen",
      totalLessons: 30,
      completedLessons: 12,
      nextLesson: {
        id: 13,
        title: "State Management",
        moduleTitle: "React Hooks"
      }
    },
    {
      id: 3,
      title: "Node.js Backend",
      description: "Server-side development with Node.js",
      coverImage: "/api/placeholder/300/200",
      progress: 25,
      instructor: "David Wilson",
      totalLessons: 20,
      completedLessons: 5,
      nextLesson: {
        id: 6,
        title: "Express Routing",
        moduleTitle: "Web Framework"
      }
    }
  ];

  const assignments = [
    {
      id: 1,
      title: "Build a Todo App",
      courseTitle: "JavaScript Fundamentals",
      dueDate: "2025-06-10",
      status: 'pending' as const,
    },
    {
      id: 2,
      title: "React Component Library",
      courseTitle: "React Development",
      dueDate: "2025-06-15",
      status: 'pending' as const,
    },
    {
      id: 3,
      title: "REST API Project",
      courseTitle: "Node.js Backend",
      dueDate: "2025-06-20",
      status: 'submitted' as const,
      score: 85
    }
  ];

  const quizzes = [
    {
      id: 1,
      title: "JavaScript Basics Quiz",
      courseTitle: "JavaScript Fundamentals",
      completedAt: "2025-06-01",
      score: 92,
      passed: true
    },
    {
      id: 2,
      title: "React Hooks Quiz",
      courseTitle: "React Development",
      completedAt: "2025-05-28",
      score: 78,
      passed: true
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'lesson_completed' as const,
      title: "Arrow Functions",
      courseTitle: "JavaScript Fundamentals",
      timestamp: "2025-06-03T10:30:00Z"
    },
    {
      id: 2,
      type: 'quiz_taken' as const,
      title: "JavaScript Basics Quiz",
      courseTitle: "JavaScript Fundamentals",
      timestamp: "2025-06-01T14:20:00Z"
    }
  ];

  const pendingAssignments = assignments.filter(a => a.status === 'pending') || [];
  const upcomingDeadlines = pendingAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const recentQuizzes = quizzes.slice(0, 3) || [];
  const averageScore = quizzes.length ? 
    Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / quizzes.length) : 0;

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
              <div className="text-2xl font-bold text-gray-900">{averageScore}%</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Study Streak</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">12 days</div>
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
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
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
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Continue: {course.nextLesson.title}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
                      <p className="text-xs text-gray-600">{assignment.courseTitle}</p>
                      <p className="text-xs text-orange-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      {assignment.status}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Quiz Results */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Recent Quiz Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentQuizzes.length > 0 ? recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{quiz.title}</h4>
                      <p className="text-xs text-gray-600">{quiz.courseTitle}</p>
                      <p className="text-xs text-gray-500">
                        {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : 'Not completed'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{quiz.score}%</div>
                      {quiz.passed && <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent quizzes</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length > 0 ? recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === 'lesson_completed' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'quiz_taken' && <Trophy className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'assignment_submitted' && <CalendarDays className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.courseTitle}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  ClipboardCheck, 
  Users, 
  Award, 
  TrendingUp, 
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  Target,
  Star,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

interface AssessmentStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  topPerformers: any[];
  strugglingStudents: any[];
}

interface StudentProgress {
  overallProgress: number;
  completedQuizzes: number;
  totalQuizzes: number;
  averageQuizScore: number;
  completedAssignments: number;
  totalAssignments: number;
  currentGrade: number;
  isOnTrack: boolean;
}

export default function AssessmentDashboard() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: assessmentStats } = useQuery<AssessmentStats>({
    queryKey: ["/api/analytics/assessment-overview", selectedCourse],
    enabled: !!selectedCourse,
  });

  const { data: myProgress } = useQuery<StudentProgress>({
    queryKey: ["/api/students/me/progress", selectedCourse],
    enabled: !!selectedCourse,
  });

  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes", selectedCourse],
    enabled: !!selectedCourse,
  });

  const { data: assignments } = useQuery({
    queryKey: ["/api/assignments", selectedCourse],
    enabled: !!selectedCourse,
  });

  const { data: certificates } = useQuery({
    queryKey: ["/api/certificates"],
  });

  const { data: peerReviews } = useQuery({
    queryKey: ["/api/peer-reviews/assigned"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cream-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment & Grading Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your progress, take quizzes, and manage assignments
          </p>
        </div>

        {/* Course Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Select Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(courses as any[])?.map((course) => (
                <Card 
                  key={course.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedCourse === course.id 
                      ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {course.level || "Beginner"}
                      </Badge>
                      <span className="text-sm text-purple-600 font-medium">
                        Select
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCourse && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="peer-review">Peer Review</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {myProgress?.overallProgress?.toFixed(1) || 0}%
                    </div>
                    <Progress 
                      value={myProgress?.overallProgress || 0} 
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {myProgress?.isOnTrack ? "On track" : "Behind schedule"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
                    <ClipboardCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {myProgress?.averageQuizScore?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {myProgress?.completedQuizzes || 0} of {myProgress?.totalQuizzes || 0} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Grade</CardTitle>
                    <Star className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {myProgress?.currentGrade?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Based on completed assessments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {myProgress?.completedAssignments || 0}/{myProgress?.totalAssignments || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Completed assignments
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common assessment tasks and tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href={`/quiz-builder?courseId=${selectedCourse}`}>
                      <Button className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                        <ClipboardCheck className="h-8 w-8" />
                        <span>Create Quiz</span>
                      </Button>
                    </Link>
                    <Link href={`/rubric-builder?courseId=${selectedCourse}`}>
                      <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                        <Target className="h-8 w-8" />
                        <span>Build Rubric</span>
                      </Button>
                    </Link>
                    <Link href={`/progress-analytics?courseId=${selectedCourse}`}>
                      <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                        <BarChart3 className="h-8 w-8" />
                        <span>View Analytics</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Activity items would be populated from API */}
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Quiz completed: JavaScript Fundamentals</p>
                        <p className="text-xs text-gray-500">Score: 85% • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Assignment submitted: React Project</p>
                        <p className="text-xs text-gray-500">Awaiting peer review • 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Quizzes</CardTitle>
                  <CardDescription>
                    Take quizzes to test your knowledge and track progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(quizzes as any[])?.map((quiz) => (
                      <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {quiz.description}
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                              {quiz.isPublished ? "Available" : "Draft"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {quiz.totalQuestions} questions
                            </span>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Time Limit:</span>
                              <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Passing Score:</span>
                              <span>{quiz.passingScore}%</span>
                            </div>
                          </div>
                          {quiz.isPublished && (
                            <Link href={`/quizzes/${quiz.id}/take`}>
                              <Button className="w-full mt-4">
                                Take Quiz
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>
                    Complete assignments and receive feedback through rubric-based grading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(assignments as any[])?.map((assignment) => (
                      <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {assignment.description}
                              </p>
                            </div>
                            <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Due Date:</span>
                              <p>{new Date(assignment.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Points:</span>
                              <p>{assignment.maxPoints}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Link href={`/assignments/${assignment.id}/submit`}>
                              <Button>Submit Assignment</Button>
                            </Link>
                            <Link href={`/assignments/${assignment.id}/rubric`}>
                              <Button variant="outline">View Rubric</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="peer-review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Peer Reviews
                  </CardTitle>
                  <CardDescription>
                    Review your peers' work and provide constructive feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(peerReviews as any[])?.length > 0 ? (
                      peerReviews.map((review) => (
                        <Card key={review.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Review Assignment: {review.assignmentTitle}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {review.isAnonymous ? "Anonymous review" : `Review for ${review.revieweeName}`}
                                </p>
                              </div>
                              <Badge variant={
                                review.status === "completed" ? "default" : 
                                review.status === "in_progress" ? "secondary" : "outline"
                              }>
                                {review.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Due: {new Date(review.deadline).toLocaleDateString()}
                              </span>
                              {review.status !== "completed" && (
                                <Link href={`/peer-reviews/${review.id}`}>
                                  <Button size="sm">
                                    {review.status === "assigned" ? "Start Review" : "Continue Review"}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No peer reviews assigned</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Certificates
                  </CardTitle>
                  <CardDescription>
                    View and download your earned certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(certificates as any[])?.length > 0 ? (
                      certificates.map((certificate) => (
                        <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Award className="h-8 w-8 text-yellow-600" />
                              <Badge variant={certificate.status === "active" ? "default" : "secondary"}>
                                {certificate.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{certificate.courseName}</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Student:</span>
                                <span>{certificate.studentName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completed:</span>
                                <span>{new Date(certificate.completionDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Grade:</span>
                                <span className="font-medium">{certificate.finalGrade}%</span>
                              </div>
                            </div>
                            <div className="flex space-x-2 mt-4">
                              <Button size="sm" className="flex-1">
                                Download
                              </Button>
                              <Button size="sm" variant="outline">
                                Verify
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No certificates earned yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Complete courses to earn certificates
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
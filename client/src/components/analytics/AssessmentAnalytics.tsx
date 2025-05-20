import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

// Color constants
const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7", "#ec4899"];
const PASS_FAIL_COLORS = ["#22c55e", "#ef4444"];

interface AssessmentAnalyticsProps {
  courseId?: number;
  userId?: string;
  isMentorView?: boolean;
}

export default function AssessmentAnalytics({ courseId, userId, isMentorView = false }: AssessmentAnalyticsProps) {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId ? courseId.toString() : "all");
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  
  // Fetch courses for dropdown selector
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch quiz analytics data
  const { data: quizStats, isLoading: isQuizStatsLoading } = useQuery({
    queryKey: [`/api/analytics/quizzes`, { courseId: selectedCourse !== "all" ? parseInt(selectedCourse) : undefined, userId }],
  });
  
  // Fetch assignment analytics data
  const { data: assignmentStats, isLoading: isAssignmentStatsLoading } = useQuery({
    queryKey: [`/api/analytics/assignments`, { courseId: selectedCourse !== "all" ? parseInt(selectedCourse) : undefined, userId }],
  });

  // If mentor view, fetch student performance data
  const { data: studentPerformance, isLoading: isStudentPerformanceLoading } = useQuery({
    queryKey: [`/api/analytics/student-performance`, { courseId: selectedCourse !== "all" ? parseInt(selectedCourse) : undefined }],
    enabled: !!isMentorView,
  });

  const isLoading = isQuizStatsLoading || isAssignmentStatsLoading || 
                   (isMentorView && isStudentPerformanceLoading) || 
                   isCoursesLoading;

  // Mock data for initial development
  const mockQuizStats = {
    attemptCount: 47,
    averageScore: 76.4,
    passRate: 0.78,
    scoreDistribution: [
      { range: "0-20", count: 2 },
      { range: "21-40", count: 5 },
      { range: "41-60", count: 8 },
      { range: "61-80", count: 15 },
      { range: "81-100", count: 17 },
    ],
    quizzesByDifficulty: [
      { difficulty: "Easy", avgScore: 85.2, count: 3 },
      { difficulty: "Medium", avgScore: 72.8, count: 5 },
      { difficulty: "Hard", avgScore: 61.5, count: 2 },
    ],
    passFailRatio: [
      { name: "Pass", value: 78 },
      { name: "Fail", value: 22 },
    ],
    recentAttempts: [
      { quizTitle: "JavaScript Basics", date: "2025-05-18", score: 85, passed: true },
      { quizTitle: "Advanced CSS", date: "2025-05-15", score: 72, passed: true },
      { quizTitle: "React Hooks", date: "2025-05-12", score: 45, passed: false },
    ]
  };

  const mockAssignmentStats = {
    submissionCount: 32,
    averageGrade: 82.6,
    onTimeSubmissionRate: 0.85,
    lateSubmissions: 5,
    gradeDistribution: [
      { range: "0-20", count: 1 },
      { range: "21-40", count: 2 },
      { range: "41-60", count: 5 },
      { range: "61-80", count: 10 },
      { range: "81-100", count: 14 },
    ],
    assignmentsByType: [
      { type: "Project", avgGrade: 85.5, count: 5 },
      { type: "Essay", avgGrade: 79.2, count: 3 },
      { type: "Exercise", avgGrade: 84.1, count: 7 },
    ],
    recentSubmissions: [
      { assignmentTitle: "Final Project", date: "2025-05-19", grade: 95, status: "graded" },
      { assignmentTitle: "Database Design", date: "2025-05-16", grade: null, status: "pending" },
      { assignmentTitle: "UX Critique", date: "2025-05-10", grade: 78, status: "graded" },
    ]
  };

  const mockStudentPerformance = {
    studentCount: 25,
    completionRate: 0.68,
    averageScore: 74.2,
    topPerformers: [
      { name: "Emma Johnson", score: 94.5, completed: 12, total: 15 },
      { name: "Michael Chen", score: 91.2, completed: 15, total: 15 },
      { name: "Sarah Williams", score: 89.8, completed: 14, total: 15 },
    ],
    needsImprovement: [
      { name: "James Wilson", score: 58.3, completed: 7, total: 15 },
      { name: "Olivia Rodriguez", score: 62.1, completed: 9, total: 15 },
      { name: "David Kim", score: 65.7, completed: 8, total: 15 },
    ],
    assessmentCompletion: [
      { name: "Completed", value: 68 },
      { name: "Incomplete", value: 32 },
    ]
  };

  // Use real data when available, otherwise use mock data
  const quizAnalytics = quizStats || mockQuizStats;
  const assignmentAnalytics = assignmentStats || mockAssignmentStats;
  const studentAnalytics = studentPerformance || mockStudentPerformance;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Assessment Analytics</h2>
          <p className="text-gray-500">
            {isMentorView 
              ? "Monitor student performance and identify areas for improvement" 
              : "Track your progress and performance on assessments"}
          </p>
        </div>

        <Select
          value={selectedCourse}
          onValueChange={setSelectedCourse}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {(courses || []).map((course: any) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Overall Quiz Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Score:</span>
                      <span className="font-medium">{quizAnalytics.averageScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Pass Rate:</span>
                      <span className="font-medium">{Math.round(quizAnalytics.passRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Attempts:</span>
                      <span className="font-medium">{quizAnalytics.attemptCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Assignment Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Assignment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Grade:</span>
                      <span className="font-medium">{assignmentAnalytics.averageGrade}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">On-time Rate:</span>
                      <span className="font-medium">{Math.round(assignmentAnalytics.onTimeSubmissionRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Submissions:</span>
                      <span className="font-medium">{assignmentAnalytics.submissionCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pass/Fail Ratio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Assessment Status</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quizAnalytics.passFailRatio}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {quizAnalytics.passFailRatio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PASS_FAIL_COLORS[index % PASS_FAIL_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Distribution of scores across all assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quizAnalytics.scoreDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Attempts" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Performance (Mentor View Only) */}
          {isMentorView && (
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Analysis of student assessment completion and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-gray-500">Students</div>
                        <div className="text-2xl font-bold">{studentAnalytics.studentCount}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-gray-500">Completion Rate</div>
                        <div className="text-2xl font-bold">{Math.round(studentAnalytics.completionRate * 100)}%</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-gray-500">Average Score</div>
                        <div className="text-2xl font-bold">{studentAnalytics.averageScore.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Top Performers</h3>
                        <div className="space-y-2">
                          {studentAnalytics.topPerformers.map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-2 border-b">
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">
                                  {student.completed}/{student.total} completed
                                </div>
                              </div>
                              <div className="text-xl font-bold text-green-600">{student.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Needs Improvement</h3>
                        <div className="space-y-2">
                          {studentAnalytics.needsImprovement.map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-2 border-b">
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">
                                  {student.completed}/{student.total} completed
                                </div>
                              </div>
                              <div className="text-xl font-bold text-red-500">{student.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Score Distribution</CardTitle>
                <CardDescription>Breakdown of scores across all quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={quizAnalytics.scoreDistribution}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Number of Attempts" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Performance by Difficulty */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
                <CardDescription>Average scores across different difficulty levels</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={quizAnalytics.quizzesByDifficulty}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="difficulty" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgScore" name="Average Score (%)" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Quiz Attempts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
              <CardDescription>Your most recent quiz submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Quiz</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Score</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizAnalytics.recentAttempts.map((attempt, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{attempt.quizTitle}</td>
                          <td className="py-3 px-4">{attempt.date}</td>
                          <td className="py-3 px-4">{attempt.score}%</td>
                          <td className="py-3 px-4">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {attempt.passed ? "Passed" : "Failed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Grade Distribution</CardTitle>
                <CardDescription>Breakdown of grades across all assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={assignmentAnalytics.gradeDistribution}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Number of Submissions" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Performance by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Type</CardTitle>
                <CardDescription>Average grades across different assignment types</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={assignmentAnalytics.assignmentsByType}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgGrade" name="Average Grade (%)" fill="#FFBB28" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Assignment Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assignment Submissions</CardTitle>
              <CardDescription>Your most recent assignment submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Assignment</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Grade</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentAnalytics.recentSubmissions.map((submission, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{submission.assignmentTitle}</td>
                          <td className="py-3 px-4">{submission.date}</td>
                          <td className="py-3 px-4">{submission.grade !== null ? `${submission.grade}%` : '-'}</td>
                          <td className="py-3 px-4">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                submission.status === 'graded' 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {submission.status === 'graded' ? "Graded" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
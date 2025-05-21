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
const CHART_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#ec4899"];
const PASS_FAIL_COLORS = ["#22c55e", "#ef4444"];
const LIGHT_CHART_BACKGROUND = "#ffffff";
const DARK_CHART_BACKGROUND = "#1e293b";

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assessment Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isMentorView 
              ? "Monitor student performance and identify areas for improvement" 
              : "Track your progress and performance on assessments"}
          </p>
        </div>

        <Select
          value={selectedCourse}
          onValueChange={setSelectedCourse}
        >
          <SelectTrigger className="w-[220px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800">
            <SelectItem value="all">All Courses</SelectItem>
            {(courses || []).map((course: any) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:w-[400px] bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-sm font-medium">Quizzes</TabsTrigger>
          <TabsTrigger value="assignments" className="text-sm font-medium">Assignments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overall Quiz Performance */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Quiz Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Average Score</span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{quizAnalytics.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Pass Rate</span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">{Math.round(quizAnalytics.passRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total Attempts</span>
                      <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">{quizAnalytics.attemptCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Assignment Performance */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="text-lg text-green-700 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Assignment Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Average Grade</span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">{assignmentAnalytics.averageGrade}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">On-time Rate</span>
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">{Math.round(assignmentAnalytics.onTimeSubmissionRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total Submissions</span>
                      <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">{assignmentAnalytics.submissionCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pass/Fail Ratio */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="text-lg text-purple-700 dark:text-purple-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Assessment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quizAnalytics.passFailRatio}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={8}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {quizAnalytics.passFailRatio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PASS_FAIL_COLORS[index % PASS_FAIL_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px',
                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Distribution */}
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
              <CardTitle className="text-lg text-indigo-700 dark:text-indigo-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Score Distribution
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Distribution of scores across all assessments</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quizAnalytics.scoreDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="range" 
                        tick={{ fill: '#64748b' }}
                        tickLine={{ stroke: '#64748b' }}
                        axisLine={{ stroke: '#94a3b8' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b' }}
                        tickLine={{ stroke: '#64748b' }}
                        axisLine={{ stroke: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '8px',
                          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Bar 
                        dataKey="count" 
                        name="Number of Attempts" 
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Performance (Mentor View Only) */}
          {isMentorView && (
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Student Performance
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Analysis of student assessment completion and scores</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">Total Students</div>
                        </div>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">{studentAnalytics.studentCount}</div>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">Completion Rate</div>
                        </div>
                        <div className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">{Math.round(studentAnalytics.completionRate * 100)}%</div>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">Average Score</div>
                        </div>
                        <div className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-2">{studentAnalytics.averageScore.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          Top Performers
                        </h3>
                        <div className="space-y-3">
                          {studentAnalytics.topPerformers.map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-md transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800 dark:text-slate-200">{student.name}</div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {student.completed}/{student.total} completed
                                  </div>
                                </div>
                              </div>
                              <div className="text-xl font-bold text-green-600 dark:text-green-400">{student.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Needs Improvement
                        </h3>
                        <div className="space-y-3">
                          {studentAnalytics.needsImprovement.map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-md transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800 dark:text-slate-200">{student.name}</div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {student.completed}/{student.total} completed
                                  </div>
                                </div>
                              </div>
                              <div className="text-xl font-bold text-red-500 dark:text-red-400">{student.score}%</div>
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
        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="text-lg text-indigo-700 dark:text-indigo-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Quiz Score Distribution
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Breakdown of scores across all quizzes</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={quizAnalytics.scoreDistribution}
                        margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="range" 
                          tick={{ fill: '#64748b' }}
                          tickLine={{ stroke: '#64748b' }}
                          axisLine={{ stroke: '#94a3b8' }}
                        />
                        <YAxis 
                          tick={{ fill: '#64748b' }}
                          tickLine={{ stroke: '#64748b' }}
                          axisLine={{ stroke: '#94a3b8' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            borderRadius: '8px',
                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="count" 
                          name="Number of Attempts" 
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
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
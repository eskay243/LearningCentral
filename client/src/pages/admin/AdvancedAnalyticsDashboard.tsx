import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, LineChart, PieChart, TrendingUp, Users, BookOpen, Award, Download, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdvancedAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Fetch quiz analytics
  const { data: quizAnalytics, isLoading: quizLoading } = useQuery({
    queryKey: ["/api/analytics/quizzes", selectedTimeRange, selectedCourse],
    queryFn: () => apiRequest("GET", `/api/analytics/quizzes?timeRange=${selectedTimeRange}&courseId=${selectedCourse !== 'all' ? selectedCourse : ''}`).then(res => res.json()),
  });

  // Fetch course completion analytics
  const { data: completionAnalytics, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/analytics/course-completion", selectedTimeRange, selectedCourse],
    queryFn: () => apiRequest("GET", `/api/analytics/course-completion?timeRange=${selectedTimeRange}&courseId=${selectedCourse !== 'all' ? selectedCourse : ''}`).then(res => res.json()),
  });

  // Fetch dashboard overview
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: () => apiRequest("GET", "/api/analytics/dashboard").then(res => res.json()),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const exportAnalytics = async (type: string, format: string) => {
    try {
      const response = await apiRequest("POST", "/api/analytics/export", {
        type,
        format,
        filters: {
          timeRange: selectedTimeRange,
          courseId: selectedCourse !== 'all' ? selectedCourse : null
        }
      });
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (quizLoading || completionLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into learning performance and engagement</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="1">Web Development</SelectItem>
              <SelectItem value="2">Java Programming</SelectItem>
              <SelectItem value="3">Data Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quiz Attempts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.quizAnalytics?.totalAttempts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.quizAnalytics?.averageScore || 0}% average score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.completionAnalytics?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.completionAnalytics?.totalEnrollments || 0} total enrollments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Pass Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.quizAnalytics?.passRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Students passing quizzes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.completionAnalytics?.averageCompletionTime || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Average course completion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="quiz-analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quiz-analytics">Quiz Analytics</TabsTrigger>
          <TabsTrigger value="completion-analytics">Course Completion</TabsTrigger>
          <TabsTrigger value="student-insights">Student Insights</TabsTrigger>
        </TabsList>

        {/* Quiz Analytics Tab */}
        <TabsContent value="quiz-analytics" className="space-y-6">
          {quizAnalytics && (
            <>
              {/* Quiz Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Quiz Performance Overview</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportAnalytics('quiz', 'csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{quizAnalytics.overview.totalQuizzes}</div>
                        <div className="text-sm text-gray-600">Total Quizzes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{quizAnalytics.overview.averageScore}%</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{quizAnalytics.overview.passRate}%</div>
                        <div className="text-sm text-gray-600">Pass Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{quizAnalytics.overview.completionRate}%</div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Excellent (90-100%)</span>
                        <Badge variant="default">{quizAnalytics.performanceMetrics.scoreDistribution.excellent}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Good (75-89%)</span>
                        <Badge variant="secondary">{quizAnalytics.performanceMetrics.scoreDistribution.good}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average (60-74%)</span>
                        <Badge variant="outline">{quizAnalytics.performanceMetrics.scoreDistribution.average}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Needs Improvement (&lt;60%)</span>
                        <Badge variant="destructive">{quizAnalytics.performanceMetrics.scoreDistribution.poor}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Progress Chart */}
              {quizAnalytics.trendsAndInsights.weeklyProgress && (
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center">
                      <div className="grid grid-cols-4 gap-4 w-full">
                        {quizAnalytics.trendsAndInsights.weeklyProgress.map((week: any, index: number) => (
                          <div key={index} className="text-center">
                            <div className="text-lg font-semibold">{week.week}</div>
                            <div className="text-sm text-gray-600">{week.attempts} attempts</div>
                            <div className="text-sm font-medium text-green-600">{week.averageScore}% avg</div>
                            <Progress value={week.passRate} className="mt-2" />
                            <div className="text-xs text-gray-500">{week.passRate}% pass rate</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Performing Quizzes */}
              {quizAnalytics.trendsAndInsights.topPerformingQuizzes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Quizzes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {quizAnalytics.trendsAndInsights.topPerformingQuizzes.map((quiz: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{quiz.title}</div>
                            <div className="text-sm text-gray-600">{quiz.totalAttempts} attempts</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">{quiz.averageScore}%</div>
                            <Badge variant={quiz.difficulty === 'Easy' ? 'default' : quiz.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                              {quiz.difficulty}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Course Completion Analytics Tab */}
        <TabsContent value="completion-analytics" className="space-y-6">
          {completionAnalytics && (
            <>
              {/* Completion Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Enrollments</span>
                        <span className="font-semibold">{completionAnalytics.overview.totalEnrollments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completed Courses</span>
                        <span className="font-semibold text-green-600">{completionAnalytics.overview.completedCourses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>In Progress</span>
                        <span className="font-semibold text-blue-600">{completionAnalytics.overview.inProgress}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Not Started</span>
                        <span className="font-semibold text-gray-600">{completionAnalytics.overview.notStarted}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span>Overall Completion Rate</span>
                          <span className="font-semibold text-lg">{completionAnalytics.overview.overallCompletionRate}%</span>
                        </div>
                        <Progress value={completionAnalytics.overview.overallCompletionRate} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(completionAnalytics.progressDistribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm">{range}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count as number / completionAnalytics.overview.totalEnrollments) * 100} 
                              className="w-20" 
                            />
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              {completionAnalytics.monthlyTrends && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Completion Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {completionAnalytics.monthlyTrends.map((month: any, index: number) => (
                        <div key={index} className="text-center p-3 border rounded-lg">
                          <div className="text-sm font-medium">{month.month}</div>
                          <div className="text-lg font-bold text-blue-600">{month.enrollments}</div>
                          <div className="text-xs text-gray-600">Enrollments</div>
                          <div className="text-lg font-bold text-green-600">{month.completions}</div>
                          <div className="text-xs text-gray-600">Completions</div>
                          <div className="text-sm font-medium text-purple-600">{month.completionRate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Student Insights Tab */}
        <TabsContent value="student-insights" className="space-y-6">
          {quizAnalytics?.studentInsights && (
            <>
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quizAnalytics.studentInsights.topPerformers.map((student: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-600">{student.totalAttempts} quiz attempts</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">{student.averageScore}%</div>
                          <div className="text-sm text-gray-600">Best: {student.bestScore}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Students Needing Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Students Needing Help
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quizAnalytics.studentInsights.needsHelp.map((student: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-600">
                            {student.strugglingAreas?.join(', ') || 'General difficulties'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-600">{student.averageScore}%</div>
                          <Badge variant="destructive">Needs Support</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {quizAnalytics.studentInsights.engagementMetrics.activeStudents}
                      </div>
                      <div className="text-sm text-gray-600">Active Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {quizAnalytics.studentInsights.engagementMetrics.averageAttemptsPerStudent}
                      </div>
                      <div className="text-sm text-gray-600">Avg. Attempts per Student</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {quizAnalytics.studentInsights.engagementMetrics.retakeRate}%
                      </div>
                      <div className="text-sm text-gray-600">Retake Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
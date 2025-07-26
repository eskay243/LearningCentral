import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Trophy,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  DollarSign,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompletionStats {
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  certificatesIssued: number;
  averageCompletionTime: number;
  completionRate: number;
  topPerformers: StudentPerformance[];
  recentCompletions: RecentCompletion[];
}

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  coursesCompleted: number;
  averageScore: number;
  totalStudyHours: number;
  completionRate: number;
  badges: string[];
}

interface RecentCompletion {
  id: string;
  studentName: string;
  courseName: string;
  completedAt: string;
  finalScore: number;
  certificateGenerated: boolean;
  mentorCommission: number;
}

interface MentorEarnings {
  totalEarnings: number;
  currentMonthEarnings: number;
  completionBonuses: number;
  pendingPayouts: number;
  avgCommissionPerCompletion: number;
  topCourses: Array<{
    courseId: string;
    courseName: string;
    completions: number;
    earnings: number;
  }>;
}

export default function CourseCompletionDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [autoGeneCertificates, setAutoGeneCertificates] = useState(true);

  // Fetch completion statistics
  const { data: completionStats } = useQuery<CompletionStats>({
    queryKey: [`/api/course-completion/stats`, selectedTimeRange],
    enabled: !!user && (user.role === 'admin' || user.role === 'mentor'),
  });

  // Fetch mentor earnings if user is a mentor
  const { data: mentorEarnings } = useQuery<MentorEarnings>({
    queryKey: [`/api/mentor/earnings`, selectedTimeRange],
    enabled: !!user && user.role === 'mentor',
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: (data: { studentId: string; courseId: string }) =>
      apiRequest("POST", "/api/certificates/generate", data),
    onSuccess: () => {
      toast({
        title: "Certificate Generated",
        description: "The certificate has been successfully generated and sent to the student.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-completion/stats"] });
    },
  });

  // Process bulk completions mutation
  const processBulkCompletionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/course-completion/process-bulk"),
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Processing Complete",
        description: `Processed ${data.processedCount} completions and generated ${data.certificatesGenerated} certificates.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-completion/stats"] });
    },
  });

  // Auto-generate certificates toggle
  const toggleAutoGeneration = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest("POST", "/api/course-completion/auto-certificates", { enabled }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Auto-certificate generation settings have been updated.",
      });
    },
  });

  if (!user || (user.role !== 'admin' && user.role !== 'mentor')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view the completion dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Completion Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin' ? 'Monitor completion rates and manage certificates' : 'Track your student completions and earnings'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {user.role === 'admin' && (
            <>
              <Button
                onClick={() => processBulkCompletionsMutation.mutate()}
                disabled={processBulkCompletionsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Bulk Completions
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Completion Automation Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-generate Certificates</p>
                        <p className="text-sm text-gray-600">Automatically create certificates when students complete courses</p>
                      </div>
                      <Button
                        variant={autoGeneCertificates ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setAutoGeneCertificates(!autoGeneCertificates);
                          toggleAutoGeneration.mutate(!autoGeneCertificates);
                        }}
                      >
                        {autoGeneCertificates ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {completionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold">{completionStats.totalEnrollments.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Courses</p>
                  <p className="text-2xl font-bold">{completionStats.completedCourses.toLocaleString()}</p>
                </div>
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">{completionStats.completionRate.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Certificates Issued</p>
                  <p className="text-2xl font-bold">{completionStats.certificatesIssued.toLocaleString()}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="completions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="completions">Recent Completions</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
          {user.role === 'mentor' && <TabsTrigger value="earnings">Earnings Tracker</TabsTrigger>}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="completions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Course Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {completionStats?.recentCompletions.map((completion) => (
                    <div key={completion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{completion.studentName}</h3>
                          <p className="text-sm text-gray-600">{completion.courseName}</p>
                          <p className="text-xs text-gray-500">
                            Completed on {new Date(completion.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={completion.finalScore >= 80 ? "default" : "secondary"}>
                            {completion.finalScore}% Final Score
                          </Badge>
                          {completion.certificateGenerated ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Certified
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => generateCertificateMutation.mutate({
                                studentId: completion.id,
                                courseId: completion.id
                              })}
                              disabled={generateCertificateMutation.isPending}
                            >
                              Generate Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {user.role === 'mentor' && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            Commission: ₦{completion.mentorCommission.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {completionStats?.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{performer.name}</h3>
                            <p className="text-sm text-gray-600">{performer.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {performer.badges.map((badge, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{performer.coursesCompleted}</p>
                          <p className="text-xs text-gray-600">Courses Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{performer.averageScore.toFixed(1)}%</p>
                          <p className="text-xs text-gray-600">Average Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{performer.totalStudyHours}</p>
                          <p className="text-xs text-gray-600">Study Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{performer.completionRate}%</p>
                          <p className="text-xs text-gray-600">Completion Rate</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Performance</span>
                          <span className="font-medium">{performer.averageScore.toFixed(0)}%</span>
                        </div>
                        <Progress value={performer.averageScore} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'mentor' && (
          <TabsContent value="earnings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold">₦{mentorEarnings?.totalEarnings.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-2xl font-bold">₦{mentorEarnings?.currentMonthEarnings.toLocaleString()}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completion Bonuses</p>
                      <p className="text-2xl font-bold">₦{mentorEarnings?.completionBonuses.toLocaleString()}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Payouts</p>
                      <p className="text-2xl font-bold">₦{mentorEarnings?.pendingPayouts.toLocaleString()}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg per Completion</p>
                      <p className="text-2xl font-bold">₦{mentorEarnings?.avgCommissionPerCompletion.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Earning Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mentorEarnings?.topCourses.map((course, index) => (
                    <div key={course.courseId} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{course.courseName}</h3>
                          <p className="text-sm text-gray-600">{course.completions} completions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">₦{course.earnings.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">37% commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Week</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">+23%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">+15%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quarter</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">+8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {completionStats?.averageCompletionTime || 0} days
                    </p>
                    <p className="text-sm text-gray-600">Average Completion Time</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">89%</p>
                      <p className="text-xs text-gray-600">Complete on Time</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">11%</p>
                      <p className="text-xs text-gray-600">Extended Time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
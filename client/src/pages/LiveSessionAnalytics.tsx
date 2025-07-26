import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Video,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageCircle,
  HelpCircle,
  Calendar,
  Award,
  Star,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SessionAnalytics {
  id: number;
  title: string;
  scheduledAt: string;
  duration: number;
  attendanceRate: number;
  peakAttendance: number;
  avgWatchTime: number;
  chatMessages: number;
  questionsAsked: number;
  pollResponses: number;
  rating: number;
  completionRate: number;
}

interface OverallMetrics {
  totalSessions: number;
  totalAttendees: number;
  avgAttendanceRate: number;
  avgRating: number;
  totalWatchHours: number;
  engagementScore: number;
}

export default function LiveSessionAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");
  const [courseFilter, setCourseFilter] = useState("all");

  // Fetch analytics data
  const { data: analytics = [] } = useQuery<SessionAnalytics[]>({
    queryKey: [`/api/live-sessions/analytics`, timeRange, courseFilter],
    enabled: !!user && (user.role === 'mentor' || user.role === 'admin'),
  });

  const { data: overallMetrics } = useQuery<OverallMetrics>({
    queryKey: [`/api/live-sessions/metrics`, timeRange, courseFilter],
    enabled: !!user && (user.role === 'mentor' || user.role === 'admin'),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: !!user,
  });

  if (!user || (user.role !== 'mentor' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view live session analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Session Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track engagement, attendance, and performance metrics
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      {overallMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{overallMetrics.totalSessions}</p>
                </div>
                <Video className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendees</p>
                  <p className="text-2xl font-bold">{overallMetrics.totalAttendees.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold">{overallMetrics.avgAttendanceRate.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {overallMetrics.avgRating.toFixed(1)}
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Watch Hours</p>
                  <p className="text-2xl font-bold">{overallMetrics.totalWatchHours.toLocaleString()}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className={`text-2xl font-bold ${getEngagementColor(overallMetrics.engagementScore)}`}>
                    {overallMetrics.engagementScore.toFixed(0)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">Session Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {analytics.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.scheduledAt).toLocaleDateString()} • {session.duration} minutes
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < session.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">{session.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{session.attendanceRate}%</p>
                          <p className="text-xs text-gray-600">Attendance Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{session.peakAttendance}</p>
                          <p className="text-xs text-gray-600">Peak Attendance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{session.avgWatchTime}m</p>
                          <p className="text-xs text-gray-600">Avg Watch Time</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{session.completionRate}%</p>
                          <p className="text-xs text-gray-600">Completion Rate</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {session.chatMessages} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            {session.questionsAsked} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            {session.pollResponses} poll responses
                          </span>
                        </div>
                        <Badge variant={session.completionRate >= 80 ? "default" : "secondary"}>
                          {session.completionRate >= 80 ? "High Engagement" : "Needs Improvement"}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Engagement Score</span>
                          <span className={getEngagementColor((session.attendanceRate + session.completionRate) / 2)}>
                            {((session.attendanceRate + session.completionRate) / 2).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(session.attendanceRate + session.completionRate) / 2} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Chat Activity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Q&A Participation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Poll Responses</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Video Interaction</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">92%</p>
                    <p className="text-sm text-gray-600">Average Session Completion</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">68%</p>
                      <p className="text-xs text-gray-600">On-time Joiners</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">24%</p>
                      <p className="text-xs text-gray-600">Late Joiners</p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-600">8%</p>
                    <p className="text-xs text-gray-600">Early Leavers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Improvement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Attendance Rate</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">+12%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chat Engagement</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">+8%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Session Ratings</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">+15%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Peak Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Day</span>
                    <Badge variant="outline">Thursday</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Time</span>
                    <Badge variant="outline">2:00 PM</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Duration Sweet Spot</span>
                    <Badge variant="outline">45-60 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Highest Rated</span>
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">4.9★</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Interactive</span>
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">98% Eng</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Attendance</span>
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">95%</Badge>
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
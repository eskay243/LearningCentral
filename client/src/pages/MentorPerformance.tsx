import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Star, Clock, Target, BarChart3, Calendar, Award, Activity } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function MentorPerformance() {
  const [filters, setFilters] = useState({
    mentorId: "",
    year: new Date().getFullYear(),
    month: "",
    courseId: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch performance data
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["/api/admin/mentor-performance", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await apiRequest("GET", `/api/admin/mentor-performance?${params}`);
      return response.json();
    },
  });

  // Fetch mentors for dropdown
  const { data: mentors } = useQuery({
    queryKey: ["/api/admin/mentors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/mentors");
      return response.json();
    },
  });

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ["/api/courses/basic"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses/basic");
      return response.json();
    },
  });

  // Calculate performance metrics mutation
  const calculateMetricsMutation = useMutation({
    mutationFn: async (data: { mentorId: string; year: number; month: number }) => {
      const response = await apiRequest("POST", "/api/admin/mentor-performance/calculate", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-performance"] });
      toast({
        title: "Metrics Calculated",
        description: "Performance metrics have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate metrics",
        variant: "destructive",
      });
    },
  });

  const handleCalculateMetrics = () => {
    if (!filters.mentorId) {
      toast({
        title: "Mentor Required",
        description: "Please select a mentor to calculate metrics for.",
        variant: "destructive",
      });
      return;
    }

    calculateMetricsMutation.mutate({
      mentorId: filters.mentorId,
      year: filters.year,
      month: filters.month ? parseInt(filters.month) : new Date().getMonth() + 1,
    });
  };

  // Calculate aggregate metrics
  const aggregateMetrics = performanceData?.reduce((acc: any, item: any) => ({
    totalStudents: acc.totalStudents + (item.performance?.studentsEnrolled || 0),
    totalCompleted: acc.totalCompleted + (item.performance?.studentsCompleted || 0),
    totalEarnings: acc.totalEarnings + (item.performance?.totalEarnings || 0),
    totalSessions: acc.totalSessions + (item.performance?.liveSessionsHeld || 0),
    totalAssignments: acc.totalAssignments + (item.performance?.assignmentsGraded || 0),
    averageRating: acc.averageRating + (item.performance?.averageRating || 0),
    count: acc.count + 1,
  }), { totalStudents: 0, totalCompleted: 0, totalEarnings: 0, totalSessions: 0, totalAssignments: 0, averageRating: 0, count: 0 });

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Prepare chart data
  const chartData = performanceData?.map((item: any) => ({
    month: `${item.performance?.year}-${String(item.performance?.month).padStart(2, '0')}`,
    students: item.performance?.studentsEnrolled || 0,
    completed: item.performance?.studentsCompleted || 0,
    earnings: item.performance?.totalEarnings || 0,
    rating: item.performance?.averageRating || 0,
    completionRate: item.performance?.completionRate || 0,
  })) || [];

  const pieData = [
    { name: "Completed", value: aggregateMetrics?.totalCompleted || 0, color: "#22c55e" },
    { name: "In Progress", value: (aggregateMetrics?.totalStudents || 0) - (aggregateMetrics?.totalCompleted || 0), color: "#f59e0b" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Performance</h1>
          <p className="text-muted-foreground">Track and analyze mentor performance metrics</p>
        </div>
        <Button 
          onClick={handleCalculateMetrics}
          disabled={calculateMetricsMutation.isPending}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {calculateMetricsMutation.isPending ? "Calculating..." : "Calculate Metrics"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Mentor</label>
              <Select
                value={filters.mentorId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, mentorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All mentors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All mentors</SelectItem>
                  {mentors?.map((mentor: any) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.firstName} {mentor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                min="2020"
                max="2030"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Month</label>
              <Select
                value={filters.month}
                onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Course</label>
              <Select
                value={filters.courseId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, courseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All courses</SelectItem>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {aggregateMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalStudents}</div>
              <div className="flex items-center pt-1">
                <Progress 
                  value={aggregateMetrics.totalStudents > 0 ? (aggregateMetrics.totalCompleted / aggregateMetrics.totalStudents) * 100 : 0} 
                  className="w-full" 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {aggregateMetrics.totalCompleted} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{aggregateMetrics.totalEarnings?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Commission earnings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {aggregateMetrics.count > 0 ? (aggregateMetrics.averageRating / aggregateMetrics.count).toFixed(1) : "0.0"}
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= (aggregateMetrics.averageRating / aggregateMetrics.count || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalSessions + aggregateMetrics.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                {aggregateMetrics.totalSessions} sessions, {aggregateMetrics.totalAssignments} assignments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`₦${value?.toLocaleString()}`, "Earnings"]}
                    />
                    <Bar dataKey="earnings" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="students" stroke="#3b82f6" name="Enrolled" />
                    <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rating" stroke="#f59e0b" name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
              <CardDescription>
                Detailed performance metrics by mentor and period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : performanceData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">No performance data found</TableCell>
                      </TableRow>
                    ) : (
                      performanceData?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {item.mentor?.firstName} {item.mentor?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.mentor?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {item.course?.title || "All Courses"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.performance?.year, (item.performance?.month || 1) - 1), "MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.performance?.studentsEnrolled || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              {item.performance?.studentsCompleted || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{item.performance?.averageRating?.toFixed(1) || "0.0"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{item.performance?.totalEarnings?.toLocaleString() || "0"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={item.performance?.completionRate || 0} 
                                className="w-16" 
                              />
                              <span className="text-sm">
                                {Math.round(item.performance?.completionRate || 0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
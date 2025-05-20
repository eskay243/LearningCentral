import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import useAuth from "@/hooks/useAuth";

const Analytics = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState("30days");
  const [courseFilter, setCourseFilter] = useState("all");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: [isMentor ? `/api/analytics/mentor/${user?.id}` : "/api/analytics/admin", timeRange, courseFilter],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Mock analytics data
  const mockEnrollmentData = [
    { date: "Week 1", enrolled: 8 },
    { date: "Week 2", enrolled: 12 },
    { date: "Week 3", enrolled: 15 },
    { date: "Week 4", enrolled: 10 },
    { date: "Week 5", enrolled: 18 },
    { date: "Week 6", enrolled: 24 },
    { date: "Week 7", enrolled: 28 },
    { date: "Week 8", enrolled: 32 },
  ];

  const mockCompletionData = [
    { date: "Week 1", completion: 75 },
    { date: "Week 2", completion: 78 },
    { date: "Week 3", completion: 82 },
    { date: "Week 4", completion: 79 },
    { date: "Week 5", completion: 85 },
    { date: "Week 6", completion: 89 },
    { date: "Week 7", completion: 87 },
    { date: "Week 8", completion: 92 },
  ];

  const mockTimeSpentData = [
    { date: "Mon", minutes: 45 },
    { date: "Tue", minutes: 65 },
    { date: "Wed", minutes: 85 },
    { date: "Thu", minutes: 70 },
    { date: "Fri", minutes: 55 },
    { date: "Sat", minutes: 120 },
    { date: "Sun", minutes: 95 },
  ];

  const mockQuizScoresData = [
    { name: "90-100%", value: 15 },
    { name: "80-89%", value: 25 },
    { name: "70-79%", value: 18 },
    { name: "60-69%", value: 12 },
    { name: "Below 60%", value: 8 },
  ];

  const mockCourseData = [
    { name: "JavaScript", students: 120, completion: 75, avgScore: 82 },
    { name: "Python", students: 85, completion: 68, avgScore: 78 },
    { name: "SQL", students: 65, completion: 79, avgScore: 85 },
    { name: "React", students: 45, completion: 62, avgScore: 76 },
    { name: "Node.js", students: 35, completion: 70, avgScore: 80 },
  ];

  const mockCourses = [
    { id: "all", name: "All Courses" },
    { id: "javascript", name: "Advanced JavaScript Concepts" },
    { id: "python", name: "Python for Beginners" },
    { id: "sql", name: "SQL for Data Science" },
    { id: "react", name: "React Fundamentals" },
    { id: "nodejs", name: "Node.js Essentials" },
  ];

  // Colors for charts
  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B", "#6366F1"];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Analytics</h1>
        <p className="mt-1 text-gray-500">Monitor and analyze your course performance</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 3 Months</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            {mockCourses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold">247</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i className="ri-user-line text-2xl"></i>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>18% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-semibold">78%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <i className="ri-checkbox-circle-line text-2xl"></i>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Quiz Score</p>
                <p className="text-2xl font-semibold">82%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <i className="ri-file-list-3-line text-2xl"></i>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold">$12,480</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <i className="ri-money-dollar-circle-line text-2xl"></i>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>12% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enrollment Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
              <CardDescription>New student enrollments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockEnrollmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrolled" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Time Spent & Completion Rate Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Spent Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Average Time Spent</CardTitle>
                <CardDescription>Minutes spent per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockTimeSpentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="minutes" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trends</CardTitle>
                <CardDescription>Percentage of completed courses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockCompletionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completion" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Score Distribution</CardTitle>
              <CardDescription>Breakdown of student performance on quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockQuizScoresData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockQuizScoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Demographics</CardTitle>
              <CardDescription>Distribution of students by various metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age Group Chart */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Age Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "18-24", value: 35 },
                            { name: "25-34", value: 45 },
                            { name: "35-44", value: 15 },
                            { name: "45+", value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[...Array(4)].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Location Chart */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Geographic Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "North America", value: 40 },
                            { name: "Europe", value: 30 },
                            { name: "Asia", value: 20 },
                            { name: "Africa", value: 5 },
                            { name: "Other", value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[...Array(5)].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Student Engagement</CardTitle>
              <CardDescription>Activity patterns and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: "Monday", active: 65, passive: 35 },
                      { day: "Tuesday", active: 70, passive: 30 },
                      { day: "Wednesday", active: 75, passive: 25 },
                      { day: "Thursday", active: 60, passive: 40 },
                      { day: "Friday", active: 55, passive: 45 },
                      { day: "Saturday", active: 85, passive: 15 },
                      { day: "Sunday", active: 80, passive: 20 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" stackId="a" fill="#3B82F6" name="Active Learning" />
                    <Bar dataKey="passive" stackId="a" fill="#E5E7EB" name="Passive Browsing" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {/* Course Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Comparison</CardTitle>
              <CardDescription>Key metrics across different courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockCourseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#3B82F6" name="Enrolled Students" />
                    <Bar dataKey="completion" fill="#10B981" name="Completion Rate (%)" />
                    <Bar dataKey="avgScore" fill="#8B5CF6" name="Avg. Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Module Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Module Completion Analysis</CardTitle>
              <CardDescription>
                {courseFilter === "all" 
                  ? "Select a specific course to view module completion" 
                  : `Module completion for ${mockCourses.find(c => c.id === courseFilter)?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courseFilter === "all" ? (
                <div className="p-8 text-center text-gray-500">
                  Please select a specific course from the dropdown above to view module completion analytics.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Module 1", completion: 95 },
                        { name: "Module 2", completion: 88 },
                        { name: "Module 3", completion: 76 },
                        { name: "Module 4", completion: 65 },
                        { name: "Module 5", completion: 52 },
                        { name: "Module 6", completion: 43 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion" fill="#10B981" name="Completion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: "Jan", revenue: 1200 },
                      { month: "Feb", revenue: 1500 },
                      { month: "Mar", revenue: 1800 },
                      { month: "Apr", revenue: 1600 },
                      { month: "May", revenue: 2100 },
                      { month: "Jun", revenue: 2400 },
                      { month: "Jul", revenue: 2200 },
                      { month: "Aug", revenue: 2500 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Course */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Course</CardTitle>
              <CardDescription>Distribution of revenue across courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "JavaScript", value: 4800 },
                        { name: "Python", value: 3400 },
                        { name: "SQL", value: 2600 },
                        { name: "React", value: 1800 },
                        { name: "Node.js", value: 1400 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({name, value}) => `${name}: $${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[...Array(5)].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;

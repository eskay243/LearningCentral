import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import useAuth from "@/hooks/useAuth";
import { formatDate, formatCurrency } from "@/lib/utils";

const Earnings = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [timeFrame, setTimeFrame] = useState("month");
  const [courseFilter, setCourseFilter] = useState("all");

  // Fetch earnings data
  const { data: earningsData, isLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/earnings` : "/api/admin/earnings", timeFrame, courseFilter],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch commission history
  const { data: commissionHistory, isLoading: isCommissionsLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/commissions` : "/api/admin/commissions", timeFrame],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch mentor's courses for filtering
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Mock data for development
  const mockEarningsData = {
    totalEarnings: 12480,
    pendingPayouts: 2350,
    totalStudents: 247,
    averageRating: 4.8,
    monthlyEarnings: [
      { month: "Jan", amount: 980 },
      { month: "Feb", amount: 1250 },
      { month: "Mar", amount: 1120 },
      { month: "Apr", amount: 1480 },
      { month: "May", amount: 1680 },
      { month: "Jun", amount: 1890 },
      { month: "Jul", amount: 2080 },
      { month: "Aug", amount: 2350 },
    ],
    courseEarnings: [
      { name: "JavaScript Course", amount: 4800, students: 120 },
      { name: "Python for Beginners", amount: 3400, students: 85 },
      { name: "SQL for Data Science", amount: 2600, students: 65 },
      { name: "React Fundamentals", amount: 1000, students: 45 },
      { name: "Node.js Essentials", amount: 680, students: 35 },
    ],
  };

  const mockCommissionHistory = [
    {
      id: 1,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      student: "Emma Johnson",
      course: "JavaScript Course",
      amount: 148,
      status: "paid",
      commissionRate: 37,
    },
    {
      id: 2,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      student: "Alex Chen",
      course: "SQL for Data Science",
      amount: 118,
      status: "paid",
      commissionRate: 37,
    },
    {
      id: 3,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      student: "Sophia Martinez",
      course: "Python for Beginners",
      amount: 92,
      status: "pending",
      commissionRate: 37,
    },
    {
      id: 4,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      student: "David Kim",
      course: "JavaScript Course",
      amount: 148,
      status: "paid",
      commissionRate: 37,
    },
    {
      id: 5,
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      student: "Maya Patel",
      course: "React Fundamentals",
      amount: 74,
      status: "paid",
      commissionRate: 37,
    },
  ];

  // Mock courses for filtering
  const mockCourses = [
    { id: "all", title: "All Courses" },
    { id: "javascript", title: "JavaScript Course" },
    { id: "python", title: "Python for Beginners" },
    { id: "sql", title: "SQL for Data Science" },
    { id: "react", title: "React Fundamentals" },
    { id: "nodejs", title: "Node.js Essentials" },
  ];

  // Colors for charts
  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B"];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Earnings</h1>
        <p className="mt-1 text-gray-500">Track your earnings, commissions, and payouts</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 3 Months</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Course Filter" />
          </SelectTrigger>
          <SelectContent>
            {(courses || mockCourses).map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(mockEarningsData.totalEarnings)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i className="ri-money-dollar-circle-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(mockEarningsData.pendingPayouts)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <i className="ri-time-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold">{mockEarningsData.totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <i className="ri-user-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold">{mockEarningsData.averageRating}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <i className="ri-star-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commission History</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Earnings Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Trend</CardTitle>
              <CardDescription>Monthly earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockEarningsData.monthlyEarnings}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Earnings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Earnings by Course */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings by Course</CardTitle>
                <CardDescription>Distribution of earnings across courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockEarningsData.courseEarnings}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {mockEarningsData.courseEarnings.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Course Earnings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Course Earnings Breakdown</CardTitle>
                <CardDescription>Detailed view by course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockEarningsData.courseEarnings.map((course, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{course.students}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(course.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commission History Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>Record of your earned commissions</CardDescription>
                </div>
                <Button variant="outline">
                  <i className="ri-download-line mr-2"></i>
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isCommissionsLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (commissionHistory || mockCommissionHistory).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No commission history found for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(commissionHistory || mockCommissionHistory).map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>{formatDate(commission.date)}</TableCell>
                          <TableCell>{commission.student}</TableCell>
                          <TableCell>{commission.course}</TableCell>
                          <TableCell>{commission.commissionRate}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={commission.status === "paid" ? "success" : "secondary"}
                            >
                              {commission.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Record of payments processed to you</CardDescription>
                </div>
                <Button>Request Payout</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pending Payout Card */}
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium">Pending Payout</h3>
                        <p className="text-sm text-gray-600">Next payout scheduled for August 30, 2023</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">{formatCurrency(mockEarningsData.pendingPayouts)}</div>
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          Processing
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout History Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Jul 30, 2023</TableCell>
                      <TableCell>PAY-3873452</TableCell>
                      <TableCell>Bank Transfer</TableCell>
                      <TableCell className="text-right">{formatCurrency(2080)}</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jun 30, 2023</TableCell>
                      <TableCell>PAY-2938471</TableCell>
                      <TableCell>Bank Transfer</TableCell>
                      <TableCell className="text-right">{formatCurrency(1890)}</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>May 30, 2023</TableCell>
                      <TableCell>PAY-1923847</TableCell>
                      <TableCell>Bank Transfer</TableCell>
                      <TableCell className="text-right">{formatCurrency(1680)}</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Apr 30, 2023</TableCell>
                      <TableCell>PAY-0982345</TableCell>
                      <TableCell>Bank Transfer</TableCell>
                      <TableCell className="text-right">{formatCurrency(1480)}</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Earnings;

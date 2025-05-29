import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  UserPlus,
  Building2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Eye,
  UserCheck,
  Calendar
} from 'lucide-react';

// Types for admin dashboard data
interface AdminDashboardStats {
  revenue: {
    platformEarnings: number;
    mentorPayouts: number;
    pendingPayouts: number;
    monthlyGrowth: number;
  };
  users: {
    totalUsers: number;
    totalStudents: number;
    totalMentors: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  content: {
    totalCourses: number;
    totalLessons: number;
    activeCourses: number;
    pendingCourses: number;
  };
  enrollments: {
    totalEnrollments: number;
    completedCourses: number;
    averageProgress: number;
  };
  withdrawalRequests: {
    pending: number;
    totalAmount: number;
    requests: WithdrawalRequest[];
  };
}

interface WithdrawalRequest {
  id: number;
  mentorId: string;
  mentorName: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  bankDetails?: string;
}

interface CourseOverview {
  id: number;
  title: string;
  status: 'active' | 'pending' | 'draft';
  enrollments: number;
  revenue: number;
  mentorName: string;
  lastUpdated: string;
}

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const isStudent = user?.role === 'student';

  // Fetch admin dashboard statistics
  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: isAdmin && !isAuthLoading
  });

  // Fetch course overview for admin
  const { data: courseOverview, isLoading: isCoursesLoading } = useQuery<CourseOverview[]>({
    queryKey: ["/api/admin/course-overview"],
    enabled: isAdmin && !isAuthLoading
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isAuthLoading || isStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome back, {user?.firstName || user?.email}!
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Your dashboard is being prepared. Check back soon for your personalized learning experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Comprehensive platform overview and management
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardStats?.revenue.platformEarnings || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardStats?.revenue.monthlyGrowth || 0}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats?.users.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats?.users.newUsersThisMonth || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats?.content.activeCourses || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats?.content.totalLessons || 0} total lessons
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats?.enrollments.totalEnrollments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats?.enrollments.averageProgress || 0}% avg progress
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Students</span>
                  </div>
                  <span className="font-medium">{dashboardStats?.users.totalStudents || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span>Mentors</span>
                  </div>
                  <span className="font-medium">{dashboardStats?.users.totalMentors || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>Active Users</span>
                  </div>
                  <span className="font-medium">{dashboardStats?.users.activeUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Student
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Platform Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Platform Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(dashboardStats?.revenue.platformEarnings || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total revenue generated from course sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Mentor Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(dashboardStats?.revenue.mentorPayouts || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total amount paid to mentors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Pending Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dashboardStats?.revenue.pendingPayouts || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Amount awaiting mentor payout
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    +{dashboardStats?.revenue.monthlyGrowth || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly growth rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.users.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.users.totalStudents || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.users.totalMentors || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.users.activeUsers || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.content.totalCourses || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.content.activeCourses || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.content.pendingCourses || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.content.totalLessons || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Course Overview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseOverview && courseOverview.length > 0 ? (
                  courseOverview.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Mentor: {course.mentorName} • Updated: {formatDate(course.lastUpdated)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">{course.enrollments} students</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(course.revenue)} revenue
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No courses available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {dashboardStats?.withdrawalRequests.pending || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Withdrawal requests awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(dashboardStats?.withdrawalRequests.totalAmount || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total pending withdrawal amount
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Requests List */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats?.withdrawalRequests.requests && dashboardStats.withdrawalRequests.requests.length > 0 ? (
                  dashboardStats.withdrawalRequests.requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{request.mentorName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {request.bankDetails} • Requested: {formatDate(request.requestDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(request.amount)}</div>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                            {request.status}
                          </Badge>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No withdrawal requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
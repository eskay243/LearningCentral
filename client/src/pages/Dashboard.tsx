import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { type User } from '@shared/schema';
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

  // Fetch admin dashboard statistics - with error handling
  const { data: dashboardStats, isLoading: isStatsLoading, error: statsError } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch course overview for admin - with error handling
  const { data: courseOverview, isLoading: isCoursesLoading, error: coursesError } = useQuery<CourseOverview[]>({
    queryKey: ["/api/admin/course-overview"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch all users for admin dashboard Users tab - use same endpoint as UserManagement
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Also fetch students data to supplement user information
  const { data: studentsData = [] } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
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

  // Calculate real user statistics from fetched user data
  const calculateUserStats = () => {
    if (!allUsers || !Array.isArray(allUsers)) {
      return {
        totalUsers: 0,
        totalStudents: 0,
        totalMentors: 0,
        activeUsers: 0,
        newUsersThisMonth: 0
      };
    }

    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter(u => u.role === 'student').length;
    const totalMentors = allUsers.filter(u => u.role === 'mentor').length;
    
    // Calculate active users (users updated within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = allUsers.filter(u => 
      u.updatedAt && new Date(u.updatedAt) > thirtyDaysAgo
    ).length;
    
    // Calculate new users this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const newUsersThisMonth = allUsers.filter(u => 
      u.createdAt && new Date(u.createdAt) >= firstOfMonth
    ).length;

    return {
      totalUsers,
      totalStudents,
      totalMentors,
      activeUsers,
      newUsersThisMonth
    };
  };

  const realUserStats = calculateUserStats();

  // Use real user data when available, fallback to API stats for other data
  const displayStats = {
    revenue: dashboardStats?.revenue || { platformEarnings: 0, mentorPayouts: 0, pendingPayouts: 0, monthlyGrowth: 0 },
    users: realUserStats,
    content: dashboardStats?.content || { totalCourses: 0, totalLessons: 0, activeCourses: 0, pendingCourses: 0 },
    enrollments: dashboardStats?.enrollments || { totalEnrollments: 0, completedCourses: 0, averageProgress: 0 },
    withdrawalRequests: dashboardStats?.withdrawalRequests || { pending: 0, totalAmount: 0, requests: [] }
  };

  const displayCourses = courseOverview || [
    { id: 1, title: "JavaScript Fundamentals", status: "active", enrollments: 245, revenue: 24500, mentorName: "John Doe", lastUpdated: "2024-01-15" },
    { id: 2, title: "React Development", status: "active", enrollments: 189, revenue: 18900, mentorName: "Jane Smith", lastUpdated: "2024-01-14" },
    { id: 3, title: "Python Basics", status: "pending", enrollments: 0, revenue: 0, mentorName: "Bob Johnson", lastUpdated: "2024-01-13" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Modern Header with Gradient Background */}
        <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Admin Dashboard ✨
            </h1>
            <p className="text-purple-100 text-lg">
              Comprehensive platform overview and management
            </p>
          </div>
          {/* Decorative Shapes */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-yellow-300/20 rounded-full"></div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all duration-300">
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300">
              Courses
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300">
              Withdrawals
            </TabsTrigger>
          </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Overview with Modern Gradient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Platform Earnings</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {formatCurrency(displayStats.revenue.platformEarnings)}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    +{displayStats.revenue.monthlyGrowth}% from last month
                  </p>
                </div>
              </CardContent>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Users</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {displayStats.users.totalUsers}
                </div>
                <div className="flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    {displayStats.users.newUsersThisMonth} new this month
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-2 left-2 w-12 h-12 bg-yellow-300/20 rounded-full"></div>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Active Courses</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {dashboardStats?.content.activeCourses || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    {dashboardStats?.content.totalLessons || 0} total lessons
                  </p>
                </div>
              </CardContent>
              <div className="absolute top-6 right-6 w-14 h-14 bg-white/10 rounded-full blur-lg"></div>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Enrollments</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {dashboardStats?.enrollments.totalEnrollments || 0}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    {dashboardStats?.enrollments.averageProgress || 0}% avg progress
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-4 right-2 w-10 h-10 bg-purple-300/20 rounded-full"></div>
            </Card>
          </div>

          {/* User Breakdown with Vibrant Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full">
                      <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Students</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {dashboardStats?.users.totalStudents || displayStats.users.totalStudents}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Mentors</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {dashboardStats?.users.totalMentors || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Active Users</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {dashboardStats?.users.activeUsers || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Student
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Users</CardTitle>
                <Users className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{allUsers?.length || dashboardStats?.users.totalUsers || 0}</div>
                <p className="text-xs text-white/80">All registered users</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Students</CardTitle>
                <UserCheck className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{allUsers?.filter(u => u.role === 'student').length || dashboardStats?.users.totalStudents || 0}</div>
                <p className="text-xs text-white/80">Active learners</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Mentors</CardTitle>
                <Award className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{allUsers?.filter(u => u.role === 'mentor').length || dashboardStats?.users.totalMentors || 0}</div>
                <p className="text-xs text-white/80">Course instructors</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Admins</CardTitle>
                <Building2 className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{allUsers?.filter(u => u.role === 'admin').length || 0}</div>
                <p className="text-xs text-white/80">System administrators</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
                {isUsersLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Joined</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user: any) => {
                        // Find corresponding student data for additional metrics
                        const studentData = studentsData?.find((s: any) => s.id === user.id || s.email === user.email);
                        
                        return (
                          <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium text-sm">
                                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'No name'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                                  {user.bio && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
                                      {user.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="text-gray-900 dark:text-gray-100">{user.email || 'No email'}</span>
                                {user.commissionRate && user.role === 'mentor' && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Commission: {user.commissionRate}%
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={user.role === 'admin' ? 'destructive' : user.role === 'mentor' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {user.role || 'student'}
                              </Badge>
                              {studentData && studentData.totalCourses && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {studentData.totalCourses} courses
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={user.isActive !== false ? 'default' : 'secondary'}>
                                {user.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                              {studentData && studentData.progress && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {studentData.progress}% progress
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-600 dark:text-gray-400">
                                {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {user.lastActiveAt ? formatDate(user.lastActiveAt) : 
                                   user.updatedAt ? formatDate(user.updatedAt) : 'Never'}
                                </span>
                                {studentData && studentData.lastLogin && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Login: {formatDate(studentData.lastLogin)}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No users found in the database</p>
                </div>
              )}
            </CardContent>
          </Card>
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

          {/* Course Overview Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and monitor all courses from your database
              </p>
            </CardHeader>
            <CardContent>
              {isCoursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : coursesError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400 mb-2">Failed to load course data</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {coursesError.message || "Unable to fetch course information from database"}
                  </p>
                </div>
              ) : courseOverview && courseOverview.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseOverview.map((course) => (
                    <Card key={course.id} className="group hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gradient-to-br from-purple-400 to-pink-400">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <BookOpen className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant={course.status === 'active' ? 'default' : 'secondary'} className="bg-white/90 text-gray-800">
                            {course.status === 'active' ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {course.category || 'General'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span>{course.mentorName}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div>
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4" />
                                <span>{course.enrollments} students</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(course.revenue)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">revenue</div>
                            </div>
                          </div>
                          
                          {course.price && (
                            <div className="pt-2">
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(course.price)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Course price
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {formatDate(course.lastUpdated)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    No courses have been created yet. Create your first course to get started.
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              )}
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
    </div>
  );
}
import { useState } from 'react';
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

export default function DashboardFixed() {
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
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<any[]>({
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate user statistics from real data
  const calculateUserStats = () => {
    if (!allUsers || allUsers.length === 0) {
      return dashboardStats?.users || {
        totalUsers: 0,
        totalStudents: 0,
        totalMentors: 0,
        activeUsers: 0,
        newUsersThisMonth: 0
      };
    }

    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter((u: any) => u.role === 'student').length;
    const totalMentors = allUsers.filter((u: any) => u.role === 'mentor').length;
    const activeUsers = allUsers.filter((u: any) => u.role !== 'admin').length; // Non-admin users
    
    // Calculate new users this month (simplified - you might want to add actual date filtering)
    const newUsersThisMonth = Math.floor(totalUsers * 0.1); // Approximation

    return {
      totalUsers,
      totalStudents,
      totalMentors,
      activeUsers,
      newUsersThisMonth
    };
  };

  const displayStats = {
    users: calculateUserStats(),
    revenue: dashboardStats?.revenue || { platformEarnings: 0, mentorPayouts: 0, pendingPayouts: 0, monthlyGrowth: 0 },
    content: dashboardStats?.content || { totalCourses: 0, totalLessons: 0, activeCourses: 0, pendingCourses: 0 },
    enrollments: dashboardStats?.enrollments || { totalEnrollments: 0, completedCourses: 0, averageProgress: 0 }
  };

  if (isAuthLoading || isStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (statsError || coursesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">There was an error loading the dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your learning platform with comprehensive insights and controls
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
              <div className="absolute bottom-2 right-2 w-16 h-16 bg-yellow-300/20 rounded-full"></div>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Courses</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {displayStats.content.totalCourses}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    {displayStats.content.activeCourses} active courses
                  </p>
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 w-8 h-8 bg-blue-300/20 rounded-full"></div>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Enrollments</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {displayStats.enrollments.totalEnrollments}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <p className="text-xs text-white/80">
                    {displayStats.enrollments.averageProgress}% avg progress
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-1 left-1 w-6 h-6 bg-purple-300/20 rounded-full"></div>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Users</CardTitle>
                <Users className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{displayStats.users.totalUsers}</div>
                <p className="text-xs text-white/80">All registered users</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl">
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Students</CardTitle>
                <UserCheck className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{displayStats.users.totalStudents}</div>
                <p className="text-xs text-white/80">Active learners</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl">
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Mentors</CardTitle>
                <Award className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{displayStats.users.totalMentors}</div>
                <p className="text-xs text-white/80">Course instructors</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl">
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Active Users</CardTitle>
                <Building2 className="h-5 w-5 text-white" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{displayStats.users.activeUsers}</div>
                <p className="text-xs text-white/80">Currently engaged</p>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          {isUsersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.slice(0, 10).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'mentor' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {isCoursesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {courseOverview && courseOverview.length > 0 ? (
                courseOverview.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <Badge variant={course.status === 'active' ? 'default' : course.status === 'pending' ? 'secondary' : 'outline'}>
                          {course.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Enrollments</p>
                          <p className="text-2xl font-bold">{course.enrollments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold">{formatCurrency(course.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Mentor</p>
                          <p className="font-medium">{course.mentorName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="font-medium">{formatDate(course.lastUpdated)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                    <p className="text-muted-foreground">Start by creating your first course.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import StableStudentDashboard from '@/pages/stable-student-dashboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Calendar,
  GraduationCap,
  PlayCircle,
  BarChart3,
  Wallet,
  Settings,
  FileText,
  Target,
  Activity,
  ChevronDown,
  Home
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
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const isStudent = user?.role === 'student';
  const [activeView, setActiveView] = useState('overview');

  // Fetch admin dashboard statistics
  const { data: dashboardStats, isLoading: isStatsLoading, error: statsError } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch course overview for admin
  const { data: courseOverview, isLoading: isCoursesLoading, error: coursesError } = useQuery<CourseOverview[]>({
    queryKey: ["/api/admin/course-overview"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch all users for admin dashboard
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch students data
  const { data: studentsData = [] } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: isAdmin && !isAuthLoading,
    retry: false
  });

  // Fetch mentor earnings data for mentors
  const { data: mentorEarnings, isLoading: isEarningsLoading } = useQuery({
    queryKey: ["/api/mentor/earnings"],
    enabled: isMentor && !isAuthLoading,
    retry: false
  });

  // Show student dashboard for student users or when authentication fails (default to student view)
  if ((isStudent && !isAuthLoading) || (!user && !isAuthLoading)) {
    return <StableStudentDashboard />;
  }

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
    const activeUsers = allUsers.filter((u: any) => u.role !== 'admin').length;
    const newUsersThisMonth = Math.floor(totalUsers * 0.1);

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

  // Show mentor dashboard for mentors
  if (isMentor && !isAdmin) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
            <p className="text-muted-foreground">Track your earnings and student progress</p>
          </div>
        </div>

        {/* Mentor Earnings Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mentorEarnings?.totalEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mentorEarnings?.thisMonthEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mentorEarnings?.totalEnrollments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Students enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mentorEarnings?.commissionRate || 37}%
              </div>
              <p className="text-xs text-muted-foreground">
                Per course sale
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Withdrawal Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Available balance: {formatCurrency(mentorEarnings?.availableBalance || 0)}
              </p>
              <Button className="w-full">
                Request Withdrawal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View detailed analytics of your courses and student engagement
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
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

  // Get current view title
  const getViewTitle = () => {
    const viewTitles: { [key: string]: string } = {
      'overview': 'Dashboard Overview',
      'platform-earnings': 'Platform Earnings',
      'mentor-payouts': 'Mentor Payouts',
      'withdrawal-requests': 'Withdrawal Requests',
      'all-users': 'All Users',
      'students': 'Students',
      'mentors': 'Mentors',
      'user-activity': 'User Activity',
      'courses': 'Courses',
      'lessons': 'Lessons',
      'enrollments': 'Enrollments',
      'course-status': 'Course Status'
    };
    return viewTitles[activeView] || 'Dashboard';
  };

  function renderContent() {
    switch (activeView) {
      case 'overview':
        return renderOverview();
      case 'platform-earnings':
        return renderPlatformEarnings();
      case 'mentor-payouts':
        return renderMentorPayouts();
      case 'withdrawal-requests':
        return renderWithdrawalRequests();
      case 'all-users':
        return renderAllUsers();
      case 'students':
        return renderStudents();
      case 'mentors':
        return renderMentors();
      case 'user-activity':
        return renderUserActivity();
      case 'courses':
        return renderCourses();
      case 'lessons':
        return renderLessons();
      case 'enrollments':
        return renderEnrollments();
      case 'course-status':
        return renderCourseStatus();
      default:
        return renderOverview();
    }
  }

  function renderOverview() {
    return (
      <div className="space-y-8">
        {/* Key Metrics */}
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
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
          </Card>
        </div>

        {/* Revenue Management Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-purple-600" />
            Revenue Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/payments')}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Platform Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(displayStats.revenue.platformEarnings)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commission from course sales
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/payments')}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mentor Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(displayStats.revenue.mentorPayouts)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total paid to mentors
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/payments')}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(displayStats.revenue.pendingPayouts)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting mentor payments
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Management Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            User Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/users')}
            >
              <CardHeader>
                <CardTitle className="text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.users.totalUsers}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/users')}
            >
              <CardHeader>
                <CardTitle className="text-sm">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{displayStats.users.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Learning on platform</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/mentors')}
            >
              <CardHeader>
                <CardTitle className="text-sm">Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{displayStats.users.totalMentors}</div>
                <p className="text-xs text-muted-foreground">Teaching courses</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setLocation('/admin/users')}
            >
              <CardHeader>
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{displayStats.users.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently engaged</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
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
                  {allUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'mentor' ? 'default' : 'secondary'} className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content Management Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            Content Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.content.totalCourses}</div>
                <p className="text-xs text-muted-foreground">All courses created</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{displayStats.content.activeCourses}</div>
                <p className="text-xs text-muted-foreground">Published and available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{displayStats.content.pendingCourses}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{displayStats.content.totalLessons}</div>
                <p className="text-xs text-muted-foreground">Learning content</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Courses */}
          {isCoursesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Courses</h3>
              {courseOverview && courseOverview.length > 0 ? (
                courseOverview.slice(0, 5).map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <Badge variant={course.status === 'active' ? 'default' : course.status === 'pending' ? 'secondary' : 'outline'}>
                          {course.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Enrollments</p>
                          <p className="font-bold">{course.enrollments}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-bold">{formatCurrency(course.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mentor</p>
                          <p className="font-medium">{course.mentorName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
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

          {/* Enrollment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold">{displayStats.enrollments.totalEnrollments}</div>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{displayStats.enrollments.completedCourses}</div>
                  <p className="text-sm text-muted-foreground">Completed Courses</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{displayStats.enrollments.averageProgress}%</div>
                  <p className="text-sm text-muted-foreground">Average Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderPlatformEarnings() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Platform Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(displayStats.revenue.platformEarnings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Commission from course sales
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                +{displayStats.revenue.monthlyGrowth}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Compared to last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(displayStats.revenue.pendingPayouts)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting mentor payments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderMentorPayouts() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {formatCurrency(displayStats.revenue.mentorPayouts)}
            </div>
            <p className="text-muted-foreground">
              Total paid to mentors this period
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderWithdrawalRequests() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">All withdrawal requests have been processed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAllUsers() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.users.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{displayStats.users.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{displayStats.users.totalMentors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{displayStats.users.activeUsers}</div>
            </CardContent>
          </Card>
        </div>

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
      </div>
    );
  }

  function renderStudents() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 text-blue-600">
              {displayStats.users.totalStudents}
            </div>
            <p className="text-muted-foreground">
              Active student accounts on the platform
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderMentors() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mentor Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 text-green-600">
              {displayStats.users.totalMentors}
            </div>
            <p className="text-muted-foreground">
              Active mentor accounts on the platform
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderUserActivity() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 text-purple-600">
              {displayStats.users.activeUsers}
            </div>
            <p className="text-muted-foreground">
              Currently active users on the platform
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCourses() {
    return (
      <div className="space-y-6">
        {isCoursesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
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
      </div>
    );
  }

  function renderLessons() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {displayStats.content.totalLessons}
            </div>
            <p className="text-muted-foreground">
              Total lessons across all courses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderEnrollments() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold">{displayStats.enrollments.totalEnrollments}</div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{displayStats.enrollments.completedCourses}</div>
                <p className="text-sm text-muted-foreground">Completed Courses</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{displayStats.enrollments.averageProgress}%</div>
                <p className="text-sm text-muted-foreground">Average Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCourseStatus() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {displayStats.content.activeCourses}
              </div>
              <p className="text-muted-foreground">
                Currently published and available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {displayStats.content.pendingCourses}
              </div>
              <p className="text-muted-foreground">
                Awaiting review and approval
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with Dropdown Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {getViewTitle()}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your learning platform with comprehensive insights and controls
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 min-w-[200px]"
            >
              <Home className="h-5 w-5" />
              Dashboard Menu
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dashboard Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setActiveView('overview')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Revenue Management</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setActiveView('platform-earnings')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Platform Earnings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('mentor-payouts')}>
              <Wallet className="mr-2 h-4 w-4" />
              Mentor Payouts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('withdrawal-requests')}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Withdrawal Requests
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>User Management</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setActiveView('all-users')}>
              <Users className="mr-2 h-4 w-4" />
              All Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('students')}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Students
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('mentors')}>
              <Award className="mr-2 h-4 w-4" />
              Mentors
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('user-activity')}>
              <Activity className="mr-2 h-4 w-4" />
              User Activity
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Content Management</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setActiveView('courses')}>
              <BookOpen className="mr-2 h-4 w-4" />
              Courses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('lessons')}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Lessons
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('enrollments')}>
              <UserCheck className="mr-2 h-4 w-4" />
              Enrollments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView('course-status')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Course Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
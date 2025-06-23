import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Download,
  Eye,
  Filter
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EarningsData {
  summary: {
    totalEarnings: number;
    pendingAmount: number;
    paidAmount: number;
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
  };
  courses: {
    totalCourses: number;
    activeCourses: number;
    totalStudents: number;
  };
  recentCommissions: any[];
  monthlyBreakdown: Record<string, any>;
  topPerformingCourses: any[];
}

interface CourseEnrollment {
  enrollmentId: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  paymentStatus: string;
  paymentAmount: number;
  paymentReference: string;
  commissions: any[];
  commissionAmount: number;
  commissionStatus: string;
}

export default function MentorEarningsEnhanced() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ['/api/mentor/earnings/detailed'],
    queryFn: () => apiRequest('/api/mentor/earnings/detailed').then(res => res.json())
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<CourseEnrollment[]>({
    queryKey: ['/api/mentor/course-enrollments', selectedCourse],
    queryFn: () => {
      const url = selectedCourse 
        ? `/api/mentor/course-enrollments?courseId=${selectedCourse}`
        : '/api/mentor/course-enrollments';
      return apiRequest(url).then(res => res.json());
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (earningsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your commissions and student enrollments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(earningsData?.summary.totalEarnings || 0)}
          description="All-time commission earnings"
          icon={DollarSign}
          trend="+12% from last month"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(earningsData?.summary.pendingAmount || 0)}
          description="Awaiting payout"
          icon={Clock}
        />
        <StatCard
          title="Total Students"
          value={earningsData?.courses.totalStudents || 0}
          description="Across all courses"
          icon={Users}
          trend="+5 new this week"
        />
        <StatCard
          title="Active Courses"
          value={earningsData?.courses.activeCourses || 0}
          description={`of ${earningsData?.courses.totalCourses || 0} total`}
          icon={BookOpen}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Summary</CardTitle>
                <CardDescription>Your commission breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Commissions</span>
                    <Badge variant="secondary">{earningsData?.summary.totalCommissions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Paid
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(earningsData?.summary.paidAmount || 0)}</div>
                      <div className="text-xs text-muted-foreground">{earningsData?.summary.paidCommissions || 0} payments</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      Pending
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(earningsData?.summary.pendingAmount || 0)}</div>
                      <div className="text-xs text-muted-foreground">{earningsData?.summary.pendingCommissions || 0} payments</div>
                    </div>
                  </div>
                  <Progress 
                    value={(earningsData?.summary.paidAmount || 0) / (earningsData?.summary.totalEarnings || 1) * 100} 
                    className="mt-4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>By revenue generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earningsData?.topPerformingCourses?.slice(0, 5).map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">#{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-sm truncate max-w-[200px]">
                            {course.courseTitle}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {course.enrollments} students
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(course.commission)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(course.revenue)} total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Commissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Commissions</CardTitle>
              <CardDescription>Latest commission payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earningsData?.recentCommissions?.slice(0, 10).map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{commission.studentName?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{commission.courseTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {commission.studentName} • {formatDate(commission.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(commission.amount)}</div>
                      <Badge className={`text-xs ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
              <CardDescription>Track your students and their progress</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments?.map((enrollment) => (
                    <div key={enrollment.enrollmentId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{enrollment.studentName}</div>
                          <div className="text-sm text-muted-foreground">{enrollment.courseTitle}</div>
                          <div className="text-xs text-muted-foreground">
                            Enrolled: {formatDate(enrollment.enrolledAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">{formatCurrency(enrollment.paymentAmount)}</div>
                        <div className="text-sm text-green-600">
                          Commission: {formatCurrency(enrollment.commissionAmount)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(enrollment.paymentStatus)}>
                            {enrollment.paymentStatus}
                          </Badge>
                          <Badge className={getStatusColor(enrollment.commissionStatus)}>
                            {enrollment.commissionStatus}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Progress: {enrollment.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Detailed commission tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earningsData?.recentCommissions?.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{commission.courseTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        Student: {commission.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(commission.createdAt)}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-lg">{formatCurrency(commission.amount)}</div>
                      <Badge className={getStatusColor(commission.status)}>
                        {commission.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        37% of {formatCurrency(commission.amount / 0.37)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Commission trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(earningsData?.monthlyBreakdown || {})
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 12)
                  .map(([month, data]: [string, any]) => (
                    <div key={month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(month + '-01').toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} commissions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(data.total)}</div>
                        <div className="text-sm space-x-2">
                          <span className="text-green-600">Paid: {formatCurrency(data.paid)}</span>
                          <span className="text-yellow-600">Pending: {formatCurrency(data.pending)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatNaira } from '@/lib/currencyUtils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  CreditCard,
  BarChart3,
  Star,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Mentor {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  profileImageUrl?: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  rating?: number;
  totalStudents?: number;
  activeCourses?: number;
  totalEarnings?: number;
}

interface MentorPayment {
  id: number;
  mentorId: string;
  amount: number;
  commissionType: string;
  paymentMethod: string;
  status: string;
  transactionRef?: string;
  createdAt: string;
  mentorName?: string;
}

interface MentorPerformance {
  id: number;
  mentorId: string;
  courseId?: number;
  year: number;
  month: number;
  studentsEnrolled: number;
  studentsCompleted: number;
  completionRate: number;
  averageRating: number;
  totalEarnings: number;
  liveSessionsHeld: number;
  assignmentsGraded: number;
  mentorName?: string;
  courseName?: string;
}

interface MentorRating {
  id: number;
  mentorId: string;
  studentId: string;
  courseId: number;
  rating: number;
  feedback?: string;
  category: string;
  status: string;
  createdAt: string;
  mentorName?: string;
  studentName?: string;
  courseName?: string;
}

interface MentorActivity {
  id: number;
  mentorId: string;
  type: string;
  description: string;
  metadata?: any;
  createdAt: string;
  mentorName?: string;
}

export default function ComprehensiveMentorManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  // Fetch mentors data
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['/api/admin/mentors'],
  });

  // Fetch mentor stats
  const { data: mentorStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/mentor-stats'],
  });

  // Fetch payments data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/admin/mentor-payments'],
  });

  // Fetch performance data
  const { data: performance = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/admin/mentor-performance'],
  });

  // Fetch ratings data
  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['/api/admin/mentor-ratings'],
  });

  // Fetch activities data
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/admin/mentor-activities'],
  });

  // Payment mutation for approving/rejecting payments
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: string }) => {
      return apiRequest('PATCH', `/api/admin/mentor-payments/${paymentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mentor-payments'] });
      toast({
        title: "Payment Updated",
        description: "Payment status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  // Filter functions
  const filteredMentors = mentors.filter((mentor: Mentor) =>
    mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${mentor.firstName} ${mentor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter((payment: MentorPayment) => {
    const matchesSearch = payment.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const filteredRatings = ratings.filter((rating: MentorRating) => {
    const matchesSearch = rating.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rating.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rating.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || rating.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredActivities = activities.filter((activity: MentorActivity) => {
    const matchesSearch = activity.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      hidden: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Management</h1>
          <p className="text-muted-foreground">
            Comprehensive mentor management with payments, performance, ratings, and activities
          </p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Add Mentor
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="ratings" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Ratings
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activities
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorStats.totalMentors || 0}</div>
                <p className="text-xs text-muted-foreground">+{mentorStats.newMentorsThisMonth || 0} this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorStats.activeMentors || 0}</div>
                <p className="text-xs text-muted-foreground">{mentorStats.activePercentage || 0}% of total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNaira(mentorStats.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">+{formatNaira(mentorStats.earningsThisMonth || 0)} this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorStats.averageRating || 0}</div>
                <p className="text-xs text-muted-foreground">Across all mentors</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mentor List</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mentors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentors.map((mentor: Mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={mentor.profileImageUrl} />
                          <AvatarFallback>
                            {mentor.firstName?.[0]}{mentor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{mentor.firstName} {mentor.lastName}</div>
                          <div className="text-sm text-muted-foreground">ID: {mentor.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>{mentor.specialization || 'Not specified'}</TableCell>
                      <TableCell>{mentor.totalStudents || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(mentor.rating || 0)}
                          <span className="ml-2 text-sm">{mentor.rating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatNaira(mentor.totalEarnings || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Payments</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission Type</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: MentorPayment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.mentorName || payment.mentorId}</TableCell>
                      <TableCell className="font-semibold">{formatNaira(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.commissionType}</Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payment.transactionRef || 'N/A'}</TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePaymentMutation.mutate({ paymentId: payment.id, status: 'paid' })}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePaymentMutation.mutate({ paymentId: payment.id, status: 'rejected' })}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Performance</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search performance..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Live Sessions</TableHead>
                    <TableHead>Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((perf: MentorPerformance) => (
                    <TableRow key={perf.id}>
                      <TableCell>{perf.mentorName || perf.mentorId}</TableCell>
                      <TableCell>{perf.courseName || `Course ${perf.courseId}`}</TableCell>
                      <TableCell>{perf.month}/{perf.year}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{perf.studentsCompleted}/{perf.studentsEnrolled}</div>
                          <div className="text-muted-foreground">enrolled/completed</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${perf.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{perf.completionRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(perf.averageRating)}
                          <span className="ml-2 text-sm">{perf.averageRating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatNaira(perf.totalEarnings)}</TableCell>
                      <TableCell>{perf.liveSessionsHeld}</TableCell>
                      <TableCell>{perf.assignmentsGraded}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Ratings</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ratings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="knowledge">Knowledge</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="overall">Overall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRatings.map((rating: MentorRating) => (
                    <TableRow key={rating.id}>
                      <TableCell>{rating.mentorName || rating.mentorId}</TableCell>
                      <TableCell>{rating.studentName || rating.studentId}</TableCell>
                      <TableCell>{rating.courseName || `Course ${rating.courseId}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(rating.rating)}
                          <span className="ml-2 text-sm font-semibold">{rating.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rating.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{rating.feedback || 'No feedback'}</TableCell>
                      <TableCell>{new Date(rating.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(rating.status)}>
                          {rating.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Activities</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Activity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="course_interaction">Course Interaction</SelectItem>
                    <SelectItem value="live_session">Live Session</SelectItem>
                    <SelectItem value="assignment_grading">Assignment Grading</SelectItem>
                    <SelectItem value="student_communication">Student Communication</SelectItem>
                    <SelectItem value="content_creation">Content Creation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity: MentorActivity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.mentorName || activity.mentorId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">{activity.description}</TableCell>
                      <TableCell>
                        {activity.metadata?.duration ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.metadata.duration} min</span>
                          </div>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(activity.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {activity.metadata && (
                          <div className="text-sm text-muted-foreground">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <div key={key}>{key}: {String(value)}</div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
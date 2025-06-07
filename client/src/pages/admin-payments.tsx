import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, Filter, DollarSign, CreditCard, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PaymentTransaction {
  id: string;
  reference: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseId: number;
  courseTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  channel?: string;
  fees: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalFees: number;
  netRevenue: number;
  averageTransactionValue: number;
  monthlyRevenue: Array<{ month: string; revenue: number; transactions: number }>;
  topCourses: Array<{ courseId: number; courseTitle: string; revenue: number; enrollments: number }>;
}

export default function AdminPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ['/api/payments/stats'],
  });

  // Fetch all payment transactions
  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/payments/admin/all'],
  });

  const formatPrice = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = 
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportPayments = () => {
    if (!filteredPayments) return;
    
    const csvContent = [
      ['Reference', 'User Email', 'User Name', 'Course Title', 'Amount', 'Currency', 'Status', 'Provider', 'Channel', 'Fees', 'Net Amount', 'Date'].join(','),
      ...filteredPayments.map(payment => [
        payment.reference,
        payment.userEmail,
        payment.userName,
        payment.courseTitle,
        payment.amount,
        payment.currency,
        payment.status,
        payment.provider,
        payment.channel || '',
        payment.fees,
        payment.netAmount,
        new Date(payment.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (statsLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage all payment transactions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage all payment transactions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500">
              Net: {formatPrice(stats?.netRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.successfulTransactions || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.averageTransactionValue || 0)}</div>
            <p className="text-xs text-gray-500">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTransactions || 0}</div>
            <p className="text-xs text-gray-500">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference, email, name, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPayments} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                All payment transactions with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">
                          {payment.reference}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.userName}</div>
                            <div className="text-sm text-gray-500">{payment.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48">
                            <div className="font-medium truncate">{payment.courseTitle}</div>
                            <div className="text-sm text-gray-500">ID: {payment.courseId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatPrice(payment.amount, payment.currency)}</div>
                            {payment.fees > 0 && (
                              <div className="text-sm text-gray-500">
                                Net: {formatPrice(payment.netAmount, payment.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.provider}</div>
                            {payment.channel && (
                              <div className="text-sm text-gray-500">{payment.channel}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No payment transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>Courses generating the most revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topCourses?.map((course, index) => (
                    <div key={course.courseId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{course.courseTitle}</div>
                          <div className="text-sm text-gray-500">{course.enrollments} enrollments</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(course.revenue)}</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No course data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue and transaction trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.monthlyRevenue?.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{month.month}</div>
                        <div className="text-sm text-gray-500">{month.transactions} transactions</div>
                      </div>
                      <div className="font-medium">{formatPrice(month.revenue)}</div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No monthly data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Refund Management</CardTitle>
              <CardDescription>Manage payment refunds and disputes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Refund management functionality will be implemented based on requirements</p>
                <Button variant="outline" className="mt-4">
                  Configure Refund Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Search, Filter, DollarSign, CreditCard, Users, TrendingUp, Eye, User, BookOpen, X, Copy, CheckCircle } from 'lucide-react';
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  const { toast } = useToast();

  // Download receipt handler
  const handleDownloadReceipt = async () => {
    if (!selectedPayment) return;
    
    setIsDownloadingReceipt(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment.reference}/receipt`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${selectedPayment.reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Receipt Downloaded",
        description: "The payment receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // Process refund handler
  const handleProcessRefund = async () => {
    if (!selectedPayment) return;
    
    setIsProcessingRefund(true);
    try {
      const response = await apiRequest('POST', `/api/payments/${selectedPayment.reference}/refund`, {
        amount: selectedPayment.amount,
        reason: 'Admin initiated refund'
      });
      
      if (response.ok) {
        toast({
          title: "Refund Initiated",
          description: "The refund has been initiated successfully. It may take 3-5 business days to reflect.",
        });
        setSelectedPayment(null);
        // Refresh the payments list
        window.location.reload();
      } else {
        throw new Error('Failed to process refund');
      }
    } catch (error) {
      toast({
        title: "Refund Failed",
        description: "Failed to process the refund. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

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

          {/* Transactions Table - Desktop */}
          <div className="hidden lg:block">
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
                        <TableHead className="min-w-[120px]">Reference</TableHead>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead className="min-w-[180px]">Course</TableHead>
                        <TableHead className="min-w-[120px]">Amount</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Provider</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments?.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell className="font-mono text-xs">
                            <div className="truncate max-w-[120px]" title={payment.reference}>
                              {payment.reference}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium truncate max-w-[180px]" title={payment.userName}>
                                {payment.userName}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-[180px]" title={payment.userEmail}>
                                {payment.userEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium truncate max-w-[160px]" title={payment.courseTitle}>
                                {payment.courseTitle}
                              </div>
                              <div className="text-sm text-gray-500">ID: {payment.courseId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-semibold text-green-600 dark:text-green-400">
                                {formatPrice(payment.amount, payment.currency)}
                              </div>
                              {payment.fees > 0 && (
                                <div className="text-xs text-gray-500">
                                  Net: {formatPrice(payment.netAmount, payment.currency)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={payment.status === 'success' ? 'default' : 
                                     payment.status === 'pending' ? 'secondary' : 'destructive'}
                              className="font-medium"
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium capitalize">{payment.provider}</div>
                              {payment.channel && (
                                <div className="text-sm text-gray-500 capitalize">{payment.channel}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                              className="hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center space-y-2">
                              <CreditCard className="h-8 w-8 text-gray-400" />
                              <p className="text-gray-500">No payment transactions found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {filteredPayments?.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {payment.reference}
                      </div>
                      <Badge 
                        variant={payment.status === 'success' ? 'default' : 
                               payment.status === 'pending' ? 'secondary' : 'destructive'}
                        className="font-medium"
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600 dark:text-green-400">
                        {formatPrice(payment.amount, payment.currency)}
                      </div>
                      {payment.fees > 0 && (
                        <div className="text-xs text-gray-500">
                          Net: {formatPrice(payment.netAmount, payment.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{payment.userName}</div>
                        <div className="text-sm text-gray-500 truncate">{payment.userEmail}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{payment.courseTitle}</div>
                        <div className="text-sm text-gray-500">Course ID: {payment.courseId}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <CreditCard className="h-4 w-4" />
                        <span className="capitalize">{payment.provider}</span>
                        {payment.channel && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{payment.channel}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <CreditCard className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">No payment transactions found</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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

      {/* Payment Details Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Transaction Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm">{selectedPayment.id}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => navigator.clipboard.writeText(selectedPayment.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge 
                      variant={selectedPayment.status === 'success' ? 'default' : 
                             selectedPayment.status === 'pending' ? 'secondary' : 'destructive'}
                      className="font-medium"
                    >
                      {selectedPayment.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reference</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {selectedPayment.reference}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => navigator.clipboard.writeText(selectedPayment.reference)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amount</label>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatPrice(selectedPayment.amount, selectedPayment.currency)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Provider</label>
                      <div className="mt-1">
                        <div className="font-medium capitalize">{selectedPayment.provider}</div>
                        {selectedPayment.channel && (
                          <div className="text-sm text-gray-500 capitalize">
                            via {selectedPayment.channel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction Date</label>
                      <div className="mt-1">
                        <div className="font-medium">
                          {new Date(selectedPayment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(selectedPayment.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {selectedPayment.fees > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fees & Net Amount</label>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm">
                            Fees: {formatPrice(selectedPayment.fees, selectedPayment.currency)}
                          </div>
                          <div className="font-medium">
                            Net: {formatPrice(selectedPayment.netAmount, selectedPayment.currency)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Customer Information</h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{selectedPayment.userName}</div>
                      <div className="text-sm text-gray-500">{selectedPayment.userEmail}</div>
                      <div className="text-sm text-gray-500 mt-1">User ID: {selectedPayment.userId}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Course Information</h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{selectedPayment.courseTitle}</div>
                      <div className="text-sm text-gray-500 mt-1">Course ID: {selectedPayment.courseId}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadReceipt}
                    disabled={isDownloadingReceipt}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                  </Button>
                  {selectedPayment.status === 'success' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleProcessRefund}
                      disabled={isProcessingRefund}
                    >
                      {isProcessingRefund ? 'Processing...' : 'Process Refund'}
                    </Button>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedPayment(null)}
                  disabled={isDownloadingReceipt || isProcessingRefund}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Download,
  Filter,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CommissionOverview {
  stats: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalCount: number;
    pendingCount: number;
    paidCount: number;
    totalRevenue: number;
    totalTransactions: number;
    successfulPayments: number;
  };
  recentCommissions: any[];
  pendingPayouts: any[];
  topMentors: any[];
}

export default function AdminCommissionOverview() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: overview, isLoading } = useQuery<CommissionOverview>({
    queryKey: ['/api/admin/commission-overview'],
    queryFn: () => apiRequest('/api/admin/commission-overview').then(res => res.json())
  });

  const updateCommissionMutation = useMutation({
    mutationFn: ({ commissionId, status }: { commissionId: number; status: string }) =>
      apiRequest(`/api/admin/commissions/${commissionId}/status`, 'PUT', { status })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission-overview'] });
      toast({
        title: "Success",
        description: "Commission status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission status",
        variant: "destructive",
      });
    }
  });

  const processBulkPayoutsMutation = useMutation({
    mutationFn: ({ mentorIds, paymentMethod }: { mentorIds: string[]; paymentMethod: string }) =>
      apiRequest('/api/admin/process-payouts', 'POST', { mentorIds, paymentMethod })
        .then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission-overview'] });
      toast({
        title: "Success",
        description: `Processed ${data.processedPayouts.length} payouts successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payouts",
        variant: "destructive",
      });
    }
  });

  const handleUpdateCommissionStatus = (commissionId: number, status: string) => {
    updateCommissionMutation.mutate({ commissionId, status });
  };

  const handleProcessBulkPayouts = () => {
    const mentorIds = overview?.pendingPayouts
      ?.filter(p => p.status === 'pending')
      ?.map(p => p.mentorId) || [];
    
    if (mentorIds.length > 0) {
      processBulkPayoutsMutation.mutate({ 
        mentorIds: Array.from(new Set(mentorIds)), 
        paymentMethod: 'bank_transfer' 
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredCommissions = overview?.recentCommissions?.filter(commission =>
    commission.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Commission Oversight</h1>
          <p className="text-muted-foreground">Monitor and manage mentor commissions and payouts</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleProcessBulkPayouts}
            disabled={processBulkPayoutsMutation.isPending || !overview?.pendingPayouts?.length}
            className="bg-green-600 hover:bg-green-700"
          >
            {processBulkPayoutsMutation.isPending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Process All Payouts
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Commissions"
          value={formatCurrency(overview?.stats.totalCommissions || 0)}
          description="All-time commission payments"
          icon={DollarSign}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(overview?.stats.pendingCommissions || 0)}
          description={`${overview?.stats.pendingCount || 0} pending payments`}
          icon={Clock}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(overview?.stats.totalRevenue || 0)}
          description={`${overview?.stats.totalTransactions || 0} transactions`}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Mentors"
          value={overview?.topMentors?.length || 0}
          description="Earning commissions"
          icon={Users}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
          <TabsTrigger value="mentors">Top Mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Summary</CardTitle>
                <CardDescription>Payment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Payments</span>
                    <Badge variant="secondary">{overview?.stats.totalCount || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Paid
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(overview?.stats.paidCommissions || 0)}</div>
                      <div className="text-xs text-muted-foreground">{overview?.stats.paidCount || 0} payments</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      Pending
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(overview?.stats.pendingCommissions || 0)}</div>
                      <div className="text-xs text-muted-foreground">{overview?.stats.pendingCount || 0} payments</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Commissions</CardTitle>
                <CardDescription>Latest commission activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.recentCommissions?.slice(0, 5).map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {commission.mentorName?.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{commission.mentorName}</div>
                          <div className="text-xs text-muted-foreground">{commission.courseTitle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(commission.amount)}</div>
                        <Badge className={`text-xs ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Commissions</CardTitle>
              <CardDescription>Manage commission payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by mentor or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="space-y-4">
                {filteredCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {commission.mentorName?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{commission.mentorName}</div>
                        <div className="text-sm text-muted-foreground">{commission.courseTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(commission.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(commission.amount)}</div>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {commission.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateCommissionStatus(commission.id, 'paid')}
                                disabled={updateCommissionMutation.isPending}
                              >
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateCommissionStatus(commission.id, 'cancelled')}
                                disabled={updateCommissionMutation.isPending}
                              >
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>Commissions awaiting payment</CardDescription>
                </div>
                <Button 
                  onClick={handleProcessBulkPayouts}
                  disabled={processBulkPayoutsMutation.isPending || !overview?.pendingPayouts?.length}
                  size="sm"
                >
                  Process All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview?.pendingPayouts?.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {payout.mentorName?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{payout.mentorName}</div>
                        <div className="text-sm text-muted-foreground">{payout.mentorEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          Pending since: {formatDate(payout.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(payout.amount)}</div>
                        <div className="text-xs text-muted-foreground">{payout.courseTitle}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCommissionStatus(payout.id, 'paid')}
                        disabled={updateCommissionMutation.isPending}
                      >
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!overview?.pendingPayouts?.length) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending payouts at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Mentors</CardTitle>
              <CardDescription>Mentors ranked by total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview?.topMentors?.map((mentor, index) => (
                  <div key={mentor.mentorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {mentor.mentorName?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{mentor.mentorName}</div>
                        <div className="text-sm text-muted-foreground">{mentor.mentorEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          {mentor.totalCommissions} commissions
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-lg">{formatCurrency(mentor.totalEarnings)}</div>
                      <div className="text-sm space-x-2">
                        <span className="text-green-600">Paid: {formatCurrency(mentor.paidAmount)}</span>
                      </div>
                      <div className="text-sm space-x-2">
                        <span className="text-yellow-600">Pending: {formatCurrency(mentor.pendingAmount)}</span>
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
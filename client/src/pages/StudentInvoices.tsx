import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Receipt,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  description: string;
  lineItems: any[];
  courseName: string;
  createdAt: string;
}

interface PaymentTransaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  channel: string;
  fees?: number;
  netAmount?: number;
  createdAt: string;
  invoice?: {
    invoiceNumber: string;
    description: string;
    courseName: string;
  };
}

export default function StudentInvoices() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const fetchInvoices = async () => {
    try {
      const response = await apiRequest("GET", "/api/invoices/user");
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.invoices);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch invoices",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiRequest("GET", "/api/transactions/user");
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: number) => {
    setPayingInvoice(invoiceId);
    
    try {
      // Initialize payment
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/pay`, {
        email: user?.email
      });
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Paystack payment page
        window.open(data.paymentUrl, '_blank');
        
        toast({
          title: "Payment Initiated",
          description: "You will be redirected to complete your payment"
        });
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Failed to initialize payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment",
        variant: "destructive"
      });
    } finally {
      setPayingInvoice(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-2">Manage your invoices and payment history</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'transactions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Receipt className="h-4 w-4 inline mr-2" />
          Transactions
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
                <p className="text-gray-600 text-center">
                  You don't have any invoices yet. Invoices will appear here when you enroll in courses.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Invoice #{invoice.invoiceNumber}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {invoice.courseName}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Due Date: {format(new Date(invoice.dueDate), 'PPP')}</span>
                          {isOverdue(invoice.dueDate) && invoice.status !== 'paid' && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </div>
                        
                        {invoice.paidAt && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Paid on {format(new Date(invoice.paidAt), 'PPP')}</span>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600">
                          <strong>Description:</strong> {invoice.description}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {invoice.lineItems && invoice.lineItems.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                            <div className="space-y-1">
                              {invoice.lineItems.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.description}</span>
                                  <span>{formatAmount(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Created on {format(new Date(invoice.createdAt), 'PPP')}
                      </div>
                      
                      {invoice.status === 'pending' && (
                        <Button
                          onClick={() => handlePayInvoice(invoice.id)}
                          disabled={payingInvoice === invoice.id}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {payingInvoice === invoice.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                <p className="text-gray-600 text-center">
                  Your payment transactions will appear here once you make payments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {transaction.invoice?.description || 'Payment Transaction'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Reference: {transaction.reference}
                          </p>
                          {transaction.invoice && (
                            <p className="text-sm text-gray-600">
                              Course: {transaction.invoice.courseName}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(transaction.createdAt), 'PPp')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Provider: {transaction.provider}</span>
                        <span>Channel: {transaction.channel}</span>
                      </div>
                      
                      {transaction.fees && (
                        <div className="text-right">
                          <div>Fees: {formatAmount(transaction.fees)}</div>
                          {transaction.netAmount && (
                            <div>Net: {formatAmount(transaction.netAmount)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
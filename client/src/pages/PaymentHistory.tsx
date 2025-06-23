import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, CreditCard, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentRecord {
  id: number;
  courseId: number;
  courseTitle: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentProvider: string;
  status: string;
  createdAt: string;
  invoiceUrl?: string;
}

export default function PaymentHistory() {
  const { toast } = useToast();
  
  const { data: payments, isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['/api/student/payment-history'],
  });

  const handleDownloadReceipt = async (paymentId: number, reference: string) => {
    try {
      const response = await apiRequest("GET", `/api/enrollments/${paymentId}/receipt`, {});
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${reference}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Receipt Downloaded",
          description: "Your payment receipt has been downloaded successfully.",
        });
      } else {
        throw new Error('Failed to download receipt');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Receipt className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Payment History</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Receipt className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Payment History</h1>
      </div>

      {!payments || payments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Payment History</h3>
            <p className="text-gray-500">You haven't made any payments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{payment.courseTitle}</CardTitle>
                  <Badge className={`${getStatusColor(payment.status)} text-white`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold">₦{(payment.amount / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium capitalize">{payment.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-mono text-sm">{payment.paymentReference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <p className="text-sm">{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                {payment.status.toLowerCase() === 'completed' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-sm text-gray-500">
                      Payment processed via {payment.paymentProvider}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(payment.id, payment.paymentReference)}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Receipt</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
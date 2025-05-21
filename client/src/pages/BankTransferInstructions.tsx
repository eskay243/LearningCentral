import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/currencyUtils";
import { ContextualHelp } from "@/components/ui/ContextualHelp";

interface AccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
}

export default function BankTransferInstructions() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  
  // Get state from location
  const state = location.state as { 
    courseId: string; 
    accountDetails: AccountDetails; 
    amount: number;
    reference: string;
  } | undefined;
  
  useEffect(() => {
    // Redirect if no state (user might have navigated directly to this page)
    if (!state || !state.accountDetails) {
      toast({
        title: "Error",
        description: "Missing payment information. Redirecting to courses page.",
        variant: "destructive",
      });
      navigate("/courses");
    }
  }, [state, navigate, toast]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ ...copied, [field]: true });
      
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [field]: false }));
      }, 3000);
    });
  };

  if (!state || !state.accountDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  const { accountDetails, amount } = state;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Bank Transfer Instructions</h1>
      <p className="text-gray-600 mb-8">
        Follow these instructions to complete your payment via bank transfer.
      </p>

      <div className="relative">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
              Please use these details to make your bank transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount to Pay</p>
                  <p className="text-lg font-bold">{formatCurrency(amount, 'NGN')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCopy(amount.toString(), "amount")}
                >
                  {copied.amount ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied.amount ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bank Name</p>
                  <p className="font-medium">{accountDetails.bankName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCopy(accountDetails.bankName, "bank")}
                >
                  {copied.bank ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied.bank ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <p className="font-medium">{accountDetails.accountNumber}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCopy(accountDetails.accountNumber, "account")}
                >
                  {copied.account ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied.account ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Name</p>
                  <p className="font-medium">{accountDetails.accountName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCopy(accountDetails.accountName, "name")}
                >
                  {copied.name ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied.name ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Reference/Narration</p>
                  <p className="font-medium text-primary">
                    {state.reference || accountDetails.reference}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    It's important to include this reference when making your transfer
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCopy(state.reference || accountDetails.reference, "reference")}
                >
                  {copied.reference ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied.reference ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 w-full">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> After making your transfer, please allow up to 24 hours for your payment to be verified. You will receive an email confirmation once your payment is processed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/courses")}>
                Back to Courses
              </Button>
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <ContextualHelp 
          id="bank-transfer-help"
          title="Bank Transfer Instructions"
          content={
            <div>
              <p>You've chosen to pay via bank transfer. Here's what you need to do:</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Copy the account details provided</li>
                <li>Make a transfer for the exact amount shown</li>
                <li>Include the reference code in your transfer description</li>
                <li>Wait for payment confirmation (typically within 24 hours)</li>
              </ol>
              <p className="mt-2">Once your payment is verified, you'll automatically get access to your course.</p>
            </div>
          }
          characterId="guru"
          position="right"
          triggerOnFirstVisit={true}
        />
      </div>
    </div>
  );
}
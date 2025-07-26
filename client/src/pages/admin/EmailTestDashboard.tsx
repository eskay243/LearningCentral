import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EmailTest {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const emailTests: EmailTest[] = [
  {
    type: 'welcome',
    label: 'Welcome Email',
    description: 'Send a welcome email to new users',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />
  },
  {
    type: 'enrollment',
    label: 'Course Enrollment',
    description: 'Send course enrollment confirmation with payment details',
    icon: <Mail className="w-5 h-5 text-blue-500" />
  },
  {
    type: 'commission',
    label: 'Mentor Commission',
    description: 'Send commission notification to mentors',
    icon: <AlertCircle className="w-5 h-5 text-orange-500" />
  }
];

export default function EmailTestDashboard() {
  const [selectedType, setSelectedType] = useState('welcome');
  const [recipientEmail, setRecipientEmail] = useState('admin@codelabeducare.com');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/test-email', {
        to: recipientEmail,
        type: selectedType
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, [selectedType]: true }));
        toast({
          title: "Email Sent Successfully!",
          description: data.message,
          variant: "default"
        });
      } else {
        const error = await response.json();
        setTestResults(prev => ({ ...prev, [selectedType]: false }));
        toast({
          title: "Email Failed",
          description: error.message || "Failed to send email",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [selectedType]: false }));
      toast({
        title: "Error",
        description: "An error occurred while sending email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    setIsLoading(true);
    setTestResults({});
    
    for (const emailTest of emailTests) {
      try {
        const response = await apiRequest('POST', '/api/test-email', {
          to: recipientEmail,
          type: emailTest.type
        });

        setTestResults(prev => ({ 
          ...prev, 
          [emailTest.type]: response.ok 
        }));
        
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setTestResults(prev => ({ 
          ...prev, 
          [emailTest.type]: false 
        }));
      }
    }
    
    setIsLoading(false);
    toast({
      title: "All Tests Completed",
      description: "Check the results below",
      variant: "default"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email System Testing</h1>
          <p className="text-muted-foreground">Test SendGrid email functionality and templates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          SendGrid Integration Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Email Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and send test emails to verify functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailType">Email Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  {emailTests.map((test) => (
                    <SelectItem key={test.type} value={test.type}>
                      <div className="flex items-center gap-2">
                        {test.icon}
                        {test.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendTestEmail} 
                disabled={isLoading || !recipientEmail}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
              <Button 
                onClick={handleRunAllTests} 
                disabled={isLoading || !recipientEmail}
                variant="outline"
              >
                Run All Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Status of email delivery tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailTests.map((test) => (
                <div key={test.type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {test.icon}
                    <div>
                      <p className="font-medium">{test.label}</p>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                  </div>
                  <div>
                    {testResults[test.type] === true && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Sent</span>
                      </div>
                    )}
                    {testResults[test.type] === false && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Email Templates</CardTitle>
          <CardDescription>
            Professional email templates for the Nigerian education market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-600">Welcome Email</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sent to new users after registration with account activation details
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600">Enrollment Confirmation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sent after successful course payment with access instructions
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-orange-600">Commission Notification</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sent to mentors when earning 37% commission from enrollments
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-purple-600">Certificate Delivery</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sent when course completion certificates are generated
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-red-600">Password Reset</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Secure password reset links with 1-hour expiration
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-indigo-600">Course Updates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Notifications for new lessons, announcements, and updates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
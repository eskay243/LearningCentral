import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import useAuth from "@/hooks/useAuth";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const makeAdmin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Not logged in",
        description: "You need to log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/setup-admin", {});
      const data = await res.json();
      setSuccess(true);
      toast({
        title: "Success!",
        description: data.message,
      });
    } catch (err: any) {
      setError(err.message || "Failed to set up admin account");
      toast({
        title: "Error",
        description: err.message || "Failed to set up admin account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Admin Setup</CardTitle>
          <CardDescription>
            Make your account an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated && !isLoading ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not logged in</AlertTitle>
              <AlertDescription>
                Please <a href="/api/login" className="underline font-medium">sign in</a> first to continue.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : user?.role === "admin" ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>You're already an admin!</AlertTitle>
              <AlertDescription>
                Your account already has administrator privileges.
              </AlertDescription>
            </Alert>
          ) : success ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your account has been upgraded to administrator. You can now access all admin features.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-center text-sm">
                Click the button below to upgrade your account to administrator. 
                This will give you access to all platform management features.
              </p>
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={makeAdmin} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Make me an Admin"
                  )}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSetup;
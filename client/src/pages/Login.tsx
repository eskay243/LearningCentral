import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import useAuth from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && !isLoading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  const handleLogin = () => {
    // Redirect to the login endpoint
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Codelab Educare</CardTitle>
          <CardDescription>
            Sign in to access your learning dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Please sign in with your account to continue
            </p>
            <div className="flex justify-center mt-4">
              {isLoading ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full max-w-sm"
                  onClick={handleLogin}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;

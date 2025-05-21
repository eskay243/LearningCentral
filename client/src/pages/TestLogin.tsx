import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TestLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.STUDENT);

  const handleLogin = async () => {
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `${selectedRole}@codelabeducare.com`,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      
      toast({
        title: "Login Successful",
        description: `You are now logged in as a ${selectedRole} user.`,
      });

      // Invalidate queries to update user state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to demo users page
      setTimeout(() => {
        navigate("/demo-users");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const roleDescriptions = {
    [UserRole.ADMIN]: "Full access to manage courses, users, and system settings",
    [UserRole.MENTOR]: "Create and manage courses, assignments, and student progress",
    [UserRole.STUDENT]: "Enroll in courses, complete exercises, and earn certificates",
    [UserRole.AFFILIATE]: "Promote courses and earn commission on enrollments",
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-2xl text-center text-purple-700 dark:text-purple-400">Test Login</CardTitle>
          <CardDescription className="text-center text-slate-600 dark:text-slate-400">
            Log in with a demo user role for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Role
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Roles</SelectLabel>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-4">
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              <>Log in as {selectedRole}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
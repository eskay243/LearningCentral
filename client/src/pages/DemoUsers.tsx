import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@shared/schema";
import { Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SwitchRoleResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    role: string;
    affiliateCode?: string;
  }
}

export default function DemoUsers() {
  const { toast } = useToast();
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(currentUser?.role || UserRole.ADMIN);
  const [isSwitching, setIsSwitching] = useState(false);

  // Switch the current user's role
  const switchUserRole = async (role: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to switch roles",
        variant: "destructive",
      });
      return;
    }

    setIsSwitching(true);
    try {
      const response = await fetch(`/api/switch-user-role/${role}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to switch user role");
      }
      
      const data: SwitchRoleResponse = await response.json();
      
      // Invalidate auth queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Role updated successfully",
        description: `Your role has been changed to ${role}. You may need to refresh to see all changes.`,
      });

      setSelectedRole(role);
    } catch (error) {
      toast({
        title: "Error switching role",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case UserRole.MENTOR:
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
      case UserRole.STUDENT:
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
      case UserRole.AFFILIATE:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
    }
  };

  const roleDescriptions = {
    [UserRole.ADMIN]: "Full access to manage courses, users, and system settings",
    [UserRole.MENTOR]: "Create and manage courses, assignments, and student progress",
    [UserRole.STUDENT]: "Enroll in courses, complete exercises, and earn certificates",
    [UserRole.AFFILIATE]: "Promote courses and earn commission on enrollments",
  };

  const roleIcons = {
    [UserRole.ADMIN]: () => <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>,
    [UserRole.MENTOR]: () => <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/><path d="m2 9 20 6"/><path d="M15 13v3"/><path d="M9 13v9"/></svg>,
    [UserRole.STUDENT]: () => <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M5 19v-4.5A2.5 2.5 0 0 1 7.5 12h9a2.5 2.5 0 0 1 2.5 2.5V19"/><path d="M3 19h18"/></svg>,
    [UserRole.AFFILIATE]: () => <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Role Switcher</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-3xl mx-auto">
          Test the Codelab Educare Learning Management System with different user roles
        </p>
      </div>

      {authLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !isAuthenticated ? (
        <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Authentication Required</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Please log in to use the role switcher
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="mb-6 text-slate-600 dark:text-slate-300">
                You need to be logged in to test different user roles. Please log in to continue.
              </p>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Current User</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Your current user information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <img 
                    src={currentUser?.profileImageUrl || "https://api.dicebear.com/7.x/initials/svg?seed=User"} 
                    alt={`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2 flex-grow">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {currentUser?.firstName || ""} {currentUser?.lastName || ""}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">{currentUser?.email || ""}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Current role:</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(currentUser?.role || "")}`}>
                      {currentUser?.role || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Switch User Role</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Select a role to test different features and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(UserRole).map((role) => (
                  <Card 
                    key={role}
                    className={`border transition-all hover:shadow-md cursor-pointer ${
                      currentUser?.role === role 
                        ? "border-primary bg-primary/5" 
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    onClick={() => switchUserRole(role)}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-full ${getRoleColor(role)}`}>
                            {roleIcons[role as keyof typeof roleIcons]?.()}
                          </div>
                          <h3 className="font-medium text-slate-800 dark:text-slate-200">{role}</h3>
                        </div>
                        {currentUser?.role === role && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {roleDescriptions[role as keyof typeof roleDescriptions]}
                      </p>
                      <Button 
                        variant={currentUser?.role === role ? "outline" : "default"}
                        size="sm" 
                        className="w-full"
                        disabled={isSwitching || currentUser?.role === role}
                        onClick={(e) => {
                          e.stopPropagation();
                          switchUserRole(role);
                        }}
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Switching...
                          </>
                        ) : currentUser?.role === role ? (
                          <>Current Role</>
                        ) : (
                          <>Switch to {role}</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-amber-700 dark:text-amber-400">
                After switching roles, you may need to refresh the page or navigate to a different section to see the changes.
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                Different roles have different permissions and access to features in the LMS.
              </p>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                  onClick={() => queryClient.invalidateQueries()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


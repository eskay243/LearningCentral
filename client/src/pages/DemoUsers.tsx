import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@shared/schema";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface DemoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  role: string;
  affiliateCode?: string;
}

interface DemoUsersResponse {
  message: string;
  users: {
    admin: DemoUser;
    mentor: DemoUser;
    student: DemoUser;
    affiliate: DemoUser;
  }
}

export default function DemoUsers() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUsersResponse | null>(null);

  // Fetch demo users
  const generateDemoUsers = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/create-demo-users");
      if (!response.ok) {
        throw new Error("Failed to create demo users");
      }
      const data = await response.json();
      setDemoUsers(data);
      toast({
        title: "Demo users created successfully!",
        description: "You can now test the app with different user roles.",
      });
    } catch (error) {
      toast({
        title: "Error creating demo users",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLoginInfo = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied to clipboard!",
      description: `Email "${email}" copied. You can use this to log in.`,
    });
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

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Codelab Educare LMS Demo Users</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-3xl mx-auto">
          Test the Learning Management System with different user roles to explore all features and functionality
        </p>
      </div>

      {!demoUsers ? (
        <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Create Demo Users</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Generate demo accounts to test all user roles in the Learning Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <p className="mb-6 text-slate-600 dark:text-slate-300">
                Click the button below to create demo users for all available roles. After creation, you can use these accounts to log in and test the system's features.
              </p>
              <Button 
                onClick={generateDemoUsers} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Demo Users...
                  </>
                ) : (
                  <>Generate Demo Users</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="space-y-6">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <TabsTrigger value="admin" className="font-medium">Admin</TabsTrigger>
              <TabsTrigger value="mentor" className="font-medium">Mentor</TabsTrigger>
              <TabsTrigger value="student" className="font-medium">Student</TabsTrigger>
              <TabsTrigger value="affiliate" className="font-medium">Affiliate</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <UserRoleCard user={demoUsers.users.admin} onCopy={copyLoginInfo} />
            </TabsContent>
            
            <TabsContent value="mentor">
              <UserRoleCard user={demoUsers.users.mentor} onCopy={copyLoginInfo} />
            </TabsContent>
            
            <TabsContent value="student">
              <UserRoleCard user={demoUsers.users.student} onCopy={copyLoginInfo} />
            </TabsContent>
            
            <TabsContent value="affiliate">
              <UserRoleCard user={demoUsers.users.affiliate} onCopy={copyLoginInfo} />
            </TabsContent>
          </Tabs>
          
          <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-400">
                To test each user role, click the "Copy Email" button for the user you want to test. Then log out of your current session and log back in using the copied email.
              </p>
              <p className="mt-2 text-amber-700 dark:text-amber-400">
                Since this is a demo version using Replit Auth, you'll be asked to authenticate, but the system will recognize the user role from the email you copied.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function UserRoleCard({ user, onCopy }: { user: DemoUser; onCopy: (email: string) => void }) {
  const roleColors = {
    [UserRole.ADMIN]: "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800",
    [UserRole.MENTOR]: "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800",
    [UserRole.STUDENT]: "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800",
    [UserRole.AFFILIATE]: "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800",
  };

  const roleGradients = {
    [UserRole.ADMIN]: "from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-800",
    [UserRole.MENTOR]: "from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800",
    [UserRole.STUDENT]: "from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800",
    [UserRole.AFFILIATE]: "from-purple-50 to-violet-50 dark:from-slate-800 dark:to-slate-800",
  };

  const roleTextColors = {
    [UserRole.ADMIN]: "text-red-700 dark:text-red-400",
    [UserRole.MENTOR]: "text-blue-700 dark:text-blue-400",
    [UserRole.STUDENT]: "text-green-700 dark:text-green-400",
    [UserRole.AFFILIATE]: "text-purple-700 dark:text-purple-400",
  };

  return (
    <Card className={`border shadow-md overflow-hidden ${roleColors[user.role as keyof typeof roleColors] || "border-slate-200 dark:border-slate-700"}`}>
      <CardHeader className={`bg-gradient-to-r ${roleGradients[user.role as keyof typeof roleGradients] || "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800"} border-b border-slate-200 dark:border-slate-700`}>
        <CardTitle className={`text-xl flex items-center ${roleTextColors[user.role as keyof typeof roleTextColors] || "text-slate-700 dark:text-slate-200"}`}>
          {user.firstName} {user.lastName} 
          <span className="ml-2 text-sm font-normal px-2 py-1 rounded-full bg-white/60 dark:bg-black/20 border border-current">
            {user.role}
          </span>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Test the platform with {user.role} privileges
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
            <img 
              src={user.profileImageUrl} 
              alt={`${user.firstName} ${user.lastName}`} 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-2 flex-grow">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
              <p className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                {user.email}
              </p>
            </div>
            {user.affiliateCode && (
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Affiliate Code</p>
                <p className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                  {user.affiliateCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700">
        <Button 
          onClick={() => onCopy(user.email)}
          className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
        >
          <Check className="mr-2 h-4 w-4" /> Copy Email
        </Button>
      </CardFooter>
    </Card>
  );
}
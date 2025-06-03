import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen, Users, Award, Code2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  // Redirect if user is already logged in
  if (user && !isLoading) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  const demoCredentials = [
    { email: "israel.alabi@codelabeducare.com", role: "Mentor", name: "Israel Alabi" },
    { email: "abdul.mohammed@codelabeducare.com", role: "Mentor", name: "Abdul Mohammed" },
    { email: "mercy.nathaniel@codelabeducare.com", role: "Mentor", name: "Mercy Nathaniel" },
    { email: "oyinkonsola.ojobo@codelabeducare.com", role: "Student", name: "Oyinkonsola Ojobo" },
    { email: "queen.joseph@codelabeducare.com", role: "Student", name: "Queen Joseph" },
    { email: "ummi.lawal@codelabeducare.com", role: "Admin", name: "Ummi Lawal" }
  ];

  const quickLogin = (email: string) => {
    setLoginForm({ email, password: "Password1234" });
    loginMutation.mutate({ email, password: "Password1234" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-cream-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 to-cream-50 dark:from-gray-900 dark:to-gray-800">
      {/* Left Side - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Codelab Educare
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your journey to coding excellence starts here
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  {/* Demo Users Quick Login */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Demo accounts for testing:
                    </p>
                    <div className="space-y-2">
                      {demoCredentials.map((demo) => (
                        <Button
                          key={demo.email}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => quickLogin(demo.email)}
                          disabled={loginMutation.isPending}
                        >
                          <span className="font-medium">{demo.name}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {demo.role}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      All demo accounts use password: "Password1234"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join our learning community today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          placeholder="John"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 text-white p-12">
        <div className="max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              Master Coding Skills
            </h2>
            <p className="text-xl text-purple-100">
              Join thousands of students learning to code with interactive lessons, 
              real-world projects, and expert mentorship.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Interactive Courses</h3>
              <p className="text-sm text-purple-100">
                Learn with hands-on coding exercises
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Expert Mentors</h3>
              <p className="text-sm text-purple-100">
                Get guidance from industry professionals
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Certificates</h3>
              <p className="text-sm text-purple-100">
                Earn verified certificates upon completion
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Real Projects</h3>
              <p className="text-sm text-purple-100">
                Build portfolio-worthy applications
              </p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-purple-100">
              Start your coding journey today and transform your career
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
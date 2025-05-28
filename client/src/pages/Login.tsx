import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Users, 
  Award, 
  Brain, 
  Code, 
  MessageSquare,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
      const response = await apiRequest("POST", endpoint, formData);
      
      if (response.ok) {
        const user = await response.json();
        toast({
          title: isSignup ? "Account created!" : "Welcome back!",
          description: isSignup ? "Your account has been created successfully." : "You've been logged in successfully.",
        });
        navigate("/dashboard");
      } else {
        const error = await response.json();
        toast({
          title: "Authentication failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const stats = [
    { number: "10,000+", label: "Students" },
    { number: "500+", label: "Courses" },
    { number: "95%", label: "Success Rate" },
    { number: "4.9/5", label: "Rating" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                Codelab Educare
              </span>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isSignup ? "Create Account" : "Let's Sign You In"}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => setIsSignup(!isSignup)}
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
              {" • "}
              <a href="/demo-users" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">
                Try demo
              </a>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name Fields for Signup */}
              {isSignup && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                        required={isSignup}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                        required={isSignup}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="hello.user@email.co"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox 
                    id="remember-me"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded opacity-50"
                    disabled
                  />
                  <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember Me
                  </Label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Login/Signup Button */}
              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Please wait..." : (isSignup ? "Create Account" : "Sign In")}
                </Button>
              </div>

              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">OR</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Continue with Replit
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = "/api/auth/google"}
                    variant="outline"
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = "/api/auth/github"}
                    variant="outline"
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Continue with GitHub
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = "/api/auth/microsoft"}
                    variant="outline"
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M0 0h11.5v11.5H0z"/>
                      <path fill="#00A4EF" d="M12.5 0H24v11.5H12.5z"/>
                      <path fill="#7FBA00" d="M0 12.5h11.5V24H0z"/>
                      <path fill="#FFB900" d="M12.5 12.5H24V24H12.5z"/>
                    </svg>
                    Continue with Microsoft
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Right side - Illustration & Features */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative h-full overflow-y-auto p-12">
            <div className="text-center text-white space-y-8 max-w-lg mx-auto min-h-full flex flex-col justify-center">
              {/* Animated Coding Illustration */}
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 bg-white/10 rounded-full backdrop-blur-sm"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center">
                  <div className="relative">
                    <div className="text-8xl filter drop-shadow-lg">👨‍💻</div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Floating code elements */}
                <div className="absolute top-8 left-8 bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-bounce" style={{ animationDelay: '1s' }}>
                  <Code className="w-4 h-4" />
                </div>
                <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-bounce" style={{ animationDelay: '2s' }}>
                  <Brain className="w-4 h-4" />
                </div>
                <div className="absolute top-1/2 left-0 bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              
              {/* Hero Text */}
              <div>
                <h3 className="text-4xl font-bold mb-4">Master Coding Skills</h3>
                <p className="text-lg text-purple-100 leading-relaxed">
                  Join thousands of students learning to code with our interactive platform. 
                  Build real projects, get instant feedback, and accelerate your career.
                </p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                    <div className="text-2xl font-bold">{stat.number}</div>
                    <div className="text-purple-200">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Feature Highlights */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Code className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">Interactive coding exercises</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">AI-powered learning assistant</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">Industry-recognized certificates</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">Expert mentor guidance</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">Community support network</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-purple-100">Real-time progress tracking</span>
                </div>
              </div>

              {/* Popular Courses */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4">Popular Courses</h4>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">JavaScript Fundamentals</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">₦25,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Python for Beginners</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">₦30,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">React Development</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">₦45,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Data Science Bootcamp</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">₦65,000</span>
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4">What Students Say</h4>
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-purple-100 text-sm italic">
                      "Codelab Educare changed my life. The interactive approach made learning so much easier!"
                    </p>
                    <p className="text-purple-200 text-xs">- Sarah O., Lagos</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-purple-100 text-sm italic">
                      "The AI assistant is incredible. It's like having a personal tutor available 24/7."
                    </p>
                    <p className="text-purple-200 text-xs">- David M., Abuja</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-purple-100 text-sm italic">
                      "Got my first tech job within 3 months of completing the program. Highly recommended!"
                    </p>
                    <p className="text-purple-200 text-xs">- Adaora N., Port Harcourt</p>
                  </div>
                </div>
              </div>

              {/* Learning Path */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4">Your Learning Journey</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                    <span className="text-purple-100">Choose your learning path</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                    <span className="text-purple-100">Learn through interactive exercises</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                    <span className="text-purple-100">Build real-world projects</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">4</div>
                    <span className="text-purple-100">Get certified and land your dream job</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
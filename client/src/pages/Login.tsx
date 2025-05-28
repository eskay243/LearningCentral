import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    window.location.href = "/api/login";
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
              Let's Sign You In
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a href="/demo-users" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">
                Try demo
              </a>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6">
              {/* Username/Email Field */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username or Email
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="hello.user@email.co"
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white opacity-50"
                    disabled
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
                    autoComplete="current-password"
                    className="block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white opacity-50"
                    disabled
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled
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

              {/* Login Button (disabled) */}
              <div>
                <Button
                  type="button"
                  className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 opacity-50 cursor-not-allowed"
                  disabled
                >
                  Login
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

                {/* Replit Login Button */}
                <div className="mt-6">
                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Continue with Replit
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
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Globe
} from "lucide-react";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: <Code className="h-6 w-6" />,
      title: "Interactive Coding",
      description: "Learn by doing with hands-on coding exercises and real-world projects"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Code Companion",
      description: "Get instant help and smart suggestions from our AI-powered coding assistant"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Mentorship",
      description: "Learn from industry professionals with years of real-world experience"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Professional Certificates",
      description: "Earn recognized certificates to boost your career prospects"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Community Support",
      description: "Connect with fellow learners and get help when you need it"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Progressive Learning",
      description: "Structured curriculum that adapts to your learning pace and style"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Full-Stack Developer",
      content: "Codelab Educare transformed my career. The hands-on approach and expert mentorship helped me land my dream job.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Data Scientist",
      content: "The AI Code Companion is incredible. It's like having a personal tutor available 24/7.",
      rating: 5
    },
    {
      name: "Amara Okafor",
      role: "Mobile Developer",
      content: "The practical projects and real-world scenarios prepared me for actual industry challenges.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10,000+", label: "Students Enrolled" },
    { number: "500+", label: "Courses Available" },
    { number: "95%", label: "Job Placement Rate" },
    { number: "4.9/5", label: "Average Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cream-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Codelab Educare
            </span>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secure Authentication
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">Coding Skills</span> for the Future
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join Nigeria's premier coding education platform. Learn from industry experts, 
              build real projects, and accelerate your tech career with our comprehensive courses.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <Card className="max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to continue your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button 
                  onClick={handleLogin}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 transition-all duration-200 transform hover:scale-105"
                >
                  Continue with Replit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  New to Codelab Educare? You'll be able to create an account after clicking above.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Codelab Educare?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We combine cutting-edge technology with proven teaching methods to deliver 
              the most effective coding education experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 flex items-center justify-center mb-4">
                    <div className="text-purple-600 dark:text-purple-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Students Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join thousands of successful graduates who transformed their careers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-purple-600 to-purple-800 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg mb-6 text-purple-100">
                Join thousands of students who are already building their future in tech. 
                Your next career breakthrough is just one click away.
              </p>
              <Button 
                onClick={handleLogin}
                variant="secondary"
                className="h-12 px-8 text-base font-semibold bg-white text-purple-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
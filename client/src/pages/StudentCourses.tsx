import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, Filter, Star, Clock, Users, Play, CheckCircle2, Trophy, Sparkles, Award } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string | null;
  isPublished: boolean;
  thumbnail: string | null;
  mentorId?: string;
  isEnrolled?: boolean;
  progress?: number;
  status?: string;
  rating?: number;
  totalLessons?: number;
  completedLessons?: number;
  enrollmentDate?: string;
  completedAt?: string;
  certificateEligible?: boolean;
}

interface EnrolledCourse extends Course {
  isEnrolled: true;
  progress: number;
  status?: string;
  enrollmentDate: string;
  completedAt?: string;
  certificateEligible?: boolean;
  nextLesson?: {
    id: number;
    title: string;
  };
}

export default function StudentCourses() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('enrolled');
  const [completedCourses, setCompletedCourses] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch enrolled courses with authentication
  const { data: enrolledCourses = [], isLoading: enrolledLoading, error: enrolledError } = useQuery<Course[]>({
    queryKey: ['/api/student/enrolled-courses-fresh'],
    enabled: !!user,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });



  // Track course completion for celebrations
  useEffect(() => {
    if (enrolledCourses.length > 0) {
      enrolledCourses.forEach((course: Course) => {
        if (course.progress === 100 && !completedCourses.has(course.id)) {
          setCompletedCourses(prev => new Set(prev.add(course.id)));
          setShowCelebration(course.id);
          toast({
            title: "🎉 Congratulations!",
            description: `You've completed "${course.title}"! Amazing work!`,
            duration: 5000,
          });
          
          // Auto-hide celebration after 3 seconds
          setTimeout(() => setShowCelebration(null), 3000);
        }
      });
    }
  }, [enrolledCourses, completedCourses, toast]);

  // Fetch marketplace courses
  const { data: marketplaceCourses = [], isLoading: marketplaceLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: !!user,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter enrolled courses
  const filteredEnrolledCourses = enrolledCourses.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter marketplace courses (exclude already enrolled)
  const enrolledCourseIds = enrolledCourses.map((course: Course) => course.id);
  const filteredMarketplaceCourses = marketplaceCourses
    .filter((course: Course) => !enrolledCourseIds.includes(course.id) && course.isPublished)
    .filter((course: Course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

  // Get unique categories
  const allCourses = [...enrolledCourses, ...marketplaceCourses];
  const categories = Array.from(new Set(allCourses.map((course: Course) => course.category).filter(Boolean)));

  const handleEnrollCourse = async (courseId: number) => {
    try {
      // First check if this is a paid course
      const course = marketplaceCourses.find(c => c.id === courseId);
      if (!course) return;

      if (course.price > 0) {
        // For paid courses, redirect to course detail page to handle payment
        setLocation(`/courses/${courseId}`);
        return;
      }

      // For free courses, enroll directly
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Refresh both queries
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Enrollment failed:', errorData.message);
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">Please log in to view your courses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Learning</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress and discover new courses
          </p>
        </div>

        {/* Celebration Banner for Completed Courses */}
        {enrolledCourses.some((course: Course) => course.progress === 100) && (
          <div className="mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 animate-bounce" />
              <div>
                <h3 className="font-bold text-lg">Congratulations!</h3>
                <p className="text-white/90">You've completed {enrolledCourses.filter((course: Course) => course.progress === 100).length} course(s)! Keep up the amazing work!</p>
              </div>
              <Sparkles className="w-6 h-6 animate-spin ml-auto" />
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category!}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrolled" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              My Courses ({filteredEnrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Marketplace ({filteredMarketplaceCourses.length})
            </TabsTrigger>
          </TabsList>

          {/* Enrolled Courses Tab */}
          <TabsContent value="enrolled" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Enrolled Courses
              </h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {filteredEnrolledCourses.length} Active
              </Badge>
            </div>

            {enrolledLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={`enrolled-skeleton-${i}`} className="animate-pulse">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEnrolledCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No enrolled courses found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start your learning journey by browsing the marketplace'
                  }
                </p>
                <Button onClick={() => setActiveTab('marketplace')}>
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEnrolledCourses.map((course) => (
                  <Card key={course.id} className="border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=160&q=80`}
                        alt={course.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=160&q=80`;
                        }}
                      />
                      {course.progress === 100 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 backdrop-blur-sm">
                          <div className="text-center text-black">
                            <Trophy className="w-12 h-12 mx-auto mb-1 animate-bounce text-yellow-600" />
                            <div className="text-xs font-bold">COMPLETED!</div>
                            <Sparkles className="w-6 h-6 mx-auto animate-spin text-orange-500" />
                          </div>
                        </div>
                      )}

                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className={`text-xs backdrop-blur-sm ${
                          course.progress === 100 
                            ? 'bg-yellow-100/90 text-yellow-700 border-yellow-300 animate-pulse' 
                            : 'bg-green-100/90 text-green-700 border-green-300'
                        }`}>
                          {course.progress === 100 ? '🎉 Completed' : 'Enrolled'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className={`backdrop-blur-sm rounded p-2 ${
                          course.progress === 100 
                            ? 'bg-gradient-to-r from-yellow-100/90 to-orange-100/90' 
                            : 'bg-white/90'
                        }`}>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span className={course.progress === 100 ? 'font-bold text-yellow-700' : ''}>
                              {course.progress || 0}%
                            </span>
                          </div>
                          <Progress 
                            value={course.progress || 0} 
                            className={`h-1 ${course.progress === 100 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : ''}`} 
                          />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {course.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <span className="font-medium">{course.completedLessons || 0}/{course.totalLessons || 0} lessons</span>
                        </div>
                        {course.enrollmentDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Enrolled:</span>
                            <span className="font-medium">{new Date(course.enrollmentDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {course.progress === 100 && (
                        <div className="mb-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Course Completed!</span>
                            <Sparkles className="w-4 h-4 text-orange-500" />
                          </div>
                          <p className="text-xs text-yellow-700 mb-2">You've mastered all lessons in this course. Well done!</p>
                          {course.completedAt && (
                            <p className="text-xs text-yellow-600">
                              Completed on {new Date(course.completedAt).toLocaleDateString()}
                            </p>
                          )}
                          {course.progress === 100 && (
                            <div className="mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                onClick={() => {
                                  const enrollmentId = (course as any).enrollmentId;
                                  console.log('Certificate button clicked for course:', course.id, 'enrollmentId:', enrollmentId);
                                  if (enrollmentId) {
                                    setLocation(`/certificate/${enrollmentId}`);
                                  } else {
                                    console.error('No enrollmentId found for course:', course);
                                  }
                                }}
                              >
                                <Award className="w-3 h-3 mr-1" />
                                Get Certificate
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant={course.progress === 100 ? "secondary" : "default"}
                          size="sm" 
                          className={`flex-1 ${course.progress === 100 ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' : ''}`}
                          onClick={() => setLocation(`/courses/${course.id}`)}
                        >
                          {course.progress === 100 ? (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              Review
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              {(course.progress || 0) > 0 ? 'Continue' : 'Start'}
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/courses/${course.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Marketplace
              </h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredMarketplaceCourses.length} Available
              </Badge>
            </div>

            {marketplaceLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={`marketplace-skeleton-${i}`} className="animate-pulse">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMarketplaceCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No courses found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'New courses will appear here when published'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarketplaceCourses.map((course: Course) => (
                  <Card key={course.id} className="border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={course.thumbnail || `https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=160&q=80`}
                        alt={course.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=160&q=80`;
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs bg-blue-100/90 text-blue-700 border-blue-300 backdrop-blur-sm">
                          Available
                        </Badge>
                      </div>
                      {course.rating && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className="text-xs bg-yellow-100/90 text-yellow-700 border-yellow-300 backdrop-blur-sm">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {course.rating}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {course.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {formatCurrency(course.price || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="font-medium">{course.category || 'General'}</span>
                        </div>
                        {course.totalLessons && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{course.totalLessons} lessons</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEnrollCourse(course.id)}
                        >
                          {course.price > 0 ? `Enroll - ${formatCurrency(course.price)}` : 'Enroll Free'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/courses/${course.id}`)}
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
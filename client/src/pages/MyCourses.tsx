import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Eye, Edit, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string | null;
  isPublished: boolean;
  thumbnail: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  tags: string[] | null;
  mentorId?: string;
  isAssignedToMe?: boolean;
}

export default function MyCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch all courses with cache-busting
  const { data: allCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses', Date.now()], // Cache-busting timestamp
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Format currency in Naira
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter courses to separate owned vs marketplace
  const ownedCourses = (allCourses as any[]).filter((course: any) => {
    // Use isAssignedToMe flag from API (when authentication works)
    if (course.isAssignedToMe === true) return true;
    
    // Fallback: Check if mentor ID matches current user
    if (user && course.mentorId === user.id) return true;
    
    return false;
  });

  const marketplaceCourses = (allCourses as any[]).filter((course: any) => {
    // Show courses not owned by this mentor
    const isOwned = course.isAssignedToMe === true || 
                   (user && course.mentorId === user.id);
    return !isOwned;
  });

  // Apply search and category filters
  const filteredOwnedCourses = ownedCourses.filter((course: any) => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMarketplaceCourses = marketplaceCourses.filter((course: any) => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set((allCourses as any[]).map((course: any) => course.category).filter(Boolean)));

  if (coursesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your courses and browse the marketplace</p>
        </div>
        <Button 
          onClick={() => navigate('/create-course')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category || ""}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* My Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            My Courses ({filteredOwnedCourses.length})
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Courses you own or are assigned to manage
          </p>
        </CardHeader>
        <CardContent>
          {filteredOwnedCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No owned courses found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Create your first course or wait for admin assignment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOwnedCourses.map((course: any) => (
                <Card key={course.id} className="border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-green-800 dark:text-green-200">{course.title || 'Untitled Course'}</h3>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        Owned
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-medium">{formatCurrency(course.price || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Your Earnings:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency((course.price || 0) * 0.37)}
                        </span>
                      </div>
                      <Badge variant={course.isPublished ? "default" : "secondary"} className="w-full justify-center mb-3">
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/edit-course/${course.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Marketplace Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Marketplace ({filteredMarketplaceCourses.length})
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse all available courses in the platform
          </p>
        </CardHeader>
        <CardContent>
          {filteredMarketplaceCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No marketplace courses found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Other published courses will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarketplaceCourses.map((course: any) => (
                <Card key={course.id} className="border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">{course.title || 'Untitled Course'}</h3>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                        Marketplace
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-medium">{formatCurrency(course.price || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {course.category || 'General'}
                        </span>
                      </div>
                      <Badge variant={course.isPublished ? "default" : "secondary"} className="w-full justify-center mb-3">
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Removed Select components to fix empty string value error
import { BookOpen, Plus, Eye, Edit, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string | null;
  isPublished: boolean;
  thumbnail: string | null;
  mentorId?: string;
  isAssignedToMe?: boolean;
}

export default function MyCoursesFixed() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses once when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest("GET", "/api/courses");
        const courses = await response.json();
        setAllCourses(courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Format currency in Naira
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter courses to separate owned vs marketplace
  const ownedCourses = allCourses.filter((course: any) => {
    // Use isAssignedToMe flag from API (when authentication works)
    if (course.isAssignedToMe === true) return true;
    
    // Fallback: Check if mentor ID matches current user
    if (user && course.mentorId === user.id) return true;
    
    return false;
  });

  const marketplaceCourses = allCourses.filter((course: any) => {
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
  const categories = Array.from(new Set(allCourses.map((course: any) => course.category).filter(Boolean)));

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show loading only for initial load
  if (loading) {
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
          onClick={() => setLocation('/create-course')}
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
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md w-48"
        >
          <option value="">All Categories</option>
          {categories.map((category, index) => (
            <option key={index} value={category || ""}>
              {category || 'Uncategorized'}
            </option>
          ))}
        </select>
      </div>

      {/* Debug Information */}
      <div className="bg-blue-50 p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <p className="text-sm">Total Courses: {allCourses.length}</p>
        <p className="text-sm">Owned Courses: {ownedCourses.length}</p>
        <p className="text-sm">Marketplace Courses: {marketplaceCourses.length}</p>
        <p className="text-sm">User ID: {user?.id}</p>
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
                <Card key={course.id} className="border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 overflow-hidden">
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
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-xs bg-green-100/90 text-green-700 border-green-300 backdrop-blur-sm">
                        Owned
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">{course.title || 'Untitled Course'}</h3>
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
                      <Badge 
                        variant={course.isPublished ? "default" : "secondary"} 
                        className="w-full justify-center mb-3"
                        title={course.isPublished ? "Course is live and visible to students" : "Course is hidden from students and still being developed"}
                      >
                        {course.isPublished ? "✓ Published" : "📝 Draft"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setLocation(`/courses/${course.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setLocation(`/courses/${course.id}/edit`)}
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
                <Card key={course.id} className="border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 overflow-hidden">
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
                        Marketplace
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{course.title || 'Untitled Course'}</h3>
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
                      <Badge 
                        variant={course.isPublished ? "default" : "secondary"} 
                        className="w-full justify-center mb-3"
                        title={course.isPublished ? "Course is live and visible to students" : "Course is hidden from students and still being developed"}
                      >
                        {course.isPublished ? "✓ Published" : "📝 Draft"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setLocation(`/courses/${course.id}`)}
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
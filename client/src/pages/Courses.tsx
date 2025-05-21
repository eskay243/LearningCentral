import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveCard } from "@/components/ui/ResponsiveCard";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/currencyUtils";

const Courses = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch courses for the current user
  const { data: userCourses, isLoading: userCoursesLoading } = useQuery<Course[]>({
    queryKey: [isMentor ? "/api/courses" : "/api/user/enrollments"],
    enabled: !!user
  });

  // Fetch all published courses (for discovery)
  const { data: publishedCourses, isLoading: publishedCoursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses?published=true"],
  });
  
  const isLoading = userCoursesLoading || publishedCoursesLoading;

  const filterCourses = (courses: Course[] | undefined) => {
    if (!courses || courses.length === 0) return [];
    
    return courses
      .filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(course => 
        categoryFilter === "all" || course.category === categoryFilter
      )
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === "title-asc") {
          return a.title.localeCompare(b.title);
        } else if (sortBy === "title-desc") {
          return b.title.localeCompare(a.title);
        } else if (sortBy === "price-asc") {
          return a.price - b.price;
        } else if (sortBy === "price-desc") {
          return b.price - a.price;
        }
        return 0;
      });
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "sql", label: "SQL" },
    { value: "web", label: "Web Development" },
    { value: "data", label: "Data Science" },
    { value: "mobile", label: "Mobile Development" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title-asc", label: "Title (A-Z)" },
    { value: "title-desc", label: "Title (Z-A)" },
    { value: "price-asc", label: "Price (Low to High)" },
    { value: "price-desc", label: "Price (High to Low)" },
  ];


  
  const coursesToShow = isMentor || isAdmin ? userCourses : publishedCourses;
  const filteredCourses = filterCourses(coursesToShow);
  
  return (
    <div className="p-3 sm:p-4 md:p-6 dark:bg-gray-900">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark-800 dark:text-white">
          {isMentor ? "My Teaching Courses" : "Courses"}
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
          {isMentor 
            ? "Manage your courses and track student progress"
            : "Explore and manage your enrolled courses"
          }
        </p>
      </div>
      
      {/* Filters & Controls */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="w-full">
          <Input
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm h-9 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              {categories.map(category => (
                <SelectItem 
                  key={category.value} 
                  value={category.value}
                  className="text-xs sm:text-sm dark:text-gray-200 dark:focus:bg-gray-700"
                >
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              {sortOptions.map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-xs sm:text-sm dark:text-gray-200 dark:focus:bg-gray-700"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(isMentor || isAdmin) && (
            <Button 
              asChild
              className="text-xs sm:text-sm h-9 w-full sm:w-auto mt-2 sm:mt-0"
            >
              <Link href="/create-course">
                <i className="ri-add-line mr-2"></i>
                Create Course
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-500"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <ResponsiveCard className="p-4 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">No courses found</h3>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your filters or search term" 
              : isMentor 
                ? "Start creating your first course"
                : "Explore the catalog to enroll in courses"
            }
          </p>
          {isMentor && (
            <Button 
              className="mt-4 sm:mt-6 text-sm" 
              asChild
            >
              <Link href="/create-course">Create Your First Course</Link>
            </Button>
          )}
        </ResponsiveCard>
      ) : (
        <CourseGrid 
          courses={filteredCourses.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description || '',
            thumbnailUrl: course.thumbnail,
            instructorName: course.instructorName || 'Instructor',
            instructorAvatar: course.instructorAvatar,
            rating: course.rating || 4.5,
            totalStudents: course.enrollmentCount || 0,
            duration: course.duration || null,
            price: course.price || 0,
            currency: 'NGN',
            progress: course.progress,
            enrollmentStatus: course.progress !== undefined 
              ? (course.progress === 100 ? 'completed' : 'enrolled')
              : 'not-enrolled',
            category: course.category,
            level: course.level || 'Beginner',
          }))}
        />
      )}
    </div>
  );
};

export default Courses;

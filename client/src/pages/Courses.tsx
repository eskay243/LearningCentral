import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/useAuth";
import { Course } from "@/types";
import { formatCurrency, truncateText } from "@/lib/utils";

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
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your filters or search term" 
              : isMentor 
                ? "Start creating your first course"
                : "Explore the catalog to enroll in courses"
            }
          </p>
          {isMentor && (
            <Button className="mt-6" asChild>
              <Link href="/create-course">Create Your First Course</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 overflow-hidden bg-gray-100">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <i className="ri-image-line text-4xl"></i>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={course.isPublished ? "default" : "secondary"} className={course.isPublished ? "bg-green-100 text-green-800" : ""}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  {course.price > 0 ? (
                    <span className="font-medium text-green-700">{formatCurrency(course.price)}</span>
                  ) : (
                    <span className="text-sm text-gray-500">Free</span>
                  )}
                </div>
                
                <Link href={`/courses/${course.id}`}>
                  <h3 className="text-lg font-medium text-dark-800 mb-1 hover:text-primary-600 cursor-pointer">
                    {course.title}
                  </h3>
                </Link>
                
                <p className="text-sm text-gray-500 mb-4">
                  {truncateText(course.description, 100)}
                </p>
                
                {isMentor ? (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500">
                      {course.enrollmentCount || 0} students
                    </span>
                    <Button asChild>
                      <Link href={`/courses/${course.id}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mt-4">
                    {course.progress !== undefined ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500">
                            Progress: {course.progress}%
                          </span>
                          <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-1.5 bg-primary-500 rounded-full" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/courses/${course.id}`}>
                            Continue
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={`/courses/${course.id}`}>
                          {course.price > 0 ? "Enroll Now" : "Start Learning"}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;

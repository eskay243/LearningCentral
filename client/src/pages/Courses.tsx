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
  const { data: userCourses, isLoading } = useQuery({
    queryKey: [isMentor ? `/api/courses?mentor=${user?.id}` : `/api/user/enrollments`],
    enabled: !!user
  });

  // Fetch all published courses (for discovery)
  const { data: publishedCourses, isLoading: isPublishedLoading } = useQuery({
    queryKey: ["/api/courses?published=true"],
  });

  const filterCourses = (courses: any[]) => {
    if (!courses) return [];
    
    return courses
      .filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getCourseStatusClass = (status: string) => {
    const classes = {
      "draft": "bg-gray-100 text-gray-800",
      "published": "bg-green-100 text-green-800",
      "archived": "bg-red-100 text-red-800",
    };
    return classes[status as keyof typeof classes] || classes.draft;
  };
  
  const filteredCourses = filterCourses(isMentor || isAdmin ? userCourses : publishedCourses);
  
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">
          {isMentor ? "My Teaching Courses" : "Courses"}
        </h1>
        <p className="mt-1 text-gray-500">
          {isMentor 
            ? "Manage your courses and track student progress"
            : "Explore and manage your enrolled courses"
          }
        </p>
      </div>
      
      {/* Filters & Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-grow">
          <Input
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(isMentor || isAdmin) && (
            <Button asChild>
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
                  <Badge variant={course.isPublished ? "success" : "secondary"}>
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

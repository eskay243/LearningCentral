import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCardItem } from "@/types";
import { Link } from "wouter";

interface CourseCardProps {
  course: CourseCardItem;
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow hover:shadow-md transition-shadow">
      {/* Course Image */}
      <div className="h-32 sm:h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={`${course.title} thumbnail`} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <div className="p-3 sm:p-4">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-2">
          <Badge variant={course.status === "Active" ? "success" : "secondary"} className="text-xs">
            {course.status}
          </Badge>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{course.students} Students</span>
        </div>
        
        {/* Course Title */}
        <h3 className="text-base sm:text-lg font-medium text-dark-800 dark:text-gray-100 mb-1 line-clamp-1">{course.title}</h3>
        
        {/* Course Description */}
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">{course.description}</p>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Course Progress</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{course.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
          <div 
            className="h-1.5 bg-primary dark:bg-primary/80 rounded-full" 
            style={{ width: `${course.progress}%` }}
          ></div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-3 sm:mt-4 gap-2">
          <Button variant="outline" size="sm" className="text-xs px-2.5 py-1 h-8 sm:h-9">
            <i className="ri-edit-line mr-1"></i>
            Edit
          </Button>
          <Link href={`/courses/${course.id}`}>
            <Button size="sm" className="text-xs px-2.5 py-1 h-8 sm:h-9">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

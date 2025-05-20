import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCardItem } from "@/types";
import { Link } from "wouter";

interface CourseCardProps {
  course: CourseCardItem;
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow hover:shadow-md transition-shadow">
      {/* Course Image */}
      <div className="h-40 bg-gray-200 overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={`${course.title} thumbnail`} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <div className="p-4">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-2">
          <Badge variant={course.status === "Active" ? "success" : "secondary"}>
            {course.status}
          </Badge>
          <span className="text-sm text-gray-500">{course.students} Students</span>
        </div>
        
        {/* Course Title */}
        <h3 className="text-lg font-medium text-dark-800 mb-1">{course.title}</h3>
        
        {/* Course Description */}
        <p className="text-sm text-gray-500 mb-4">{course.description}</p>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Course Progress</span>
          <span className="text-xs font-medium text-gray-500">{course.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-3">
          <div 
            className="h-1.5 bg-primary-500 rounded-full" 
            style={{ width: `${course.progress}%` }}
          ></div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" size="sm">
            <i className="ri-edit-line mr-1"></i>
            Edit
          </Button>
          <Link href={`/courses/${course.id}`}>
            <Button size="sm">
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

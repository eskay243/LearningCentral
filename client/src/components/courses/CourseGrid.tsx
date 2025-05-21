import React from 'react';
import { CourseCard } from './CourseCard';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  instructorName: string;
  instructorAvatar?: string | null;
  rating: number;
  totalStudents: number;
  duration?: string | null;
  price: number;
  currency?: string;
  progress?: number;
  enrollmentStatus?: 'enrolled' | 'completed' | 'not-enrolled';
  category?: string;
  level?: string;
}

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
}

export const CourseGrid = ({ courses, loading = false }: CourseGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96"></div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No courses found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          {...course}
        />
      ))}
    </div>
  );
};
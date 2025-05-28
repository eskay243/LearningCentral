import React from 'react';
import { Link } from 'wouter';
import { ResponsiveCard } from '@/components/ui/ResponsiveCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, Users, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { formatCurrency } from '@/lib/currencyUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CourseCardProps {
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
  showAdminActions?: boolean;
  onDeleteCourse?: (courseId: number) => void;
}

export const CourseCard = ({
  id,
  title,
  description,
  thumbnailUrl,
  instructorName,
  instructorAvatar,
  rating,
  totalStudents,
  duration,
  price,
  currency = 'NGN',
  progress = 0,
  enrollmentStatus,
  category,
  level,
  showAdminActions = false,
  onDeleteCourse,
}: CourseCardProps) => {
  
  // Determine badge color based on level
  const getLevelBadgeVariant = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <ResponsiveCard
      className="h-full flex flex-col relative group"
      hoverable
    >
      {/* Admin Actions - Beautiful floating menu */}
      {showAdminActions && (
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteCourse?.(id);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Link href={`/courses/${id}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
          <img 
            src={thumbnailUrl || '/placeholder-course.jpg'} 
            alt={title}
            className="object-cover w-full h-full transform transition-transform duration-300 hover:scale-105"
          />
          
          {enrollmentStatus && enrollmentStatus !== 'not-enrolled' && (
            <div className="absolute top-3 left-3">
              <Badge variant={enrollmentStatus === 'completed' ? 'success' : 'secondary'}>
                {enrollmentStatus === 'completed' ? 'Completed' : 'Enrolled'}
              </Badge>
            </div>
          )}
          
          {level && !showAdminActions && (
            <div className="absolute top-3 right-3">
              <Badge variant={getLevelBadgeVariant(level)}>
                {level}
              </Badge>
            </div>
          )}
          
          {level && showAdminActions && (
            <div className="absolute bottom-3 right-3">
              <Badge variant={getLevelBadgeVariant(level)}>
                {level}
              </Badge>
            </div>
          )}
        </div>
      </Link>
      
      <div className="flex flex-col flex-grow p-4">
        <div className="mb-2 flex items-center gap-2">
          {category && (
            <Badge variant="outline" className="text-xs font-normal">
              {category}
            </Badge>
          )}
          <div className="flex items-center ml-auto">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <Link href={`/courses/${id}`} className="block group">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {description}
        </p>
        
        <div className="flex items-center mb-3">
          <Avatar className="h-7 w-7 mr-2">
            <AvatarImage src={instructorAvatar || undefined} alt={instructorName} />
            <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
              {getInitials(instructorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{instructorName}</span>
        </div>
        
        {enrollmentStatus === 'enrolled' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalStudents} students</span>
          </div>
          
          {duration && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{duration}</span>
            </div>
          )}
          
          <div className="text-primary-700 dark:text-primary-400 font-semibold">
            {price === 0 ? 'Free' : formatCurrency(price, currency)}
          </div>
        </div>
      </div>
    </ResponsiveCard>
  );
};
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingClasses from "@/components/dashboard/UpcomingClasses";
import StudentProgress from "@/components/dashboard/StudentProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";
import CourseCard from "@/components/dashboard/CourseCard";
import ExerciseProgressTracker from "@/components/dashboard/ExerciseProgressTracker";
import MentorExerciseStatsCard from "@/components/dashboard/MentorExerciseStatsCard";
import { StatsCardItem, UpcomingClass, StudentProgressItem, RecentActivityItem, CourseCardItem } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getFullName } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";

const Dashboard = () => {
  const { user, isLoading: isAuthLoading, isMentor, isAdmin } = useAuth();
  const [statsCards, setStatsCards] = useState<StatsCardItem[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [students, setStudents] = useState<StudentProgressItem[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [courses, setCourses] = useState<CourseCardItem[]>([]);

  // Fetch upcoming live sessions
  const { data: liveSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["/api/live-sessions"],
    enabled: !isAuthLoading && !!user
  });

  // Fetch stats based on user role
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: [isMentor ? `/api/analytics/mentor/${user?.id}` : isAdmin ? "/api/analytics/admin" : `/api/analytics/student/${user?.id}`],
    enabled: !isAuthLoading && !!user
  });

  // Format stats cards based on user role
  useEffect(() => {
    if (!isStatsLoading && stats) {
      if (isMentor || isAdmin) {
        setStatsCards([
          {
            id: "students",
            title: "Total Students",
            value: stats.totalStudents || 0,
            change: "18% from last month",
            changeType: "increase",
            icon: "ri-user-follow-line",
            iconBgClass: "bg-blue-100 text-blue-600"
          },
          {
            id: "courses",
            title: "Active Courses",
            value: stats.totalCourses || 0,
            icon: "ri-book-mark-line",
            iconBgClass: "bg-purple-100 text-purple-600"
          },
          {
            id: "earnings",
            title: "Total Earnings",
            value: `$${stats.totalEarnings || 0}`,
            change: "12% from last month",
            changeType: "increase",
            icon: "ri-funds-line",
            iconBgClass: "bg-green-100 text-green-600"
          },
          {
            id: "hours",
            title: "Hours Taught",
            value: `${stats.hoursThisWeek || 0}h`,
            icon: "ri-time-line",
            iconBgClass: "bg-red-100 text-red-600"
          }
        ]);
      } else {
        // Student stats
        setStatsCards([
          {
            id: "courses",
            title: "Enrolled Courses",
            value: stats.totalEnrollments || 0,
            icon: "ri-book-mark-line",
            iconBgClass: "bg-purple-100 text-purple-600"
          },
          {
            id: "completed",
            title: "Completed Courses",
            value: stats.completedCourses || 0,
            icon: "ri-medal-line",
            iconBgClass: "bg-green-100 text-green-600"
          },
          {
            id: "progress",
            title: "Average Progress",
            value: `${Math.round(stats.averageProgress || 0)}%`,
            icon: "ri-bar-chart-line",
            iconBgClass: "bg-blue-100 text-blue-600"
          },
          {
            id: "hours",
            title: "Hours Studied",
            value: `${stats.hoursThisWeek || 0}h`,
            change: "This week",
            changeType: "neutral",
            icon: "ri-time-line",
            iconBgClass: "bg-red-100 text-red-600"
          }
        ]);
      }
    }
  }, [stats, isStatsLoading, isMentor, isAdmin]);

  // Format upcoming classes from live sessions
  useEffect(() => {
    if (liveSessions) {
      const formattedSessions = liveSessions.map((session: any) => ({
        id: session.id,
        title: session.lesson?.title || "Untitled Lesson",
        module: `Module: ${session.module?.title || "Untitled Module"}`,
        startTime: session.startTime,
        duration: session.lesson?.duration ? Math.floor(session.lesson.duration / 60) : 60,
        enrolledCount: session.enrolledCount || 0,
        iconClass: getIconForCourse(session.course?.category),
        iconBgClass: getColorForCourse(session.course?.category)
      }));
      setUpcomingClasses(formattedSessions);
    }
  }, [liveSessions]);

  // Fetch and format student progress (for mentors/admins)
  useEffect(() => {
    if (isMentor || isAdmin) {
      // Mock student progress data for now
      setStudents([
        {
          id: "1",
          name: "Emma Johnson",
          course: "JavaScript Course",
          progress: 92,
          lastActive: "2 hours ago",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        },
        {
          id: "2",
          name: "Alex Chen",
          course: "SQL Course",
          progress: 87,
          lastActive: "1 day ago",
          avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        },
        {
          id: "3",
          name: "Sophia Martinez",
          course: "Python Course",
          progress: 78,
          lastActive: "3 days ago",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        },
        {
          id: "4",
          name: "David Kim",
          course: "JavaScript Course",
          progress: 65,
          lastActive: "1 week ago",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
      ]);
    }
  }, [isMentor, isAdmin]);

  // Fetch recent activities
  useEffect(() => {
    // Set recent activities (would be fetched from API in a real implementation)
    setActivities([
      {
        id: 1,
        type: "assignment",
        title: "Assignment Submitted",
        description: "Emma Johnson submitted \"JavaScript Arrays Exercise\"",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-file-text-line",
        iconBgClass: "bg-green-100 text-green-600"
      },
      {
        id: 2,
        type: "message",
        title: "New Message",
        description: "Alex Chen asked a question about SQL joins",
        time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-message-2-line",
        iconBgClass: "bg-blue-100 text-blue-600"
      },
      {
        id: 3,
        type: "enrollment",
        title: "New Enrollment",
        description: "5 new students enrolled in \"Python for Beginners\"",
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-user-add-line",
        iconBgClass: "bg-purple-100 text-purple-600"
      },
      {
        id: 4,
        type: "review",
        title: "New Review",
        description: "Sophia Martinez gave \"JavaScript Course\" a 5-star review",
        time: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-star-line",
        iconBgClass: "bg-yellow-100 text-yellow-600"
      },
      {
        id: 5,
        type: "session",
        title: "Completed Live Session",
        description: "SQL for Data Science: Module 1 session completed",
        time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-calendar-check-line",
        iconBgClass: "bg-red-100 text-red-600"
      }
    ]);
  }, []);

  // Fetch courses
  useEffect(() => {
    if (!isAuthLoading && user) {
      // These would be fetched from the API in a real implementation
      setCourses([
        {
          id: 1,
          title: "Advanced JavaScript Concepts",
          description: "Master modern JavaScript features, asynchronous programming, and advanced patterns.",
          thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=320",
          progress: 75,
          status: "Active",
          students: 34
        },
        {
          id: 2,
          title: "Python for Beginners",
          description: "Learn Python programming from scratch with hands-on projects and exercises.",
          thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=320",
          progress: 60,
          status: "Active",
          students: 42
        },
        {
          id: 3,
          title: "SQL for Data Science",
          description: "Learn how to write efficient SQL queries for data analysis and reporting.",
          thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=320",
          progress: 40,
          status: "Active",
          students: 26
        }
      ]);
    }
  }, [user, isAuthLoading]);

  // Helper functions for icon/color selection
  function getIconForCourse(category?: string) {
    const icons: Record<string, string> = {
      javascript: "ri-code-s-slash-line",
      python: "ri-terminal-box-line",
      sql: "ri-database-2-line",
      data: "ri-bar-chart-box-line",
      web: "ri-html5-line",
      mobile: "ri-smartphone-line",
      default: "ri-book-open-line"
    };
    return icons[category?.toLowerCase() || "default"] || icons.default;
  }

  function getColorForCourse(category?: string) {
    const colors: Record<string, string> = {
      javascript: "bg-blue-100 text-blue-500",
      python: "bg-purple-100 text-purple-500",
      sql: "bg-green-100 text-green-500",
      data: "bg-yellow-100 text-yellow-500",
      web: "bg-pink-100 text-pink-500",
      mobile: "bg-indigo-100 text-indigo-500",
      default: "bg-gray-100 text-gray-500"
    };
    return colors[category?.toLowerCase() || "default"] || colors.default;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Welcome Section */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-800 dark:text-gray-100">
            Welcome, {getFullName(user) || "Student"}!
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">{formatDate(new Date(), false)}</p>
        </div>
        
        <div className="mt-3 sm:mt-0 flex gap-2">
          {(isMentor || isAdmin) && (
            <Button size="sm" className="w-full sm:w-auto">
              <i className="ri-add-line mr-1 sm:mr-2"></i>
              Create Class
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {statsCards.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>
      
      {/* Upcoming Live Classes */}
      <div className="mb-5 sm:mb-8">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-dark-800 dark:text-gray-100">Upcoming Live Classes</h2>
          <a href="/schedule" className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400">View All</a>
        </div>
        
        <UpcomingClasses 
          classes={upcomingClasses} 
          isLoading={isSessionsLoading}
        />
      </div>
      
      {/* Two Column Layout for Activities and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-8">
        {/* Student Progress for mentors/admins */}
        {(isMentor || isAdmin) && (
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
              <h2 className="text-base sm:text-lg font-semibold text-dark-800 dark:text-gray-100">Student Progress</h2>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="js">Advanced JavaScript</SelectItem>
                  <SelectItem value="python">Python for Beginners</SelectItem>
                  <SelectItem value="sql">SQL for Data Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <StudentProgress 
              students={students}
              isLoading={false}
            />
          </div>
        )}
        
        {/* Student Exercise Progress */}
        {!isMentor && !isAdmin && (
          <div className="lg:col-span-2">
            <ExerciseProgressTracker />
          </div>
        )}
        
        {/* Recent Activity */}
        <div className={`${(isMentor || isAdmin) ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-dark-800 dark:text-gray-100">Recent Activity</h2>
          </div>
          
          <RecentActivity 
            activities={activities}
            isLoading={false}
          />
        </div>
      </div>
      
      {/* Exercise Analytics for Mentors */}
      {(isMentor || isAdmin) && (
        <div className="mb-5 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg font-semibold text-dark-800 dark:text-gray-100">Exercise Analytics</h2>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <MentorExerciseStatsCard />
        </div>
      )}
      
      {/* My Courses Section */}
      <div className="mt-5 sm:mt-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <h2 className="text-base sm:text-lg font-semibold text-dark-800 dark:text-gray-100">My Courses</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2 w-full sm:w-auto">
            <Select defaultValue="active">
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {(isMentor || isAdmin) && (
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <i className="ri-add-line mr-1 sm:mr-2"></i>
                New Course
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

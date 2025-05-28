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
import { ContextualHelp, WithContextualHelp } from "@/components/ui/ContextualHelp";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";

const Dashboard = () => {
  const { user, isLoading: isAuthLoading, isMentor, isAdmin } = useAuth();
  const [statsCards, setStatsCards] = useState<StatsCardItem[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [students, setStudents] = useState<StudentProgressItem[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [courses, setCourses] = useState<CourseCardItem[]>([]);

  // Define LiveSession type
  interface LiveSession {
    id: number;
    startTime: string;
    lesson?: {
      title: string;
      duration: number;
    };
    module?: {
      title: string;
    };
    course?: {
      category: string;
    };
    enrolledCount?: number;
  }

  // Fetch upcoming live sessions
  const { data: liveSessions, isLoading: isSessionsLoading } = useQuery<LiveSession[]>({
    queryKey: ["/api/live-sessions"],
    enabled: !isAuthLoading && !!user
  });

  // Define a type for the analytics stats
  interface DashboardStats {
    totalStudents?: number;
    totalCourses?: number;
    totalEarnings?: number;
    hoursThisWeek?: number;
    totalEnrollments?: number;
    completedCourses?: number;
    averageProgress?: number;
    recentActivity?: RecentActivityItem[];
  }

  // Fetch stats based on user role
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
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
            change: 18,
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
            change: 12,
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
            change: 0,
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
    if (liveSessions && Array.isArray(liveSessions)) {
      const formattedSessions = liveSessions.map((session) => ({
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
        action: "submitted",
        target: "JavaScript Arrays Exercise",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        title: "Assignment Submitted",
        description: "Emma Johnson submitted \"JavaScript Arrays Exercise\"",
        user: {
          id: "user1",
          name: "Emma Johnson",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
      },
      {
        id: 2,
        type: "message",
        action: "asked",
        target: "SQL joins",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        title: "New Message",
        description: "Alex Chen asked a question about SQL joins",
        time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-message-2-line",
        iconBgClass: "bg-blue-100 text-blue-600",
        user: {
          id: "user2",
          name: "Alex Chen",
          avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
      },
      {
        id: 3,
        type: "enrollment",
        action: "enrolled",
        target: "Python for Beginners",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        title: "New Enrollment",
        description: "5 new students enrolled in \"Python for Beginners\"",
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-user-add-line",
        iconBgClass: "bg-purple-100 text-purple-600",
        user: {
          id: "admin1",
          name: "System",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
      },
      {
        id: 4,
        type: "review",
        action: "reviewed",
        target: "JavaScript Course",
        timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        title: "New Review",
        description: "Sophia Martinez gave \"JavaScript Course\" a 5-star review",
        time: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-star-line",
        iconBgClass: "bg-yellow-100 text-yellow-600",
        user: {
          id: "user3",
          name: "Sophia Martinez",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
      },
      {
        id: 5,
        type: "session",
        action: "completed",
        target: "SQL for Data Science: Module 1",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        title: "Completed Live Session",
        description: "SQL for Data Science: Module 1 session completed",
        time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        iconClass: "ri-calendar-check-line",
        iconBgClass: "bg-red-100 text-red-600",
        user: {
          id: "user4",
          name: "John Doe",
          avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
        }
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
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Hey, {getFullName(user)?.split(' ')[0] || "Dibbendo"}!
            </h1>
            <div className="hidden sm:flex text-xl text-yellow-500">👋</div>
          </div>
          <p className="mt-1.5 text-primary font-medium">You've got 82 Points!</p>
          
          {/* Welcome help bubble with Sammy */}
          <ContextualHelp
            id="dashboard-welcome"
            title="Welcome to Codelab Educare!"
            content="This is your personal dashboard where you can track your progress, see upcoming classes, and access your courses."
            characterId="sammy"
            position="bottom"
            size="md"
            triggerOnFirstVisit={true}
          />
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-3">
          <div className="text-right">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {formatDate(new Date(), false)}
            </h3>
            <p className="text-xs text-gray-500">Today</p>
          </div>
          
          {(isMentor || isAdmin) && (
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 text-white px-5">
              <i className="ri-add-line mr-2"></i>
              Create Class
            </Button>
          )}
        </div>
      </div>
      
      {/* Time Spendings */}
      <div className="mb-8 bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <WithContextualHelp
            id="dashboard-time-spending"
            title="Track Your Learning Time"
            content="This chart shows your study time across different time periods. You're making good progress! Regular study sessions lead to better learning outcomes."
            characterId="ada"
            position="right"
            size="md"
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Time Spendings</h2>
          </WithContextualHelp>
          
          <Select defaultValue="month">
            <SelectTrigger className="w-32 bg-gray-50 dark:bg-gray-800 border-0 text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-64 w-full">
          {/* This would be implemented with a chart library like Recharts */}
          <div className="h-full w-full flex items-end justify-between gap-2 px-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const height = Math.random() * 70 + 30;
              return (
                <div key={i} className="relative group">
                  <div 
                    className="w-8 sm:w-12 bg-primary/20 rounded-t-lg transition-all duration-200 group-hover:bg-primary/30"
                    style={{ height: `${height}%` }}
                  >
                    {i === 8 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        9.7h
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Stats Cards and Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
          <WithContextualHelp
            id="dashboard-stats"
            title="Learning Statistics"
            content="Your learning statistics give you a quick overview of your progress. The more you practice, the better you'll get!"
            characterId="cody"
            position="left"
            size="md"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Statistics</h3>
          </WithContextualHelp>
          
          <div className="relative h-44 w-44 mx-auto mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-800 dark:text-white">09</span>
                <span className="text-sm text-gray-500">Courses</span>
              </div>
            </div>
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke="#e6e6e6" 
                strokeWidth="12"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke="#9333ea" 
                strokeWidth="12"
                strokeDasharray="339.3"
                strokeDashoffset="100"
                transform="rotate(-90 60 60)"
              />
            </svg>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center w-3 h-3 rounded-full bg-primary mb-1 mx-auto"></div>
              <p className="text-sm font-semibold">60%</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-3 h-3 rounded-full bg-blue-400 mb-1 mx-auto"></div>
              <p className="text-sm font-semibold">10%</p>
              <p className="text-xs text-gray-500">Progress</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-3 h-3 rounded-full bg-gray-300 mb-1 mx-auto"></div>
              <p className="text-sm font-semibold">30%</p>
              <p className="text-xs text-gray-500">To start</p>
            </div>
          </div>
        </div>
        
        {/* Awards Card */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Awards</h3>
          
          <div className="flex justify-center mb-3">
            <div className="bg-amber-100 p-5 rounded-xl relative">
              <div className="absolute top-2 right-2 text-xs text-white bg-amber-500 px-1.5 py-0.5 rounded">
                71.90
              </div>
              <div className="w-20 h-24 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 15l-2-2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3l-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-3">
            <h4 className="text-sm font-medium mb-1">Level</h4>
            <p className="text-lg font-semibold">Congratulations! You're at 71</p>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
            <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '72%' }}></div>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">71.90</span>
          </div>
        </div>
        
        {/* Growth Card */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Growth</h3>
          
          <div className="h-40 w-full">
            <svg viewBox="0 0 300 120" className="w-full h-full">
              <path d="M0,100 C20,80 40,120 60,90 C80,60 100,90 120,70 C140,50 160,90 180,60 C200,30 220,70 240,50 C260,30 280,60 300,40" fill="none" stroke="#ffd485" strokeWidth="2" />
              <path d="M0,100 C20,80 40,120 60,90 C80,60 100,90 120,70 C140,50 160,90 180,60" fill="none" stroke="#9333ea" strokeWidth="3" />
              
              <circle cx="180" cy="60" r="6" fill="#ffd485" />
              <circle cx="180" cy="60" r="3" fill="#9333ea" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Upcoming Live Classes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Live Classes</h2>
          <a href="/schedule" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View All
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isSessionsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
              </div>
            ))
          ) : upcomingClasses.length > 0 ? (
            upcomingClasses.slice(0, 3).map((session) => (
              <div key={session.id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${session.iconBgClass}`}>
                      <i className={`${session.iconClass} text-lg`}></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-0.5">{session.title}</h3>
                      <p className="text-xs text-gray-500">{session.module}</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">
                    {formatDate(new Date(session.startTime), true).split(' ')[0]}
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-xl border-gray-200 dark:border-gray-700 mb-4">
                  Join Session
                </Button>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <i className="ri-time-line"></i>
                    <span>{session.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <i className="ri-user-line"></i>
                    <span>{session.enrolledCount} enrolled</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 text-center">
              <div className="mb-3 mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <i className="ri-calendar-line text-gray-500 text-xl"></i>
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">No Upcoming Classes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Check back later for new live sessions</p>
              <Button variant="outline" size="sm" className="rounded-xl">
                View Schedule
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Student Progress for mentors/admins */}
      {(isMentor || isAdmin) && (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-2 sm:gap-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Student Progress</h2>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 dark:bg-gray-800 border-0 text-sm">
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
          
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">{student.name}</h3>
                      <p className="text-xs text-gray-500">{student.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">{student.progress}%</div>
                    <p className="text-xs text-gray-500">Last active {student.lastActive}</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      student.progress > 80 ? 'bg-primary' :
                      student.progress > 60 ? 'bg-blue-500' :
                      student.progress > 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${student.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="flex justify-center mt-2">
              <Button variant="ghost" size="sm" className="text-primary rounded-xl">
                View All Students
              </Button>
            </div>
          </div>
        </div>
      )}
        
      {/* Student Exercise Progress */}
      {!isMentor && !isAdmin && (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">My Progress</h2>
          <ExerciseProgressTracker />
        </div>
      )}
        
      {/* Recent Activity */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Recent Activity</h2>
        
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
              <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                activity.type === 'message' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'enrollment' ? 'bg-primary/20 text-primary' :
                activity.type === 'assignment' ? 'bg-green-100 text-green-600' :
                activity.type === 'review' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <i className={`
                  ${activity.type === 'message' ? 'ri-message-2-line' :
                    activity.type === 'enrollment' ? 'ri-user-add-line' :
                    activity.type === 'assignment' ? 'ri-file-text-line' :
                    activity.type === 'review' ? 'ri-star-line' :
                    activity.type === 'session' ? 'ri-calendar-check-line' : 'ri-notification-line'
                  } text-lg
                `}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium text-gray-800 dark:text-white truncate">{activity.title}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDate(new Date(activity.timestamp), true)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mt-2">
            <Button variant="ghost" size="sm" className="text-primary rounded-xl">
              View All Activity
            </Button>
          </div>
        </div>
      </div>
      
      {/* Exercise Analytics for Mentors */}
      {(isMentor || isAdmin) && (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-2 sm:gap-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Exercise Analytics</h2>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 dark:bg-gray-800 border-0 text-sm">
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
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Courses</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2 w-full sm:w-auto">
            <Select defaultValue="active">
              <SelectTrigger className="w-full sm:w-[150px] bg-gray-50 dark:bg-gray-800 border-0 text-sm">
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
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl">
                <i className="ri-add-line mr-2"></i>
                New Course
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div key={course.id} className="group bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{course.title}</h3>
                  <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">
                    {course.status}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mr-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium">{course.progress}%</span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <i className="ri-user-line"></i>
                    <span>{course.students} students</span>
                  </div>
                  <Button size="sm" variant="ghost" className="rounded-xl text-primary">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

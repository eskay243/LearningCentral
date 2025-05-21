import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Users, 
  PlusCircle, 
  FileText, 
  LineChart, 
  MessageSquare, 
  DollarSign, 
  Settings,
  User,
  UsersRound,
  Award,
  Code2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const { user, isAdmin, isMentor } = useAuth();
  
  const sidebarClass = cn(
    "sidebar fixed left-0 top-16 bottom-0 w-72 sm:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 overflow-y-auto transition-transform duration-300 ease-in-out shadow-md dark:shadow-gray-900/30",
    {
      "transform -translate-x-full": !isOpen,
      "transform translate-x-0": isOpen
    },
    "lg:translate-x-0"
  );
  
  const backdropClass = cn(
    "fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300 backdrop-blur-sm",
    {
      "opacity-100": isOpen,
      "opacity-0 pointer-events-none": !isOpen
    }
  );
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const menuItemClass = (path: string) => cn(
    "menu-item flex items-center px-4 py-3 sm:py-2.5 text-sm rounded-lg my-1 mx-2 transition-colors",
    {
      "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium": isActive(path),
      "hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700": !isActive(path),
      "text-gray-700 dark:text-gray-300": !isActive(path)
    }
  );

  return (
    <>
      <div className={backdropClass} onClick={closeSidebar}></div>
      <aside className={sidebarClass}>
        {/* Role Label */}
        {user && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-md shadow-sm">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="py-4">
          <div className="px-6 mb-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main</h2>
          </div>
          
          <Link href="/dashboard" className={menuItemClass("/dashboard")}>
            <LayoutDashboard className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Dashboard</span>
          </Link>
          
          <Link href="/courses" className={menuItemClass("/courses")}>
            <BookOpen className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">My Courses</span>
          </Link>
          
          <Link href="/schedule" className={menuItemClass("/schedule")}>
            <Calendar className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Schedule</span>
          </Link>
          
          {(isAdmin || isMentor) && (
            <Link href="/students" className={menuItemClass("/students")}>
              <Users className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Students</span>
            </Link>
          )}
          
          {(isAdmin || isMentor) && (
            <>
              <div className="px-6 mt-6 mb-2">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teaching</h2>
              </div>
              
              <Link href="/create-course" className={menuItemClass("/create-course")}>
                <PlusCircle className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Create Course</span>
              </Link>
              
              <Link href="/assessments" className={menuItemClass("/assessments")}>
                <FileText className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Assessments</span>
              </Link>
              
              <Link href="/analytics" className={menuItemClass("/analytics")}>
                <LineChart className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Analytics</span>
              </Link>
              
              {isAdmin && (
                <Link href="/users" className={menuItemClass("/users")}>
                  <UsersRound className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">User Management</span>
                </Link>
              )}
            </>
          )}
          
          <div className="px-6 mt-6 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</h2>
          </div>
          
          <Link href="/messages" className={menuItemClass("/messages")}>
            <MessageSquare className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Messages</span>
            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-primary rounded-full">5</span>
          </Link>
          
          {(isAdmin || isMentor) && (
            <Link href="/earnings" className={menuItemClass("/earnings")}>
              <DollarSign className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Earnings</span>
            </Link>
          )}
          
          <Link href="/certificates" className={menuItemClass("/certificates")}>
            <Award className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Certificates</span>
          </Link>
          
          <Link href="/code-companion" className={menuItemClass("/code-companion")}>
            <Code2 className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Code Companion</span>
          </Link>
          
          <Link href="/profile" className={menuItemClass("/profile")}>
            <User className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Profile</span>
          </Link>
          
          <Link href="/settings" className={menuItemClass("/settings")}>
            <Settings className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Settings</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

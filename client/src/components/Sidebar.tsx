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
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const { user, isAdmin, isMentor } = useAuth();
  
  const sidebarClass = cn(
    "sidebar fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30 overflow-y-auto transition-transform duration-300 ease-in-out",
    {
      "transform -translate-x-full": !isOpen,
      "transform translate-x-0": isOpen
    },
    "lg:translate-x-0"
  );
  
  const backdropClass = cn(
    "fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300",
    {
      "opacity-100": isOpen,
      "opacity-0 pointer-events-none": !isOpen
    }
  );
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const menuItemClass = (path: string) => cn(
    "menu-item flex items-center px-4 py-2.5 text-sm",
    {
      "bg-primary-50 text-primary-600 border-l-3 border-primary-600 font-medium": isActive(path),
      "hover:bg-gray-50": !isActive(path)
    }
  );

  return (
    <>
      <div className={backdropClass} onClick={closeSidebar}></div>
      <aside className={sidebarClass}>
        {/* Role Label */}
        {user && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-md">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="py-4">
          <div className="px-4 mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</h2>
          </div>
          
          <Link href="/dashboard">
            <a className={menuItemClass("/dashboard")}>
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </a>
          </Link>
          
          <Link href="/courses">
            <a className={menuItemClass("/courses")}>
              <BookOpen className="mr-3 h-5 w-5" />
              My Courses
            </a>
          </Link>
          
          <Link href="/schedule">
            <a className={menuItemClass("/schedule")}>
              <Calendar className="mr-3 h-5 w-5" />
              Schedule
            </a>
          </Link>
          
          {(isAdmin || isMentor) && (
            <Link href="/students">
              <a className={menuItemClass("/students")}>
                <Users className="mr-3 h-5 w-5" />
                Students
              </a>
            </Link>
          )}
          
          {(isAdmin || isMentor) && (
            <>
              <div className="px-4 my-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teaching</h2>
              </div>
              
              <Link href="/create-course">
                <a className={menuItemClass("/create-course")}>
                  <PlusCircle className="mr-3 h-5 w-5" />
                  Create Course
                </a>
              </Link>
              
              <Link href="/assessments">
                <a className={menuItemClass("/assessments")}>
                  <FileText className="mr-3 h-5 w-5" />
                  Assessments
                </a>
              </Link>
              
              <Link href="/analytics">
                <a className={menuItemClass("/analytics")}>
                  <LineChart className="mr-3 h-5 w-5" />
                  Analytics
                </a>
              </Link>
            </>
          )}
          
          <div className="px-4 my-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h2>
          </div>
          
          <Link href="/messages">
            <a className={menuItemClass("/messages")}>
              <MessageSquare className="mr-3 h-5 w-5" />
              Messages
              <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-800 bg-primary-100 rounded-full">5</span>
            </a>
          </Link>
          
          {(isAdmin || isMentor) && (
            <Link href="/earnings">
              <a className={menuItemClass("/earnings")}>
                <DollarSign className="mr-3 h-5 w-5" />
                Earnings
              </a>
            </Link>
          )}
          
          <Link href="/profile">
            <a className={menuItemClass("/profile")}>
              <User className="mr-3 h-5 w-5" />
              Profile
            </a>
          </Link>
          
          <Link href="/settings">
            <a className={menuItemClass("/settings")}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </a>
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

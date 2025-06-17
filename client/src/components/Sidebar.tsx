import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
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
  Code,
  Code2,
  Receipt,
  CreditCard,
  Video,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCog,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const { user, isAdmin, isMentor } = useAuth();
  const [isOfficeManagementOpen, setIsOfficeManagementOpen] = useState(false);
  
  const sidebarClass = cn(
    "sidebar fixed left-0 top-16 bottom-0 w-72 sm:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 overflow-y-auto transition-transform duration-300 ease-in-out shadow-lg rounded-tr-3xl rounded-br-3xl",
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
    "menu-item flex items-center px-4 py-3 text-sm rounded-xl my-1.5 mx-3 transition-all duration-200",
    {
      "bg-primary text-primary-foreground font-medium": isActive(path),
      "hover:bg-primary/10 hover:text-primary active:bg-primary/20": !isActive(path),
      "text-gray-700 dark:text-gray-300": !isActive(path)
    }
  );

  return (
    <>
      <div className={backdropClass} onClick={closeSidebar}></div>
      <aside className={sidebarClass}>
        {/* Logo and Brand */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                CE
              </div>
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-white">Codelab Educare</span>
          </div>
        </div>
        
        {/* Role Label */}
        {user && (
          <div className="px-6 py-2 mb-4">
            <div className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="py-2 px-3">
          <div className="px-4 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main</h2>
          </div>
          
          <Link href="/dashboard" className={menuItemClass("/dashboard")}>
            <LayoutDashboard className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Dashboard</span>
          </Link>
          
          {isMentor && (
            <Link href="/mentor-dashboard" className={menuItemClass("/mentor-dashboard")}>
              <DollarSign className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">My Earnings</span>
            </Link>
          )}
          

          
          <Link href="/courses" className={menuItemClass("/courses")}>
            <BookOpen className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">{isAdmin ? "Course List" : "My Courses"}</span>
          </Link>
          
          <Link href="/schedule" className={menuItemClass("/schedule")}>
            <Calendar className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Schedule</span>
          </Link>
          
          <Link href="/live-classes" className={menuItemClass("/live-classes")}>
            <Video className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Live Classes</span>
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
              
              <Link href="/content-management" className={menuItemClass("/content-management")}>
                <FileText className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Content Management</span>
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
                <>
                  {/* Office Management Dropdown */}
                  <div className="my-1.5 mx-3">
                    <button
                      onClick={() => setIsOfficeManagementOpen(!isOfficeManagementOpen)}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-3 text-sm rounded-xl transition-all duration-200",
                        "hover:bg-primary/10 hover:text-primary text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <div className="flex items-center">
                        <Building2 className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">Office Management</span>
                      </div>
                      {isOfficeManagementOpen ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                    
                    {isOfficeManagementOpen && (
                      <div className="ml-4 mt-2 space-y-1">
                        <Link href="/users" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/users"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/users")
                          }
                        )}>
                          <UserCog className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">User Management</span>
                        </Link>
                        
                        <Link href="/admin/mentors" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/admin/mentors"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/admin/mentors")
                          }
                        )}>
                          <GraduationCap className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Mentor Management</span>
                        </Link>
                        
                        <Link href="/admin/mentor-payments" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/admin/mentor-payments"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/admin/mentor-payments")
                          }
                        )}>
                          <CreditCard className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Mentor Payments</span>
                        </Link>
                        
                        <Link href="/admin/mentor-performance" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/admin/mentor-performance"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/admin/mentor-performance")
                          }
                        )}>
                          <BarChart3 className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Performance</span>
                        </Link>
                        
                        <Link href="/admin/mentor-ratings" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/admin/mentor-ratings"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/admin/mentor-ratings")
                          }
                        )}>
                          <Star className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Ratings</span>
                        </Link>
                        
                        <Link href="/admin/mentor-activities" className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                          {
                            "bg-primary text-primary-foreground font-medium": isActive("/admin/mentor-activities"),
                            "hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-400": !isActive("/admin/mentor-activities")
                          }
                        )}>
                          <Activity className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Activities</span>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <Link href="/admin/oauth-settings" className={menuItemClass("/admin/oauth-settings")}>
                    <Settings className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">OAuth Settings</span>
                  </Link>
                  
                  <Link href="/admin/payments" className={menuItemClass("/admin/payments")}>
                    <CreditCard className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Payment Management</span>
                  </Link>
                </>
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
          

          
          <Link href="/certificates" className={menuItemClass("/certificates")}>
            <Award className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Certificates</span>
          </Link>
          
          <Link href="/coding-playground" className={menuItemClass("/coding-playground")}>
            <Code className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Coding Playground</span>
          </Link>
          
          <Link href="/code-companion" className={menuItemClass("/code-companion")}>
            <Code2 className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Code Companion</span>
          </Link>
          
          {!isAdmin && !isMentor && (
            <Link href="/kyc/student" className={menuItemClass("/kyc/student")}>
              <Shield className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">KYC Verification</span>
            </Link>
          )}
          
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

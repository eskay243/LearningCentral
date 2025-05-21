import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Menu, Bell, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, getFullName } from "@/lib/utils";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className="fixed top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40">
      <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 h-16">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden sm:block cursor-pointer">Codelab Educare</span>
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400 sm:hidden cursor-pointer">CL Educare</span>
          </Link>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
            <>
              <button 
                className="hidden xs:flex items-center justify-center p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 relative"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 translate-x-1/2 -translate-y-1/2 text-[10px]">
                  3
                </Badge>
              </button>
              <button 
                className="hidden xs:flex items-center justify-center p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Messages"
              >
                <MessageSquare size={18} />
              </button>
            </>
          )}
          
          {/* User Profile */}
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                id="profileDropdown" 
                onClick={handleProfileClick}
                className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-full p-1"
                aria-label="User menu"
                aria-expanded={showProfileMenu}
                aria-controls="user-menu"
              >
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getFullName(user)}
                </span>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={user?.profileImageUrl} alt={getFullName(user)} />
                  <AvatarFallback className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs sm:text-sm">
                    {getInitials(getFullName(user))}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Dropdown menu */}
              {showProfileMenu && (
                <div 
                  id="user-menu"
                  className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg dark:shadow-gray-900/30 z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-100"
                >
                  <Link href="/profile">
                    <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      My Profile
                    </a>
                  </Link>
                  <Link href="/settings">
                    <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Settings
                    </a>
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <a 
                    href="/api/logout" 
                    className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" className="px-3 sm:px-4">
              <a href="/api/login">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

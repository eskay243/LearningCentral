import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Menu, Bell, MessageSquare, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, getFullName } from "@/lib/utils";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MessageCenter } from "@/components/MessageCenter";

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
    <header className="fixed top-0 w-full bg-white dark:bg-gray-900 shadow-sm z-40">
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-8 h-16">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo (visible on small screens) */}
        <Link href="/" className="flex items-center flex-shrink-0 lg:hidden">
          <span className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block cursor-pointer">Codelab Educare</span>
          <span className="text-lg font-bold text-gray-800 dark:text-white sm:hidden cursor-pointer">CL</span>
        </Link>
        
        {/* Search Box */}
        <div className="hidden sm:flex items-center relative max-w-md w-full mx-6 lg:mx-0">
          <div className="relative w-full">
            <input 
              type="search" 
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0 rounded-xl pl-10 pr-4 py-2 focus:ring-1 focus:ring-primary/30 focus:outline-none" 
              placeholder="Search..." 
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex items-center gap-3 sm:gap-5">
          {isAuthenticated && (
            <>
              <div className="hidden sm:block">
                <NotificationCenter />
              </div>
              <div className="hidden sm:block">
                <MessageCenter />
              </div>
            </>
          )}
          
          {/* User Profile */}
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                id="profileDropdown" 
                onClick={handleProfileClick}
                className="flex items-center gap-2.5 focus:outline-none hover:opacity-90 transition-opacity rounded-full"
                aria-label="User menu"
                aria-expanded={showProfileMenu}
                aria-controls="user-menu"
              >
                <div className="flex flex-col items-end justify-center mr-1 hidden md:flex">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {getFullName(user) || 'Dibbendo'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Student'}
                  </span>
                </div>
                <Avatar className="h-10 w-10 border-2 border-primary/10 rounded-full">
                  <AvatarImage src={user?.profileImageUrl} alt={getFullName(user)} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(getFullName(user) || 'Dibbendo')}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Dropdown menu */}
              {showProfileMenu && (
                <div 
                  id="user-menu"
                  className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {getFullName(user) || 'Dibbendo'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      My Profile
                    </Link>
                    <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Settings className="mr-2 h-4 w-4 text-gray-500" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <a 
                      href="/api/logout" 
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90 px-5">
              <a href="/api/login">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

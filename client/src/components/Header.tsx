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
    <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-40">
      <div className="flex justify-between items-center px-4 md:px-6 h-16">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-dark-700 hover:bg-gray-100 focus:outline-none"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/">
            <span className="text-xl font-bold text-primary-600 hidden md:block cursor-pointer">Codelab Educare</span>
            <span className="text-xl font-bold text-primary-600 md:hidden cursor-pointer">CL Educare</span>
          </Link>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <button className="hidden sm:flex items-center justify-center p-1.5 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100 focus:outline-none relative">
                <Bell size={20} />
                <Badge className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center p-0 translate-x-1/2 -translate-y-1/2">
                  3
                </Badge>
              </button>
              <button className="hidden sm:flex items-center justify-center p-1.5 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100 focus:outline-none">
                <MessageSquare size={20} />
              </button>
            </>
          )}
          
          {/* User Profile */}
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                id="profileDropdown" 
                onClick={handleProfileClick}
                className="flex items-center gap-2 focus:outline-none"
              >
                <span className="hidden md:block text-sm font-medium">
                  {getFullName(user)}
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl} alt={getFullName(user)} />
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {getInitials(getFullName(user))}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Dropdown menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-50">
                  <Link href="/profile">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Profile
                    </a>
                  </Link>
                  <Link href="/settings">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </a>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <a 
                    href="/api/logout" 
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm">
              <a href="/api/login">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

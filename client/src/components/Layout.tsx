import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Layout auth state:', { isAuthenticated, userExists: !!user });
  }, [isAuthenticated, user]);

  // Close sidebar when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close sidebar when clicking on main content on mobile
  useEffect(() => {
    const handleMainClick = () => {
      if (sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('click', handleMainClick);
      return () => mainElement.removeEventListener('click', handleMainClick);
    }
  }, [sidebarOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header toggleSidebar={toggleSidebar} />
      
      {isAuthenticated && (
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      )}
      
      <main className={`${isAuthenticated ? 'lg:ml-64' : ''} pt-16 px-3 sm:px-4 md:px-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="mt-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-3 sm:px-4 md:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Codelab Educare. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-4 sm:gap-6">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;

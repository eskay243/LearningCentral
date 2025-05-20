import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header toggleSidebar={toggleSidebar} />
      
      {isAuthenticated && (
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      )}
      
      <main className={`${isAuthenticated ? 'lg:ml-64' : ''} pt-16`}>
        {children}
        
        {/* Footer */}
        <footer className="mt-8 bg-white border-t border-gray-200 py-4 px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Codelab Educare. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary-600">Contact Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;

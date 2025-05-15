import React, { useState } from 'react';
import { Menu, Search, LogOut } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Sidebar from './Sidebar';
import NotificationBell from '../NotificationBell';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerElements?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerElements }) => {
  const { user, logout } = useUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isMobileOpen={isMobileOpen}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center">
                <button
                  onClick={toggleMobileSidebar}
                  className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <Menu size={24} />
                </button>
                <h1 className="ml-2 md:ml-0 text-xl font-semibold text-gray-800">{title}</h1>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="hidden md:flex items-center">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Custom Header Elements */}
                {headerElements}

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-teal-500">
                    <span className="text-sm font-medium leading-none text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
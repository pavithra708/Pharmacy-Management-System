import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const { user, isAuthenticated } = useUser();
  
  // Determine where to redirect based on user role
  const homePath = isAuthenticated ? `/${user?.role}` : '/login';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-teal-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to={homePath}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Home size={20} />
            <span>Go to Homepage</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
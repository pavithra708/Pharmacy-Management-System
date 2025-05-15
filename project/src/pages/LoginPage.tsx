import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { PillIcon, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useUser();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to their dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      
      if (success) {
        // Redirect will happen in the useEffect above
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to set demo account credentials
  const setDemoCredentials = (role: 'admin' | 'pharmacist') => {
    if (role === 'admin') {
      setEmail('admin@pharmacy.com');
      setPassword('admin123');
    } else {
      setEmail('pharmacist@pharmacy.com');
      setPassword('pharm123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-teal-100 p-3 rounded-full">
              <PillIcon className="h-10 w-10 text-teal-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Welcome to PharmaSys
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Log in to access your pharmacy dashboard
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 mb-4">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg font-medium ${
                    isLoading
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:bg-teal-700 active:bg-teal-800'
                  } transition-colors`}
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center mb-2">Accounts</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDemoCredentials('admin')}
                className="flex-1 py-2 px-3 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Admin 
              </button>
              <button
                onClick={() => setDemoCredentials('pharmacist')}
                className="flex-1 py-2 px-3 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Pharmacist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
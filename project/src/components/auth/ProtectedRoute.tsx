import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: 'admin' | 'pharmacist';
};

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to the appropriate dashboard if role doesn't match
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
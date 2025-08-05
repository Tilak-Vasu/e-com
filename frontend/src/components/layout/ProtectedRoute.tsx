// src/components/layout/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or a blank screen while checking auth status
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // log in, which is a very user-friendly experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the child route's component
  return <Outlet />;
};

export default ProtectedRoute;
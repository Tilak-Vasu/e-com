// src/components/layout/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Your custom auth hook

const ProtectedRoute: React.FC = () => {
  // 1. Get the current user from your custom AuthContext.
  //    The `user` object will exist if they are logged in, otherwise it will be null.
  const { user } = useAuth();
  
  // 2. Get the current location.
  //    This is a great UX feature. It allows us to send the user back to the
  //    page they were trying to access after they successfully log in.
  const location = useLocation();

  // 3. The conditional logic.
  if (!user) {
    // If there is no user, redirect them to the /login page.
    // We pass the current location in the `state` prop so the LoginPage
    // can access it and redirect back after a successful login.
    // The `replace` prop prevents the user from being able to click "back" to the protected route.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. If a user exists, render the child route's component.
  //    The <Outlet /> component from react-router-dom is a placeholder
  //    for the actual page component (e.g., <CheckoutPage />, <OrderHistoryPage />, etc.).
  return <Outlet />;
};

export default ProtectedRoute;
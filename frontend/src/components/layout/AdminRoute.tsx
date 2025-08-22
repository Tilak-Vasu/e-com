// src/components/layout/AdminRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Adjust if path is different

const AdminRoute: React.FC = () => {
  const { user } = useAuth();

  // If the user is a staff member, allow access.
  // Otherwise, redirect them to the home page.
  return user && user.is_staff ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ redirectPath = '/login', requiredRole }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  const role = authService.getUserRole();

  // If a specific role is required and user does not match
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  // If athlete route (no specific role required), but user is ADMIN, redirect to admin console
  if (!requiredRole && role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

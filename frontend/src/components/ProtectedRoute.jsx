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
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'COACH') return <Navigate to="/coach" replace />;
    return <Navigate to="/" replace />;
  }

  // If athlete route (no specific role required), but user is ADMIN or COACH, redirect appropriately
  if (!requiredRole && role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (!requiredRole && role === 'COACH') {
    return <Navigate to="/coach" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

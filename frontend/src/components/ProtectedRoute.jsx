import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ redirectPath = '/login', requiredRole }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  if (requiredRole && authService.getUserRole() !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

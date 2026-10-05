import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ redirectPath = '/login' }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

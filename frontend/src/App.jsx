import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/global.css';

// Lazy load route pages for high Lighthouse Performance & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Activities = lazy(() => import('./pages/Activities'));
const Sensors = lazy(() => import('./pages/Sensors'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

function PageFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '45vh',
      color: '#38bdf8',
      fontSize: '0.9rem',
      fontWeight: '600',
      gap: '10px'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        border: '3px solid rgba(56, 189, 248, 0.2)',
        borderTopColor: '#38bdf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span>Đang tải hệ thống...</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageFallback />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageFallback />}>
            <Register />
          </Suspense>
        } />
        
        {/* Athlete Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="statistics"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Statistics />
                </Suspense>
              }
            />
            <Route
              path="activities"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Activities />
                </Suspense>
              }
            />
            <Route
              path="sensors"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Sensors />
                </Suspense>
              }
            />
            <Route
              path="reports"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Reports />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* Dedicated Admin Protected Routes (Simple, High Performance) */}
        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AdminUsers />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

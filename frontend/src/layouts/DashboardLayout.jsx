import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { deviceService } from '../services/api';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patchStatus, setPatchStatus] = useState(null);

  useEffect(() => {
    // Fetch live device & sensor patch telemetry
    const loadStatus = async () => {
      try {
        const data = await deviceService.getStatus();
        setPatchStatus(data);
      } catch (err) {
        console.error('Failed to load patch status', err);
      }
    };
    loadStatus();

    // Subtle interval update for realistic live sensor feel
    const timer = setInterval(loadStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patchStatus={patchStatus}
      />
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          patchStatus={patchStatus}
        />
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

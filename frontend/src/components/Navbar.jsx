import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Radio, BatteryCharging, User, Shield, LogOut } from 'lucide-react';
import { authService } from '../services/api';
import './Navbar.css';

export default function Navbar({ onToggleSidebar, patchStatus }) {
  const navigate = useNavigate();
  const isConnected = patchStatus?.connected ?? true;
  const battery = patchStatus?.batteryLevel ?? 82;
  const user = authService.getCurrentUser();
  const isAdmin = user.role === 'ADMIN';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Open Menu">
          <Menu size={22} />
        </button>
        <div className="navbar-heading">
          <div className="system-pill">
            <span className="live-dot" />
            {isAdmin ? 'ADMIN CONTROL CENTER' : 'LIVE TELEMETRY'}
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Device Quick Status Pill */}
        <div className="sensor-quick-pill">
          <Radio size={15} className={isConnected ? 'icon-connected' : 'icon-disconnected'} />
          <span className="patch-name">{patchStatus?.deviceName || 'Patch #001'}</span>
          <span className="divider-dot">•</span>
          <span className={`status-label ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="divider-dot">•</span>
          <span className="battery-badge">
            <BatteryCharging size={14} />
            {battery}%
          </span>
        </div>

        {/* Notification Bell */}
        <button className="nav-action-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge">2</span>
        </button>

        {/* User Profile */}
        <div className="user-profile-widget">
          <div className={`avatar-circle ${isAdmin ? 'admin-avatar' : ''}`}>
            {isAdmin ? <Shield size={18} /> : <User size={18} />}
          </div>
          <div className="user-info-text">
            <span className="user-name">{user.name}</span>
            <span className={`user-role-badge ${isAdmin ? 'badge-admin' : 'badge-athlete'}`}>
              {isAdmin ? '🛡️ QUẢN TRỊ VIÊN' : '🏃 VẬN ĐỘNG VIÊN'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="logout-action-btn"
          onClick={handleLogout}
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut size={16} />
          <span className="logout-text">Thoát</span>
        </button>
      </div>
    </header>
  );
}

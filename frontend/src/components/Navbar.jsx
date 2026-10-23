import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Radio, Battery, BatteryCharging, Zap, User, Shield, LogOut, Flame } from 'lucide-react';
import { authService } from '../services/api';
import { useBle } from '../context/BleContext';
import './Navbar.css';

export default function Navbar({ onToggleSidebar, patchStatus }) {
  const navigate = useNavigate();
  const { bleStatus, bleDevice, bleTelemetry, autoSession, isCharging } = useBle();

  const isBle = bleStatus === 'connected';
  const isConnected = isBle || Boolean(patchStatus?.connected);
  const deviceName = isBle ? (bleDevice?.deviceName || 'ESP32-C3') : (patchStatus?.deviceName || 'Second Skin Patch');
  const battery = isBle ? (bleTelemetry?.bat ?? patchStatus?.batteryLevel ?? 92) : (patchStatus?.batteryLevel ?? bleTelemetry?.bat ?? 92);
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
            {isAdmin ? 'TRUNG TÂM QUẢN TRỊ' : 'DỮ LIỆU ĐO TRỰC TIẾP'}
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Active Auto Session Quick Pill if running */}
        {(autoSession?.status === 'recording' || autoSession?.status === 'cooldown') && (
          <div
            className="sensor-quick-pill session-quick-pill"
            onClick={() => navigate('/sensors')}
            style={{
              cursor: 'pointer',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              background: 'rgba(0, 242, 254, 0.12)',
              color: '#00f2fe',
            }}
            title="Đang ghi nhận buổi tập - Nhấn để xem chi tiết"
          >
            <span className="live-dot" />
            <span style={{ fontWeight: 700 }}>
              {autoSession.sport === 'Basketball' ? 'Bóng rổ' : autoSession.sport === 'Running' ? 'Chạy bộ' : autoSession.sport}: {Math.floor(autoSession.elapsedSeconds / 60)}:{String(autoSession.elapsedSeconds % 60).padStart(2, '0')}
            </span>
            <span className="divider-dot">•</span>
            <span>{autoSession.jumpCount} cú nhảy</span>
          </div>
        )}

        {/* Device Quick Status Pill */}
        <div className="sensor-quick-pill" onClick={() => navigate('/sensors')} style={{ cursor: 'pointer' }} title="Quản lý cảm biến">
          <Radio size={15} className={isConnected ? 'icon-connected' : 'icon-disconnected'} />
          <span className="patch-name">{deviceName}</span>
          <span className="divider-dot">•</span>
          <span className={`status-label ${isConnected ? 'connected' : 'disconnected'}`}>
            {isBle ? 'BLE Trực tiếp' : isConnected ? 'Đã kết nối' : 'Đã ngắt kết nối'}
          </span>
          <span className="divider-dot">•</span>
          <span className={`battery-badge ${isCharging ? 'charging' : ''}`} style={isCharging ? { borderColor: 'rgba(6, 182, 212, 0.6)', color: 'var(--accent-cyan)' } : {}}>
            {isCharging ? <Zap size={14} /> : <Battery size={14} />}
            {battery}% {isCharging && '(Sạc)'}
          </span>
        </div>

        {/* Notification Bell */}
        <button className="nav-action-btn" aria-label="Thông báo">
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
          title="Đăng xuất"
        >
          <LogOut size={16} />
          <span className="logout-text">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}

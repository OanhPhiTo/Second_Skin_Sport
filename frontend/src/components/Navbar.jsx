import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Radio,
  Battery,
  Zap,
  User,
  Shield,
  LogOut,
  Flame,
  Trophy,
  CheckCheck,
  Trash2,
  X,
  ChevronRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { authService } from '../services/api';
import { useBle } from '../context/BleContext';
import { useNotification } from '../context/NotificationContext';
import './Navbar.css';

export default function Navbar({ onToggleSidebar, patchStatus }) {
  const navigate = useNavigate();
  const { bleStatus, bleDevice, bleTelemetry, autoSession, isCharging } = useBle();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotification();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef(null);

  const isBle = bleStatus === 'connected';
  const isConnected = isBle || Boolean(patchStatus?.connected);
  const deviceName = isBle ? (bleDevice?.deviceName || 'ESP32-C3') : (patchStatus?.deviceName || 'Second Skin Patch');
  const battery = isBle ? (bleTelemetry?.bat ?? patchStatus?.batteryLevel ?? 92) : (patchStatus?.batteryLevel ?? bleTelemetry?.bat ?? 92);
  const user = authService.getCurrentUser();
  const isAdmin = user.role === 'ADMIN';
  const isCoach = user.role === 'COACH';

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleNotificationItemClick = (notif) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    if (notif.sessionId) {
      navigate(`/activities?session=${notif.sessionId}`);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Vừa xong';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${Math.floor(diffHours / 24)} ngày trước`;
    } catch (e) {
      return 'Vừa xong';
    }
  };

  const getNotifIcon = (notif) => {
    if (notif.sport === 'Basketball') {
      return <Flame size={16} className="notif-icon-basketball" />;
    }
    if (notif.sport === 'Running') {
      return <Zap size={16} className="notif-icon-running" />;
    }
    if (notif.type === 'SESSION_COMPLETED') {
      return <Trophy size={16} className="notif-icon-trophy" />;
    }
    return <Activity size={16} className="notif-icon-system" />;
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

        {/* Notification Bell with Interactive Dropdown */}
        <div className="navbar-notif-wrapper" ref={notifDropdownRef}>
          <button
            className={`nav-action-btn ${isNotifOpen ? 'active' : ''}`}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Thông báo"
            title="Xem thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isNotifOpen && (
            <div className="notif-dropdown-card" role="menu">
              {/* Header */}
              <div className="notif-dropdown-header">
                <div className="notif-header-title-row">
                  <h3 className="notif-header-title">Thông Báo</h3>
                  {unreadCount > 0 && (
                    <span className="notif-unread-tag">{unreadCount} mới</span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all-btn"
                    onClick={markAllAsRead}
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={14} />
                    <span>Đã đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="notif-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <Bell size={32} className="notif-empty-icon" />
                    <p className="notif-empty-title">Không có thông báo mới</p>
                    <p className="notif-empty-desc">
                      Các thông báo khi kết thúc phiên tập và cảnh báo sẽ xuất hiện tại đây.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.read ? 'read' : 'unread'} ${notif.sessionId ? 'clickable' : ''}`}
                      onClick={() => handleNotificationItemClick(notif)}
                    >
                      <div className="notif-item-icon-box">
                        {getNotifIcon(notif)}
                      </div>

                      <div className="notif-item-body">
                        <div className="notif-item-top">
                          <span className="notif-item-title">{notif.title}</span>
                          <span className="notif-item-time">{formatRelativeTime(notif.createdAt)}</span>
                        </div>

                        <p className="notif-item-desc">{notif.message}</p>

                        {/* Metric pills if session */}
                        {notif.performanceScore !== null && notif.performanceScore !== undefined && (
                          <div className="notif-metric-tags">
                            <span className="notif-tag score">
                              Điểm: <strong>{notif.performanceScore}/100</strong>
                            </span>
                            {notif.durationMinutes && (
                              <span className="notif-tag duration">
                                {notif.durationMinutes} phút
                              </span>
                            )}
                            {notif.totalJumps > 0 && (
                              <span className="notif-tag jumps">
                                {notif.totalJumps} cú nhảy
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="notif-item-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        title="Xóa thông báo này"
                        aria-label="Xóa thông báo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="notif-dropdown-footer">
                  <button
                    type="button"
                    className="notif-clear-all-btn"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 size={13} />
                    <span>Xóa toàn bộ thông báo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="user-profile-widget">
          <div className={`avatar-circle ${isAdmin ? 'admin-avatar' : isCoach ? 'coach-avatar' : ''}`}>
            {isAdmin ? <Shield size={18} /> : isCoach ? <Zap size={18} /> : <User size={18} />}
          </div>
          <div className="user-info-text">
            <span className="user-name">{user.name}</span>
            <span className={`user-role-badge ${isAdmin ? 'badge-admin' : isCoach ? 'badge-coach' : 'badge-athlete'}`}>
              {isAdmin ? '🛡️ QUẢN TRỊ VIÊN' : isCoach ? '🏆 HUẤN LUYỆN VIÊN' : '🏃 VẬN ĐỘNG VIÊN'}
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

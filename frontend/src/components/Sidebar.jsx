import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Cpu,
  FileText,
  Settings,
  Radio,
  X,
  Trophy,
} from 'lucide-react';
import { authService } from '../services/api';
import logoImg from '../assets/logo-slogan.png';
import { useBle } from '../context/BleContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, patchStatus }) {
  const { bleStatus, bleDevice, bleTelemetry, isCharging } = useBle();
  const isBle = bleStatus === 'connected';
  const isConnected = isBle || Boolean(patchStatus?.connected);
  const battery = isBle ? (bleTelemetry?.bat ?? patchStatus?.batteryLevel ?? 92) : (patchStatus?.batteryLevel ?? bleTelemetry?.bat ?? 92);
  const deviceName = isBle ? (bleDevice?.deviceName || 'SecondSkin_ESP32') : (patchStatus?.deviceName || 'PATCH #001');

  const role = authService.getUserRole();
  const isCoachOrAdmin = role === 'COACH' || role === 'ADMIN';

  const navItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    ...(isCoachOrAdmin ? [{ to: '/coach', label: 'Chiến thuật Coach', icon: Trophy }] : []),
    { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
    { to: '/activities', label: 'Hoạt động', icon: Activity },
    { to: '/sensors', label: 'Cảm biến', icon: Cpu },
    { to: '/reports', label: 'Báo cáo', icon: FileText },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <img src={logoImg} alt="Second Skin Sport Logo" className="sidebar-logo-img" />
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">DANH MỤC CHÍNH</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                onClick={onClose}
              >
                <div className="nav-icon-box">
                  <Icon size={18} />
                </div>
                <span className="nav-text">{item.label}</span>
                <span className="active-pill" />
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Patch Live Widget */}
        <div className="sidebar-footer">
          <div className="patch-card">
            <div className="patch-header">
              <div className="patch-indicator">
                <Radio size={14} className={isConnected ? "pulse-icon" : "dim-icon"} />
                <span>{deviceName}</span>
              </div>
              <span className={isConnected ? "status-badge-online" : "status-badge-offline"}>
                {isConnected ? 'TRỰC TUYẾN' : 'NGOẠI TUYẾN'}
              </span>
            </div>
            <div className="patch-battery-bar">
              <div
                className="battery-fill"
                style={{
                  width: `${isConnected ? battery : 0}%`,
                  background: !isConnected
                    ? '#64748b'
                    : isCharging
                    ? 'var(--accent-cyan)'
                    : battery < 20
                    ? '#ef4444'
                    : undefined,
                  boxShadow: isCharging ? '0 0 8px rgba(6, 182, 212, 0.6)' : undefined,
                }}
              ></div>
            </div>
            <div className="patch-meta">
              <span>{isConnected ? (isCharging ? `⚡ Đang sạc: ${battery}%` : `Pin: ${battery}%`) : 'Trạng thái: Đã ngắt kết nối'}</span>
              <span>BLE 5.2</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

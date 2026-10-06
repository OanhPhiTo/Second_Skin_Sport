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
  Users,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../services/api';
import logoImg from '../assets/logo-slogan.png';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const isAdmin = authService.isAdmin();

  const athleteNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/statistics', label: 'Statistics', icon: BarChart3 },
    { to: '/activities', label: 'Activities', icon: Activity },
    { to: '/sensors', label: 'Sensors', icon: Cpu },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { to: '/admin/users', label: 'Quản lý người dùng', icon: Users, isPriority: true },
    { to: '/sensors', label: 'Giám sát cảm biến', icon: Cpu },
    { to: '/reports', label: 'Báo cáo hệ thống', icon: FileText },
    { to: '/settings', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  const adminAthleteViewItems = [
    { to: '/', label: 'Dashboard Athlete', icon: LayoutDashboard },
    { to: '/statistics', label: 'Thống kê vận động', icon: BarChart3 },
    { to: '/activities', label: 'Buổi tập & AI Coach', icon: Activity },
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

        {/* Role Badge Indicator */}
        {isAdmin && (
          <div className="sidebar-role-badge-wrap">
            <div className="sidebar-admin-pill">
              <ShieldCheck size={14} />
              <span>HỆ THỐNG QUẢN TRỊ (ADMIN)</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <div className="nav-group-label" style={{ color: '#ef4444' }}>
                ⭐ QUẢN TRỊ VIÊN
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin/users'}
                    className={({ isActive }) =>
                      `nav-link ${item.isPriority ? 'nav-link-priority' : ''} ${
                        isActive ? 'nav-link-active' : ''
                      }`
                    }
                    onClick={onClose}
                  >
                    <div className="nav-icon-box">
                      <Icon size={18} />
                    </div>
                    <span className="nav-text">{item.label}</span>
                    {item.isPriority && <span className="priority-tag">ƯU TIÊN</span>}
                    <span className="active-pill" />
                  </NavLink>
                );
              })}

              <div className="nav-group-label" style={{ marginTop: '16px' }}>
                🏃 CHẾ ĐỘ XEM ATHLETE
              </div>
              {adminAthleteViewItems.map((item) => {
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
            </>
          ) : (
            <>
              <div className="nav-group-label">MAIN MENU</div>
              {athleteNavItems.map((item) => {
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
            </>
          )}
        </nav>

        {/* Bottom Patch Live Widget */}
        <div className="sidebar-footer">
          <div className="patch-card">
            <div className="patch-header">
              <div className="patch-indicator">
                <Radio size={14} className="pulse-icon" />
                <span>PATCH #001</span>
              </div>
              <span className="status-badge-online">ONLINE</span>
            </div>
            <div className="patch-battery-bar">
              <div className="battery-fill" style={{ width: '82%' }}></div>
            </div>
            <div className="patch-meta">
              <span>Battery: 82%</span>
              <span>BLE 5.2</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

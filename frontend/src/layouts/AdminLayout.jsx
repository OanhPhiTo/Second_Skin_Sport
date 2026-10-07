import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../services/api';
import logoImg from '../assets/logo-slogan.png';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="admin-app-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand-header">
          <img src={logoImg} alt="Second Skin" className="admin-logo-img" />
          <div className="admin-subtag">
            <ShieldCheck size={13} />
            <span>HỆ THỐNG QUẢN TRỊ</span>
          </div>
        </div>

        <nav className="admin-menu-nav">
          <div className="admin-menu-label">DANH MỤC QUẢN TRỊ</div>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? 'active' : ''}`
            }
          >
            <Users size={18} />
            <span>Quản lý người dùng</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="btn-admin-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="admin-main-wrap">
        <header className="admin-top-navbar">
          <div className="admin-nav-left">
            <span className="admin-title-badge">ADMIN CONSOLE</span>
          </div>

          <div className="admin-nav-right">
            <div className="admin-user-pill">
              <div className="admin-avatar-box">
                <Shield size={16} />
              </div>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user.name || 'System Administrator'}</span>
                <span className="admin-role-tag">QUẢN TRỊ VIÊN</span>
              </div>
            </div>

            <button
              className="btn-header-logout"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={15} />
              <span>Thoát</span>
            </button>
          </div>
        </header>

        <main className="admin-content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

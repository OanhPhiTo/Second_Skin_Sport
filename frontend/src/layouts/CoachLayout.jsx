import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  LogOut,
  Trophy,
  Activity,
  ArrowLeftRight,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/api';
import logoImg from '../assets/logo-slogan.png';
import './CoachLayout.css';

export default function CoachLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="coach-app-layout">
      {/* Coach Tactical Sidebar */}
      <aside className="coach-sidebar">
        <div className="coach-brand-header">
          <img src={logoImg} alt="Second Skin Sport" className="coach-logo-img" />
          <div className="coach-subtag">
            <Trophy size={14} className="coach-trophy-icon" />
            <span>BAN HUẤN LUYỆN PRO</span>
          </div>
        </div>

        <nav className="coach-menu-nav">
          <div className="coach-menu-label">ĐIỀU HÀNH TÁC CHIẾN</div>
          <NavLink
            to="/coach"
            end
            className={({ isActive }) =>
              `coach-menu-item ${isActive ? 'active' : ''}`
            }
          >
            <ShieldAlert size={18} />
            <span>Chỉ Huy & Xoay Tua</span>
            <span className="coach-live-dot" />
          </NavLink>

          <NavLink
            to="/coach/roster"
            className={({ isActive }) =>
              `coach-menu-item ${isActive ? 'active' : ''}`
            }
          >
            <Users size={18} />
            <span>Đội Hình & Thiết Bị</span>
          </NavLink>

          <div className="coach-menu-label">CHẾ ĐỘ XEM KHÁC</div>
          <NavLink to="/" className="coach-menu-item secondary">
            <Activity size={18} />
            <span>Giao Diện Cá Nhân</span>
          </NavLink>
        </nav>

        <div className="coach-sidebar-footer">
          <div className="coach-team-card">
            <div className="coach-team-title">
              <span className="pulse-beacon" />
              <span>Hanoi Dragons Pro</span>
            </div>
            <div className="coach-team-meta">
              <span>Bóng rổ chuyên nghiệp</span>
              <span className="badge-iot">6 Cảm Biến Patch</span>
            </div>
          </div>

          <button className="btn-coach-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Tactical Viewport */}
      <div className="coach-main-wrap">
        <header className="coach-top-navbar">
          <div className="coach-nav-left">
            <div className="coach-title-pill">
              <Trophy size={16} className="trophy-gold" />
              <span>TRUNG TÂM PHÂN TÍCH & ĐIỀU PHỐI CHIẾN THUẬT</span>
            </div>
            <div className="match-timer-pill">
              <Clock size={15} />
              <span>Hiệp 3 • 28:45</span>
            </div>
          </div>

          <div className="coach-nav-right">
            <div className="coach-telemetry-badge">
              <Radio size={14} className="radio-pulse" />
              <span>STREAM TELEMETRY 10HZ</span>
            </div>

            <div className="coach-user-pill">
              <div className="coach-avatar-box">
                <Trophy size={17} />
              </div>
              <div className="coach-user-meta">
                <span className="coach-user-name">{user.name || 'HLV. Mike Torres'}</span>
                <span className="coach-role-tag">🏆 HUẤN LUYỆN VIÊN TRƯỞNG</span>
              </div>
            </div>

            <button
              className="btn-coach-header-logout"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="coach-content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Database,
  Server,
  ArrowRight,
  RefreshCw,
  Activity,
  Flame,
} from 'lucide-react';
import { adminService } from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.enabled).length;
    const banned = users.filter((u) => !u.enabled).length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return { total, active, banned, admins };
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users].slice(0, 5);
  }, [users]);

  return (
    <div className="admin-dashboard-wrap">
      {/* Top Banner */}
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Bảng Điều Khiển Quản Trị</h1>
          <p className="admin-dash-subtitle">
            Hệ thống quản lý nội bộ Second Skin Sport • Ưu tiên hiệu năng và tốc độ xử lý.
          </p>
        </div>
        <button
          className="btn-refresh-simple"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
          <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="admin-stat-grid">
        <div className="stat-card-simple">
          <div className="stat-icon-simple cyan">
            <Users size={20} />
          </div>
          <div className="stat-info-simple">
            <span className="stat-label-simple">Tổng người dùng</span>
            <span className="stat-value-simple">{loading ? '-' : stats.total}</span>
          </div>
        </div>

        <div className="stat-card-simple">
          <div className="stat-icon-simple green">
            <UserCheck size={20} />
          </div>
          <div className="stat-info-simple">
            <span className="stat-label-simple">Vận động viên hoạt động</span>
            <span className="stat-value-simple text-green">{loading ? '-' : stats.active}</span>
          </div>
        </div>

        <div className="stat-card-simple">
          <div className="stat-icon-simple red">
            <UserX size={20} />
          </div>
          <div className="stat-info-simple">
            <span className="stat-label-simple">Tài khoản bị khóa</span>
            <span className="stat-value-simple text-red">{loading ? '-' : stats.banned}</span>
          </div>
        </div>

        <div className="stat-card-simple">
          <div className="stat-icon-simple amber">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-info-simple">
            <span className="stat-label-simple">Tài khoản Quản trị</span>
            <span className="stat-value-simple text-amber">{loading ? '-' : stats.admins}</span>
          </div>
        </div>
      </div>

      {/* System Status Row */}
      <div className="admin-system-health">
        <div className="health-item">
          <Database size={16} className="health-icon active" />
          <span className="health-name">Cơ sở dữ liệu SQL:</span>
          <span className="health-status-badge online">Hoạt động (Đồng bộ)</span>
        </div>
        <div className="health-divider" />
        <div className="health-item">
          <Server size={16} className="health-icon active" />
          <span className="health-name">Backend API (Spring Boot):</span>
          <span className="health-status-badge online">Port 8080 (Online)</span>
        </div>
        <div className="health-divider" />
        <div className="health-item">
          <Activity size={16} className="health-icon active" />
          <span className="health-name">Chế độ hệ thống:</span>
          <span className="health-status-badge mode">Internal Production Mode</span>
        </div>
      </div>

      {/* Quick Recent Users Section */}
      <div className="recent-users-box">
        <div className="recent-users-header">
          <div>
            <h2 className="recent-title">Danh Sách Người Dùng Gần Đây</h2>
            <p className="recent-sub">Tóm tắt các tài khoản mới nhất trong cơ sở dữ liệu.</p>
          </div>
          <button
            className="btn-view-all-users"
            onClick={() => navigate('/admin/users')}
          >
            <span>Đi tới Quản lý người dùng</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="recent-table-wrap">
          <table className="recent-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>HỌ TÊN</th>
                <th>EMAIL</th>
                <th>VAI TRÒ</th>
                <th>MÔN THỂ THAO</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td className="text-dim">#{u.id}</td>
                  <td className="fw-bold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.role === 'ADMIN' ? (
                      <span className="badge-admin-tag">
                        <ShieldCheck size={12} /> ADMIN
                      </span>
                    ) : (
                      <span className="badge-user-tag">
                        <Flame size={12} /> ATHLETE
                      </span>
                    )}
                  </td>
                  <td>{u.preferredSport || 'Đa môn'}</td>
                  <td>
                    <span className={`status-pill-mini ${u.enabled ? 'active' : 'banned'}`}>
                      {u.enabled ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

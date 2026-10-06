import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { adminService } from '../services/api';
import './AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionNotice, setActionNotice] = useState(null);

  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users from SQL API', err);
      setError('Không thể kết nối cơ sở dữ liệu người dùng. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  const handleToggleBan = async (user) => {
    try {
      if (user.enabled) {
        await adminService.banUser(user.id);
        showToast(`Đã khóa tài khoản của ${user.name}`, 'warning');
      } else {
        await adminService.unbanUser(user.id);
        showToast(`Đã mở khóa tài khoản của ${user.name}`, 'success');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: !user.enabled } : u))
      );
    } catch (err) {
      showToast('Thao tác khóa/mở khóa thất bại', 'error');
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmChange = window.confirm(
      `Bạn có chắc chắn muốn chuyển vai trò của ${user.name} sang ${nextRole}?`
    );
    if (!confirmChange) return;

    try {
      await adminService.updateRole(user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      showToast(`Đã cập nhật quyền của ${user.name} thành ${nextRole}`, 'success');
    } catch (err) {
      showToast('Cập nhật quyền thất bại', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'ADMIN') {
      alert('Không thể xóa tài khoản Quản trị viên cấp cao.');
      return;
    }
    const confirmDelete = window.confirm(
      `Hành động này sẽ xóa vĩnh viễn vận động viên "${user.name}" (${user.email}) khỏi cơ sở dữ liệu SQL. Tiếp tục?`
    );
    if (!confirmDelete) return;

    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Đã xóa vĩnh viễn người dùng ${user.name}`, 'warning');
    } catch (err) {
      showToast('Xóa người dùng thất bại', 'error');
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.enabled).length;
    const banned = users.filter((u) => !u.enabled).length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return { total, active, banned, admins };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchQuery =
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.preferredSport || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole =
        roleFilter === 'ALL' ? true : user.role === roleFilter;

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? user.enabled
          : !user.enabled;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {actionNotice && (
        <div className={`admin-toast-banner ${actionNotice.type}`}>
          {actionNotice.type === 'success' && <CheckCircle2 size={18} />}
          {actionNotice.type === 'warning' && <AlertTriangle size={18} />}
          {actionNotice.type === 'error' && <ShieldAlert size={18} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="admin-header-row">
        <div>
          <div className="admin-eyebrow">
            <span className="live-badge-dot" />
            HỆ THỐNG QUẢN TRỊ DỮ LIỆU SQL
          </div>
          <h1 className="admin-main-title">Quản Lý Người Dùng & Vận Động Viên</h1>
          <p className="admin-main-subtitle">
            Bảng điều khiển quản trị người dùng cấp quyền cao nhất. Dữ liệu được đồng bộ trực tiếp từ Database.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            className="btn-admin-refresh"
            onClick={() => fetchUsers(true)}
            disabled={refreshing || loading}
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Đang đồng bộ...' : 'Làm mới SQL'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="admin-metrics-grid">
        <div className="metric-box-card">
          <div className="metric-header">
            <span className="metric-label">Tổng người dùng</span>
            <div className="metric-icon-wrap cyan">
              <Users size={18} />
            </div>
          </div>
          <div className="metric-number-val">{metrics.total}</div>
          <div className="metric-footer-text">Đã ghi nhận trong cơ sở dữ liệu</div>
        </div>

        <div className="metric-box-card">
          <div className="metric-header">
            <span className="metric-label">Vận động viên hoạt động</span>
            <div className="metric-icon-wrap green">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="metric-number-val highlight-green">{metrics.active}</div>
          <div className="metric-footer-text">Tài khoản được phép truy cập</div>
        </div>

        <div className="metric-box-card">
          <div className="metric-header">
            <span className="metric-label">Tài khoản bị khóa</span>
            <div className="metric-icon-wrap red">
              <UserX size={18} />
            </div>
          </div>
          <div className="metric-number-val highlight-red">{metrics.banned}</div>
          <div className="metric-footer-text">Bị đình chỉ quyền truy cập</div>
        </div>

        <div className="metric-box-card">
          <div className="metric-header">
            <span className="metric-label">Quản trị viên (Admin)</span>
            <div className="metric-icon-wrap amber">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="metric-number-val highlight-amber">{metrics.admins}</div>
          <div className="metric-footer-text">Quyền hạn cao nhất hệ thống</div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="admin-filter-bar card">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc môn thể thao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-select-wrap">
            <span className="select-label">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="USER">Vận động viên (USER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <span className="select-label">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="BANNED">Đã bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="admin-error-banner">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-table-card card">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Đang truy vấn danh sách người dùng từ SQL database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={48} className="empty-icon" />
            <h3>Không tìm thấy người dùng phù hợp</h3>
            <p>Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-custom-table">
              <thead>
                <tr>
                  <th>VẬN ĐỘNG VIÊN</th>
                  <th>EMAIL</th>
                  <th>MÔN THỂ THAO</th>
                  <th>VAI TRÒ</th>
                  <th>NGÀY THAM GIA</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right' }}>QUẢN TRỊ HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === 'ADMIN';
                  const initials = (user.name || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className={`user-row ${!user.enabled ? 'row-banned' : ''}`}
                    >
                      <td>
                        <div className="user-profile-cell">
                          <div className={`user-table-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
                            {initials}
                          </div>
                          <div className="user-name-group">
                            <span className="user-table-name">{user.name}</span>
                            <span className="user-table-id">ID: #{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="user-table-email">{user.email}</span>
                      </td>
                      <td>
                        <span className="user-sport-pill">
                          <Activity size={13} />
                          {user.preferredSport || 'Thể thao đa năng'}
                        </span>
                      </td>
                      <td>
                        {isAdmin ? (
                          <span className="badge-role-admin">
                            <ShieldCheck size={13} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="badge-role-user">
                            <Flame size={13} />
                            ATHLETE
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="user-date-text">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : '01/09/2026'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`user-status-pill ${
                            user.enabled ? 'status-active' : 'status-banned'
                          }`}
                        >
                          <span className="status-dot" />
                          {user.enabled ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          {/* Toggle Role Button */}
                          <button
                            type="button"
                            className="btn-action-pill role-pill"
                            onClick={() => handleToggleRole(user)}
                            title={`Chuyển quyền thành ${isAdmin ? 'USER' : 'ADMIN'}`}
                          >
                            {isAdmin ? 'Hạ quyền' : 'Thăng Admin'}
                          </button>

                          {/* Ban/Unban Button */}
                          <button
                            type="button"
                            className={`btn-action-pill ${
                              user.enabled ? 'ban-pill' : 'unban-pill'
                            }`}
                            onClick={() => handleToggleBan(user)}
                            title={user.enabled ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                          >
                            {user.enabled ? 'Khóa' : 'Mở khóa'}
                          </button>

                          {/* Delete Button (Only for non-admin) */}
                          {!isAdmin && (
                            <button
                              type="button"
                              className="btn-action-icon delete-icon"
                              onClick={() => handleDeleteUser(user)}
                              title="Xóa vĩnh viễn khỏi SQL"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

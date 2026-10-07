import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  UserX,
  UserCheck,
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

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
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
    }, 3000);
  };

  const handleToggleBan = async (user) => {
    try {
      if (user.enabled) {
        await adminService.banUser(user.id);
        showToast(`Đã khóa tài khoản: ${user.name}`, 'warning');
      } else {
        await adminService.unbanUser(user.id);
        showToast(`Đã mở khóa tài khoản: ${user.name}`, 'success');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: !user.enabled } : u))
      );
    } catch (err) {
      showToast('Thao tác thất bại', 'error');
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmChange = window.confirm(
      `Bạn có chắc muốn chuyển vai trò của ${user.name} sang ${nextRole}?`
    );
    if (!confirmChange) return;

    try {
      await adminService.updateRole(user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      showToast(`Đã đổi quyền ${user.name} thành ${nextRole}`, 'success');
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
      `Xác nhận xóa vĩnh viễn người dùng "${user.name}" khỏi cơ sở dữ liệu?`
    );
    if (!confirmDelete) return;

    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Đã xóa vĩnh viễn ${user.name}`, 'warning');
    } catch (err) {
      showToast('Xóa người dùng thất bại', 'error');
    }
  };

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
    <div className="admin-users-wrap">
      {/* Toast Alert */}
      {actionNotice && (
        <div className={`admin-toast ${actionNotice.type}`}>
          {actionNotice.type === 'success' && <CheckCircle2 size={16} />}
          {actionNotice.type === 'warning' && <AlertTriangle size={16} />}
          {actionNotice.type === 'error' && <ShieldAlert size={16} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-users-top">
        <div>
          <h1 className="admin-page-title">Quản Lý Người Dùng</h1>
          <p className="admin-page-desc">
            Danh sách người dùng và phân quyền vận động viên trong hệ thống (Đồng bộ SQL).
          </p>
        </div>

        <button
          className="btn-refresh-simple"
          onClick={() => fetchUsers(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
          <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} className="search-ico" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc môn thể thao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filters-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="USER">Vận động viên (USER)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BANNED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-err-box">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-indicator">
            <div className="spinner-simple" />
            <span>Đang truy vấn dữ liệu từ SQL...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-no-data">
            <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>HỌ TÊN</th>
                <th>EMAIL</th>
                <th>VAI TRÒ</th>
                <th>MÔN THỂ THAO</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'ADMIN';
                return (
                  <tr key={u.id} className={!u.enabled ? 'row-disabled' : ''}>
                    <td className="col-id">#{u.id}</td>
                    <td className="col-name">{u.name}</td>
                    <td className="col-email">{u.email}</td>
                    <td>
                      {isAdmin ? (
                        <span className="pill-role-admin">
                          <ShieldCheck size={12} /> ADMIN
                        </span>
                      ) : (
                        <span className="pill-role-user">
                          <Flame size={12} /> ATHLETE
                        </span>
                      )}
                    </td>
                    <td>{u.preferredSport || 'Đa môn'}</td>
                    <td>
                      <span className={`pill-status ${u.enabled ? 'active' : 'banned'}`}>
                        {u.enabled ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns-wrap">
                        {/* Toggle Role Button */}
                        <button
                          type="button"
                          className="btn-opt role"
                          onClick={() => handleToggleRole(u)}
                          title={`Chuyển quyền thành ${isAdmin ? 'USER' : 'ADMIN'}`}
                        >
                          {isAdmin ? 'Hạ quyền' : 'Thăng Admin'}
                        </button>

                        {/* Ban/Unban Button */}
                        <button
                          type="button"
                          className={`btn-opt ${u.enabled ? 'ban' : 'unban'}`}
                          onClick={() => handleToggleBan(u)}
                          title={u.enabled ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {u.enabled ? (
                            <>
                              <UserX size={13} />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} />
                              <span>Mở</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button (non-admin only) */}
                        {!isAdmin && (
                          <button
                            type="button"
                            className="btn-opt delete"
                            onClick={() => handleDeleteUser(u)}
                            title="Xóa khỏi cơ sở dữ liệu"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

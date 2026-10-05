import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Không thể tải danh sách người dùng. Bạn có phải là Admin?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (userId, isCurrentlyEnabled) => {
    try {
      if (isCurrentlyEnabled) {
        await adminService.banUser(userId);
      } else {
        await adminService.unbanUser(userId);
      }
      // Refresh user list
      fetchUsers();
    } catch (err) {
      alert('Thao tác thất bại!');
    }
  };

  if (loading) return <div className="admin-loading">Đang tải danh sách người dùng...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-users-container">
      <h2>Quản lý Người Dùng</h2>
      <p>Danh sách toàn bộ vận động viên đăng ký trên hệ thống Second Skin Sport.</p>
      
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Môn thể thao</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.enabled ? 'user-banned' : ''}>
                  <td>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.preferredSport}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge ${user.enabled ? 'active' : 'banned'}`}>
                      {user.enabled ? 'Hoạt động' : 'Bị Khóa'}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'ADMIN' && (
                      <button 
                        className={`action-btn ${user.enabled ? 'btn-ban' : 'btn-unban'}`}
                        onClick={() => handleToggleBan(user.id, user.enabled)}
                      >
                        {user.enabled ? 'Khóa Tài Khoản' : 'Mở Khóa'}
                      </button>
                    )}
                    {user.role === 'ADMIN' && <span className="admin-label">Quản trị viên</span>}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

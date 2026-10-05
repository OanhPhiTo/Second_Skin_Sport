import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredSport, setPreferredSport] = useState('Basketball');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register({ name, email, password, preferredSport });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Tạo Tài Khoản</h2>
        <p className="auth-subtitle">Tham gia Second Skin Sport</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Họ và tên</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Nhập họ và tên"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Nhập email của bạn"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Tạo mật khẩu"
            />
          </div>
          <div className="form-group">
            <label>Môn thể thao yêu thích</label>
            <select value={preferredSport} onChange={(e) => setPreferredSport(e.target.value)}>
              <option value="Basketball">Bóng rổ</option>
              <option value="Football">Bóng đá</option>
              <option value="Running">Chạy bộ</option>
              <option value="Gym">Gym</option>
            </select>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
        
        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}

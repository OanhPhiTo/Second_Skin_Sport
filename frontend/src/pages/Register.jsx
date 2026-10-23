import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';
import logoIcon from '../assets/logo.png';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredSport, setPreferredSport] = useState('Running');
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
        {/* Brand Icon */}
        <div className="auth-card-top-icon">
          <img src={logoIcon} alt="Second Skin Sport Logo" />
        </div>

        <h2 className="auth-title">Tạo Tài Khoản</h2>
        <p className="auth-subtitle">Tham gia Second Skin Sport</p>
        
        {error && (
          <div className="auth-error" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="register-name">Họ và tên</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input 
                id="register-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Nhập họ và tên"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input 
                id="register-email"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Nhập email của bạn"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Mật khẩu</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                id="register-password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Tạo mật khẩu"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-sport">Môn thể thao trọng tâm</label>
            <div className="auth-input-wrapper">
              <Activity size={18} className="auth-input-icon" />
              <select 
                id="register-sport"
                value={preferredSport} 
                onChange={(e) => setPreferredSport(e.target.value)}
              >
                <option value="Running">Chạy bộ (Running)</option>
                <option value="Basketball">Bóng rổ (Basketball)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-security-badge">
          <ShieldCheck size={14} />
          <span>Bảo mật kết nối IoT & Dữ liệu sinh trắc học AES-256</span>
        </div>
        
        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}

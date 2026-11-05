import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';
import logoIcon from '../assets/logo.png';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError('Email không đúng định dạng. Ví dụ: user@example.com');
      return;
    }

    if (!password) {
      setError('Vui lòng tạo mật khẩu.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      setError('Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({ name: trimmedName, email: trimmedEmail, password });
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      const status = err.response?.status;

      if (status === 400 || status === 409) {
        if (serverMsg) {
          setError(serverMsg);
        } else {
          setError('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
        }
      } else if (!err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      } else {
        setError(serverMsg || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      }
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
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }} 
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }} 
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }} 
                required 
                placeholder="Tạo mật khẩu (tối thiểu 8 ký tự, có chữ và số)"
                autoComplete="new-password"
              />
            </div>
            <span className="auth-field-hint">Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số</span>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
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
          <div style={{ marginTop: '14px' }}>
            <Link to="/home" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none' }}>
              ← Quay lại trang chủ giới thiệu sản phẩm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

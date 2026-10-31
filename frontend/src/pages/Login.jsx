import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { authService } from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import logoSloganImg from '../assets/logo-slogan.png';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      if (data?.role === 'ADMIN' || (typeof authService.isAdmin === 'function' && authService.isAdmin())) {
        navigate('/admin');
      } else if (data?.role === 'COACH' || (typeof authService.isCoach === 'function' && authService.isCoach())) {
        navigate('/coach');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword, role) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setSelectedRole(role);
    setError('');
    setSuccessMessage('');
  };

  const handleResetPasswordSuccess = (updatedEmail) => {
    setEmail(updatedEmail);
    setPassword('');
    setSuccessMessage('Đổi mật khẩu thành công! Vui lòng nhập mật khẩu mới để đăng nhập.');
    setError('');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">
        
        {/* =================================================================
            LEFT PANEL: OFFICIAL BRAND LOGO (INTEGRATED SLOGAN INCLUDED)
            ================================================================= */}
        <section className="auth-showcase-panel">
          <div className="auth-brand-showcase-wrap">
            <img 
              src={logoSloganImg} 
              alt="Second Skin Sport - Theo dõi chuyển động, Nâng tầm hiệu suất" 
              className="auth-brand-large-logo" 
            />
          </div>
        </section>

        {/* =================================================================
            RIGHT PANEL: LOGIN FORM CARD
            ================================================================= */}
        <section className="auth-form-panel">
          <div className="auth-card">
            
            <h2 className="auth-title">Chào mừng trở lại</h2>
            <p className="auth-subtitle">Đăng nhập vào Second Skin Sport</p>
            
            {error && (
              <div className="auth-error" role="alert">
                <span className="auth-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-info-banner" style={{ borderColor: 'rgba(0, 255, 135, 0.4)', color: '#6ee7b7', backgroundColor: 'rgba(0, 255, 135, 0.1)' }} role="status">
                <CheckCircle2 size={16} color="#00ff87" />
                <span>{successMessage}</span>
              </div>
            )}
            
            {/* Quick Demo Credentials (Clean & No Icons) */}
            <div className="auth-demo-switcher">
              <div className="auth-demo-buttons">
                <button
                  type="button"
                  className={`auth-demo-chip admin ${selectedRole === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => handleQuickLogin('admin@secondskin.com', 'admin123', 'ADMIN')}
                >
                  <span className="auth-demo-chip-title">Vai trò: QUẢN TRỊ VIÊN</span>
                </button>

                <button
                  type="button"
                  className={`auth-demo-chip coach ${selectedRole === 'COACH' ? 'active' : ''}`}
                  onClick={() => handleQuickLogin('mike.coach@secondskin.io', 'password', 'COACH')}
                >
                  <span className="auth-demo-chip-title">Vai trò: HUẤN LUYỆN VIÊN</span>
                </button>

                <button
                  type="button"
                  className={`auth-demo-chip athlete ${selectedRole === 'ATHLETE' ? 'active' : ''}`}
                  onClick={() => handleQuickLogin('alex.athlete@secondskin.io', 'password', 'ATHLETE')}
                >
                  <span className="auth-demo-chip-title">Vai trò: VẬN ĐỘNG VIÊN</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input 
                    id="login-email"
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
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="auth-options-row">
                <label className="auth-remember-checkbox">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ</span>
                </label>
                <button 
                  type="button"
                  className="auth-forgot-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                  onClick={() => {
                    setError('');
                    setSuccessMessage('');
                    setIsForgotModalOpen(true);
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Action */}
              <button 
                type="submit" 
                className="auth-button" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="auth-spinner" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight size={18} className="auth-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </div>

          </div>
        </section>

      </div>

      {/* Forgot Password Modal (OAuth2 Email OTP Verification & Reset) */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccess={handleResetPasswordSuccess}
      />
    </div>
  );
}

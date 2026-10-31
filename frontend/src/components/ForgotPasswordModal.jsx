import React, { useState, useEffect } from 'react';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../services/api';

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  // Countdown timers
  const [cooldown, setCooldown] = useState(0);
  const [otpTimeLeft, setOtpTimeLeft] = useState(300);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setInfo('');
      setDebugOtp('');
      setCooldown(0);
      setOtpTimeLeft(300);
    }
  }, [isOpen]);

  // Handle countdowns
  useEffect(() => {
    let timer;
    if (step === 2 && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  useEffect(() => {
    let timer;
    if (step === 2 && otpTimeLeft > 0) {
      timer = setInterval(() => {
        setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimeLeft]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setInfo(res?.message || 'Mã xác thực OTP đã được gửi đến email của bạn.');
      if (res?.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      setStep(2);
      setCooldown(60);
      setOtpTimeLeft(300);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể gửi mã xác thực. Vui lòng kiểm tra lại địa chỉ email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!otp || otp.trim().length < 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số.');
      return;
    }

    if (otpTimeLeft <= 0) {
      setError('Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(email.trim(), otp.trim());
      setInfo(res?.message || 'Xác thực OTP thành công!');
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Mã OTP không chính xác hoặc đã hết hạn.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setInfo(res?.message || 'Đổi mật khẩu thành công!');
      setStep(4);

      // Auto close and fill email into login form after 2.5s
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess(email.trim());
        }
        onClose();
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Đóng popup"
        >
          <X size={20} />
        </button>

        {/* Progress Bar / Steps Indicator */}
        <div className="auth-modal-steps">
          <div className={`auth-step-pill ${step >= 1 ? 'active' : ''}`}>1. Email</div>
          <div className="auth-step-divider"></div>
          <div className={`auth-step-pill ${step >= 2 ? 'active' : ''}`}>2. Nhập OTP</div>
          <div className="auth-step-divider"></div>
          <div className={`auth-step-pill ${step >= 3 ? 'active' : ''}`}>3. Đổi mật khẩu</div>
        </div>

        {/* =================================================================
            STEP 1: ENTER REGISTERED EMAIL
            ================================================================= */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-modal-form">
            <div className="auth-modal-header">
              <div className="auth-modal-icon-badge">
                <Mail size={24} />
              </div>
              <h3 className="auth-modal-title">Quên mật khẩu?</h3>
              <p className="auth-modal-desc">
                Nhập địa chỉ email tài khoản của bạn. Chúng tôi sẽ gửi mã xác thực OTP bảo mật để cấp lại mật khẩu.
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} className="auth-error-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="forgot-email" className="auth-modal-label">Email tài khoản</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="nhap.email@secondskin.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-button modal-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục & Gửi mã OTP</span>
                  <ArrowRight size={18} className="auth-btn-arrow" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =================================================================
            STEP 2: ENTER OTP CODE
            ================================================================= */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-modal-form">
            <div className="auth-modal-header">
              <div className="auth-modal-icon-badge otp">
                <KeyRound size={24} />
              </div>
              <h3 className="auth-modal-title">Nhập mã xác thực OTP</h3>
              <p className="auth-modal-desc">
                Mã xác thực 6 chữ số đã được gửi đến hộp thư <strong style={{ color: '#00f2fe' }}>{email}</strong>.
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} className="auth-error-icon" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div className="auth-info-banner">
                <ShieldCheck size={16} />
                <span>{info}</span>
              </div>
            )}

            {debugOtp && (
              <div className="auth-debug-otp-hint">
                <span>💡 Mã OTP thử nghiệm nhanh: <strong>{debugOtp}</strong></span>
              </div>
            )}

            <div className="form-group">
              <div className="auth-otp-field-header">
                <label htmlFor="otp-input" className="auth-modal-label">Mã OTP (6 chữ số)</label>
                <span className={`auth-otp-timer ${otpTimeLeft < 60 ? 'urgent' : ''}`}>
                  Hiệu lực: {formatTime(otpTimeLeft)}
                </span>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  className="auth-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-otp-resend-row">
              <button
                type="button"
                className="auth-resend-btn"
                disabled={cooldown > 0 || loading}
                onClick={handleSendOtp}
              >
                <RefreshCw size={14} className={loading ? 'auth-spinner' : ''} />
                <span>
                  {cooldown > 0 ? `Gửi lại mã sau (${cooldown}s)` : 'Gửi lại mã OTP'}
                </span>
              </button>

              <button
                type="button"
                className="auth-change-email-btn"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
              >
                Đổi email khác
              </button>
            </div>

            <button
              type="submit"
              className="auth-button modal-submit"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Xác thực OTP</span>
                  <ArrowRight size={18} className="auth-btn-arrow" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =================================================================
            STEP 3: RESET PASSWORD
            ================================================================= */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-modal-form">
            <div className="auth-modal-header">
              <div className="auth-modal-icon-badge security">
                <Lock size={24} />
              </div>
              <h3 className="auth-modal-title">Đặt lại mật khẩu mới</h3>
              <p className="auth-modal-desc">
                Nhập mật khẩu mới cho tài khoản <strong style={{ color: '#00f2fe' }}>{email}</strong>.
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} className="auth-error-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="new-password" className="auth-modal-label">Mật khẩu mới</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                    className="auth-password-input"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="auth-modal-label">Xác nhận mật khẩu mới</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-password-input"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-button modal-submit"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đổi mật khẩu</span>
                  <CheckCircle2 size={18} className="auth-btn-arrow" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =================================================================
            STEP 4: SUCCESS
            ================================================================= */}
        {step === 4 && (
          <div className="auth-modal-success">
            <div className="auth-success-badge-large">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="auth-modal-title success">Đổi mật khẩu thành công!</h3>
            <p className="auth-modal-desc">
              Mật khẩu mới của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay bây giờ.
            </p>
            <button
              type="button"
              className="auth-button modal-submit"
              onClick={() => {
                if (typeof onSuccess === 'function') {
                  onSuccess(email.trim());
                }
                onClose();
              }}
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight size={18} className="auth-btn-arrow" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


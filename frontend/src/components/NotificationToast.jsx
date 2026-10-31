import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Dumbbell,
  Activity,
  Flame,
  CheckCircle2,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './NotificationToast.css';

export default function NotificationToast() {
  const { toasts, dismissToast, markAsRead } = useNotification();
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  const handleToastClick = (toast) => {
    markAsRead(toast.id);
    dismissToast(toast.id);
    if (toast.sessionId) {
      navigate(`/activities?session=${toast.sessionId}`);
    }
  };

  const getToastIcon = (toast) => {
    if (toast.sport === 'Basketball') {
      return <Flame size={20} className="toast-icon-flame" />;
    }
    if (toast.sport === 'Running') {
      return <Zap size={20} className="toast-icon-zap" />;
    }
    if (toast.type === 'SESSION_COMPLETED') {
      return <Trophy size={20} className="toast-icon-trophy" />;
    }
    return <Activity size={20} className="toast-icon-activity" />;
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-card"
          onClick={() => handleToastClick(toast)}
          role="alert"
        >
          <div className="toast-icon-badge">{getToastIcon(toast)}</div>

          <div className="toast-content">
            <div className="toast-header">
              <span className="toast-tag">
                {toast.type === 'SESSION_COMPLETED' ? 'KẾT THÚC BUỔI TẬP' : 'HỆ THỐNG'}
              </span>
              <button
                type="button"
                className="toast-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>

            <h4 className="toast-title">{toast.title}</h4>
            <p className="toast-desc">{toast.message}</p>

            {/* Quick Metrics Badges if Session */}
            {toast.performanceScore !== null && toast.performanceScore !== undefined && (
              <div className="toast-metrics-row">
                <span className="toast-metric-pill score">
                  Điểm: <strong>{toast.performanceScore}/100</strong>
                </span>
                {toast.durationMinutes && (
                  <span className="toast-metric-pill duration">
                    Thời lượng: <strong>{toast.durationMinutes}p</strong>
                  </span>
                )}
                {toast.totalJumps > 0 && (
                  <span className="toast-metric-pill jumps">
                    Nhảy: <strong>{toast.totalJumps}</strong>
                  </span>
                )}
              </div>
            )}

            {toast.sessionId && (
              <div className="toast-action-hint">
                <span>Nhấn để xem phân tích AI chi tiết</span>
                <ArrowRight size={13} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


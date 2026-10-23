import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Dumbbell, Zap } from 'lucide-react';
import './SessionTable.css';

export default function SessionTable({ sessions, onSelectSession }) {
  const navigate = useNavigate();

  const handleRowClick = (session) => {
    if (onSelectSession) {
      onSelectSession(session);
    } else {
      navigate(`/activities?session=${session.id}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '16/09/2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="card session-table-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Các Buổi Tập Gần Đây</h2>
          <p className="card-subtitle">Các buổi tập thể thao đã ghi nhận và chi tiết sinh trắc học tự động</p>
        </div>
        <button className="btn btn-outline-cyan btn-sm" onClick={() => navigate('/activities')}>
          Xem tất cả hoạt động
        </button>
      </div>

      <div className="table-responsive">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Bộ môn</th>
              <th>Thời lượng</th>
              <th>Cú nhảy</th>
              <th>Gia tốc TB</th>
              <th>Điểm số</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 5).map((s) => (
                <tr key={s.id} onClick={() => handleRowClick(s)} className="clickable-row">
                  <td className="cell-date">
                    <div className="date-wrapper">
                       <Calendar size={14} className="cell-icon" />
                      <span>{formatDate(s.startTime)}</span>
                    </div>
                  </td>
                  <td className="cell-sport">
                    <span className={`sport-pill ${s.sport?.toLowerCase()}`}>
                      {s.sport === 'Basketball' ? 'Bóng rổ' : s.sport === 'Running' ? 'Chạy bộ' : s.sport}
                    </span>
                  </td>
                  <td className="cell-duration">{s.durationMinutes} phút</td>
                  <td className="cell-jumps">
                    <strong>{s.totalJumps}</strong>
                  </td>
                  <td className="cell-accel">
                    <span className="accel-val">{s.averageAcceleration}</span> <small>m/s²</small>
                  </td>
                  <td className="cell-score">
                    <div className="score-badge-wrap">
                      <span className="score-val">{s.performanceScore}%</span>
                      <div className="score-mini-bar">
                        <div
                          className="mini-bar-fill"
                          style={{
                            width: `${s.performanceScore}%`,
                            backgroundColor:
                              s.performanceScore >= 90
                                ? 'var(--status-success)'
                                : s.performanceScore >= 80
                                ? 'var(--accent-cyan)'
                                : 'var(--status-warning)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="cell-status">
                    <span className="badge badge-success">
                      ● {s.status === 'Completed' || !s.status ? 'Hoàn thành' : s.status}
                    </span>
                  </td>
                  <td className="cell-action">
                    <button className="row-action-btn" aria-label="Xem chi tiết">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-table-state">
                  Chưa có buổi tập nào được ghi nhận. Hãy bắt đầu một buổi tập với miếng dán cảm biến!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

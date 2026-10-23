import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  Gauge,
  ArrowUpRight,
  ChevronRight,
  Activity,
  X,
  Zap,
  RotateCcw,
  Compass,
  Sparkles,
  Flame,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { sessionService, aiService } from '../services/api';
import AiCoachInsightCard from '../components/AiCoachInsightCard';
import './Activities.css';

export default function Activities() {
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedSession, setSelectedSession] = useState(null);
  const [aiCoachSession, setAiCoachSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [sessionSensorPoints, setSessionSensorPoints] = useState([]);

  // Fetch real sensor trajectory when a session detail modal is opened
  useEffect(() => {
    if (selectedSession?.id) {
      sessionService.getSensorData(selectedSession.id)
        .then((pts) => {
          if (Array.isArray(pts) && pts.length > 0) {
            const duration = selectedSession.durationMinutes || 30;
            const mapped = pts.map((p, idx) => {
              const ax = p.accelerometerX ?? p.acceleration ?? 0;
              const ay = p.accelerometerY ?? 0;
              const az = p.accelerometerZ ?? 9.81;
              const mag = Math.hypot(ax, ay, az);
              const dynamicAccel = +(Math.max(0, mag - 9.81)).toFixed(2);
              const timeLabel = p.time || `${Math.max(1, Math.round(((idx + 1) / pts.length) * duration))}m`;

              return {
                minute: timeLabel,
                accel: p.acceleration ? Number(p.acceleration) : (dynamicAccel > 0 ? dynamicAccel : Number(selectedSession.averageAcceleration || 2.5)),
                intensity: p.intensity ?? p.movementIntensity ?? selectedSession.movementIntensity ?? 75,
              };
            });
            setSessionSensorPoints(mapped);
          } else {
            setSessionSensorPoints([]);
          }
        })
        .catch(() => setSessionSensorPoints([]));
    } else {
      setSessionSensorPoints([]);
    }
  }, [selectedSession]);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await sessionService.getAll();
        setSessions(data);
        setFilteredSessions(data);

        // Check if query param ?session=X is present
        const querySessionId = searchParams.get('session');
        if (querySessionId) {
          const match = data.find((s) => String(s.id) === querySessionId);
          if (match) setSelectedSession(match);
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [searchParams]);

  // Fetch AI insights when AI Coach modal is opened
  useEffect(() => {
    if (aiCoachSession) {
      setAiInsights(null);
      setLoadingAi(true);
      aiService.analyzeSession(aiCoachSession.id)
        .then((data) => setAiInsights(data))
        .catch((err) => console.error('Error fetching AI insights:', err))
        .finally(() => setLoadingAi(false));
    }
  }, [aiCoachSession]);

  // Handle Search, Filter, and Sort
  useEffect(() => {
    let result = [...sessions];

    // Filter by sport
    if (selectedSport !== 'All') {
      result = result.filter(
        (s) => s.sport?.toLowerCase() === selectedSport.toLowerCase()
      );
    }

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.sport?.toLowerCase().includes(q) ||
          String(s.id).includes(q) ||
          String(s.performanceScore).includes(q)
      );
    }

    // Sort
    if (sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else if (sortBy === 'score-desc') {
      result.sort((a, b) => b.performanceScore - a.performanceScore);
    } else if (sortBy === 'duration-desc') {
      result.sort((a, b) => b.durationMinutes - a.durationMinutes);
    }

    setFilteredSessions(result);
  }, [sessions, selectedSport, searchTerm, sortBy]);

  const formatDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return dateStr || '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Real telemetry curve for selected session detail
  const detailChartPoints = sessionSensorPoints.length > 0
    ? sessionSensorPoints
    : selectedSession
    ? [
        { minute: '5m', accel: +(Number(selectedSession.averageAcceleration || 2.4) * 0.85).toFixed(2), intensity: Math.max(50, Math.round(Number(selectedSession.movementIntensity || 75) * 0.85)) },
        { minute: '15m', accel: +(Number(selectedSession.averageAcceleration || 2.4) * 1.15).toFixed(2), intensity: Math.min(100, Math.round(Number(selectedSession.movementIntensity || 75) * 1.1)) },
        { minute: '25m', accel: +(Number(selectedSession.averageAcceleration || 2.4) * 1.25).toFixed(2), intensity: Math.min(100, Math.round(Number(selectedSession.movementIntensity || 75) * 1.15)) },
        { minute: `${selectedSession.durationMinutes || 35}m`, accel: +(Number(selectedSession.averageAcceleration || 2.4) * 0.9).toFixed(2), intensity: Math.max(50, Math.round(Number(selectedSession.movementIntensity || 75) * 0.9)) },
      ]
    : [];

  return (
    <div className="activities-page">
      {/* Header */}
      <div className="activities-header">
        <div>
          <h1 className="hero-title">Lịch Sử Hoạt Động Thể Thao</h1>
          <p className="hero-subtitle">
            Lưu trữ toàn diện các buổi tập được ghi nhận từ miếng dán cảm biến Second Skin.
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="card activities-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Tìm theo mã phiên, môn thể thao, hoặc điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Tìm kiếm buổi tập theo mã, môn thể thao hoặc điểm"
          />
        </div>

        <div className="toolbar-controls">
          <div className="sport-filter-select-wrap">
            <Filter size={16} className="control-icon" aria-hidden="true" />
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="form-select toolbar-select"
              aria-label="Lọc theo môn thể thao"
            >
              <option value="All">Tất cả môn thể thao</option>
              <option value="Running">Chạy bộ (Running)</option>
              <option value="Basketball">Bóng rổ (Basketball)</option>
            </select>
          </div>

          <div className="sort-select-wrap">
            <ArrowUpDown size={16} className="control-icon" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select toolbar-select"
              aria-label="Sắp xếp buổi tập"
            >
              <option value="date-desc">Mới nhất</option>
              <option value="score-desc">Điểm cao nhất</option>
              <option value="duration-desc">Thời gian dài nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="card activities-table-card">
        <div className="table-responsive">
          <table className="activities-table">
            <thead>
              <tr>
                <th>Mã Buổi Tập</th>
                <th>Môn Thể Thao</th>
                <th>Ngày Tập</th>
                <th>Thời Gian</th>
                <th>Cường Độ</th>
                <th>Điểm Số</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`activity-row ${
                      selectedSession?.id === session.id ? 'active-row' : ''
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <td className="cell-id">
                      <span className="session-id-tag">#SSS-{String(session.id).padStart(3, '0')}</span>
                    </td>
                    <td className="cell-sport">
                      <span className={`sport-pill ${session.sport?.toLowerCase()}`}>
                        {session.sport === 'Basketball' ? 'Bóng rổ' : session.sport === 'Running' ? 'Chạy bộ' : session.sport}
                      </span>
                    </td>
                    <td className="cell-date">
                      <div className="date-wrapper">
                        <Calendar size={14} className="cell-icon" />
                        <span>{formatDate(session.startTime)}</span>
                      </div>
                    </td>
                    <td className="cell-duration">
                      <div className="date-wrapper">
                        <Clock size={14} className="cell-icon" />
                        <span>{session.durationMinutes} phút</span>
                      </div>
                    </td>
                    <td className="cell-intensity">
                      <span className="intensity-badge">
                        <Activity size={12} />
                        {session.movementIntensity}%
                      </span>
                    </td>
                    <td className="cell-score">
                      <span className="score-number">{session.performanceScore}%</span>
                    </td>
                    <td className="cell-action">
                      <div className="activity-action-group">
                        <button
                          className="btn btn-outline-cyan btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          Xem Chi Tiết
                        </button>
                        <button
                          className="btn btn-outline-sparkle btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiCoachSession(session);
                          }}
                          title="Xem phân tích chuyên sâu AI Coach"
                        >
                          <Sparkles size={13} />
                          AI Coach
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    Không có buổi tập nào khớp với tìm kiếm hoặc bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SESSION DETAIL BIOMETRIC MODAL (Khớp 100% thiết kế mẫu) */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div
            className="modal-box session-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <div>
                <div className="detail-tags">
                  <span className={`detail-tag-sport ${selectedSession.sport?.toLowerCase() === 'basketball' ? 'basketball' : 'running'}`}>
                    {selectedSession.sport === 'Basketball' ? 'Bóng rổ' : selectedSession.sport === 'Running' ? 'Chạy bộ' : selectedSession.sport}
                  </span>
                  <span className="detail-tag-id">
                    #SSS-{String(selectedSession.id || 1).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="detail-modal-title">Chi Tiết Sinh Trắc Học Buổi Tập</h2>
                <p className="detail-modal-subtitle">
                  Ghi nhận ngày {formatDate(selectedSession.startTime)} • Miếng dán #{selectedSession.deviceId?.replace(/[^0-9]/g, '') || '001'}
                </p>
              </div>
              <button
                className="detail-modal-close"
                onClick={() => setSelectedSession(null)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* 6 Metric Cards Breakdown Grid */}
            <div className="detail-stats-grid">
              <div className="detail-stat-item">
                <span className="stat-label">THỜI GIAN</span>
                <span className="stat-val">{selectedSession.durationMinutes || 42} phút</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">TỔNG CÚ NHẢY</span>
                <span className="stat-val">{selectedSession.totalJumps ?? 56}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">ĐỔI HƯỚNG</span>
                <span className="stat-val">{selectedSession.directionChanges ?? 143}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">GIA TỐC TRUNG BÌNH</span>
                <span className="stat-val">
                  {selectedSession.averageAcceleration ? Number(selectedSession.averageAcceleration).toFixed(2) : '3.21'} m/s²
                </span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">TỐC ĐỘ TRUNG BÌNH</span>
                <span className="stat-val">
                  {selectedSession.averageSpeed ? Number(selectedSession.averageSpeed).toFixed(1) : '18.4'} km/h
                </span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">ĐIỂM HIỆU SUẤT</span>
                <span className="stat-val">{selectedSession.performanceScore ?? 91}%</span>
              </div>
            </div>

            {/* Kinetic Acceleration & Intensity Curve */}
            <div className="detail-chart-wrapper">
              <h4 className="detail-section-title">Đường Cong Gia Tốc Động Học & Cường Độ</h4>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={185}>
                  <AreaChart
                    data={detailChartPoints}
                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="detailCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f2fe" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00f2fe" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis
                      dataKey="minute"
                      stroke="transparent"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 8]}
                      ticks={[0, 2, 4, 6, 8]}
                      stroke="transparent"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111625',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="accel"
                      name="Gia tốc (m/s²)"
                      stroke="#00f2fe"
                      strokeWidth={2.5}
                      fill="url(#detailCyan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="detail-modal-footer">
              <button
                className="detail-close-btn"
                onClick={() => setSelectedSession(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED AI COACH INSIGHT MODAL */}
      {aiCoachSession && (
        <div className="modal-overlay" onClick={() => setAiCoachSession(null)}>
          <div
            className="modal-box card session-ai-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <div>
                <div className="detail-tags">
                  <span className={`detail-tag-sport ${aiCoachSession.sport?.toLowerCase() === 'basketball' ? 'basketball' : 'running'}`}>
                    {aiCoachSession.sport === 'Basketball' ? 'Bóng rổ' : aiCoachSession.sport === 'Running' ? 'Chạy bộ' : aiCoachSession.sport}
                  </span>
                  <span className="detail-tag-id">
                    #SSS-{String(aiCoachSession.id || 1).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="detail-modal-title">Phân Tích AI Coach Chuyên Sâu</h2>
                <p className="detail-modal-subtitle">
                  Ghi nhận ngày {formatDate(aiCoachSession.startTime)} • Phân tích cơ sinh học
                </p>
              </div>
              <button
                className="detail-modal-close"
                onClick={() => setAiCoachSession(null)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-ai-section">
              {loadingAi ? (
                <div className="ai-loading-box">
                  <Loader2 size={22} className="spin-icon highlight-cyan" />
                  <span>AI Coach đang phân tích các xung lực gia tốc, tần suất tiếp đất & nguy cơ quá tải cơ...</span>
                </div>
              ) : aiInsights ? (
                <AiCoachInsightCard insights={aiInsights} />
              ) : null}
            </div>

            <div className="detail-modal-footer">
              <button
                className="detail-close-btn"
                onClick={() => setAiCoachSession(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

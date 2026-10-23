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
    if (!dateStr) return '16/09/2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Mock telemetry curve for selected session detail
  const detailChartPoints = [
    { minute: '5m', accel: 2.1, intensity: 65 },
    { minute: '10m', accel: 2.9, intensity: 78 },
    { minute: '15m', accel: 3.8, intensity: 92 },
    { minute: '20m', accel: 3.2, intensity: 84 },
    { minute: '25m', accel: 4.1, intensity: 95 },
    { minute: '30m', accel: 3.4, intensity: 86 },
    { minute: '35m', accel: 2.8, intensity: 75 },
    { minute: '40m', accel: 1.9, intensity: 60 },
  ];

  return (
    <div className="activities-page">
      {/* Header */}
      <div className="activities-header">
        <div>
          <h1 className="hero-title">Sport Activities</h1>
          <p className="hero-subtitle">
            Comprehensive archive of workouts captured with the Second Skin sensor patch.
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="card activities-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by session ID, sport, or score..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search workouts by session ID, sport, or score"
          />
        </div>

        <div className="toolbar-controls">
          <div className="sport-filter-select-wrap">
            <Filter size={16} className="control-icon" aria-hidden="true" />
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="form-select toolbar-select"
              aria-label="Filter by sport"
            >
              <option value="All">All Sports (Tất cả)</option>
              <option value="Running">Running (Chạy bộ)</option>
              <option value="Basketball">Basketball (Bóng rổ)</option>
            </select>
          </div>

          <div className="sort-select-wrap">
            <ArrowUpDown size={16} className="control-icon" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select toolbar-select"
              aria-label="Sort workouts"
            >
              <option value="date-desc">Newest Date</option>
              <option value="score-desc">Highest Score</option>
              <option value="duration-desc">Longest Duration</option>
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
                <th>Session ID</th>
                <th>Sport</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Intensity</th>
                <th>Score</th>
                <th>Action</th>
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
                        {session.sport}
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
                        <span>{session.durationMinutes} min</span>
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
                          View Detail
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
                    No sessions match the current search or filters.
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
                    {selectedSession.sport || 'Basketball'}
                  </span>
                  <span className="detail-tag-id">
                    #SSS-{String(selectedSession.id || 1).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="detail-modal-title">Session Biometric Detail</h2>
                <p className="detail-modal-subtitle">
                  Recorded on {formatDate(selectedSession.startTime)} • Patch #{selectedSession.deviceId?.replace(/[^0-9]/g, '') || '001'}
                </p>
              </div>
              <button
                className="detail-modal-close"
                onClick={() => setSelectedSession(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* 6 Metric Cards Breakdown Grid */}
            <div className="detail-stats-grid">
              <div className="detail-stat-item">
                <span className="stat-label">DURATION</span>
                <span className="stat-val">{selectedSession.durationMinutes || 42} min</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">TOTAL JUMPS</span>
                <span className="stat-val">{selectedSession.totalJumps ?? 56}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">DIRECTION CHANGES</span>
                <span className="stat-val">{selectedSession.directionChanges ?? 143}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">AVG ACCELERATION</span>
                <span className="stat-val">
                  {selectedSession.averageAcceleration ? Number(selectedSession.averageAcceleration).toFixed(2) : '3.21'} m/s²
                </span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">AVERAGE SPEED</span>
                <span className="stat-val">
                  {selectedSession.averageSpeed ? Number(selectedSession.averageSpeed).toFixed(1) : '18.4'} km/h
                </span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">PERFORMANCE SCORE</span>
                <span className="stat-val">{selectedSession.performanceScore ?? 91}%</span>
              </div>
            </div>

            {/* Kinetic Acceleration & Intensity Curve */}
            <div className="detail-chart-wrapper">
              <h4 className="detail-section-title">Kinetic Acceleration & Intensity Curve</h4>
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
                      name="Acceleration (m/s²)"
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
                Close
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
                    {aiCoachSession.sport || 'Basketball'}
                  </span>
                  <span className="detail-tag-id">
                    #SSS-{String(aiCoachSession.id || 1).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="detail-modal-title">Phân Tích AI Coach Chuyên Sâu</h2>
                <p className="detail-modal-subtitle">
                  Recorded on {formatDate(aiCoachSession.startTime)} • Biomechanics Insights
                </p>
              </div>
              <button
                className="detail-modal-close"
                onClick={() => setAiCoachSession(null)}
                aria-label="Close"
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

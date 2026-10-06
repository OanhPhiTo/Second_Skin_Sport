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
import './Activities.css';

export default function Activities() {
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedSession, setSelectedSession] = useState(null);
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

  // Fetch AI insights when a session modal is opened
  useEffect(() => {
    if (selectedSession) {
      setAiInsights(null);
      setLoadingAi(true);
      aiService.analyzeSession(selectedSession.id)
        .then((data) => setAiInsights(data))
        .catch((err) => console.error('Error fetching AI insights:', err))
        .finally(() => setLoadingAi(false));
    }
  }, [selectedSession]);

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
              <option value="All">All Sports</option>
              <option value="Basketball">Basketball</option>
              <option value="Running">Running</option>
              <option value="Football">Football</option>
              <option value="Gym">Gym</option>
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
                      <button
                        className="btn btn-outline-cyan btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                      >
                        View Detail
                      </button>
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

      {/* SESSION DETAIL MODAL / DRAWER */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div
            className="modal-box card session-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <div>
                <div className="detail-tags">
                  <span className={`sport-pill ${selectedSession.sport?.toLowerCase()}`}>
                    {selectedSession.sport}
                  </span>
                  <span className="session-id-tag">
                    #SSS-{String(selectedSession.id).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="detail-modal-title">Session Biometric Detail</h2>
                <p className="card-subtitle">
                  Recorded on {formatDate(selectedSession.startTime)} • Patch #001
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedSession(null)}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="detail-stats-grid">
              <div className="detail-stat-item">
                <span className="stat-label">Duration</span>
                <span className="stat-val">{selectedSession.durationMinutes} min</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">Total Jumps</span>
                <span className="stat-val highlight-cyan">{selectedSession.totalJumps}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">Direction Changes</span>
                <span className="stat-val">{selectedSession.directionChanges}</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">Avg Acceleration</span>
                <span className="stat-val">{selectedSession.averageAcceleration} m/s²</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">Average Speed</span>
                <span className="stat-val">{selectedSession.averageSpeed || 18.4} km/h</span>
              </div>
              <div className="detail-stat-item">
                <span className="stat-label">Performance Score</span>
                <span className="stat-val highlight-neon">{selectedSession.performanceScore}%</span>
              </div>
            </div>

            {/* Telemetry Acceleration & Exertion curve */}
            <div className="detail-chart-wrapper">
              <h4 className="detail-section-title">Kinetic Acceleration & Intensity Curve</h4>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={detailChartPoints}>
                    <defs>
                      <linearGradient id="detailCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="minute" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip />
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

            {/* AI COACH & INJURY RISK ASSESSMENT */}
            <div className="detail-ai-section">
              <div className="ai-section-header">
                <div className="ai-badge-icon">
                  <Sparkles size={20} className="highlight-cyan" />
                </div>
                <div>
                  <h4 className="ai-section-title">Phân Tích AI Coach & Cảnh Báo Chấn Thương</h4>
                  <p className="ai-section-subtitle">Tích hợp Google Gemini AI & Khoa Học Chuyển Động Thể Thao</p>
                </div>
              </div>

              {loadingAi ? (
                <div className="ai-loading-box">
                  <Loader2 size={22} className="spin-icon highlight-cyan" />
                  <span>AI đang phân tích các xung lực gia tốc, tần suất tiếp đất & nguy cơ quá tải cơ...</span>
                </div>
              ) : aiInsights ? (
                <div className="ai-results-wrapper">
                  <div className="ai-summary-card">
                    <p className="ai-summary-text">{aiInsights.aiSummary}</p>
                  </div>

                  <div className="ai-cards-grid">
                    <div className={`ai-mini-card injury-card ${aiInsights.injuryRiskLevel?.toLowerCase()}`}>
                      <div className="ai-mini-card-header">
                        <span className="mini-card-label">RỦI RO CHẤN THƯƠNG</span>
                        <span className={`risk-pill ${aiInsights.injuryRiskLevel?.toLowerCase()}`}>
                          {aiInsights.injuryRiskLevel === 'HIGH' ? 'CAO ⚠️' : aiInsights.injuryRiskLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'AN TOÀN ✓'}
                        </span>
                      </div>
                      <p className="risk-explanation">{aiInsights.injuryRiskExplanation}</p>
                    </div>

                    <div className="ai-mini-card calories-card">
                      <div className="ai-mini-card-header">
                        <span className="mini-card-label">TIÊU HAO NĂNG LƯỢNG</span>
                        <Flame size={16} className="highlight-orange" />
                      </div>
                      <div className="calories-val">
                        <span className="calories-num">{aiInsights.estimatedCalories || 420}</span>
                        <span className="calories-unit">kcal</span>
                      </div>
                    </div>
                  </div>

                  <div className="ai-advice-columns">
                    {aiInsights.postureFeedback && aiInsights.postureFeedback.length > 0 && (
                      <div className="advice-col">
                        <h5 className="advice-col-title">🎯 Kỹ Thuật & Tư Thế Tiếp Đất:</h5>
                        <ul>
                          {aiInsights.postureFeedback.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiInsights.recoveryAdvice && aiInsights.recoveryAdvice.length > 0 && (
                      <div className="advice-col">
                        <h5 className="advice-col-title">💊 Lời Khuyên Phục Hồi Thể Lực:</h5>
                        <ul>
                          {aiInsights.recoveryAdvice.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="detail-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSession(null)}
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

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Calendar,
  Clock,
  Gauge,
  ArrowUpRight,
  Compass,
  Award,
  AlertCircle,
  AlertTriangle,
  Bluetooth,
  BluetoothConnected,
  CheckCircle2,
  RefreshCw,
  X,
  Play,
  Activity,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import PerformanceChart from '../components/PerformanceChart';
import ActivityCard from '../components/ActivityCard';
import SessionTable from '../components/SessionTable';
import {
  sessionService,
  statisticsService,
  deviceService,
} from '../services/api';
import { useBle } from '../context/BleContext';
import { useUnit } from '../context/UnitContext';
import './Dashboard.css';

export default function Dashboard() {
  const { bleStatus, bleDevice, connectBle, sensorStatus: liveBleSensorStatus, autoSession, finalizeAutoSession, startTrackingSession } = useBle();
  const { unitLabels, convertAccel } = useUnit();
  const isDeviceConnected = bleStatus === 'connected';
  const [connectingBle, setConnectingBle] = useState(false);
  const [overview, setOverview] = useState(null);
  const [activityAnalysis, setActivityAnalysis] = useState(null);
  const [sensorStatus, setSensorStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Session Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSport, setNewSport] = useState('Basketball');
  const [newDuration, setNewDuration] = useState(45);
  const [creatingSession, setCreatingSession] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, analysisData, sensorData, sessionsData] = await Promise.all([
        statisticsService.getOverview(),
        statisticsService.getActivityAnalysis(),
        deviceService.getStatus(),
        sessionService.getAll(),
      ]);

      setOverview(statsData);
      setActivityAnalysis(analysisData);
      setSensorStatus(sensorData);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatTimer = (seconds = 0) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    const onSessionDone = () => {
      loadDashboardData();
    };
    window.addEventListener('sss_session_completed', onSessionDone);
    return () => window.removeEventListener('sss_session_completed', onSessionDone);
  }, []);


  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!isDeviceConnected) {
      alert('Vui lòng kết nối thiết bị cảm biến Second Skin Pod qua Bluetooth trước khi bắt đầu.');
      return;
    }
    setCreatingSession(true);
    try {
      if (typeof startTrackingSession === 'function') {
        startTrackingSession({
          sport: newSport,
          targetDurationMinutes: Number(newDuration),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Không thể bắt đầu buổi tập. Vui lòng thử lại.');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleExportReport = () => {
    // UTF-8 BOM prefix ensures Microsoft Excel on Windows parses Vietnamese characters flawlessly
    const utf8Bom = '\uFEFF';
    const headers = 'ID,Bộ Môn,Thời Lượng (phút),Cú Nhảy,Gia Tốc TB,Điểm Số,Trạng Thái\n';
    const rows = sessions
      .map(
        (s) =>
          `${s.id},"${s.sport || 'Chưa xác định'}",${s.durationMinutes || 0},${s.totalJumps || 0},${s.averageAcceleration || 0},${s.performanceScore || 0}%,${s.status || 'Completed'}`
      )
      .join('\n');
    const blob = new Blob([utf8Bom, headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SecondSkin_BaoCao_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && !overview) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Đang kết nối hệ thống đo lường Second Skin...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-hero-header">
        <div className="hero-text-wrap">
          <h1 className="hero-title">Bảng Điều Khiển Hiệu Suất Thể Thao</h1>
          <p className="hero-subtitle">
            Theo dõi chuyển động và hiệu suất của bạn theo thời gian thực với miếng dán cảm biến thông minh.
          </p>
        </div>

        <div className="hero-action-buttons">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Bắt đầu buổi tập</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportReport}>
            <Download size={14} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Error notification if API issues */}
      {error && (
        <div className="dashboard-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-outline-cyan btn-sm" onClick={loadDashboardData}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}


      {/* PHẦN LIVE TRACKING SESSION (KHI ĐANG TRONG BUỔI TẬP THỜI GIAN THỰC) */}
      {autoSession && (autoSession.status === 'recording' || autoSession.status === 'cooldown') && (
        <section className="live-session-banner-section">
          <div className="live-session-card">
            <div className="live-session-header">
              <div className="live-indicator-wrap">
                <span className="live-pulse-dot"></span>
                <span className="live-badge">ĐANG THEO DÕI TRỰC TIẾP</span>
                <span className="live-sport-name">
                  {autoSession.sport === 'Basketball' ? 'Bóng rổ' : autoSession.sport === 'Running' ? 'Chạy bộ' : autoSession.sport || 'Bóng rổ'}
                </span>
              </div>
              <div className="live-target-time">
                Mục tiêu dự kiến: <strong>{autoSession.targetDurationMinutes || 45} phút</strong>
              </div>
            </div>

            <div className="live-session-metrics">
              <div className="live-metric-box timer-box">
                <Clock size={18} className="highlight-cyan" />
                <div className="live-metric-info">
                  <span className="live-metric-label">Thời Gian Tập</span>
                  <span className="live-metric-value">{formatTimer(autoSession.elapsedSeconds)}</span>
                </div>
              </div>

              <div className="live-metric-box">
                <Activity size={18} className="highlight-neon" />
                <div className="live-metric-info">
                  <span className="live-metric-label">Cú Nhảy (Jumps)</span>
                  <span className="live-metric-value">{autoSession.jumpCount || 0} lần</span>
                </div>
              </div>

              <div className="live-metric-box">
                <Compass size={18} className="highlight-cyan" />
                <div className="live-metric-info">
                  <span className="live-metric-label">Đổi Hướng</span>
                  <span className="live-metric-value">{autoSession.directionChangeCount || 0} lần</span>
                </div>
              </div>

              <div className="live-metric-box">
                <Gauge size={18} />
                <div className="live-metric-info">
                  <span className="live-metric-label">Gia Tốc TB</span>
                  <span className="live-metric-value">{autoSession.avgAccel || 0} {unitLabels.accel}</span>
                </div>
              </div>

              <div className="live-metric-actions">
                <button
                  type="button"
                  className="btn btn-finish-session"
                  onClick={async () => {
                    await finalizeAutoSession(true);
                    loadDashboardData();
                  }}
                  disabled={autoSession.isSaving}
                >
                  {autoSession.isSaving ? 'Đang tổng hợp dữ liệu...' : 'Dừng & Hoàn Thành Buổi Tập'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHẦN 1: OVERVIEW - 6 STATISTIC CARDS */}
      <section className="overview-section">
        <div className="grid-cols-6">
          <StatCard
            title="Tổng số buổi tập"
            value={overview?.totalSessions ?? 0}
            change={overview?.totalSessionsChange ?? '0'}
            icon={Calendar}
            accent="cyan"
          />
          <StatCard
            title="Tổng thời gian tập"
            value={overview?.totalActivityTime ?? '0m'}
            change={overview?.totalActivityTimeChange ?? '0%'}
            icon={Clock}
            accent="blue"
          />
          <StatCard
            title="Gia tốc trung bình"
            value={overview?.averageAcceleration != null ? convertAccel(overview.averageAcceleration) : 0.0}
            unit={unitLabels.accel}
            change={overview?.averageAccelerationChange ?? '0%'}
            icon={Gauge}
            accent="cyan"
          />
          <StatCard
            title="Tổng cú nhảy"
            value={overview?.totalJumps ?? 0}
            change={overview?.totalJumpsChange ?? '0'}
            icon={ArrowUpRight}
            accent="green"
          />
          <StatCard
            title="Tổng lần đổi hướng"
            value={overview?.directionChanges?.toLocaleString() ?? '0'}
            change={overview?.directionChangesChange ?? '0'}
            icon={Compass}
            accent="purple"
          />
          <StatCard
            title="Điểm hiệu suất"
            value={overview?.performanceScore ?? 0}
            unit="%"
            change={overview?.performanceScoreChange ?? '0%'}
            icon={Award}
            accent="green"
          />
        </div>
      </section>

      {/* PHẦN 2: PERFORMANCE CHART */}
      <section className="chart-section">
        <PerformanceChart />
      </section>

      {/* PHẦN 3: ACTIVITY ANALYSIS */}
      <section className="analysis-section">
        <div className="section-title-wrap">
          <h2 className="section-heading">Phân Tích Hoạt Động Sinh Trắc Học</h2>
          <span className="section-tag">PHIÊN GẦN NHẤT • THEO DÕI CHUYỂN ĐỘNG AI</span>
        </div>
        <ActivityCard analysis={activityAnalysis} />
      </section>

      {/* PHẦN 4: RECENT SESSIONS */}
      <section className="sessions-section">
        <SessionTable sessions={sessions} />
      </section>

      {/* Quick Start Session Modal */}
      {isModalOpen && (
        <div className="modal-overlay dashboard-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box card session-start-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Play className="modal-icon highlight-cyan" size={20} />
                <h3>Bắt Đầu Buổi Tập Mới</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="session-form">
              <div className="form-group">
                <label>Chọn Môn Thể Thao</label>
                <select
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  className="form-select"
                >
                  <option value="Running">Chạy bộ (Running)</option>
                  <option value="Basketball">Bóng rổ (Basketball)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thời Gian Dự Kiến (Phút)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {isDeviceConnected ? (
                <div className="form-sensor-info connected">
                  <div className="sensor-connected-pill">
                    <span className="status-dot connected" />
                    <span className="sensor-name">
                      {bleDevice?.name || 'Miếng dán Second Skin Pod (Đang hoạt động)'}
                    </span>
                  </div>
                  <span className="sensor-status-tag">Đã kết nối BLE</span>
                </div>
              ) : (
                <div className="form-sensor-info disconnected">
                  <div className="sensor-warning-content">
                    <div className="warning-title-wrap">
                      <AlertTriangle size={15} className="warning-icon" />
                      <span>Chưa kết nối thiết bị cảm biến</span>
                    </div>
                    <p className="warning-desc">
                      Vui lòng kết nối miếng dán Second Skin Pod qua Bluetooth để có thể bắt đầu theo dõi buổi tập.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-quick-connect-ble"
                    onClick={async () => {
                      setConnectingBle(true);
                      try {
                        await connectBle();
                      } catch (err) {
                        // User dismissed pairing popup or error
                      } finally {
                        setConnectingBle(false);
                      }
                    }}
                    disabled={connectingBle}
                  >
                    <Bluetooth size={13} />
                    <span>{connectingBle ? 'Đang dò...' : 'Kết nối ngay'}</span>
                  </button>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isDeviceConnected || creatingSession}
                  title={!isDeviceConnected ? 'Cần kết nối cảm biến để kích hoạt theo dõi' : 'Bắt đầu theo dõi buổi tập'}
                >
                  {creatingSession ? 'Đang khởi tạo cảm biến...' : 'Bắt Đầu Theo Dõi'}
                </button>
              </div>

              {!isDeviceConnected && (
                <div className="session-blocked-notice">
                  <AlertCircle size={13} />
                  <span>Nút theo dõi sẽ tự động mở khóa ngay khi thiết bị được kết nối.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

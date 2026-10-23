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
  RefreshCw,
  X,
  Play,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import PerformanceChart from '../components/PerformanceChart';
import ActivityCard from '../components/ActivityCard';
import SensorCard from '../components/SensorCard';
import SessionTable from '../components/SessionTable';
import {
  sessionService,
  statisticsService,
  deviceService,
} from '../services/api';
import { useBle } from '../context/BleContext';
import './Dashboard.css';

export default function Dashboard() {
  const { bleStatus, sensorStatus: liveBleSensorStatus } = useBle();
  const [overview, setOverview] = useState(null);
  const [activityAnalysis, setActivityAnalysis] = useState(null);
  const [sensorStatus, setSensorStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const effectiveSensorStatus = bleStatus === 'connected' ? liveBleSensorStatus : sensorStatus;

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

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreatingSession(true);
    try {
      const isBasketball = newSport === 'Basketball';
      const curData = sensorStatus?.currentData;
      const initialAccel = curData
        ? Math.max(1.8, +(Math.hypot(curData.accelerometerX || 0, curData.accelerometerY || 0, curData.accelerometerZ || 9.81) - 9.81).toFixed(2))
        : (isBasketball ? 2.95 : 2.40);
      const initialIntensity = curData?.movementIntensity ? Math.max(60, curData.movementIntensity) : (isBasketball ? 82 : 78);
      const initialScore = isBasketball ? 88 : 84;

      const created = await sessionService.create({
        sport: newSport,
        durationMinutes: Number(newDuration),
        startTime: new Date().toISOString(),
        totalJumps: isBasketball ? Math.max(12, Math.round(Number(newDuration) * 0.9)) : 0,
        directionChanges: isBasketball ? Math.max(25, Math.round(Number(newDuration) * 2.8)) : Math.max(10, Math.round(Number(newDuration) * 0.5)),
        averageAcceleration: initialAccel,
        averageSpeed: isBasketball ? 17.8 : 14.5,
        movementIntensity: initialIntensity,
        performanceScore: initialScore,
        status: 'Completed',
      });

      setSessions((prev) => [created, ...prev]);
      setIsModalOpen(false);
      // Reload stats
      loadDashboardData();
    } catch (err) {
      alert('Không thể bắt đầu buổi tập. Vui lòng thử lại.');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleExportReport = () => {
    // Generate simple CSV report
    const headers = 'ID,Bộ Môn,Thời Lượng(phút),Cú Nhảy,Gia Tốc TB,Điểm Số,Trạng Thái\n';
    const rows = sessions
      .map(
        (s) =>
          `${s.id},${s.sport},${s.durationMinutes},${s.totalJumps},${s.averageAcceleration},${s.performanceScore}%,${s.status}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SecondSkin_BaoCao_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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
            value={overview?.averageAcceleration ?? 0.0}
            unit="m/s²"
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
            title="Đổi hướng di chuyển"
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
          <span className="section-tag">THEO DÕI CHUYỂN ĐỘNG AI</span>
        </div>
        <ActivityCard analysis={activityAnalysis} />
      </section>

      {/* PHẦN 4: SENSOR DATA */}
      <section className="sensor-section">
        <SensorCard sensorStatus={effectiveSensorStatus} />
      </section>

      {/* PHẦN 5: RECENT SESSIONS */}
      <section className="sessions-section">
        <SessionTable sessions={sessions} />
      </section>

      {/* Quick Start Session Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
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

              <div className="form-sensor-info">
                <span className="info-label">Cảm biến kết nối:</span>
                <span className="info-val">Miếng dán Second Skin #001 (Kết nối BLE)</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingSession}>
                  {creatingSession ? 'Đang khởi tạo cảm biến...' : 'Bắt Đầu Theo Dõi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

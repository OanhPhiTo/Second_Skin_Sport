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
import './Dashboard.css';

export default function Dashboard() {
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
      setError('Unable to load data. Please try again.');
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
      const created = await sessionService.create({
        sport: newSport,
        durationMinutes: Number(newDuration),
        startTime: new Date().toISOString(),
        totalJumps: Math.floor(Math.random() * 40) + 30,
        directionChanges: Math.floor(Math.random() * 80) + 80,
        averageAcceleration: +(Math.random() * 1.5 + 2.2).toFixed(2),
        averageSpeed: +(Math.random() * 6 + 14).toFixed(1),
        movementIntensity: Math.floor(Math.random() * 15) + 80,
        performanceScore: Math.floor(Math.random() * 12) + 85,
        status: 'Completed',
      });

      setSessions((prev) => [created, ...prev]);
      setIsModalOpen(false);
      // Reload stats
      loadDashboardData();
    } catch (err) {
      alert('Could not start session. Please try again.');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleExportReport = () => {
    // Generate simple CSV report
    const headers = 'ID,Sport,Duration(min),Jumps,Avg Acceleration,Score,Status\n';
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
    a.download = `SecondSkin_Performance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading && !overview) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to Second Skin Telemetry Engine...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-hero-header">
        <div className="hero-text-wrap">
          <h1 className="hero-title">Sports Performance Dashboard</h1>
          <p className="hero-subtitle">
            Monitor your movement and performance in real time with wearable patch sensors.
          </p>
        </div>

        <div className="hero-action-buttons">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Start Session</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportReport}>
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Error notification if API issues */}
      {error && (
        <div className="dashboard-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-outline-cyan btn-sm" onClick={loadDashboardData}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* PHẦN 1: OVERVIEW - 6 STATISTIC CARDS */}
      <section className="overview-section">
        <div className="grid-cols-6">
          <StatCard
            title="Total Sessions"
            value={overview?.totalSessions ?? 24}
            change={overview?.totalSessionsChange ?? '+4'}
            icon={Calendar}
            accent="cyan"
          />
          <StatCard
            title="Total Activity Time"
            value={overview?.totalActivityTime ?? '18h 42m'}
            change={overview?.totalActivityTimeChange ?? '+12.5%'}
            icon={Clock}
            accent="blue"
          />
          <StatCard
            title="Avg Acceleration"
            value={overview?.averageAcceleration ?? 2.84}
            unit="m/s²"
            change={overview?.averageAccelerationChange ?? '+5.2%'}
            icon={Gauge}
            accent="cyan"
          />
          <StatCard
            title="Total Jumps"
            value={overview?.totalJumps ?? 386}
            change={overview?.totalJumpsChange ?? '+14.8%'}
            icon={ArrowUpRight}
            accent="green"
          />
          <StatCard
            title="Direction Changes"
            value={overview?.directionChanges?.toLocaleString() ?? '1,245'}
            change={overview?.directionChangesChange ?? '+8.1%'}
            icon={Compass}
            accent="purple"
          />
          <StatCard
            title="Performance Score"
            value={overview?.performanceScore ?? 87}
            unit="%"
            change={overview?.performanceScoreChange ?? '+8.4%'}
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
          <h2 className="section-heading">Biometric Activity Analysis</h2>
          <span className="section-tag">AI MOTION TRACKING</span>
        </div>
        <ActivityCard analysis={activityAnalysis} />
      </section>

      {/* PHẦN 4: SENSOR DATA */}
      <section className="sensor-section">
        <SensorCard sensorStatus={sensorStatus} />
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
                <h3>Launch New Sport Session</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="session-form">
              <div className="form-group">
                <label>Select Sport Discipline</label>
                <select
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  className="form-select"
                >
                  <option value="Running">Running (Chạy bộ)</option>
                  <option value="Basketball">Basketball (Bóng rổ)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Planned Duration (Minutes)</label>
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
                <span className="info-label">Active Sensor:</span>
                <span className="info-val">Second Skin Patch #001 (BLE Connected)</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingSession}>
                  {creatingSession ? 'Initializing Sensor...' : 'Start Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

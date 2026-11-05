import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowRightLeft,
  Flame,
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Timer,
  Zap,
  Radio,
  RefreshCw,
  Eye,
  X,
  Cpu,
  Gauge,
  BarChart2,
  Battery,
  Wifi,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { coachService } from '../services/api';
import useCoachTacticalWebSocket from '../hooks/useCoachTacticalWebSocket';
import './CoachDashboard.css';

export default function CoachDashboard() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState(1);
  const [squadData, setSquadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState(null);

  // Athlete Telemetry Modal / Drawer State
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteMetrics, setAthleteMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Hook WebSocket for live tactical stream (auto cleans up on unmount)
  const { tacticalSummary, telemetryHistory, connected } = useCoachTacticalWebSocket(teamId, {
    maxDataPoints: 50,
  });

  // Load available teams for this coach
  useEffect(() => {
    const loadTeams = async () => {
      try {
        if (typeof coachService.getTeams === 'function') {
          const res = await coachService.getTeams();
          if (Array.isArray(res) && res.length > 0) {
            setTeams(res);
            setTeamId(res[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load teams list, using default teamId = 1', err);
      }
    };
    loadTeams();
  }, []);

  const loadSquadAnalysis = async () => {
    try {
      if (typeof coachService.getTacticalAnalysis === 'function') {
        const data = await coachService.getTacticalAnalysis(teamId);
        setSquadData(data);
      }
    } catch (err) {
      console.error('Failed to load tactical analysis', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSquadAnalysis();
    const interval = setInterval(loadSquadAnalysis, 6000);
    return () => clearInterval(interval);
  }, [teamId]);

  // Sync with live WebSocket stream when new payload arrives
  useEffect(() => {
    if (tacticalSummary) {
      setSquadData(tacticalSummary);
    }
  }, [tacticalSummary]);

  // Open Athlete Detailed Telemetry Drawer
  const handleOpenAthleteMetrics = async (athlete) => {
    setSelectedAthlete(athlete);
    setLoadingMetrics(true);
    try {
      if (typeof coachService.getAthleteMetrics === 'function') {
        const metrics = await coachService.getAthleteMetrics(teamId, athlete.id);
        setAthleteMetrics(metrics);
      } else {
        setAthleteMetrics(athlete);
      }
    } catch (err) {
      console.error('Failed to load athlete metrics', err);
      setAthleteMetrics(athlete);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleCloseMetrics = () => {
    setSelectedAthlete(null);
    setAthleteMetrics(null);
  };

  // Execute Tactical Swap (Starter <-> Bench)
  const handleExecuteSwap = async (outAthleteId, inAthleteId, outName, inName) => {
    try {
      setSwapping(true);
      const updated = await coachService.executeTacticalSwap(teamId, outAthleteId, inAthleteId);
      if (updated) {
        setSquadData(updated);
      }
      setSwapFeedback(`Đã cập nhật vị trí đội hình: ${outName} ➔ ${inName}`);
      setTimeout(() => setSwapFeedback(null), 4000);
      if (selectedAthlete) {
        handleCloseMetrics();
      }
    } catch (err) {
      console.error('Swap failed', err);
    } finally {
      setSwapping(false);
    }
  };

  if (loading && !squadData) {
    return (
      <div className="coach-loading-wrap">
        <div className="coach-spinner" />
        <span>Đang kết nối luồng cảm biến thời gian thực của đội hình...</span>
      </div>
    );
  }

  const activeOnField = squadData?.activeOnField || [];
  const benchSubstitutes = squadData?.benchSubstitutes || [];
  const activeAlerts = squadData?.activeTacticalAlerts || [];
  const avgFatigue = squadData?.averageFatigue || 0;
  const highFatigueCount = squadData?.highFatigueCount || 0;

  // Visual Chart Data points (capped at 50 points to prevent browser freeze)
  const chartData = telemetryHistory.length > 0
    ? telemetryHistory
    : [
        { time: '28:10', avgFatigue: 62 },
        { time: '28:20', avgFatigue: 66 },
        { time: '28:30', avgFatigue: 71 },
        { time: '28:40', avgFatigue: 74 },
        { time: '28:45', avgFatigue: avgFatigue || 76.5 },
      ];

  const getAthleteDevice = (ath, idx) => {
    const isOnField = ath.status === 'ON_FIELD';
    const battery = ath.batteryLevel ?? (isOnField ? Math.max(45, 94 - idx * 5) : 98);
    return {
      battery,
      rate: isOnField ? '10 Hz' : 'Standby',
      streaming: isOnField,
      signal: isOnField ? '98%' : '100%',
    };
  };

  return (
    <div className="coach-dashboard-container">
      {/* Swap Success Toast */}
      {swapFeedback && (
        <div className="coach-toast-notification">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>{swapFeedback}</span>
        </div>
      )}

      {/* Top Tactical Squad Metrics Bar */}
      <section className="tactical-hero-strip">
        <div className="hero-team-details">
          <div className="team-badge-row">
            <span className="team-sport-pill">{squadData?.sport || 'Bóng rổ'}</span>
            <span className="live-match-pill">
              <span className="live-dot-pulse" /> ĐANG THI ĐẤU
            </span>
            <span className={`ws-badge ${connected ? 'ws-online' : 'ws-fallback'}`}>
              <Radio size={12} className="radio-icon" />
              {connected ? 'STREAM TELEMETRY 10HZ' : 'Đồng Bộ Tự Động'}
            </span>

            {/* Team Selector Dropdown */}
            {teams.length > 1 && (
              <select
                className="coach-team-picker"
                value={teamId}
                onChange={(e) => setTeamId(Number(e.target.value))}
                title="Chọn đội tuyển để giám sát"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.sport})
                  </option>
                ))}
              </select>
            )}
          </div>

          <h1 className="hero-team-title">{squadData?.teamName || 'Hanoi Dragons Pro'}</h1>
          <p className="hero-team-sub">
            Trung tâm giám sát tải trọng động học và trạng thái thiết bị Second Skin theo thời gian thực — HLV chủ động cân nhắc quyết định chiến thuật
          </p>
        </div>

        {/* Global Squad Metrics */}
        <div className="hero-stat-cards">
          <div className={`tactical-stat-box ${avgFatigue >= 75 ? 'danger' : avgFatigue >= 60 ? 'warning' : 'safe'}`}>
            <div className="stat-label-wrap">
              <Flame size={16} />
              <span>Chỉ Số Mỏi Toàn Đội</span>
            </div>
            <div className="stat-value-row">
              <span className="stat-number">{avgFatigue}%</span>
              <span className="stat-badge">
                {avgFatigue >= 75 ? '⚠️ NGUY CƠ CAO' : avgFatigue >= 60 ? '⚡ CẢNH BÁO' : '✅ ỔN ĐỊNH'}
              </span>
            </div>
            <div className="stat-bar-track">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${Math.min(100, avgFatigue)}%`,
                  backgroundColor: avgFatigue >= 75 ? '#ef4444' : avgFatigue >= 60 ? '#f59e0b' : '#00ff87',
                }}
              />
            </div>
          </div>

          <div className="tactical-stat-box">
            <div className="stat-label-wrap">
              <Users size={16} />
              <span>Quân Số Tác Chiến</span>
            </div>
            <div className="stat-value-row">
              <span className="stat-number">{activeOnField.length}</span>
              <span className="stat-sublabel">/ {benchSubstitutes.length} Dự bị</span>
            </div>
            <div className="stat-foot-note">
              {highFatigueCount > 0 ? (
                <span className="text-danger font-semibold">⚠️ {highFatigueCount} cầu thủ kiệt sức</span>
              ) : (
                <span className="text-emerald">Tất cả trong ngưỡng sung sức</span>
              )}
            </div>
          </div>

          <div className="tactical-stat-box mesh-box">
            <div className="stat-label-wrap">
              <Cpu size={16} className="text-cyan" />
              <span>Hệ Thống Thiết Bị Đeo</span>
            </div>
            <div className="stat-value-row">
              <span className="stat-number text-cyan">{activeOnField.length + benchSubstitutes.length}/{activeOnField.length + benchSubstitutes.length}</span>
              <span className="stat-sublabel">Online 10Hz</span>
            </div>
            <div className="stat-foot-note">
              <span className="text-emerald">🔋 Pin trung bình: 88%</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CẢNH BÁO TẢI MỎI & ĐỀ XUẤT THAM KHẢO (HLV TỰ QUYẾT ĐỊNH)
          ========================================================================= */}
      {activeAlerts.length > 0 && (
        <section className="tactical-rotation-engine-card">
          <div className="rotation-card-header">
            <div className="alert-badge-wrap">
              <AlertTriangle size={20} className="alert-blink-icon" />
              <div>
                <h3 className="rotation-card-title">ĐỀ XUẤT XOAY TUA CHIẾN THUẬT TỰ ĐỘNG</h3>
                <span className="rotation-card-sub">
                  Phát hiện dấu hiệu mỏi cơ sinh học và nguy cơ chấn thương tiếp đất (Gợi ý tham khảo — HLV tự cân nhắc)
                </span>
              </div>
            </div>
            <span className="urgency-pill critical">THAM KHẢO</span>
          </div>

          <div className="rotation-alerts-list">
            {activeAlerts.map((alert, index) => (
              <div key={index} className="rotation-item-banner">
                <div className="swap-matchup-row">
                  {/* Out Player */}
                  <div className="matchup-player-box out">
                    <span className="player-tag out">RÚT RA NGHỈ</span>
                    <div className="player-meta-big">
                      <span className="jersey-num">#{alert.outJerseyNumber}</span>
                      <div className="player-text">
                        <span className="player-name">{alert.outAthleteName}</span>
                        <span className="player-pos">{alert.outPosition} • SSS-PATCH-001</span>
                      </div>
                    </div>
                    <div className="player-fatigue-badge out">
                      <span>Mỏi: {alert.outFatigueIndex}%</span>
                    </div>
                  </div>

                  {/* Transition Arrow */}
                  <div className="swap-arrow-container">
                    <ArrowRightLeft size={24} className="swap-arrow-icon" />
                    <span className="swap-arrow-label">GỢI Ý</span>
                  </div>

                  {/* In Player */}
                  <div className="matchup-player-box in">
                    <span className="player-tag in">THAY VÀO SÂN</span>
                    <div className="player-meta-big">
                      <span className="jersey-num">#{alert.inJerseyNumber}</span>
                      <div className="player-text">
                        <span className="player-name">{alert.inAthleteName}</span>
                        <span className="player-pos">{alert.inPosition} • SSS-PATCH-004</span>
                      </div>
                    </div>
                    <div className="player-fatigue-badge in">
                      <span>Mỏi: {alert.inFatigueIndex}% (Sẵn sàng 100%)</span>
                    </div>
                  </div>
                </div>

                <div className="rotation-action-footer">
                  <div className="rotation-reason-text">
                    <p className="reason-main">{alert.reason}</p>
                    <p className="reason-tactic">{alert.recommendedTactic}</p>
                  </div>

                  <button
                    className="btn-swap-now"
                    onClick={() =>
                      handleExecuteSwap(
                        alert.outAthleteId,
                        alert.inAthleteId,
                        alert.outAthleteName,
                        alert.inAthleteName
                      )
                    }
                    disabled={swapping}
                  >
                    <ArrowRightLeft size={16} />
                    <span>{swapping ? 'Đang cập nhật...' : 'Thực Hiện Thay Người Ngay'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          ON FIELD SQUAD (CẦU THỦ TRÊN SÂN - LIVE TELEMETRY)
          ========================================================================= */}
      <section className="squad-section">
        <div className="section-title-strip">
          <div className="title-with-pill">
            <h2 className="section-heading">CẦU THỦ TRÊN SÂN ({activeOnField.length})</h2>
            <span className="heading-sub-pill on-field">Live 10Hz Stream</span>
          </div>
          <span className="section-note">Miếng dán Second Skin đang truyền dữ liệu động học trực tiếp</span>
        </div>

        <div className="athletes-grid">
          {activeOnField.map((ath, idx) => {
            const dev = getAthleteDevice(ath, idx);
            const isCrit = (ath.fatigueIndex ?? 0) >= 80;
            const isWarn = (ath.fatigueIndex ?? 0) >= 60;
            return (
              <div
                key={ath.id}
                className={`athlete-tactical-card ${isCrit ? 'card-crit' : isWarn ? 'card-warn' : 'card-safe'}`}
              >
                {/* Header */}
                <div className="card-top-header">
                  <div className="player-main-identity">
                    <span className="card-jersey-tag">#{ath.jerseyNumber}</span>
                    <div>
                      <h4 className="card-player-name">{ath.name}</h4>
                      <div className="card-player-pos-row">
                        <span className="pos-chip">{ath.position}</span>
                        <span className="pos-desc">{ath.position === 'PG' ? 'Point Guard' : ath.position === 'SG' ? 'Shooting Guard' : 'Center'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Telemetry Tag */}
                  <div className="card-device-badge">
                    <div className="device-code-chip">
                      <Cpu size={12} className="text-cyan" />
                      <span>{ath.deviceId || 'SSS-PATCH-001'}</span>
                    </div>
                    <div className="device-health-chip">
                      <span className="live-pulse-green" />
                      <span className="text-emerald">10Hz</span>
                      <span className="divider-dot">•</span>
                      <Battery size={12} className={dev.battery > 60 ? 'text-emerald' : 'text-amber'} />
                      <span>{dev.battery}%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics Grid */}
                <div className="card-metrics-grid">
                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Flame size={13} className="text-amber" />
                      <span>Chỉ Số Mỏi</span>
                    </div>
                    <span className={`metric-big-num ${isCrit ? 'text-danger' : isWarn ? 'text-amber' : 'text-emerald'}`}>
                      {ath.fatigueIndex ?? 0}%
                    </span>
                    <div className="mini-progress-track">
                      <div
                        className="mini-progress-fill"
                        style={{
                          width: `${Math.min(100, ath.fatigueIndex ?? 0)}%`,
                          backgroundColor: isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#00ff87',
                        }}
                      />
                    </div>
                  </div>

                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Timer size={13} className="text-cyan" />
                      <span>Thời Gian Thi Đấu</span>
                    </div>
                    <span className="metric-big-num">{ath.minutesPlayed ?? 0} <small>phút</small></span>
                    <span className="metric-sub-detail">Cường độ {ath.currentIntensity ?? 78}%</span>
                  </div>

                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Activity size={13} className="text-neon" />
                      <span>Cú Nhảy (Jumps)</span>
                    </div>
                    <span className="metric-big-num text-cyan">{ath.jumpCount ?? 0}</span>
                    <span className="metric-sub-detail">{ath.highImpactLandings ?? 0} va đập mạnh</span>
                  </div>

                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Heart size={13} className="text-danger" />
                      <span>Nhịp Tim</span>
                    </div>
                    <span className="metric-big-num text-danger">{ath.heartRate ?? 160} <small>BPM</small></span>
                    <span className="metric-sub-detail">Vùng nhịp gắng sức</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="card-actions-row">
                  <button
                    className="btn-inspect-metrics"
                    onClick={() => handleOpenAthleteMetrics(ath)}
                  >
                    <Eye size={14} />
                    <span>Xem Thông Số Chi Tiết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BENCH SQUAD (CẦU THỦ DỰ BỊ SẴN SÀNG)
          ========================================================================= */}
      <section className="squad-section bench-section">
        <div className="section-title-strip">
          <div className="title-with-pill">
            <h2 className="section-heading">CẦU THỦ DỰ BỊ SẴN SÀNG ({benchSubstitutes.length})</h2>
            <span className="heading-sub-pill bench">Dự Bị</span>
          </div>
          <span className="section-note">Thể lực dồi dào, thiết bị ở chế độ Standby sẵn sàng</span>
        </div>

        <div className="athletes-grid bench-grid">
          {benchSubstitutes.map((ath, idx) => {
            const dev = getAthleteDevice(ath, idx + 4);
            return (
              <div key={ath.id} className="athlete-tactical-card bench-card">
                <div className="card-top-header">
                  <div className="player-main-identity">
                    <span className="card-jersey-tag bench">#{ath.jerseyNumber}</span>
                    <div>
                      <h4 className="card-player-name">{ath.name}</h4>
                      <div className="card-player-pos-row">
                        <span className="pos-chip">{ath.position}</span>
                        <span className="pos-desc">Sẵn sàng 100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-device-badge">
                    <div className="device-code-chip">
                      <Cpu size={12} className="text-muted" />
                      <span>{ath.deviceId || 'SSS-PATCH-004'}</span>
                    </div>
                    <div className="device-health-chip standby">
                      <span>Standby</span>
                      <span className="divider-dot">•</span>
                      <Battery size={12} className="text-emerald" />
                      <span>{dev.battery}%</span>
                    </div>
                  </div>
                </div>

                <div className="card-metrics-grid">
                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Flame size={13} className="text-emerald" />
                      <span>Chỉ Số Mỏi</span>
                    </div>
                    <span className="metric-big-num text-emerald">{ath.fatigueIndex ?? 0}%</span>
                    <span className="metric-sub-detail">Sung sức hoàn toàn</span>
                  </div>

                  <div className="card-metric-item">
                    <div className="metric-header-mini">
                      <Timer size={13} className="text-muted" />
                      <span>Thời Gian Thi Đấu</span>
                    </div>
                    <span className="metric-big-num">{ath.minutesPlayed ?? 0} <small>phút</small></span>
                    <span className="metric-sub-detail">Dự bị</span>
                  </div>
                </div>

                <div className="card-actions-row">
                  <button
                    className="btn-inspect-metrics"
                    onClick={() => handleOpenAthleteMetrics(ath)}
                  >
                    <Eye size={14} />
                    <span>Xem Thông Số Chi Tiết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          LIVE TELEMETRY CHART
          ========================================================================= */}
      <section className="squad-chart-section">
        <div className="chart-header-row">
          <div>
            <h3 className="chart-title">BIỂU ĐỒ BIẾN THIÊN TẢI MỎI TOÀN ĐỘI THEO THỜI GIAN THỰC</h3>
            <span className="chart-sub">Dữ liệu từ luồng WebSocket 10Hz tổng hợp trung bình toàn đội</span>
          </div>
          <span className="chart-live-badge">
            <Radio size={13} className="radio-icon" /> LIVE STREAM
          </span>
        </div>

        <div className="chart-render-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(0, 242, 254, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="avgFatigue"
                name="Tải mỏi trung bình (%)"
                stroke="#00f2fe"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fatigueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* =========================================================================
          ATHLETE TELEMETRY DRAWER / MODAL
          ========================================================================= */}
      {selectedAthlete && (
        <div className="telemetry-drawer-overlay" onClick={handleCloseMetrics}>
          <div className="telemetry-drawer-body" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-top-header">
              <div className="drawer-player-info">
                <span className="drawer-jersey">#{selectedAthlete.jerseyNumber}</span>
                <div>
                  <h3 className="drawer-title">{selectedAthlete.name}</h3>
                  <span className="drawer-sub">
                    {selectedAthlete.position} • {selectedAthlete.deviceId || 'SSS-PATCH-001'} • {selectedAthlete.status === 'ON_FIELD' ? 'Đang trên sân (10Hz Live)' : 'Dự bị'}
                  </span>
                </div>
              </div>
              <button className="btn-close-drawer" onClick={handleCloseMetrics}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content-scroll">
              <div className="drawer-subheading-strip">
                <Cpu size={16} className="text-cyan" />
                <h4>TÍN HIỆU ĐỘNG HỌC THỜI GIAN THỰC (IMU TELEMETRY STREAM)</h4>
              </div>

              {/* Quick Live Numbers */}
              <div className="drawer-stats-row">
                <div className="drawer-stat-pill">
                  <Heart size={14} className="text-danger" />
                  <span className="drawer-stat-label">Nhịp Tim Tức Thời</span>
                  <strong>{selectedAthlete.heartRate || 168} BPM</strong>
                </div>
                <div className="drawer-stat-pill">
                  <Flame size={14} className="text-amber" />
                  <span>Chỉ Số Mỏi: <strong>{selectedAthlete.fatigueIndex || 82.5}%</strong></span>
                </div>
                <div className="drawer-stat-pill">
                  <Activity size={14} className="text-cyan" />
                  <span>Cú Nhảy: <strong>{selectedAthlete.jumpCount || 42}</strong></span>
                </div>
              </div>

              <div className="drawer-advice-card">
                <AlertTriangle size={18} className="text-amber" />
                <div>
                  <p className="advice-title">Khuyến nghị thể lực cho HLV:</p>
                  <p className="advice-text">
                    <span>{athleteMetrics?.recoveryAdvice || selectedAthlete.recoveryAdvice || 'Cảnh báo quá tải tải trọng sinh học!'}</span>
                  </p>
                </div>
              </div>

              {/* Telemetry Waveform Chart */}
              <div className="drawer-chart-container">
                <span className="chart-label">Đồ Thị Gia Tốc Động Học 3 Trục (Acc X, Y, Z - m/s²)</span>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={
                      athleteMetrics?.recentTelemetry || [
                        { timestamp: '1', accX: 1.2, accY: -0.4, accZ: 14.5 },
                        { timestamp: '2', accX: 1.5, accY: -0.2, accZ: 12.8 },
                        { timestamp: '3', accX: 0.9, accY: -0.6, accZ: 16.2 },
                        { timestamp: '4', accX: 1.8, accY: 0.1, accZ: 15.0 },
                        { timestamp: '5', accX: 1.4, accY: -0.3, accZ: 13.5 },
                      ]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(0, 242, 254, 0.3)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="accX" name="Trục X (Ngang)" stroke="#00f2fe" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="accY" name="Trục Y (Dọc)" stroke="#00ff87" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="accZ" name="Trục Z (Thẳng đứng)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

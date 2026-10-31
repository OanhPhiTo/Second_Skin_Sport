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
        // Fallback if mocked
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
      setSwapFeedback(`Đã thực hiện xoay tua thành công: ${outName} ➔ ${inName}`);
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
        <span>Đang phân tích tải trọng động học toàn đội...</span>
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
              <Radio size={12} />
              {connected ? 'WebSocket Trực Tiếp' : 'Đồng Bộ Tự Động'}
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
            Trung tâm giám sát tải trọng động học và điều phối xoay tua vận động viên theo thời gian thực
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
                  backgroundColor: avgFatigue >= 75 ? '#ef4444' : avgFatigue >= 60 ? '#f59e0b' : '#10b981',
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
        </div>
      </section>

      {/* =========================================================================
          TACTICAL ROTATION ENGINE (BỘ ĐỀ XUẤT CHIẾN THUẬT XOAY TUA CẦU THỦ)
          ========================================================================= */}
      {activeAlerts.length > 0 && (
        <section className="tactical-rotation-engine-card">
          <div className="rotation-card-header">
            <div className="alert-badge-wrap">
              <AlertTriangle size={20} className="alert-blink-icon" />
              <div>
                <h3 className="rotation-card-title">ĐỀ XUẤT XOAY TUA CHIẾN THUẬT TỰ ĐỘNG</h3>
                <span className="rotation-card-sub">
                  Phát hiện dấu hiệu mỏi cơ sinh học và nguy cơ chấn thương tiếp đất
                </span>
              </div>
            </div>
            <span className="urgency-pill critical">KHẨN CẤP</span>
          </div>

          <div className="rotation-alerts-list">
            {activeAlerts.map((alert, index) => (
              <div key={index} className="rotation-item-banner">
                {/* Visual Swap Matchup */}
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
                    <span className="swap-arrow-label">XOAY TUA</span>
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

                {/* Tactical Explanation & Action */}
                <div className="rotation-advice-box">
                  <div className="advice-text-block">
                    <p className="advice-reason">{alert.reason}</p>
                    <p className="advice-tactic">💡 {alert.recommendedTactic}</p>
                  </div>
                  <button
                    className="btn-execute-swap"
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
                    <Zap size={16} />
                    <span>{swapping ? 'Đang thực hiện...' : 'Thực Hiện Thay Người Ngay'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tactical Pace Adjustment Alert Bar */}
      {squadData?.recommendedPaceAdjustment && (
        <div className="tactical-pace-advice-card">
          <div className="pace-icon-wrap">
            <ShieldAlert size={20} className="pace-icon" />
          </div>
          <div className="pace-content">
            <span className="pace-title">BIỆN PHÁP ĐIỀU CHỈNH NHỊP ĐỘ CHIẾN THUẬT:</span>
            <p className="pace-text">{squadData.recommendedPaceAdjustment}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          DUAL SQUAD BOARD: ON-FIELD STARTERS VS BENCH RESERVES
          ========================================================================= */}
      <div className="squad-board-grid">
        {/* Left Column: Cầu Thủ Đang Trên Sân */}
        <section className="squad-panel on-field-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <span className="panel-indicator-dot on-field" />
              <h3>CẦU THỦ TRÊN SÂN ({activeOnField.length})</h3>
            </div>
            <span className="panel-header-sub">Đang nhận dữ liệu Patch trực tiếp (m/s², °/s, bpm)</span>
          </div>

          <div className="athlete-cards-list">
            {activeOnField.map((player) => {
              const fatigue = player.fatigueIndex ?? 0;
              const isFatigued = fatigue >= 70;
              const isCritical = fatigue >= 80;

              return (
                <div
                  key={player.id}
                  className={`athlete-tactical-card ${isCritical ? 'critical' : isFatigued ? 'warning' : 'healthy'}`}
                >
                  <div className="card-top-row">
                    <div className="athlete-ident">
                      <span className="jersey-pill">#{player.jerseyNumber}</span>
                      <div>
                        <h4 className="athlete-name">{player.name}</h4>
                        <span className="athlete-pos-tag">
                          Vị trí: {player.position} • {player.deviceId || 'ESP32'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`risk-badge ${
                        player.injuryRiskLevel === 'CRITICAL'
                          ? 'risk-critical'
                          : player.injuryRiskLevel === 'HIGH'
                          ? 'risk-high'
                          : 'risk-normal'
                      }`}
                    >
                      {player.injuryRiskLevel === 'CRITICAL'
                        ? 'NGUY CƠ CHẤN THƯƠNG'
                        : player.injuryRiskLevel === 'HIGH'
                        ? 'QUÁ TẢI CƠ'
                        : 'BÌNH THƯỜNG'}
                    </span>
                  </div>

                  {/* Fatigue Gauge */}
                  <div className="athlete-fatigue-gauge">
                    <div className="gauge-labels">
                      <span className="gauge-title">Chỉ số mỏi thể lực</span>
                      <span className="gauge-pct">{fatigue}%</span>
                    </div>
                    <div className="gauge-track">
                      <div
                        className="gauge-bar"
                        style={{
                          width: `${Math.min(100, fatigue)}%`,
                          background: isCritical
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : isFatigued
                            ? 'linear-gradient(90deg, #38bdf8, #f59e0b)'
                            : 'linear-gradient(90deg, #10b981, #06b6d4)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Telemetry Stats Grid */}
                  <div className="athlete-metrics-row">
                    <div className="metric-cell">
                      <Timer size={14} className="cell-icon" />
                      <div className="metric-cell-text">
                        <span className="cell-val">{player.minutesPlayed || 0}'</span>
                        <span className="cell-lbl">Thời gian</span>
                      </div>
                    </div>

                    <div className="metric-cell">
                      <Activity size={14} className="cell-icon text-cyan" />
                      <div className="metric-cell-text">
                        <span className="cell-val">{player.jumpCount || 0}</span>
                        <span className="cell-lbl">Cú nhảy</span>
                      </div>
                    </div>

                    <div className="metric-cell">
                      <Flame size={14} className="cell-icon text-amber" />
                      <div className="metric-cell-text">
                        <span className="cell-val">{player.highImpactLandings || 0}</span>
                        <span className="cell-lbl">Va chạm mạnh</span>
                      </div>
                    </div>

                    <div className="metric-cell">
                      <Heart size={14} className="cell-icon text-rose" />
                      <div className="metric-cell-text">
                        <span className="cell-val">{player.heartRate || 145}</span>
                        <span className="cell-lbl">Nhịp tim</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Action: View Telemetry Detail & Quick Sub */}
                  <div className="athlete-card-actions-row">
                    <button
                      className="btn-athlete-inspect"
                      onClick={() => handleOpenAthleteMetrics(player)}
                    >
                      <Eye size={13} />
                      <span>Xem Thông Số Chi Tiết</span>
                    </button>

                    {benchSubstitutes.length > 0 && (
                      <button
                        className="btn-quick-sub"
                        onClick={() =>
                          handleExecuteSwap(
                            player.id,
                            benchSubstitutes[0].id,
                            player.name,
                            benchSubstitutes[0].name
                          )
                        }
                      >
                        <ArrowRightLeft size={13} />
                        <span>Xoay tua với #{benchSubstitutes[0].jerseyNumber} {benchSubstitutes[0].name}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Cầu Thủ Dự Bị (BENCH) */}
        <section className="squad-panel bench-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <span className="panel-indicator-dot bench" />
              <h3>CẦU THỦ DỰ BỊ SẴN SÀNG ({benchSubstitutes.length})</h3>
            </div>
            <span className="panel-header-sub">Sẵn sàng vào sân tác chiến</span>
          </div>

          <div className="athlete-cards-list">
            {benchSubstitutes.map((player) => (
              <div key={player.id} className="athlete-tactical-card bench-card">
                <div className="card-top-row">
                  <div className="athlete-ident">
                    <span className="jersey-pill bench">#{player.jerseyNumber}</span>
                    <div>
                      <h4 className="athlete-name">{player.name}</h4>
                      <span className="athlete-pos-tag">
                        Vị trí: {player.position} • {player.deviceId || 'ESP32'}
                      </span>
                    </div>
                  </div>
                  <span className="status-ready-pill">
                    <CheckCircle2 size={13} /> SẴN SÀNG
                  </span>
                </div>

                <div className="bench-recovery-meter">
                  <div className="gauge-labels">
                    <span className="gauge-title">Mức độ hồi phục thể lực</span>
                    <span className="gauge-pct text-emerald">
                      {Math.max(0, 100 - (player.fatigueIndex || 10))}%
                    </span>
                  </div>
                  <div className="gauge-track">
                    <div
                      className="gauge-bar"
                      style={{
                        width: `${Math.max(0, 100 - (player.fatigueIndex || 10))}%`,
                        background: '#10b981',
                      }}
                    />
                  </div>
                </div>

                <div className="athlete-metrics-row bench-meta">
                  <span>Nghỉ: {player.minutesPlayed === 0 ? 'Chưa vào sân' : `${player.minutesPlayed}' trước`}</span>
                  <span>Mỏi: {player.fatigueIndex || 5}%</span>
                </div>

                {/* Dual Action: View Telemetry Detail & Quick Sub */}
                <div className="athlete-card-actions-row">
                  <button
                    className="btn-athlete-inspect"
                    onClick={() => handleOpenAthleteMetrics(player)}
                  >
                    <Eye size={13} />
                    <span>Xem Thông Số Chi Tiết</span>
                  </button>

                  {activeOnField.length > 0 && (
                    <button
                      className="btn-quick-sub in-action"
                      onClick={() =>
                        handleExecuteSwap(
                          activeOnField[0].id,
                          player.id,
                          activeOnField[0].name,
                          player.name
                        )
                      }
                    >
                      <ArrowRightLeft size={13} />
                      <span>Thay cho #{activeOnField[0].jerseyNumber} {activeOnField[0].name}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =========================================================================
          REALTIME SQUAD FATIGUE DYNAMICS CHART
          ========================================================================= */}
      <section className="squad-telemetry-chart-card">
        <div className="chart-header-row">
          <div>
            <h3 className="chart-title">BIỂU ĐỒ DIỄN BIẾN THỂ LỰC TOÀN ĐỘI THEO THỜI GIAN THỰC</h3>
            <span className="chart-sub">
              Dữ liệu tính toán từ gia tốc m/s² và các xung va chạm tiếp đất từ các cảm biến ESP32-C3
            </span>
          </div>
          <button className="btn-refresh-chart" onClick={loadSquadAnalysis} title="Cập nhật dữ liệu">
            <RefreshCw size={15} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="chart-viewport" style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Area
                type="monotone"
                dataKey="avgFatigue"
                name="Chỉ số mỏi đội hình"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#fatigueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* =========================================================================
          ATHLETE DETAILED TELEMETRY & BIOMETRICS DRAWER / MODAL
          ========================================================================= */}
      {selectedAthlete && (
        <div className="athlete-modal-backdrop" onClick={handleCloseMetrics}>
          <div className="athlete-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-athlete-info">
                <span className="drawer-jersey">#{selectedAthlete.jerseyNumber}</span>
                <div>
                  <h2 className="drawer-name">{selectedAthlete.name}</h2>
                  <div className="drawer-sub-meta">
                    <span>Vị trí: {selectedAthlete.position}</span>
                    <span>•</span>
                    <span className="drawer-patch-id">
                      <Cpu size={13} /> {selectedAthlete.deviceId || 'SSS-PATCH-001'}
                    </span>
                    <span>•</span>
                    <span className={`drawer-status-pill ${selectedAthlete.status === 'ON_FIELD' ? 'on-field' : 'bench'}`}>
                      {selectedAthlete.status === 'ON_FIELD' ? 'TRÊN SÂN' : 'DỰ BỊ'}
                    </span>
                  </div>
                </div>
              </div>

              <button className="btn-drawer-close" onClick={handleCloseMetrics} title="Đóng bảng thông số">
                <X size={20} />
              </button>
            </div>

            {loadingMetrics ? (
              <div className="drawer-loading">
                <div className="coach-spinner" />
                <span>Đang trích xuất tín hiệu IMU & Biometrics thời gian thực...</span>
              </div>
            ) : (
              <div className="drawer-content-body">
                {/* 4 Essential Biometric Metrics Cards */}
                <div className="drawer-metrics-grid">
                  <div className="drawer-card hr">
                    <div className="drawer-card-label">
                      <Heart size={16} className="text-rose pulse-icon" />
                      <span>Nhịp Tim Tức Thời</span>
                    </div>
                    <div className="drawer-card-val">
                      <span>{athleteMetrics?.heartRate || selectedAthlete.heartRate || 140}</span>
                      <span className="unit">bpm</span>
                    </div>
                    <span className="drawer-card-hint">Vùng nhịp tim: Aerobic Threshold</span>
                  </div>

                  <div className="drawer-card fatigue">
                    <div className="drawer-card-label">
                      <Flame size={16} className="text-amber" />
                      <span>Chỉ Số Mỏi Thể Lực</span>
                    </div>
                    <div className="drawer-card-val">
                      <span>{athleteMetrics?.fatigueIndex || selectedAthlete.fatigueIndex || 25}%</span>
                      <span className={`risk-pill ${(athleteMetrics?.injuryRiskLevel || selectedAthlete.injuryRiskLevel || 'LOW').toLowerCase()}`}>
                        {athleteMetrics?.injuryRiskLevel || selectedAthlete.injuryRiskLevel || 'AN TOÀN'}
                      </span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${Math.min(100, athleteMetrics?.fatigueIndex || selectedAthlete.fatigueIndex || 25)}%`,
                          backgroundColor:
                            (athleteMetrics?.fatigueIndex || selectedAthlete.fatigueIndex) >= 80
                              ? '#ef4444'
                              : (athleteMetrics?.fatigueIndex || selectedAthlete.fatigueIndex) >= 60
                              ? '#f59e0b'
                              : '#10b981',
                        }}
                      />
                    </div>
                  </div>

                  <div className="drawer-card jumps">
                    <div className="drawer-card-label">
                      <Activity size={16} className="text-cyan" />
                      <span>Số Cú Bật Nhảy</span>
                    </div>
                    <div className="drawer-card-val">
                      <span>{athleteMetrics?.jumpCount ?? selectedAthlete.jumpCount ?? 0}</span>
                      <span className="unit">lần</span>
                    </div>
                    <span className="drawer-card-hint">
                      Tiếp đất xung chấn cao: <strong>{athleteMetrics?.highImpactLandings ?? selectedAthlete.highImpactLandings ?? 0}</strong> lần (&gt;4.5g)
                    </span>
                  </div>

                  <div className="drawer-card intensity">
                    <div className="drawer-card-label">
                      <Gauge size={16} className="text-emerald" />
                      <span>Cường Độ Vận Động</span>
                    </div>
                    <div className="drawer-card-val">
                      <span>{Math.round(athleteMetrics?.currentIntensity || selectedAthlete.currentIntensity || 65)}%</span>
                      <span className="unit">workload</span>
                    </div>
                    <span className="drawer-card-hint">Thời gian thi đấu: {athleteMetrics?.minutesPlayed || selectedAthlete.minutesPlayed || 0} phút</span>
                  </div>
                </div>

                {/* Realtime Kinematics Chart (Accelerations m/s² and Gyro deg/s) */}
                <div className="drawer-chart-box">
                  <div className="chart-box-top">
                    <div>
                      <h4>TÍN HIỆU ĐỘNG HỌC THỜI GIAN THỰC (IMU TELEMETRY STREAM)</h4>
                      <p>Đo gia tốc 3 trục (m/s²) và vận tốc góc (°/s) từ miếng dán thông minh Second Skin</p>
                    </div>
                    <div className="unit-tags-row">
                      <span className="tag-m-s">Gia tốc: m/s²</span>
                      <span className="tag-deg-s">Vận tốc góc: °/s</span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={athleteMetrics?.recentTelemetry || []}
                        margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#64748b"
                          tickFormatter={(val) => {
                            if (!val) return '';
                            const d = new Date(val);
                            return `${d.getMinutes()}:${d.getSeconds() < 10 ? '0' : ''}${d.getSeconds()}`;
                          }}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[-10, 20]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: '6px' }} />
                        <Line
                          type="monotone"
                          dataKey="accZ"
                          name="Gia tốc thẳng đứng az (m/s²)"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="accX"
                          name="Gia tốc ngang ax (m/s²)"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="accY"
                          name="Gia tốc dọc ay (m/s²)"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Coach Biomechanical Analysis & Tactical Advice */}
                <div className="drawer-ai-advice-panel">
                  <div className="ai-advice-header">
                    <ShieldAlert size={18} color="#f59e0b" />
                    <span>TƯ VẤN HỒI PHỤC & CHIẾN THUẬT TỪ HỆ THỐNG AI</span>
                  </div>
                  <div className="ai-advice-body">
                    <div className="advice-item">
                      <span className="advice-title">Khuyến nghị Y sinh học:</span>
                      <p className="advice-desc">
                        {athleteMetrics?.recoveryAdvice || 'Thể trạng VĐV duy trì ở mức cân bằng tải trọng. Tiếp tục theo dõi nhịp tim.'}
                      </p>
                    </div>
                    <div className="advice-item">
                      <span className="advice-title">Đề xuất Thay thế / Chiến thuật:</span>
                      <p className="advice-desc">
                        {athleteMetrics?.tacticalActionHint || 'Duy trì quyền điều phối vị trí thi đấu trên sân.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Substitution Actions inside Drawer */}
                <div className="drawer-footer-actions">
                  {selectedAthlete.status === 'ON_FIELD' ? (
                    benchSubstitutes.length > 0 ? (
                      <button
                        className="btn-drawer-sub out"
                        onClick={() =>
                          handleExecuteSwap(
                            selectedAthlete.id,
                            benchSubstitutes[0].id,
                            selectedAthlete.name,
                            benchSubstitutes[0].name
                          )
                        }
                      >
                        <ArrowRightLeft size={16} />
                        <span>Rút ra nghỉ - Thay bằng #{benchSubstitutes[0].jerseyNumber} {benchSubstitutes[0].name}</span>
                      </button>
                    ) : (
                      <span className="drawer-no-bench-note">Đội hình dự bị hiện chưa có cầu thủ sẵn sàng</span>
                    )
                  ) : (
                    activeOnField.length > 0 && (
                      <button
                        className="btn-drawer-sub in"
                        onClick={() =>
                          handleExecuteSwap(
                            activeOnField[0].id,
                            selectedAthlete.id,
                            activeOnField[0].name,
                            selectedAthlete.name
                          )
                        }
                      >
                        <ArrowRightLeft size={16} />
                        <span>Đưa vào sân - Thay thế #{activeOnField[0].jerseyNumber} {activeOnField[0].name}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

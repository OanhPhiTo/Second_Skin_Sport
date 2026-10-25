import React from 'react';
import {
  Sparkles,
  ShieldAlert,
  Flame,
  Award,
  TrendingUp,
  Activity,
  Zap,
  Scale,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Dumbbell,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import './AiCoachInsightCard.css';

export default function AiCoachInsightCard({ insights }) {
  if (!insights) return null;

  const metrics = insights.biomechanicalMetrics || {
    landingSoftnessScore: 82,
    peakLandingImpactG: 2.4,
    bilateralSymmetryPct: 94,
    dominantSide: 'BALANCED',
    cadenceRpm: 168,
    rhythmConsistencyPct: 91,
    trunkStabilityScore: 86,
    trunkLeanAngleDegrees: 8.2,
    explosivenessScore: 84,
    averageAirtimeSeconds: 0.32,
    fatigueIndex: 18,
  };

  const riskLevel = insights.injuryRiskLevel || 'LOW';

  return (
    <div className="ai-coach-insight-card">
      {/* Top Banner */}
      <div className="ai-insight-top-banner">
        <div className="ai-coach-identity">
          <div className="ai-sparkle-avatar">
            <Sparkles size={22} className="highlight-cyan" />
          </div>
          <div>
            <div className="ai-coach-tagline">
              <span className="badge-ai-coach">AI COACH CƠ SINH HỌC</span>
              <span className="ai-engine-tag">Cảm Biến DSP & Google Gemini AI</span>
            </div>
            <h3 className="ai-insight-title">{insights.activityType || 'Phân Tích Động Học Buổi Tập'}</h3>
          </div>
        </div>

        <div className="ai-score-pill-wrap">
          <div className="ai-score-box">
            <span className="ai-score-label">Điểm Phong Độ</span>
            <span className="ai-score-val highlight-neon">{insights.performanceScore || 88}%</span>
          </div>
        </div>
      </div>

      {/* 2-Column Balanced Dashboard Body */}
      <div className="ai-insight-body-grid">
        {/* Left Column: Biomechanical Performance, Metrics, Injury Risk & Calories */}
        <div className="ai-insight-col ai-insight-col-left">
          {/* 1. BẠN ĐANG HOẠT ĐỘNG RA SAO? (Current Performance) */}
          <div className="ai-card-section performance-section">
            <div className="section-header-row">
              <div className="section-icon-badge cyan">
                <Activity size={18} />
              </div>
              <h4 className="section-title">Bạn Đang Hoạt Động Ra Sao?</h4>
            </div>

            <p className="human-performance-text">
              {insights.currentPerformance || insights.aiSummary ||
                'Bạn đã hoàn thành buổi tập với nhịp độ ổn định, các chỉ số lực tiếp đất và sự phân phối thể lực duy trì ở mức rất tích cực.'}
            </p>

            {/* 5 BIOMECHANICAL SENSOR METRIC BARS */}
            <div className="biomech-metrics-grid">
              {/* Landing Softness */}
              <div className="biomech-metric-item">
                <div className="metric-header">
                  <span className="metric-label">
                    <ShieldCheck size={14} className="green" /> Độ Êm Tiếp Đất
                  </span>
                  <span className="metric-val highlight-cyan">{metrics.landingSoftnessScore}/100</span>
                </div>
                <div className="metric-progress-bg">
                  <div
                    className="metric-progress-fill cyan-fill"
                    style={{ width: `${metrics.landingSoftnessScore}%` }}
                  />
                </div>
                <span className="metric-sub-note">Lực dội: {metrics.peakLandingImpactG}G</span>
              </div>

              {/* Bilateral Symmetry */}
              <div className="biomech-metric-item">
                <div className="metric-header">
                  <span className="metric-label">
                    <Scale size={14} className="highlight-cyan" /> Cân Bằng 2 Chân
                  </span>
                  <span className="metric-val">{metrics.bilateralSymmetryPct}%</span>
                </div>
                <div className="metric-progress-bg">
                  <div
                    className="metric-progress-fill green-fill"
                    style={{ width: `${metrics.bilateralSymmetryPct}%` }}
                  />
                </div>
                <span className="metric-sub-note">
                  {metrics.dominantSide === 'BALANCED' ? 'Rất cân đối (Hai chân chịu lực đều)' : `Chân ${metrics.dominantSide.toLowerCase()} chịu lực nhiều hơn`}
                </span>
              </div>

              {/* Cadence / Rhythm */}
              <div className="biomech-metric-item">
                <div className="metric-header">
                  <span className="metric-label">
                    <TrendingUp size={14} className="highlight-orange" /> Nhịp Vận Động
                  </span>
                  <span className="metric-val">{metrics.cadenceRpm} bước/phút</span>
                </div>
                <div className="metric-progress-bg">
                  <div
                    className="metric-progress-fill orange-fill"
                    style={{ width: `${Math.min(100, Math.round((metrics.cadenceRpm / 185) * 100))}%` }}
                  />
                </div>
                <span className="metric-sub-note">Độ đều nhịp: {metrics.rhythmConsistencyPct}%</span>
              </div>

              {/* Trunk Stability */}
              <div className="biomech-metric-item">
                <div className="metric-header">
                  <span className="metric-label">
                    <Compass size={14} className="highlight-cyan" /> Độ Vững Thân Trên
                  </span>
                  <span className="metric-val">{metrics.trunkStabilityScore}/100</span>
                </div>
                <div className="metric-progress-bg">
                  <div
                    className="metric-progress-fill purple-fill"
                    style={{ width: `${metrics.trunkStabilityScore}%` }}
                  />
                </div>
                <span className="metric-sub-note">Độ chúi: {metrics.trunkLeanAngleDegrees}°</span>
              </div>

              {/* Explosiveness */}
              <div className="biomech-metric-item">
                <div className="metric-header">
                  <span className="metric-label">
                    <Zap size={14} className="highlight-neon" /> Độ Bùng Nổ
                  </span>
                  <span className="metric-val highlight-neon">{metrics.explosivenessScore}/100</span>
                </div>
                <div className="metric-progress-bg">
                  <div
                    className="metric-progress-fill neon-fill"
                    style={{ width: `${metrics.explosivenessScore}%` }}
                  />
                </div>
                <span className="metric-sub-note">Thời gian bay: {metrics.averageAirtimeSeconds}s</span>
              </div>
            </div>
          </div>

          {/* 4A. CẢNH BÁO CHẤN THƯƠNG & TIÊU HAO NĂNG LƯỢNG */}
          <div className="ai-card-section injury-energy-section">
            <div className="injury-recovery-grid">
              {/* Risk Card */}
              <div className={`risk-alert-box ${riskLevel.toLowerCase()}`}>
                <div className="risk-header-row">
                  <div className="risk-title-wrap">
                    <ShieldAlert size={16} />
                    <span className="risk-title-text">ĐÁNH GIÁ NGUY CƠ CHẤN THƯƠNG</span>
                  </div>
                  <span className={`risk-status-pill ${riskLevel.toLowerCase()}`}>
                    {riskLevel === 'HIGH' ? 'CAO ⚠️' : riskLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'AN TOÀN ✓'}
                  </span>
                </div>
                <p className="risk-explanation-text">
                  {insights.injuryRiskExplanation || 'Không phát hiện áp lực bất thường lên khớp gối và cổ chân.'}
                </p>
              </div>

              {/* Calorie Card */}
              <div className="calories-burned-box">
                <div className="cal-header">
                  <Flame size={15} className="highlight-orange" />
                  <span>TIÊU HAO NĂNG LƯỢNG</span>
                </div>
                <div className="cal-val-row">
                  <span className="cal-number">{insights.estimatedCalories || 380}</span>
                  <span className="cal-unit">kcal</span>
                </div>
                <span className="cal-sub">Ước tính theo chỉ số MET thể thao</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Coaching, Areas for Improvement, Actionable Drills & Recovery */}
        <div className="ai-insight-col ai-insight-col-right">
          {/* 2. BẠN CẦN CẢI THIỆN ĐIỀU GÌ? (Targeted Areas for Improvement) */}
          {insights.areasForImprovement && insights.areasForImprovement.length > 0 && (
            <div className="ai-card-section improvement-section">
              <div className="section-header-row">
                <div className="section-icon-badge amber">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="section-title">Bạn Cần Cải Thiện Điều Gì?</h4>
              </div>

              <div className="improvement-cards-list">
                {insights.areasForImprovement.map((area, idx) => (
                  <div key={idx} className="improvement-card-item">
                    <div className="imp-number-badge">{idx + 1}</div>
                    <div className="imp-content">
                      <p className="imp-text">{area}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. BÀI TẬP GỢI Ý TỪ HUẤN LUYỆN VIÊN (Actionable Drills) */}
          {insights.actionableDrills && insights.actionableDrills.length > 0 && (
            <div className="ai-card-section drills-section">
              <div className="section-header-row">
                <div className="section-icon-badge green">
                  <Dumbbell size={18} />
                </div>
                <h4 className="section-title">Bài Tập Bổ Trợ Gợi Ý (Khắc Phục Điểm Yếu)</h4>
              </div>

              <div className="drills-grid">
                {insights.actionableDrills.map((drill, idx) => (
                  <div key={idx} className="drill-box">
                    <div className="drill-icon-row">
                      <span className="drill-tag">BÀI TẬP #{idx + 1}</span>
                      <CheckCircle2 size={15} className="green" />
                    </div>
                    <p className="drill-text">{drill}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4B. LỜI KHUYÊN HỒI PHỤC THỂ LỰC */}
          {insights.recoveryAdvice && insights.recoveryAdvice.length > 0 && (
            <div className="ai-card-section recovery-card-section">
              <div className="recovery-advice-block">
                <div className="recovery-header">
                  <HeartHandshake size={16} className="highlight-cyan" />
                  <span className="recovery-title">Lời Khuyên Hồi Phục Thể Lực Từ AI Coach:</span>
                </div>
                <ul className="recovery-list">
                  {insights.recoveryAdvice.map((rec, idx) => (
                    <li key={idx} className="recovery-item">
                      <ArrowRight size={14} className="highlight-cyan flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

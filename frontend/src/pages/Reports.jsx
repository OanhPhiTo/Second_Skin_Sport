import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  User,
  Activity,
  Cpu,
  Award,
  Zap,
} from 'lucide-react';
import './Reports.css';

export default function Reports() {
  const [athlete, setAthlete] = useState('Alex Johnson');
  const [sport, setSport] = useState('Basketball');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [isGenerated, setIsGenerated] = useState(true);
  const [notification, setNotification] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerated(true);
    setNotification('Report generated successfully with latest sensor analytics.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent =
      'Category,Metric,Value,Benchmark\n' +
      'Performance,Overall Score,91%,Elite\n' +
      'Performance,Average Acceleration,3.21 m/s²,High\n' +
      'Performance,Average Speed,18.4 km/h,Optimal\n' +
      'Activity,Total Jumps,56 jumps,High Intensity\n' +
      'Activity,Direction Changes,143 pivots,Agile\n' +
      'Sensor,Patch ID,SSS-PATCH-001,Active\n' +
      'Sensor,IMU Calibration,0.02% drift,Passed\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SecondSkin_Report_${sport}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification('CSV Report exported successfully.');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Performance Reports</h1>
          <p className="hero-subtitle">
            Generate formal athletic evaluations, biometric audits, and exportable reports.
          </p>
        </div>

        {notification && (
          <div className="action-notification">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Report Generator Controls */}
      <div className="card report-config-card">
        <div className="card-header">
          <h3 className="card-title">Generate Custom Report</h3>
          <span className="badge badge-sport">ANALYTICS ENGINE</span>
        </div>

        <form onSubmit={handleGenerate} className="report-controls-grid">
          <div className="form-group">
            <label>Athlete Profile</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <select
                value={athlete}
                onChange={(e) => setAthlete(e.target.value)}
                className="form-select with-icon"
              >
                <option value="Alex Johnson">Alex Johnson (Pro Basketball)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Running Club)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sport Modality</label>
            <div className="input-icon-wrap">
              <Activity size={16} className="input-icon" />
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="form-select with-icon"
              >
                <option value="Basketball">Basketball (Bóng rổ)</option>
                <option value="Running">Running (Chạy bộ)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div className="input-icon-wrap">
              <Calendar size={16} className="input-icon" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select with-icon"
              >
                <option value="Today">Today (Current Sessions)</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Season 2026">Season 2026</option>
              </select>
            </div>
          </div>

          <div className="report-btn-wrap">
            <button type="submit" className="btn btn-primary btn-generate">
              <Zap size={16} />
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* Generated Report Sheet */}
      {isGenerated && (
        <div className="card report-sheet-card">
          <div className="sheet-header">
            <div className="sheet-brand">
              <span className="sheet-logo-title">SECOND SKIN SPORT</span>
              <span className="sheet-doc-type">OFFICIAL ATHLETIC BIOMETRIC REPORT</span>
            </div>
            <div className="export-action-btns">
              <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
                <Download size={14} /> Export PDF
              </button>
              <button className="btn btn-outline-cyan btn-sm" onClick={handleExportCSV}>
                <FileSpreadsheet size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="sheet-meta-bar">
            <div>
              <strong>Athlete:</strong> {athlete}
            </div>
            <div>
              <strong>Sport:</strong> {sport}
            </div>
            <div>
              <strong>Date Period:</strong> {dateRange}
            </div>
            <div>
              <strong>Patch Device:</strong> SSS-PATCH-001 (BLE 5.2)
            </div>
          </div>

          {/* Report Sections */}
          <div className="report-sections-container">
            {/* 1. Performance Summary */}
            <div className="report-subblock">
              <div className="subblock-header">
                <Award size={18} className="highlight-cyan" />
                <h4>1. Performance Summary</h4>
              </div>
              <div className="report-stats-table">
                <div className="report-row">
                  <span>Overall Performance Score</span>
                  <strong className="highlight-neon">91% (Elite Tier)</strong>
                </div>
                <div className="report-row">
                  <span>Average Acceleration</span>
                  <strong>3.21 m/s² (+0.32 vs bench)</strong>
                </div>
                <div className="report-row">
                  <span>Average Velocity</span>
                  <strong>18.4 km/h</strong>
                </div>
                <div className="report-row">
                  <span>Estimated Total Energy Expenditure</span>
                  <strong>840 kcal</strong>
                </div>
              </div>
            </div>

            {/* 2. Activity Summary */}
            <div className="report-subblock">
              <div className="subblock-header">
                <Activity size={18} className="highlight-cyan" />
                <h4>2. Activity & Movement Summary</h4>
              </div>
              <div className="report-stats-table">
                <div className="report-row">
                  <span>Total Vertical Jumps</span>
                  <strong>56 jumps</strong>
                </div>
                <div className="report-row">
                  <span>Peak Elevation</span>
                  <strong>46 cm</strong>
                </div>
                <div className="report-row">
                  <span>Direction Changes / Pivots</span>
                  <strong>143 cuts</strong>
                </div>
                <div className="report-row">
                  <span>Time in Anaerobic Exertion (&gt;85%)</span>
                  <strong>24 min 30 sec</strong>
                </div>
              </div>
            </div>

            {/* 3. Sensor Summary */}
            <div className="report-subblock">
              <div className="subblock-header">
                <Cpu size={18} className="highlight-cyan" />
                <h4>3. Sensor & Hardware Diagnostics</h4>
              </div>
              <div className="report-stats-table">
                <div className="report-row">
                  <span>Sampling Frequency</span>
                  <strong>100 Hz (Tri-axial IMU)</strong>
                </div>
                <div className="report-row">
                  <span>Data Packet Drop Rate</span>
                  <strong>0.00% (Lossless BLE transmission)</strong>
                </div>
                <div className="report-row">
                  <span>Battery Consumption</span>
                  <strong>4% per 45-min session</strong>
                </div>
                <div className="report-row">
                  <span>Skin Adhesion & Contact Stability</span>
                  <strong className="highlight-neon">Optimal (100% adherence)</strong>
                </div>
              </div>
            </div>

            {/* 4. Coach & Biomechanics Conclusion */}
            <div className="report-subblock full-width">
              <div className="subblock-header">
                <FileText size={18} className="highlight-cyan" />
                <h4>4. Coach & AI Biomechanics Recommendations</h4>
              </div>
              <p className="recommendation-text">
                The athlete demonstrated exceptional explosive power during lateral cuts and transition phases.
                Deceleration mechanics remained stable with minimal joint stress recorded. Recommend maintaining current plyometric jump load while optimizing hydration in anaerobic clusters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

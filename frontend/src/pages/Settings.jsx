import React, { useState } from 'react';
import {
  User,
  Cpu,
  Bell,
  Sliders,
  CheckCircle2,
  Save,
  Shield,
  Smartphone,
} from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const [name, setName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.athlete@secondskin.io');
  const [preferredSport, setPreferredSport] = useState('Basketball');
  const [units, setUnits] = useState('Metric (m/s², km/h, cm)');
  const [samplingRate, setSamplingRate] = useState('100 Hz');
  const [autoSync, setAutoSync] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [fatigueWarning, setFatigueWarning] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage('Configuration and device calibration saved successfully.');
    setTimeout(() => setSavedMessage(''), 3500);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Settings & Configuration</h1>
          <p className="hero-subtitle">
            Manage your biometric athlete profile, sensor connectivity parameters, and app preferences.
          </p>
        </div>

        {savedMessage && (
          <div className="action-notification">
            <CheckCircle2 size={16} />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="settings-grid">
        {/* 1. Athlete Profile */}
        <div className="card settings-section-card">
          <div className="settings-card-header">
            <div className="settings-header-icon">
              <User size={18} />
            </div>
            <div>
              <h3>Athlete Profile</h3>
              <p className="card-subtitle">Personal data utilized for AI motion baseline calibration</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Primary Sport Focus</label>
              <select
                value={preferredSport}
                onChange={(e) => setPreferredSport(e.target.value)}
                className="form-select"
              >
                <option value="Basketball">Basketball (Bật nhảy & Phản xạ đổi hướng)</option>
                <option value="Running">Running (Nhịp bước, Tiếp đất & Bền bỉ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Device & Sensor Settings */}
        <div className="card settings-section-card">
          <div className="settings-card-header">
            <div className="settings-header-icon">
              <Cpu size={18} />
            </div>
            <div>
              <h3>Device & Sensor Settings</h3>
              <p className="card-subtitle">Hardware sampling, IMU sensitivity, and Bluetooth sync</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Telemetry Sampling Frequency</label>
              <select
                value={samplingRate}
                onChange={(e) => setSamplingRate(e.target.value)}
                className="form-select"
              >
                <option value="50 Hz">50 Hz (Power Saving - Low Power Mode)</option>
                <option value="100 Hz">100 Hz (Recommended - Balanced)</option>
                <option value="200 Hz">200 Hz (Ultra High Dynamic Motion)</option>
              </select>
            </div>

            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Auto-Sync on Session Finish</span>
                <p className="toggle-desc">Automatically upload buffered IMU packets via BLE</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Hardware IMU Calibration</span>
                <p className="toggle-desc">Auto-zero gyroscopic drift at session start</p>
              </div>
              <span className="badge badge-success">CALIBRATED</span>
            </div>
          </div>
        </div>

        {/* 3. Notification Settings */}
        <div className="card settings-section-card">
          <div className="settings-card-header">
            <div className="settings-header-icon">
              <Bell size={18} />
            </div>
            <div>
              <h3>Biometric Notifications</h3>
              <p className="card-subtitle">Real-time alerts for exertion thresholds and fatigue</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Fatigue Risk Alert</span>
                <p className="toggle-desc">Warn when jump deceleration mechanics degrade &gt;15%</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={fatigueWarning}
                  onChange={(e) => setFatigueWarning(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Push Notifications</span>
                <p className="toggle-desc">Send session summary report upon device disconnect</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Application Settings */}
        <div className="card settings-section-card">
          <div className="settings-card-header">
            <div className="settings-header-icon">
              <Sliders size={18} />
            </div>
            <div>
              <h3>Application & System</h3>
              <p className="card-subtitle">Measurement units and system theme</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Measurement Units</label>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="form-select"
              >
                <option value="Metric (m/s², km/h, cm)">Metric (m/s², km/h, cm)</option>
                <option value="Imperial (G, mph, inches)">Imperial (G, mph, inches)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Active Theme</label>
              <div className="theme-preview-pill">
                <span className="status-dot connected" />
                <span>Second Skin Dark Futuristic (Default)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="settings-actions-bar">
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

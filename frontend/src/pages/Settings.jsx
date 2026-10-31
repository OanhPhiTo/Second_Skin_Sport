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
import { authService } from '../services/api';
import bleService from '../services/bleService';
import { useBle } from '../context/BleContext';
import './Settings.css';

export default function Settings() {
  const { bleStatus } = useBle();
  const currentUser = authService.getCurrentUser();
  const readSetting = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(`secondskin_setting_${key}`)) ?? fallback; } catch { return fallback; }
  };
  const [name, setName] = useState(() => currentUser.name || 'Vận động viên');
  const [email, setEmail] = useState(() => currentUser.email || '');
  const [preferredSport, setPreferredSport] = useState(() => readSetting('preferredSport', 'Basketball'));
  const [units, setUnits] = useState(() => readSetting('units', 'Hệ mét (m/s², km/h, cm)'));
  const [samplingRate, setSamplingRate] = useState(() => readSetting('samplingRate', '100 Hz'));
  const [autoSync, setAutoSync] = useState(() => readSetting('autoSync', true));
  const [pushAlerts, setPushAlerts] = useState(() => readSetting('pushAlerts', true));
  const [fatigueWarning, setFatigueWarning] = useState(() => readSetting('fatigueWarning', true));
  const [savedMessage, setSavedMessage] = useState('');
  const [calibrationStatus, setCalibrationStatus] = useState('Chưa kết nối thiết bị');

  const handleSave = async (e) => {
    e.preventDefault();
    const settings = { name, email, preferredSport, units, samplingRate, autoSync, pushAlerts, fatigueWarning };
    Object.entries(settings).forEach(([key, value]) => localStorage.setItem(`secondskin_setting_${key}`, JSON.stringify(value)));
    try {
      await authService.updateProfile({ name, preferredSport });
      setSavedMessage('Đã lưu hồ sơ vào tài khoản và cập nhật cấu hình ứng dụng.');
    } catch {
      setSavedMessage('Backend chưa sẵn sàng; hồ sơ đã được lưu tạm trên thiết bị này.');
    }
    setTimeout(() => setSavedMessage(''), 3500);
  };

  const handleCalibration = async () => {
    if (bleStatus !== 'connected') {
      setCalibrationStatus('Hãy kết nối ESP32 qua Bluetooth trước');
      return;
    }
    try {
      await bleService.sendSensorConfig({ samplingRate, calibrate: true });
      setCalibrationStatus(`Đã gửi lệnh hiệu chuẩn (${samplingRate})`);
    } catch (error) {
      setCalibrationStatus(error.message || 'Không thể hiệu chuẩn thiết bị');
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Cài Đặt & Cấu Hình</h1>
          <p className="hero-subtitle">
            Quản lý hồ sơ vận động viên, thông số kết nối cảm biến và tùy chọn ứng dụng.
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
              <h3>Hồ Sơ Vận Động Viên</h3>
              <p className="card-subtitle">Dữ liệu cá nhân dùng để hiệu chuẩn đường cơ sở chuyển động của AI</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Môn Thể Thao Trọng Tâm</label>
              <select
                value={preferredSport}
                onChange={(e) => setPreferredSport(e.target.value)}
                className="form-select"
              >
                <option value="Basketball">Bóng rổ (Bật nhảy & Phản xạ đổi hướng)</option>
                <option value="Running">Chạy bộ (Nhịp bước, Tiếp đất & Bền bỉ)</option>
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
              <h3>Cài Đặt Thiết Bị & Cảm Biến</h3>
              <p className="card-subtitle">Tần số lấy mẫu phần cứng, độ nhạy IMU và đồng bộ Bluetooth</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Tần số lấy mẫu đo lường</label>
              <select
                value={samplingRate}
                onChange={(e) => setSamplingRate(e.target.value)}
                className="form-select"
              >
                <option value="50 Hz">50 Hz (Tiết kiệm pin - Tiêu thụ thấp)</option>
                <option value="100 Hz">100 Hz (Khuyên dùng - Cân bằng)</option>
                <option value="200 Hz">200 Hz (Chuyển động cường độ cực cao)</option>
              </select>
            </div>

            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Tự động đồng bộ khi kết thúc buổi tập</span>
                <p className="toggle-desc">Tự động tải lên các gói tin IMU được đệm qua BLE</p>
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
                <span className="toggle-title">Hiệu chuẩn phần cứng IMU</span>
                <p className="toggle-desc">Tự động khử trôi con quay hồi chuyển khi bắt đầu buổi tập</p>
              </div>
              <div className="calibration-control">
                <span className={`calibration-status ${bleStatus === 'connected' ? 'ready' : ''}`}>{calibrationStatus}</span>
                <button type="button" className="btn btn-outline-cyan btn-sm" onClick={handleCalibration}>
                  Hiệu chuẩn ngay
                </button>
              </div>
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
              <h3>Thông Báo Sinh Trắc Học</h3>
              <p className="card-subtitle">Cảnh báo theo thời gian thực về ngưỡng gắng sức và mức độ mệt mỏi</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="toggle-setting-row">
              <div>
                <span className="toggle-title">Cảnh báo nguy cơ mệt mỏi & quá tải</span>
                <p className="toggle-desc">Cảnh báo khi kỹ thuật giảm chấn tiếp đất suy giảm &gt;15%</p>
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
                <span className="toggle-title">Thông báo đẩy</span>
                <p className="toggle-desc">Gửi báo cáo tóm tắt buổi tập khi thiết bị ngắt kết nối</p>
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
              <h3>Ứng Dụng & Hệ Thống</h3>
              <p className="card-subtitle">Đơn vị đo lường và giao diện hệ thống</p>
            </div>
          </div>

          <div className="settings-fields-stack">
            <div className="form-group">
              <label>Đơn vị đo lường</label>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="form-select"
              >
                <option value="Hệ mét (m/s², km/h, cm)">Hệ mét (m/s², km/h, cm)</option>
                <option value="Hệ Anh-Mỹ (G, mph, inches)">Hệ Anh-Mỹ (G, mph, inches)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Giao diện đang dùng</label>
              <div className="theme-preview-pill">
                <span className="status-dot connected" />
                <span>Second Skin Dark Futuristic (Mặc định)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="settings-actions-bar">
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Lưu Thay Đổi
          </button>
        </div>
      </form>
    </div>
  );
}

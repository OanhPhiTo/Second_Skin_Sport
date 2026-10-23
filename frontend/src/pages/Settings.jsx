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
  const [units, setUnits] = useState('Hệ mét (m/s², km/h, cm)');
  const [samplingRate, setSamplingRate] = useState('100 Hz');
  const [autoSync, setAutoSync] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [fatigueWarning, setFatigueWarning] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage('Cấu hình và hiệu chuẩn thiết bị đã được lưu thành công.');
    setTimeout(() => setSavedMessage(''), 3500);
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
              <span className="badge badge-success">ĐÃ HIỆU CHUẨN</span>
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

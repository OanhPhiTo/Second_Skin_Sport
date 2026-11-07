import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Radio,
  RefreshCw,
  Power,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wifi,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Send,
  Loader2,
  Globe,
  Compass,
  Gauge,
  Navigation,
  Timer,
  Play,
  Check,
  Flame,
  Award,
  Sparkles,
  ShieldCheck,
  Footprints,
} from 'lucide-react';
import SensorCard from '../components/SensorCard';
import KinematicChart from '../components/KinematicChart';
import { deviceService, sensorDataService, sessionService } from '../services/api';
import { useBle } from '../context/BleContext';
import { useUnit } from '../context/UnitContext';
import './Sensors.css';

const SPORT_OPTIONS = [
  { id: 'Basketball', label: 'Bóng rổ', icon: '🏀' },
  { id: 'Running', label: 'Chạy bộ', icon: '🏃' },
  { id: 'Volleyball', label: 'Bóng chuyền', icon: '🏐' },
];

export default function Sensors() {
  const { formatHeight, formatAccel } = useUnit();
  const {
    bleStatus,
    bleDevice,
    bleError,
    livePacketCount,
    bleTelemetry,
    sensorStatus: liveSensorStatus,
    selectedSport,
    setSelectedSport,
    autoSession: autoSessionDisplay,
    actionMessage: globalActionMessage,
    wifiSending,
    wifiFeedback,
    connectBle,
    disconnectBle,
    startTrackingSession,
    finalizeAutoSession,
    sendWifiConfig,
  } = useBle();

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [backendSensorStatus, setBackendSensorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [localActionMessage, setLocalActionMessage] = useState('');

  // Wi-Fi Provisioning Form State
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080/api/v1/sensor/batches');

  const actionMessage = globalActionMessage || localActionMessage;
  // Backend device registration is not a live BLE connection. Once GATT is
  // disconnected, force all realtime cards offline until a new BLE stream starts.
  const sensorStatus = bleStatus === 'connected'
    ? liveSensorStatus
    : backendSensorStatus
      ? { ...backendSensorStatus, connected: false }
      : null;

  const loadData = async () => {
    try {
      const [devList, status] = await Promise.all([
        deviceService.getAll(),
        deviceService.getStatus(),
      ]);
      setDevices(devList);
      if (!backendSensorStatus) {
        setBackendSensorStatus(status);
      }
      if (devList.length > 0 && !selectedDevice) {
        setSelectedDevice(devList[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      // If BLE is not active, poll mock/backend status
      if (bleStatus !== 'connected') {
        try {
          const status = await deviceService.getStatus();
          setBackendSensorStatus(status);
        } catch (e) {}
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [bleStatus]);

  // Handle BLE Connect button
  const handleBleConnect = async () => {
    try {
      await connectBle();
    } catch (err) {
      // Handled in BleContext
    }
  };

  // Handle BLE Disconnect button
  const handleBleDisconnect = async () => {
    try {
      await disconnectBle();
    } catch (err) {
      console.error('BLE disconnect error:', err);
    }
  };

  // Handle Send Wi-Fi Config to ESP32 over BLE
  const handleSendWifi = async (e) => {
    e.preventDefault();
    if (!wifiSsid) {
      alert('Vui lòng nhập Tên Wi-Fi (SSID)');
      return;
    }
    try {
      await sendWifiConfig({
        ssid: wifiSsid,
        password: wifiPassword,
        backendUrl: backendUrl,
      });
    } catch (err) {
      // Feedback handled in BleContext
    }
  };

  const handleConnectToggle = async (_deviceId, currentConnected) => {
    try {
      if (currentConnected) {
        await disconnectBle();
        setLocalActionMessage('Thiết bị BLE đã ngắt kết nối.');
      } else {
        await handleBleConnect();
        setLocalActionMessage('Đã kết nối thiết bị BLE thực tế.');
      }
      loadData();
      setTimeout(() => setLocalActionMessage(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncData = async (deviceId) => {
    setSyncing(true);
    try {
      await deviceService.sync(deviceId);
      setLocalActionMessage('Đã đồng bộ toàn bộ dữ liệu cảm biến lưu trong bộ nhớ.');
      setTimeout(() => setLocalActionMessage(''), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const liveDevices = bleStatus === 'connected'
    ? devices.filter((device) => !bleDevice?.deviceId || device.deviceId === bleDevice.deviceId)
    : [];
  const displayDevices = liveDevices.length > 0
    ? liveDevices
    : bleStatus === 'connected' && bleDevice
      ? [{
          id: 'ble-live',
          deviceId: bleDevice.deviceId,
          deviceName: bleDevice.deviceName || 'Thiết bị BLE đang kết nối',
        }]
      : [];

  return (
    <div className="sensors-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Quản Lý Cảm Biến & Thiết Bị</h1>
          <p className="hero-subtitle">
            Kết nối thiết bị cảm biến Second Skin để theo dõi và phân tích vận động trong thời gian thực.
          </p>
        </div>

        {actionMessage && (
          <div className="action-notification">
            <CheckCircle2 size={16} />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* BLE BLUETOOTH DIRECT HARDWARE CONTROLLER */}
      <div className="card ble-controller-card">
        <div className="ble-card-header">
          <div className="ble-header-info">
            <div className={`ble-icon-badge ${bleStatus === 'connected' ? 'connected pulse' : ''}`}>
              {bleStatus === 'connected' ? (
                <BluetoothConnected size={26} className="highlight-cyan" />
              ) : bleStatus === 'connecting' ? (
                <Loader2 size={26} className="spin-icon highlight-cyan" />
              ) : (
                <Bluetooth size={26} />
              )}
            </div>
            <div>
              <h2 className="ble-card-title">Kết Nối Cảm Biến Thông Minh</h2>
              <p className="ble-card-subtitle">
                Kết nối nhanh qua Bluetooth: Tự động ghi nhận chuyển động và lưu lại buổi tập theo môn bạn chọn.
              </p>
            </div>
          </div>

          <div className="ble-status-pill-wrap">
            <div className={`status-pill ${bleStatus === 'connected' ? 'status-online' : 'status-offline'}`}>
              <span className={`status-dot ${bleStatus === 'connected' ? 'connected' : 'disconnected'}`} />
              <span>
                {bleStatus === 'connected'
                  ? 'Đang theo dõi trực tiếp'
                  : bleStatus === 'connecting'
                  ? 'Đang kết nối...'
                  : 'Chưa kết nối thiết bị'}
              </span>
            </div>
          </div>
        </div>

        {/* BLE Controls & Actions */}
        <div className="ble-main-body">
          {/* Chọn môn thể thao */}
          <div className="sensor-sport-picker-wrap">
            <span className="sport-picker-label">
              <Award size={15} className="highlight-cyan" /> Chọn môn thể thao:
            </span>
            <div className="sport-picker-pills">
              {SPORT_OPTIONS.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  className={`btn-sport-choice ${selectedSport === sp.id ? 'active' : ''}`}
                  onClick={() => setSelectedSport(sp.id)}
                  title={`Chọn môn ${sp.label}`}
                >
                  <span className="sport-choice-icon">{sp.icon}</span>
                  <span className="sport-choice-label">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {bleStatus !== 'connected' ? (
            <div className="ble-connect-prompt">
              <div className="ble-prompt-text">
                <p>
                  Bật Bluetooth trên máy tính hoặc điện thoại, sau đó nhấn nút bên dưới để chọn thiết bị <strong>Second Skin</strong> của bạn.
                </p>
                <span className="ble-supported-note">
                  <Globe size={14} /> Dùng tốt nhất trên trình duyệt Google Chrome hoặc Microsoft Edge.
                </span>
              </div>

              <button
                className="btn btn-primary btn-ble-connect"
                onClick={handleBleConnect}
                disabled={bleStatus === 'connecting'}
              >
                {bleStatus === 'connecting' ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    Đang tìm thiết bị...
                  </>
                ) : (
                  <>
                    <Bluetooth size={18} />
                    Tìm & Kết Nối Thiết Bị
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="ble-connected-panel">
              <div className="ble-telemetry-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Thiết bị đang dùng</span>
                  <span className="meta-value highlight-cyan">{bleDevice?.deviceName || 'Second Skin Patch'}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Dữ liệu đã nhận</span>
                  <span className="meta-value">{livePacketCount.toLocaleString()} tín hiệu</span>
                </div>
              </div>

              <div className="ble-actions-bar">
                <div className="zero-touch-tag">
                  <Sparkles size={16} className="highlight-cyan" />
                  <span>Tự động thông minh: Thiết bị tự động ghi nhận và lưu kết quả khi bạn hoàn thành buổi tập</span>
                </div>

                <button className="btn btn-secondary btn-sm" onClick={handleBleDisconnect}>
                  <BluetoothOff size={15} />
                  Ngắt Kết Nối
                </button>
              </div>
            </div>
          )}

          {bleError && (
            <div className="ble-error-box">
              <AlertTriangle size={18} />
              <span>{bleError}</span>
            </div>
          )}
        </div>

        {/* SESSION TRACKING BANNER (ALWAYS VISIBLE WHEN CONNECTED) */}
        {bleStatus === 'connected' && (
          <div className="auto-session-banner-card">
            <div className="auto-session-header">
              <div className="auto-session-title-wrap">
                <div className={`session-state-glow ${autoSessionDisplay.status}`}>
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="auto-session-title">Theo Dõi Buổi Tập Cảm Biến ({selectedSport === 'Basketball' ? 'Bóng rổ' : selectedSport === 'Volleyball' ? 'Bóng chuyền' : 'Chạy bộ'})</h3>
                  <p className="auto-session-subtitle">
                    Thiết bị ghi nhận dữ liệu theo môn thể thao bạn đã chọn và tự động tổng hợp khi bạn nghỉ.
                  </p>
                </div>
              </div>

              <div className="auto-session-status-badge">
                <span className={`state-pill ${autoSessionDisplay.status}`}>
                  {autoSessionDisplay.status === 'recording' && '🏃 Đang tập luyện'}
                  {autoSessionDisplay.status === 'cooldown' && '⏸️ Đang nghỉ giải lao'}
                  {autoSessionDisplay.status === 'idle' && '💤 Sẵn sàng bắt đầu'}
                </span>
              </div>
            </div>

            <div className="auto-session-stats-grid">
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Timer size={14} /> Thời gian tập</span>
                <span className="auto-stat-val timer-val">{formatTimer(autoSessionDisplay.elapsedSeconds)}</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><ShieldCheck size={14} className="green" /> Độ êm tiếp đất</span>
                <span className="auto-stat-val highlight-cyan">{autoSessionDisplay.landingSoftness ?? 84}<small>/100 ({autoSessionDisplay.peakImpactG ?? 2.1}G)</small></span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Zap size={14} className="highlight-neon" /> Độ bùng nổ</span>
                <span className="auto-stat-val highlight-neon">{autoSessionDisplay.explosiveness ?? 86}<small>/100 ({autoSessionDisplay.airtime ?? 0.38}s)</small></span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Compass size={14} /> Độ vững thân trên</span>
                <span className="auto-stat-val">{autoSessionDisplay.trunkStability ?? 88}<small>/100</small></span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Zap size={14} /> Số lần bật nhảy</span>
                <span className="auto-stat-val highlight-cyan">
                  {autoSessionDisplay.jumpCount} lần
                  {autoSessionDisplay.jumpHeight > 0 && <small> ({formatHeight(autoSessionDisplay.jumpHeight)})</small>}
                </span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Activity size={14} /> Nhịp bước chạy</span>
                <span className="auto-stat-val green">
                  {autoSessionDisplay.runStepCount ?? 0} <small>bước ({autoSessionDisplay.cadence ?? 0} bước/phút)</small>
                </span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Compass size={14} /> Đổi hướng</span>
                <span className="auto-stat-val">{autoSessionDisplay.directionChangeCount} lần</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Gauge size={14} /> Lực vận động TB</span>
                <span className="auto-stat-val">{formatAccel(autoSessionDisplay.avgAccel)}</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Award size={14} /> Môn thể thao đã chọn</span>
                <span className="auto-stat-val badge-sport-label">
                  {selectedSport === 'Basketball'
                    ? '🏀 Bóng rổ'
                    : selectedSport === 'Volleyball'
                    ? '🏐 Bóng chuyền'
                    : '🏃 Chạy bộ'}
                </span>
              </div>
            </div>

            <div className="auto-session-footer">
              <span className="auto-session-hint">
                💡 Thiết bị tự động ghi lại toàn bộ chuyển động. Khi bạn nghỉ ngơi quá 3 phút, buổi tập sẽ tự động được chốt và lưu lại.
              </span>

              {autoSessionDisplay.status === 'idle' ? (
                <button
                  className="btn btn-outline-cyan btn-sm"
                  onClick={() => startTrackingSession({ sport: selectedSport, targetDurationMinutes: 45 })}
                >
                  <Play size={15} />
                  Bắt Đầu Buổi Tập {selectedSport === 'Basketball' ? 'Bóng rổ' : selectedSport === 'Volleyball' ? 'Bóng chuyền' : 'Chạy bộ'}
                </button>
              ) : (
                <button
                  className="btn btn-outline-cyan btn-sm"
                  onClick={() => finalizeAutoSession(true)}
                  disabled={autoSessionDisplay.isSaving}
                >
                  {autoSessionDisplay.isSaving ? (
                    <>
                      <Loader2 size={15} className="spin-icon" />
                      Đang phân tích AI & lưu...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Hoàn tất & Lưu ngay
                    </>
                  )}
                </button>
              )}
            </div>

            {autoSessionDisplay.lastSavedSession && (
              <div className="last-saved-session-banner">
                <CheckCircle2 size={18} className="green" />
                <div>
                  <strong>Buổi tập #{autoSessionDisplay.lastSavedSession.id} ({autoSessionDisplay.lastSavedSession.sport}) đã lưu thành công!</strong>
                  <span> — Điểm hiệu suất: {autoSessionDisplay.lastSavedSession.performanceScore}% | AI Coach: "{autoSessionDisplay.lastSavedSession.aiInsight?.aiSummary || 'Buổi tập ổn định, phục hồi tốt'}"</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WI-FI PROVISIONING SECTION (ACTIVE OVER BLE) */}
        {bleStatus === 'connected' && (
          <div className="wifi-provisioning-section">
            <div className="wifi-section-header">
              <Wifi size={18} className="highlight-cyan" />
              <div>
                <h3 className="wifi-section-title">Cài Đặt Wi-Fi Cho Miếng Dán Thông Minh</h3>
                <p className="wifi-section-desc">
                  Kết nối miếng dán vào Wi-Fi phòng tập hoặc gia đình để tự động tải lên buổi tập mà không cần mở điện thoại.
                </p>
              </div>
            </div>

            <form className="wifi-form-grid" onSubmit={handleSendWifi}>
              <div className="form-field">
                <label>Tên Wi-Fi (SSID)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: WiFi_Nha_Toi"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Mật khẩu Wi-Fi</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label>Địa chỉ máy chủ (Tùy chọn nâng cao)</label>
                <input
                  type="text"
                  placeholder="http://192.168.1.100:8080/api/v1/sensor/batches"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                />
              </div>

              <div className="wifi-form-submit">
                <button type="submit" className="btn btn-outline-cyan" disabled={wifiSending}>
                  {wifiSending ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      Đang lưu cấu hình...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Lưu Cài Đặt Wi-Fi
                    </>
                  )}
                </button>
              </div>
            </form>

            {wifiFeedback && (
              <div
                className={`wifi-feedback-box ${
                  wifiFeedback.status === 'wifi_connected'
                    ? 'feedback-success'
                    : wifiFeedback.status === 'wifi_failed'
                    ? 'feedback-error'
                    : 'feedback-info'
                }`}
              >
                {wifiFeedback.status === 'wifi_connected' ? (
                  <CheckCircle2 size={18} />
                ) : wifiFeedback.status === 'wifi_failed' ? (
                  <AlertTriangle size={18} />
                ) : (
                  <Loader2 size={18} className="spin-icon" />
                )}
                <div>
                  <strong>{wifiFeedback.msg}</strong>
                  {wifiFeedback.ip && <span> — IP Cấp phát: <code>{wifiFeedback.ip}</code></span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE SENSOR TELEMETRY AREA (0 DELAY ON RAM) */}
      <div className="live-sensor-area">
        <div className="section-title-wrap">
          <h2 className="section-heading">Dữ Liệu Vận Động Thời Gian Thực</h2>
          <span className="section-tag">
          {bleStatus === 'connected' ? 'ĐANG ĐO TRỰC TIẾP' : 'CHƯA KẾT NỐI THIẾT BỊ'}
          </span>
        </div>
        <SensorCard sensorStatus={sensorStatus} />
        <KinematicChart />
      </div>

      {/* Device Management Cards Grid */}
      <div className="section-title-wrap">
        <h2 className="section-heading">Danh Sách Thiết Bị Đã Đăng Ký</h2>
        <span className="section-tag">QUẢN LÝ THIẾT BỊ</span>
      </div>

      <div className="devices-grid">
        {displayDevices.length === 0 ? (
          <div className="card device-empty-state">
            <Cpu size={24} />
            <div>
              <strong>Chưa có thiết bị kết nối</strong>
              <p>Bật Bluetooth và chọn kết nối thiết bị ở trên để bắt đầu theo dõi.</p>
            </div>
          </div>
        ) : displayDevices.map((device) => {
          const isBleActive = bleStatus === 'connected' && (
            device.deviceId === bleDevice?.deviceId ||
            (!bleDevice?.deviceId && (device.deviceId === 'SSS-PATCH-001' || device.id === 1))
          );
          const isConnected = isBleActive;

          return (
            <div
              key={device.id}
              className={`card device-card ${isConnected ? 'device-connected' : 'device-disconnected'}`}
            >
              <div className="device-card-header">
                <div className="device-icon-wrap">
                  <Cpu size={22} className={isConnected ? 'highlight-cyan' : ''} />
                </div>
                <div className="device-status-indicator">
                  <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                  <span className={`device-conn-text ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? (isBleActive ? 'Đang kết nối' : 'Hoạt động') : 'Ngoại tuyến'}
                  </span>
                </div>
              </div>

              <div className="device-card-body">
                <h3 className="device-name">{device.deviceName}</h3>
                <span className="device-id-code">{device.deviceId}</span>

                <div className="device-stats-row">
                  <div className="device-stat">
                    <span className="dev-stat-label">Truyền tin</span>
                    <span className="last-sync-text">
                      {isBleActive ? 'Trực tiếp (10 lần/s)' : 'Chưa có dữ liệu'}
                    </span>
                  </div>

                  <div className="device-stat">
                    <span className="dev-stat-label">Trạng thái</span>
                    <span className="firmware-tag">
                      {isConnected ? 'Sẵn sàng' : 'Chờ kết nối'}
                    </span>
                  </div>

                  <div className="device-stat">
                    <span className="dev-stat-label">Phiên bản</span>
                    <span className="firmware-tag">v2.4</span>
                  </div>
                </div>
              </div>

              <div className="device-card-actions">
                <button
                  className={`btn btn-sm ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleConnectToggle(device.id, isConnected)}
                >
                  <Power size={14} />
                  {isConnected ? 'Ngắt kết nối' : 'Kết nối'}
                </button>

                {typeof device.id === 'number' && (
                <button
                  className="btn btn-outline-cyan btn-sm"
                  onClick={() => handleSyncData(device.id)}
                  disabled={!isConnected || syncing}
                >
                  <RefreshCw size={14} className={syncing ? 'spin-icon' : ''} />
                  {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
                </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

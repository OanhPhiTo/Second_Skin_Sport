import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Radio,
  Battery,
  BatteryCharging,
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
} from 'lucide-react';
import SensorCard from '../components/SensorCard';
import { deviceService, sensorDataService, sessionService } from '../services/api';
import bleService from '../services/bleService';
import './Sensors.css';

export default function Sensors() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sensorStatus, setSensorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Web Bluetooth (BLE) State
  const [bleStatus, setBleStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [bleDevice, setBleDevice] = useState(null);
  const [bleError, setBleError] = useState('');
  const [livePacketCount, setLivePacketCount] = useState(0);
  const [bleTelemetry, setBleTelemetry] = useState(null);

  // Auto Session State (Zero-Touch Activity Tracking)
  const autoSessionRef = useRef({
    status: 'idle', // 'idle' | 'recording' | 'cooldown'
    startTime: null,
    lastActiveTime: null,
    lastJumpTime: 0,
    lastTurnTime: 0,
    jumpCount: 0,
    directionChangeCount: 0,
    sampleCount: 0,
    accelSum: 0,
    maxAccel: 0,
    trajectoryPoints: [], // max 60 points in RAM
  });

  const [autoSessionDisplay, setAutoSessionDisplay] = useState({
    status: 'idle', // 'idle' | 'recording' | 'cooldown'
    elapsedSeconds: 0,
    jumpCount: 0,
    directionChangeCount: 0,
    avgAccel: 0,
    sport: 'Running',
    lastSavedSession: null,
    isSaving: false,
  });

  // Wi-Fi Provisioning Form State
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080/api/sensor-data');
  const [wifiSending, setWifiSending] = useState(false);
  const [wifiFeedback, setWifiFeedback] = useState(null);

  const loadData = async () => {
    try {
      const [devList, status] = await Promise.all([
        deviceService.getAll(),
        deviceService.getStatus(),
      ]);
      setDevices(devList);
      if (!sensorStatus) {
        setSensorStatus(status);
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
          setSensorStatus(status);
        } catch (e) {}
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [bleStatus]);

  // Finalize auto session helper
  const finalizeAutoSession = useCallback(async (manual = false) => {
    const session = autoSessionRef.current;
    if (session.status === 'idle') return;

    setAutoSessionDisplay((prev) => ({ ...prev, isSaving: true }));
    try {
      const endTime = new Date();
      const startTime = session.startTime || new Date(Date.now() - 60000);
      const durationMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      const avgAccel = session.sampleCount > 0
        ? Math.round((session.accelSum / session.sampleCount) * 100) / 100
        : 2.85;

      const detectedSport = (session.jumpCount >= 10 || session.directionChangeCount >= 30)
        ? 'Basketball'
        : 'Running';

      const payload = {
        deviceId: bleDevice?.deviceName || 'SecondSkin_ESP32',
        sport: detectedSport,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durationMin,
        totalJumps: session.jumpCount,
        directionChanges: session.directionChangeCount,
        averageAcceleration: avgAccel,
        averageSpeed: detectedSport === 'Basketball' ? 18.2 : 14.8,
        movementIntensity: Math.min(100, Math.round(avgAccel * 25)),
        trajectoryPoints: session.trajectoryPoints,
      };

      const saved = await sessionService.createAutoSession(payload);
      setActionMessage(`🎉 Buổi tập ${detectedSport} đã tự động lưu! Điểm đánh giá: ${saved.performanceScore || 88}/100.`);
      setAutoSessionDisplay({
        status: 'idle',
        elapsedSeconds: 0,
        jumpCount: 0,
        directionChangeCount: 0,
        avgAccel: 0,
        sport: detectedSport,
        lastSavedSession: saved,
        isSaving: false,
      });

      // Reset in-memory session ref
      autoSessionRef.current = {
        status: 'idle',
        startTime: null,
        lastActiveTime: null,
        lastJumpTime: 0,
        lastTurnTime: 0,
        jumpCount: 0,
        directionChangeCount: 0,
        sampleCount: 0,
        accelSum: 0,
        maxAccel: 0,
        trajectoryPoints: [],
      };

      setTimeout(() => setActionMessage(''), 6000);
    } catch (err) {
      console.error('Error saving auto session:', err);
      setAutoSessionDisplay((prev) => ({ ...prev, isSaving: false }));
    }
  }, [bleDevice]);

  // Subscribe to Web Bluetooth events
  useEffect(() => {
    const unsubData = bleService.onData((data) => {
      setLivePacketCount((prev) => prev + 1);
      setBleTelemetry(data);

      const ax = data.ax ?? 0;
      const ay = data.ay ?? 0;
      const az = data.az ?? 9.81;
      const gx = data.gx ?? 0;
      const gy = data.gy ?? 0;
      const gz = data.gz ?? 0;
      const rawMagnitude = Math.hypot(ax, ay, az);
      const intensity = Math.min(100, Math.round(Math.hypot(ax, ay, az - 9.81) * 12));

      // 1. Real-time update into the IMU SensorCard (RAM only, 0 latency, 0 DB overhead)
      setSensorStatus({
        connected: true,
        currentData: {
          accelerometerX: ax,
          accelerometerY: ay,
          accelerometerZ: az,
          gyroscopeX: gx,
          gyroscopeY: gy,
          gyroscopeZ: gz,
          pitch: data.pitch ?? 0,
          roll: data.roll ?? 0,
          yaw: data.yaw ?? 0,
          movementIntensity: intensity,
          heartRate: 135,
        },
      });

      // 2. Intelligent Auto-Session Processing (No manual Start/Stop buttons needed)
      const dataState = data.s || (rawMagnitude > 12.0 ? 'active' : rawMagnitude < 10.5 ? 'idle' : 'cooldown');
      const now = Date.now();
      const session = autoSessionRef.current;

      // Detect athletic jump (accel magnitude spike > 17.5 m/s²)
      if (rawMagnitude > 17.5 && now - session.lastJumpTime > 600) {
        session.jumpCount += 1;
        session.lastJumpTime = now;
      }

      // Detect sudden biomechanical direction change (gyro angular velocity > 120°/s)
      const gyroMagnitude = Math.hypot(gx, gy, gz);
      if (gyroMagnitude > 120.0 && now - session.lastTurnTime > 500) {
        session.directionChangeCount += 1;
        session.lastTurnTime = now;
      }

      // Auto Start Trigger on Active movement
      if (dataState === 'active') {
        session.lastActiveTime = now;
        if (session.status === 'idle') {
          session.status = 'recording';
          session.startTime = new Date();
          session.sampleCount = 0;
          session.accelSum = 0;
          session.maxAccel = 0;
          session.jumpCount = 0;
          session.directionChangeCount = 0;
          session.trajectoryPoints = [];
          setActionMessage('🏃 Đã phát hiện vận động! Hệ thống đang tự động ghi nhận phiên tập...');
        } else if (session.status === 'cooldown') {
          session.status = 'recording';
        }
      } else if (dataState === 'cooldown' && session.status === 'recording') {
        session.status = 'cooldown';
      }

      // Accumulate metrics while session is recording or in cooldown
      if (session.status === 'recording' || session.status === 'cooldown') {
        session.sampleCount += 1;
        session.accelSum += rawMagnitude;
        if (rawMagnitude > session.maxAccel) {
          session.maxAccel = rawMagnitude;
        }

        // Downsample trajectory: capture 1 representative point every 10 samples (1s at 10Hz) up to max 60 points
        if (session.sampleCount % 10 === 0 && session.trajectoryPoints.length < 60) {
          session.trajectoryPoints.push({
            timestamp: new Date().toISOString(),
            accelerometerX: ax,
            accelerometerY: ay,
            accelerometerZ: az,
            gyroscopeX: gx,
            gyroscopeY: gy,
            gyroscopeZ: gz,
            pitch: data.pitch ?? 0,
            roll: data.roll ?? 0,
            yaw: data.yaw ?? 0,
            movementIntensity: intensity,
          });
        }
      }
    });

    const unsubStatus = bleService.onStatus((status, details) => {
      setBleStatus(status);
      if (status === 'connected') {
        setBleDevice(details);
        setBleError('');
        setActionMessage(`Đã kết nối Bluetooth với ${details.deviceName || 'ESP32-C3'}!`);
        setTimeout(() => setActionMessage(''), 4000);
      } else if (status === 'disconnected') {
        setBleDevice(null);
        setBleTelemetry(null);
        setActionMessage('Đã ngắt kết nối Bluetooth.');
        setTimeout(() => setActionMessage(''), 3000);
      } else if (status === 'error') {
        setBleError(details.error || 'Lỗi kết nối Bluetooth');
      }
    });

    const unsubWifi = bleService.onWifiStatus((res) => {
      setWifiSending(false);
      setWifiFeedback(res);
    });

    return () => {
      unsubData();
      unsubStatus();
      unsubWifi();
    };
  }, []);

  // Timer ticker: updates live elapsed time and auto-finalizes when user rests
  useEffect(() => {
    const timer = setInterval(() => {
      const session = autoSessionRef.current;
      if (session.status === 'recording' || session.status === 'cooldown') {
        const now = Date.now();
        const elapsed = session.startTime ? Math.floor((now - session.startTime.getTime()) / 1000) : 0;
        const avg = session.sampleCount > 0 ? (session.accelSum / session.sampleCount) : 0;
        const detectedSport = (session.jumpCount >= 10 || session.directionChangeCount >= 30) ? 'Basketball' : 'Running';

        setAutoSessionDisplay((prev) => ({
          ...prev,
          status: session.status,
          elapsedSeconds: elapsed,
          jumpCount: session.jumpCount,
          directionChangeCount: session.directionChangeCount,
          avgAccel: Math.round(avg * 100) / 100,
          sport: detectedSport,
        }));

        // Auto finalize if user has rested for >= 180 seconds (3 mins) with sufficient data (> 50 samples)
        if (session.lastActiveTime && now - session.lastActiveTime >= 180000 && session.sampleCount >= 50) {
          finalizeAutoSession(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [finalizeAutoSession]);

  // Handle BLE Connect button
  const handleBleConnect = async () => {
    setBleError('');
    try {
      await bleService.connect();
    } catch (err) {
      console.error('BLE connection failed:', err);
      setBleError(err.message || 'Không thể kết nối Bluetooth.');
    }
  };

  // Handle BLE Disconnect button
  const handleBleDisconnect = async () => {
    try {
      await bleService.disconnect();
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
    setWifiSending(true);
    setWifiFeedback({ status: 'sending', msg: 'Đang gửi gói tin Wi-Fi xuống ESP32...' });
    try {
      await bleService.sendWifiConfig({
        ssid: wifiSsid,
        password: wifiPassword,
        backendUrl: backendUrl,
      });
    } catch (err) {
      setWifiSending(false);
      setWifiFeedback({ status: 'wifi_failed', msg: err.message || 'Lỗi khi gửi lệnh xuống ESP32' });
    }
  };

  const handleConnectToggle = async (deviceId, currentConnected) => {
    try {
      if (currentConnected) {
        await deviceService.disconnect(deviceId);
        setActionMessage(`Thiết bị #${deviceId} đã ngắt kết nối.`);
      } else {
        await deviceService.connect(deviceId);
        setActionMessage(`Thiết bị #${deviceId} đã kết nối.`);
      }
      loadData();
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncData = async (deviceId) => {
    setSyncing(true);
    try {
      await deviceService.sync(deviceId);
      setActionMessage('Đã đồng bộ toàn bộ dữ liệu cảm biến lưu trong bộ nhớ.');
      setTimeout(() => setActionMessage(''), 3500);
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

  return (
    <div className="sensors-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Quản Lý Cảm Biến & Thiết Bị</h1>
          <p className="hero-subtitle">
            Cấu hình, kết nối Bluetooth (BLE) trực tiếp và stream dữ liệu sinh trắc học từ miếng dán Second Skin.
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
              <h2 className="ble-card-title">Kết Nối Trực Tiếp ESP32-C3 (Web Bluetooth BLE)</h2>
              <p className="ble-card-subtitle">
                Giao tiếp hai chiều không cần Wi-Fi: Stream dữ liệu IMU/GPS 10Hz & Nhận diện vận động tự động.
              </p>
            </div>
          </div>

          <div className="ble-status-pill-wrap">
            <div className={`status-pill ${bleStatus === 'connected' ? 'status-online' : 'status-offline'}`}>
              <span className={`status-dot ${bleStatus === 'connected' ? 'connected' : 'disconnected'}`} />
              <span>
                {bleStatus === 'connected'
                  ? 'Đang Live Stream (BLE 5.0)'
                  : bleStatus === 'connecting'
                  ? 'Đang ghép nối...'
                  : 'Chưa kết nối Bluetooth'}
              </span>
            </div>
          </div>
        </div>

        {/* BLE Controls & Actions */}
        <div className="ble-main-body">
          {bleStatus !== 'connected' ? (
            <div className="ble-connect-prompt">
              <div className="ble-prompt-text">
                <p>
                  Bật Bluetooth trên máy tính/điện thoại và nhấn nút bên dưới để chọn bo mạch <strong>SecondSkin_ESP32</strong>.
                </p>
                <span className="ble-supported-note">
                  <Globe size={14} /> Hỗ trợ Google Chrome & Microsoft Edge trên Windows, Android, macOS.
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
                    Quét & Kết Nối Bluetooth
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="ble-connected-panel">
              <div className="ble-telemetry-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Thiết bị</span>
                  <span className="meta-value highlight-cyan">{bleDevice?.deviceName || 'SecondSkin_ESP32'}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Số gói tin nhận</span>
                  <span className="meta-value">{livePacketCount.toLocaleString()} pkts</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Vận tốc GPS</span>
                  <span className="meta-value">{bleTelemetry?.spd ?? 0} km/h</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Dung lượng Pin</span>
                  <span className="meta-value green">{bleTelemetry?.bat ?? 90}%</span>
                </div>
              </div>

              <div className="ble-actions-bar">
                <div className="zero-touch-tag">
                  <Sparkles size={16} className="highlight-cyan" />
                  <span>Chế độ Zero-Touch UX: Dữ liệu được tính toán trên RAM và tự động lưu phiên tập</span>
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

        {/* ZERO-TOUCH AUTO SESSION TRACKING BANNER (ALWAYS VISIBLE WHEN CONNECTED) */}
        {bleStatus === 'connected' && (
          <div className="auto-session-banner-card">
            <div className="auto-session-header">
              <div className="auto-session-title-wrap">
                <div className={`session-state-glow ${autoSessionDisplay.status}`}>
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="auto-session-title">Tự Động Nhận Diện Buổi Tập (Auto Session Tracking)</h3>
                  <p className="auto-session-subtitle">
                    Không cần thao tác nút bấm khi chơi thể thao. Thiết bị tự động ghi nhận khi bạn vận động và lưu khi bạn nghỉ.
                  </p>
                </div>
              </div>

              <div className="auto-session-status-badge">
                <span className={`state-pill ${autoSessionDisplay.status}`}>
                  {autoSessionDisplay.status === 'recording' && '🏃 Đang vận động (Active)'}
                  {autoSessionDisplay.status === 'cooldown' && '⏸️ Tạm nghỉ giữa hiệp (Cooldown)'}
                  {autoSessionDisplay.status === 'idle' && '💤 Sẵn sàng / Chờ vận động'}
                </span>
              </div>
            </div>

            <div className="auto-session-stats-grid">
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Timer size={14} /> Thời gian phiên</span>
                <span className="auto-stat-val timer-val">{formatTimer(autoSessionDisplay.elapsedSeconds)}</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Zap size={14} /> Cú bật nhảy</span>
                <span className="auto-stat-val highlight-cyan">{autoSessionDisplay.jumpCount} lần</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Compass size={14} /> Đổi hướng</span>
                <span className="auto-stat-val">{autoSessionDisplay.directionChangeCount} lần</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Gauge size={14} /> Gia tốc TB</span>
                <span className="auto-stat-val">{autoSessionDisplay.avgAccel} m/s²</span>
              </div>
              <div className="auto-stat-item">
                <span className="auto-stat-label"><Award size={14} /> Nhận diện môn</span>
                <span className="auto-stat-val badge-sport-label">{autoSessionDisplay.sport}</span>
              </div>
            </div>

            <div className="auto-session-footer">
              <span className="auto-session-hint">
                💡 ESP32 tự động gửi cờ hoạt động. Sau 3 phút nghỉ liên tục, dữ liệu 1 buổi tập sẽ tự động tổng hợp gửi về Backend.
              </span>

              {(autoSessionDisplay.status === 'recording' || autoSessionDisplay.status === 'cooldown') && (
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
                <h3 className="wifi-section-title">Chủ Động Cấu Hình Wi-Fi Cho ESP32 (Gửi qua BLE)</h3>
                <p className="wifi-section-desc">
                  Nhập thông tin Wi-Fi phòng tập hoặc gia đình. ESP32 sẽ lưu vào bộ nhớ Flash và tự động kết nối mạng.
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
                <label>URL Backend Nhận Dữ Liệu</label>
                <input
                  type="text"
                  placeholder="http://192.168.1.100:8080/api/sensor-data"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                />
              </div>

              <div className="wifi-form-submit">
                <button type="submit" className="btn btn-outline-cyan" disabled={wifiSending}>
                  {wifiSending ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      Đang gửi lệnh...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Gửi Cấu Hình Xuống ESP32
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
          <h2 className="section-heading">Luồng Dữ Liệu Sinh Trắc Học Thời Gian Thực</h2>
          <span className="section-tag">
            {bleStatus === 'connected' ? 'LIVE TỪ ESP32-C3 HARDWARE (RAM 0-DELAY)' : 'MÔ PHỎNG IMU 6-DOF'}
          </span>
        </div>
        <SensorCard sensorStatus={sensorStatus} />
      </div>

      {/* Device Management Cards Grid */}
      <div className="section-title-wrap">
        <h2 className="section-heading">Danh Sách Thiết Bị Đã Đăng Ký</h2>
        <span className="section-tag">QUẢN LÝ THIẾT BỊ</span>
      </div>

      <div className="devices-grid">
        {devices.map((device) => {
          const isConnected = device.connected;
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
                    {isConnected ? 'Hoạt động' : 'Ngoại tuyến'}
                  </span>
                </div>
              </div>

              <div className="device-card-body">
                <h3 className="device-name">{device.deviceName}</h3>
                <span className="device-id-code">{device.deviceId}</span>

                <div className="device-stats-row">
                  <div className="device-stat">
                    <span className="dev-stat-label">Pin</span>
                    <div className="battery-row">
                      <BatteryCharging size={16} className="battery-icon" />
                      <span className="battery-number">{device.batteryLevel}%</span>
                    </div>
                  </div>

                  <div className="device-stat">
                    <span className="dev-stat-label">Đồng bộ</span>
                    <span className="last-sync-text">{device.lastSync ? '10 giây trước' : 'Chưa đồng bộ'}</span>
                  </div>

                  <div className="device-stat">
                    <span className="dev-stat-label">Firmware</span>
                    <span className="firmware-tag">{device.firmwareVersion || 'v2.4.1'}</span>
                  </div>
                </div>

                <div className="battery-bar-container">
                  <div
                    className="battery-bar-fill"
                    style={{
                      width: `${device.batteryLevel}%`,
                      backgroundColor:
                        device.batteryLevel > 50
                          ? 'var(--status-success)'
                          : device.batteryLevel > 20
                          ? 'var(--status-warning)'
                          : 'var(--status-danger)',
                    }}
                  />
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

                <button
                  className="btn btn-outline-cyan btn-sm"
                  onClick={() => handleSyncData(device.id)}
                  disabled={!isConnected || syncing}
                >
                  <RefreshCw size={14} className={syncing ? 'spin-icon' : ''} />
                  {syncing ? 'Đang sync...' : 'Đồng bộ'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* IOT ARCHITECTURE SECTION */}
      <div className="card iot-architecture-card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Kiến Trúc Đường Truyền Dữ Liệu IoT Zero-Touch</h3>
            <p className="card-subtitle">
              Tối ưu trải nghiệm thể thao: Tự động phát hiện hoạt động từ phần cứng, loại bỏ hoàn toàn thao tác nút bấm khi tập luyện.
            </p>
          </div>
          <span className="badge badge-sport">ZERO-TOUCH AUTOMATED</span>
        </div>

        <div className="iot-pipeline-flow">
          <div className="flow-step">
            <div className="step-badge">1</div>
            <div className="step-content">
              <h4>Second Skin Patch</h4>
              <p>Mang trên cơ thể & bắt đầu chơi thể thao</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-badge">2</div>
            <div className="step-content">
              <h4>On-Device Detection</h4>
              <p>ESP32 tính magnitude & gắn cờ <code>active/idle</code></p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step highlight-step">
            <div className="step-badge">3</div>
            <div className="step-content">
              <h4>Web Bluetooth (BLE)</h4>
              <p>Truyền 10Hz, đệm RAM, 0-delay chart</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-badge">4</div>
            <div className="step-content">
              <h4>Auto Session Save</h4>
              <p>1 request tổng hợp khi nghỉ tập (không phồng DB)</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step highlight-step">
            <div className="step-badge">5</div>
            <div className="step-content">
              <h4>AI Coach Analysis</h4>
              <p>Phân tích động học & phòng ngừa chấn thương</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

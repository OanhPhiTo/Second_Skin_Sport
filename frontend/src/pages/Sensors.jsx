import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import SensorCard from '../components/SensorCard';
import { deviceService, sensorDataService } from '../services/api';
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
  const [autoForward, setAutoForward] = useState(true);

  // Wi-Fi Provisioning Form State
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080/api/sensor-data');
  const [wifiSending, setWifiSending] = useState(false);
  const [wifiFeedback, setWifiFeedback] = useState(null);

  const lastSyncTimeRef = useRef(0);

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

  // Subscribe to Web Bluetooth events
  useEffect(() => {
    const unsubData = bleService.onData((data) => {
      setLivePacketCount((prev) => prev + 1);
      setBleTelemetry(data);

      // Real-time update into the IMU SensorCard
      setSensorStatus({
        connected: true,
        currentData: {
          accelerometerX: data.ax ?? 0,
          accelerometerY: data.ay ?? 0,
          accelerometerZ: data.az ?? 9.81,
          gyroscopeX: data.gx ?? 0,
          gyroscopeY: data.gy ?? 0,
          gyroscopeZ: data.gz ?? 0,
          pitch: data.pitch ?? 0,
          roll: data.roll ?? 0,
          yaw: data.yaw ?? 0,
          movementIntensity: Math.min(100, Math.round(Math.hypot(data.ax || 0, data.ay || 0, (data.az || 9.81) - 9.81) * 12)),
          heartRate: 135,
        },
      });

      // Forward to backend every 1.5s
      const now = Date.now();
      if (autoForward && now - lastSyncTimeRef.current >= 1500) {
        lastSyncTimeRef.current = now;
        sensorDataService.create({
          deviceId: bleDevice?.name || 'ESP32-SUPERMINI-01',
          accelerometerX: data.ax,
          accelerometerY: data.ay,
          accelerometerZ: data.az,
          gyroscopeX: data.gx,
          gyroscopeY: data.gy,
          gyroscopeZ: data.gz,
          pitch: data.pitch,
          roll: data.roll,
          yaw: data.yaw,
          movementIntensity: Math.min(100, Math.round(Math.hypot(data.ax || 0, data.ay || 0, (data.az || 9.81) - 9.81) * 12)),
        }).catch((err) => {
          console.warn('Auto forward BLE error:', err);
        });
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
  }, [autoForward, bleDevice]);

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
      // ESP32 will notify back on command characteristic
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
                Giao tiếp hai chiều không cần Wi-Fi: Stream dữ liệu IMU/GPS 10Hz & Cấu hình mạng Wi-Fi từ trình duyệt.
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
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoForward}
                    onChange={(e) => setAutoForward(e.target.checked)}
                  />
                  <span>Tự động đẩy dữ liệu lên Backend Spring Boot (Cloud Sync)</span>
                </label>

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

      {/* LIVE SENSOR TELEMETRY AREA */}
      <div className="live-sensor-area">
        <div className="section-title-wrap">
          <h2 className="section-heading">Luồng Dữ Liệu Sinh Trắc Học Thời Gian Thực</h2>
          <span className="section-tag">
            {bleStatus === 'connected' ? 'LIVE TỪ ESP32-C3 HARDWARE' : 'MÔ PHỎNG IMU 6-DOF'}
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
            <h3 className="card-title">Kiến Trúc Đường Truyền Dữ Liệu IoT</h3>
            <p className="card-subtitle">
              Sẵn sàng giao tiếp trực tiếp với vi điều khiển ESP32-C3 & cảm biến chuyển động MPU-6050.
            </p>
          </div>
          <span className="badge badge-sport">HARDWARE READY</span>
        </div>

        <div className="iot-pipeline-flow">
          <div className="flow-step">
            <div className="step-badge">1</div>
            <div className="step-content">
              <h4>Second Skin Patch</h4>
              <p>Miếng dán sinh học mang trên cơ thể</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-badge">2</div>
            <div className="step-content">
              <h4>MPU6050 + ESP32</h4>
              <p>Lấy mẫu gia tốc và con quay 6-DOF</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step highlight-step">
            <div className="step-badge">3</div>
            <div className="step-content">
              <h4>Web Bluetooth (BLE)</h4>
              <p>Stream real-time trực tiếp về trình duyệt</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-badge">4</div>
            <div className="step-content">
              <h4>Spring Boot API</h4>
              <p><code>POST /api/sensor-data</code></p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-badge">5</div>
            <div className="step-content">
              <h4>Cơ sở dữ liệu</h4>
              <p>Lưu trữ phiên tập & sinh trắc học</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>

          <div className="flow-step highlight-step">
            <div className="step-badge">6</div>
            <div className="step-content">
              <h4>React Dashboard</h4>
              <p>Trực quan hóa & Phân tích AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Cpu, RotateCcw, Activity, Zap, ShieldCheck } from 'lucide-react';
import { useUnit } from '../context/UnitContext';
import './SensorCard.css';

export default function SensorCard({ sensorStatus }) {
  const { unitLabels, convertAccel } = useUnit();
  const isConnected = sensorStatus?.connected ?? false;
  const current = sensorStatus?.currentData || {
    accelerometerX: 0.0,
    accelerometerY: 0.0,
    accelerometerZ: 9.81,
    gyroscopeX: 0.0,
    gyroscopeY: 0.0,
    gyroscopeZ: 0.0,
    pitch: 0.0,
    roll: 0.0,
    yaw: 0.0,
    movementIntensity: 0,
  };

  const ax = current.accelerometerX || 0;
  const ay = current.accelerometerY || 0;
  const az = current.accelerometerZ || 9.81;
  const resultantMag = Math.hypot(ax, ay, az);
  const resultantG = (resultantMag / 9.80665).toFixed(2);
  const dynamicAccel = Math.max(0, resultantMag - 9.80665).toFixed(2);
  const landingSoftness = isConnected ? Math.max(45, Math.min(100, Math.round(100 - Math.min(55, Math.max(0, (Number(resultantG) - 1.8) * 22))))) : 0;
  const explosiveness = isConnected ? Math.min(100, Math.max(40, Math.round(resultantMag * 3.3))) : 0;

  return (
    <div className="card sensor-overview-card">
      <div className="sensor-card-top-header">
        <div className="sensor-title-group">
          <div className="sensor-chip-icon">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="card-title">Dữ Liệu Vận Động Trực Tiếp</h2>
            <p className="card-subtitle">Theo dõi tư thế, độ xoay và lực tác động theo thời gian thực</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="sensor-status-badge-wrapper">
          <span className="status-caption">Trạng thái cảm biến:</span>
          <div className={`status-pill ${isConnected ? 'status-online' : 'status-offline'}`}>
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span>{isConnected ? 'Đang kết nối' : 'Đã ngắt kết nối'}</span>
          </div>
        </div>
      </div>

      <div className="sensor-subcards-grid">
        {/* Subcard 1: Accelerometer */}
        <div className="sensor-subcard">
          <div className="subcard-header">
            <span className="subcard-name">LỰC TÁC ĐỘNG (GIA TỐC)</span>
            <span className="subcard-unit">{unitLabels.accel}</span>
          </div>
          <div className="axis-readings">
            <div className="axis-item">
              <span className="axis-tag x">X</span>
              <span className="axis-num">{convertAccel(current.accelerometerX ?? 0).toFixed(2)}</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag y">Y</span>
              <span className="axis-num">{convertAccel(current.accelerometerY ?? 0).toFixed(2)}</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag z">Z</span>
              <span className="axis-num">{convertAccel(current.accelerometerZ ?? 9.81).toFixed(2)}</span>
            </div>
          </div>
          <div className="subcard-footer">
            <span>Lực tác động tổng hợp: {resultantG} G</span>
          </div>
        </div>

        {/* Subcard 2: Gyroscope */}
        <div className="sensor-subcard">
          <div className="subcard-header">
            <span className="subcard-name">TỐC ĐỘ XOAY NGƯỜI</span>
            <span className="subcard-unit">°/s</span>
          </div>
          <div className="axis-readings">
            <div className="axis-item">
              <span className="axis-tag x">X</span>
              <span className="axis-num">{(current.gyroscopeX ?? 0).toFixed(1)}</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag y">Y</span>
              <span className="axis-num">{(current.gyroscopeY ?? 0).toFixed(1)}</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag z">Z</span>
              <span className="axis-num">{(current.gyroscopeZ ?? 0).toFixed(1)}</span>
            </div>
          </div>
          <div className="subcard-footer">
            <span>Tốc độ xoay đổi hướng</span>
          </div>
        </div>

        {/* Subcard 3: Orientation */}
        <div className="sensor-subcard">
          <div className="subcard-header">
            <span className="subcard-name">TƯ THẾ & GÓC NGHIÊNG</span>
            <span className="subcard-unit">Độ (°)</span>
          </div>
          <div className="axis-readings">
            <div className="axis-item">
              <span className="axis-tag pitch">Cúi/Ngửa</span>
              <span className="axis-num">{Math.round(current.pitch || 0)}°</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag roll">Nghiêng bên</span>
              <span className="axis-num">{Math.round(current.roll || 0)}°</span>
            </div>
            <div className="axis-item">
              <span className="axis-tag yaw">Xoay hướng</span>
              <span className="axis-num">{Math.round(current.yaw || 0)}°</span>
            </div>
          </div>
          <div className="subcard-footer">
            <span>Góc tư thế cơ thể</span>
          </div>
        </div>

        {/* Subcard 4: Motion & Kinematics */}
        <div className="sensor-subcard">
          <div className="subcard-header">
            <span className="subcard-name">CHUYỂN ĐỘNG & CƯỜNG ĐỘ</span>
            <span className="subcard-unit">Trực tiếp</span>
          </div>
          <div className="axis-readings">
            <div className="axis-item">
              <span className="axis-tag dynamic"><Zap size={10} /> Lực vận động</span>
              <span className="axis-num highlight-neon">{convertAccel(dynamicAccel).toFixed(2)} <small>{unitLabels.accel}</small></span>
            </div>
            <div className="axis-item">
              <span className="axis-tag intensity"><Activity size={10} /> Cường độ</span>
              <span className="axis-num highlight-cyan">{Math.round(current.movementIntensity || 0)}%</span>
            </div>
          </div>
          <div className="subcard-footer">
            <span>
              {current.movementIntensity > 70
                ? 'Vận động cường độ cao'
                : current.movementIntensity > 25
                ? 'Vận động vừa sức'
                : 'Nghỉ ngơi / Nhẹ nhàng'}
            </span>
          </div>
        </div>

        {/* Subcard 5: Biomechanics DSP Live */}
        <div className="sensor-subcard">
          <div className="subcard-header">
            <span className="subcard-name">ĐÁNH GIÁ CHUYỂN ĐỘNG</span>
            <span className="subcard-unit">Đo trực tiếp</span>
          </div>
          <div className="axis-readings">
            <div className="axis-item">
              <span className="axis-tag dynamic"><ShieldCheck size={10} /> Độ Êm</span>
              <span className="axis-num highlight-cyan">{landingSoftness}<small>/100</small></span>
            </div>
            <div className="axis-item">
              <span className="axis-tag intensity"><Zap size={10} /> Bùng Nổ</span>
              <span className="axis-num highlight-neon">{explosiveness}<small>/100</small></span>
            </div>
          </div>
          <div className="subcard-footer">
            <span>{Number(resultantG) <= 2.4 ? `Tiếp đất êm ái (${resultantG}G)` : `Lực va chạm: ${resultantG}G`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

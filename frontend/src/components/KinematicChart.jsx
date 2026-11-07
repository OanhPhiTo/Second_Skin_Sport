import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Download,
  Play,
  Square,
  Sliders,
  CheckCircle2,
  Footprints,
  Zap,
  Tag,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { useBle } from '../context/BleContext';
import './KinematicChart.css';

export default function KinematicChart() {
  const {
    bleStatus,
    bleTelemetry,
    isLoggingCsv,
    csvActiveLabel,
    csvLogsCount,
    startCsvLogging,
    stopCsvLogging,
    setCsvActiveLabel,
    downloadCsvLog,
    kinematicConfig,
    updateKinematicConfig,
    calibrateImu,
  } = useBle();

  // Buffer 80 điểm vẽ biểu đồ thời gian thực (đảm bảo không nghẽn DOM)
  const [chartData, setChartData] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [formConfig, setFormConfig] = useState(kinematicConfig);
  const [configSuccess, setConfigSuccess] = useState('');

  // Cập nhật điểm dữ liệu mới mỗi khi nhận gói tin BLE
  useEffect(() => {
    if (!bleTelemetry) return;

    const amagVal = Number(bleTelemetry.amag ?? (Math.hypot(bleTelemetry.ax || 0, bleTelemetry.ay || 0, bleTelemetry.az || 9.81) / 9.80665).toFixed(2));
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit' }) + '.' + Math.floor((Date.now() % 1000) / 100);

    const point = {
      time: nowTimeStr,
      amag: amagVal,
      event: bleTelemetry.evt || 'NONE',
      jumpMarker: bleTelemetry.evt === 'JUMP' ? amagVal : null,
      stepMarker: bleTelemetry.evt === 'RUN_STEP' ? amagVal : null,
    };

    setChartData((prev) => {
      const next = [...prev, point];
      if (next.length > 80) {
        return next.slice(next.length - 80);
      }
      return next;
    });
  }, [bleTelemetry]);

  // Đồng bộ form khi context config thay đổi
  useEffect(() => {
    setFormConfig(kinematicConfig);
  }, [kinematicConfig]);

  const handleApplyConfig = async (e) => {
    e.preventDefault();
    try {
      await updateKinematicConfig(formConfig);
      setConfigSuccess('Đã cập nhật độ nhạy chuyển động thành công!');
      setTimeout(() => setConfigSuccess(''), 3500);
    } catch (err) {
      alert('Lỗi cập nhật cấu hình: ' + err.message);
    }
  };

  const isConnected = bleStatus === 'connected';

  return (
    <div className="card kinematic-card">
      {/* Header */}
      <div className="kinematic-header">
        <div className="kinematic-title-group">
          <div className="kinematic-icon-badge">
            <Activity size={20} className="highlight-cyan" />
          </div>
          <div>
            <h3 className="kinematic-card-title">Biểu Đồ Chuyển Động & Nhận Diện Động Tác</h3>
            <p className="kinematic-card-subtitle">
              Trực quan hóa lực vận động, tự động nhận diện từng bước chạy và cú bật nhảy theo thời gian thực.
            </p>
          </div>
        </div>

        <div className="kinematic-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setConfigOpen(!configOpen)}
            disabled={!isConnected}
          >
            <Sliders size={14} />
            {configOpen ? 'Ẩn Cài Đặt' : 'Tùy Chỉnh Độ Nhạy'}
          </button>

          <button
            type="button"
            className="btn btn-outline-cyan btn-sm"
            onClick={calibrateImu}
            disabled={!isConnected}
            title="Đặt thiết bị nằm yên trong 2 giây rồi bấm để cân bằng lại cảm biến"
          >
            <RotateCcw size={14} />
            Cân Bằng Cảm Biến
          </button>
        </div>
      </div>

      {/* Panel Cấu Hình Ngưỡng (Có thể chỉnh mà không cần nạp lại firmware) */}
      {configOpen && (
        <form className="kinematic-config-panel" onSubmit={handleApplyConfig}>
          <div className="config-grid">
            <div className="config-item">
              <label>Độ nhạy khi nhảy lên (g):</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.8"
                value={formConfig.flightThresh}
                onChange={(e) => setFormConfig({ ...formConfig, flightThresh: parseFloat(e.target.value) })}
              />
              <span className="config-hint">Mặc định: 0.40g (lực nhấc chân khi bắt đầu nhảy)</span>
            </div>

            <div className="config-item">
              <label>Lực chạm đất khi chạy (g):</label>
              <input
                type="number"
                step="0.1"
                min="1.2"
                max="5.0"
                value={formConfig.runImpact}
                onChange={(e) => setFormConfig({ ...formConfig, runImpact: parseFloat(e.target.value) })}
              />
              <span className="config-hint">Mặc định: 2.00g (lực chân chạm sàn khi chạy)</span>
            </div>

            <div className="config-item">
              <label>Lực tiếp đất khi nhảy (g):</label>
              <input
                type="number"
                step="0.1"
                min="2.0"
                max="8.0"
                value={formConfig.jumpImpact}
                onChange={(e) => setFormConfig({ ...formConfig, jumpImpact: parseFloat(e.target.value) })}
              />
              <span className="config-hint">Mặc định: 2.80g (lực nén tiếp đất sau cú nhảy)</span>
            </div>

            <div className="config-item">
              <label>Thời gian bay tối thiểu (ms):</label>
              <input
                type="number"
                step="10"
                min="150"
                max="500"
                value={formConfig.jumpAirtime}
                onChange={(e) => setFormConfig({ ...formConfig, jumpAirtime: parseInt(e.target.value, 10) })}
              />
              <span className="config-hint">Mặc định: 220ms (thời gian trên không tính là cú nhảy)</span>
            </div>

            <div className="config-item">
              <label>Khoảng cách bước chạy (ms):</label>
              <input
                type="number"
                step="10"
                min="150"
                max="400"
                value={formConfig.runRefractory}
                onChange={(e) => setFormConfig({ ...formConfig, runRefractory: parseInt(e.target.value, 10) })}
              />
              <span className="config-hint">Mặc định: 250ms (chống tính trùng bước chân)</span>
            </div>

            <div className="config-item">
              <label>Khoảng cách giữa các cú nhảy (ms):</label>
              <input
                type="number"
                step="20"
                min="250"
                max="600"
                value={formConfig.jumpRefractory}
                onChange={(e) => setFormConfig({ ...formConfig, jumpRefractory: parseInt(e.target.value, 10) })}
              />
              <span className="config-hint">Mặc định: 350ms (thời gian phục hồi sau tiếp đất)</span>
            </div>
          </div>

          <div className="config-actions-row">
            <button type="submit" className="btn btn-primary btn-sm">
              <RefreshCw size={14} />
              Lưu Độ Nhạy Mới
            </button>
            {configSuccess && (
              <span className="config-success-msg">
                <CheckCircle2 size={16} /> {configSuccess}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Biểu đồ Realtime a_mag vẽ chồng các ngưỡng */}
      <div className="kinematic-chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} interval="preserveEnd" />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              domain={[0, 'dataMax + 0.8']}
              unit="g"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value, name) => {
                if (name === 'amag') return [`${value} g`, 'Lực vận động'];
                if (name === 'jumpMarker' && value) return [`${value} g`, '🏀 Cú nhảy'];
                if (name === 'stepMarker' && value) return [`${value} g`, '🏃 Bước chạy'];
                return [value, name];
              }}
            />

            {/* Vạch ngưỡng Pha Bay (Flight Threshold) */}
            <ReferenceLine
              y={kinematicConfig.flightThresh}
              stroke="#eab308"
              strokeDasharray="3 3"
              label={{ value: `Ngưỡng bay: ${kinematicConfig.flightThresh}g`, fill: '#eab308', fontSize: 11, position: 'insideTopLeft' }}
            />

            {/* Vạch ngưỡng Tiếp Đất Chạy (Run Impact Threshold) */}
            <ReferenceLine
              y={kinematicConfig.runImpact}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: `Chạm đất chạy: ${kinematicConfig.runImpact}g`, fill: '#22c55e', fontSize: 11, position: 'insideTopLeft' }}
            />

            {/* Vạch ngưỡng Tiếp Đất Nhảy (Jump Impact Threshold) */}
            <ReferenceLine
              y={kinematicConfig.jumpImpact}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Tiếp đất nhảy: ${kinematicConfig.jumpImpact}g`, fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }}
            />

            {/* Đường tín hiệu a_mag */}
            <Line
              type="monotone"
              dataKey="amag"
              name="amag"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Điểm đánh dấu cú nhảy (JUMP EVENT) */}
            <Line
              type="monotone"
              dataKey="jumpMarker"
              name="jumpMarker"
              stroke="#ef4444"
              strokeWidth={0}
              dot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />

            {/* Điểm đánh dấu bước chạy (RUN EVENT) */}
            <Line
              type="monotone"
              dataKey="stepMarker"
              name="stepMarker"
              stroke="#22c55e"
              strokeWidth={0}
              dot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Thanh Điều Khiển Ghi Log CSV & Gắn Nhãn (Bước 3) */}
      <div className="kinematic-logging-bar">
        <div className="logging-status-group">
          <div className={`record-indicator ${isLoggingCsv ? 'recording' : ''}`}>
            <span className="dot" />
            <span>{isLoggingCsv ? `Đang ghi: ${csvLogsCount.toLocaleString()} mẫu` : 'Chưa ghi log'}</span>
          </div>

          {!isLoggingCsv ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={startCsvLogging}
              disabled={!isConnected}
            >
              <Play size={14} /> Bắt Đầu Ghi Dữ Liệu Thực (CSV)
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={stopCsvLogging}
            >
              <Square size={14} /> Dừng Ghi Dữ Liệu
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline-cyan btn-sm"
            onClick={downloadCsvLog}
            disabled={csvLogsCount === 0}
          >
            <Download size={14} /> Tải File CSV ({csvLogsCount})
          </button>
        </div>

        {/* Các Nút Gắn Nhãn Thực Tế (Ground Truth Labeling) */}
        <div className="labeling-button-group">
          <span className="label-caption"><Tag size={13} /> Gắn nhãn động tác:</span>
          <div className="label-buttons">
            <button
              type="button"
              className={`btn-label ${csvActiveLabel === 'IDLE' ? 'active-idle' : ''}`}
              onClick={() => setCsvActiveLabel('IDLE')}
            >
              💤 Đứng yên
            </button>
            <button
              type="button"
              className={`btn-label ${csvActiveLabel === 'RUN' ? 'active-run' : ''}`}
              onClick={() => setCsvActiveLabel('RUN')}
            >
              🏃 Chạy bộ
            </button>
            <button
              type="button"
              className={`btn-label ${csvActiveLabel === 'JUMP' ? 'active-jump' : ''}`}
              onClick={() => setCsvActiveLabel('JUMP')}
            >
              <Zap size={13} /> Bật nhảy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

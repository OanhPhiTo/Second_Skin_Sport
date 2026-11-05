import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { statisticsService } from '../services/api';
import './PerformanceChart.css';

export default function PerformanceChart() {
  const [timeRange, setTimeRange] = useState('7 Days');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    statisticsService.getStatistics('All', timeRange)
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res) && res.length > 0) {
          // Count occurrences of date labels to disambiguate multiple sessions on the same date
          const dateCounts = {};
          res.forEach((item) => {
            let dKey = '';
            if (Array.isArray(item.date) && item.date.length >= 3) {
              dKey = `${String(item.date[2]).padStart(2, '0')}/${String(item.date[1]).padStart(2, '0')}`;
            } else if (item.date) {
              const parts = String(item.date).split('T')[0].split('-');
              if (parts.length === 3) dKey = `${parts[2]}/${parts[1]}`;
            } else if (item.startTime) {
              const d = new Date(item.startTime);
              if (!isNaN(d.getTime())) {
                dKey = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
              }
            }
            if (dKey) {
              dateCounts[dKey] = (dateCounts[dKey] || 0) + 1;
            }
          });

          const dateIndices = {};
          const mapped = res.map((item, idx) => {
            let label = '';
            if (Array.isArray(item.date) && item.date.length >= 3) {
              label = `${String(item.date[2]).padStart(2, '0')}/${String(item.date[1]).padStart(2, '0')}`;
            } else if (item.date) {
              const parts = String(item.date).split('T')[0].split('-');
              if (parts.length === 3) {
                label = `${parts[2]}/${parts[1]}`;
              }
            } else if (item.startTime) {
              const d = new Date(item.startTime);
              if (!isNaN(d.getTime())) {
                label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
              }
            }

            if (!label) {
              label = `#${idx + 1}`;
            } else if (item.startTime && (timeRange === 'Today' || dateCounts[label] > 1)) {
              const d = new Date(item.startTime);
              if (!isNaN(d.getTime())) {
                const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                label = timeRange === 'Today' ? timeStr : `${label} ${timeStr}`;
              } else if (dateCounts[label] > 1) {
                dateIndices[label] = (dateIndices[label] || 0) + 1;
                label = `${label} (P${dateIndices[label]})`;
              }
            } else if (dateCounts[label] > 1) {
              dateIndices[label] = (dateIndices[label] || 0) + 1;
              label = `${label} (P${dateIndices[label]})`;
            }

            return {
              time: label,
              acceleration: Number(Number(item.averageAcceleration || 0).toFixed(2)),
              speed: Number(Number(item.averageSpeed || 0).toFixed(1)),
              intensity: Number(item.movementIntensity || 0),
            };
          });
          setChartData(mapped);
        } else {
          setChartData([]);
        }
      })
      .catch(() => {
        if (isMounted) setChartData([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [timeRange]);

  const data = chartData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-custom-tooltip">
          <div className="tooltip-label">{label}</div>
          <div className="tooltip-items">
            {payload.map((item, index) => (
              <div key={index} className="tooltip-item">
                <span className="tooltip-dot" style={{ backgroundColor: item.color }} />
                <span className="tooltip-name">{item.name}:</span>
                <span className="tooltip-val">{item.value} {item.unit || ''}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card performance-chart-card">
      <div className="chart-header">
        <div>
          <h2 className="card-title">Hiệu Suất Chuyển Động</h2>
          <p className="card-subtitle">Dữ liệu đo cảm biến thời gian thực & cường độ vận động sinh trắc học</p>
        </div>

        <div className="time-range-toggle">
          {[
            { key: 'Today', label: 'Hôm nay' },
            { key: '7 Days', label: '7 Ngày' },
            { key: '30 Days', label: '30 Ngày' },
          ].map((range) => (
            <button
              key={range.key}
              className={`range-btn ${timeRange === range.key ? 'active' : ''}`}
              onClick={() => setTimeRange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        {data.length === 0 ? (
          <div className="chart-empty-state">
            <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>Chưa có dữ liệu buổi tập nào trong khoảng thời gian {timeRange === 'Today' ? 'hôm nay' : timeRange === '7 Days' ? '7 ngày qua' : '30 ngày qua'}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4facfe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4facfe" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="neonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff87" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00ff87" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{value}</span>}
              />

              <Area
                type="monotone"
                dataKey="acceleration"
                name="Gia tốc (m/s²)"
                stroke="#00f2fe"
                strokeWidth={2.5}
                fill="url(#cyanGrad)"
                activeDot={{ r: 6, fill: '#00f2fe' }}
              />
              <Area
                type="monotone"
                dataKey="speed"
                name="Tốc độ (km/h)"
                stroke="#4facfe"
                strokeWidth={2}
                fill="url(#blueGrad)"
              />
              <Area
                type="monotone"
                dataKey="intensity"
                name="Cường độ vận động (%)"
                stroke="#00ff87"
                strokeWidth={2}
                fill="url(#neonGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

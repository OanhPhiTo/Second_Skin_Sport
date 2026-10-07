import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Filter,
  Gauge,
  Zap,
  Activity,
  ArrowUpRight,
  Award,
  Navigation,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { statisticsService } from '../services/api';
import './Statistics.css';

export default function Statistics() {
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedTime, setSelectedTime] = useState('This Week');
  const [statsList, setStatsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sports data dataset for rich charts (Focused on Running & Basketball)
  const datasetMap = {
    Running: [
      { date: '09/08', speed: 13.5, acceleration: 2.2, intensity: 74, jumps: 0, score: 79 },
      { date: '09/10', speed: 14.2, acceleration: 2.3, intensity: 77, jumps: 0, score: 81 },
      { date: '09/12', speed: 14.5, acceleration: 2.4, intensity: 78, jumps: 0, score: 82 },
      { date: '09/14', speed: 14.8, acceleration: 2.41, intensity: 79, jumps: 0, score: 82 },
      { date: '09/16', speed: 15.2, acceleration: 2.55, intensity: 83, jumps: 0, score: 86 },
    ],
    Basketball: [
      { date: '09/10', speed: 17.5, acceleration: 3.1, intensity: 85, jumps: 52, score: 89 },
      { date: '09/12', speed: 18.2, acceleration: 3.3, intensity: 88, jumps: 58, score: 92 },
      { date: '09/14', speed: 16.8, acceleration: 2.9, intensity: 82, jumps: 45, score: 86 },
      { date: '09/15', speed: 17.2, acceleration: 2.89, intensity: 84, jumps: 43, score: 87 },
      { date: '09/16', speed: 18.4, acceleration: 3.21, intensity: 88, jumps: 56, score: 91 },
    ],
    All: [
      { date: '09/08', speed: 13.5, acceleration: 2.2, intensity: 74, jumps: 0, score: 79 },
      { date: '09/10', speed: 17.5, acceleration: 3.1, intensity: 85, jumps: 52, score: 89 },
      { date: '09/12', speed: 18.2, acceleration: 3.3, intensity: 88, jumps: 58, score: 92 },
      { date: '09/14', speed: 14.8, acceleration: 2.41, intensity: 79, jumps: 0, score: 82 },
      { date: '09/15', speed: 17.2, acceleration: 2.89, intensity: 84, jumps: 43, score: 87 },
      { date: '09/16', speed: 18.4, acceleration: 3.21, intensity: 88, jumps: 56, score: 91 },
    ],
  };

  const currentChartData = datasetMap[selectedSport] || datasetMap['All'];

  // Calculate dynamic averages based on current view
  const avgSpeed = (
    currentChartData.reduce((acc, c) => acc + c.speed, 0) / currentChartData.length
  ).toFixed(1);
  const avgAccel = (
    currentChartData.reduce((acc, c) => acc + c.acceleration, 0) / currentChartData.length
  ).toFixed(2);
  const totalJumps = currentChartData.reduce((acc, c) => acc + c.jumps, 0);
  const avgIntensity = Math.round(
    currentChartData.reduce((acc, c) => acc + c.intensity, 0) / currentChartData.length
  );
  const avgScore = Math.round(
    currentChartData.reduce((acc, c) => acc + c.score, 0) / currentChartData.length
  );

  return (
    <div className="statistics-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="hero-title">Performance Statistics</h1>
          <p className="hero-subtitle">
            Longitudinal athletic telemetry and movement analytics across sport modalities.
          </p>
        </div>

        {/* Filters */}
        <div className="filters-container">
          {/* Sport Filter */}
          <div className="filter-group">
            <span className="filter-label">Sport:</span>
            <div className="filter-pills">
              {['All', 'Running', 'Basketball'].map((sport) => (
                <button
                  key={sport}
                  className={`filter-pill ${selectedSport === sport ? 'active' : ''}`}
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div className="filter-group">
            <span className="filter-label">Time:</span>
            <div className="filter-pills">
              {['Today', 'This Week', 'This Month', 'Custom'].map((time) => (
                <button
                  key={time}
                  className={`filter-pill ${selectedTime === time ? 'active' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid-cols-6 stats-kpis">
        <StatCard title="Average Speed" value={avgSpeed} unit="km/h" change="+1.4%" icon={Navigation} accent="blue" />
        <StatCard title="Avg Acceleration" value={avgAccel} unit="m/s²" change="+4.2%" icon={Gauge} accent="cyan" />
        <StatCard title="Total Distance" value="48.6" unit="km" change="+8.1%" icon={Zap} accent="cyan" />
        <StatCard title="Total Jumps" value={totalJumps} change="+12.0%" icon={ArrowUpRight} accent="green" />
        <StatCard title="Movement Intensity" value={`${avgIntensity}%`} change="+3.5%" icon={Activity} accent="purple" />
        <StatCard title="Performance Score" value={`${avgScore}%`} change="+5.2%" icon={Award} accent="green" />
      </div>

      {/* 5 Deep-Dive Charts */}
      <div className="charts-double-grid">
        {/* Chart 1: Speed Over Time */}
        <div className="card chart-box">
          <div className="chart-box-header">
            <h3>1. Speed Over Time</h3>
            <span className="badge badge-sport">VELOCITY</span>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" km/h" />
                <Tooltip />
                <Line type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#4facfe" strokeWidth={3} dot={{ fill: '#4facfe', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Acceleration Over Time */}
        <div className="card chart-box">
          <div className="chart-box-header">
            <h3>2. Acceleration Over Time</h3>
            <span className="badge badge-sport">G-FORCE DYNAMICS</span>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={currentChartData}>
                <defs>
                  <linearGradient id="accelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" m/s²" />
                <Tooltip />
                <Area type="monotone" dataKey="acceleration" name="Acceleration" stroke="#00f2fe" strokeWidth={3} fill="url(#accelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Movement Intensity */}
        <div className="card chart-box">
          <div className="chart-box-header">
            <h3>3. Movement Intensity</h3>
            <span className="badge badge-sport">EXERTION (%)</span>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={currentChartData}>
                <defs>
                  <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[40, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip />
                <Area type="monotone" dataKey="intensity" name="Intensity (%)" stroke="#00ff87" strokeWidth={3} fill="url(#intGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Jumps Per Session */}
        <div className="card chart-box">
          <div className="chart-box-header">
            <h3>4. Jumps Per Session</h3>
            <span className="badge badge-sport">EXPLOSIVE POWER</span>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="jumps" name="Total Jumps" fill="#00f2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 5: Performance Score Full Width */}
      <div className="card chart-box full-width-chart">
        <div className="chart-box-header">
          <div>
            <h3>5. Overall Performance Score Trend</h3>
            <p className="card-subtitle">Aggregated AI index combining speed, acceleration stability, and jump cadence</p>
          </div>
          <span className="badge badge-success">TARGET &gt; 85%</span>
        </div>
        <div className="chart-inner">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={currentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="Performance Score" stroke="#00ff87" strokeWidth={3} dot={{ r: 5, fill: '#00ff87' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

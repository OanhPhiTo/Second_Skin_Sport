import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ title, value, unit, change, isPositive = true, icon: Icon, accent = 'cyan' }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="stat-card-top">
        <span className="stat-title" title={title}>{title}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>

      {change && (
        <div className="stat-bottom-row">
          <span className={`stat-badge ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
          <span className="stat-period">vs last session</span>
        </div>
      )}
    </div>
  );
}

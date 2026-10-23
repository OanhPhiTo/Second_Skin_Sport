import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({
  title,
  value,
  unit,
  change,
  isPositive,
  period,
  icon: Icon,
  accent = 'cyan',
}) {
  const positive = isPositive !== undefined ? isPositive : !String(change || '').trim().startsWith('-');
  const shouldShowPeriod = period !== undefined
    ? Boolean(period)
    : !String(change || '').match(/(week|month|day|sess|Optimal|Good|benchmark|tuần|tháng|ngày|phiên|Hạng)/i);
  const periodText = period !== undefined ? period : 'so với phiên trước';

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
          <span className={`stat-badge ${positive ? 'positive' : 'negative'}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
          {shouldShowPeriod && <span className="stat-period">{periodText}</span>}
        </div>
      )}
    </div>
  );
}

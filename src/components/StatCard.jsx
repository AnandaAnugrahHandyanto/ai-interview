import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  trend = null, 
  trendDirection = 'neutral', 
  trendLabel = '',
  description = '',
  gradientTheme = 'purple'
}) {
  return (
    <div className={`stat-card theme-${gradientTheme}`}>
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={20} className="stat-icon-svg" />
          </div>
        )}
      </div>

      <div className="stat-card-value-row">
        <span className="stat-card-value">{value}</span>
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>

      <div className="stat-card-footer">
        {trend !== null && (
          <div className={`stat-trend-tag trend-${trendDirection}`}>
            {trendDirection === 'up' && <TrendingUp size={13} />}
            {trendDirection === 'down' && <TrendingDown size={13} />}
            {trendDirection === 'neutral' && <Minus size={13} />}
            <span>{trend}</span>
          </div>
        )}
        <span className="stat-card-desc">{trendLabel || description}</span>
      </div>
    </div>
  );
}

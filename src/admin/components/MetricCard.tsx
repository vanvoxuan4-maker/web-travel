import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  trendText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  valueColor = '#0f172a',
  trendText
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>{title}</span>
        <span
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem'
          }}
        >
          <i className={icon}></i>
        </span>
      </div>

      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: valueColor, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
        {value}
      </div>

      <div style={{ fontSize: '0.76rem', color: trendText ? '#059669' : '#64748b', fontWeight: trendText ? 700 : 500 }}>
        {trendText ? (
          <span>
            <i className="fa-solid fa-arrow-trend-up" style={{ marginRight: '0.3rem' }}></i>
            {trendText}
          </span>
        ) : (
          subtitle
        )}
      </div>
    </div>
  );
};

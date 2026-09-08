import React, { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  trendText?: string;
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  onClick?: () => void;
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  valueColor = '#0f172a',
  trendText,
  badgeText,
  badgeBg = '#fef2f2',
  badgeColor = '#dc2626',
  onClick,
  tooltip
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => isClickable && setIsHovered(true)}
      onMouseLeave={() => isClickable && setIsHovered(false)}
      title={tooltip || (isClickable ? 'Bấm để xem chi tiết' : undefined)}
      style={{
        background: '#ffffff',
        padding: '1.25rem 1.4rem',
        borderRadius: '16px',
        border: isClickable && isHovered ? `1.5px solid ${iconColor}` : '1px solid #e2e8f0',
        boxShadow: isClickable && isHovered
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
          : '0 2px 4px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: isClickable ? 'pointer' : 'default',
        transform: isClickable && isHovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>{title}</span>
          {badgeText && (
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '0.12rem 0.45rem',
                borderRadius: '6px',
                background: badgeBg,
                color: badgeColor
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isClickable && (
            <span
              style={{
                fontSize: '0.72rem',
                color: isHovered ? iconColor : '#94a3b8',
                transition: 'color 0.2s'
              }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </span>
          )}
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
      </div>

      <div style={{ fontSize: '1.55rem', fontWeight: 800, color: valueColor, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
        {value}
      </div>

      <div style={{ fontSize: '0.76rem', color: trendText ? '#059669' : '#64748b', fontWeight: trendText ? 700 : 500, lineHeight: 1.4 }}>
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

import React, { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const criteria = useMemo(() => {
    return {
      length: password.length >= 8,
      upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
  }, [password]);

  const score = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (criteria.length) s++;
    if (criteria.upperLower) s++;
    if (criteria.number) s++;
    if (criteria.special) s++;
    // If length is less than 6, max score is 1
    if (password.length < 6) return Math.min(s, 1);
    return s;
  }, [password, criteria]);

  const tier = useMemo(() => {
    switch (score) {
      case 1:
        return {
          label: 'Yếu như Wifi cà phê ☕',
          color: '#ef4444',
          bg: '#fef2f2',
          bars: 1
        };
      case 2:
        return {
          label: 'Tạm ổn cho chuyến đi ngắn 🎒',
          color: '#f59e0b',
          bg: '#fffbeb',
          bars: 2
        };
      case 3:
        return {
          label: 'Khá an toàn & bảo mật 🛡️',
          color: '#10b981',
          bg: '#ecfdf5',
          bars: 3
        };
      case 4:
        return {
          label: 'Bất khả xâm phạm - Chuẩn VIP 🚀',
          color: '#059669',
          bg: '#ecfdf5',
          bars: 4
        };
      default:
        return {
          label: 'Tối thiểu 8 ký tự với chữ hoa, số & ký tự đặc biệt',
          color: '#94a3b8',
          bg: '#f8fafc',
          bars: 0
        };
    }
  }, [score]);

  if (!password) return null;

  return (
    <div
      style={{
        marginTop: '-0.35rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: tier.bg,
        borderRadius: '12px',
        border: `1px solid ${tier.color}30`,
        transition: 'all 0.25s ease'
      }}
    >
      {/* Header bar and label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: tier.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <i className="fa-solid fa-shield-halved" />
          <span>{tier.label}</span>
        </span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tier.color }}>
          {score}/4 tiêu chí
        </span>
      </div>

      {/* 4-segment Progress Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '0.6rem' }}>
        {[1, 2, 3, 4].map((step) => {
          const isActive = step <= tier.bars;
          return (
            <div
              key={step}
              style={{
                height: '5px',
                borderRadius: '999px',
                background: isActive ? tier.color : '#e2e8f0',
                transition: 'background 0.3s ease, transform 0.2s ease',
                transform: isActive ? 'scaleY(1.15)' : 'scaleY(1)'
              }}
            />
          );
        })}
      </div>

      {/* 4 Interactive Verification Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        <Chip active={criteria.length} label="Từ 8 ký tự" />
        <Chip active={criteria.upperLower} label="Hoa & thường (Aa)" />
        <Chip active={criteria.number} label="Có chữ số (0-9)" />
        <Chip active={criteria.special} label="Ký tự đặc biệt (@#$)" />
      </div>
    </div>
  );
};

const Chip: React.FC<{ active: boolean; label: string }> = ({ active, label }) => {
  return (
    <span
      style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        padding: '0.15rem 0.45rem',
        borderRadius: '6px',
        background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
        color: active ? '#059669' : '#64748b',
        border: active ? '1px solid #10b981' : '1px solid #e2e8f0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        transition: 'all 0.2s ease'
      }}
    >
      <i className={`fa-solid ${active ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ fontSize: '0.65rem' }} />
      <span>{label}</span>
    </span>
  );
};

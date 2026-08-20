import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#111827', color: '#9ca3af', padding: '3.5rem 0 2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5rem' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Link to="/" className="brand-logo" style={{ color: '#ffffff', textDecoration: 'none' }}>
          <i className="fa-solid fa-compass" style={{ color: 'var(--accent-emerald)' }}></i>
          <span>WebTravel <span style={{ color: 'var(--accent-emerald)', fontStyle: 'italic' }}>Editorial</span></span>
        </Link>
        <p style={{ fontSize: '0.88rem', margin: 0 }}>
          © 2026 WebTravel Editorial. Ấn phẩm thông tin du lịch trải nghiệm cao cấp & minh bạch.
        </p>
      </div>
    </footer>
  );
};

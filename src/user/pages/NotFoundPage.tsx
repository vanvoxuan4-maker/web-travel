import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6rem 1.5rem 4rem',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '560px',
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#ecfdf5',
          border: '2px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#047857',
          fontSize: '2.2rem'
        }}>
          <i className="fa-solid fa-compass" />
        </div>

        <div style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: '#047857',
          lineHeight: 1,
          marginBottom: '0.75rem',
          fontFamily: 'var(--font-heading, serif)'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '0.75rem'
        }}>
          Không Tìm Thấy Trang Yêu Cầu
        </h1>

        <p style={{
          color: '#64748b',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          Hành trình hoặc liên kết bạn đang tìm kiếm có thể đã thay đổi địa chỉ hoặc không còn tồn tại trên hệ thống WebTravel.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/"
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '9999px',
              background: '#047857',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)'
            }}
          >
            <i className="fa-solid fa-house" />
            Về Trang Chủ
          </Link>

          <Link
            to="/tours"
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '9999px',
              background: '#f8fafc',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
            Khám Phá Tour
          </Link>
        </div>
      </div>
    </div>
  );
};

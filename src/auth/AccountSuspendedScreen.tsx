import React from 'react';
import { UserProfile } from './auth.types';

interface AccountSuspendedScreenProps {
  user: UserProfile;
  onSignOut: () => Promise<void> | void;
  reason?: string;
}

export const AccountSuspendedScreen: React.FC<AccountSuspendedScreenProps> = ({
  user,
  onSignOut,
  reason
}) => {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Error signing out:', err);
      window.location.href = '/login';
    }
  };

  const handleGoHomeAsGuest = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
      window.location.href = '/';
    }
  };

  const defaultReason =
    reason ||
    'Tài khoản của bạn đã bị tạm khóa do vi phạm Quy chế hoạt động và Điều khoản bảo mật của WebTravel, hoặc có yêu cầu hạn chế từ Quản trị viên hệ thống.';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #021a18 0%, #042f2c 60%, #064e3b 100%)',
        color: '#ffffff',
        fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
        boxSizing: 'border-box',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        zIndex: 99999
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.15)',
          textAlign: 'center',
          animation: 'fadeInUp 0.3s ease-out'
        }}
      >
        {/* Animated Warning Icon */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.45) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.35)'
          }}
        >
          <i
            className="fa-solid fa-lock"
            style={{ fontSize: '2.4rem', color: '#f87171' }}
          />
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'inline-block'
            }}
          />
          Trạng Thái: Tài Khoản Đã Bị Khóa
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}
        >
          Quyền Truy Cập Tạm Thời Bị Đình Chỉ
        </h1>

        {/* Account Info Chip */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '0.65rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            color: '#e2e8f0'
          }}
        >
          <span>
            <i className="fa-solid fa-user" style={{ color: '#94a3b8', marginRight: '0.4rem' }} />
            <strong>{user.fullName || 'Thành viên'}</strong>
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
          <span style={{ color: '#cbd5e1' }}>{user.email}</span>
        </div>

        {/* Reason Box */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#fca5a5',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-circle-exclamation" />
            Lý do khóa tài khoản
          </div>
          <p
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: '#f1f5f9',
              margin: 0
            }}
          >
            {defaultReason}
          </p>
        </div>

        {/* Support Instructions */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.75rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            color: '#cbd5e1',
            lineHeight: 1.6
          }}
        >
          <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            Cần khiếu nại hoặc mở lại tài khoản?
          </div>
          <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.82rem' }}>
            Vui lòng liên hệ với Ban Quản Trị hoặc Tổng Đài Chăm Sóc Khách Hàng WebTravel để được hỗ trợ xác minh thông tin:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-phone" style={{ color: '#10b981', width: '16px' }} />
              <span>Hotline 24/7:</span>
              <a
                href="tel:19001234"
                style={{
                  color: '#34d399',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                1900 1234
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-envelope" style={{ color: '#38bdf8', width: '16px' }} />
              <span>Email:</span>
              <a
                href="mailto:hotro@webtravel.vn"
                style={{
                  color: '#7dd3fc',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                hotro@webtravel.vn
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-clock" style={{ color: '#fbbf24', width: '16px' }} />
              <span style={{ color: '#94a3b8' }}>Giờ làm việc: 08:00 - 21:00 (Hàng ngày)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.94rem',
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 8px 20px -4px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.2s ease',
              opacity: isSigningOut ? 0.7 : 1
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
            {isSigningOut ? 'Đang đăng xuất...' : 'Đăng Xuất Khỏi Tài Khoản'}
          </button>

          <button
            type="button"
            onClick={handleGoHomeAsGuest}
            disabled={isSigningOut}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-house" />
            Về Trang Chủ (Duyệt Tour với tư cách Khách)
          </button>
        </div>
      </div>
    </div>
  );
};

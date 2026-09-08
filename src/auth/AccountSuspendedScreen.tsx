import React from 'react';
import { UserProfile } from './auth.types';
import { ROLE_LABELS, ROLE_BADGE_STYLES } from './permissions';

interface AccountSuspendedScreenProps {
  user: UserProfile;
  onSignOut: () => Promise<void> | void;
  reason?: string;
  userContext?: 'customer' | 'staff_admin';
}

export const AccountSuspendedScreen: React.FC<AccountSuspendedScreenProps> = ({
  user,
  onSignOut,
  reason,
  userContext
}) => {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const isStaffAdmin =
    userContext === 'staff_admin' ||
    (!userContext && (user.role === 'staff' || user.role === 'admin' || user.role === 'super_admin'));

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
      // NOTE: Do NOT call window.location.href here.
      // onSignOut() sets user=null in React state → ProtectedRoute re-renders → <Navigate to="/login" />.
      // Adding window.location.href causes a SECOND hard-reload on top of React Router navigation = flicker.
    } catch (err) {
      console.error('Error signing out:', err);
      // Only force hard redirect on error (React state may be inconsistent)
      window.location.href = '/login';
    }
  };

  const defaultReason =
    reason ||
    (isStaffAdmin
      ? 'Tài khoản nội bộ của bạn đã bị tạm đình chỉ hoặc thu hồi quyền truy cập bảng điều khiển do vi phạm quy định bảo mật hệ thống, hoặc có quyết định điều chỉnh quyền từ Quản trị viên cấp cao (Super Admin).'
      : 'Tài khoản của bạn đã bị tạm khóa do vi phạm Quy chế hoạt động và Điều khoản bảo mật của WebTravel, hoặc có yêu cầu hạn chế từ Quản trị viên hệ thống.');

  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const roleBadgeStyle = ROLE_BADGE_STYLES[user.role] || {
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#93c5fd'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
        boxSizing: 'border-box'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspended-title"
        style={{
          width: '100%',
          maxWidth: '490px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Warning Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: '#dc2626',
            fontSize: '1.5rem'
          }}
        >
          <i className={isStaffAdmin ? 'fa-solid fa-shield-halved' : 'fa-solid fa-lock'} />
        </div>

        {/* Status Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.8rem',
            borderRadius: '6px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.85rem'
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#dc2626',
              display: 'inline-block'
            }}
          />
          {isStaffAdmin
            ? 'Trạng Thái: Đình Chỉ Quyền Vận Hành'
            : 'Trạng Thái: Tài Khoản Đã Bị Khóa'}
        </div>

        {/* Heading */}
        <h2
          id="suspended-title"
          style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}
        >
          {isStaffAdmin
            ? 'Đình Chỉ Quyền Quản Trị & Vận Hành Hệ Thống'
            : 'Quyền Truy Cập Tạm Thời Bị Đình Chỉ'}
        </h2>

        {/* User Info Chip with Role Badge */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.45rem 0.85rem',
            margin: '0.5rem auto 1.15rem',
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#475569',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <i
            className={isStaffAdmin ? 'fa-solid fa-user-gear' : 'fa-solid fa-user'}
            style={{ color: '#64748b', fontSize: '0.8rem' }}
          />
          <strong style={{ color: '#0f172a' }}>{user.fullName || 'Thành viên'}</strong>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              background: roleBadgeStyle.bg,
              color: roleBadgeStyle.color,
              border: `1px solid ${roleBadgeStyle.border}`
            }}
          >
            {roleLabel}
          </span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#64748b' }}>{user.email}</span>
        </div>

        {/* Reason Box */}
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            textAlign: 'left',
            marginBottom: '1.15rem'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#991b1b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#dc2626' }} />
            Lý do đình chỉ tài khoản
          </div>
          <p
            style={{
              fontSize: '0.84rem',
              lineHeight: 1.55,
              color: '#475569',
              margin: 0
            }}
          >
            {defaultReason}
          </p>
        </div>

        {/* Support Instructions — differentiated by role */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1.35rem',
            textAlign: 'left',
            fontSize: '0.82rem',
            color: '#475569',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem' }}>
            {isStaffAdmin
              ? 'Cần xác minh hoặc khôi phục quyền quản trị?'
              : 'Cần khiếu nại hoặc mở lại tài khoản?'}
          </div>
          <p style={{ margin: '0 0 0.55rem 0', color: '#64748b', fontSize: '0.8rem' }}>
            {isStaffAdmin
              ? 'Vui lòng liên hệ Trưởng bộ phận, Tổng Quản Trị (Super Admin) hoặc Đội ngũ Kỹ Thuật Nội Bộ:'
              : 'Vui lòng liên hệ bộ phận Chăm Sóc Khách Hàng WebTravel để được hỗ trợ xác minh:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-phone" style={{ color: '#059669', width: '14px' }} />
              <span style={{ color: '#64748b' }}>
                {isStaffAdmin ? 'Hotline Nội Bộ / IT Support:' : 'Hotline 24/7:'}
              </span>
              <a
                href={isStaffAdmin ? 'tel:02438889999' : 'tel:19001234'}
                style={{
                  color: '#059669',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                {isStaffAdmin ? '024 3888 9999 (Máy lẻ 101)' : '1900 1234'}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-envelope" style={{ color: '#0284c7', width: '14px' }} />
              <span style={{ color: '#64748b' }}>
                {isStaffAdmin ? 'Email An Ninh Nội Bộ:' : 'Email:'}
              </span>
              <a
                href={isStaffAdmin ? 'mailto:admin-security@webtravel.vn' : 'mailto:hotro@webtravel.vn'}
                style={{
                  color: '#0284c7',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                {isStaffAdmin ? 'admin-security@webtravel.vn' : 'hotro@webtravel.vn'}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-clock" style={{ color: '#d97706', width: '14px' }} />
              <span style={{ color: '#64748b' }}>
                {isStaffAdmin
                  ? 'Giờ làm việc: 08:00 - 18:00 (Thứ 2 - Thứ 7)'
                  : 'Giờ làm việc: 08:00 - 21:00 (Hàng ngày)'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button — Single Sign-out Button */}
        <div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            style={{
              width: '100%',
              padding: '0.8rem 1.25rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              transition: 'background 0.2s ease, opacity 0.2s ease',
              opacity: isSigningOut ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSigningOut) (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              if (!isSigningOut) (e.currentTarget as HTMLButtonElement).style.background = '#dc2626';
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
            {isSigningOut
              ? 'Đang đăng xuất...'
              : isStaffAdmin
              ? 'Đăng Xuất Khỏi Hệ Thống Quản Trị'
              : 'Đăng Xuất Khỏi Tài Khoản'}
          </button>
        </div>
      </div>
    </div>
  );
};

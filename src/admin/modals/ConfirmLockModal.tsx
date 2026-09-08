import React, { useState } from 'react';
import { ROLE_LABELS, ROLE_BADGE_STYLES } from '../../auth/permissions';
import { UserRole } from '../../auth/auth.types';

export interface ConfirmLockModalProps {
  isOpen: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    status: 'active' | 'banned' | 'deleted';
  } | null;
  onClose: () => void;
  onConfirm: (userId: string, currentStatus: 'active' | 'banned' | 'deleted') => Promise<void> | void;
}

export const ConfirmLockModal: React.FC<ConfirmLockModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const isLocking = user.status === 'active';
  const roleKey = (user.role as UserRole) || 'customer';
  const roleLabel = ROLE_LABELS[roleKey] || user.role || 'Thành viên';
  const roleStyle = ROLE_BADGE_STYLES[roleKey] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(user.id, user.status);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
        fontFamily: 'var(--font-body, "Montserrat", sans-serif)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-modal-title"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: isLocking ? '1px solid #fee2e2' : '1px solid #d1fae5',
          boxSizing: 'border-box'
        }}
      >
        {/* Header with Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: isLocking ? '#fee2e2' : '#ecfdf5',
              border: `1px solid ${isLocking ? '#fecaca' : '#a7f3d0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              color: isLocking ? '#dc2626' : '#059669',
              flexShrink: 0
            }}
          >
            <i className={isLocking ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'} />
          </div>
          <div>
            <h3
              id="lock-modal-title"
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              {isLocking ? 'Xác Nhận Khóa Tài Khoản' : 'Xác Nhận Mở Khóa Tài Khoản'}
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isLocking ? '#b91c1c' : '#047857'
              }}
            >
              {isLocking ? 'Hạn chế & đình chỉ quyền truy cập' : 'Khôi phục quyền truy cập hệ thống'}
            </span>
          </div>
        </div>

        {/* Target User Info Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.84rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{user.name}</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: roleStyle.bg,
                color: roleStyle.color,
                border: `1px solid ${roleStyle.border}`
              }}
            >
              {roleLabel}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-envelope" style={{ fontSize: '0.75rem' }} />
            <span>{user.email}</span>
          </div>
        </div>

        {/* Warning / Explanation Message */}
        <p
          style={{
            fontSize: '0.84rem',
            color: '#475569',
            lineHeight: 1.55,
            margin: '0 0 1.5rem',
            padding: '0.65rem 0.85rem',
            background: isLocking ? '#fff5f5' : '#f0fdf4',
            borderRadius: '8px',
            borderLeft: `3px solid ${isLocking ? '#ef4444' : '#10b981'}`
          }}
        >
          {isLocking
            ? 'Tài khoản này sẽ bị khóa ngay lập tức. Người dùng sẽ bị thu hồi quyền truy cập, phiên làm việc bị ngắt và nhận được thông báo đình chỉ.'
            : 'Tài khoản này sẽ được mở lại trạng thái Hoạt Động. Người dùng có thể đăng nhập bình thường vào hệ thống WebTravel.'}
        </p>

        {/* Action Buttons (Yes / No) */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '0.65rem 1.15rem',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: '0.65rem 1.25rem',
              background: isLocking ? '#dc2626' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: isLocking
                ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                : '0 4px 12px rgba(5, 150, 105, 0.25)',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            <i className={`fa-solid ${isLocking ? 'fa-lock' : 'fa-lock-open'}`} />
            {isSubmitting
              ? 'Đang xử lý...'
              : isLocking
              ? 'Xác Nhận Khóa'
              : 'Xác Nhận Mở Khóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

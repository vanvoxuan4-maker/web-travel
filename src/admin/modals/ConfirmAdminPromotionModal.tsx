import React, { useState } from 'react';
import { CustomerRecord } from '../admin.types';
import { useAuth } from '../../auth/useAuth';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

interface ConfirmAdminPromotionModalProps {
  targetCustomer: CustomerRecord | null;
  targetRole?: 'admin' | 'super_admin';
  isOpen: boolean;
  onClose: () => void;
  onConfirmPromotion: (customerId: string, role: 'admin' | 'super_admin') => Promise<void>;
}

export const ConfirmAdminPromotionModal: React.FC<ConfirmAdminPromotionModalProps> = ({
  targetCustomer,
  targetRole = 'admin',
  isOpen,
  onClose,
  onConfirmPromotion
}) => {
  const { user: currentUser } = useAuth();
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !targetCustomer) return null;

  const isSuperAdminRole = targetRole === 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!adminPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu tài khoản quản trị của bạn.');
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Re-authenticate current credentials against Supabase
      if (isSupabaseConfigured && supabase && currentUser?.email) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: adminPassword
        });

        if (authError) {
          setErrorMessage('Mật khẩu quản trị viên không chính xác. Thao tác bị từ chối.');
          setIsVerifying(false);
          return;
        }
      }

      // 2. Perform promotion
      await onConfirmPromotion(targetCustomer.id, targetRole);
      setAdminPassword('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình xác thực.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setAdminPassword('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '490px',
          width: '100%',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #fee2e2'
        }}
      >
        {/* Security Alert Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              color: '#dc2626',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
              {isSuperAdminRole ? 'Xác Thực Bổ Nhiệm Super Admin' : 'Xác Thực Phân Quyền Admin'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Cảnh báo bảo mật cấp quyền quản trị hệ thống
            </span>
          </div>
        </div>

        {/* Target User Info Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            Tài Khoản Được Đề Cử Làm: <strong style={{ color: isSuperAdminRole ? '#b45309' : '#047857' }}>{isSuperAdminRole ? '👑 SUPER ADMIN' : '🛡️ QUẢN TRỊ VIÊN'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isSuperAdminRole ? '#f59e0b' : '#059669',
                color: isSuperAdminRole ? '#111827' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem'
              }}
            >
              {targetCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                {targetCustomer.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {targetCustomer.email} • SĐT: {targetCustomer.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </div>

        {/* Privileges Warning List */}
        <div
          style={{
            background: isSuperAdminRole ? '#fef3c7' : '#fffbeb',
            border: '1px solid ' + (isSuperAdminRole ? '#fde68a' : '#fef3c7'),
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#92400e',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Quyền hạn được cấp bao gồm:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {isSuperAdminRole ? (
              <>
                <li><strong>Toàn quyền tối cao 100%</strong> quản lý và phân quyền cho tất cả Admin khác.</li>
                <li>Không ai có thể hạ quyền hay khóa tài khoản này.</li>
                <li>Toàn quyền truy cập mọi báo cáo tài chính và dữ liệu khách hàng.</li>
              </>
            ) : (
              <>
                <li>Toàn quyền xem doanh thu và duyệt đơn đặt tour VietQR.</li>
                <li>Thêm mới, sửa giá và quản lý toàn bộ kho tour lữ hành.</li>
                <li>Tạo mã khuyến mãi giảm giá cho toàn hệ thống.</li>
              </>
            )}
          </ul>
        </div>

        {/* Form to enter current password */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Nhập mật khẩu quản trị của bạn để xác nhận:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mật khẩu của bạn..."
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setErrorMessage(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 0.85rem',
                  borderRadius: '10px',
                  border: errorMessage ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errorMessage && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isVerifying}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.88rem'
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              style={{
                flex: 1.5,
                padding: '0.75rem',
                background: isSuperAdminRole ? '#d97706' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: isSuperAdminRole
                  ? '0 4px 12px rgba(217, 119, 6, 0.25)'
                  : '0 4px 12px rgba(220, 38, 38, 0.25)'
              }}
            >
              {isVerifying ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-crown"></i>
                  <span>{isSuperAdminRole ? 'Bổ Nhiệm Super Admin' : 'Xác Nhận Gán Admin'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminTab } from '../admin.types';
import { PermissionGate, useAuth } from '../../auth';

interface AdminTopbarProps {
  activeTab: AdminTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddTour: () => void;
  onOpenAddCoupon: () => void;
  onOpenProfile?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  isLoading,
  onRefresh,
  onOpenAddTour,
  onOpenAddCoupon,
  onOpenProfile
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return { breadcrumb: 'Tổng Quan & Doanh Thu', title: 'Bảng Điều Khiển Kinh Doanh' };
      case 'bookings':
        return { breadcrumb: 'Quản Lý Đơn Tour', title: 'Danh Sách Đơn Đặt Tour' };
      case 'payments':
        return { breadcrumb: 'Lịch Sử Giao Dịch', title: 'Đối Soát & Quản Lý Dòng Tiền' };
      case 'tours':
        return { breadcrumb: 'Kho Tour Lữ Hành', title: 'Quản Lý Sản Phẩm & Lịch Trình' };
      case 'customers':
        return { breadcrumb: 'Khách Hàng Thành Viên', title: 'Hồ Sơ Khách Hàng & Điểm Thưởng' };
      case 'staff':
        return { breadcrumb: 'Đội Ngũ Nhân Sự', title: 'Quản Lý Cán Bộ & Phân Quyền Vận Hành' };
      case 'coupons':
        return { breadcrumb: 'Mã Khuyến Mãi', title: 'Cấu Hình Mã Khuyến Mãi' };
      case 'logs':
        return { breadcrumb: 'Nhật Ký Hoạt Động', title: 'Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)' };
      case 'profile':
        return { breadcrumb: 'Tài Khoản & Bảo Mật', title: 'Hồ Sơ Cá Nhân & Quản Trị Viên' };
      default:
        return { breadcrumb: 'Quản Trị', title: 'Hệ Thống Quản Trị' };
    }
  };

  const { breadcrumb, title } = getTabTitle();

  return (
    <header
      style={{
        height: '74px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.25rem',
        flexShrink: 0,
        zIndex: 50,
        position: 'sticky',
        top: 0
      }}
    >
      {/* 1. Left: Breadcrumbs & Page Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <span style={{ color: '#94a3b8' }}>WebTravel Portal</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.55rem', color: '#cbd5e1' }} />
          <span
            style={{
              color: '#059669',
              background: '#ecfdf5',
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              border: '1px solid #a7f3d0',
              fontWeight: 700
            }}
          >
            {breadcrumb}
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.28rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
      </div>

      {/* 2. Right: Action Widgets & Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Security Auto-Lock Badge */}
        <div
          title="Cơ chế bảo mật quản trị: Tự động khóa và đăng xuất an toàn sau 30 phút không thao tác."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.42rem 0.8rem',
            background: 'rgba(254, 243, 199, 0.7)',
            border: '1px solid #fde68a',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#92400e',
            cursor: 'help',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <i className="fa-solid fa-shield-halved" style={{ color: '#d97706', fontSize: '0.8rem' }} />
          <span>Tự khóa: <strong>30p</strong></span>
        </div>

        {/* Refresh Sync Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Tải lại dữ liệu mới nhất từ hệ thống"
          style={{
            padding: '0.48rem 0.85rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.background = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#059669' }} />
          <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>

        {/* Global Fast Search Input */}
        <div style={{ position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '0.8rem'
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.48rem 1rem 0.48rem 2.25rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              width: '210px',
              outline: 'none',
              background: '#ffffff',
              color: '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          />
        </div>

        {/* Quick Add Tour Action */}
        {activeTab === 'tours' && (
          <PermissionGate permission="tour:create">
            <button
              type="button"
              onClick={onOpenAddTour}
              style={{
                padding: '0.52rem 1.05rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="fa-solid fa-plus" /> Thêm Tour Mới
            </button>
          </PermissionGate>
        )}

        {/* Quick Add Coupon Action */}
        {activeTab === 'coupons' && (
          <PermissionGate permission="coupon:create">
            <button
              type="button"
              onClick={onOpenAddCoupon}
              style={{
                padding: '0.52rem 1.05rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="fa-solid fa-plus" /> Tạo Voucher Mới
            </button>
          </PermissionGate>
        )}

        {/* User Profile Chip */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            title="Xem hồ sơ cá nhân và cài đặt bảo mật"
            style={{
              padding: '0.38rem 0.75rem',
              background: activeTab === 'profile' ? '#ecfdf5' : '#ffffff',
              border: activeTab === 'profile' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              color: activeTab === 'profile' ? '#047857' : '#1e293b',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#ffffff';
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  overflow: 'hidden',
                  border: '1.5px solid #ffffff'
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  (user?.fullName || user?.email || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '1.5px solid #ffffff'
                }}
              />
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                {user?.fullName?.split(' ').slice(-1)[0] || 'Hồ Sơ'}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
                {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Quản Trị' : 'Nhân Viên'}
              </div>
            </div>
          </button>
        )}

        {/* Quick Logout Button */}
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
          title="Đăng xuất khỏi hệ thống quản trị"
          style={{
            padding: '0.42rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#dc2626',
            fontWeight: 700,
            fontSize: '0.78rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.color = '#dc2626';
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </header>
  );
};

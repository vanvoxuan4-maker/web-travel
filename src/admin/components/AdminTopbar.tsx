import React from 'react';
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
  const { user } = useAuth();
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
        height: '70px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        flexShrink: 0
      }}
    >
      {/* Breadcrumbs & Title */}
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
          <span>WebTravel Portal</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
          <span style={{ color: '#047857', fontWeight: 600 }}>{breadcrumb}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          {title}
        </h2>
      </div>

      {/* Right Action Widgets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Security Inactivity Notice Badge */}
        <div
          title="Cơ chế bảo mật quản trị: Sau 30 phút không có thao tác chuột hoặc bàn phím, hệ thống sẽ hiển thị cảnh báo 60 giây và tự động đăng xuất an toàn."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#92400e',
            cursor: 'help',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        >
          <i className="fa-solid fa-shield-halved" style={{ color: '#d97706', fontSize: '0.85rem' }}></i>
          <span>Tự khóa sau <strong>30p</strong> không thao tác</span>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            padding: '0.5rem 0.85rem',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background 0.2s'
          }}
        >
          <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#047857' }}></i>
          <span>{isLoading ? 'Đang tải...' : 'Làm mới dữ liệu'}</span>
        </button>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 1rem 0.5rem 2.3rem',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem',
              width: '240px',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>

        {/* Quick Add Buttons */}
        {activeTab === 'tours' && (
          <PermissionGate permission="tour:create">
            <button
              type="button"
              onClick={onOpenAddTour}
              style={{
                padding: '0.55rem 1rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
              }}
            >
              <i className="fa-solid fa-plus"></i> Thêm Tour Mới
            </button>
          </PermissionGate>
        )}

        {activeTab === 'coupons' && (
          <PermissionGate permission="coupon:create">
            <button
              type="button"
              onClick={onOpenAddCoupon}
              style={{
                padding: '0.55rem 1rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
              }}
            >
              <i className="fa-solid fa-plus"></i> Tạo Voucher Mới
            </button>
          </PermissionGate>
        )}

        {/* Quick Profile Access Button */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            title="Xem chi tiết tài khoản & đổi mật khẩu"
            style={{
              padding: '0.45rem 0.75rem',
              background: activeTab === 'profile' ? '#ecfdf5' : '#f8fafc',
              border: activeTab === 'profile' ? '1.5px solid #059669' : '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeTab === 'profile' ? '#047857' : '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#047857',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                overflow: 'hidden'
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                (user?.fullName || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <span>Hồ Sơ</span>
          </button>
        )}
      </div>
    </header>
  );
};

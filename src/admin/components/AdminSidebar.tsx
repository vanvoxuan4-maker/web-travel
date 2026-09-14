import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminTab } from '../admin.types';
import { useAuth } from '../../auth/useAuth';
import { isTabAllowed } from '../../auth/permissions';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  bookingsCount: number;
  toursCount: number;
  customersCount: number;
  staffCount?: number;
  paymentsCount?: number;
  pendingBookingsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  bookingsCount,
  toursCount,
  customersCount,
  staffCount = 0,
  paymentsCount = 0,
  pendingBookingsCount
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems: {
    tab: AdminTab;
    label: string;
    icon: string;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { tab: 'overview', label: 'Tổng Quan & Doanh Thu', icon: 'fa-chart-pie' },
    {
      tab: 'bookings',
      label: 'Quản Lý Đơn Tour',
      icon: 'fa-receipt',
      badge: bookingsCount,
      badgeColor: pendingBookingsCount > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'
    },
    {
      tab: 'payments',
      label: 'Lịch Sử Giao Dịch',
      icon: 'fa-credit-card',
      badge: paymentsCount > 0 ? paymentsCount : undefined,
      badgeColor: 'rgba(255, 255, 255, 0.2)'
    },
    {
      tab: 'tours',
      label: 'Kho Tour Lữ Hành',
      icon: 'fa-map-location-dot',
      badge: toursCount,
      badgeColor: 'rgba(255, 255, 255, 0.2)'
    },
    {
      tab: 'customers',
      label: 'Khách Hàng',
      icon: 'fa-users',
      badge: customersCount,
      badgeColor: '#10b981'
    },
    {
      tab: 'staff',
      label: 'Đội Ngũ Nhân Sự',
      icon: 'fa-id-badge',
      badge: staffCount,
      badgeColor: '#38bdf8'
    },
    { tab: 'coupons', label: 'Mã Giảm Giá & Voucher', icon: 'fa-tags' },
    { tab: 'logs', label: 'Nhật Ký Hoạt Động', icon: 'fa-clock-rotate-left' },
    { tab: 'profile', label: 'Hồ Sơ & Đổi Mật Khẩu', icon: 'fa-shield-halved' }
  ];

  return (
    <aside
      style={{
        width: '268px',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #021f17 0%, #053326 60%, #032119 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1.15rem 1.15rem',
        flexShrink: 0,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.22)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        position: 'relative'
      }}
    >
      {/* ── 1. Top Section (Brand Header & Admin Badge on Top) ── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Brand Bar with Admin Role Badge ON THE VERY TOP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-compass" />
            </div>
            <div>
              <div style={{ fontSize: '1.18rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                WebTravel
              </div>
              <div style={{ fontSize: '0.65rem', color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.04em' }}>
                HỆ THỐNG QUẢN TRỊ
              </div>
            </div>
          </div>

          {/* Admin Role Badge on the Very Top */}
          <span
            style={{
              background:
                user?.role === 'super_admin'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : user?.role === 'admin'
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '0.22rem 0.55rem',
              borderRadius: '7px',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            {user?.role === 'super_admin' ? '👑 SUPER ADMIN' : user?.role === 'admin' ? '🛡️ ADMIN' : 'STAFF'}
          </span>
        </div>

        {/* User Quick Info Box */}
        <div
          onClick={() => setActiveTab('profile')}
          title="Bấm để xem hồ sơ cá nhân và cài đặt bảo mật"
          style={{
            background: activeTab === 'profile' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '0.6rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            border: activeTab === 'profile' ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                color: '#ffffff',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                overflow: 'hidden',
                border: '1.5px solid rgba(255, 255, 255, 0.25)'
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
                bottom: '0',
                right: '0',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                border: '1.5px solid #021f17'
              }}
            />
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {user?.fullName || 'Võ Xuân Vạn'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.email || 'webtravel.vn'}
            </div>
          </div>

          <div style={{ color: activeTab === 'profile' ? '#34d399' : '#6ee7b7', fontSize: '0.75rem', opacity: 0.85 }}>
            <i className="fa-solid fa-gear" />
          </div>
        </div>
      </div>

      {/* ── 2. Middle Navigation Section (Scrollable with Slim Scrollbar) ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          paddingRight: '2px',
          scrollbarWidth: 'none'
        }}
      >
        <div
          style={{
            fontSize: '0.64rem',
            fontWeight: 800,
            color: '#34d399',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.25rem 0.65rem 0.15rem',
            opacity: 0.9
          }}
        >
          Quản Trị Nghiệp Vụ
        </div>

        {navItems
          .filter((item) => isTabAllowed(user?.role, item.tab))
          .map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#d1fae5',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#d1fae5';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <i
                    className={`fa-solid ${item.icon}`}
                    style={{
                      width: '18px',
                      textAlign: 'center',
                      color: isActive ? '#34d399' : '#6ee7b7',
                      fontSize: '0.86rem'
                    }}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    style={{
                      background: item.badgeColor || 'rgba(255, 255, 255, 0.2)',
                      color: item.badgeColor === '#10b981' ? '#022c22' : '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '9999px',
                      minWidth: '18px',
                      textAlign: 'center'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* ── 3. Bottom Section (Always Fixed & Visible) ── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '0.75rem',
          marginTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}
      >
        <Link
          to="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.58rem 0.85rem',
            borderRadius: '9px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#e2e8f0';
          }}
        >
          <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: '#34d399', fontSize: '0.78rem' }} />
          <span>Về Website Khách Hàng</span>
        </Link>

        {/* Nút Đăng Xuất Nổi Bật & Luôn Hiển Thị 100% */}
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            padding: '0.62rem 0.85rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(220, 38, 38, 0.32) 100%)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            color: '#fee2e2',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.18)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(220, 38, 38, 0.32) 100%)';
            e.currentTarget.style.color = '#fee2e2';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.18)';
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          <span>Đăng Xuất Khỏi Portal</span>
        </button>
      </div>
    </aside>
  );
};

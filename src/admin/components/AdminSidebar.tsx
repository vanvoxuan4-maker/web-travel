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
        background: 'linear-gradient(180deg, #021f17 0%, #053326 60%, #032119 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1.15rem',
        flexShrink: 0,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.22)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 1. Brand Logo Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-compass" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              WebTravel
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '0.12rem 0.45rem',
                  borderRadius: '6px',
                  letterSpacing: '0.06em',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                }}
              >
                ADMIN PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* 2. User Card with Quick Profile Access */}
        <div
          onClick={() => setActiveTab('profile')}
          title="Bấm để xem hồ sơ cá nhân và quản lý bảo mật"
          style={{
            background: activeTab === 'profile' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '14px',
            padding: '0.75rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            border: activeTab === 'profile' ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: activeTab === 'profile' ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none'
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                color: '#ffffff',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
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
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                border: '1.5px solid #021f17'
              }}
            />
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {user?.fullName || 'Võ Xuân Vạn'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#a7f3d0' }}>
              <span>
                {user?.role === 'super_admin'
                  ? '👑 Super Admin'
                  : user?.role === 'admin'
                  ? '🛡️ Quản Trị Viên'
                  : '🧑‍💼 Nhân Viên'}
              </span>
            </div>
          </div>

          <div style={{ color: activeTab === 'profile' ? '#34d399' : '#6ee7b7', fontSize: '0.8rem', opacity: 0.85 }}>
            <i className="fa-solid fa-gear" />
          </div>
        </div>

        {/* 3. Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div
            style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              color: '#34d399',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0.4rem 0.75rem 0.2rem',
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
                    padding: '0.72rem 0.9rem',
                    borderRadius: '11px',
                    border: isActive ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid transparent',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : '#d1fae5',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none'
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <i
                      className={`fa-solid ${item.icon}`}
                      style={{
                        width: '18px',
                        textAlign: 'center',
                        color: isActive ? '#34d399' : '#6ee7b7',
                        fontSize: '0.9rem'
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
                        padding: '0.12rem 0.5rem',
                        borderRadius: '9999px',
                        letterSpacing: '0.02em',
                        minWidth: '20px',
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
      </div>

      {/* 4. Sidebar Bottom Actions */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <Link
          to="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s ease'
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
          <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: '#34d399', fontSize: '0.82rem' }} />
          <span>Về Website Khách Hàng</span>
        </Link>

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
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" style={{ fontSize: '0.82rem' }} />
          <span>Đăng Xuất Khỏi Portal</span>
        </button>
      </div>
    </aside>
  );
};

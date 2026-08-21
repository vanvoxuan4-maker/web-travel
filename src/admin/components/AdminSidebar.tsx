import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminTab } from '../admin.types';
import { useAuth } from '../../auth/useAuth';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  bookingsCount: number;
  toursCount: number;
  customersCount: number;
  pendingBookingsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  bookingsCount,
  toursCount,
  customersCount,
  pendingBookingsCount
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <aside
      style={{
        width: '260px',
        background: 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1.25rem',
        flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 100
      }}
    >
      <div>
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <i className="fa-solid fa-compass"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>WebTravel</span>
            </div>
            <span style={{ background: '#f59e0b', color: '#111827', fontSize: '0.62rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '6px', letterSpacing: '0.05em' }}>
              ADMIN PORTAL
            </span>
          </div>
        </div>

        {/* Admin User Profile Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '0.75rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.75rem',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f59e0b',
              color: '#111827',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              flexShrink: 0
            }}
          >
            {(user?.fullName || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.fullName || 'Võ Xuân Văn'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#6ee7b7' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              <span>
                {user?.role === 'super_admin'
                  ? '👑 Super Admin'
                  : user?.role === 'admin'
                  ? '🛡️ Quản Trị Viên'
                  : '🧑‍💼 Nhân Viên'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.75rem 0.25rem' }}>
            Quản Trị Nghiệp Vụ
          </div>

          {/* 1. Tổng Quan */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'overview' ? '#059669' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#d1fae5',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-chart-pie" style={{ width: '18px', textAlign: 'center' }}></i>
            <span>Tổng Quan & Doanh Thu</span>
          </button>

          {/* 2. Đơn Đặt Tour */}
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'bookings' ? '#059669' : 'transparent',
              color: activeTab === 'bookings' ? '#ffffff' : '#d1fae5',
              fontWeight: activeTab === 'bookings' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-receipt" style={{ width: '18px', textAlign: 'center' }}></i>
              <span>Quản Lý Đơn Tour</span>
            </div>
            <span style={{ background: pendingBookingsCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
              {bookingsCount}
            </span>
          </button>

          {/* 3. Kho Tour */}
          <button
            type="button"
            onClick={() => setActiveTab('tours')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'tours' ? '#059669' : 'transparent',
              color: activeTab === 'tours' ? '#ffffff' : '#d1fae5',
              fontWeight: activeTab === 'tours' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-map-location-dot" style={{ width: '18px', textAlign: 'center' }}></i>
              <span>Kho Tour Lữ Hành</span>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
              {toursCount}
            </span>
          </button>

          {/* 4. Khách Hàng & Nhân Sự */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'customers' ? '#059669' : 'transparent',
              color: activeTab === 'customers' ? '#ffffff' : '#d1fae5',
              fontWeight: activeTab === 'customers' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-users" style={{ width: '18px', textAlign: 'center' }}></i>
              <span>Khách Hàng & Nhân Sự</span>
            </div>
            <span style={{ background: '#34d399', color: '#064e3b', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
              {customersCount}
            </span>
          </button>

          {/* 5. Mã Khuyến Mãi */}
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'coupons' ? '#059669' : 'transparent',
              color: activeTab === 'coupons' ? '#ffffff' : '#d1fae5',
              fontWeight: activeTab === 'coupons' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-tags" style={{ width: '18px', textAlign: 'center' }}></i>
            <span>Mã Giảm Giá & Voucher</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link
          to="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontSize: '0.84rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.2s'
          }}
        >
          <i className="fa-solid fa-globe"></i>
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
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Đăng Xuất Khỏi Portal</span>
        </button>
      </div>
    </aside>
  );
};

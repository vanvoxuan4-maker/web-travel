import React from 'react';
import { BookingRecord } from '../admin.types';
import { Tour } from '../../types/tour.types';
import { MetricCard } from '../components/MetricCard';
import { formatCurrencyVND } from '../../utils/formatters';

interface OverviewModuleProps {
  bookings: BookingRecord[];
  tours: Tour[];
  customersCount: number;
  onNavigateToBookings: () => void;
  onApproveBooking: (bookingId: string) => Promise<void>;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  bookings,
  tours,
  customersCount,
  onNavigateToBookings,
  onApproveBooking
}) => {
  const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + b.totalAmount : sum), 0);
  const totalPax = bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + b.paxCount : sum), 0);

  return (
    <div>
      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <MetricCard
          title="Tổng Doanh Thu"
          value={formatCurrencyVND(totalRevenue)}
          subtitle="Tăng trưởng doanh thu"
          trendText="Doanh thu thực tế"
          icon="fa-solid fa-sack-dollar"
          iconBg="#ecfdf5"
          iconColor="#047857"
          valueColor="#047857"
        />

        <MetricCard
          title="Khách Hàng & Nhân Sự"
          value={`${customersCount} Tài Khoản`}
          subtitle="Cơ sở dữ liệu thời gian thực"
          icon="fa-solid fa-users"
          iconBg="#eff6ff"
          iconColor="#2563eb"
        />

        <MetricCard
          title="Lượt Khách Đi Tour (Pax)"
          value={`${totalPax} Hành Khách`}
          subtitle={`Từ ${bookings.length} đơn đặt chỗ`}
          icon="fa-solid fa-person-walking-luggage"
          iconBg="#fef3c7"
          iconColor="#d97706"
        />

        <MetricCard
          title="Sản Phẩm Hoạt Động"
          value={`${tours.length} Hành Trình`}
          subtitle="100% Khách sạn 4-5 sao"
          icon="fa-solid fa-route"
          iconBg="#f5f3ff"
          iconColor="#7c3aed"
        />
      </div>

      {/* Recent Bookings Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Đơn Đặt Tour Mới Nhất
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Theo dõi nhanh các đơn đặt chỗ gần đây
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToBookings}
            style={{
              background: 'none',
              border: 'none',
              color: '#047857',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Xem tất cả đơn <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Mã Đơn</th>
                <th style={{ padding: '0.75rem 1rem' }}>Khách Hàng</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tên Tour</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ngày Đi</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tổng Tiền</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 4).map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#047857' }}>{b.id}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.customerName}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{b.phone}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                    {b.tourTitle}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>{b.departureDate}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrencyVND(b.totalAmount)}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background:
                          b.status === 'confirmed'
                            ? '#ecfdf5'
                            : b.status === 'deposit'
                            ? '#fef3c7'
                            : b.status === 'pending'
                            ? '#eff6ff'
                            : '#fee2e2',
                        color:
                          b.status === 'confirmed'
                            ? '#047857'
                            : b.status === 'deposit'
                            ? '#b45309'
                            : b.status === 'pending'
                            ? '#1d4ed8'
                            : '#b91c1c'
                      }}
                    >
                      {b.status === 'confirmed'
                        ? 'Đã Thanh Toán'
                        : b.status === 'deposit'
                        ? 'Đã Cọc 50%'
                        : b.status === 'pending'
                        ? 'Chờ Xử Lý'
                        : 'Đã Hủy'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onApproveBooking(b.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Duyệt Đơn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

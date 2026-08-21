import React from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';

interface BookingsModuleProps {
  bookings: BookingRecord[];
  onStatusChange: (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => Promise<void>;
}

export const BookingsModule: React.FC<BookingsModuleProps> = ({
  bookings,
  onStatusChange
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            Danh Sách Toàn Bộ Đơn Đặt Chỗ
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý xác nhận thanh toán VietQR, cọc tiền và thông tin đưa đón khách
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Mã Đơn</th>
              <th style={{ padding: '0.75rem 1rem' }}>Khách Hàng</th>
              <th style={{ padding: '0.75rem 1rem' }}>Địa Chỉ / Điểm Đón</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tên Tour</th>
              <th style={{ padding: '0.75rem 1rem' }}>Số Khách</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tổng Tiền</th>
              <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thay Đổi Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '1rem', fontWeight: 700, color: '#047857' }}>{b.id}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.customerName}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{b.phone}</div>
                </td>
                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.82rem' }}>
                  {b.customerAddress || 'Hà Nội / Sân Bay'}
                </td>
                <td style={{ padding: '1rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                  {b.tourTitle}
                </td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>{b.paxCount} Khách</td>
                <td style={{ padding: '1rem', fontWeight: 800, color: '#047857' }}>
                  {formatCurrencyVND(b.totalAmount)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
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
                      ? 'Đã Thanh Toán 100%'
                      : b.status === 'deposit'
                      ? 'Đã Cọc 50%'
                      : b.status === 'pending'
                      ? 'Chờ Xử Lý'
                      : 'Đã Hủy'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <select
                    value={b.status}
                    onChange={(e) => onStatusChange(b.id, e.target.value as any)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      background: '#ffffff'
                    }}
                  >
                    <option value="pending">Chờ Xử Lý</option>
                    <option value="deposit">Đã Cọc 50%</option>
                    <option value="confirmed">Xác Nhận 100%</option>
                    <option value="cancelled">Hủy Đơn</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

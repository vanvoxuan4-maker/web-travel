import React from 'react';
import { CouponRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';

interface CouponsModuleProps {
  coupons: CouponRecord[];
  onOpenAddCoupon: () => void;
}

export const CouponsModule: React.FC<CouponsModuleProps> = ({
  coupons,
  onOpenAddCoupon
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
            Danh Sách Mã Khuyến Mãi &amp; Voucher
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Tạo mã giảm giá kích cầu khách đặt tour VietQR
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddCoupon}
          style={{
            padding: '0.6rem 1.25rem',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.88rem',
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
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Mã Voucher</th>
              <th style={{ padding: '0.75rem 1rem' }}>Loại Giảm Giá</th>
              <th style={{ padding: '0.75rem 1rem' }}>Mức Giảm</th>
              <th style={{ padding: '0.75rem 1rem' }}>Lượt Sử Dụng</th>
              <th style={{ padding: '0.75rem 1rem' }}>Hạn Dùng</th>
              <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((cp) => (
              <tr key={cp.code} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#047857', letterSpacing: '0.05em' }}>
                  {cp.code}
                </td>
                <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                  {cp.discountType === 'percentage' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt trực tiếp'}
                </td>
                <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                  {cp.discountType === 'percentage' ? `${cp.value}%` : formatCurrencyVND(cp.value)}
                </td>
                <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>{cp.usageCount} lượt</td>
                <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>{cp.expiryDate}</td>
                <td style={{ padding: '0.9rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#ecfdf5',
                      color: '#047857'
                    }}
                  >
                    Đang Hoạt Động
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

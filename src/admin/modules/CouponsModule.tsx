import React, { useState, useEffect } from 'react';
import { CouponRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { PermissionGate } from '../../auth';
import { couponService, CouponUsageRecord } from '../../services/couponService';

interface CouponsModuleProps {
  coupons: CouponRecord[];
  onOpenAddCoupon: () => void;
}

export const CouponsModule: React.FC<CouponsModuleProps> = ({
  coupons,
  onOpenAddCoupon
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vouchers' | 'history'>('vouchers');
  const [usageHistory, setUsageHistory] = useState<CouponUsageRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await couponService.getCouponUsageHistory();
      setUsageHistory(data);
    } catch (err) {
      console.warn('Lỗi tải lịch sử sử dụng voucher:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchHistory();
    }
  }, [activeSubTab]);

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
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            Quản Lý Khuyến Mãi &amp; Voucher
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Thiết lập mã giảm giá kích cầu và theo dõi chi tiết lịch sử tài khoản đã áp dụng
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeSubTab === 'history' && (
            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              style={{
                padding: '0.55rem 1rem',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoadingHistory ? 'fa-spin' : ''}`}></i> Làm mới
            </button>
          )}

          <PermissionGate permission="coupon:create">
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
          </PermissionGate>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #f1f5f9',
          marginBottom: '1.25rem',
          paddingBottom: '0.25rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('vouchers')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeSubTab === 'vouchers' ? '#ecfdf5' : 'transparent',
            color: activeSubTab === 'vouchers' ? '#047857' : '#64748b',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: activeSubTab === 'vouchers' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fa-solid fa-ticket"></i> Danh Sách Voucher ({coupons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeSubTab === 'history' ? '#ecfdf5' : 'transparent',
            color: activeSubTab === 'history' ? '#047857' : '#64748b',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: activeSubTab === 'history' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fa-solid fa-clock-rotate-left"></i> Lịch Sử Đã Sử Dụng (Kiểm Tra Đối Soát)
        </button>
      </div>

      {/* SUB-TAB 1: Vouchers List */}
      {activeSubTab === 'vouchers' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Mã Voucher</th>
                <th style={{ padding: '0.75rem 1rem' }}>Loại Giảm Giá</th>
                <th style={{ padding: '0.75rem 1rem' }}>Mức Giảm</th>
                <th style={{ padding: '0.75rem 1rem' }}>Lượt Sử Dụng</th>
                <th style={{ padding: '0.75rem 1rem' }}>Hạn Dùng</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quy Định Áp Dụng</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((cp) => (
                <tr key={cp.code} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#047857', letterSpacing: '0.05em' }}>
                    <span style={{ background: '#f0fdf4', border: '1px dashed #059669', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>
                      {cp.code}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                    {cp.discountType === 'percentage' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt trực tiếp'}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                    {cp.discountType === 'percentage' ? `${cp.value}%` : formatCurrencyVND(cp.value)}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{cp.usageCount}</span> lượt
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>{cp.expiryDate}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600 }}>
                    <i className="fa-solid fa-user-check"></i> Tối đa 1 lần / tài khoản
                  </td>
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
      )}

      {/* SUB-TAB 2: History of Usages */}
      {activeSubTab === 'history' && (
        <div style={{ overflowX: 'auto' }}>
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#047857', marginBottom: '0.5rem' }}></i>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Đang tải lịch sử sử dụng voucher...</p>
            </div>
          ) : usageHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
              <i className="fa-solid fa-clipboard-check fa-3x" style={{ color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
              <h4 style={{ margin: '0 0 0.35rem', color: '#334155' }}>Chưa có lượt sử dụng voucher nào</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Khi khách hàng thành viên áp dụng mã giảm giá khi đặt tour, thông tin đối soát sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Khách Hàng (Tài Khoản)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mã Voucher</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mã Đơn Hàng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Số Tiền Giảm</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Thời Gian Sử Dụng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {usageHistory.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {item.customer_name || 'Khách hàng'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {item.customer_email || item.customer_phone || (item.user_id ? `ID: ${item.user_id.substring(0, 8)}...` : 'Khách vãng lai')}
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#047857',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {item.coupon_code}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#1e293b' }}>
                      {item.booking_code || (item.booking_id ? item.booking_id.substring(0, 8) : '—')}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#047857' }}>
                      -{formatCurrencyVND(item.discount_applied)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                      {item.used_at ? new Date(item.used_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#e0f2fe',
                          color: '#0369a1'
                        }}
                      >
                        <i className="fa-solid fa-check"></i> Đã Áp Dụng
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

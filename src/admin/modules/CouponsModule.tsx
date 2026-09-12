import React, { useState, useEffect } from 'react';
import { CouponRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { PermissionGate } from '../../auth';
import { couponService, CouponUsageRecord } from '../../services/couponService';

interface CouponsModuleProps {
  coupons: CouponRecord[];
  onOpenAddCoupon: () => void;
  onEditCoupon: (coupon: CouponRecord) => void;
  onToggleActive: (code: string, currentStatus: boolean) => Promise<void>;
  onDeleteCoupon: (code: string) => Promise<void>;
}

export const CouponsModule: React.FC<CouponsModuleProps> = ({
  coupons,
  onOpenAddCoupon,
  onEditCoupon,
  onToggleActive,
  onDeleteCoupon
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vouchers' | 'history'>('vouchers');
  const [usageHistory, setUsageHistory] = useState<CouponUsageRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionLoadingCode, setActionLoadingCode] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Filtered coupons
  const filteredCoupons = coupons.filter((cp) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase().trim();
    return (
      cp.code.toLowerCase().includes(query) ||
      (cp.description && cp.description.toLowerCase().includes(query)) ||
      (cp.discountType === 'percentage' ? 'phần trăm' : 'tiền mặt').includes(query)
    );
  });

  // Summary counts
  const totalCount = coupons.length;
  const activeCount = coupons.filter((c) => c.isActive && c.status !== 'expired').length;
  const hiddenCount = coupons.filter((c) => !c.isActive || c.status === 'inactive').length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  const handleToggle = async (cp: CouponRecord) => {
    setActionLoadingCode(cp.code);
    try {
      await onToggleActive(cp.code, cp.isActive);
    } finally {
      setActionLoadingCode(null);
    }
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCoupon(couponToDelete.code);
      setCouponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

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
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Quản Lý Khuyến Mãi &amp; Voucher
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Thiết lập mã giảm giá, kiểm soát trạng thái ẩn/hiện và đối soát lịch sử áp dụng của thành viên
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

      {/* Quick Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            <i className="fa-solid fa-ticket"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Tổng Voucher
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Đang Hoạt Động
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857' }}>{activeCount}</div>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            <i className="fa-solid fa-eye-slash"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Đã Ẩn / Tạm Dừng
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309' }}>{hiddenCount}</div>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Đã Áp Dụng
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6d28d9' }}>{totalUsages} lượt</div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation & Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '2px solid #f1f5f9',
          marginBottom: '1.25rem',
          paddingBottom: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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

        {activeSubTab === 'vouchers' && (
          <div style={{ position: 'relative', width: '280px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '0.85rem'
              }}
            ></i>
            <input
              type="text"
              placeholder="Tìm mã hoặc tên chương trình..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
      </div>

      {/* SUB-TAB 1: Vouchers List */}
      {activeSubTab === 'vouchers' && (
        <div style={{ overflowX: 'auto' }}>
          {filteredCoupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
              <i className="fa-solid fa-ticket-simple fa-3x" style={{ color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
              <h4 style={{ margin: '0 0 0.35rem', color: '#334155' }}>
                {searchFilter ? 'Không tìm thấy voucher phù hợp' : 'Chưa có mã khuyến mãi nào'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {searchFilter ? 'Vui lòng thử tìm với từ khóa khác.' : 'Bấm nút "Tạo Voucher Mới" để thiết lập mã ưu đãi đầu tiên.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Mã Voucher</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Chương Trình / Mô Tả</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mức Giảm</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Đơn Tối Thiểu</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tiến Độ Sử Dụng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Hạn Dùng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((cp) => {
                  const isExpired =
                    cp.status === 'expired' ||
                    (cp.rawExpiryDate && new Date(cp.rawExpiryDate).getTime() < Date.now());
                  const isHidden = !cp.isActive || cp.status === 'inactive';
                  const limit = cp.usageLimit || 100;
                  const usagePercent = Math.min(100, Math.round(((cp.usageCount || 0) / limit) * 100));
                  const isLoadingRow = actionLoadingCode === cp.code;

                  return (
                    <tr
                      key={cp.code}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        background: isHidden ? '#fafaf9' : 'transparent',
                        opacity: isHidden ? 0.85 : 1,
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Code */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: isHidden ? '#f1f5f9' : '#f0fdf4',
                            border: isHidden ? '1px dashed #94a3b8' : '1px dashed #059669',
                            color: isHidden ? '#64748b' : '#047857',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            fontSize: '0.88rem'
                          }}
                        >
                          {cp.code}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '0.85rem 1rem', minWidth: '180px', maxWidth: '260px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.86rem', lineHeight: 1.3 }}>
                          {cp.description || 'Ưu đãi WebTravel'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {cp.discountType === 'percentage' ? 'Giảm theo phần trăm hóa đơn' : 'Khấu trừ tiền mặt trực tiếp'}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.92rem' }}>
                          {cp.discountType === 'percentage' ? `${cp.value}%` : formatCurrencyVND(cp.value)}
                        </span>
                      </td>

                      {/* Min Order Value */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {cp.minOrderValue && cp.minOrderValue > 0 ? (
                          <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.84rem' }}>
                            {formatCurrencyVND(cp.minOrderValue)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mọi giá trị</span>
                        )}
                      </td>

                      {/* Usage Progress */}
                      <td style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          <span>
                            <strong style={{ color: '#0f172a' }}>{cp.usageCount}</strong> / {limit}
                          </span>
                          <span>{usagePercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${usagePercent}%`,
                              height: '100%',
                              background: usagePercent >= 90 ? '#ef4444' : usagePercent >= 70 ? '#f59e0b' : '#10b981',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </td>

                      {/* Expiry */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: isExpired ? '#dc2626' : '#64748b', fontSize: '0.82rem', fontWeight: isExpired ? 700 : 500 }}>
                          {cp.expiryDate}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {isHidden ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a'
                            }}
                          >
                            <i className="fa-solid fa-circle-pause"></i> Đã Ẩn
                          </span>
                        ) : isExpired ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca'
                            }}
                          >
                            <i className="fa-solid fa-circle-xmark"></i> Đã Hết Hạn
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            <i className="fa-solid fa-circle-check"></i> Hoạt Động
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {/* Toggle Active / Hide Button */}
                          <PermissionGate permission="coupon:toggle_active">
                            <button
                              type="button"
                              onClick={() => handleToggle(cp)}
                              disabled={isLoadingRow}
                              title={cp.isActive ? 'Tạm dừng áp dụng (Ẩn voucher)' : 'Kích hoạt lại voucher'}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: cp.isActive ? '#fffbeb' : '#ecfdf5',
                                color: cp.isActive ? '#d97706' : '#059669',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isLoadingRow ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                              ) : (
                                <i className={`fa-solid ${cp.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              )}
                            </button>
                          </PermissionGate>

                          {/* Edit Button */}
                          <PermissionGate permission="coupon:edit">
                            <button
                              type="button"
                              onClick={() => onEditCoupon(cp)}
                              title="Chỉnh sửa thông số voucher"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#eff6ff',
                                color: '#2563eb',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </PermissionGate>

                          {/* Delete Button */}
                          <PermissionGate permission="coupon:delete">
                            <button
                              type="button"
                              onClick={() => setCouponToDelete(cp)}
                              title="Xóa vĩnh viễn voucher"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setCouponToDelete(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  margin: '0 auto 1rem'
                }}
              >
                <i className="fa-solid fa-trash-can"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Xác Nhận Xóa Voucher
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa vĩnh viễn voucher{' '}
                <strong style={{ color: '#dc2626' }}>{couponToDelete.code}</strong>?
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Lưu ý: Nếu voucher này đã từng được sử dụng trong đơn hàng, hệ thống sẽ yêu cầu bạn dùng chức năng "Ẩn" để bảo vệ lịch sử dữ liệu.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang Xóa...
                  </>
                ) : (
                  'Xóa Vĩnh Viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

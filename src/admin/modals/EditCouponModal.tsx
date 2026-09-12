import React, { useState, useEffect } from 'react';
import { CouponRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';

interface EditCouponModalProps {
  coupon: CouponRecord | null;
  onClose: () => void;
  onSaveCoupon: (updated: CouponRecord) => Promise<void>;
}

export const EditCouponModal: React.FC<EditCouponModalProps> = ({
  coupon,
  onClose,
  onSaveCoupon
}) => {
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [value, setValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [rawExpiryDate, setRawExpiryDate] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when coupon changes
  useEffect(() => {
    if (coupon) {
      setDescription(coupon.description || '');
      setDiscountType(coupon.discountType || 'fixed');
      setValue(coupon.value || 0);
      setMinOrderValue(coupon.minOrderValue || 0);
      setUsageLimit(coupon.usageLimit || 100);
      setIsActive(coupon.isActive !== false);

      // Parse date for HTML date input YYYY-MM-DD
      if (coupon.rawExpiryDate) {
        try {
          const d = new Date(coupon.rawExpiryDate);
          if (!isNaN(d.getTime())) {
            setRawExpiryDate(d.toISOString().split('T')[0]);
          } else {
            setRawExpiryDate('');
          }
        } catch {
          setRawExpiryDate('');
        }
      } else if (coupon.expiryDate && coupon.expiryDate.includes('/')) {
        // e.g. 31/12/2026
        const parts = coupon.expiryDate.split('/');
        if (parts.length === 3) {
          setRawExpiryDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        } else {
          setRawExpiryDate('');
        }
      } else {
        setRawExpiryDate('');
      }
      setErrorMsg(null);
    }
  }, [coupon]);

  if (!coupon) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (value <= 0) {
      setErrorMsg('Mức giảm giá phải lớn hơn 0.');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      setErrorMsg('Mức giảm theo phần trăm không được vượt quá 100%.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let displayExpiry = coupon.expiryDate;
      let isoExpiry: string | undefined = coupon.rawExpiryDate;

      if (rawExpiryDate) {
        const d = new Date(rawExpiryDate + 'T23:59:59');
        if (!isNaN(d.getTime())) {
          isoExpiry = d.toISOString();
          displayExpiry = d.toLocaleDateString('vi-VN');
        }
      } else {
        isoExpiry = undefined;
        displayExpiry = 'Không giới hạn';
      }

      const updated: CouponRecord = {
        ...coupon,
        description: description.trim() || `Ưu đãi ${coupon.code}`,
        discountType,
        value: Number(value),
        minOrderValue: Number(minOrderValue) || 0,
        usageLimit: Number(usageLimit) || 100,
        expiryDate: displayExpiry,
        rawExpiryDate: isoExpiry,
        isActive,
        status: !isActive ? 'inactive' : (isoExpiry && new Date(isoExpiry).getTime() < Date.now()) ? 'expired' : 'active'
      };

      await onSaveCoupon(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi cập nhật voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Chỉnh Sửa Voucher
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Cập nhật thông số chương trình ưu đãi &amp; hạn mức sử dụng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Code (Locked / Read-only) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Mã Voucher (Không thể sửa đổi)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    background: '#ecfdf5',
                    border: '1px dashed #059669',
                    color: '#047857',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    fontSize: '0.95rem'
                  }}
                >
                  {coupon.code}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  (Đã dùng: <strong>{coupon.usageCount}</strong> lượt)
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontWeight: 600
                }}
              >
                <i className="fa-solid fa-lock"></i> Đã khóa
              </span>
            </div>
          </div>

          {/* Row 2: Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Tên / Mô Tả Chương Trình <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Tri ân mùa thu 2026"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Row 3: Discount Type & Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Hình Thức Giảm
              </label>
              <select
                value={discountType}
                onChange={(e) => {
                  const newType = e.target.value as 'fixed' | 'percentage';
                  setDiscountType(newType);
                  if (newType === 'percentage' && value > 100) {
                    setValue(10);
                  } else if (newType === 'fixed' && value <= 100) {
                    setValue(200000);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="fixed">Số Tiền Mặt (VNĐ)</option>
                <option value="percentage">Phần Trăm (%)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Mức Giảm {discountType === 'percentage' ? '(%)' : '(VNĐ)'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={discountType === 'percentage' ? 100 : 50000000}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
                Hiển thị: {discountType === 'percentage' ? `${value}%` : formatCurrencyVND(value)}
              </span>
            </div>
          </div>

          {/* Row 4: Min Order Value & Usage Limit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Đơn Tối Thiểu (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                placeholder="0 = Không yêu cầu"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                {minOrderValue > 0 ? `Áp dụng từ: ${formatCurrencyVND(minOrderValue)}` : 'Áp dụng cho mọi giá trị đơn'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Giới Hạn Lượt Dùng
              </label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                placeholder="VD: 100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                Tối đa {usageLimit} lượt tổng thể
              </span>
            </div>
          </div>

          {/* Row 5: Expiry Date */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Ngày Hết Hạn
            </label>
            <input
              type="date"
              value={rawExpiryDate}
              onChange={(e) => setRawExpiryDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#ffffff'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Để trống nếu muốn mã có hiệu lực vĩnh viễn không giới hạn ngày.
            </span>
          </div>

          {/* Row 6: Active Status Toggle Switch */}
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              background: isActive ? '#f0fdf4' : '#fef2f2',
              borderRadius: '10px',
              border: isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setIsActive(!isActive)}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: isActive ? '#065f46' : '#991b1b' }}>
                {isActive ? 'Trạng thái: Đang Kích Hoạt (Hiển thị)' : 'Trạng thái: Đang Ẩn (Tạm dừng áp dụng)'}
              </div>
              <div style={{ fontSize: '0.76rem', color: isActive ? '#047857' : '#b91c1c' }}>
                {isActive
                  ? 'Khách hàng có thể nhập mã này khi thanh toán tour'
                  : 'Khách hàng sẽ không thể nhập hoặc sử dụng mã này'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#047857' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
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
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1.5,
                padding: '0.75rem',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Đang Lưu...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

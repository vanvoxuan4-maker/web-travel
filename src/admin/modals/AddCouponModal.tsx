import React, { useState } from 'react';
import { CouponRecord } from '../admin.types';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoupon: (coupon: CouponRecord) => Promise<void>;
}

export const AddCouponModal: React.FC<AddCouponModalProps> = ({
  isOpen,
  onClose,
  onAddCoupon
}) => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [value, setValue] = useState(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const item: CouponRecord = {
        code: code.trim().toUpperCase(),
        discountType,
        value,
        usageCount: 0,
        expiryDate: '31/12/2026',
        status: 'active'
      };
      await onAddCoupon(item);
      onClose();
      setCode('');
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
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '440px',
          width: '100%',
          padding: '1.75rem'
        }}
      >
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Tạo Voucher Khuyến Mãi Mới
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Mã Voucher (Code) *
            </label>
            <input
              type="text"
              required
              placeholder="VD: AUTUMN2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Loại Giảm
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="fixed">Số Tiền (VNĐ)</option>
                <option value="percentage">Phần Trăm (%)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Giá Trị Giảm
              </label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

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
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? 'Đang Tạo...' : 'Tạo Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

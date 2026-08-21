import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface EditPriceModalProps {
  tour: Tour | null;
  onClose: () => void;
  onSavePrice: (tourId: string, newPrice: number) => Promise<void>;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({
  tour,
  onClose,
  onSavePrice
}) => {
  const [price, setPrice] = useState<number>(tour ? tour.priceAdult : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tour) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0) return;
    setIsSubmitting(true);
    try {
      await onSavePrice(tour.id, price);
      onClose();
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
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Cập Nhật Giá Tour Nhanh
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
          {tour.title}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Giá vé người lớn mới (VNĐ)
            </label>
            <input
              type="number"
              required
              min={100000}
              step={100000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#047857',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
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
                flex: 1,
                padding: '0.75rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? 'Đang Lưu...' : 'Lưu Giá Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

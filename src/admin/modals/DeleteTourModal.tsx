import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface DeleteTourModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (tourId: string) => Promise<void>;
}

export const DeleteTourModal: React.FC<DeleteTourModalProps> = ({
  tour,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !tour) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(tour.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #fee2e2'
        }}
      >
        {/* Warning Icon & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              color: '#dc2626',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
              Xác Nhận Xóa Tour
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Hành động này không thể hoàn tác
            </span>
          </div>
        </div>

        {/* Tour Info Preview */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <img
            src={tour.image}
            alt={tour.title}
            style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tour.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              Mã: {tour.code} • {tour.destination}
            </div>
          </div>
        </div>

        <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn xóa tour du lịch này khỏi hệ thống? Tour sẽ bị ẩn hoàn toàn khỏi danh mục tìm kiếm của khách hàng.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1.5,
              padding: '0.75rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
            }}
          >
            {isDeleting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash-can"></i>
                <span>Xác Nhận Xóa Tour</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

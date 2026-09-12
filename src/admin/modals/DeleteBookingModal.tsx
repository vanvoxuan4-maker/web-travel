import React, { useState } from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';

interface DeleteBookingModalProps {
  booking?: BookingRecord | null;
  bookings?: BookingRecord[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (bookingIds: string[]) => Promise<void>;
}

export const DeleteBookingModal: React.FC<DeleteBookingModalProps> = ({
  booking,
  bookings,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Normalize list of bookings to delete
  const targetBookings = bookings && bookings.length > 0 
    ? bookings 
    : booking 
    ? [booking] 
    : [];

  if (!isOpen || targetBookings.length === 0) return null;

  const isBatch = targetBookings.length > 1;
  const singleBooking = targetBookings[0];
  const totalAmountSum = targetBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const ids = targetBookings.map(b => b.id || b.bookingCode);
      await onConfirmDelete(ids);
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
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: isBatch ? '540px' : '480px',
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
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#dc2626',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
              {isBatch ? `Xóa Cứng ${targetBookings.length} Đơn Hàng` : 'Xóa Cứng Đơn Hàng'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>
              Xóa vĩnh viễn khỏi Database • Không thể khôi phục
            </span>
          </div>
        </div>

        {/* Content Preview: Single vs Batch */}
        {!isBatch ? (
          /* Single Booking Card */
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#047857', fontSize: '1.05rem', background: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                {singleBooking.bookingCode || singleBooking.id}
              </span>
              <span style={{ fontWeight: 800, color: '#b45309', fontSize: '1rem' }}>
                {formatCurrencyVND(singleBooking.totalAmount)}
              </span>
            </div>

            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginTop: '0.2rem' }}>
              {singleBooking.tourTitle}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.45rem' }}>
              <span><i className="fa-solid fa-user" style={{ marginRight: '0.3rem', color: '#047857' }} /><strong>{singleBooking.customerName}</strong></span>
              <span><i className="fa-solid fa-phone" style={{ marginRight: '0.3rem', color: '#047857' }} />{singleBooking.phone}</span>
              <span><i className="fa-solid fa-calendar" style={{ marginRight: '0.3rem', color: '#047857' }} />{singleBooking.departureDate}</span>
            </div>
          </div>
        ) : (
          /* Batch Bookings List */
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', paddingBottom: '0.45rem', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                Danh sách {targetBookings.length} đơn được chọn:
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309' }}>
                Tổng tiền: {formatCurrencyVND(totalAmountSum)}
              </span>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.25rem' }}>
              {targetBookings.map((b) => (
                <div
                  key={b.id || b.bookingCode}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#047857' }}>
                      {b.bookingCode || b.id}
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>• {b.customerName}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#334155' }}>
                    {formatCurrencyVND(b.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn <strong>xóa cứng vĩnh viễn</strong> {isBatch ? `${targetBookings.length} đơn hàng này` : 'đơn hàng này'}? Toàn bộ hồ sơ trên hệ thống Supabase &amp; LocalStorage sẽ bị xóa sạch, đồng thời số chỗ trống của tour sẽ được hoàn lại kho vé.
        </p>

        {/* Action Buttons */}
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
              borderRadius: '12px',
              fontWeight: 700,
              color: '#475569',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
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
              borderRadius: '12px',
              fontWeight: 800,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
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
                <span>{isBatch ? `Xác Nhận Xóa ${targetBookings.length} Đơn` : 'Xác Nhận Xóa Vĩnh Viễn'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

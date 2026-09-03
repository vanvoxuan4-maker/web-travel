import React, { useState } from 'react';
import { BookingPayload, bookingService, getBookingUiStatus } from '../../../services/bookingService';
import { formatCurrencyVND } from '../../../utils/formatters';

interface QuickPaymentModalProps {
  booking: BookingPayload;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  booking,
  onClose,
  onPaymentSuccess
}) => {
  const uiStatus = getBookingUiStatus(booking);
  const isPayingRemaining = uiStatus === 'deposit';

  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>(isPayingRemaining ? 'full' : 'deposit');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate payment due amount
  const paidAlready = booking.paidAmount || (isPayingRemaining ? Math.round(booking.totalAmount * 0.5) : 0);
  const remainingAmount = Math.max(0, booking.totalAmount - paidAlready);

  const dueAmount = isPayingRemaining
    ? remainingAmount
    : paymentType === 'deposit'
    ? Math.round(booking.totalAmount * 0.5)
    : booking.totalAmount;

  const vietQrUrl = `https://img.vietqr.io/image/MB-0348888999-compact2.png?amount=${dueAmount}&addInfo=${encodeURIComponent(
    booking.bookingCode + ' ' + (booking.customerPhone || '')
  )}&accountName=CONG%20TY%20DU%20LICH%20WEBTRAVEL`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    try {
      const targetPaymentStatus = isPayingRemaining || paymentType === 'full' ? 'paid' : 'partially_paid';
      const targetTotalPaid = isPayingRemaining ? booking.totalAmount : dueAmount;

      await bookingService.updatePaymentStatus(
        booking.bookingCode,
        targetPaymentStatus,
        targetTotalPaid,
        'vietqr'
      );

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      alert('Không thể cập nhật thanh toán: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
            padding: '1.25rem 1.75rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}
            >
              <i className="fa-solid fa-qrcode" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 700 }}>
                {isPayingRemaining ? 'Thanh Toán Nốt 50% Còn Lại' : 'Thanh Toán Đặt Chỗ Tour'}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Mã Đơn: {booking.bookingCode}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tour info */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              {booking.tourTitle}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Khởi hành: <strong>{booking.departureDate}</strong> • Khách: <strong>{booking.customerName}</strong>
            </div>
          </div>

          {/* Payment Type Selection (only if not yet deposit) */}
          {!isPayingRemaining ? (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Chọn mức thanh toán:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setPaymentType('deposit')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: `2px solid ${paymentType === 'deposit' ? '#d97706' : '#e2e8f0'}`,
                    background: paymentType === 'deposit' ? '#fffbeb' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706' }}>⚡ ĐẶT CỌC 50%</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                    {formatCurrencyVND(Math.round(booking.totalAmount * 0.5))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>Giữ chỗ chắc chắn</div>
                </div>

                <div
                  onClick={() => setPaymentType('full')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: `2px solid ${paymentType === 'full' ? '#047857' : '#e2e8f0'}`,
                    background: paymentType === 'full' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857' }}>✓ TRỌN GÓI 100%</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                    {formatCurrencyVND(booking.totalAmount)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>Xong nghĩa vụ tài chính</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>ĐÃ CỌC 50%: {formatCurrencyVND(paidAlready)}</div>
                <div style={{ fontSize: '0.95rem', color: '#b45309', fontWeight: 900 }}>CẦN THANH TOÁN NỐT: {formatCurrencyVND(dueAmount)}</div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                Hạn chót: Trước khởi hành 7 ngày
              </span>
            </div>
          )}

          {/* QR Code and Bank Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <img
                src={vietQrUrl}
                alt="VietQR Chuyển Khoản"
                style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
              />
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 700 }}>
                Quét mã qua app ngân hàng
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Ngân hàng: </span>
                <strong style={{ color: '#0f172a' }}>MB Bank (Quân Đội)</strong>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.35rem 0.6rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Số tài khoản: </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#047857' }}>0348888999</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('0348888999', 'stk')}
                  style={{ border: 'none', background: '#ffffff', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Chủ tài khoản: </span>
                <strong style={{ color: '#0f172a' }}>CONG TY DU LICH WEBTRAVEL</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.35rem 0.6rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Số tiền: </span>
                  <strong style={{ fontSize: '0.95rem', color: '#dc2626' }}>{formatCurrencyVND(dueAmount)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(dueAmount.toString(), 'amount')}
                  style={{ border: 'none', background: '#ffffff', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px dashed #a7f3d0' }}>
                <div>
                  <span style={{ color: '#047857', fontSize: '0.75rem' }}>Nội dung CK: </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#047857' }}>{booking.bookingCode}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(booking.bookingCode, 'content')}
                  style={{ border: 'none', background: '#047857', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Confirmation Button */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Để Sau
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmTransfer}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '12px',
                border: 'none',
                background: '#047857',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Đang ghi nhận...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check" /> Tôi Đã Chuyển Khoản Xong
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { ETicketModal } from '../../user/components/profile/ETicketModal';
import { BookingPayload } from '../../services/bookingService';

interface BookingDetailModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => Promise<void>;
  onRequestDelete?: (booking: BookingRecord) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onUpdateStatus,
  onRequestDelete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showETicket, setShowETicket] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode || booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusClick = async (status: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(booking.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const effectivePaidAmount = booking.status === 'confirmed'
    ? booking.totalAmount
    : booking.status === 'deposit'
    ? (booking.paidAmount || Math.round(booking.totalAmount * 0.5))
    : (booking.paidAmount || 0);

  const remainingAmount = Math.max(0, booking.totalAmount - effectivePaidAmount);

  // Convert BookingRecord to BookingPayload for ETicketModal
  const eTicketPayload: BookingPayload = {
    bookingCode: booking.bookingCode || booking.id,
    tourId: booking.tourId || 'tour-01',
    tourTitle: booking.tourTitle,
    departureDate: booking.departureDate,
    customerName: booking.customerName,
    customerPhone: booking.phone,
    customerEmail: booking.email || 'customer@webtravel.vn',
    customerAddress: booking.customerAddress || '',
    customerNotes: booking.customerNotes || '',
    adultsCount: booking.adultsCount || 1,
    childrenCount: booking.childrenCount || 0,
    toddlersCount: booking.toddlersCount || 0,
    infantsCount: booking.infantsCount || 0,
    singleRoomsCount: booking.singleRoomsCount || 0,
    totalAmount: booking.totalAmount,
    paidAmount: effectivePaidAmount,
    couponCode: booking.couponCode,
    couponDiscount: booking.couponDiscount,
    paymentMethod: (booking.paymentMethod as any) || 'vietqr',
    paymentStatus: booking.status === 'deposit' ? 'partially_paid' : booking.status === 'confirmed' ? 'paid' : (booking.paymentStatus || 'pending'),
    bookingStatus: booking.bookingStatus || (booking.status === 'confirmed' ? 'confirmed' : 'pending'),
    createdAt: booking.createdAt
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          overflowY: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '820px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            animation: 'modalSlideUp 0.25s ease-out'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              padding: '1.25rem 2rem',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Hồ Sơ Đơn Hàng: {booking.bookingCode || booking.id}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-copy" /> {copied ? 'Đã sao chép!' : 'Copy'}
                </button>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                Ngày tạo đơn: {booking.createdAt} • Phương thức: {booking.paymentMethod.toUpperCase()}
              </p>
            </div>

            <button
              type="button"
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
          <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Row 1: Thông tin khách hàng liên hệ */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-user-check" style={{ color: '#047857' }} /> Thông Tin Khách Hàng Đại Diện
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Họ và tên:</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginTop: '0.15rem' }}>{booking.customerName}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Số điện thoại (Zalo):</span>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#047857', marginTop: '0.15rem' }}>
                    <a href={`tel:${booking.phone}`} style={{ color: '#047857', textDecoration: 'none' }}>
                      <i className="fa-solid fa-phone" style={{ marginRight: '0.35rem' }} />{booking.phone}
                    </a>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Email nhận vé:</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                    {booking.email || 'Chưa cập nhật'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Địa chỉ liên hệ:</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                    {booking.customerAddress || 'Chưa cung cấp'}
                  </div>
                </div>
              </div>

              {booking.customerNotes && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.88rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>Ghi chú / Yêu cầu đặc biệt:</strong> {booking.customerNotes}
                </div>
              )}
            </div>

            {/* Row 2: Chi tiết Tour & Số lượng khách */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-plane-departure" style={{ color: '#047857' }} /> Chi Tiết Hành Trình &amp; Số Lượng Chỗ
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tên tour đăng ký:</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    {booking.tourTitle}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Ngày khởi hành:</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857', marginTop: '0.15rem' }}>
                    <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.35rem' }} />{booking.departureDate}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng số khách ({booking.paxCount} pax):</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>
                    {booking.adultsCount || 1} Lớn
                    {booking.childrenCount ? ` • ${booking.childrenCount} Trẻ em` : ''}
                    {booking.toddlersCount ? ` • ${booking.toddlersCount} Trẻ nhỏ` : ''}
                    {booking.infantsCount ? ` • ${booking.infantsCount} Em bé` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Chi tiết thanh toán & Đối soát VietQR */}
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-money-bill-transfer" style={{ color: '#047857' }} /> Đối Soát Tài Chính &amp; Thanh Toán
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Tổng giá trị đơn:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>
                    {formatCurrencyVND(booking.totalAmount)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Đã thanh toán / Cọc:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '0.15rem' }}>
                    {formatCurrencyVND(effectivePaidAmount)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Còn lại cần thu:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: remainingAmount > 0 ? '#e11d48' : '#047857', marginTop: '0.15rem' }}>
                    {formatCurrencyVND(remainingAmount)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Trạng thái hiện tại:</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span
                      style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background:
                          booking.status === 'confirmed' ? '#047857' : booking.status === 'deposit' ? '#d97706' : booking.status === 'pending' ? '#2563eb' : '#dc2626',
                        color: '#ffffff',
                        display: 'inline-block'
                      }}
                    >
                      {booking.status === 'confirmed'
                        ? '✅ ĐÃ THANH TOÁN 100%'
                        : booking.status === 'deposit'
                        ? '⚡ ĐÃ ĐẶT CỌC 50%'
                        : booking.status === 'pending'
                        ? '⏳ CHỜ THANH TOÁN'
                        : '❌ ĐÃ HỦY ĐƠN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Bar */}
          <div
            style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            {/* Left: Xuất Vé Điện Tử E-Ticket */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowETicket(true)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1.5px solid #047857',
                  color: '#047857',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 6px rgba(4, 120, 87, 0.08)'
                }}
              >
                <i className="fa-solid fa-qrcode" /> Xuất Vé Điện Tử (E-Ticket)
              </button>

              {onRequestDelete && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    onClose();
                    onRequestDelete(booking);
                  }}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                  title="Xóa vĩnh viễn đơn này khỏi cơ sở dữ liệu"
                >
                  <i className="fa-solid fa-trash-can" /> Xóa Cứng
                </button>
              )}
            </div>

            {/* Right: Trạng thái hành động nhanh */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={isUpdating || booking.status === 'confirmed'}
                onClick={() => handleStatusClick('confirmed')}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: '#047857',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: booking.status === 'confirmed' ? 'not-allowed' : 'pointer',
                  opacity: booking.status === 'confirmed' ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
                }}
              >
                <i className="fa-solid fa-check-double" style={{ marginRight: '0.4rem' }} />
                Xác Nhận 100%
              </button>

              <button
                type="button"
                disabled={isUpdating || booking.status === 'deposit'}
                onClick={() => handleStatusClick('deposit')}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: '#d97706',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: booking.status === 'deposit' ? 'not-allowed' : 'pointer',
                  opacity: booking.status === 'deposit' ? 0.6 : 1
                }}
              >
                <i className="fa-solid fa-coins" style={{ marginRight: '0.4rem' }} />
                Đã Cọc 50%
              </button>

              <button
                type="button"
                disabled={isUpdating || booking.status === 'cancelled'}
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn HỦY đơn tour ${booking.bookingCode || booking.id} không?`)) {
                    handleStatusClick('cancelled');
                  }
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: booking.status === 'cancelled' ? 'not-allowed' : 'pointer',
                  opacity: booking.status === 'cancelled' ? 0.6 : 1
                }}
              >
                <i className="fa-solid fa-ban" style={{ marginRight: '0.4rem' }} />
                Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* E-Ticket Printable Modal */}
      {showETicket && (
        <ETicketModal
          booking={eTicketPayload}
          onClose={() => setShowETicket(false)}
        />
      )}
    </>
  );
};

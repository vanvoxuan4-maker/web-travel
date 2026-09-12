import React, { useState, useEffect } from 'react';
import { BookingPayload, bookingService, getBookingUiStatus, PaymentTransactionRecord } from '../../../services/bookingService';
import { tourService } from '../../../services/tourService';
import { formatCurrencyVND } from '../../../utils/formatters';

interface UserBookingDetailModalProps {
  booking: BookingPayload | null;
  onClose: () => void;
  onOpenETicket?: (booking: BookingPayload) => void;
  onOpenPayment?: (booking: BookingPayload) => void;
  onCancelBooking?: (booking: BookingPayload) => void;
}

export const UserBookingDetailModal: React.FC<UserBookingDetailModalProps> = ({
  booking,
  onClose,
  onOpenETicket,
  onOpenPayment,
  onCancelBooking
}) => {
  const [copied, setCopied] = useState(false);
  const [tourDetails, setTourDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);

  useEffect(() => {
    if (!booking) return;

    // 1. Fetch tour details for extra info (duration, location, prices)
    if (booking.tourId) {
      const cached = tourService.getTourByIdSync(booking.tourId);
      if (cached) {
        setTourDetails(cached);
      } else {
        tourService.getTourById(booking.tourId).then((t) => {
          if (t) setTourDetails(t);
        }).catch(() => {});
      }
    }

    // 2. Fetch payment transactions
    const code = booking.bookingCode || booking.id;
    if (code) {
      bookingService.getTransactionsByBookingCode(code)
        .then(setTransactions)
        .catch(() => {});
    }
  }, [booking]);

  if (!booking) return null;

  const uiStatus = getBookingUiStatus(booking);
  const isCancelled = uiStatus === 'cancelled';
  const totalAmount = Number(booking.totalAmount) || 0;
  const paidAmount = Number(booking.paidAmount) || (uiStatus === 'confirmed' ? totalAmount : uiStatus === 'deposit' ? Math.round(totalAmount * 0.5) : 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Chi Tiết Đơn Đặt Chỗ
                </h3>
                <span
                  onClick={handleCopyCode}
                  title="Bấm để sao chép mã"
                  style={{
                    background: '#f0fdf4',
                    border: '1px dashed #059669',
                    color: '#047857',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {booking.bookingCode}
                  <i className={`fa-solid ${copied ? 'fa-check text-green-600' : 'fa-copy'}`} style={{ fontSize: '0.75rem' }}></i>
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Ngày đặt:{' '}
                <strong>
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : 'Mới đây'}
                </strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Status Badge */}
            {uiStatus === 'confirmed' ? (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-solid fa-circle-check"></i> ĐÃ XÁC NHẬN
              </span>
            ) : uiStatus === 'deposit' ? (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: '#fffbeb',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-solid fa-coins"></i> ĐÃ CỌC 50%
              </span>
            ) : uiStatus === 'cancelled' ? (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-solid fa-circle-xmark"></i> ĐÃ HỦY
              </span>
            ) : (
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1px solid #ffedd5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-solid fa-clock"></i> CHỜ THANH TOÁN
              </span>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: '#e2e8f0',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* 1. Tour Info Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            {tourDetails?.images?.[0] || booking.tourImage ? (
              <img
                src={tourDetails?.images?.[0] || booking.tourImage}
                alt={booking.tourTitle}
                style={{
                  width: '110px',
                  height: '85px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              />
            ) : null}

            <div style={{ flex: 1, minWidth: '220px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {tourDetails?.duration || 'Tour Du Lịch Cao Cấp'}
              </span>
              <h4
                style={{
                  margin: '0.2rem 0 0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.35
                }}
              >
                {booking.tourTitle}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                <span>
                  <i className="fa-solid fa-calendar-days" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                  Khởi hành: <strong>{booking.departureDate}</strong>
                </span>
                {tourDetails?.departureLocation && (
                  <span>
                    <i className="fa-solid fa-location-dot" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                    Nơi tập trung: <strong>{tourDetails.departureLocation}</strong>
                  </span>
                )}
                <span>
                  <i className="fa-solid fa-credit-card" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                  Phương thức: <strong>{booking.paymentMethod === 'cash' ? 'Tại Văn Phòng' : booking.paymentMethod.toUpperCase()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Passenger & Price Breakdown */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <h5 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              <i className="fa-solid fa-users" style={{ color: '#059669', marginRight: '0.45rem' }}></i>
              Cơ Cấu Hành Khách &amp; Giá Vé
            </h5>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Loại Vé</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Số Lượng</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Ghi Chú Độ Tuổi</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.65rem 0', fontWeight: 700, color: '#1e293b' }}>
                    Vé Người Lớn
                  </td>
                  <td style={{ padding: '0.65rem 0', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                    {booking.adultsCount} khách
                  </td>
                  <td style={{ padding: '0.65rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                    Từ 12 tuổi trở lên
                  </td>
                </tr>

                {booking.childrenCount > 0 && (
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.65rem 0', fontWeight: 700, color: '#1e293b' }}>
                      Vé Trẻ Em
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                      {booking.childrenCount} khách
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                      Từ 5 đến 11 tuổi
                    </td>
                  </tr>
                )}

                {(booking.toddlersCount || 0) > 0 && (
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.65rem 0', fontWeight: 700, color: '#1e293b' }}>
                      Vé Trẻ Nhỏ
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                      {booking.toddlersCount} bé
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                      Từ 2 đến 4 tuổi
                    </td>
                  </tr>
                )}

                {booking.infantsCount > 0 && (
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.65rem 0', fontWeight: 700, color: '#1e293b' }}>
                      Vé Em Bé
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                      {booking.infantsCount} bé
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                      Dưới 2 tuổi
                    </td>
                  </tr>
                )}

                {(booking.singleRoomsCount || 0) > 0 && (
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.65rem 0', fontWeight: 700, color: '#1e293b' }}>
                      Phụ Thu Phòng Đơn
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                      {booking.singleRoomsCount} phòng
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                      Phòng riêng 1 người
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 3. Customer Contact Info */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <h5 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              <i className="fa-solid fa-address-book" style={{ color: '#059669', marginRight: '0.45rem' }}></i>
              Thông Tin Người Đại Diện Đặt Chỗ
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Họ và tên</span>
                <strong style={{ color: '#1e293b' }}>{booking.customerName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Số điện thoại</span>
                <strong style={{ color: '#1e293b' }}>{booking.customerPhone}</strong>
              </div>
              {booking.customerEmail && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Email liên hệ</span>
                  <strong style={{ color: '#1e293b' }}>{booking.customerEmail}</strong>
                </div>
              )}
              {booking.customerAddress && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Địa chỉ</span>
                  <strong style={{ color: '#1e293b' }}>{booking.customerAddress}</strong>
                </div>
              )}
            </div>

            {booking.customerNotes && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: '#334155'
                }}
              >
                <i className="fa-solid fa-note-sticky" style={{ color: '#059669', marginRight: '0.4rem' }}></i>
                <strong>Yêu cầu riêng từ khách:</strong> {booking.customerNotes}
              </div>
            )}
          </div>

          {/* 4. Financial Summary Card */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '16px',
              padding: '1.25rem'
            }}
          >
            <h5 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800, color: '#065f46' }}>
              <i className="fa-solid fa-receipt" style={{ color: '#059669', marginRight: '0.45rem' }}></i>
              Thanh Toán &amp; Ưu Đãi
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Giá trị dịch vụ tour:</span>
                <span>{formatCurrencyVND(totalAmount + (booking.couponDiscount || 0))}</span>
              </div>

              {booking.couponCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 700 }}>
                  <span>
                    <i className="fa-solid fa-tag" style={{ marginRight: '0.35rem' }}></i>
                    Khuyến mãi ({booking.couponCode}):
                  </span>
                  <span>-{formatCurrencyVND(booking.couponDiscount || 0)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '0.65rem',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: '#0f172a'
                }}
              >
                <span>Tổng tiền hóa đơn:</span>
                <span style={{ color: '#047857' }}>{formatCurrencyVND(totalAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                <span>✓ Số tiền đã thanh toán:</span>
                <span>{formatCurrencyVND(paidAmount)}</span>
              </div>

              {remainingAmount > 0 && !isCancelled && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: '#fef2f2',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    marginTop: '0.25rem'
                  }}
                >
                  <span>Số tiền còn lại cần nộp:</span>
                  <span>{formatCurrencyVND(remainingAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Payment Transactions Log (If available) */}
          {transactions.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <h5 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#059669', marginRight: '0.45rem' }}></i>
                Lịch Sử Đối Soát Giao Dịch
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {transactions.map((tx, idx) => (
                  <div
                    key={tx.id || tx.transactionCode || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        Mã GD: {tx.transactionCode || (tx.id ? tx.id.substring(0, 8) : `#${idx + 1}`)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {tx.bankName ? `${tx.bankName.toUpperCase()} • ` : ''}
                        {tx.paidAt ? new Date(tx.paidAt).toLocaleString('vi-VN') : tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#047857' }}>
                        +{formatCurrencyVND(tx.amount)}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: tx.status === 'success' ? '#047857' : '#ea580c'
                        }}
                      >
                        {tx.status === 'success' ? 'Thành công' : 'Đang xử lý'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Left action: Print */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '0.65rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fa-solid fa-print"></i> In Thông Tin
          </button>

          {/* Right actions: ETicket, Payment, Cancel */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {!isCancelled && onCancelBooking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancelBooking(booking);
                }}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Hủy Đặt Chỗ
              </button>
            )}

            {remainingAmount > 0 && !isCancelled && onOpenPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(booking);
                }}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <i className="fa-solid fa-qrcode"></i>
                {uiStatus === 'deposit' ? 'Thanh Toán Nốt 50%' : 'Thanh Toán Ngay'}
              </button>
            )}

            {!isCancelled && onOpenETicket && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenETicket(booking);
                }}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
                }}
              >
                <i className="fa-solid fa-ticket"></i>
                Xem Vé E-Ticket
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

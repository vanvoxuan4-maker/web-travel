import React, { useState } from 'react';
import { BookingPayload, getBookingUiStatus } from '../../../services/bookingService';
import { formatCurrencyVND } from '../../../utils/formatters';
import { SimpleQRCode } from '../../../utils/qrCode';

interface ETicketModalProps {
  booking: BookingPayload;
  onClose: () => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({ booking, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate QR Code data
  const qrData = `WEBTRAVEL-ETICKET:${booking.bookingCode}|TEL:${booking.customerPhone}|TOUR:${booking.tourTitle}|DEPART:${booking.departureDate}`;
  const qr = new SimpleQRCode(qrData, 'M');
  const qrSvgUrl = qr.toSVGDataUrl(220, '#047857', '#ffffff');

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrSvgUrl;
    link.download = `QRCode-${booking.bookingCode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPax = (booking.adultsCount || 0) + (booking.childrenCount || 0) + (booking.infantsCount || 0);

  const uiStatus = getBookingUiStatus(booking);
  const isDeposit = uiStatus === 'deposit';

  const getStatusColor = () => {
    if (uiStatus === 'cancelled') {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'ĐÃ HỦY TOUR', icon: 'fa-ban' };
    }
    if (uiStatus === 'deposit') {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'ĐÃ CỌC 50%', icon: 'fa-shield-halved' };
    }
    if (uiStatus === 'confirmed') {
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'ĐÃ XÁC NHẬN (100%)', icon: 'fa-shield-check' };
    }
    return { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', label: 'CHỜ THANH TOÁN (GIỮ CHỖ TẠM)', icon: 'fa-clock' };
  };

  const statusStyle = getStatusColor();

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
        className="eticket-printable-container"
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalSlideUp 0.3s ease-out'
        }}
      >
        {/* Top Metallic Branding Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
            padding: '1.25rem 2rem',
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
                fontSize: '1.2rem'
              }}
            >
              <i className="fa-solid fa-plane-departure"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#a7f3d0', fontWeight: 700 }}>
                WebTravel Editorial • Boarding Pass
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                {uiStatus === 'pending' ? 'PHIẾU XÁC NHẬN GIỮ CHỖ (CHỜ THANH TOÁN)' : 'VÉ DU LỊCH ĐIỆN TỬ (E-TICKET)'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="no-print"
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
              fontSize: '1.1rem',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Ticket Main Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Status & Booking Ref Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1.5px dashed #cbd5e1'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                MÃ XÁC NHẬN ĐẶT CHỖ (BOOKING REF)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {booking.bookingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="no-print"
                  style={{
                    background: '#e0f2fe',
                    border: 'none',
                    color: '#0369a1',
                    borderRadius: '8px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied ? 'Đã sao chép' : 'Copy Mã'}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '30px',
                background: statusStyle.bg,
                color: statusStyle.text,
                border: `1px solid ${statusStyle.border}`,
                fontSize: '0.85rem',
                fontWeight: 800
              }}
            >
              <i className={`fa-solid ${statusStyle.icon}`}></i>
              {statusStyle.label}
            </div>
          </div>

          {/* Pending notice banner */}
          {uiStatus === 'pending' && (
            <div style={{ padding: '0.85rem 1.25rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5', color: '#c2410c', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>Đơn hàng đang trong thời gian giữ chỗ chờ thanh toán. Vé điện tử chính thức kèm mã QR xuất vé khởi hành sẽ được kích hoạt ngay sau khi hoàn tất đặt cọc hoặc thanh toán 100%.</span>
            </div>
          )}

          {/* Tour Title Header */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              HÀNH TRÌNH KHÁM PHÁ
            </div>
            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
              {booking.tourTitle}
            </h3>
          </div>

          {/* Core Info Grid: Details vs QR Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1.5rem' }}>
            
            {/* Left Column: Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    <i className="fa-solid fa-calendar-day" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                    NGÀY KHỞI HÀNH
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {booking.departureDate}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    <i className="fa-solid fa-clock" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                    GIỜ TẬP TRUNG
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    05:30 Sáng (Dự kiến)
                  </div>
                </div>
              </div>

              {/* Passenger Breakdown */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-user-group" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
                  THÔNG TIN HÀNH KHÁCH ĐẠI DIỆN ({totalPax} KHÁCH)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Trưởng đoàn: </span>
                    <strong style={{ color: '#0f172a' }}>{booking.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>SĐT: </span>
                    <strong style={{ color: '#0f172a' }}>{booking.customerPhone}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Email: </span>
                    <strong style={{ color: '#0f172a' }}>{booking.customerEmail}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Cơ cấu: </span>
                    <strong style={{ color: '#0f172a' }}>
                      {booking.adultsCount} NL {booking.childrenCount > 0 ? `+ ${booking.childrenCount} TE` : ''}
                    </strong>
                  </div>
                </div>

                {booking.customerAddress && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
                    <i className="fa-solid fa-house" style={{ color: '#047857', marginRight: '0.35rem' }}></i>
                    <strong>Địa chỉ liên hệ: </strong> {booking.customerAddress}
                  </div>
                )}
                <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <i className="fa-solid fa-person-walking-luggage" style={{ color: '#047857', marginRight: '0.35rem' }}></i>
                  <strong>Điểm tập trung: </strong> Quý khách tự túc di chuyển đến điểm tập trung khởi hành của tour trước giờ khởi hành 2 tiếng.
                </div>
                {booking.customerNotes && booking.customerNotes.trim() && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>
                    <i className="fa-solid fa-note-sticky" style={{ color: '#047857', marginRight: '0.35rem' }}></i>
                    <strong>Ghi chú / Yêu cầu: </strong> {booking.customerNotes}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: isDeposit ? '#fffbeb' : '#ecfdf5',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  border: `1px solid ${isDeposit ? '#fde68a' : '#a7f3d0'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: isDeposit ? '#92400e' : '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
                      TỔNG TIỀN VÉ DU LỊCH
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDeposit ? '#b45309' : '#047857' }}>
                      {formatCurrencyVND(booking.totalAmount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: isDeposit ? '#92400e' : '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
                      HÌNH THỨC
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDeposit ? '#78350f' : '#064e3b' }}>
                      {booking.paymentMethod === 'vietqr' ? '⚡ Chuyển khoản VietQR' : booking.paymentMethod === 'credit_card' ? '💳 Thẻ Quốc Tế' : '💵 Tiền mặt / Cọc'}
                    </div>
                  </div>
                </div>

                {isDeposit && (
                  <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#047857', fontWeight: 700 }}>✓ Đã thanh toán cọc 50%: </span>
                      <strong style={{ color: '#047857', fontSize: '0.92rem' }}>{formatCurrencyVND(booking.paidAmount || Math.round(booking.totalAmount * 0.5))}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>Còn lại cần thanh toán: </span>
                      <strong style={{ color: '#dc2626', fontSize: '0.92rem' }}>{formatCurrencyVND(Math.max(0, booking.totalAmount - (booking.paidAmount || Math.round(booking.totalAmount * 0.5))))}</strong>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: High-Res QR Code Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                <i className="fa-solid fa-qrcode" style={{ marginRight: '0.25rem' }}></i> MÃ QR CHECK-IN
              </div>

              <img
                src={qrSvgUrl}
                alt={`QR Code ${booking.bookingCode}`}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '8px',
                  display: 'block',
                  border: '1px solid #f1f5f9'
                }}
              />

              <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>
                Quét mã để làm thủ tục lên xe &amp; nhận phòng nhanh
              </p>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="no-print"
                style={{
                  marginTop: '0.5rem',
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.72rem',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <i className="fa-solid fa-download"></i> Tải ảnh QR
              </button>
            </div>

          </div>

          {/* Guarantee / Legal Footnote */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: '#f8fafc',
              borderLeft: '3px solid #059669',
              fontSize: '0.76rem',
              color: '#64748b',
              lineHeight: 1.4
            }}
          >
            <strong>Lưu ý quan trọng:</strong> Quý khách vui lòng mang theo CMND/CCCD hoặc Hộ chiếu gốc còn hạn trên 6 tháng. Hotline Điều hành hỗ trợ khẩn cấp 24/7: <strong>1800 646 888</strong>.
          </div>

        </div>

        {/* Bottom Actions Bar (Excluded from print) */}
        <div
          className="no-print"
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '1.25rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
            Được bảo chứng bởi WebTravel Lữ Hành Quốc Tế
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-print"></i>
              In Vé / Lưu PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Print Style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .eticket-printable-container, .eticket-printable-container * {
            visibility: visible;
          }
          .eticket-printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

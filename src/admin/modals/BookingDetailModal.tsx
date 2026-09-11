import React, { useState, useEffect } from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { ETicketModal } from '../../user/components/profile/ETicketModal';
import { BookingPayload, bookingService, PaymentTransactionRecord } from '../../services/bookingService';
import { tourService } from '../../services/tourService';

interface PriceBreakdown {
  priceAdult: number;
  priceChild: number;
  priceToddler: number;
  priceInfant: number;
  singleRoomSurcharge: number;
}

interface BookingDetailModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => Promise<void>;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onUpdateStatus
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showETicket, setShowETicket] = useState(false);
  const [copied, setCopied] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [modalTransactions, setModalTransactions] = useState<PaymentTransactionRecord[]>([]);

  useEffect(() => {
    const code = booking.bookingCode || booking.id;
    if (code) {
      bookingService.getTransactionsByBookingCode(code).then(setModalTransactions).catch(() => {});
    }
  }, [booking.bookingCode, booking.id, booking.status]);

  // Fetch tour price data when modal opens
  useEffect(() => {
    if (!booking.tourId) return;

    const loadPrices = async () => {
      // 1. Try sync cache first (no delay)
      const cached = tourService.getTourByIdSync(booking.tourId!);
      if (cached) {
        const depDate = cached.departureDates?.find(d => d.date === booking.departureDate);
        setPriceBreakdown({
          priceAdult: depDate?.priceAdult || cached.priceAdult,
          priceChild: depDate?.priceChild || cached.priceChild || Math.round(cached.priceAdult * 0.75),
          priceToddler: depDate?.priceToddler || cached.priceToddler || Math.round(cached.priceAdult * 0.5),
          priceInfant: depDate?.priceInfant || cached.priceInfant || 500000,
          singleRoomSurcharge: depDate?.singleRoomSurcharge || cached.singleRoomSurcharge || Math.round(cached.priceAdult * 0.35),
        });
        return;
      }

      // 2. Async fetch if not in cache
      try {
        const tour = await tourService.getTourById(booking.tourId!);
        if (tour) {
          const depDate = tour.departureDates?.find(d => d.date === booking.departureDate);
          setPriceBreakdown({
            priceAdult: depDate?.priceAdult || tour.priceAdult,
            priceChild: depDate?.priceChild || tour.priceChild || Math.round(tour.priceAdult * 0.75),
            priceToddler: depDate?.priceToddler || tour.priceToddler || Math.round(tour.priceAdult * 0.5),
            priceInfant: depDate?.priceInfant || tour.priceInfant || 500000,
            singleRoomSurcharge: depDate?.singleRoomSurcharge || tour.singleRoomSurcharge || Math.round(tour.priceAdult * 0.35),
          });
        }
      } catch (err) {
        console.warn('Could not fetch tour price for breakdown:', err);
      }
    };

    loadPrices();
  }, [booking.tourId, booking.departureDate]);

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

  // Tính số tiền đã thanh toán theo trạng thái
  const effectivePaidAmount = booking.status === 'confirmed'
    ? booking.totalAmount
    : booking.status === 'deposit'
    ? (booking.paidAmount || Math.round(booking.totalAmount * 0.5))
    : (booking.paidAmount || 0);

  const remainingAmount = Math.max(0, booking.totalAmount - effectivePaidAmount);

  // Tính bảng giá chi tiết
  const adults = booking.adultsCount || 1;
  const children = booking.childrenCount || 0;
  const toddlers = booking.toddlersCount || 0;
  const infants = booking.infantsCount || 0;
  const singleRooms = booking.singleRoomsCount || 0;
  const couponDiscount = booking.couponDiscount || 0;

  const totalAdults   = adults * (priceBreakdown?.priceAdult || 0);
  const totalChildren = children * (priceBreakdown?.priceChild || 0);
  const totalToddlers = toddlers * (priceBreakdown?.priceToddler || 0);
  const totalInfants  = infants * (priceBreakdown?.priceInfant || 0);
  const totalSingle   = singleRooms * (priceBreakdown?.singleRoomSurcharge || 0);
  const subtotal      = totalAdults + totalChildren + totalToddlers + totalInfants + totalSingle;

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
    adultsCount: adults,
    childrenCount: children,
    toddlersCount: toddlers,
    infantsCount: infants,
    singleRoomsCount: singleRooms,
    totalAmount: booking.totalAmount,
    paidAmount: effectivePaidAmount,
    couponCode: booking.couponCode,
    couponDiscount: booking.couponDiscount,
    paymentMethod: (booking.paymentMethod as any) || 'vietqr',
    paymentStatus: booking.status === 'deposit' ? 'partially_paid' : booking.status === 'confirmed' ? 'paid' : (booking.paymentStatus || 'pending'),
    bookingStatus: booking.bookingStatus || (booking.status === 'confirmed' ? 'confirmed' : 'pending'),
    createdAt: booking.createdAt
  };

  const isTicketIssued = booking.status === 'confirmed' || booking.status === 'deposit';

  // QR code URL via external API (no extra library needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.bookingCode || booking.id)}&color=064e3b&bgcolor=ffffff`;

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          overflowY: 'auto'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            animation: 'modalSlideUp 0.25s ease-out'
          }}
        >
          {/* ── Header Bar ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              padding: '1.25rem 2rem',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  <i className="fa-solid fa-file-invoice" style={{ marginRight: '0.5rem', opacity: 0.85 }} />
                  Hồ Sơ Đơn Hàng: {booking.bookingCode || booking.id}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                    padding: '0.2rem 0.65rem', borderRadius: '6px',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-copy" /> {copied ? 'Đã sao chép!' : 'Copy'}
                </button>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', opacity: 0.88 }}>
                Ngày tạo: {booking.createdAt}
                {booking.tourId && <span> &nbsp;•&nbsp; Tour ID: {booking.tourId}</span>}
                &nbsp;•&nbsp; Phương thức: {booking.paymentMethod.toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                width: '36px', height: '36px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* ── Modal Body ── */}
          <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Khối 1: Thông Tin Khách Hàng ── */}
            <Section icon="fa-user-check" title="Thông Tin Khách Hàng Đại Diện">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                <InfoCell label="Họ và tên" value={booking.customerName} bold />
                <InfoCell
                  label="Số điện thoại (Zalo)"
                  value={
                    <a href={`tel:${booking.phone}`} style={{ color: '#047857', textDecoration: 'none', fontWeight: 700 }}>
                      <i className="fa-solid fa-phone" style={{ marginRight: '0.35rem' }} />{booking.phone}
                    </a>
                  }
                />
                <InfoCell label="Email nhận vé" value={booking.email || 'Chưa cập nhật'} />
                <InfoCell label="Địa chỉ liên hệ" value={booking.customerAddress || 'Chưa cung cấp'} />
              </div>
              {booking.customerNotes && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.88rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>Ghi chú / Yêu cầu đặc biệt:</strong> {booking.customerNotes}
                </div>
              )}
            </Section>

            {/* ── Khối 2: Chi Tiết Hành Trình ── */}
            <Section icon="fa-plane-departure" title="Chi Tiết Hành Trình & Số Lượng Chỗ">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <InfoCell label="Tên tour đăng ký" value={booking.tourTitle} bold />
                </div>
                <InfoCell
                  label="Ngày khởi hành"
                  value={
                    <span style={{ color: '#047857', fontWeight: 800 }}>
                      <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.35rem' }} />
                      {booking.departureDate}
                    </span>
                  }
                />
                <InfoCell
                  label={`Số khách (${booking.paxCount} pax)`}
                  value={[
                    `${adults} Người lớn`,
                    children > 0 ? `${children} Trẻ em` : '',
                    toddlers > 0 ? `${toddlers} Trẻ nhỏ` : '',
                    infants > 0 ? `${infants} Em bé` : '',
                  ].filter(Boolean).join(' • ')}
                />
                {singleRooms > 0 && (
                  <InfoCell
                    label="Phòng đơn"
                    value={<span style={{ color: '#7c3aed', fontWeight: 700 }}>🛏 {singleRooms} phòng (phụ thu)</span>}
                  />
                )}
              </div>
            </Section>

            {/* ── Khối 3: Bảng Tính Giá Chi Tiết ── */}
            <Section icon="fa-receipt" title="Bảng Tính Giá Chi Tiết">
              {priceBreakdown ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        {['Loại Khách', 'SL', 'Đơn Giá', 'Thành Tiền'].map(h => (
                          <th key={h} style={{ padding: '0.55rem 0.85rem', textAlign: h === 'Loại Khách' ? 'left' : 'right', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <PriceRow label="Người lớn" qty={adults} unit={priceBreakdown.priceAdult} total={totalAdults} />
                      {children > 0 && <PriceRow label="Trẻ em (75%)" qty={children} unit={priceBreakdown.priceChild} total={totalChildren} />}
                      {toddlers > 0 && <PriceRow label="Trẻ nhỏ (50%)" qty={toddlers} unit={priceBreakdown.priceToddler} total={totalToddlers} />}
                      {infants > 0 && <PriceRow label="Em bé" qty={infants} unit={priceBreakdown.priceInfant} total={totalInfants} />}
                      {singleRooms > 0 && <PriceRow label="🛏 Phòng đơn (phụ thu)" qty={singleRooms} unit={priceBreakdown.singleRoomSurcharge} total={totalSingle} highlight />}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                        <td colSpan={3} style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Tổng trước giảm giá:</td>
                        <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrencyVND(subtotal)}</td>
                      </tr>
                      {couponDiscount > 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '0.35rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                            <i className="fa-solid fa-tag" style={{ marginRight: '0.35rem' }} />
                            Giảm giá voucher ({booking.couponCode}):
                          </td>
                          <td style={{ padding: '0.35rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>- {formatCurrencyVND(couponDiscount)}</td>
                        </tr>
                      )}
                      <tr style={{ background: 'linear-gradient(90deg, #ecfdf5, #f0fdf4)' }}>
                        <td colSpan={3} style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 900, color: '#064e3b', fontSize: '0.98rem' }}>Tổng Thanh Toán:</td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 900, color: '#064e3b', fontSize: '1.1rem' }}>{formatCurrencyVND(booking.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />
                  Đang tải thông tin giá...
                </div>
              )}
            </Section>

            {/* ── Khối 4: Voucher / Mã Giảm Giá ── */}
            <Section icon="fa-tag" title="Voucher / Mã Giảm Giá Đã Áp Dụng">
              {booking.couponCode ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Badge mã */}
                  <div style={{
                    background: 'linear-gradient(135deg, #064e3b, #059669)',
                    color: '#fff',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    letterSpacing: '0.08em',
                    boxShadow: '0 4px 12px rgba(4,120,87,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-ticket" />
                    {booking.couponCode}
                  </div>
                  {/* Thông tin giảm giá */}
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    {couponDiscount > 0 ? (
                      <>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669' }}>
                          - {formatCurrencyVND(couponDiscount)}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                          <i className="fa-solid fa-circle-info" style={{ marginRight: '0.3rem' }} />
                          Đã áp dụng • Mỗi tài khoản chỉ được dùng 1 lần
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.9rem', color: '#d97706', fontWeight: 600 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.35rem' }} />
                        Mã đã áp dụng nhưng không có dữ liệu giảm giá
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '0.5rem 1rem', fontWeight: 600 }}>
                    <i className="fa-solid fa-ban" style={{ marginRight: '0.4rem' }} />
                    Không áp dụng mã giảm giá
                  </div>
                </div>
              )}
            </Section>

            {/* ── Khối 5: Đối Soát Tài Chính ── */}
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-money-bill-transfer" style={{ color: '#047857' }} /> Đối Soát Tài Chính & Thanh Toán
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Tổng giá trị đơn:</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>{formatCurrencyVND(booking.totalAmount)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Đã thanh toán / Cọc:</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#047857', marginTop: '0.15rem' }}>{formatCurrencyVND(effectivePaidAmount)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Còn lại cần thu:</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: remainingAmount > 0 ? '#e11d48' : '#047857', marginTop: '0.15rem' }}>
                    {formatCurrencyVND(remainingAmount)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Trạng thái hiện tại:</span>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span style={{
                      padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
                      background: booking.status === 'confirmed' ? '#047857' : booking.status === 'deposit' ? '#d97706' : booking.status === 'pending' ? '#2563eb' : '#dc2626',
                      color: '#fff', display: 'inline-block'
                    }}>
                      {booking.status === 'confirmed' ? '✅ ĐÃ THANH TOÁN 100%'
                        : booking.status === 'deposit' ? '⚡ ĐÃ ĐẶT CỌC 50%'
                        : booking.status === 'pending' ? '⏳ CHỜ THANH TOÁN'
                        : '❌ ĐÃ HỦY ĐƠN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bảng Lịch Sử Giao Dịch Trong Modal */}
              {modalTransactions.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-receipt" />
                    Lịch Sử Giao Dịch Ghi Nhận ({modalTransactions.length})
                  </div>
                  <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #d1fae5', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f0fdf4', borderBottom: '1px solid #d1fae5', textAlign: 'left', color: '#065f46' }}>
                          <th style={{ padding: '0.45rem 0.75rem', fontWeight: 700 }}>Mã GD</th>
                          <th style={{ padding: '0.45rem 0.75rem', fontWeight: 700 }}>Hình Thức</th>
                          <th style={{ padding: '0.45rem 0.75rem', fontWeight: 700 }}>Loại</th>
                          <th style={{ padding: '0.45rem 0.75rem', fontWeight: 700, textAlign: 'right' }}>Số Tiền</th>
                          <th style={{ padding: '0.45rem 0.75rem', fontWeight: 700, textAlign: 'center' }}>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalTransactions.map((tx, i) => (
                          <tr key={tx.id || tx.transactionCode || i} style={{ borderBottom: i < modalTransactions.length - 1 ? '1px solid #f0fdf4' : 'none' }}>
                            <td style={{ padding: '0.45rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{tx.transactionCode}</td>
                            <td style={{ padding: '0.45rem 0.75rem', textTransform: 'uppercase', fontSize: '0.75rem', color: '#475569' }}>{tx.paymentMethod}</td>
                            <td style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', color: '#475569' }}>
                              {tx.paymentType === 'deposit' ? 'Cọc 50%' : tx.paymentType === 'remaining' ? 'Thu còn lại' : '100%'}
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#047857' }}>{formatCurrencyVND(tx.amount)}</td>
                            <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem' }}>✅ Thành công</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── Khối 6: Vé Điện Tử Preview ── */}
            <Section icon="fa-qrcode" title="Vé Điện Tử (E-Ticket Preview)">
              {isTicketIssued ? (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* QR Code */}
                  <div style={{
                    border: '3px solid #047857', borderRadius: '16px', padding: '0.75rem',
                    background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    flexShrink: 0, boxShadow: '0 4px 16px rgba(4,120,87,0.12)'
                  }}>
                    <img
                      src={qrUrl}
                      alt={`QR code for booking ${booking.bookingCode}`}
                      width={120}
                      height={120}
                      style={{ display: 'block', borderRadius: '8px' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {booking.bookingCode || booking.id}
                    </span>
                  </div>
                  {/* Thông tin vé tóm tắt */}
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <TicketLine icon="fa-map-marked-alt" label="Tour" value={booking.tourTitle} />
                    <TicketLine icon="fa-calendar-check" label="Ngày khởi hành" value={booking.departureDate} />
                    <TicketLine icon="fa-user" label="Hành khách đại diện" value={booking.customerName} />
                    <TicketLine icon="fa-users" label="Số lượng" value={`${booking.paxCount} pax (${adults} NL${children ? `, ${children} TE` : ''}${toddlers ? `, ${toddlers} TN` : ''})`} />
                    <TicketLine icon="fa-credit-card" label="Tổng giá trị" value={formatCurrencyVND(booking.totalAmount)} highlight />
                    <div style={{ marginTop: '0.25rem' }}>
                      <span style={{
                        background: booking.status === 'confirmed' ? '#064e3b' : '#d97706',
                        color: '#fff', padding: '0.25rem 0.8rem', borderRadius: '20px',
                        fontSize: '0.78rem', fontWeight: 800
                      }}>
                        {booking.status === 'confirmed' ? '✅ Vé đã xác nhận — Hợp lệ' : '⚡ Vé cọc — Chờ thanh toán đủ'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '0.75rem 1.25rem', fontWeight: 600, border: '1px dashed #cbd5e1' }}>
                    <i className="fa-solid fa-clock" style={{ marginRight: '0.4rem' }} />
                    Vé điện tử chưa phát hành — Đơn hàng chưa xác nhận thanh toán
                  </div>
                </div>
              )}
            </Section>

          </div>

          {/* ── Footer Action Bar ── */}
          <div
            style={{
              padding: '1.1rem 2rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              flexShrink: 0
            }}
          >
            {/* Left: Mở vé đầy đủ */}
            <button
              type="button"
              onClick={() => setShowETicket(true)}
              style={{
                padding: '0.65rem 1.25rem', borderRadius: '10px',
                background: '#ffffff', border: '1.5px solid #047857', color: '#047857',
                fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(4,120,87,0.08)'
              }}
            >
              <i className="fa-solid fa-qrcode" /> Mở Vé Đầy Đủ (E-Ticket)
            </button>

            {/* Right: Thao tác trạng thái */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <ActionButton
                label="Xác Nhận 100%"
                icon="fa-check-double"
                color="#047857"
                disabled={isUpdating || booking.status === 'confirmed'}
                onClick={() => handleStatusClick('confirmed')}
              />
              <ActionButton
                label="Đã Cọc 50%"
                icon="fa-coins"
                color="#d97706"
                disabled={isUpdating || booking.status === 'deposit'}
                onClick={() => handleStatusClick('deposit')}
              />
              <ActionButton
                label="Chờ TT"
                icon="fa-clock"
                color="#2563eb"
                disabled={isUpdating || booking.status === 'pending'}
                onClick={() => handleStatusClick('pending')}
              />
              <ActionButton
                label="Hủy Đơn"
                icon="fa-ban"
                color="#b91c1c"
                bgColor="#fee2e2"
                textColor="#b91c1c"
                disabled={isUpdating || booking.status === 'cancelled'}
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn HỦY đơn tour ${booking.bookingCode || booking.id} không?`)) {
                    handleStatusClick('cancelled');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* E-Ticket Full Modal */}
      {showETicket && (
        <ETicketModal booking={eTicketPayload} onClose={() => setShowETicket(false)} />
      )}
    </>
  );
};

/* ─────────────── Helper Sub-components ─────────────── */

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <i className={`fa-solid ${icon}`} style={{ color: '#047857' }} /> {title}
    </h4>
    {children}
  </div>
);

const InfoCell: React.FC<{ label: string; value: React.ReactNode; bold?: boolean }> = ({ label, value, bold }) => (
  <div>
    <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}:</span>
    <div style={{ fontSize: bold ? '1rem' : '0.92rem', fontWeight: bold ? 800 : 600, color: bold ? '#0f172a' : '#334155', marginTop: '0.15rem' }}>
      {value}
    </div>
  </div>
);

const PriceRow: React.FC<{ label: string; qty: number; unit: number; total: number; highlight?: boolean }> = ({ label, qty, unit, total, highlight }) => (
  <tr style={{ borderBottom: '1px solid #f1f5f9', background: highlight ? '#faf5ff' : 'transparent' }}>
    <td style={{ padding: '0.5rem 0.85rem', color: highlight ? '#7c3aed' : '#334155', fontWeight: highlight ? 700 : 500 }}>{label}</td>
    <td style={{ padding: '0.5rem 0.85rem', textAlign: 'right', color: '#64748b' }}>{qty}</td>
    <td style={{ padding: '0.5rem 0.85rem', textAlign: 'right', color: '#64748b' }}>{formatCurrencyVND(unit)}</td>
    <td style={{ padding: '0.5rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrencyVND(total)}</td>
  </tr>
);

const TicketLine: React.FC<{ icon: string; label: string; value: string; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
    <i className={`fa-solid ${icon}`} style={{ color: '#047857', width: '16px', fontSize: '0.8rem', flexShrink: 0 }} />
    <span style={{ fontSize: '0.78rem', color: '#64748b', minWidth: '110px' }}>{label}:</span>
    <span style={{ fontSize: '0.88rem', fontWeight: highlight ? 800 : 600, color: highlight ? '#047857' : '#1e293b' }}>{value}</span>
  </div>
);

const ActionButton: React.FC<{
  label: string; icon: string; color: string;
  bgColor?: string; textColor?: string;
  disabled: boolean; onClick: () => void;
}> = ({ label, icon, color, bgColor, textColor, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    style={{
      padding: '0.6rem 1.1rem', borderRadius: '10px',
      background: bgColor || color,
      border: bgColor ? `1px solid ${color}` : 'none',
      color: textColor || '#ffffff',
      fontSize: '0.86rem', fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      transition: 'opacity 0.15s'
    }}
  >
    <i className={`fa-solid ${icon}`} /> {label}
  </button>
);

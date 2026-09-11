import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { tourService } from '../../services/tourService';
import { bookingService, BookingPayload, getBookingUiStatus, PaymentTransactionRecord } from '../../services/bookingService';
import { couponService } from '../../services/couponService';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { ETicketModal } from '../../user/components/profile/ETicketModal';

interface PriceBreakdown {
  priceAdult: number;
  priceChild: number;
  priceToddler: number;
  priceInfant: number;
  singleRoomSurcharge: number;
}

// Helper formatters and badges for transactions
const formatTxDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const getMethodBadge = (method?: string) => {
  switch (method?.toLowerCase()) {
    case 'vietqr':
      return { label: 'VietQR', icon: 'fa-qrcode', bg: '#eff6ff', color: '#1d4ed8' };
    case 'momo':
      return { label: 'Ví MoMo', icon: 'fa-wallet', bg: '#fdf2f8', color: '#be185d' };
    case 'credit_card':
      return { label: 'Thẻ Quốc Tế', icon: 'fa-credit-card', bg: '#f5f3ff', color: '#6d28d9' };
    case 'cash':
      return { label: 'Tiền Mặt', icon: 'fa-money-bill-1-wave', bg: '#f0fdf4', color: '#15803d' };
    case 'bank_transfer':
      return { label: 'Chuyển Khoản', icon: 'fa-building-columns', bg: '#f8fafc', color: '#334155' };
    default:
      return { label: method?.toUpperCase() || 'KHÁC', icon: 'fa-receipt', bg: '#f1f5f9', color: '#475569' };
  }
};

const getTypeBadge = (type?: string) => {
  switch (type) {
    case 'deposit':
      return { label: 'Đặt cọc 50%', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
    case 'remaining':
      return { label: 'Thu còn lại', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' };
    case 'full':
      return { label: 'Thanh toán 100%', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    case 'refund':
      return { label: 'Hoàn tiền', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    default:
      return { label: 'Thanh toán', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
  }
};

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [fetchedCouponDiscount, setFetchedCouponDiscount] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showETicketModal, setShowETicketModal] = useState<boolean>(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState<boolean>(false);

  // Transactions State
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [copiedTxCode, setCopiedTxCode] = useState<string | null>(null);

  const handleCopyTx = (txCode: string) => {
    navigator.clipboard.writeText(txCode);
    setCopiedTxCode(txCode);
    setTimeout(() => setCopiedTxCode(null), 2000);
  };

  const fetchTransactions = useCallback(async (codeOrId: string) => {
    if (!codeOrId) return;
    setTxLoading(true);
    try {
      const records = await bookingService.getTransactionsByBookingCode(codeOrId);
      setTransactions(records);
    } catch (err) {
      console.warn('Error fetching payment transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  // 1. Fetch Booking Record by ID or Booking Code
  const loadBooking = useCallback(async () => {
    if (!id) {
      setErrorMsg('Không tìm thấy mã đơn hàng hợp lệ trên URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let foundRecord: BookingRecord | null = null;

      // 1. Try Supabase
      if (isSupabaseConfigured && supabase) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('bookings').select('*, tour:tours(title)');
        if (isUuid) {
          query = query.or(`id.eq.${id},booking_code.eq.${id}`);
        } else {
          query = query.eq('booking_code', id);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          const adults = Number(data.adults_count || data.adult_count) || 1;
          const children = Number(data.children_count || data.child_count) || 0;
          const toddlers = Number(data.toddlers_count) || 0;
          const infants = Number(data.infants_count || data.infant_count) || 0;
          const totalPax = adults + children + toddlers + infants;
          const totalAmt = Number(data.total_amount) || 0;

          const uiStatus = getBookingUiStatus({
            bookingStatus: data.booking_status,
            paymentStatus: data.payment_status,
            paidAmount: data.paid_amount,
            totalAmount: data.total_amount
          });

          const paidAmt = Number(data.paid_amount) || (uiStatus === 'confirmed' ? totalAmt : uiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0);

          foundRecord = {
            id: data.booking_code || data.id,
            bookingCode: data.booking_code || data.id,
            userId: data.user_id,
            customerName: data.customer_name || 'Khách hàng',
            phone: data.customer_phone || '',
            email: data.customer_email || '',
            customerAddress: data.customer_address || '',
            customerNotes: data.customer_notes || '',
            tourId: data.tour_id,
            tourTitle: data.tour_title || data.tour?.title || data.tour_id,
            departureDate: data.departure_date,
            adultsCount: adults,
            childrenCount: children,
            toddlersCount: toddlers,
            infantsCount: infants,
            singleRoomsCount: Number(data.single_rooms_count) || 0,
            paxCount: totalPax,
            totalAmount: totalAmt,
            paidAmount: paidAmt,
            couponCode: data.coupon_code || '',
            couponDiscount: Number(data.coupon_discount) || 0,
            paymentMethod: data.payment_method || 'vietqr',
            paymentStatus: data.payment_status || 'pending',
            bookingStatus: data.booking_status || 'pending',
            status: uiStatus,
            createdAt: data.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : 'Mới'
          };
        }
      }

      // 2. Fallback to LocalStorage if not in Supabase
      if (!foundRecord) {
        try {
          const localList: BookingPayload[] = JSON.parse(localStorage.getItem('webtravel_local_bookings') || '[]');
          const cleanId = id.trim().toUpperCase();
          const match = localList.find(b => (b.bookingCode && b.bookingCode.toUpperCase() === cleanId) || (b.id && b.id === id));
          if (match) {
            const adults = match.adultsCount || 1;
            const children = match.childrenCount || 0;
            const toddlers = match.toddlersCount || 0;
            const infants = match.infantsCount || 0;
            const totalPax = adults + children + toddlers + infants;
            const totalAmt = match.totalAmount || 0;

            const uiStatus = getBookingUiStatus({
              bookingStatus: match.bookingStatus,
              paymentStatus: match.paymentStatus,
              paidAmount: match.paidAmount,
              totalAmount: match.totalAmount
            });

            foundRecord = {
              id: match.bookingCode || match.id || id,
              bookingCode: match.bookingCode || match.id || id,
              userId: match.userId,
              customerName: match.customerName,
              phone: match.customerPhone,
              email: match.customerEmail,
              customerAddress: match.customerAddress,
              customerNotes: match.customerNotes,
              tourId: match.tourId,
              tourTitle: match.tourTitle,
              departureDate: match.departureDate,
              adultsCount: adults,
              childrenCount: children,
              toddlersCount: toddlers,
              infantsCount: infants,
              singleRoomsCount: match.singleRoomsCount || 0,
              paxCount: totalPax,
              totalAmount: totalAmt,
              paidAmount: match.paidAmount || (uiStatus === 'confirmed' ? totalAmt : uiStatus === 'deposit' ? Math.round(totalAmt * 0.5) : 0),
              couponCode: match.couponCode,
              couponDiscount: match.couponDiscount || 0,
              paymentMethod: match.paymentMethod || 'vietqr',
              paymentStatus: match.paymentStatus || 'pending',
              bookingStatus: match.bookingStatus || 'pending',
              status: uiStatus,
              createdAt: match.createdAt ? new Date(match.createdAt).toLocaleString('vi-VN') : 'Mới'
            };
          }
        } catch (e) {
          console.warn('Error reading local bookings:', e);
        }
      }

      if (foundRecord) {
        setBooking(foundRecord);
        fetchTransactions(foundRecord.bookingCode || foundRecord.id);
      } else {
        setErrorMsg(`Không tìm thấy đơn hàng với mã "${id}". Vui lòng kiểm tra lại đường dẫn.`);
      }
    } catch (err: any) {
      console.error('Error loading booking detail:', err);
      setErrorMsg('Đã xảy ra lỗi khi tải hồ sơ đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // 2. Load Tour Price Breakdown once booking is loaded
  useEffect(() => {
    if (!booking?.tourId) return;

    const loadTourPrices = async () => {
      // Try sync cache first
      const cached = tourService.getTourByIdSync(booking.tourId!);
      if (cached) {
        const depDate = cached.departureDates?.find(d => d.date === booking.departureDate);
        setPriceBreakdown({
          priceAdult: depDate?.priceAdult || cached.priceAdult,
          priceChild: depDate?.priceChild || cached.priceChild || Math.round(cached.priceAdult * 0.75),
          priceToddler: depDate?.priceToddler || cached.priceToddler || Math.round(cached.priceAdult * 0.5),
          priceInfant: depDate?.priceInfant || cached.priceInfant || 500000,
          singleRoomSurcharge: depDate?.singleRoomSurcharge || cached.singleRoomSurcharge || Math.round(cached.priceAdult * 0.35)
        });
        return;
      }

      // Async fetch
      try {
        const tour = await tourService.getTourById(booking.tourId!);
        if (tour) {
          const depDate = tour.departureDates?.find(d => d.date === booking.departureDate);
          setPriceBreakdown({
            priceAdult: depDate?.priceAdult || tour.priceAdult,
            priceChild: depDate?.priceChild || tour.priceChild || Math.round(tour.priceAdult * 0.75),
            priceToddler: depDate?.priceToddler || tour.priceToddler || Math.round(tour.priceAdult * 0.5),
            priceInfant: depDate?.priceInfant || tour.priceInfant || 500000,
            singleRoomSurcharge: depDate?.singleRoomSurcharge || tour.singleRoomSurcharge || Math.round(tour.priceAdult * 0.35)
          });
        }
      } catch (e) {
        console.warn('Could not load tour price for breakdown:', e);
      }
    };

    loadTourPrices();
  }, [booking?.tourId, booking?.departureDate]);

  // Load actual coupon discount from couponService if booking has couponCode
  useEffect(() => {
    if (!booking?.couponCode) return;

    const checkCoupon = async () => {
      try {
        const orderEst = (booking.totalAmount || 0) + 2000000;
        const res = await couponService.validateCoupon(booking.couponCode!, orderEst);
        if (res.valid && res.discountAmount > 0) {
          setFetchedCouponDiscount(res.discountAmount);
        }
      } catch (e) {
        console.warn('Could not validate coupon discount value:', e);
      }
    };

    checkCoupon();
  }, [booking?.couponCode, booking?.totalAmount]);

  // Flash feedback auto dismiss
  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  // Handle Copy Code
  const handleCopyCode = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.bookingCode || booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Status Change
  const handleStatusChange = async (newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => {
    if (!booking) return;
    setIsUpdating(true);
    try {
      const res = await bookingService.updateBookingAdminStatus(booking.bookingCode || booking.id, newStatus);
      if (res.success) {
        const effectivePaid = newStatus === 'confirmed'
          ? booking.totalAmount
          : newStatus === 'deposit'
          ? Math.round(booking.totalAmount * 0.5)
          : 0;

        setBooking(prev => prev ? {
          ...prev,
          status: newStatus,
          paymentStatus: newStatus === 'confirmed' ? 'paid' : newStatus === 'deposit' ? 'partially_paid' : newStatus === 'cancelled' ? 'refunded' : 'pending',
          bookingStatus: newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'pending',
          paidAmount: effectivePaid
        } : null);

        // Tự động tải lại lịch sử giao dịch để hiển thị ngay dòng giao dịch mới
        fetchTransactions(booking.bookingCode || booking.id);

        const statusNames: Record<string, string> = {
          confirmed: 'ĐÃ THANH TOÁN 100% (Hoàn tất)',
          deposit: 'ĐÃ ĐẶT CỌC 50%',
          pending: 'CHỜ THANH TOÁN',
          cancelled: 'ĐÃ HỦY ĐƠN'
        };
        setActionFeedback({
          type: 'success',
          message: `Đã cập nhật trạng thái đơn sang: ${statusNames[newStatus]}`
        });
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'Lỗi khi cập nhật trạng thái.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Lỗi hệ thống khi đổi trạng thái.' });
    } finally {
      setIsUpdating(false);
      setConfirmCancelOpen(false);
    }
  };

  // Calculated values
  const effectivePaidAmount = booking?.status === 'confirmed'
    ? (booking?.totalAmount || 0)
    : booking?.status === 'deposit'
    ? (booking?.paidAmount || Math.round((booking?.totalAmount || 0) * 0.5))
    : (booking?.paidAmount || 0);

  const remainingAmount = Math.max(0, (booking?.totalAmount || 0) - effectivePaidAmount);
  const paymentPercentage = (booking?.totalAmount || 0) > 0
    ? Math.min(100, Math.round((effectivePaidAmount / booking!.totalAmount) * 100))
    : 0;

  // Price Calculation Breakdown
  const adults = booking?.adultsCount || 1;
  const children = booking?.childrenCount || 0;
  const toddlers = booking?.toddlersCount || 0;
  const infants = booking?.infantsCount || 0;
  const singleRooms = booking?.singleRoomsCount || 0;

  const totalAdults = adults * (priceBreakdown?.priceAdult || 0);
  const totalChildren = children * (priceBreakdown?.priceChild || 0);
  const totalToddlers = toddlers * (priceBreakdown?.priceToddler || 0);
  const totalInfants = infants * (priceBreakdown?.priceInfant || 0);
  const totalSingle = singleRooms * (priceBreakdown?.singleRoomSurcharge || 0);

  const rawSubtotal = totalAdults + totalChildren + totalToddlers + totalInfants + totalSingle;

  // Tính số tiền voucher giảm giá thực tế (chống hiển thị -0đ khi DB lưu 0/null)
  // Ưu tiên:
  // 1. booking.couponDiscount nếu > 0
  // 2. Chênh lệch rawSubtotal - totalAmount (nếu rawSubtotal > totalAmount và có couponCode)
  // 3. Giá trị fetch từ couponService
  const subtotalDiff = (booking?.couponCode && rawSubtotal > (booking?.totalAmount || 0))
    ? (rawSubtotal - booking.totalAmount)
    : 0;

  const effectiveCouponDiscount = Math.max(
    Number(booking?.couponDiscount) || 0,
    subtotalDiff,
    fetchedCouponDiscount
  );

  // Subtotal luôn đảm bảo tính toàn vẹn: subtotal = totalAmount + effectiveCouponDiscount
  const subtotal = rawSubtotal > 0
    ? rawSubtotal
    : (booking?.totalAmount || 0) + effectiveCouponDiscount;

  // ETicket Payload
  const eTicketPayload: BookingPayload | null = booking ? {
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
    couponDiscount: effectiveCouponDiscount,
    paymentMethod: (booking.paymentMethod as any) || 'vietqr',
    paymentStatus: booking.status === 'deposit' ? 'partially_paid' : booking.status === 'confirmed' ? 'paid' : 'pending',
    bookingStatus: booking.bookingStatus || (booking.status === 'confirmed' ? 'confirmed' : 'pending'),
    createdAt: booking.createdAt
  } : null;

  const qrUrl = booking
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(booking.bookingCode || booking.id)}&color=064e3b&bgcolor=ffffff`
    : '';

  // ── Render Loading ──
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: 'var(--font-body, "Montserrat", sans-serif)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#047857',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
          Đang tải hồ sơ đơn hàng #{id}...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render Error ──
  if (errorMsg || !booking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 1.25rem'
          }}>
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Không Tìm Thấy Đơn Hàng
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {errorMsg}
          </p>
          <Link
            to="/admin?tab=bookings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#047857',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            <i className="fa-solid fa-arrow-left" /> Quay Lại Quản Lý Đơn Hàng
          </Link>
        </div>
      </div>
    );
  }

  // ── Render Main Dedicated Page ──
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ── 1. Top Enterprise Header Bar ── */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.9rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1500px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Navigation & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              to="/admin?tab=bookings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              title="Quay về danh sách đơn hàng"
            >
              <i className="fa-solid fa-arrow-left" />
              <span>Quản lý đơn</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#64748b' }}>
              <span>Admin Portal</span>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem', opacity: 0.6 }} />
              <Link to="/admin?tab=bookings" style={{ color: '#64748b', textDecoration: 'none' }}>Đơn hàng</Link>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem', opacity: 0.6 }} />
              <strong style={{ color: '#047857', fontWeight: 700 }}>#{booking.bookingCode || booking.id}</strong>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ color: copied ? '#047857' : undefined }} />
              <span>{copied ? 'Đã chép mã!' : 'Copy Mã Đơn'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-print" />
              <span>In Phiếu</span>
            </button>

            {/* View E-Ticket Modal Button */}
            <button
              type="button"
              onClick={() => setShowETicketModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)'
              }}
            >
              <i className="fa-solid fa-qrcode" />
              <span>Xem Vé E-Ticket</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Action Flash Feedback Message ── */}
      {actionFeedback && (
        <div style={{
          background: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
          borderBottom: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: actionFeedback.type === 'success' ? '#047857' : '#b91c1c',
          padding: '0.75rem 2rem',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <i className={`fa-solid ${actionFeedback.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* ── 2. Main Workspace Body ── */}
      <main style={{
        flex: 1,
        maxWidth: '1500px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem'
      }}>

        {/* ── Title Banner & Status Highlight ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem 2rem',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                Hồ Sơ Đơn Hàng #{booking.bookingCode || booking.id}
              </h1>

              {/* Status Badge */}
              <span style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                background:
                  booking.status === 'confirmed' ? '#dcfce7' :
                  booking.status === 'deposit' ? '#e0f2fe' :
                  booking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                color:
                  booking.status === 'confirmed' ? '#15803d' :
                  booking.status === 'deposit' ? '#0369a1' :
                  booking.status === 'pending' ? '#b45309' : '#b91c1c',
                border: `1px solid ${
                  booking.status === 'confirmed' ? '#bbf7d0' :
                  booking.status === 'deposit' ? '#bae6fd' :
                  booking.status === 'pending' ? '#fde68a' : '#fecaca'
                }`
              }}>
                <i className={`fa-solid ${
                  booking.status === 'confirmed' ? 'fa-circle-check' :
                  booking.status === 'deposit' ? 'fa-circle-dollar-to-slot' :
                  booking.status === 'pending' ? 'fa-clock' : 'fa-circle-xmark'
                }`} style={{ marginRight: '0.35rem' }} />
                {booking.status === 'confirmed' ? 'Đã Thanh Toán 100%' :
                 booking.status === 'deposit' ? 'Đã Đặt Cọc 50%' :
                 booking.status === 'pending' ? 'Chờ Xác Nhận' : 'Đã Hủy Đơn'}
              </span>
            </div>

            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              Thời gian khởi tạo: <strong style={{ color: '#334155' }}>{booking.createdAt}</strong>
              {booking.paymentMethod && (
                <> &bull; Phương thức: <strong style={{ color: '#334155', textTransform: 'uppercase' }}>{booking.paymentMethod}</strong></>
              )}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tổng Giá Trị</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>{formatCurrencyVND(booking.totalAmount)}</div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Thực Thu</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>{formatCurrencyVND(effectivePaidAmount)}</div>
            </div>

            <div style={{
              background: remainingAmount > 0 ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${remainingAmount > 0 ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.74rem', color: remainingAmount > 0 ? '#b45309' : '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Còn Lại</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: remainingAmount > 0 ? '#d97706' : '#16a34a' }}>
                {formatCurrencyVND(remainingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-Column Responsive Layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 390px',
          gap: '1.75rem',
          alignItems: 'start'
        }}>

          {/* ══════════════════════════════════════════
              LEFT COLUMN: MAIN CONTENT (65%)
             ══════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* 1. Order Progress Stepper (5 Separate Stages) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem 2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <i className="fa-solid fa-timeline" style={{ color: '#047857', marginRight: '0.5rem' }} />
                Tiến Trình Đơn Hàng
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {/* Stepper Line Background */}
                <div style={{
                  position: 'absolute',
                  top: '19px',
                  left: '40px',
                  right: '40px',
                  height: '3px',
                  background: '#e2e8f0',
                  zIndex: 1
                }} />

                {/* Progress Active Line */}
                <div style={{
                  position: 'absolute',
                  top: '19px',
                  left: '40px',
                  width:
                    booking.status === 'confirmed' ? '75%' :
                    booking.status === 'deposit' ? '50%' :
                    booking.status === 'pending' ? '25%' : '0%',
                  height: '3px',
                  background:
                    booking.status === 'cancelled' ? '#ef4444' :
                    booking.status === 'confirmed' ? '#047857' :
                    booking.status === 'deposit' ? '#0284c7' : '#f59e0b',
                  zIndex: 2,
                  transition: 'width 0.4s ease, background 0.4s ease'
                }} />

                {/* 5 Distinct Steps */}
                {[
                  {
                    id: 'created',
                    label: 'Tạo Đơn',
                    sublabel: 'Đã tiếp nhận',
                    icon: 'fa-file-lines',
                    isDone: booking.status !== 'cancelled',
                    isCurrent: false
                  },
                  {
                    id: 'pending',
                    label: 'Chờ Xử Lý',
                    sublabel: booking.status === 'pending' ? 'Đang duyệt đơn' : 'Đã duyệt qua',
                    icon: 'fa-clock',
                    isDone: booking.status === 'deposit' || booking.status === 'confirmed',
                    isCurrent: booking.status === 'pending'
                  },
                  {
                    id: 'deposit',
                    label: 'Đã Đặt Cọc',
                    sublabel: 'Cọc 50% giữ chỗ',
                    icon: 'fa-circle-dollar-to-slot',
                    isDone: booking.status === 'confirmed',
                    isCurrent: booking.status === 'deposit'
                  },
                  {
                    id: 'confirmed',
                    label: 'Đã Tất Toán',
                    sublabel: 'Thanh toán 100%',
                    icon: 'fa-shield-check',
                    isDone: booking.status === 'confirmed',
                    isCurrent: booking.status === 'confirmed'
                  },
                  {
                    id: 'departure',
                    label: 'Khởi Hành',
                    sublabel: booking.departureDate || 'Ngày đi',
                    icon: 'fa-plane-departure',
                    isDone: false,
                    isCurrent: false
                  }
                ].map((step, idx) => {
                  const circleBg = step.isDone
                    ? '#047857'
                    : step.isCurrent
                    ? (step.id === 'pending' ? '#fef3c7' : step.id === 'deposit' ? '#e0f2fe' : '#dcfce7')
                    : '#ffffff';

                  const circleBorder = step.isDone
                    ? '#047857'
                    : step.isCurrent
                    ? (step.id === 'pending' ? '#f59e0b' : step.id === 'deposit' ? '#0284c7' : '#15803d')
                    : '#cbd5e1';

                  const iconColor = step.isDone
                    ? '#ffffff'
                    : step.isCurrent
                    ? (step.id === 'pending' ? '#d97706' : step.id === 'deposit' ? '#0284c7' : '#15803d')
                    : '#94a3b8';

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 3, position: 'relative', minWidth: '85px', textAlign: 'center' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: circleBg,
                        border: `2px solid ${circleBorder}`,
                        color: iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        boxShadow: step.isCurrent
                          ? `0 0 0 4px ${step.id === 'pending' ? 'rgba(245, 158, 11, 0.25)' : step.id === 'deposit' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`
                          : '0 2px 6px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s ease'
                      }}>
                        <i className={`fa-solid ${step.isDone ? 'fa-check' : step.icon}`} />
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: step.isDone ? '#0f172a' : step.isCurrent ? iconColor : '#94a3b8',
                        whiteSpace: 'nowrap'
                      }}>
                        {step.label}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: step.isCurrent ? iconColor : '#64748b',
                        whiteSpace: 'nowrap'
                      }}>
                        {step.sublabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Tour & Trip Details Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <i className="fa-solid fa-map-location-dot" style={{ color: '#047857', marginRight: '0.5rem' }} />
                  Thông Tin Tour & Chuyến Đi
                </h3>

                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  Mã Tour: {booking.tourId || 'N/A'}
                </span>
              </div>

              {/* Tour Title Header */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #a7f3d0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064e3b', marginBottom: '0.35rem' }}>
                  {booking.tourTitle}
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.84rem', color: '#047857', fontWeight: 600 }}>
                  <span><i className="fa-regular fa-calendar-check" style={{ marginRight: '0.35rem' }} /> Ngày Khởi Hành: <strong>{booking.departureDate}</strong></span>
                  <span><i className="fa-solid fa-users" style={{ marginRight: '0.35rem' }} /> Tổng Số Khách: <strong>{booking.paxCount} người</strong></span>
                  {booking.singleRoomsCount ? (
                    <span><i className="fa-solid fa-bed" style={{ marginRight: '0.35rem' }} /> Phòng đơn: <strong>{booking.singleRoomsCount} phòng</strong></span>
                  ) : null}
                </div>
              </div>

              {/* Trip Grid Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Người Lớn</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{booking.adultsCount} khách</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trẻ Em (5 - 11 tuổi)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{booking.childrenCount} khách</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trẻ Nhỏ (2 - 4 tuổi)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{booking.toddlersCount} khách</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Em Bé (Dưới 2 tuổi)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{booking.infantsCount} khách</div>
                </div>
              </div>
            </div>

            {/* 3. Comprehensive Price Breakdown Table & Direct Voucher Row (User Request Highlight) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <i className="fa-solid fa-receipt" style={{ color: '#047857', marginRight: '0.5rem' }} />
                  Bảng Cơ Cấu Giá & Khấu Trừ Ưu Đãi
                </h3>

                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Bảng giá cập nhật theo ngày khởi hành
                </span>
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#334155' }}>Hạng Mục Vé / Dịch Vụ</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#334155', textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#334155', textAlign: 'right' }}>Đơn Giá</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#334155', textAlign: 'right' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Người lớn */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                        <i className="fa-solid fa-user" style={{ color: '#047857', marginRight: '0.5rem', width: '16px' }} />
                        Người lớn (Từ 12 tuổi)
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>{adults}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                        {priceBreakdown?.priceAdult ? formatCurrencyVND(priceBreakdown.priceAdult) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {priceBreakdown?.priceAdult ? formatCurrencyVND(totalAdults) : '—'}
                      </td>
                    </tr>

                    {/* Trẻ em */}
                    {children > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                          <i className="fa-solid fa-child" style={{ color: '#0284c7', marginRight: '0.5rem', width: '16px' }} />
                          Trẻ em (5 - 11 tuổi, 75% vé)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>{children}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          {priceBreakdown?.priceChild ? formatCurrencyVND(priceBreakdown.priceChild) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {priceBreakdown?.priceChild ? formatCurrencyVND(totalChildren) : '—'}
                        </td>
                      </tr>
                    )}

                    {/* Trẻ nhỏ */}
                    {toddlers > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                          <i className="fa-solid fa-baby" style={{ color: '#d97706', marginRight: '0.5rem', width: '16px' }} />
                          Trẻ nhỏ (2 - 4 tuổi, 50% vé)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>{toddlers}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          {priceBreakdown?.priceToddler ? formatCurrencyVND(priceBreakdown.priceToddler) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {priceBreakdown?.priceToddler ? formatCurrencyVND(totalToddlers) : '—'}
                        </td>
                      </tr>
                    )}

                    {/* Em bé */}
                    {infants > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                          <i className="fa-solid fa-child-reaching" style={{ color: '#8b5cf6', marginRight: '0.5rem', width: '16px' }} />
                          Em bé (Dưới 2 tuổi)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>{infants}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          {priceBreakdown?.priceInfant ? formatCurrencyVND(priceBreakdown.priceInfant) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {priceBreakdown?.priceInfant ? formatCurrencyVND(totalInfants) : '—'}
                        </td>
                      </tr>
                    )}

                    {/* Phụ thu phòng đơn */}
                    {singleRooms > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 600 }}>
                          <i className="fa-solid fa-bed" style={{ color: '#ec4899', marginRight: '0.5rem', width: '16px' }} />
                          Phụ thu phòng đơn
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>{singleRooms}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          {priceBreakdown?.singleRoomSurcharge ? formatCurrencyVND(priceBreakdown.singleRoomSurcharge) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {priceBreakdown?.singleRoomSurcharge ? formatCurrencyVND(totalSingle) : '—'}
                        </td>
                      </tr>
                    )}

                    {/* Dòng Tạm tính Subtotal */}
                    {subtotal > 0 && (
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <td colSpan={3} style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>
                          Tạm Tính Vé & Dịch Vụ:
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#334155' }}>
                          {formatCurrencyVND(subtotal)}
                        </td>
                      </tr>
                    )}

                    {/* DÒNG KHẤU TRỪ VOUCHER TRỰC TIẾP TRONG BẢNG GIÁ (USER REQUEST) */}
                    {effectiveCouponDiscount > 0 || booking.couponCode ? (
                      <tr style={{
                        background: '#f0fdf4',
                        borderBottom: '2px solid #bbf7d0'
                      }}>
                        <td colSpan={3} style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.25rem 0.65rem',
                              background: '#15803d',
                              color: '#ffffff',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              <i className="fa-solid fa-ticket" /> VOUCHER: {booking.couponCode?.toUpperCase() || 'KHUYẾN MÃI'}
                            </span>
                            <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.85rem' }}>
                              Đã khấu trừ trực tiếp vào giá tour
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '1.05rem' }}>
                          - {formatCurrencyVND(effectiveCouponDiscount)}
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                        <td colSpan={3} style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem', textAlign: 'right' }}>
                          Mã ưu đãi / Voucher:
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>
                          Không áp dụng
                        </td>
                      </tr>
                    )}

                    {/* Dòng Tổng Thanh Toán Cuối Cùng */}
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={3} style={{ padding: '1rem 1rem', fontWeight: 800, color: '#0f172a', textAlign: 'right', fontSize: '1.05rem' }}>
                        TỔNG CỘNG THANH TOÁN:
                      </td>
                      <td style={{ padding: '1rem 1rem', textAlign: 'right', fontWeight: 900, color: '#047857', fontSize: '1.35rem' }}>
                        {formatCurrencyVND(booking.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Customer Information & Service Notes Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <i className="fa-solid fa-address-card" style={{ color: '#047857', marginRight: '0.5rem' }} />
                Thông Tin Khách Hàng & Ghi Chú Đón
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Họ tên */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Họ Tên Khách Đặt</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    <i className="fa-regular fa-user" style={{ color: '#047857', marginRight: '0.45rem' }} />
                    {booking.customerName}
                  </div>
                </div>

                {/* Số điện thoại */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Số Điện Thoại</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <a href={`tel:${booking.phone}`} style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', textDecoration: 'none' }}>
                      <i className="fa-solid fa-phone" style={{ marginRight: '0.45rem' }} />
                      {booking.phone || 'Chưa cập nhật'}
                    </a>
                    {booking.phone && (
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(booking.phone); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        style={{ border: 'none', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer' }}
                        title="Copy SĐT"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Địa Chỉ Email</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                    <a href={`mailto:${booking.email}`} style={{ color: '#047857', textDecoration: 'none', wordBreak: 'break-all' }}>
                      <i className="fa-regular fa-envelope" style={{ marginRight: '0.45rem' }} />
                      {booking.email || 'Chưa có email'}
                    </a>
                  </div>
                </div>

                {/* Địa chỉ */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Địa Chỉ Khách Hàng</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', marginRight: '0.45rem' }} />
                    {booking.customerAddress || 'Không có thông tin địa chỉ'}
                  </div>
                </div>
              </div>

              {/* Special Customer Notes Callout */}
              <div style={{
                background: booking.customerNotes ? '#fffbeb' : '#f8fafc',
                border: `1.5px dashed ${booking.customerNotes ? '#f59e0b' : '#cbd5e1'}`,
                borderRadius: '14px',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ fontSize: '0.78rem', color: booking.customerNotes ? '#b45309' : '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <i className="fa-regular fa-comment-dots" style={{ marginRight: '0.4rem' }} />
                  Ghi Chú Đặc Biệt Của Khách Hàng:
                </div>
                <div style={{ fontSize: '0.92rem', color: '#1e293b', fontStyle: booking.customerNotes ? 'normal' : 'italic' }}>
                  {booking.customerNotes || 'Khách hàng không để lại ghi chú hay yêu cầu đón đặc biệt nào cho chuyến đi.'}
                </div>
              </div>
            </div>

            {/* 5. Lịch Sử Giao Dịch & Thanh Toán (Payment Transactions History) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="fa-solid fa-credit-card" style={{ color: '#047857' }} />
                    Lịch Sử Giao Dịch & Thanh Toán
                  </h3>

                  <span style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: transactions.length > 0 ? '#ecfdf5' : '#f1f5f9',
                    color: transactions.length > 0 ? '#047857' : '#64748b',
                    border: `1px solid ${transactions.length > 0 ? '#a7f3d0' : '#e2e8f0'}`
                  }}>
                    {transactions.length} giao dịch
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => booking && fetchTransactions(booking.bookingCode || booking.id)}
                  disabled={txLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: txLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Làm mới lịch sử giao dịch"
                >
                  <i className={`fa-solid fa-arrows-rotate ${txLoading ? 'fa-spin' : ''}`} style={{ color: '#047857' }} />
                  {txLoading ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>

              {/* Transactions Table or Empty State */}
              {txLoading && transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#047857', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Đang kiểm tra lịch sử giao dịch...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div style={{
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '14px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: '#f8fafc'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.85rem',
                    color: '#94a3b8',
                    fontSize: '1.35rem'
                  }}>
                    <i className="fa-solid fa-receipt" />
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                    Chưa Có Bản Ghi Giao Dịch
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', maxWidth: '440px', display: 'inline-block', lineHeight: 1.5 }}>
                    Lịch sử sẽ tự động ghi nhận khi khách chuyển khoản qua VietQR hoặc khi Quản trị viên cập nhật trạng thái "Đã cọc 50%" / "Đã thanh toán 100%".
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569', width: '140px' }}>Thời Gian</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569' }}>Mã Giao Dịch</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569' }}>Loại GD</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569' }}>Hình Thức</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Số Tiền</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#475569', textAlign: 'center' }}>Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx, idx) => {
                            const typeBadge = getTypeBadge(tx.paymentType);
                            const methodBadge = getMethodBadge(tx.paymentMethod);
                            const isRefund = tx.paymentType === 'refund' || tx.status === 'refunded';

                            return (
                              <tr key={tx.id || tx.transactionCode || idx} style={{ borderBottom: idx < transactions.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                                {/* Thời gian */}
                                <td style={{ padding: '0.75rem 1rem', color: '#475569', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{formatTxDate(tx.paidAt || tx.createdAt)}</div>
                                </td>

                                {/* Mã giao dịch */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <code style={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.78rem',
                                      background: '#f1f5f9',
                                      padding: '0.2rem 0.45rem',
                                      borderRadius: '4px',
                                      color: '#0f172a',
                                      fontWeight: 700
                                    }}>
                                      {tx.transactionCode}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyTx(tx.transactionCode)}
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: copiedTxCode === tx.transactionCode ? '#047857' : '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        fontSize: '0.75rem'
                                      }}
                                      title="Sao chép mã giao dịch"
                                    >
                                      <i className={`fa-solid ${copiedTxCode === tx.transactionCode ? 'fa-check' : 'fa-copy'}`} />
                                    </button>
                                  </div>
                                  {tx.notes && (
                                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
                                      {tx.notes}
                                    </div>
                                  )}
                                </td>

                                {/* Loại GD */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: typeBadge.bg,
                                    color: typeBadge.color,
                                    border: `1px solid ${typeBadge.border}`
                                  }}>
                                    {typeBadge.label}
                                  </span>
                                </td>

                                {/* Phương thức */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: methodBadge.bg,
                                    color: methodBadge.color
                                  }}>
                                    <i className={`fa-solid ${methodBadge.icon}`} />
                                    {methodBadge.label}
                                  </span>
                                </td>

                                {/* Số tiền */}
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <span style={{
                                    fontWeight: 900,
                                    fontSize: '0.92rem',
                                    color: isRefund ? '#dc2626' : '#047857'
                                  }}>
                                    {isRefund ? '-' : '+'} {formatCurrencyVND(tx.amount)}
                                  </span>
                                </td>

                                {/* Trạng thái */}
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '999px',
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    background: tx.status === 'success' ? '#dcfce7' : tx.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                    color: tx.status === 'success' ? '#15803d' : tx.status === 'pending' ? '#b45309' : '#b91c1c'
                                  }}>
                                    <i className={`fa-solid ${tx.status === 'success' ? 'fa-check' : tx.status === 'pending' ? 'fa-clock' : 'fa-xmark'}`} style={{ fontSize: '0.7rem' }} />
                                    {tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                      <i className="fa-solid fa-calculator" style={{ color: '#047857' }} />
                      <span>Tổng tiền đã ghi nhận qua các giao dịch:</span>
                      <strong style={{ color: '#047857', fontSize: '0.95rem' }}>
                        {formatCurrencyVND(
                          transactions
                            .filter(t => t.status === 'success')
                            .reduce((sum, t) => sum + (t.paymentType === 'refund' ? -t.amount : t.amount), 0)
                        )}
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Đối chiếu giá trị đơn: <strong style={{ color: '#0f172a' }}>{formatCurrencyVND(booking.totalAmount)}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN: ACTIONS & FINANCIALS (35%)
             ══════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* 1. Admin Workflow Actions Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#047857', marginRight: '0.5rem' }} />
                Nghiệp Vụ Xử Lý Đơn
              </h3>

              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Chọn thao tác để cập nhật trạng thái đơn hàng và kích hoạt đồng bộ tới khách hàng.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* 100% Confirmed */}
                <button
                  type="button"
                  disabled={isUpdating || booking.status === 'confirmed'}
                  onClick={() => handleStatusChange('confirmed')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: booking.status === 'confirmed' ? '#ecfdf5' : '#047857',
                    border: `1.5px solid ${booking.status === 'confirmed' ? '#a7f3d0' : '#047857'}`,
                    color: booking.status === 'confirmed' ? '#047857' : '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: booking.status === 'confirmed' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: booking.status === 'confirmed' ? 'none' : '0 2px 6px rgba(4, 120, 87, 0.2)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-circle-check" />
                    Xác Nhận Đã Thu 100%
                  </span>
                  {booking.status === 'confirmed' && <i className="fa-solid fa-check" />}
                </button>

                {/* 50% Deposit */}
                <button
                  type="button"
                  disabled={isUpdating || booking.status === 'deposit'}
                  onClick={() => handleStatusChange('deposit')}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: booking.status === 'deposit' ? '#f0f9ff' : '#0284c7',
                    border: `1.5px solid ${booking.status === 'deposit' ? '#bae6fd' : '#0284c7'}`,
                    color: booking.status === 'deposit' ? '#0284c7' : '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: booking.status === 'deposit' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: booking.status === 'deposit' ? 'none' : '0 2px 6px rgba(2, 132, 199, 0.2)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-circle-dollar-to-slot" />
                    Duyệt Đã Đặt Cọc 50%
                  </span>
                  {booking.status === 'deposit' && <i className="fa-solid fa-check" />}
                </button>

                {/* Pending */}
                <button
                  type="button"
                  disabled={isUpdating || booking.status === 'pending'}
                  onClick={() => handleStatusChange('pending')}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: booking.status === 'pending' ? '#fffbeb' : '#ffffff',
                    border: '1.5px solid #f59e0b',
                    color: '#d97706',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: booking.status === 'pending' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-clock" />
                    Chuyển Chờ Thanh Toán
                  </span>
                  {booking.status === 'pending' && <i className="fa-solid fa-check" />}
                </button>

                {/* Cancel Booking Button */}
                {booking.status !== 'cancelled' ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setConfirmCancelOpen(true)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1.5px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    <i className="fa-solid fa-ban" />
                    Hủy Đơn Hàng Này
                  </button>
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }} />
                    Đơn hàng này đã bị hủy
                  </div>
                )}
              </div>

              {/* Confirm Cancel Popover */}
              {confirmCancelOpen && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem' }}>
                    Xác nhận hủy đơn hàng?
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#b91c1c', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                    Đơn hàng sẽ chuyển sang trạng thái đã hủy. Số chỗ đã đặt sẽ được tự động hoàn lại hệ thống.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('cancelled')}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Đồng Ý Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancelOpen(false)}
                      style={{
                        padding: '0.45rem 0.8rem',
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Bỏ Qua
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Financial Reconciliation Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <i className="fa-solid fa-scale-balanced" style={{ color: '#047857', marginRight: '0.5rem' }} />
                Đối Soát Dòng Tiền & Công Nợ
              </h3>

              {/* Progress Bar */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Tiến độ thu tiền:</span>
                  <span style={{ color: paymentPercentage === 100 ? '#15803d' : '#0284c7' }}>{paymentPercentage}% Hoàn Tất</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${paymentPercentage}%`,
                    height: '100%',
                    background: paymentPercentage === 100 ? '#10b981' : '#0284c7',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Finance Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Tổng giá trị đơn:</span>
                  <strong style={{ color: '#0f172a' }}>{formatCurrencyVND(booking.totalAmount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Đã thu thực tế:</span>
                  <strong style={{ color: '#0284c7' }}>{formatCurrencyVND(effectivePaidAmount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Còn lại cần thu:</span>
                  <strong style={{ color: remainingAmount > 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrencyVND(remainingAmount)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                  <span style={{ color: '#64748b' }}>Trạng thái thanh toán:</span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    background: booking.status === 'confirmed' ? '#dcfce7' : booking.status === 'deposit' ? '#e0f2fe' : '#fef3c7',
                    color: booking.status === 'confirmed' ? '#15803d' : booking.status === 'deposit' ? '#0369a1' : '#b45309'
                  }}>
                    {booking.status === 'confirmed' ? 'ĐÃ HOÀN TẤT' : booking.status === 'deposit' ? 'ĐÃ CỌC 50%' : 'CHƯA THU'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. E-Ticket & Fast QR Check-in Card */}
            <div style={{
              background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 4px 15px rgba(2, 44, 34, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <i className="fa-solid fa-qrcode" style={{ marginRight: '0.4rem' }} />
                Mã Soát Vé Check-in
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                {booking.bookingCode || booking.id}
              </div>

              {/* QR Box */}
              <div style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '16px',
                display: 'inline-block',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <img
                  src={qrUrl}
                  alt={`QR Code ${booking.bookingCode}`}
                  style={{ width: '150px', height: '150px', display: 'block' }}
                />
              </div>

              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Mã QR hợp lệ để kiểm tra và xác thực vé khi khách hàng lên xe/đoàn du lịch.
              </p>

              <button
                type="button"
                onClick={() => setShowETicketModal(true)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#064e3b',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <i className="fa-solid fa-ticket" />
                Mở Vé Điện Tử Toàn Màn Hình
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ── 3. E-Ticket Fullscreen Modal ── */}
      {showETicketModal && eTicketPayload && (
        <ETicketModal
          booking={eTicketPayload}
          onClose={() => setShowETicketModal(false)}
        />
      )}

    </div>
  );
};

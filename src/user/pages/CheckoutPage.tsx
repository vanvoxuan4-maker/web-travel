import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { TOURS_DATA } from '../../data/toursData';
import { tourService } from '../../services/tourService';
import { Tour, DepartureDate } from '../../types/tour.types';
import { getDateDetails, deductSeats, getRemainingSeats } from '../../utils/inventoryManager';
import { formatCurrencyVND, getDayOfWeekVN } from '../../utils/formatters';
import { bookingService, PaymentMethod } from '../../services/bookingService';
import { couponService } from '../../services/couponService';
import { useAuth } from '../../auth/useAuth';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ tourId?: string }>();
  const { user } = useAuth();

  const tourIdFromQuery = params.tourId || searchParams.get('tourId') || searchParams.get('id') || (TOURS_DATA[0]?.id || '');
  const initialDateFromQuery = searchParams.get('date');

  const [tour, setTour] = useState<Tour | null>(() => {
    if (!tourIdFromQuery) return TOURS_DATA.length > 0 ? TOURS_DATA[0] : null;
    return tourService.getTourByIdSync(tourIdFromQuery) || TOURS_DATA.find(t => t.id === tourIdFromQuery || t.slug === tourIdFromQuery) || (TOURS_DATA.length > 0 ? TOURS_DATA[0] : null);
  });

  useEffect(() => {
    if (tourIdFromQuery) {
      const local = tourService.getTourByIdSync(tourIdFromQuery) || TOURS_DATA.find(t => t.id === tourIdFromQuery || t.slug === tourIdFromQuery);
      if (local) setTour(local);

      tourService.getTourById(tourIdFromQuery).then(fetched => {
        if (fetched) {
          setTour(fetched);
        }
      });
    }
  }, [tourIdFromQuery]);

  const departureList = useMemo<DepartureDate[]>(() => {
    if (!tour) return [];
    return tour.departureDates && tour.departureDates.length > 0
      ? tour.departureDates
      : (tour.availableDates || ['12/09/2026', '19/09/2026', '26/09/2026', '10/10/2026']).map(d => ({
          date: d,
          seats: 5,
          priceAdult: tour.priceAdult,
          label: null
        }));
  }, [tour]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return initialDateFromQuery || (departureList[0]?.date) || '12/09/2026';
  });

  useEffect(() => {
    if (tour && !initialDateFromQuery) {
      const first = tour.departureDates?.[0]?.date || tour.availableDates?.[0] || '12/09/2026';
      setSelectedDate(first);
    }
  }, [tour, initialDateFromQuery]);

  const [showAllDates, setShowAllDates] = useState<boolean>(false);

  const currentDetails = useMemo(() => {
    if (!tour) return null;
    return getDateDetails(tour.id, selectedDate, tour);
  }, [tour, selectedDate]);

  const maxSeats = currentDetails?.seats ?? (tour ? getRemainingSeats(tour.id, selectedDate) : 0);
  const isSoldOut = maxSeats <= 0;

  const [adults, setAdults] = useState<number>(() => (isSoldOut ? 0 : Math.min(2, Math.max(1, maxSeats))));
  const [children, setChildren] = useState<number>(0);
  const [toddlers, setToddlers] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  const [singleRoomChoice, setSingleRoomChoice] = useState<'no' | 'yes'>('no');
  const [addonInsurance, setAddonInsurance] = useState<boolean>(false);
  const [addonPickup, setAddonPickup] = useState<boolean>(false);
  const [payOption, setPayOption] = useState<'full' | 'deposit'>('full');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  
  // Coupon
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Customer contact form
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');
  const [customerNotes, setCustomerNotes] = useState('');

  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    pax?: string;
  }>({});

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmation state
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [isPaidConfirmed, setIsPaidConfirmed] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins

  // Autofill when user profile loads
  useEffect(() => {
    if (user) {
      if (user.fullName && !customerName) setCustomerName(user.fullName);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.address && !customerAddress) setCustomerAddress(user.address);
    }
  }, [user]);

  useEffect(() => {
    if (initialDateFromQuery && tour) {
      setSelectedDate(initialDateFromQuery);
      const s = getRemainingSeats(tour.id, initialDateFromQuery);
      if (s <= 0) {
        setAdults(0);
      } else {
        setAdults(Math.min(2, Math.max(1, s)));
      }
    }
  }, [initialDateFromQuery, tour]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDate = (dateStr: string) => {
    if (!tour) return;
    const seats = getRemainingSeats(tour.id, dateStr);
    if (seats <= 0) return;
    setSelectedDate(dateStr);
    setShowAllDates(false);
    if (adults + children + toddlers > seats) {
      setAdults(Math.max(1, Math.min(2, seats)));
      setChildren(0);
      setToddlers(0);
    } else if (adults === 0 && seats > 0) {
      setAdults(Math.max(1, Math.min(2, seats)));
    }
  };

  const bookedPax = adults + children + toddlers;
  const canAddSeatPax = !isSoldOut && bookedPax < maxSeats;
  const isSeatExceeded = bookedPax > maxSeats;

  const priceAdultUnit = currentDetails?.priceAdult || tour?.priceAdult || 5800000;
  const priceChildUnit = currentDetails?.priceChild || Math.round(priceAdultUnit * 0.75);
  const priceToddlerUnit = currentDetails?.priceToddler || Math.round(priceAdultUnit * 0.5);
  const priceInfantUnit = currentDetails?.priceInfant || 500000;
  const singleRoomPrice = currentDetails?.singleRoomSurcharge || 800000;
  const insurancePrice = 150000;
  const pickupPrice = 250000;

  const totalAdults = adults * priceAdultUnit;
  const totalChildren = children * priceChildUnit;
  const totalToddlers = toddlers * priceToddlerUnit;
  const totalInfants = infants * priceInfantUnit;
  const totalSingle = singleRoomChoice === 'yes' ? singleRoomPrice : 0;
  const totalAddons = (addonInsurance ? insurancePrice * (adults + children + toddlers) : 0) +
                      (addonPickup ? pickupPrice * (adults + children + toddlers) : 0);

  const rawTotal = totalAdults + totalChildren + totalToddlers + totalInfants + totalSingle + totalAddons;
  const finalTotal = Math.max(0, rawTotal - couponDiscount);
  const dueAmount = payOption === 'deposit' ? Math.round(finalTotal * 0.5) : finalTotal;

  // Coupon Validation against Database / Fallback
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMsg({ text: 'Vui lòng nhập mã giảm giá.', success: false });
      return;
    }

    setIsCheckingCoupon(true);
    try {
      const res = await couponService.validateCoupon(couponCode, rawTotal);
      if (res.valid) {
        setCouponDiscount(res.discountAmount);
        setCouponMsg({ text: res.message, success: true });
      } else {
        setCouponDiscount(0);
        setCouponMsg({ text: res.message, success: false });
      }
    } catch (err) {
      setCouponDiscount(0);
      setCouponMsg({ text: 'Lỗi kiểm tra mã giảm giá. Vui lòng thử lại.', success: false });
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.name = 'Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).';
    }

    const phoneClean = customerPhone.replace(/\s+/g, '');
    const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;
    if (!phoneClean) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (phoneClean.length < 10 || !phoneRegex.test(phoneClean)) {
      errors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim()) {
      errors.email = 'Vui lòng nhập email nhận vé điện tử.';
    } else if (!emailRegex.test(customerEmail.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!customerAddress.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ liên hệ của bạn.';
    }

    if (adults <= 0) {
      errors.pax = 'Cần ít nhất 1 hành khách người lớn.';
    } else if (bookedPax > maxSeats) {
      errors.pax = `Số lượng hành khách vượt quá số chỗ còn trống (${maxSeats} chỗ).`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour) return;

    if (!validateForm()) {
      // Scroll to first error
      const firstErrEl = document.querySelector('.form-input-error');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (isSoldOut || isSeatExceeded || bookedPax === 0) return;

    setIsSubmitting(true);

    try {
      // Generate standard booking reference code: WT-YYYYMMDD-XXXXXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ref = `WT-${todayStr}-${randHex}`;
      setBookingRef(ref);

      // Deduct seats in inventory manager & Supabase
      deductSeats(tour.id, selectedDate, bookedPax);

      // Save to Database (Supabase + LocalStorage)
      const res = await bookingService.createBooking({
        bookingCode: ref,
        userId: user?.id,
        tourId: tour.id,
        tourTitle: tour.title,
        tourImage: tour.image,
        departureDate: selectedDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        customerNotes: customerNotes.trim(),
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
        infantsCount: infants,
        singleRoomsCount: singleRoomChoice === 'yes' ? 1 : 0,
        totalAmount: dueAmount,
        couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
        couponDiscount: couponDiscount > 0 ? couponDiscount : 0,
        paymentMethod: paymentMethod,
        paymentStatus: 'pending',
        bookingStatus: 'confirmed'
      });

      if (res.success) {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(res.error || 'Có lỗi xảy ra khi tạo đơn đặt tour. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error confirming booking:', err);
      alert('Không thể hoàn tất đặt tour. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Action for User to confirm transfer
  const handleMarkPaymentTransferred = async () => {
    if (!bookingRef) return;
    setIsPaidConfirmed(true);
    await bookingService.updatePaymentStatus(bookingRef, 'paid', dueAmount, paymentMethod);
  };

  const timerMins = Math.floor(secondsRemaining / 60);
  const timerSecs = secondsRemaining % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  const vietQrUrl = `https://img.vietqr.io/image/MB-0348888999-compact2.png?amount=${dueAmount}&addInfo=${encodeURIComponent(bookingRef + ' ' + customerPhone)}&accountName=CONG%20TY%20DU%20LICH%20WEBTRAVEL`;

  if (!tour) {
    return (
      <div className="checkout-page" style={{ padding: '8rem 1rem 5rem', background: '#f8fafc', minHeight: '80vh', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <i className="fa-solid fa-compass" style={{ fontSize: '3.5rem', color: '#9ca3af', marginBottom: '1.25rem' }}></i>
          <h2 style={{ color: '#111827', margin: '0 0 0.5rem', fontSize: '1.75rem' }}>Không tìm thấy tour để thanh toán</h2>
          <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.95rem' }}>Hành trình bạn chọn có thể chưa tồn tại hoặc đã kết thúc mở bán.</p>
          <Link to="/tours" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
            <i className="fa-solid fa-arrow-left"></i> Khám Phá Danh Mục Tour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '6.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Trang Chủ</Link>
          <i className="fa-solid fa-angle-right" style={{ fontSize: '0.75rem' }}></i>
          <Link to="/tours" style={{ color: '#64748b', textDecoration: 'none' }}>Danh Mục Tour</Link>
          <i className="fa-solid fa-angle-right" style={{ fontSize: '0.75rem' }}></i>
          <Link to={`/tour/${tour.slug || tour.id}`} style={{ color: '#64748b', textDecoration: 'none' }}>{tour.shortTitle || tour.title}</Link>
          <i className="fa-solid fa-angle-right" style={{ fontSize: '0.75rem' }}></i>
          <span style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>Xác Nhận Đặt Chỗ &amp; Thanh Toán</span>
        </div>

        {isSuccess ? (
          /* Success / Order Confirmation View */
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '80px', height: '80px', background: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.25rem' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#111827', margin: '0 0 0.5rem' }}>
              Đã Giữ Chỗ &amp; Xác Nhận Đặt Tour Thành Công!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem' }}>
              Mã hồ sơ đơn hàng: <strong style={{ color: 'var(--accent-forest)', fontSize: '1.25rem', letterSpacing: '0.5px' }}>{bookingRef}</strong> • Chuyến đi: <strong>{tour.title}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ margin: '0 0 1rem', color: '#111827', fontSize: '1.15rem', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    <i className="fa-solid fa-file-invoice" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Thông Tin Hồ Sơ Đặt Chỗ:
                  </span>
                  <span className={`badge ${isPaidConfirmed ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.78rem' }}>
                    {isPaidConfirmed ? '✅ ĐÃ THANH TOÁN' : '⏳ CHỜ THANH TOÁN'}
                  </span>
                </h3>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Người đại diện:</strong> {customerName}</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Số điện thoại (Zalo):</strong> {customerPhone}</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Email nhận hợp đồng:</strong> {customerEmail}</p>
                {customerAddress && <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Địa chỉ liên hệ:</strong> {customerAddress}</p>}
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Ngày khởi hành:</strong> {selectedDate} ({getDayOfWeekVN(selectedDate)})</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}>
                  <strong>Số lượng khách ({bookedPax + infants} người):</strong> {adults} Người lớn {children > 0 ? `, ${children} Trẻ em` : ''} {toddlers > 0 ? `, ${toddlers} Trẻ nhỏ` : ''} {infants > 0 ? `, ${infants} Em bé` : ''}
                </p>
                {couponDiscount > 0 && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.92rem', color: '#059669' }}>
                    <strong>Mã khuyến mãi:</strong> {couponCode.toUpperCase()} (-{formatCurrencyVND(couponDiscount)})
                  </p>
                )}
                <p style={{ margin: '0.75rem 0 0', fontSize: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                  <strong>Số tiền thanh toán:</strong> <span style={{ color: 'var(--accent-forest)', fontWeight: 800, fontSize: '1.3rem' }}>{formatCurrencyVND(dueAmount)}</span> {payOption === 'deposit' ? '(Đặt cọc giữ chỗ 50%)' : '(100% trọn gói)'}
                </p>
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#111827', fontSize: '1.05rem' }}>
                  <i className="fa-solid fa-qrcode" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Quét Mã VietQR Chuyển Khoản Tự Động
                </h3>
                <img src={vietQrUrl} alt="VietQR Thanh Toán" style={{ maxWidth: '200px', borderRadius: '10px', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }} />
                
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.6rem 0 0.85rem' }}>
                  Nội dung chuyển khoản: <strong style={{ color: '#0f172a' }}>{bookingRef} {customerPhone}</strong>
                </p>

                {!isPaidConfirmed ? (
                  <button
                    type="button"
                    onClick={handleMarkPaymentTransferred}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '20px',
                      background: '#ecfdf5',
                      border: '1.5px solid #059669',
                      color: '#047857',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa-solid fa-check"></i> Tôi Đã Chuyển Khoản Thành Công
                  </button>
                ) : (
                  <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-circle-check"></i> Đã Ghi Nhận Thanh Toán (Hệ Thống Đang Đối Soát)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/profile" className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-ticket"></i> Xem Lịch Sử Đặt Tour Của Tôi
              </Link>
              <Link to="/tours" className="btn-secondary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-compass"></i> Tiếp Tục Đặt Tour Khác
              </Link>
              <Link to="/" className="btn-secondary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-house"></i> Về Trang Chủ
              </Link>
            </div>
          </div>
        ) : (
          /* Full Checkout Form Layout */
          <div>
            {/* Top Summary Banner */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-emerald"><i className="fa-solid fa-shield-halved"></i> Đặt Chỗ Trực Tuyến An Toàn</span>
                    <span className="badge badge-forest">Mã Tour: {tour.code || 'WT-01'}</span>
                  </div>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', color: '#111827', margin: '0.2rem 0 0.4rem' }}>
                    {tour.title}
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-emerald)' }}></i> {tour.destination} 
                    &nbsp;|&nbsp; <i className="fa-solid fa-clock" style={{ color: 'var(--accent-emerald)' }}></i> {tour.durationDays}N{tour.durationNights}Đ 
                    &nbsp;|&nbsp; <i className="fa-solid fa-hotel" style={{ color: '#f59e0b' }}></i> {tour.starRating}★ {tour.hotelSpecs?.hotelName || 'Khách sạn cao cấp'}
                  </p>
                </div>

                {currentDetails?.label ? (
                  <div style={{ textAlign: 'right' }}>
                    <span 
                      style={{ 
                        fontSize: '0.92rem', 
                        fontWeight: 800, 
                        padding: '0.5rem 1.15rem', 
                        borderRadius: '10px', 
                        background: currentDetails.label.includes('Lễ') || currentDetails.label.includes('Tết') || currentDetails.label.includes('Quốc Khánh') || currentDetails.label.includes('Giáng Sinh') || currentDetails.label.includes('Năm Mới') ? '#fff1f2' : '#eff6ff', 
                        color: currentDetails.label.includes('Lễ') || currentDetails.label.includes('Tết') || currentDetails.label.includes('Quốc Khánh') || currentDetails.label.includes('Giáng Sinh') || currentDetails.label.includes('Năm Mới') ? '#e11d48' : '#1d4ed8',
                        border: currentDetails.label.includes('Lễ') || currentDetails.label.includes('Tết') || currentDetails.label.includes('Quốc Khánh') || currentDetails.label.includes('Giáng Sinh') || currentDetails.label.includes('Năm Mới') ? '1.5px solid #fecdd3' : '1.5px solid #bfdbfe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
                      }}
                    >
                      {currentDetails.label}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Main 2-Column Grid */}
            <form id="smart-booking-form" onSubmit={handleConfirmBooking} noValidate>
              <div className="booking-modal-grid">
                
                {/* LEFT COLUMN: Step-by-Step Configuration */}
                <div className="booking-left-col">
                  
                  {/* STEP 1: Confirmed Departure Date */}
                  <div className="booking-form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <h4 className="booking-step-title" style={{ marginBottom: 0 }}>
                        <span className="step-num">1</span> Ngày Khởi Hành
                      </h4>
                      <button 
                        type="button" 
                        id="btn-toggle-change-date" 
                        onClick={() => setShowAllDates(!showAllDates)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> {showAllDates ? 'Thu gọn lịch' : 'Đổi ngày khác'}
                      </button>
                    </div>

                    {/* Confirmed Date Banner */}
                    <div id="confirmed-date-banner" style={{ background: '#f0fdf4', border: '1.5px solid var(--accent-emerald)', padding: '1rem 1.35rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--accent-emerald)', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                          <i className="fa-regular fa-calendar-check"></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                            Ngày khởi hành đã chọn:
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>{getDayOfWeekVN(selectedDate)}, {selectedDate}</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--accent-forest)' }}>({formatCurrencyVND(priceAdultUnit)}/khách)</span>
                            {currentDetails?.label && (
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                                {currentDetails.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-emerald'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                        <i className={isSoldOut ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-user-check'}></i> 
                        {isSoldOut ? 'Đã hết chỗ' : `Còn ${maxSeats} chỗ trống`}
                      </span>
                    </div>

                    {/* Expandable Dates Grid */}
                    {showAllDates && (
                      <div 
                        className="booking-dates-grid" 
                        id="booking-dates-container" 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                          gap: '0.85rem', 
                          marginTop: '1rem' 
                        }}
                      >
                        {departureList.map((dep) => {
                          const isSelected = dep.date === selectedDate;
                          const s = getRemainingSeats(tour.id, dep.date);
                          const p = dep.priceAdult || priceAdultUnit;
                          const isDateSoldOut = s <= 0;
                          const dayOfWeek = dep.dayOfWeek || getDayOfWeekVN(dep.date);

                          return (
                            <button
                              key={dep.date}
                              type="button"
                              disabled={isDateSoldOut}
                              onClick={() => handleSelectDate(dep.date)}
                              className={`booking-date-card ${isSelected ? 'active' : ''}`}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.85rem 0.65rem',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid var(--accent-forest)' : '1.5px solid #e2e8f0',
                                background: isSelected ? '#f0fdf4' : isDateSoldOut ? '#f8fafc' : '#ffffff',
                                cursor: isDateSoldOut ? 'not-allowed' : 'pointer',
                                opacity: isDateSoldOut ? 0.6 : 1,
                                transition: 'all 0.2s ease',
                                textAlign: 'center',
                                minHeight: '140px',
                                boxShadow: isSelected ? '0 4px 14px rgba(5, 150, 105, 0.15)' : '0 2px 5px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ minHeight: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '0.35rem' }}>
                                {dep.label ? (
                                  <span 
                                    style={{ 
                                      fontSize: '0.68rem', 
                                      fontWeight: 700, 
                                      padding: '0.15rem 0.5rem', 
                                      borderRadius: '6px', 
                                      background: dep.label.includes('Lễ') || dep.label.includes('Giáng') ? '#fef2f2' : '#ecfdf5', 
                                      color: dep.label.includes('Lễ') || dep.label.includes('Giáng') ? '#dc2626' : '#047857',
                                      border: dep.label.includes('Lễ') || dep.label.includes('Giáng') ? '1px solid #fecaca' : '1px solid #a7f3d0',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {dep.label}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                                    Lịch tiêu chuẩn
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', margin: '0.2rem 0' }}>
                                <span 
                                  style={{ 
                                    fontSize: '0.78rem', 
                                    fontWeight: 800, 
                                    color: isSelected ? '#047857' : '#64748b', 
                                    background: isSelected ? '#d1fae5' : '#f1f5f9', 
                                    padding: '0.1rem 0.4rem', 
                                    borderRadius: '4px' 
                                  }}
                                >
                                  {dayOfWeek}
                                </span>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                                  {dep.date}
                                </span>
                              </div>

                              <div 
                                style={{ 
                                  fontSize: '1.05rem', 
                                  fontWeight: 800, 
                                  color: 'var(--accent-forest, #047857)', 
                                  margin: '0.25rem 0 0.35rem', 
                                  fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
                                  fontVariantNumeric: 'lining-nums tabular-nums' 
                                }}
                              >
                                {formatCurrencyVND(p)}
                              </div>

                              <div 
                                style={{ 
                                  fontSize: '0.74rem', 
                                  fontWeight: 700, 
                                  padding: '0.2rem 0.6rem', 
                                  borderRadius: '9999px', 
                                  background: isDateSoldOut ? '#fef2f2' : (s <= 2 ? '#fffbeb' : '#ecfdf5'), 
                                  color: isDateSoldOut ? '#dc2626' : (s <= 2 ? '#b45309' : '#047857'),
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <i className={isDateSoldOut ? 'fa-solid fa-ban' : 'fa-solid fa-user-check'}></i> 
                                {isDateSoldOut ? 'Hết chỗ' : `Còn ${s} chỗ`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Passenger Count by Age Tier */}
                  <div className="booking-form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <h4 className="booking-step-title" style={{ marginBottom: 0 }}>
                        <span className="step-num">2</span> Số Lượng Hành Khách
                      </h4>
                      <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-emerald'}`} style={{ fontSize: '0.8rem' }}>
                        {isSoldOut ? 'Hết chỗ' : `Đã chọn: ${bookedPax}/${maxSeats} chỗ`}
                      </span>
                    </div>

                    {formErrors.pax && (
                      <div className="form-input-error" style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        <i className="fa-solid fa-circle-exclamation"></i> {formErrors.pax}
                      </div>
                    )}
                    
                    <div className="passenger-tier-list">
                      {/* Tier 1: Adult */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Người Lớn (Từ 12 tuổi trở lên) *</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>100% giá tour - Tiêu chuẩn giường riêng đầy đủ</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
                            {formatCurrencyVND(priceAdultUnit)} / người
                          </div>
                        </div>
                        <div className="counter-input-wrap">
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={adults <= (isSoldOut ? 0 : 1)}
                            onClick={() => setAdults(Math.max(isSoldOut ? 0 : 1, adults - 1))}
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <input type="number" className="counter-val" value={adults} readOnly />
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={!canAddSeatPax}
                            onClick={() => { if (canAddSeatPax) setAdults(adults + 1); }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      {/* Tier 2: Child (5-11yo) */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Trẻ Em (Từ 5 - 11 tuổi)</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>75% giá tour - Suất ăn riêng, ngủ chung bố mẹ</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
                            {formatCurrencyVND(priceChildUnit)} / bé
                          </div>
                        </div>
                        <div className="counter-input-wrap">
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={children <= 0}
                            onClick={() => setChildren(Math.max(0, children - 1))}
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <input type="number" className="counter-val" value={children} readOnly />
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={!canAddSeatPax}
                            onClick={() => { if (canAddSeatPax) setChildren(children + 1); }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      {/* Tier 3: Toddler (2-4yo) */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Trẻ Nhỏ (Từ 2 - 4 tuổi)</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>50% giá tour - Ghế máy bay riêng, ăn ngủ cùng bố mẹ</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
                            {formatCurrencyVND(priceToddlerUnit)} / bé
                          </div>
                        </div>
                        <div className="counter-input-wrap">
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={toddlers <= 0}
                            onClick={() => setToddlers(Math.max(0, toddlers - 1))}
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <input type="number" className="counter-val" value={toddlers} readOnly />
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={!canAddSeatPax}
                            onClick={() => { if (canAddSeatPax) setToddlers(toddlers + 1); }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      {/* Tier 4: Infant (<2yo) */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Em Bé (Dưới 2 tuổi)</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>500.000 ₫ - Phí bảo hiểm và phụ phí phục vụ</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
                            {formatCurrencyVND(priceInfantUnit)} / bé
                          </div>
                        </div>
                        <div className="counter-input-wrap">
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={infants <= 0}
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <input type="number" className="counter-val" value={infants} readOnly />
                          <button
                            type="button"
                            className="counter-btn"
                            disabled={infants >= Math.max(1, adults * 2) || isSoldOut}
                            onClick={() => { if (!isSoldOut && infants < 5) setInfants(infants + 1); }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Warnings */}
                    {isSoldOut && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.85rem', borderRadius: '8px', fontSize: '0.88rem', marginTop: '0.85rem' }}>
                        <i className="fa-solid fa-ban"></i> <strong>Ngày này đã hết chỗ:</strong> Vui lòng chọn ngày khởi hành khác ở Bước 1.
                      </div>
                    )}
                    {!isSoldOut && bookedPax >= maxSeats && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '0.85rem', borderRadius: '8px', fontSize: '0.88rem', marginTop: '0.85rem' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> <strong>Đã đạt giới hạn:</strong> Chuyến đi này chỉ còn nhận tối đa {maxSeats} chỗ trống.
                      </div>
                    )}
                  </div>

                  {/* STEP 3: Single Supplement & Optional Add-ons */}
                  <div className="booking-form-section">
                    <h4 className="booking-step-title">
                      <span className="step-num">3</span> Tùy Chọn Phòng &amp; Dịch Vụ Mở Rộng
                    </h4>
                    
                    {/* Smart Room Arrangement Box */}
                    <div id="single-room-block" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '10px', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                            <i className="fa-solid fa-bed" style={{ color: 'var(--accent-emerald)', marginRight: '0.35rem' }}></i> Sắp Xếp Phòng Khách Sạn
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
                            Tiêu chuẩn: 2 khách/phòng đôi (Đã bao gồm trong giá tour).
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: singleRoomChoice === 'yes' ? '#b45309' : 'var(--accent-forest)', fontSize: '0.85rem', background: singleRoomChoice === 'yes' ? '#fef3c7' : '#d1fae5', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>
                          {singleRoomChoice === 'yes' ? `+${formatCurrencyVND(singleRoomPrice)}` : 'Đã bao gồm (0 ₫)'}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <input 
                            type="radio" 
                            name="single-room-choice" 
                            checked={singleRoomChoice === 'no'} 
                            onChange={() => setSingleRoomChoice('no')} 
                          />
                          <span>Phòng đôi tiêu chuẩn / Ghép phòng Twin (Đã bao gồm - 0 ₫)</span>
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <input 
                            type="radio" 
                            name="single-room-choice" 
                            checked={singleRoomChoice === 'yes'} 
                            onChange={() => setSingleRoomChoice('yes')} 
                          />
                          <span>Yêu cầu ở phòng đơn riêng (+{formatCurrencyVND(singleRoomPrice)} / phòng)</span>
                        </label>
                      </div>
                    </div>

                    {/* Optional Add-ons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label className="addon-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={addonInsurance} 
                          onChange={(e) => setAddonInsurance(e.target.checked)} 
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bảo hiểm du lịch mở rộng quốc tế</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Bồi thường tối đa 1 tỷ đồng / người</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-forest)' }}>
                          +{formatCurrencyVND(insurancePrice)} / người
                        </span>
                      </label>

                      <label className="addon-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={addonPickup} 
                          onChange={(e) => setAddonPickup(e.target.checked)} 
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Xe Limousine đón tiễn tận nhà (Nội thành)</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Xe cao cấp đưa đón 2 chiều thuận tiện</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-forest)' }}>
                          +{formatCurrencyVND(pickupPrice)} / người
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* STEP 4: Passenger Contact Information */}
                  <div className="booking-form-section">
                    <h4 className="booking-step-title">
                      <span className="step-num">4</span> Thông Tin Người Đại Diện Nhận Vé
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}>
                          <i className="fa-solid fa-user"></i> Họ và Tên *
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nguyễn Văn A" 
                          value={customerName} 
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                          }} 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: formErrors.name ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                            outline: 'none'
                          }}
                        />
                        {formErrors.name && (
                          <div className="form-input-error" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 }}>
                            {formErrors.name}
                          </div>
                        )}
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}>
                          <i className="fa-solid fa-phone"></i> Số Điện Thoại (Zalo) *
                        </label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="0901 234 567" 
                          value={customerPhone} 
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                          }} 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: formErrors.phone ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                            outline: 'none'
                          }}
                        />
                        {formErrors.phone && (
                          <div className="form-input-error" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 }}>
                            {formErrors.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}>
                          <i className="fa-solid fa-envelope"></i> Email Nhận Vé &amp; Hợp Đồng *
                        </label>
                        <input 
                          type="email" 
                          required 
                          placeholder="khachhang@gmail.com" 
                          value={customerEmail} 
                          onChange={(e) => {
                            setCustomerEmail(e.target.value);
                            if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                          }} 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: formErrors.email ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                            outline: 'none'
                          }}
                        />
                        {formErrors.email && (
                          <div className="form-input-error" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 }}>
                            {formErrors.email}
                          </div>
                        )}
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}>
                          <i className="fa-solid fa-location-dot"></i> Địa Chỉ Liên Hệ *
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Số nhà, đường, tỉnh/thành phố" 
                          value={customerAddress} 
                          onChange={(e) => {
                            setCustomerAddress(e.target.value);
                            if (formErrors.address) setFormErrors(prev => ({ ...prev, address: undefined }));
                          }} 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            border: formErrors.address ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                            outline: 'none'
                          }}
                        />
                        {formErrors.address && (
                          <div className="form-input-error" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 600 }}>
                            {formErrors.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}>
                        <i className="fa-solid fa-note-sticky"></i> Ghi chú đặc biệt (nếu có):
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ăn chay, phòng tầng cao, kỷ niệm ngày cưới..." 
                        value={customerNotes} 
                        onChange={(e) => setCustomerNotes(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  {/* STEP 5: Payment Method Selection */}
                  <div className="booking-form-section">
                    <h4 className="booking-step-title">
                      <span className="step-num">5</span> Phương Thức Thanh Toán
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      {/* Method 1: VietQR */}
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem', 
                          borderRadius: '12px', 
                          border: paymentMethod === 'vietqr' ? '2px solid #059669' : '1.5px solid #e2e8f0', 
                          background: paymentMethod === 'vietqr' ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name="payment-method" 
                            checked={paymentMethod === 'vietqr'} 
                            onChange={() => setPaymentMethod('vietqr')} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                              📱 Chuyển Khoản Ngân Hàng (VietQR) <span className="badge badge-emerald" style={{ fontSize: '0.72rem', marginLeft: '0.3rem' }}>Khuyên dùng</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Quét mã QR qua ứng dụng ngân hàng bất kỳ (Miễn phí &amp; Xác nhận tức thì)
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-qrcode" style={{ fontSize: '1.5rem', color: '#059669' }}></i>
                      </label>

                      {/* Method 2: Credit Card */}
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem', 
                          borderRadius: '12px', 
                          border: paymentMethod === 'credit_card' ? '2px solid #059669' : '1.5px solid #e2e8f0', 
                          background: paymentMethod === 'credit_card' ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name="payment-method" 
                            checked={paymentMethod === 'credit_card'} 
                            onChange={() => setPaymentMethod('credit_card')} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                              💳 Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Visa, MasterCard, JCB)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Bảo mật SSL 256-bit chuẩn 3D Secure
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-credit-card" style={{ fontSize: '1.5rem', color: '#2563eb' }}></i>
                      </label>

                      {/* Method 3: MoMo */}
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem', 
                          borderRadius: '12px', 
                          border: paymentMethod === 'momo' ? '2px solid #059669' : '1.5px solid #e2e8f0', 
                          background: paymentMethod === 'momo' ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name="payment-method" 
                            checked={paymentMethod === 'momo'} 
                            onChange={() => setPaymentMethod('momo')} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                              👛 Ví Điện Tử MoMo / ZaloPay
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Thanh toán qua ví điện tử tiện lợi
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-wallet" style={{ fontSize: '1.5rem', color: '#a21caf' }}></i>
                      </label>

                      {/* Method 4: Office / Cash */}
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem', 
                          borderRadius: '12px', 
                          border: paymentMethod === 'cash' ? '2px solid #059669' : '1.5px solid #e2e8f0', 
                          background: paymentMethod === 'cash' ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name="payment-method" 
                            checked={paymentMethod === 'cash'} 
                            onChange={() => setPaymentMethod('cash')} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                              🏢 Thanh Toán Trực Tiếp Tại Văn Phòng WebTravel
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Giữ chỗ trước và đến phòng vé hoàn tất thủ tục
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-building" style={{ fontSize: '1.5rem', color: '#64748b' }}></i>
                      </label>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Sticky Realtime Price Summary & Coupon Box */}
                <div className="booking-right-col">
                  <div className="booking-summary-sticky-card">
                    
                    {/* Reservation Lock Countdown Badge */}
                    <div className="seat-lock-banner">
                      <i className="fa-solid fa-stopwatch fa-spin-pulse"></i>
                      <span>Giữ chỗ tạm thời trong: <strong>{timerDisplay}</strong></span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#111827', margin: '1.25rem 0 0.4rem' }}>
                      Chi Tiết Giá Tour
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1.25rem', color: '#64748b' }}>
                      Cập nhật tự động theo thời gian thực (Đã gồm VAT &amp; Bảo hiểm)
                    </p>

                    {/* Realtime Price Breakdown Rows */}
                    <div className="price-breakdown-table">
                      {adults > 0 && (
                        <div className="breakdown-row">
                          <span className="label">Người lớn (≥12t) ({adults}x):</span>
                          <span className="val">{formatCurrencyVND(totalAdults)}</span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="breakdown-row">
                          <span className="label">Trẻ em (5-11t) ({children}x):</span>
                          <span className="val">{formatCurrencyVND(totalChildren)}</span>
                        </div>
                      )}
                      {toddlers > 0 && (
                        <div className="breakdown-row">
                          <span className="label">Trẻ nhỏ (2-4t) ({toddlers}x):</span>
                          <span className="val">{formatCurrencyVND(totalToddlers)}</span>
                        </div>
                      )}
                      {infants > 0 && (
                        <div className="breakdown-row">
                          <span className="label">Em bé (&lt;2t) ({infants}x):</span>
                          <span className="val">{formatCurrencyVND(totalInfants)}</span>
                        </div>
                      )}
                      {singleRoomChoice === 'yes' && (
                        <div className="breakdown-row">
                          <span className="label">Phụ thu phòng đơn:</span>
                          <span className="val">{formatCurrencyVND(singleRoomPrice)}</span>
                        </div>
                      )}
                      {totalAddons > 0 && (
                        <div className="breakdown-row">
                          <span className="label">Dịch vụ mở rộng:</span>
                          <span className="val">{formatCurrencyVND(totalAddons)}</span>
                        </div>
                      )}
                      {couponDiscount > 0 && (
                        <div className="breakdown-row discount-row">
                          <span className="label"><i className="fa-solid fa-tag"></i> Mã giảm giá:</span>
                          <span className="val">-{formatCurrencyVND(couponDiscount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Coupon Code Input Box */}
                    <div className="coupon-box-wrap" style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Mã giảm (SUMMER2026, VIP1000)" 
                          value={couponCode} 
                          onChange={(e) => setCouponCode(e.target.value)}
                          style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.85rem', padding: '0.65rem 0.85rem', flex: 1, borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          disabled={isCheckingCoupon}
                          onClick={handleApplyCoupon}
                          style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', borderRadius: '8px' }}
                        >
                          {isCheckingCoupon ? 'Đang kiểm tra...' : 'Áp Dụng'}
                        </button>
                      </div>
                      {couponMsg && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: couponMsg.success ? '#059669' : '#dc2626', fontWeight: 600 }}>
                          {couponMsg.text}
                        </div>
                      )}
                    </div>

                    {/* Total Price Summary Box */}
                    <div className="final-total-wrap">
                      <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>TỔNG THANH TOÁN:</div>
                      <div className="final-price-num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-forest)', margin: '0.2rem 0' }}>
                        {formatCurrencyVND(finalTotal)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-forest)', fontWeight: 600 }}>
                        <i className="fa-solid fa-circle-check"></i> Đã bao gồm 100% Thuế VAT &amp; Phí tham quan
                      </div>
                    </div>

                    {/* Payment Type Option (Full vs Deposit) */}
                    <div style={{ margin: '1.25rem 0 1.5rem', background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(5,150,105,0.2)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                        Hình thức thanh toán:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <input 
                            type="radio" 
                            name="pay-option" 
                            checked={payOption === 'full'} 
                            onChange={() => setPayOption('full')} 
                          />
                          <span>Thanh toán 100% ({formatCurrencyVND(finalTotal)})</span>
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <input 
                            type="radio" 
                            name="pay-option" 
                            checked={payOption === 'deposit'} 
                            onChange={() => setPayOption('deposit')} 
                          />
                          <span>Đặt cọc giữ chỗ 50% ({formatCurrencyVND(finalTotal * 0.5)})</span>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      disabled={isSubmitting || isSoldOut || isSeatExceeded || bookedPax === 0}
                      className="btn-primary w-full" 
                      style={{ 
                        padding: '1rem', 
                        fontSize: '1.05rem', 
                        fontWeight: 700, 
                        borderRadius: '10px', 
                        width: '100%', 
                        justifyContent: 'center', 
                        boxShadow: '0 10px 25px rgba(5,150,105,0.35)', 
                        cursor: (isSubmitting || isSoldOut || isSeatExceeded || bookedPax === 0) ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? (
                        <span><i className="fa-solid fa-spinner fa-spin"></i> Đang Xử Lý Đặt Chỗ...</span>
                      ) : (
                        <span><i className="fa-solid fa-lock"></i> {isSoldOut ? 'Ngày Này Đã Hết Chỗ' : `Tiến Hành Đặt Chỗ (${formatCurrencyVND(dueAmount)})`}</span>
                      )}
                    </button>

                    <div style={{ textAlign: 'center', margin: '0.85rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      <i className="fa-solid fa-shield-check" style={{ color: 'var(--accent-emerald)' }}></i> Cam kết hoàn tiền 100% nếu tour bị hủy do thời tiết
                    </div>

                  </div>
                </div>

              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

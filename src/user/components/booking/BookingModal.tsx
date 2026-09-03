import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOURS_DATA } from '../../../data/toursData';
import { DepartureDate } from '../../../types/tour.types';
import { getDateDetails, deductSeats, getRemainingSeats } from '../../../utils/inventoryManager';
import { formatCurrencyVND, getDayOfWeekVN } from '../../../utils/formatters';
import { useAuth } from '../../../auth/useAuth';
import { bookingService } from '../../../services/bookingService';

interface BookingModalProps {
  tourId: string | null;
  initialDate?: string | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ tourId, initialDate, onClose }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const tour = useMemo(() => {
    if (!tourId) return null;
    return TOURS_DATA.find(t => t.id === tourId) || null;
  }, [tourId]);

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
    return initialDate || (departureList[0]?.date) || '12/09/2026';
  });

  const [showAllDates, setShowAllDates] = useState<boolean>(false);

  const currentDetails = useMemo(() => {
    if (!tour) return null;
    return getDateDetails(tour.id, selectedDate);
  }, [tour, selectedDate]);

  const maxSeats = currentDetails?.seats ?? getRemainingSeats(tour?.id || '', selectedDate);
  const isSoldOut = maxSeats <= 0;

  const [adults, setAdults] = useState<number>(() => (isSoldOut ? 0 : Math.min(2, Math.max(1, maxSeats))));
  const [children, setChildren] = useState<number>(0);
  const [toddlers, setToddlers] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  const [singleRoomChoice, setSingleRoomChoice] = useState<'no' | 'yes'>('no');
  const [addonInsurance, setAddonInsurance] = useState<boolean>(false);
  const [addonPickup, setAddonPickup] = useState<boolean>(false);
  const [payOption, setPayOption] = useState<'full' | 'deposit'>('full');
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Customer details
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');
  const [customerNotes, setCustomerNotes] = useState('');

  // Autofill from user profile
  useEffect(() => {
    if (user) {
      if (user.fullName && !customerName) setCustomerName(user.fullName);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.address && !customerAddress) setCustomerAddress(user.address);
    }
  }, [user]);

  // Booking confirmed state & VietQR
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins countdown

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

  useEffect(() => {
    if (initialDate && tour) {
      const s = getRemainingSeats(tour.id, initialDate);
      setSelectedDate(initialDate);
      if (s <= 0) {
        setAdults(0);
        setChildren(0);
        setToddlers(0);
      } else {
        setAdults(Math.max(1, Math.min(2, s)));
      }
    }
  }, [initialDate, tour]);

  // Countdown timer for seat hold
  useEffect(() => {
    if (!tourId) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [tourId]);

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

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'SUMMER2026' || code === 'VIETRAVEL500') {
      setCouponDiscount(500000);
      setCouponMsg({ text: 'Áp dụng mã giảm 500.000 ₫ thành công!', success: true });
    } else if (code === 'VIP1000') {
      setCouponDiscount(1000000);
      setCouponMsg({ text: 'Áp dụng mã VIP giảm 1.000.000 ₫ thành công!', success: true });
    } else {
      setCouponDiscount(0);
      setCouponMsg({ text: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.', success: false });
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour || isSubmitting) return;
    if (isSoldOut || isSeatExceeded || bookedPax === 0) return;

    if (!isAuthenticated) {
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(`/checkout/${tour.id}?date=${selectedDate}`)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const ref = 'WT-' + Math.floor(100000 + Math.random() * 900000);
      setBookingRef(ref);
      deductSeats(tour.id, selectedDate, bookedPax);

      // Save to Database (Supabase + LocalStorage)
      await bookingService.createBooking({
        bookingCode: ref,
        userId: user?.id,
        tourId: tour.id,
        tourTitle: tour.title,
        departureDate: selectedDate,
        customerName: customerName || 'Khách hàng',
        customerPhone: customerPhone || '0901234567',
        customerEmail: customerEmail || 'guest@webtravel.vn',
        customerAddress: customerAddress || '',
        customerNotes: (customerNotes || '').trim(),
        adultsCount: adults,
        childrenCount: children,
        infantsCount: toddlers,
        singleRoomsCount: singleRoomChoice === 'yes' ? 1 : 0,
        totalAmount: finalTotal,
        paidAmount: 0,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        paymentMethod: 'vietqr',
        paymentStatus: 'pending',
        bookingStatus: 'pending'
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Lỗi khi đặt tour từ Modal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tour) return null;

  const timerMins = Math.floor(secondsRemaining / 60);
  const timerSecs = secondsRemaining % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  const vietQrUrl = `https://img.vietqr.io/image/MB-0348888999-compact2.png?amount=${dueAmount}&addInfo=${encodeURIComponent(bookingRef + ' ' + customerPhone)}&accountName=CONG%20TY%20DU%20LICH%20WEBTRAVEL`;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '1020px', width: '94%', maxHeight: '92vh', overflowY: 'auto', padding: '2rem' }}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng popup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {isSuccess ? (
          /* Payment Confirmation View */
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
            <div style={{ width: '68px', height: '68px', background: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1rem' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h2 style={{ color: '#111827', fontSize: '1.65rem', margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)' }}>
              Đã Giữ Chỗ &amp; Xác Nhận Đặt Tour Thành Công!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              Mã hồ sơ: <strong style={{ color: 'var(--accent-forest)' }}>{bookingRef}</strong> • Chuyến đi: <strong>{tour.title}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.75rem', textAlign: 'left', marginBottom: '1.75rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.85rem', color: '#111827', fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                  Thông Tin Hồ Sơ Đặt Chỗ:
                </h4>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}><strong>Người đại diện:</strong> {customerName}</p>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}><strong>Số điện thoại (Zalo):</strong> {customerPhone}</p>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}><strong>Email nhận vé:</strong> {customerEmail}</p>
                {customerAddress && <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}><strong>Địa chỉ liên hệ:</strong> {customerAddress}</p>}
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}><strong>Ngày khởi hành:</strong> {selectedDate} ({getDayOfWeekVN(selectedDate)})</p>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>
                  <strong>Số lượng khách:</strong> {adults} Người lớn {children > 0 ? `, ${children} Trẻ em` : ''} {toddlers > 0 ? `, ${toddlers} Trẻ nhỏ` : ''} {infants > 0 ? `, ${infants} Em bé` : ''}
                </p>
                <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}>
                  <strong>Số tiền thanh toán:</strong> <span style={{ color: 'var(--accent-forest)', fontWeight: 800, fontSize: '1.15rem' }}>{formatCurrencyVND(dueAmount)}</span> {payOption === 'deposit' ? '(Đặt cọc 50%)' : '(100% trọn gói)'}
                </p>
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#111827', fontSize: '1rem' }}>Quét Mã VietQR Chuyển Khoản Tự Động</h4>
                <img src={vietQrUrl} alt="VietQR Thanh Toán" style={{ maxWidth: '190px', borderRadius: '10px', border: '1.5px solid #e2e8f0', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Hệ thống tự động kích hoạt E-Ticket sau khi nhận thanh toán</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
                Hoàn Tất & Xem Vé Của Tôi
              </button>
            </div>
          </div>
        ) : (
          /* Normal 2-Column Booking Engine */
          <>
            {/* Header */}
            <div className="booking-modal-header">
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="badge badge-emerald"><i className="fa-solid fa-shield-halved"></i> Đặt Chỗ Trực Tuyến An Toàn</span>
                <span className="badge badge-forest">Mã: {tour.code || 'WT-01'}</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: '#111827', margin: '0.2rem 0' }}>
                {tour.title}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-emerald)' }}></i> {tour.destination} 
                &nbsp;|&nbsp; <i className="fa-solid fa-clock" style={{ color: 'var(--accent-emerald)' }}></i> {tour.durationDays}N{tour.durationNights}Đ 
                &nbsp;|&nbsp; <i className="fa-solid fa-hotel" style={{ color: '#f59e0b' }}></i> {tour.starRating}★ {tour.hotelSpecs?.hotelName || 'Khách sạn cao cấp'}
              </p>
            </div>

            <form id="smart-booking-form" onSubmit={handleConfirmBooking}>
              <div className="booking-modal-grid">
                
                {/* LEFT COLUMN: Step-by-Step Configuration */}
                <div className="booking-left-col">
                  
                  {/* STEP 1: Confirmed Departure Date Display & Instant Lock */}
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

                    {/* Confirmed Date Summary Banner */}
                    <div id="confirmed-date-banner" style={{ background: '#f0fdf4', border: '1.5px solid var(--accent-emerald)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'var(--accent-emerald)', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
                          <i className="fa-regular fa-calendar-check"></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                            Ngày khởi hành đã chọn:
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{getDayOfWeekVN(selectedDate)}, {selectedDate}</span>
                            <span style={{ fontSize: '0.92rem', color: 'var(--accent-forest)' }}>({formatCurrencyVND(priceAdultUnit)}/khách)</span>
                            {currentDetails?.label && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                                {currentDetails.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-emerald'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                        <i className={isSoldOut ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-user-check'}></i> 
                        {isSoldOut ? 'Đã hết chỗ' : `Còn ${maxSeats} chỗ trống`}
                      </span>
                    </div>

                    {/* Expandable Dates Grid (Balanced & Orderly) */}
                    {showAllDates && (
                      <div 
                        className="booking-dates-grid" 
                        id="booking-dates-container" 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                          gap: '0.85rem', 
                          marginTop: '0.85rem' 
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
                              {/* 1. Top Badge Slot */}
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

                              {/* 2. Day of Week & Date */}
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

                              {/* 3. Price */}
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

                              {/* 4. Seat Pill */}
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
                      <span className={`badge ${isSoldOut ? 'badge-danger' : 'badge-emerald'}`} style={{ fontSize: '0.78rem' }}>
                        {isSoldOut ? 'Hết chỗ' : `Đã chọn: ${bookedPax}/${maxSeats} chỗ`}
                      </span>
                    </div>
                    
                    <div className="passenger-tier-list">
                      {/* Tier 1: Adult */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Người Lớn (Từ 12 tuổi trở lên)</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>100% giá tour - Tiêu chuẩn giường riêng đầy đủ</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>75% giá tour - Suất ăn riêng, ngủ chung bố mẹ</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>50% giá tour - Ghế máy bay riêng, ăn ngủ cùng bố mẹ</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>500.000 ₫ - Phí bảo hiểm và phụ phí phục vụ</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '0.2rem' }}>
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

                    {/* Capacity Alert Message */}
                    {isSoldOut && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> <strong>Ngày này đã hết chỗ:</strong> Vui lòng chọn ngày khởi hành khác ở Bước 1.
                      </div>
                    )}
                    {!isSoldOut && bookedPax >= maxSeats && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> <strong>Số lượng đã đạt giới hạn:</strong> Ngày khởi hành này chỉ còn nhận tối đa {maxSeats} chỗ trống.
                      </div>
                    )}
                  </div>

                  {/* STEP 3: Single Supplement & Optional Add-ons */}
                  <div className="booking-form-section">
                    <h4 className="booking-step-title">
                      <span className="step-num">3</span> Tùy Chọn Phòng & Dịch Vụ Mở Rộng
                    </h4>
                    
                    {/* Smart Room Arrangement Box */}
                    <div id="single-room-block" style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>
                            <i className="fa-solid fa-bed" style={{ color: 'var(--accent-emerald)' }}></i> Sắp Xếp Phòng Khách Sạn
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Tiêu chuẩn: 2 khách/phòng đôi (Đã bao gồm trong giá tour).
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: singleRoomChoice === 'yes' ? '#b45309' : 'var(--accent-forest)', fontSize: '0.85rem', background: singleRoomChoice === 'yes' ? '#fef3c7' : '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          {singleRoomChoice === 'yes' ? `+${formatCurrencyVND(singleRoomPrice)}` : 'Đã bao gồm (0 ₫)'}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label className="addon-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={addonInsurance} 
                          onChange={(e) => setAddonInsurance(e.target.checked)} 
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Bảo hiểm du lịch mở rộng quốc tế</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Bồi thường tối đa 1 tỷ đồng / người</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-forest)' }}>
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
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Xe Limousine đón tiễn tận nhà (Nội thành)</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Xe cao cấp đưa đón 2 chiều thuận tiện</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-forest)' }}>
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
                        <label><i className="fa-solid fa-user"></i> Họ và Tên *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nguyễn Văn A" 
                          value={customerName} 
                          onChange={(e) => setCustomerName(e.target.value)} 
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label><i className="fa-solid fa-phone"></i> Số Điện Thoại (Zalo) *</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="0901 234 567" 
                          value={customerPhone} 
                          onChange={(e) => setCustomerPhone(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label><i className="fa-solid fa-envelope"></i> Email Nhận Vé &amp; Hợp Đồng *</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="khachhang@gmail.com" 
                          value={customerEmail} 
                          onChange={(e) => setCustomerEmail(e.target.value)} 
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label><i className="fa-solid fa-location-dot"></i> Địa Chỉ Liên Hệ *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Số nhà, đường, tỉnh/thành phố" 
                          value={customerAddress} 
                          onChange={(e) => setCustomerAddress(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      <label><i className="fa-solid fa-note-sticky"></i> Ghi chú đặc biệt (nếu có):</label>
                      <input 
                        type="text" 
                        placeholder="Ăn chay, phòng tầng cao, kỷ niệm ngày cưới..." 
                        value={customerNotes} 
                        onChange={(e) => setCustomerNotes(e.target.value)} 
                      />
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

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#111827', margin: '1rem 0 0.4rem' }}>
                      Chi Tiết Giá Tour
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                      Cập nhật tự động theo thời gian thực (Đã gồm VAT & Bảo hiểm)
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
                          style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.85rem', padding: '0.6rem 0.85rem', flex: 1, borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}
                        />
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          onClick={handleApplyCoupon}
                          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          Áp Dụng
                        </button>
                      </div>
                      {couponMsg && (
                        <div style={{ fontSize: '0.78rem', marginTop: '0.35rem', color: couponMsg.success ? '#059669' : '#dc2626', fontWeight: 600 }}>
                          {couponMsg.text}
                        </div>
                      )}
                    </div>

                    {/* Total Price Summary Box */}
                    <div className="final-total-wrap">
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG THANH TOÁN:</div>
                      <div className="final-price-num" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-forest)', margin: '0.2rem 0' }}>
                        {formatCurrencyVND(finalTotal)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-forest)', fontWeight: 600 }}>
                        <i className="fa-solid fa-circle-check"></i> Đã bao gồm 100% Thuế VAT & Phí tham quan
                      </div>
                    </div>

                    {/* Payment Type Option (Full vs Deposit) */}
                    <div style={{ margin: '1.25rem 0 1.5rem', background: '#f0fdf4', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(5,150,105,0.2)' }}>
                      <div style={{ fontVariantNumeric: 'lining-nums', fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                        Hình thức thanh toán:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                          <input 
                            type="radio" 
                            name="pay-option" 
                            checked={payOption === 'full'} 
                            onChange={() => setPayOption('full')} 
                          />
                          <span>Thanh toán 100% (Xác nhận vé ngay)</span>
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
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
                      disabled={isSoldOut || isSeatExceeded || bookedPax === 0}
                      className="btn-primary w-full" 
                      style={{ padding: '0.95rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', width: '100%', justifyContent: 'center', boxShadow: '0 10px 25px rgba(5,150,105,0.35)', cursor: (isSoldOut || isSeatExceeded || bookedPax === 0) ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="fa-solid fa-lock"></i> {isSoldOut ? 'Ngày Này Đã Hết Chỗ' : `Tiến Hành Đặt Chỗ (${formatCurrencyVND(dueAmount)})`}
                    </button>

                    <div style={{ textAlign: 'center', margin: '0.85rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-shield-check" style={{ color: 'var(--accent-emerald)' }}></i> Cam kết hoàn tiền 100% nếu tour bị hủy do thời tiết
                    </div>

                  </div>
                </div>

              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

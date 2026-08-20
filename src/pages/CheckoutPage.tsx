import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { TOURS_DATA } from '../data/toursData';
import { getDateDetails, deductSeats, getRemainingSeats } from '../utils/inventoryManager';
import { formatCurrencyVND, getDayOfWeekVN } from '../utils/formatters';
import { DepartureDate } from '../types/tour.types';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ tourId?: string }>();

  const tourIdFromQuery = params.tourId || searchParams.get('tourId') || searchParams.get('id') || TOURS_DATA[0].id;
  const initialDateFromQuery = searchParams.get('date');

  const tour = useMemo(() => TOURS_DATA.find(t => t.id === tourIdFromQuery) || TOURS_DATA[0], [tourIdFromQuery]);

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

  const [showAllDates, setShowAllDates] = useState<boolean>(false);

  const currentDetails = useMemo(() => {
    return getDateDetails(tour.id, selectedDate);
  }, [tour, selectedDate]);

  const maxSeats = currentDetails?.seats ?? getRemainingSeats(tour.id, selectedDate);
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

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Confirmation state
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins

  useEffect(() => {
    if (initialDateFromQuery) {
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

  const priceAdultUnit = currentDetails?.priceAdult || tour.priceAdult || 5800000;
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

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour) return;
    if (isSoldOut || isSeatExceeded || bookedPax === 0) return;

    const ref = 'WT-' + Math.floor(100000 + Math.random() * 900000);
    setBookingRef(ref);
    deductSeats(tour.id, selectedDate, bookedPax);
    setIsSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const timerMins = Math.floor(secondsRemaining / 60);
  const timerSecs = secondsRemaining % 60;
  const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  const vietQrUrl = `https://img.vietqr.io/image/MB-0348888999-compact2.png?amount=${dueAmount}&addInfo=${encodeURIComponent(bookingRef + ' ' + customerPhone)}&accountName=CONG%20TY%20DU%20LICH%20WEBTRAVEL`;

  return (
    <div className="checkout-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '6.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Trang Chủ</Link>
          <i className="fa-solid fa-angle-right" style={{ fontSize: '0.75rem' }}></i>
          <Link to={`/tour/${tour.id}`} style={{ color: '#64748b', textDecoration: 'none' }}>{tour.shortTitle || tour.title}</Link>
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
              Mã hồ sơ đặt vé: <strong style={{ color: 'var(--accent-forest)', fontSize: '1.15rem' }}>{bookingRef}</strong> • Chuyến đi: <strong>{tour.title}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ margin: '0 0 1rem', color: '#111827', fontSize: '1.15rem', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <i className="fa-solid fa-file-invoice" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Thông Tin Hồ Sơ Đặt Chỗ:
                </h3>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Người đại diện:</strong> {customerName}</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Số điện thoại (Zalo):</strong> {customerPhone}</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Email nhận hợp đồng:</strong> {customerEmail}</p>
                {customerIdCard && <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>CCCD / Passport:</strong> {customerIdCard}</p>}
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}><strong>Ngày khởi hành:</strong> {selectedDate} ({getDayOfWeekVN(selectedDate)})</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}>
                  <strong>Số lượng khách:</strong> {adults} Người lớn {children > 0 ? `, ${children} Trẻ em` : ''} {toddlers > 0 ? `, ${toddlers} Trẻ nhỏ` : ''} {infants > 0 ? `, ${infants} Em bé` : ''}
                </p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                  <strong>Số tiền thanh toán:</strong> <span style={{ color: 'var(--accent-forest)', fontWeight: 800, fontSize: '1.25rem' }}>{formatCurrencyVND(dueAmount)}</span> {payOption === 'deposit' ? '(Đặt cọc giữ chỗ 50%)' : '(100% trọn gói)'}
                </p>
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 0.75rem', color: '#111827', fontSize: '1.1rem' }}>
                  <i className="fa-solid fa-qrcode" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Quét Mã VietQR Chuyển Khoản Tự Động
                </h3>
                <img src={vietQrUrl} alt="VietQR Thanh Toán" style={{ maxWidth: '210px', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }} />
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.6rem 0 0' }}>
                  Hệ thống tự động kích hoạt mã vé điện tử ngay khi nhận chuyển khoản
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={`/tour/${tour.id}`} className="btn-secondary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-arrow-left"></i> Quay Lại Trang Tour
              </Link>
              <Link to="/" className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-house"></i> Về Trang Chủ WebTravel
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
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="badge badge-emerald"><i className="fa-solid fa-shield-halved"></i> Đặt Chỗ Trực Tuyến An Toàn</span>
                    <span className="badge badge-forest">Mã: {tour.code || 'WT-01'}</span>
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

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Đơn giá từ:</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
                    {formatCurrencyVND(priceAdultUnit)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/ khách</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main 2-Column Grid */}
            <form id="smart-booking-form" onSubmit={handleConfirmBooking}>
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
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                    {/* Expandable Dates Grid (Balanced & Orderly) */}
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
                              {/* 1. Top Badge / Promotion Tag Slot */}
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

                              {/* 2. Middle: Day of Week & Date */}
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

                              {/* 3. Middle: Price */}
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

                              {/* 4. Bottom: Seat Availability Pill */}
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
                    
                    <div className="passenger-tier-list">
                      {/* Tier 1: Adult */}
                      <div className="passenger-tier-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Người Lớn (Từ 12 tuổi trở lên)</div>
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
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}><i className="fa-solid fa-user"></i> Họ và Tên *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nguyễn Văn A" 
                          value={customerName} 
                          onChange={(e) => setCustomerName(e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}><i className="fa-solid fa-phone"></i> Số Điện Thoại (Zalo) *</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="0901 234 567" 
                          value={customerPhone} 
                          onChange={(e) => setCustomerPhone(e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}><i className="fa-solid fa-envelope"></i> Email Nhận Vé &amp; Hợp Đồng *</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="khachhang@gmail.com" 
                          value={customerEmail} 
                          onChange={(e) => setCustomerEmail(e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}><i className="fa-solid fa-id-card"></i> Số CCCD / Hộ Chiếu</label>
                        <input 
                          type="text" 
                          placeholder="12 chữ số CCCD hoặc Passport" 
                          value={customerIdCard} 
                          onChange={(e) => setCustomerIdCard(e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem', display: 'block' }}><i className="fa-solid fa-note-sticky"></i> Ghi chú đặc biệt (nếu có):</label>
                      <input 
                        type="text" 
                        placeholder="Ăn chay, phòng tầng cao, kỷ niệm ngày cưới..." 
                        value={customerNotes} 
                        onChange={(e) => setCustomerNotes(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
                          onClick={handleApplyCoupon}
                          style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', borderRadius: '8px' }}
                        >
                          Áp Dụng
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
                          <span>Thanh toán 100% (Xác nhận vé ngay)</span>
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
                      disabled={isSoldOut || isSeatExceeded || bookedPax === 0}
                      className="btn-primary w-full" 
                      style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: '10px', width: '100%', justifyContent: 'center', boxShadow: '0 10px 25px rgba(5,150,105,0.35)', cursor: (isSoldOut || isSeatExceeded || bookedPax === 0) ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="fa-solid fa-lock"></i> {isSoldOut ? 'Ngày Này Đã Hết Chỗ' : `Tiến Hành Đặt Chỗ (${formatCurrencyVND(dueAmount)})`}
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

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TOURS_DATA } from '../../data/toursData';
import { tourService } from '../../services/tourService';
import { Tour } from '../../types/tour.types';
import { getDatePrice, getRemainingSeats, getDateDetails } from '../../utils/inventoryManager';
import { formatCurrencyVND } from '../../utils/formatters';
import { HeroGallery } from './detail-sections/HeroGallery';
import { ScheduleCalendar } from './detail-sections/ScheduleCalendar';
import { ItineraryTimeline } from './detail-sections/ItineraryTimeline';
import { HighlightsAndHotel, ServicesAndPolicies } from './detail-sections/HotelAndPolicies';
import { ETicketModal } from '../components/tour/ETicketModal';

export const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tour, setTour] = useState<Tour | null>(() => {
    if (!id) return TOURS_DATA.length > 0 ? TOURS_DATA[0] : null;
    return tourService.getTourByIdSync(id) || TOURS_DATA.find(t => t.id === id || t.slug === id) || (TOURS_DATA.length > 0 ? TOURS_DATA[0] : null);
  });

  useEffect(() => {
    if (id) {
      const local = tourService.getTourByIdSync(id) || TOURS_DATA.find(t => t.id === id || t.slug === id);
      if (local) {
        setTour(local);
        if (local.slug && local.slug !== id) {
          navigate(`/tour/${local.slug}`, { replace: true });
        }
      }

      tourService.getTourById(id).then(fetched => {
        if (fetched) {
          setTour(fetched);
          if (fetched.slug && fetched.slug !== id) {
            navigate(`/tour/${fetched.slug}`, { replace: true });
          }
        }
      });
    }
  }, [id, navigate]);

  const defaultFirstDate = tour?.departureDates?.[0]?.date || tour?.availableDates?.[0] || '12/09/2026';
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string | null>(defaultFirstDate);
  const [isETicketOpen, setIsETicketOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('section-schedule');

  useEffect(() => {
    if (tour) {
      const first = tour.departureDates?.[0]?.date || tour.availableDates?.[0] || '12/09/2026';
      setSelectedDepartureDate(first);
    }
  }, [tour]);

  if (!tour) {
    return (
      <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <i className="fa-solid fa-compass" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem' }}></i>
        <h2 style={{ color: '#111827' }}>Không tìm thấy hành trình</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Hành trình bạn tìm kiếm có thể đã kết thúc hoặc không tồn tại.</p>
        <Link to="/" className="btn-primary">
          <i className="fa-solid fa-arrow-left"></i> Về Danh Sách Tour
        </Link>
      </div>
    );
  }

  const currentDateDetails = selectedDepartureDate ? getDateDetails(tour.id, selectedDepartureDate, tour) : null;
  const currentPrice = selectedDepartureDate ? getDatePrice(tour.id, selectedDepartureDate, tour) : tour.priceAdult;
  const currentSeats = selectedDepartureDate ? getRemainingSeats(tour.id, selectedDepartureDate) : tour.seatsLeft;
  const isSoldOut = currentSeats <= 0;

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenBooking = () => {
    const targetDate = selectedDepartureDate || defaultFirstDate;
    navigate(`/checkout/${tour.id}?date=${encodeURIComponent(targetDate)}`);
  };

  return (
    <div className="tour-detail-page tour-detail-body" style={{ background: '#f9fafb', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* 1. TOP BREADCRUMB & HEADER INFO (Original Legacy Structure) */}
      <div className="container" style={{ paddingTop: '6.5rem', paddingBottom: '0.5rem' }}>
        <div className="detail-breadcrumb" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="fa-solid fa-house"></i> Trang Chủ
          </Link> 
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
          <Link to="/#tours-explorer" style={{ color: '#64748b', textDecoration: 'none' }}>Hành Trình</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
          <Link to="/#tours-explorer" style={{ color: '#64748b', textDecoration: 'none' }}>
            {tour.category === 'domestic' ? 'Trong Nước' : 'Quốc Tế'}
          </Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
          <span style={{ color: '#111827', fontWeight: 600 }}>{tour.destination}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge ${tour.tier === 'luxury' ? 'badge-gold' : 'badge-emerald'}`}>
                <i className="fa-solid fa-crown" style={{ marginRight: '0.3rem' }}></i> {tour.tierName || 'Dòng Tiêu Chuẩn'}
              </span>
              {tour.departureDates?.some(d => d.label && (d.label.includes('Lễ') || d.label.includes('Tết') || d.label.includes('Quốc Khánh') || d.label.includes('Giáng Sinh') || d.label.includes('Năm Mới'))) && (
                <span className="badge" style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: 800 }}>
                  🎉 Có Lịch Đại Lễ &amp; Tết
                </span>
              )}
              <span className="badge badge-forest" style={{ background: '#f8fafc', color: '#111827', border: '1px solid var(--glass-border)' }}>
                Mã Tour: <strong>{tour.code}</strong> {tour.sku ? `(SKU: ${tour.sku})` : ''}
              </span>
              <span className="detail-rating-pill" style={{ background: '#fffbeb', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #fef3c7' }}>
                <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginRight: '0.3rem' }}></i> {tour.rating} ({tour.reviewsCount || 128} đánh giá)
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#111827', lineHeight: 1.25, margin: '0.4rem 0' }}>
              {tour.title}
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', margin: 0 }}>
              <span><i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-emerald)', marginRight: '0.3rem' }}></i> <strong>Điểm đến:</strong> {tour.destination}</span>
              <span>•</span>
              <span><i className="fa-solid fa-plane-departure" style={{ color: 'var(--accent-emerald)', marginRight: '0.3rem' }}></i> <strong>Nơi khởi hành:</strong> {tour.departureFrom || 'Hà Nội / TP.HCM'}</span>
            </p>
          </div>
        </div>

        {/* 2. MULTI-IMAGE GALLERY SHOWCASE */}
        <HeroGallery tour={tour} />

        {/* 3. QUICK SPECS BAR (4 Cards) */}
        <div className="detail-quick-specs-bar" style={{ marginTop: '1.5rem' }}>
          <div className="spec-card">
            <i className="fa-regular fa-clock icon"></i>
            <div>
              <span className="label">Thời Gian</span>
              <span className="val">{tour.durationDays} Ngày {tour.durationNights} Đêm</span>
            </div>
          </div>

          <div className="spec-card">
            <i className="fa-solid fa-plane-departure icon"></i>
            <div>
              <span className="label">Phương Tiện</span>
              <span className="val">{tour.category === 'international' ? 'Máy bay khứ hồi 5★' : 'Vé máy bay & Limousine'}</span>
            </div>
          </div>

          <div className="spec-card">
            <i className="fa-solid fa-hotel icon"></i>
            <div>
              <span className="label">Tiêu Chuẩn Lưu Trú</span>
              <span className="val">{tour.hotelTier || `${tour.starRating}★ Hotel`}</span>
            </div>
          </div>

          <div className="spec-card">
            <i className="fa-regular fa-calendar-check icon"></i>
            <div>
              <span className="label">Lịch Khởi Hành</span>
              <span className="val">{tour.departureSchedule || 'Hàng tuần'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DETAIL STICKY NAVIGATION TABS */}
      <div className="detail-sticky-tabs-bar">
        <div className="container">
          <nav className="detail-tabs-list">
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-schedule' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-schedule')}
            >
              <i className="fa-solid fa-calendar-days"></i> Lịch Khởi Hành
            </button>
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-highlights' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-highlights')}
            >
              <i className="fa-solid fa-sparkles"></i> Điểm Nhấn
            </button>
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-hotel' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-hotel')}
            >
              <i className="fa-solid fa-hotel"></i> Khách Sạn & Tiện Ích
            </button>
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-itinerary' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-itinerary')}
            >
              <i className="fa-solid fa-route"></i> Lịch Trình Chi Tiết
            </button>
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-services' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-services')}
            >
              <i className="fa-solid fa-list-check"></i> Tiêu Chuẩn Dịch Vụ
            </button>
            <button 
              type="button" 
              className={`detail-tab-link ${activeTab === 'section-policy' ? 'active' : ''}`}
              onClick={() => scrollToSection('section-policy')}
            >
              <i className="fa-solid fa-shield-halved"></i> Chính Sách & Hoàn Hủy
            </button>
            {tour.faqs && tour.faqs.length > 0 && (
              <button 
                type="button" 
                className={`detail-tab-link ${activeTab === 'section-faqs' ? 'active' : ''}`}
                onClick={() => scrollToSection('section-faqs')}
              >
                <i className="fa-solid fa-circle-question"></i> Hỏi Đáp FAQs
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* 5. MAIN 2-COLUMN LAYOUT */}
      <div className="container detail-main-layout">
        
        {/* LEFT ARTICLE BODY (8 Cols) */}
        <article className="detail-article-body">
          <ScheduleCalendar
            tour={tour}
            selectedDate={selectedDepartureDate}
            onSelectDate={setSelectedDepartureDate}
          />

          <HighlightsAndHotel tour={tour} />

          <ItineraryTimeline tour={tour} />

          <ServicesAndPolicies tour={tour} />
        </article>

        {/* RIGHT SIDEBAR (4 Cols): Sticky Booking & Rate Card */}
        <aside className="detail-sidebar-col">
          <div className="detail-price-card" style={{ position: 'sticky', top: '140px', border: '1.5px solid rgba(5, 150, 105, 0.25)', boxShadow: '0 10px 30px rgba(5, 150, 105, 0.06)', padding: '1.5rem', borderRadius: '16px', background: '#ffffff' }}>
            
            {/* Price Header & Date Pill */}
            <div style={{ borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', fontSize: '0.95rem', color: '#475569', fontWeight: 700 }}>
                  <span>Giá:</span>
                  <span className="price-big" id="sidebar-price-display" style={{ color: 'var(--accent-forest)', fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums', verticalAlign: 'baseline' }}>
                    {formatCurrencyVND(currentPrice)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                  <button 
                    type="button" 
                    className="badge" 
                    onClick={() => scrollToSection('section-schedule')}
                    style={{ background: '#ecfdf5', color: 'var(--accent-forest)', fontWeight: 800, fontSize: '0.85rem', padding: '0.4rem 0.85rem', borderRadius: '9999px', border: '1px solid rgba(5, 150, 105, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'var(--transition-fast)' }}
                  >
                    <span>{selectedDepartureDate || 'Chưa chọn ngày'} <i className="fa-solid fa-calendar-days" style={{ fontSize: '0.75rem' }}></i></span>
                  </button>
                  {currentDateDetails?.label && (
                    <span 
                      style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '6px', 
                        background: currentDateDetails.label.includes('Lễ') || currentDateDetails.label.includes('Tết') || currentDateDetails.label.includes('Quốc Khánh') || currentDateDetails.label.includes('Giáng Sinh') || currentDateDetails.label.includes('Năm Mới') ? '#fff1f2' : '#eff6ff', 
                        color: currentDateDetails.label.includes('Lễ') || currentDateDetails.label.includes('Tết') || currentDateDetails.label.includes('Quốc Khánh') || currentDateDetails.label.includes('Giáng Sinh') || currentDateDetails.label.includes('Năm Mới') ? '#e11d48' : '#1d4ed8',
                        border: currentDateDetails.label.includes('Lễ') || currentDateDetails.label.includes('Tết') || currentDateDetails.label.includes('Quốc Khánh') || currentDateDetails.label.includes('Giáng Sinh') || currentDateDetails.label.includes('Năm Mới') ? '1px solid #fecdd3' : '1px solid #bfdbfe',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {currentDateDetails.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Specs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}><i className="fa-solid fa-ticket" style={{ color: 'var(--accent-emerald)', width: '18px' }}></i> Mã tour:</span>
                <strong style={{ color: 'var(--accent-forest)', fontFamily: 'monospace', fontSize: '0.86rem' }}>{currentDateDetails?.sku || tour.sku || tour.code}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}><i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-emerald)', width: '18px' }}></i> Khởi hành:</span>
                <strong style={{ color: '#111827' }}>{tour.departureFrom ? tour.departureFrom.split('/')[0].trim() : 'TP. Hồ Chí Minh'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}><i className="fa-solid fa-clock" style={{ color: '#d97706', width: '18px' }}></i> Thời gian:</span>
                <strong style={{ color: '#111827' }}>{tour.durationDays} ngày {tour.durationNights} đêm</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}><i className="fa-solid fa-user-group" style={{ color: 'var(--accent-emerald)', width: '18px' }}></i> Số chỗ còn:</span>
                <strong style={{ color: isSoldOut ? '#dc2626' : 'var(--accent-forest)' }}>
                  {isSoldOut ? 'Hết chỗ' : `Còn ${currentSeats} chỗ`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}><i className="fa-solid fa-award" style={{ color: 'var(--accent-emerald)', width: '18px' }}></i> Chỉ số:</span>
                <strong style={{ color: 'var(--accent-forest)', fontSize: '0.84rem' }}>
                  LEI: {tour.leiScore ? tour.leiScore.split('/')[0] : '72'}/100 | ESG: {tour.esgScore ? tour.esgScore.split('/')[0] : '90'}/100
                </strong>
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button 
                type="button"
                className="btn-primary w-full" 
                id="btn-open-booking-modal" 
                disabled={isSoldOut}
                onClick={handleOpenBooking}
                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important', border: 'none !important', color: '#ffffff !important', fontWeight: 800, fontSize: '1.05rem', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-full)', boxShadow: '0 8px 25px rgba(5, 150, 105, 0.35)', cursor: isSoldOut ? 'not-allowed' : 'pointer', transition: 'all 0.25s ease', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
              >
                <i className="fa-solid fa-calendar-check"></i> {isSoldOut ? 'Đã Hết Chỗ' : (selectedDepartureDate ? 'Đặt Tour Ngay' : 'Chọn ngày khởi hành')}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.86rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setIsETicketOpen(true)}
              >
                <i className="fa-solid fa-ticket"></i> Xem Mẫu Vé Điện Tử (E-Ticket)
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Tổng đài hỗ trợ miễn phí: <strong>1800 646 888</strong> (24/7)
            </div>

          </div>
        </aside>

      </div>

      {/* E-Ticket Preview Modal */}
      {isETicketOpen && (
        <ETicketModal
          tour={tour}
          departureDate={selectedDepartureDate || defaultFirstDate}
          onClose={() => setIsETicketOpen(false)}
        />
      )}
    </div>
  );
};

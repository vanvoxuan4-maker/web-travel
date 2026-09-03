import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SlideData {
  id: string;
  tourId: string;
  badge: string;
  badgeStyle: string;
  title: string;
  offer: string;
  ctaText: string;
  image: string;
  targetKeyword: string;
}

const SLIDES: SlideData[] = [
  {
    id: 'slide-danang',
    tourId: 'tour-danang-03',
    badge: '✨ DI SẢN MIỀN TRUNG',
    badgeStyle: 'badge-emerald',
    title: 'Đà Nẵng – Kỳ Quan Cầu Vàng & Bà Nà Hills',
    offer: 'Check-in Cầu Vàng Bàn Tay Khổng Lồ, ngắm biển Mỹ Khê & phố cổ Hội An – Tặng vé Cáp treo Bà Nà Hills',
    ctaText: 'Khám Phá Tour Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1920&q=85',
    targetKeyword: 'Đà Nẵng'
  },
  {
    id: 'slide-halong',
    tourId: 'tour-halong-01',
    badge: '🔥 DU THUYỀN 5★ CAO CẤP',
    badgeStyle: 'badge-emerald',
    title: 'Khám Phá Kỳ Quan Vịnh Hạ Long',
    offer: 'Hải trình du thuyền 5 sao đẳng cấp thế giới – Giảm ngay 1.000.000 ₫ & Tặng Sunset Party tầng thượng',
    ctaText: 'Săn Deal Hạ Long 5★',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1920&q=85',
    targetKeyword: 'Hạ Long'
  },
  {
    id: 'slide-phuquoc',
    tourId: 'tour-phuquoc-03',
    badge: '🏝️ NGHỈ DƯỠNG BIỂN ĐẢO',
    badgeStyle: 'badge-emerald',
    title: 'Thiên Đường Biển Đảo Phú Quốc & Hòn Thơm',
    offer: 'Nghỉ dưỡng Resort 5★ ven biển – Tặng vé cáp treo vượt biển Sun World & Show diễn Sunset Town',
    ctaText: 'Đặt Tour Phú Quốc',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    targetKeyword: 'Phú Quốc'
  },
  {
    id: 'slide-japan',
    tourId: 'tour-japan-04',
    badge: '🍂 MÙA THU NHẬT BẢN 2026',
    badgeStyle: 'badge-gold',
    title: 'Sắc Vàng Rực Rỡ Thu Cố Đô Nhật Bản',
    offer: 'Tokyo - Núi Phú Sĩ - Kyoto - Osaka: Miễn phí thủ tục Visa & Tắm Onsen khoáng nóng truyền thống',
    ctaText: 'Khám Phá Nhật Bản',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1920&q=85',
    targetKeyword: 'Tokyo'
  }
];

interface HeroSliderProps {
  departure: string;
  onDepartureChange: (val: string) => void;
  keyword: string;
  onKeywordChange: (val: string) => void;
  category: 'all' | 'domestic' | 'international';
  onCategoryChange: (val: 'all' | 'domestic' | 'international') => void;
  onBookDeal?: (tourId: string) => void;
}

// Helper: calculate tomorrow's date string (YYYY-MM-DD)
const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const HeroSlider: React.FC<HeroSliderProps> = ({
  departure,
  onDepartureChange,
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  onBookDeal
}) => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [departureDate, setDepartureDate] = useState<string>(getTomorrowDateString);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destWrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const POPULAR_DESTINATIONS = [
    'Đà Nẵng - Hội An',
    'Vịnh Hạ Long',
    'Phú Quốc',
    'Sapa - Fansipan',
    'Đà Lạt',
    'Nha Trang',
    'Tokyo (Nhật Bản)',
    'Seoul (Hàn Quốc)',
    'Bangkok (Thái Lan)',
    'Châu Âu 5 Nước'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (destWrapRef.current && !destWrapRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  const slide = SLIDES[currentIdx];

  const handlePrev = () => {
    setCurrentIdx(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIdx(prev => (prev + 1) % SLIDES.length);
  };

  // Perform search navigation to /tours catalog
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (category !== 'all') params.set('category', category);
    if (departure !== 'all') params.set('departure', departure);
    if (departureDate) params.set('date', departureDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/tours${queryString}`);
  };

  return (
    <div className="homepage-hero-wrapper">
      {/* ── 1. Grand Hero Banner ── */}
      <section 
        className="hero-section" 
        id="hero-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image Slides Layer */}
        <div className="hero-bg-slides-wrapper" id="hero-bg-slides">
          {SLIDES.map((s, idx) => (
            <div
              key={s.id}
              className={`hero-bg-slide ${idx === currentIdx ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${s.image})`
              }}
              aria-hidden={idx !== currentIdx}
            />
          ))}
          <div className="hero-overlay-gradient" />
        </div>

        {/* Manual Prev / Next Chevron Navigation */}
        <button 
          type="button" 
          className="hero-nav-arrow hero-nav-prev" 
          onClick={handlePrev}
          aria-label="Previous Slide"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <button 
          type="button" 
          className="hero-nav-arrow hero-nav-next" 
          onClick={handleNext}
          aria-label="Next Slide"
        >
          <i className="fa-solid fa-chevron-right" />
        </button>

        {/* Hero Content Information */}
        <div className="hero-content container" id="hero-content-box">
          <div className="hero-badge-row">
            <span className={`hero-editorial-badge ${slide.badgeStyle}`} id="hero-slide-badge">
              {slide.badge}
            </span>
          </div>

          <h1 className="hero-title hero-title-white" id="hero-slide-title">
            {slide.title}
          </h1>

          <p className="hero-subtitle hero-subtitle-white" id="hero-slide-offer">
            {slide.offer}
          </p>

          {/* CTA Quick Deal Button */}
          <div className="hero-cta-row">
            <button 
              type="button"
              className="btn-primary hero-cta-btn" 
              id="hero-slide-cta" 
              onClick={() => {
                if (onBookDeal) onBookDeal(slide.tourId);
                else navigate(`/tours?q=${encodeURIComponent(slide.targetKeyword)}`);
              }}
            >
              <i className="fa-solid fa-fire" /> <span>{slide.ctaText}</span>
            </button>
            <button
              type="button"
              className="hero-explore-btn"
              onClick={() => navigate('/tours')}
            >
              <i className="fa-solid fa-compass" /> Xem Tất Cả Tour
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="hero-slider-dots" id="slider-dots">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`hero-dot ${idx === currentIdx ? 'active' : ''}`}
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Banner ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Top Prominent Search Island Bar (Vietravel / OTA Official Style) ── */}
      <section className="homepage-search-section" aria-label="Tìm kiếm tour">
        <div className="container">
          <form className="homepage-search-island" onSubmit={handlePerformSearch}>
            {/* Top Row: Radio Toggles + 3 Pill Fields + Search CTA */}
            <div className="vt-search-form-row">
              {/* Radio Group: Trong nước / Nước ngoài */}
              <div className="vt-radio-group">
                <label className="vt-radio-label">
                  <input
                    type="radio"
                    name="vt-scope"
                    className="vt-radio-input"
                    checked={category === 'domestic' || category === 'all'}
                    onChange={() => onCategoryChange('domestic')}
                  />
                  <span>Trong nước</span>
                </label>
                <label className="vt-radio-label">
                  <input
                    type="radio"
                    name="vt-scope"
                    className="vt-radio-input"
                    checked={category === 'international'}
                    onChange={() => onCategoryChange('international')}
                  />
                  <span>Nước ngoài</span>
                </label>
              </div>

              {/* Pill 1: Điểm khởi hành */}
              <div className="vt-pill-field">
                <div className="vt-pill-icon-wrap">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <div className="vt-pill-content">
                  <span className="vt-pill-label">Điểm khởi hành</span>
                  <select
                    id="vt-search-departure"
                    value={departure}
                    onChange={(e) => onDepartureChange(e.target.value)}
                    className="vt-pill-select"
                  >
                    <option value="all">Tất cả</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                  </select>
                </div>
                {departure !== 'all' && (
                  <button
                    type="button"
                    className="vt-pill-clear-btn"
                    onClick={() => onDepartureChange('all')}
                    title="Xóa điểm đi"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>

              {/* Pill 2: Điểm đến */}
              <div className="vt-pill-field" style={{ flex: 1.25 }} ref={destWrapRef}>
                <div className="vt-pill-icon-wrap">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <div className="vt-pill-content">
                  <span className="vt-pill-label">Điểm đến</span>
                  <input
                    type="text"
                    id="vt-search-keyword"
                    placeholder="Địa điểm bất kỳ..."
                    value={keyword}
                    onFocus={() => setShowDestDropdown(true)}
                    onChange={(e) => {
                      onKeywordChange(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    className="vt-pill-input"
                    autoComplete="off"
                  />
                </div>
                {keyword && (
                  <button
                    type="button"
                    className="vt-pill-clear-btn"
                    onClick={() => {
                      onKeywordChange('');
                      setShowDestDropdown(true);
                    }}
                    title="Xóa từ khóa"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}

                {/* Quick Autocomplete Destination Popover */}
                {showDestDropdown && (
                  <div className="vt-dest-dropdown">
                    <div className="vt-dest-title">
                      <i className="fa-solid fa-fire" style={{ color: '#f59e0b' }} />
                      <span>Điểm đến phổ biến</span>
                    </div>
                    <div className="vt-dest-chips">
                      {POPULAR_DESTINATIONS.filter(d => !keyword || d.toLowerCase().includes(keyword.toLowerCase())).map((dest, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="vt-dest-chip-item"
                          onClick={() => {
                            onKeywordChange(dest);
                            setShowDestDropdown(false);
                          }}
                        >
                          <i className="fa-solid fa-location-pin" style={{ color: '#047857', fontSize: '0.75rem' }} />
                          <span>{dest}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pill 3: Ngày đi */}
              <div className="vt-pill-field">
                <div className="vt-pill-icon-wrap">
                  <i className="fa-regular fa-calendar-days" />
                </div>
                <div className="vt-pill-content">
                  <span className="vt-pill-label">Ngày đi</span>
                  <input
                    type="date"
                    id="vt-search-date"
                    className="vt-pill-input"
                    value={departureDate}
                    min={getTomorrowDateString()}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    style={{ fontWeight: 700, color: '#047857', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Pill 4: Nút Tìm Kiếm CTA */}
              <button
                type="submit"
                className="vt-search-cta-btn"
                id="btn-vt-search-submit"
              >
                <i className="fa-solid fa-magnifying-glass" />
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Bottom Row: Tìm kiếm nổi bật (Featured Trending Tags) */}
            <div className="vt-trending-tags-row">
              <span className="vt-trending-label">Tìm kiếm nổi bật:</span>
              <div className="vt-tags-scroll-wrap">
                {[
                  { label: 'Thưởng Nguyệt Á Đông', query: 'Á Đông', cat: 'international' },
                  { label: 'TOUR LỄ 2/9', query: 'Lễ 2/9', cat: 'domestic' },
                  { label: 'TOUR THU ĐÔNG', query: 'Thu Đông', cat: 'all' },
                  { label: 'TOUR CHÂU ÂU', query: 'Châu Âu', cat: 'international' },
                  { label: 'TOUR MỸ', query: 'Mỹ', cat: 'international' },
                  { label: 'TOUR XUYÊN VIỆT', query: 'Xuyên Việt', cat: 'domestic' },
                  { label: 'TOUR CAO CẤP', query: '5 Sao', cat: 'all' },
                  { label: 'DU THUYỀN HẠ LONG', query: 'Hạ Long', cat: 'domestic' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="vt-featured-chip"
                    onClick={() => {
                      onKeywordChange(item.query);
                      if (item.cat !== 'all') onCategoryChange(item.cat as any);
                      navigate(`/tours?q=${encodeURIComponent(item.query)}${item.cat !== 'all' ? `&category=${item.cat}` : ''}`);
                    }}
                  >
                    <i className="fa-regular fa-star" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};



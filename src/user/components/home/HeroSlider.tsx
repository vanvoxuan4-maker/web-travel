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
    title: 'Đà Nẵng – Cầu Rồng Rực Rỡ & Bà Nà Hills',
    offer: 'Chiêm ngưỡng Cầu Rồng phun lửa, ngắm biển Mỹ Khê & phố cổ Hội An – Tặng vé Cáp treo Bà Nà Hills',
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
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85',
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
  starTier: 'all' | 'budget' | 'standard' | 'luxury';
  onStarTierChange: (val: 'all' | 'budget' | 'standard' | 'luxury') => void;
  onBookDeal?: (tourId: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  departure,
  onDepartureChange,
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  starTier,
  onStarTierChange,
  onBookDeal
}) => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [duration, setDuration] = useState<'all' | '1-3' | '4-6' | '7+'>('all');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Perform robust search navigation to /tours catalog
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (category !== 'all') params.set('category', category);
    if (departure !== 'all') params.set('departure', departure);
    if (starTier !== 'all') params.set('tier', starTier);
    if (duration !== 'all') params.set('duration', duration);
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
                backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(6, 78, 59, 0.65) 65%, rgba(4, 47, 46, 0.88) 100%), url('${s.image}')`
              }}
            />
          ))}
        </div>

        {/* Carousel Arrow Buttons */}
        <button 
          type="button" 
          className="hero-slider-arrow prev" 
          id="slider-prev" 
          onClick={handlePrev} 
          aria-label="Banner trước"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          type="button" 
          className="hero-slider-arrow next" 
          id="slider-next" 
          onClick={handleNext} 
          aria-label="Banner sau"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>

        {/* Content Overlay */}
        <div className="container hero-content-overlay">
          <span 
            className={`hero-promo-badge badge ${slide.badgeStyle}`} 
            id="hero-slide-badge"
          >
            {slide.badge}
          </span>

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
              <i className="fa-solid fa-fire"></i> <span>{slide.ctaText}</span>
            </button>
            <button
              type="button"
              className="hero-explore-btn"
              onClick={() => navigate('/tours')}
            >
              <i className="fa-solid fa-compass"></i> Xem Tất Cả Tour
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

      {/* ── 2. Top Prominent Search Island Bar (Vietravel Style on Homepage) ── */}
      <section className="homepage-search-section" aria-label="Tìm kiếm tour">
        <div className="container">
          <form className="homepage-search-island" onSubmit={handlePerformSearch}>
            {/* Category Tabs */}
            <div className="vt-search-tabs">
              <button
                type="button"
                className={`vt-search-tab ${category === 'all' ? 'active' : ''}`}
                onClick={() => onCategoryChange('all')}
              >
                🌐 Tất Cả Tour
              </button>
              <button
                type="button"
                className={`vt-search-tab ${category === 'domestic' ? 'active' : ''}`}
                onClick={() => onCategoryChange('domestic')}
              >
                🇻🇳 Tour Trong Nước
              </button>
              <button
                type="button"
                className={`vt-search-tab ${category === 'international' ? 'active' : ''}`}
                onClick={() => onCategoryChange('international')}
              >
                ✈️ Tour Quốc Tế
              </button>
            </div>

            {/* Input Controls Grid (5 Columns) */}
            <div className="homepage-search-grid">
              {/* Field 1: Departure */}
              <div className="home-search-field">
                <span className="home-field-label">
                  <i className="fa-solid fa-plane-departure" style={{ color: '#059669' }}></i> Nơi khởi hành
                </span>
                <select
                  id="home-search-departure"
                  value={departure}
                  onChange={(e) => onDepartureChange(e.target.value)}
                  className="home-field-select"
                >
                  <option value="all">Tất cả điểm đi</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              {/* Field 2: Destination Keyword */}
              <div className="home-search-field home-field-keyword">
                <span className="home-field-label">
                  <i className="fa-solid fa-location-dot" style={{ color: '#059669' }}></i> Bạn muốn đi đâu?
                </span>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    id="home-search-keyword"
                    placeholder="Hạ Long, Đà Nẵng, Phú Quốc, Tokyo..."
                    value={keyword}
                    onChange={(e) => onKeywordChange(e.target.value)}
                    className="home-field-input"
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => onKeywordChange('')}
                      className="home-clear-btn"
                      aria-label="Xóa từ khóa"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              </div>

              {/* Field 3: Duration */}
              <div className="home-search-field">
                <span className="home-field-label">
                  <i className="fa-regular fa-clock" style={{ color: '#059669' }}></i> Số ngày đi
                </span>
                <select
                  id="home-search-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                  className="home-field-select"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="1-3">1 - 3 ngày (Ngắn)</option>
                  <option value="4-6">4 - 6 ngày (Vừa)</option>
                  <option value="7+">7+ ngày (Dài ngày)</option>
                </select>
              </div>

              {/* Field 4: Tier */}
              <div className="home-search-field">
                <span className="home-field-label">
                  <i className="fa-solid fa-crown" style={{ color: '#f59e0b' }}></i> Dòng tour
                </span>
                <select
                  id="home-search-tier"
                  value={starTier}
                  onChange={(e) => onStarTierChange(e.target.value as any)}
                  className="home-field-select"
                >
                  <option value="all">Tất cả dòng tour</option>
                  <option value="luxury">👑 5★ Cao Cấp</option>
                  <option value="standard">🌟 4★ Tiêu Chuẩn</option>
                  <option value="budget">🏷️ 3★ Tiết Kiệm</option>
                </select>
              </div>

              {/* Field 5: Submit CTA */}
              <button
                type="submit"
                className="home-search-submit-btn"
                id="btn-home-search-submit"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Tìm Kiếm Tour</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

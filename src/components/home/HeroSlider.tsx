import React, { useState, useEffect, useRef } from 'react';

interface SlideData {
  id: string;
  tourId: string;
  badge: string;
  badgeStyle: string;
  title: string;
  offer: string;
  ctaText: string;
  image: string;
}

const SLIDES: SlideData[] = [
  {
    id: 'slide-halong',
    tourId: 'tour-halong-01',
    badge: '🔥 HOT DEAL MÙA HÈ',
    badgeStyle: 'badge-emerald',
    title: 'Khám Phá Thế Giới Theo Cách Của Bạn',
    offer: 'Vịnh Hạ Long: Du Thuyền 5 Sao Sang Trọng - Giảm 1.000.000 ₫ & Tặng Sunset Party tầng thượng',
    ctaText: 'Săn Deal Hạ Long 5★',
    image: '/images/banner_halong.png'
  },
  {
    id: 'slide-japan',
    tourId: 'tour-japan-04',
    badge: '🍂 MÙA THU NHẬT BẢN 2026',
    badgeStyle: 'badge-gold',
    title: 'Sắc Vàng Rực Rỡ Thu Cố Đô Nhật Bản',
    offer: 'Tokyo - Phú Sĩ - Kyoto - Osaka: Miễn phí Visa & Tắm Onsen khoáng nóng Núi Phú Sĩ',
    ctaText: 'Khám Phá Nhật Bản',
    image: '/images/banner_japan.png'
  },
  {
    id: 'slide-phuquoc',
    tourId: 'tour-phuquoc-03',
    badge: '🏝️ LUXURY RESORT 5★',
    badgeStyle: 'badge-emerald',
    title: 'Thiên Đường Biển Đảo Phú Quốc & Hòn Thơm',
    offer: 'Nghỉ dưỡng Vinpearl 5★ - Tặng vé cáp treo Sun World & Xe điện đón Grand World',
    ctaText: 'Đặt Tour Phú Quốc',
    image: '/images/banner_phuquoc.png'
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
  onBookDeal: (tourId: string) => void;
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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
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

  const scrollToExplorer = () => {
    const el = document.getElementById('tours-explorer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
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
              backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.78) 100%), url('${s.image}')`
            }}
          />
        ))}
      </div>

      {/* Left / Right Carousel Arrow Buttons */}
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
          style={{ marginBottom: '1rem' }}
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
        <div style={{ marginBottom: '2.25rem' }}>
          <button 
            type="button"
            className="btn-primary" 
            id="hero-slide-cta" 
            onClick={() => onBookDeal(slide.tourId)}
            style={{ padding: '0.85rem 1.85rem', fontSize: '1rem', fontWeight: 700, boxShadow: '0 10px 25px rgba(5, 150, 105, 0.5)' }}
          >
            <i className="fa-solid fa-fire"></i> <span>{slide.ctaText}</span>
          </button>
        </div>

        {/* Multi-Field Search Engine Widget */}
        <div 
          className="hero-search-box" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1.2fr 1fr 1fr auto', 
            gap: '0.75rem', 
            background: 'rgba(255,255,255,0.98)', 
            padding: '0.85rem 1.25rem', 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', 
            alignItems: 'center', 
            textAlign: 'left' 
          }}
        >
          {/* Field 1: Departure */}
          <div className="search-input-wrap" style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '0.75rem' }}>
            <i className="fa-solid fa-plane-departure" style={{ color: 'var(--accent-emerald)' }}></i>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Nơi khởi hành
              </span>
              <select 
                id="search-departure"
                value={departure}
                onChange={(e) => onDepartureChange(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', padding: '0.1rem 0', cursor: 'pointer' }}
              >
                <option value="all">Tất cả điểm đi</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP.HCM">TP. Hồ Chí Minh</option>
              </select>
            </div>
          </div>

          {/* Field 2: Destination Keyword */}
          <div className="search-input-wrap" style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '0.75rem' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--accent-emerald)' }}></i>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Điểm đến
              </span>
              <input 
                type="text" 
                id="search-keyword"
                placeholder="Hạ Long, Sapa, Tokyo..."
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', padding: '0.1rem 0' }}
              />
            </div>
          </div>

          {/* Field 3: Category */}
          <div className="search-input-wrap" style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '0.75rem' }}>
            <i className="fa-solid fa-earth-americas" style={{ color: 'var(--accent-emerald)' }}></i>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Loại hình tour
              </span>
              <select 
                id="search-category"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value as 'all' | 'domestic' | 'international')}
                style={{ border: 'none', background: 'transparent', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', padding: '0.1rem 0', cursor: 'pointer' }}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="domestic">Trong Nước</option>
                <option value="international">Quốc Tế</option>
              </select>
            </div>
          </div>

          {/* Field 4: Product Tier */}
          <div className="search-input-wrap">
            <i className="fa-solid fa-crown" style={{ color: 'var(--accent-emerald)' }}></i>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Dòng Tour
              </span>
              <select 
                id="search-product-tier"
                value={starTier}
                onChange={(e) => onStarTierChange(e.target.value as 'all' | 'budget' | 'standard' | 'luxury')}
                style={{ border: 'none', background: 'transparent', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', padding: '0.1rem 0', cursor: 'pointer' }}
              >
                <option value="all">Tất cả dòng tour</option>
                <option value="luxury">👑 Dòng Cao Cấp (Premium)</option>
                <option value="standard">🌟 Dòng Tiêu Chuẩn (Classic)</option>
                <option value="budget">🏷️ Dòng Tiết Kiệm (Smart Deal)</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button 
            type="button"
            className="btn-primary" 
            id="btn-search" 
            onClick={scrollToExplorer}
            style={{ padding: '0.85rem 1.5rem', height: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-magnifying-glass"></i> Tìm Tour
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
  );
};

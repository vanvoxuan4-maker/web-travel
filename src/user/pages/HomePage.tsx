import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSlider } from '../components/home/HeroSlider';
import { TrendingDestinations } from '../components/home/TrendingDestinations';
import { FlashDealsSection } from '../components/home/FlashDealsSection';
import { AllInclusiveSection } from '../components/home/AllInclusiveSection';
import { TourCard } from '../components/tour/TourCard';
import { BudgetCalculator } from '../components/tools/BudgetCalculator';
import { CurrencyConverter } from '../components/tools/CurrencyConverter';
import { PackingList } from '../components/tools/PackingList';
import { CustomBuilder } from '../components/tools/CustomBuilder';
import { TourComparisonModal } from '../components/tour/TourComparisonModal';
import { useTourFilter } from '../../hooks/useTourFilter';
import { tourService } from '../../services/tourService';
import { Tour } from '../../types/tour.types';
import { TOURS_DATA } from '../../data/toursData';

const WISHLIST_STORAGE_KEY = 'webtravel_saved_tours';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const explorerTrackRef = useRef<HTMLDivElement>(null);

  // Dynamic tours state
  const [allTours, setAllTours] = useState<Tour[]>(TOURS_DATA);

  useEffect(() => {
    let isMounted = true;
    tourService.getAllTours().then((data) => {
      if (isMounted && data) {
        setAllTours(data);
      }
    });

    const handleToursUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAllTours(e.detail);
      }
    };

    window.addEventListener('webtravel:tours_updated', handleToursUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('webtravel:tours_updated', handleToursUpdated);
    };
  }, []);

  const {
    keyword,
    setKeyword,
    departure,
    setDeparture,
    category,
    setCategory,
    starTier,
    setStarTier,
    filteredTours
  } = useTourFilter(allTours);

  const handleExplorerScroll = (direction: 'left' | 'right') => {
    if (!explorerTrackRef.current) return;
    const scrollAmount = explorerTrackRef.current.clientWidth * 0.75;
    explorerTrackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const [activeTool, setActiveTool] = useState<'budget' | 'currency' | 'packing' | 'builder'>('budget');

  // Wishlist & Comparison state
  const [comparedTourIds, setComparedTourIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [wishlistedTourIds, setWishlistedTourIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistedTourIds));
    } catch {
      // ignore
    }
  }, [wishlistedTourIds]);

  const handleToggleWishlist = (tourId: string) => {
    setWishlistedTourIds(prev => 
      prev.includes(tourId) ? prev.filter(id => id !== tourId) : [...prev, tourId]
    );
  };

  const handleToggleCompare = (tourId: string) => {
    setComparedTourIds(prev => {
      if (prev.includes(tourId)) {
        return prev.filter(id => id !== tourId);
      }
      if (prev.length >= 3) {
        alert('Bạn chỉ có thể so sánh tối đa 3 tour cùng một lúc.');
        return prev;
      }
      return [...prev, tourId];
    });
  };

  const comparedTours = allTours.filter(t => comparedTourIds.includes(t.id));

  return (
    <div className="homepage-container">
      {/* 1. Dynamic Hero Banner Slider Carousel */}
      <HeroSlider
        departure={departure}
        onDepartureChange={setDeparture}
        keyword={keyword}
        onKeywordChange={setKeyword}
        category={category}
        onCategoryChange={setCategory}
        starTier={starTier}
        onStarTierChange={setStarTier}
        onBookDeal={(tourId) => navigate(`/checkout/${tourId}`)}
      />

      {/* 2. Trending / Favorite Destinations Grid (Vietravel Style with Emerald Branding) */}
      <TrendingDestinations
        onSelectDestination={(kw, cat) => {
          setKeyword(kw);
          if (cat) setCategory(cat);
        }}
      />

      {/* 3. Flash Sale & Deals Section (Giảm 30% & Đồng hồ đếm ngược) */}
      <FlashDealsSection 
        tours={allTours}
        wishlistedTourIds={wishlistedTourIds}
        onToggleWishlist={handleToggleWishlist}
        comparedTourIds={comparedTourIds}
        onToggleCompare={handleToggleCompare}
        onQuickBook={(tourId) => navigate(`/checkout/${tourId}`)}
      />

      {/* 4. All-Inclusive 5-Star Guided Tours Showcase */}
      <AllInclusiveSection 
        tours={allTours}
        wishlistedTourIds={wishlistedTourIds}
        onToggleWishlist={handleToggleWishlist}
        comparedTourIds={comparedTourIds}
        onToggleCompare={handleToggleCompare}
        onQuickBook={(tourId) => navigate(`/checkout/${tourId}`)}
      />

      {/* 5. Bento Grid Tour Explorer Section */}
      <section className="tours-grid-section container" id="tours-explorer" style={{ paddingTop: '1.25rem', paddingBottom: '3.5rem' }}>
        {/* Centered Section Header (Identical to Tour Trọn Gói) */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#047857', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.5rem', border: '1px solid #a7f3d0' }}>
            <i className="fa-solid fa-compass"></i> FEATURED COLLECTIONS
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.15rem', color: '#111827', margin: '0 0 0.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Các Hành Trình Nổi Bật
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.94rem', lineHeight: 1.55, margin: 0 }}>
            Toàn bộ các gói tour du lịch trong nước và quốc tế chất lượng cao đang mở bán
          </p>
        </div>

        {/* Horizontal Tour Carousel (Băng Chuyền Trượt Ngang) */}
        {filteredTours.length > 0 ? (
          <div className="tour-carousel-wrapper" id="tours-container">
            <button 
              type="button" 
              className="carousel-nav-btn prev"
              onClick={() => handleExplorerScroll('left')}
              aria-label="Previous tours"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div className="tour-carousel-track" ref={explorerTrackRef}>
              {filteredTours.map((tour, index) => (
                <div className="tour-carousel-item" key={tour.id}>
                  <TourCard
                    tour={tour}
                    isHero={index === 0}
                    isCompared={comparedTourIds.includes(tour.id)}
                    onToggleCompare={handleToggleCompare}
                    isWishlisted={wishlistedTourIds.includes(tour.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onQuickBook={(id) => navigate(`/checkout/${id}`)}
                  />
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="carousel-nav-btn next"
              onClick={() => handleExplorerScroll('right')}
              aria-label="Next tours"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-compass" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--glass-border-hover)' }}></i>
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Không tìm thấy tour phù hợp</h3>
            <p>Rất tiếc, không có kết quả phù hợp với bộ lọc của bạn. Hãy thử chọn lại tiêu chí tìm kiếm khác!</p>
          </div>
        )}

        {/* View All In Catalog CTA */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/tours')}
            style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', borderRadius: '30px' }}
          >
            <i className="fa-solid fa-layer-group"></i> Xem Toàn Bộ {allTours.length} Tour &amp; Bộ Lọc Chi Tiết <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </section>

      {/* Floating Comparison Action Bar */}
      {comparedTourIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111827',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 998
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i>
            Đang chọn so sánh: <strong>{comparedTourIds.length}/3 tour</strong>
          </span>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '20px' }}
            onClick={() => setIsCompareModalOpen(true)}
          >
            Xem Bảng So Sánh
          </button>
          <button
            type="button"
            onClick={() => setComparedTourIds([])}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem' }}
            title="Xóa tất cả so sánh"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* 3. Interactive Travel Tools Section (Journal Widget Style) */}
      <section className="tools-section" id="tools-section" style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem', border: '1px solid #fde68a' }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> INTERACTIVE UTILITIES
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.15rem', color: '#111827', margin: '0.2rem 0 0', fontWeight: 800 }}>
              Sổ Tay Tiện Ích Hành Trình
            </h2>
          </div>

          <div className="journal-panel" style={{ padding: '1.75rem 2rem' }}>
            {/* Tools Navigation Tabs */}
            <div className="filter-tabs" style={{ marginBottom: '1.75rem', justifyContent: 'center' }} id="tool-tabs">
              <button
                type="button"
                className={`filter-btn ${activeTool === 'budget' ? 'active' : ''}`}
                onClick={() => setActiveTool('budget')}
              >
                <i className="fa-solid fa-calculator"></i> Dự Toán Ngân Sách
              </button>
              <button
                type="button"
                className={`filter-btn ${activeTool === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveTool('builder')}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> Tự Thiết Kế Tour
              </button>
              <button
                type="button"
                className={`filter-btn ${activeTool === 'currency' ? 'active' : ''}`}
                onClick={() => setActiveTool('currency')}
              >
                <i className="fa-solid fa-coins"></i> Tỷ Giá & Múi Giờ
              </button>
              <button
                type="button"
                className={`filter-btn ${activeTool === 'packing' ? 'active' : ''}`}
                onClick={() => setActiveTool('packing')}
              >
                <i className="fa-solid fa-suitcase"></i> Hành Lý Smart
              </button>
            </div>

            {/* Active Tool Content */}
            <div className="tool-content-panel">
              {activeTool === 'budget' && <BudgetCalculator onOpenBooking={(id) => navigate(`/checkout/${id}`)} />}
              {activeTool === 'builder' && <CustomBuilder />}
              {activeTool === 'currency' && <CurrencyConverter />}
              {activeTool === 'packing' && <PackingList />}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <TourComparisonModal
          tours={comparedTours}
          onRemoveTour={(id) => setComparedTourIds(prev => prev.filter(x => x !== id))}
          onBookTour={(id) => {
            setIsCompareModalOpen(false);
            navigate(`/checkout/${id}`);
          }}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}
    </div>
  );
};

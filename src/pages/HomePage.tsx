import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSlider } from '../components/home/HeroSlider';
import { TourCard } from '../components/tour/TourCard';
import { BudgetCalculator } from '../components/tools/BudgetCalculator';
import { CurrencyConverter } from '../components/tools/CurrencyConverter';
import { PackingList } from '../components/tools/PackingList';
import { CustomBuilder } from '../components/tools/CustomBuilder';
import { TourComparisonModal } from '../components/tour/TourComparisonModal';
import { useTourFilter } from '../hooks/useTourFilter';
import { TOURS_DATA } from '../data/toursData';

const WISHLIST_STORAGE_KEY = 'webtravel_saved_tours';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
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
  } = useTourFilter();

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

  const comparedTours = TOURS_DATA.filter(t => comparedTourIds.includes(t.id));

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

      {/* 2. Bento Grid Tour Explorer Section */}
      <section className="tours-grid-section container" id="tours-explorer">
        <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="section-title-wrap">
              <span className="badge badge-terracotta">Featured Collections</span>
              <h2>Các Hành Trình Nổi Bật</h2>
            </div>

            {/* Geographical Filter Tabs */}
            <div className="filter-tabs" id="filter-tabs">
              <button
                type="button"
                className={`filter-btn ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >
                Tất Cả Tour
              </button>
              <button
                type="button"
                className={`filter-btn ${category === 'domestic' ? 'active' : ''}`}
                onClick={() => setCategory('domestic')}
              >
                Trong Nước
              </button>
              <button
                type="button"
                className={`filter-btn ${category === 'international' ? 'active' : ''}`}
                onClick={() => setCategory('international')}
              >
                Quốc Tế
              </button>
            </div>
          </div>

          {/* Product Tier Secondary Filter Pills */}
          <div className="filter-star-bar">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>
              <i className="fa-solid fa-crown" style={{ color: 'var(--accent-emerald)' }}></i> Lọc Dòng Tour:
            </span>
            <button
              type="button"
              className={`filter-star-btn ${starTier === 'all' ? 'active' : ''}`}
              onClick={() => setStarTier('all')}
            >
              Tất Cả Dòng Tour
            </button>
            <button
              type="button"
              className={`filter-star-btn ${starTier === 'luxury' ? 'active' : ''}`}
              onClick={() => setStarTier('luxury')}
            >
              👑 Dòng Cao Cấp (Premium)
            </button>
            <button
              type="button"
              className={`filter-star-btn ${starTier === 'standard' ? 'active' : ''}`}
              onClick={() => setStarTier('standard')}
            >
              🌟 Dòng Tiêu Chuẩn (Classic)
            </button>
            <button
              type="button"
              className={`filter-star-btn ${starTier === 'budget' ? 'active' : ''}`}
              onClick={() => setStarTier('budget')}
            >
              🏷️ Dòng Tiết Kiệm (Smart Deal)
            </button>
          </div>
        </div>

        {/* Bento Grid Container */}
        {filteredTours.length > 0 ? (
          <div className="bento-grid" id="tours-container">
            {filteredTours.map((tour, index) => (
              <TourCard
                key={tour.id}
                tour={tour}
                isHero={index === 0}
                isCompared={comparedTourIds.includes(tour.id)}
                onToggleCompare={handleToggleCompare}
                isWishlisted={wishlistedTourIds.includes(tour.id)}
                onToggleWishlist={handleToggleWishlist}
                onQuickBook={(id) => navigate(`/checkout/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-compass" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--glass-border-hover)' }}></i>
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Không tìm thấy tour phù hợp</h3>
            <p>Rất tiếc, không có kết quả phù hợp với bộ lọc của bạn. Hãy thử chọn lại tiêu chí tìm kiếm khác!</p>
          </div>
        )}
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
      <section className="tools-section" id="tools-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-gold">Interactive Utilities</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', marginTop: '0.5rem' }}>
              Sổ Tay Tiện Ích Hành Trình
            </h2>
          </div>

          <div className="journal-panel">
            {/* Tools Navigation Tabs */}
            <div className="filter-tabs" style={{ marginBottom: '2.5rem', justifyContent: 'center' }} id="tool-tabs">
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

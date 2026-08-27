import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TourCard } from '../components/tour/TourCard';
import { TourComparisonModal } from '../components/tour/TourComparisonModal';
import { tourService } from '../../services/tourService';
import { useTourFilter, SortOption } from '../../hooks/useTourFilter';
import { Tour, TourTheme } from '../../types/tour.types';
import { TOURS_DATA } from '../../data/toursData';
import { formatCurrencyVND } from '../../utils/formatters';

const WISHLIST_KEY = 'webtravel_saved_tours';

export interface DestinationPill {
  id: string;
  label: string;
  keywords: string[];
}

export const DOMESTIC_SUBREGIONS: DestinationPill[] = [
  { id: 'all', label: 'Tất cả', keywords: [] },
  { id: 'hanoi', label: 'Hà Nội & Miền Bắc', keywords: ['Hà Nội', 'Hạ Long', 'Sapa', 'Ninh Bình', 'Yên Tử', 'Tràng An', 'Bái Đính', 'Fansipan', 'Tây Bắc', 'Quảng Ninh'] },
  { id: 'danang', label: 'Đà Nẵng & Miền Trung', keywords: ['Đà Nẵng', 'Hội An', 'Huế', 'Bà Nà', 'Mỹ Khê', 'Sơn Trà', 'Quảng Nam'] },
  { id: 'dalat', label: 'Đà Lạt & Tây Nguyên', keywords: ['Đà Lạt', 'Lâm Đồng', 'Tây Nguyên', 'Buôn Ma Thuột', 'Pleiku'] },
  { id: 'phuquoc', label: 'Phú Quốc & Biển Đảo', keywords: ['Phú Quốc', 'Kiên Giang', 'Hòn Thơm', 'Nha Trang', 'Quy Nhơn', 'Côn Đảo', 'Phan Thiết', 'Mũi Né', 'Khánh Hòa'] },
  { id: 'cantho', label: 'Cần Thơ & Miền Tây', keywords: ['Cần Thơ', 'Miền Tây', 'Mekong', 'Bến Tre', 'An Giang', 'Châu Đốc', 'Cà Mau'] },
  { id: 'tphcm', label: 'TP. Hồ Chí Minh', keywords: ['TP. Hồ Chí Minh', 'TP.HCM', 'Sài Gòn', 'Củ Chi', 'Vũng Tàu'] },
];

export const INTERNATIONAL_SUBREGIONS: DestinationPill[] = [
  { id: 'all', label: 'Tất cả', keywords: [] },
  { id: 'northeast-asia', label: 'Đông Bắc Á (Nhật - Hàn)', keywords: ['Nhật Bản', 'Tokyo', 'Hàn Quốc', 'Seoul', 'Đài Loan', 'Trung Quốc', 'Bắc Kinh', 'Thượng Hải', 'Nami'] },
  { id: 'southeast-asia', label: 'Đông Nam Á (Thái - Sing)', keywords: ['Thái Lan', 'Bangkok', 'Pattaya', 'Singapore', 'Malaysia', 'Bali', 'Indonesia', 'Campuchia'] },
  { id: 'europe', label: 'Châu Âu (Pháp - Ý - Thụy Sĩ)', keywords: ['Châu Âu', 'Pháp', 'Paris', 'Thụy Sĩ', 'Ý', 'Rome', 'Đức', 'Anh', 'Hà Lan'] },
  { id: 'america-oceania', label: 'Châu Mỹ & Châu Úc', keywords: ['Mỹ', 'Hoa Kỳ', 'New York', 'Los Angeles', 'Úc', 'Sydney', 'Melbourne', 'Canada'] },
];

interface HeroBannerSlide {
  id: string;
  image: string;
  tag: string;
  tagIcon: string;
  title: string;
  highlightText: string;
  subtitle: string;
  targetKeyword: string;
  category?: 'domestic' | 'international';
  location: string;
}

const CATALOG_HERO_SLIDES: HeroBannerSlide[] = [
  {
    id: 'danang',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1920&q=85',
    tag: 'Điểm Đến Di Sản Miền Trung',
    tagIcon: '🌉',
    title: 'Đà Nẵng – Cầu Rồng Rực Rỡ',
    highlightText: '& Bà Nà Hills Tuyệt Mỹ',
    subtitle: 'Chiêm ngưỡng vẻ đẹp lung linh của Cầu Rồng, biển Mỹ Khê và phố cổ Hội An với dịch vụ tour trọn gói 5 sao.',
    targetKeyword: 'Đà Nẵng',
    category: 'domestic',
    location: 'Đà Nẵng - Hội An'
  },
  {
    id: 'halong',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1920&q=85',
    tag: 'Kỳ Quan Thiên Nhiên Thế Giới',
    tagIcon: '⛵',
    title: 'Vịnh Hạ Long – Du Thuyền 5★',
    highlightText: '& Hang Động Hùng Vĩ',
    subtitle: 'Nghỉ dưỡng thượng lưu giữa lòng di sản thiên nhiên thế giới với hải trình du thuyền đẳng cấp quốc tế.',
    targetKeyword: 'Hạ Long',
    category: 'domestic',
    location: 'Quảng Ninh'
  },
  {
    id: 'phuquoc',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85',
    tag: 'Thiên Đường Nghỉ Dưỡng Biển',
    tagIcon: '🏖️',
    title: 'Phú Quốc – Hoàng Hôn Đảo Ngọc',
    highlightText: '& Resort Ven Biển 5★',
    subtitle: 'Tận hưởng bãi biển cát trắng mịn, lặn ngắm san hô Hòn Thơm và chiêm ngưỡng hoàng hôn Sunset Town.',
    targetKeyword: 'Phú Quốc',
    category: 'domestic',
    location: 'Kiên Giang'
  },
  {
    id: 'sapa',
    image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1920&q=85',
    tag: 'Chinh Phục Nóc Nhà Đông Dương',
    tagIcon: '⛰️',
    title: 'Sapa – Fansipan Biển Mây',
    highlightText: '& Ruộng Bậc Thang Mường Hoa',
    subtitle: 'Khám phá xứ sở sương mù Tây Bắc, chạm đỉnh Fansipan 3.143m và trải nghiệm văn hóa bản địa độc đáo.',
    targetKeyword: 'Sapa',
    category: 'domestic',
    location: 'Lào Cai'
  }
];

const THEME_OPTIONS: { value: 'all' | TourTheme; label: string; icon: string }[] = [
  { value: 'all', label: 'Tất cả chủ đề', icon: '🌐' },
  { value: 'beach', label: 'Biển đảo', icon: '🏖️' },
  { value: 'heritage', label: 'Di sản', icon: '🏛️' },
  { value: 'adventure', label: 'Mạo hiểm', icon: '🏔️' },
  { value: 'family', label: 'Gia đình', icon: '👨‍👩‍👧‍👦' },
  { value: 'wellness', label: 'Wellness', icon: '🧘' },
  { value: 'culinary', label: 'Ẩm thực', icon: '🍜' },
];

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: 0, max: 50_000_000 },
  { label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  { label: 'Từ 5 - 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: 'Từ 10 - 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: 'Trên 20 triệu', min: 20_000_000, max: 50_000_000 },
];

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 36];
const PRICE_MAX = 50_000_000;

function getPricePercent(value: number, max: number) {
  return Math.round((value / max) * 100);
}

// Helper filter function for subregions
function filterToursBySubregion(tours: Tour[], subregionId: string, subregionsList: DestinationPill[]): Tour[] {
  if (subregionId === 'all') return tours;
  const target = subregionsList.find(s => s.id === subregionId);
  if (!target || target.keywords.length === 0) return tours;
  return tours.filter(tour => {
    const textToMatch = `${tour.title} ${tour.shortTitle || ''} ${tour.destination || ''} ${tour.departureFrom || ''}`.toLowerCase();
    return target.keywords.some(k => textToMatch.includes(k.toLowerCase()));
  });
}

export const TourCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Dynamic tours data
  const [allTours, setAllTours] = useState<Tour[]>(TOURS_DATA);

  useEffect(() => {
    let isMounted = true;
    tourService.getAllTours().then((data) => {
      if (isMounted && data && data.length > 0) setAllTours(data);
    });
    const onUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllTours(e.detail);
    };
    window.addEventListener('webtravel:tours_updated', onUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('webtravel:tours_updated', onUpdate);
    };
  }, []);

  const {
    keyword, setKeyword,
    departure, setDeparture,
    category, setCategory,
    theme, setTheme,
    starTier, setStarTier,
    priceRange, setPriceRange,
    duration, setDuration,
    rating, setRating,
    sortBy, setSortBy,
    activeFilterCount,
    resetAllFilters,
    filteredTours,
  } = useTourFilter(allTours);

  // Sub-region Pills state
  const [selectedDomesticSubregion, setSelectedDomesticSubregion] = useState<string>('all');
  const [selectedInternationalSubregion, setSelectedInternationalSubregion] = useState<string>('all');

  // Hero Banner Slide State
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const handleNextSlide = useCallback(() => {
    setActiveHeroIndex(prev => (prev + 1) % CATALOG_HERO_SLIDES.length);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setActiveHeroIndex(prev => (prev - 1 + CATALOG_HERO_SLIDES.length) % CATALOG_HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    autoPlayRef.current = setInterval(handleNextSlide, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [handleNextSlide]);

  // Synchronize filters with URL search params
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('keyword') || '';
    const cat = (searchParams.get('category') as 'all' | 'domestic' | 'international') || 'all';
    const tier = (searchParams.get('tier') as any) || 'all';
    if (q) setKeyword(q);
    if (cat !== 'all') setCategory(cat);
    if (tier !== 'all') setStarTier(tier);
  }, [searchParams, setKeyword, setCategory, setStarTier]);

  // Wishlist
  const [wishlistedTourIds, setWishlistedTourIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(WISHLIST_KEY);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistedTourIds)); }
    catch { /* ignore */ }
  }, [wishlistedTourIds]);
  const handleToggleWishlist = useCallback((id: string) => {
    setWishlistedTourIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // Compare
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const comparedTours = allTours.filter(t => comparedIds.includes(t.id));
  const handleToggleCompare = useCallback((id: string) => {
    setComparedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { alert('Chỉ được so sánh tối đa 3 tour cùng lúc.'); return prev; }
      return [...prev, id];
    });
  }, []);

  // Compute domestic and international tours list according to sub-region pills
  const domesticTours = useMemo(() => {
    const rawDomestic = filteredTours.filter(t => t.category === 'domestic');
    return filterToursBySubregion(rawDomestic, selectedDomesticSubregion, DOMESTIC_SUBREGIONS);
  }, [filteredTours, selectedDomesticSubregion]);

  const internationalTours = useMemo(() => {
    const rawInternational = filteredTours.filter(t => t.category === 'international');
    return filterToursBySubregion(rawInternational, selectedInternationalSubregion, INTERNATIONAL_SUBREGIONS);
  }, [filteredTours, selectedInternationalSubregion]);

  // Pagination for single category view
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => { setCurrentPage(1); }, [filteredTours.length, sortBy, category, selectedDomesticSubregion, selectedInternationalSubregion]);

  // Active tours for single category view
  const currentViewTours = category === 'domestic' ? domesticTours : category === 'international' ? internationalTours : filteredTours;
  const totalPages = Math.ceil(currentViewTours.length / itemsPerPage);
  const paginatedTours = currentViewTours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // View Mode: 'grid' (Default Bento) vs 'list' (Vietravel Horizontal)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mobile filter drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter group accordion state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    subregionDomestic: true,
    subregionInternational: true,
    departure: true,
    price: true,
    tier: true,
    duration: true,
    theme: false,
    rating: false,
  });
  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Price range local state
  const [localPriceMin, setLocalPriceMin] = useState(0);
  const [localPriceMax, setLocalPriceMax] = useState(PRICE_MAX);
  const applyPriceRange = () => {
    const min = Math.min(localPriceMin, localPriceMax);
    const max = Math.max(localPriceMin, localPriceMax);
    setPriceRange([min, max]);
  };

  const handleMinPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPriceMin(Number(e.target.value));
  };
  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPriceMax(Number(e.target.value));
  };

  const handleSelectPricePreset = (min: number, max: number) => {
    setLocalPriceMin(min);
    setLocalPriceMax(max);
    setPriceRange([min, max]);
  };

  useEffect(() => {
    setLocalPriceMin(priceRange[0]);
    setLocalPriceMax(priceRange[1]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination page numbers generator
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  /* ────────── Filter Sidebar JSX (Vietravel Style with Dynamic Sub-regions) ────────── */
  const FilterSidebar = (
    <aside className={`catalog-sidebar vt-filter-sidebar${mobileFilterOpen ? ' mobile-open' : ''}`}>
      {/* Mobile close button */}
      {mobileFilterOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
          <strong style={{ fontSize: '1rem', color: '#1e293b' }}>Bộ Lọc Tìm Kiếm</strong>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer', padding: '0.4rem' }}
            aria-label="Đóng bộ lọc"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Header with Title & Reset Button */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <i className="fa-solid fa-filter" style={{ color: '#059669' }} />
          <span>Bộ Lọc Tìm Kiếm</span>
          {(activeFilterCount > 0 || selectedDomesticSubregion !== 'all' || selectedInternationalSubregion !== 'all') && (
            <span className="filter-count-badge">
              {activeFilterCount + (selectedDomesticSubregion !== 'all' ? 1 : 0) + (selectedInternationalSubregion !== 'all' ? 1 : 0)}
            </span>
          )}
        </div>
        {(activeFilterCount > 0 || selectedDomesticSubregion !== 'all' || selectedInternationalSubregion !== 'all') && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={() => {
              resetAllFilters();
              setSelectedDomesticSubregion('all');
              setSelectedInternationalSubregion('all');
              setLocalPriceMin(0);
              setLocalPriceMax(PRICE_MAX);
            }}
          >
            <i className="fa-solid fa-rotate-left" /> Xóa tất cả
          </button>
        )}
      </div>

      {/* 1. Dynamic Subregion Filter: Vùng Du Lịch Trong Nước */}
      {(category === 'all' || category === 'domestic') && (
        <div className={`filter-group${openGroups.subregionDomestic ? ' open' : ''}`}>
          <button type="button" className="filter-group-header" onClick={() => toggleGroup('subregionDomestic')}>
            <span className="fgh-icon"><i className="fa-solid fa-map-location-dot" /></span>
            <span className="fgh-label">Vùng Miền Nội Địa</span>
            <i className="fa-solid fa-chevron-down filter-group-chevron" />
          </button>
          <div className="filter-group-body">
            <div className="filter-radio-list">
              {DOMESTIC_SUBREGIONS.map(sub => (
                <label
                  key={sub.id}
                  className={`filter-radio-item${selectedDomesticSubregion === sub.id ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="domestic-subregion"
                    value={sub.id}
                    checked={selectedDomesticSubregion === sub.id}
                    onChange={() => setSelectedDomesticSubregion(sub.id)}
                  />
                  {sub.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Dynamic Subregion Filter: Khu Vực Quốc Tế */}
      {(category === 'all' || category === 'international') && (
        <div className={`filter-group${openGroups.subregionInternational ? ' open' : ''}`}>
          <button type="button" className="filter-group-header" onClick={() => toggleGroup('subregionInternational')}>
            <span className="fgh-icon"><i className="fa-solid fa-globe" /></span>
            <span className="fgh-label">Khu Vực Quốc Tế</span>
            <i className="fa-solid fa-chevron-down filter-group-chevron" />
          </button>
          <div className="filter-group-body">
            <div className="filter-radio-list">
              {INTERNATIONAL_SUBREGIONS.map(sub => (
                <label
                  key={sub.id}
                  className={`filter-radio-item${selectedInternationalSubregion === sub.id ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="international-subregion"
                    value={sub.id}
                    checked={selectedInternationalSubregion === sub.id}
                    onChange={() => setSelectedInternationalSubregion(sub.id)}
                  />
                  {sub.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Điểm khởi hành */}
      <div className={`filter-group${openGroups.departure ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('departure')}>
          <span className="fgh-icon"><i className="fa-solid fa-plane-departure" /></span>
          <span className="fgh-label">Điểm Khởi Hành</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="filter-radio-list">
            {[
              { value: 'all', label: 'Tất cả điểm đi' },
              { value: 'TP.HCM', label: 'TP. Hồ Chí Minh' },
              { value: 'Hà Nội', label: 'Hà Nội' },
              { value: 'Đà Nẵng', label: 'Đà Nẵng' },
              { value: 'Cần Thơ', label: 'Cần Thơ' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`filter-radio-item${departure === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="departure-filter"
                  value={opt.value}
                  checked={departure === opt.value}
                  onChange={() => setDeparture(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Dòng tour / Hạng sao */}
      <div className={`filter-group${openGroups.tier ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('tier')}>
          <span className="fgh-icon"><i className="fa-solid fa-crown" /></span>
          <span className="fgh-label">Dòng Tour</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="filter-radio-list">
            {[
              { value: 'all', label: 'Tất cả dòng tour' },
              { value: 'luxury', label: '👑 Dòng Cao Cấp (5★)' },
              { value: 'standard', label: '🌟 Dòng Tiêu Chuẩn (4★)' },
              { value: 'budget', label: '🏷️ Dòng Tiết Kiệm (3★)' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`filter-radio-item${starTier === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="tier-filter"
                  value={opt.value}
                  checked={starTier === opt.value}
                  onChange={() => setStarTier(opt.value as any)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Mức giá & Khoảng giá */}
      <div className={`filter-group${openGroups.price ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('price')}>
          <span className="fgh-icon"><i className="fa-solid fa-wallet" /></span>
          <span className="fgh-label">Ngân Sách / Giá Tour</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="price-range-wrap">
            <div className="price-range-labels">
              <span>{formatCurrencyVND(localPriceMin)}</span>
              <strong>→</strong>
              <span>{localPriceMax >= PRICE_MAX ? '50tr+' : formatCurrencyVND(localPriceMax)}</span>
            </div>
            <div className="price-range-slider-container">
              <div className="price-range-track" />
              <div
                className="price-range-fill"
                style={{
                  left: `${getPricePercent(Math.min(localPriceMin, localPriceMax), PRICE_MAX)}%`,
                  width: `${getPricePercent(Math.abs(localPriceMax - localPriceMin), PRICE_MAX)}%`,
                }}
              />
              <input
                type="range"
                className="price-range-input"
                min={0}
                max={PRICE_MAX}
                step={500_000}
                value={localPriceMin}
                onChange={handleMinPrice}
                onMouseUp={applyPriceRange}
                onTouchEnd={applyPriceRange}
                aria-label="Giá tối thiểu"
              />
              <input
                type="range"
                className="price-range-input"
                min={0}
                max={PRICE_MAX}
                step={500_000}
                value={localPriceMax}
                onChange={handleMaxPrice}
                onMouseUp={applyPriceRange}
                onTouchEnd={applyPriceRange}
                aria-label="Giá tối đa"
              />
            </div>

            {/* Quick Price Presets */}
            <div className="vt-price-presets-list" style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {PRICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPricePreset(preset.min, preset.max)}
                  className={`vt-price-preset-btn ${priceRange[0] === preset.min && priceRange[1] === preset.max ? 'active' : ''}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Số ngày đi */}
      <div className={`filter-group${openGroups.duration ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('duration')}>
          <span className="fgh-icon"><i className="fa-regular fa-calendar" /></span>
          <span className="fgh-label">Số Ngày Đi</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="filter-radio-list">
            {[
              { value: 'all', label: 'Tất cả thời gian' },
              { value: '1-3', label: '1 – 3 ngày (Ngắn ngày)' },
              { value: '4-6', label: '4 – 6 ngày (Trung bình)' },
              { value: '7+', label: '7+ ngày (Dài ngày)' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`filter-radio-item${duration === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="duration-filter"
                  value={opt.value}
                  checked={duration === opt.value}
                  onChange={() => setDuration(opt.value as any)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Chủ đề du lịch */}
      <div className={`filter-group${openGroups.theme ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('theme')}>
          <span className="fgh-icon"><i className="fa-solid fa-palette" /></span>
          <span className="fgh-label">Chủ Đề Trải Nghiệm</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="filter-pills">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`filter-pill${theme === opt.value ? ' active' : ''}`}
                onClick={() => setTheme(opt.value as any)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Đánh giá chất lượng */}
      <div className={`filter-group${openGroups.rating ? ' open' : ''}`}>
        <button type="button" className="filter-group-header" onClick={() => toggleGroup('rating')}>
          <span className="fgh-icon"><i className="fa-solid fa-star" /></span>
          <span className="fgh-label">Đánh Giá</span>
          <i className="fa-solid fa-chevron-down filter-group-chevron" />
        </button>
        <div className="filter-group-body">
          <div className="filter-radio-list">
            {[
              { value: 'all', label: 'Tất cả đánh giá' },
              { value: '4+', label: '⭐ Từ 4.0 trở lên' },
              { value: '4.5+', label: '⭐ Từ 4.5 trở lên' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`filter-radio-item${rating === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="rating-filter"
                  value={opt.value}
                  checked={rating === opt.value}
                  onChange={() => setRating(opt.value as any)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="catalog-page vt-catalog-page">
      
      {/* ── 1. Grand Scenic Hero Banner (Đà Nẵng Cầu Rồng & Kỳ Quan) ── */}
      <section className="catalog-scenic-hero" aria-label="Khám phá điểm đến nổi bật">
        <div className="scenic-hero-bg-container">
          {CATALOG_HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`scenic-hero-slide ${index === activeHeroIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
              role="img"
              aria-label={slide.title}
            >
              <div className="scenic-hero-overlay" />
            </div>
          ))}
        </div>

        <div className="container scenic-hero-container">
          <div className="scenic-hero-content">
            <div className="scenic-hero-eyebrow">
              <span className="eyebrow-icon">{CATALOG_HERO_SLIDES[activeHeroIndex].tagIcon}</span>
              <span className="eyebrow-text">{CATALOG_HERO_SLIDES[activeHeroIndex].tag}</span>
              <span className="eyebrow-location">
                <i className="fa-solid fa-location-dot"></i> {CATALOG_HERO_SLIDES[activeHeroIndex].location}
              </span>
            </div>

            <h1 className="scenic-hero-title">
              {CATALOG_HERO_SLIDES[activeHeroIndex].title}{' '}
              <span className="title-highlight">{CATALOG_HERO_SLIDES[activeHeroIndex].highlightText}</span>
            </h1>

            <p className="scenic-hero-sub">
              {CATALOG_HERO_SLIDES[activeHeroIndex].subtitle}
            </p>

            {/* Quick Destination Filter Chips */}
            <div className="scenic-quick-chips">
              <span className="quick-chips-label">Điểm đến nổi bật:</span>
              {CATALOG_HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`scenic-chip-btn ${index === activeHeroIndex ? 'active' : ''}`}
                  onClick={() => {
                    setActiveHeroIndex(index);
                    setKeyword(slide.targetKeyword);
                    if (slide.category) setCategory(slide.category);
                  }}
                >
                  <span>{slide.tagIcon}</span>
                  <span>{slide.targetKeyword}</span>
                </button>
              ))}
              <button
                type="button"
                className={`scenic-chip-btn ${keyword === 'Tokyo' ? 'active' : ''}`}
                onClick={() => {
                  setKeyword('Tokyo');
                  setCategory('international');
                  setSelectedInternationalSubregion('northeast-asia');
                }}
              >
                <span>🌸</span>
                <span>Tokyo (Nhật Bản)</span>
              </button>
              <button
                type="button"
                className={`scenic-chip-btn ${keyword === 'Pháp' ? 'active' : ''}`}
                onClick={() => {
                  setKeyword('Pháp');
                  setCategory('international');
                  setSelectedInternationalSubregion('europe');
                }}
              >
                <span>🗼</span>
                <span>Châu Âu</span>
              </button>
            </div>
          </div>

          {/* Slider Controls */}
          <div className="scenic-slider-controls">
            <button
              type="button"
              className="scenic-nav-btn prev"
              onClick={handlePrevSlide}
              aria-label="Slide trước"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div className="scenic-dots">
              {CATALOG_HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`scenic-dot ${index === activeHeroIndex ? 'active' : ''}`}
                  onClick={() => setActiveHeroIndex(index)}
                  aria-label={`Chuyển đến banner ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="scenic-nav-btn next"
              onClick={handleNextSlide}
              aria-label="Slide tiếp theo"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Top Vietravel-Style Search Island Bar ── */}
      <section className="vt-search-hero-bar" aria-label="Vietravel Search Bar">
        <div className="container">
          <div className="vt-search-island">
            {/* Category Tabs */}
            <div className="vt-search-tabs">
              <button
                type="button"
                className={`vt-search-tab ${category === 'all' ? 'active' : ''}`}
                onClick={() => { setCategory('all'); setSelectedDomesticSubregion('all'); setSelectedInternationalSubregion('all'); }}
              >
                🌐 Tất Cả Tour
              </button>
              <button
                type="button"
                className={`vt-search-tab ${category === 'domestic' ? 'active' : ''}`}
                onClick={() => { setCategory('domestic'); setSelectedDomesticSubregion('all'); }}
              >
                🇻🇳 Tour Trong Nước
              </button>
              <button
                type="button"
                className={`vt-search-tab ${category === 'international' ? 'active' : ''}`}
                onClick={() => { setCategory('international'); setSelectedInternationalSubregion('all'); }}
              >
                ✈️ Tour Quốc Tế
              </button>
            </div>

            {/* Input Controls Grid */}
            <div className="vt-search-fields-grid">
              {/* Field 1: Departure */}
              <div className="vt-field-wrap">
                <span className="vt-field-label">
                  <i className="fa-solid fa-plane-departure" style={{ color: '#059669' }}></i> Nơi khởi hành
                </span>
                <select
                  value={departure}
                  onChange={e => setDeparture(e.target.value)}
                  className="vt-field-select"
                  aria-label="Nơi khởi hành"
                >
                  <option value="all">Tất cả điểm đi</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              {/* Field 2: Destination Keyword */}
              <div className="vt-field-wrap vt-field-keyword">
                <span className="vt-field-label">
                  <i className="fa-solid fa-location-dot" style={{ color: '#059669' }}></i> Bạn muốn đi đâu?
                </span>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Hạ Long, Đà Nẵng, Tokyo, Phú Quốc..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    className="vt-field-input"
                    aria-label="Điểm đến hoặc tên tour"
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword('')}
                      className="vt-clear-btn"
                      aria-label="Xóa từ khóa"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              </div>

              {/* Field 3: Duration */}
              <div className="vt-field-wrap">
                <span className="vt-field-label">
                  <i className="fa-regular fa-clock" style={{ color: '#059669' }}></i> Số ngày đi
                </span>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value as any)}
                  className="vt-field-select"
                  aria-label="Số ngày đi"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="1-3">1 - 3 ngày (Ngắn)</option>
                  <option value="4-6">4 - 6 ngày (Vừa)</option>
                  <option value="7+">7+ ngày (Dài ngày)</option>
                </select>
              </div>

              {/* Field 4: Tier */}
              <div className="vt-field-wrap">
                <span className="vt-field-label">
                  <i className="fa-solid fa-crown" style={{ color: '#f59e0b' }}></i> Dòng tour
                </span>
                <select
                  value={starTier}
                  onChange={e => setStarTier(e.target.value as any)}
                  className="vt-field-select"
                  aria-label="Dòng tour"
                >
                  <option value="all">Tất cả phân khúc</option>
                  <option value="luxury">👑 5★ Cao Cấp</option>
                  <option value="standard">🌟 4★ Tiêu Chuẩn</option>
                  <option value="budget">🏷️ 3★ Tiết Kiệm</option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="button"
                className="vt-submit-search-btn"
                onClick={() => {
                  const el = document.getElementById('catalog-main-content');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Tìm Tour</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Main Two-Column Layout ── */}
      <div className="catalog-layout vt-catalog-layout" id="catalog-main-content">
        {/* Left Filter Sidebar */}
        {FilterSidebar}

        {/* Right Main Content Area */}
        <main className="catalog-main vt-catalog-main" role="main">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            className="mobile-filter-toggle"
            onClick={() => setMobileFilterOpen(true)}
            aria-label="Mở bộ lọc"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-sliders" />
              Bộ Lọc Tìm Kiếm
              {(activeFilterCount > 0 || selectedDomesticSubregion !== 'all' || selectedInternationalSubregion !== 'all') && (
                <span className="filter-count-badge">
                  {activeFilterCount + (selectedDomesticSubregion !== 'all' ? 1 : 0) + (selectedInternationalSubregion !== 'all' ? 1 : 0)}
                </span>
              )}
            </span>
            <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
          </button>

          {/* Sắp xếp Toolbar (Chung cho toàn bộ hoặc từng phần) */}
          <div className="vt-results-toolbar">
            <div className="vt-results-count-title">
              <h2>
                Tìm thấy <strong>{category === 'all' ? (domesticTours.length + internationalTours.length) : currentViewTours.length}</strong> tour phù hợp
              </h2>
              {(activeFilterCount > 0 || selectedDomesticSubregion !== 'all' || selectedInternationalSubregion !== 'all') && (
                <span className="vt-active-filter-tag">
                  {activeFilterCount + (selectedDomesticSubregion !== 'all' ? 1 : 0) + (selectedInternationalSubregion !== 'all' ? 1 : 0)} tiêu chí đang lọc
                </span>
              )}
            </div>

            {/* Sort Tabs & View Toggle */}
            <div className="vt-toolbar-actions">
              <div className="vt-sort-tabs" role="tablist" aria-label="Sắp xếp tour">
                <span className="vt-sort-label">Sắp xếp:</span>
                {[
                  { id: 'default', label: 'Tất cả' },
                  { id: 'price-asc', label: 'Giá thấp → cao' },
                  { id: 'price-desc', label: 'Giá cao → thấp' },
                  { id: 'rating', label: 'Đánh giá cao' },
                  { id: 'duration-asc', label: 'Thời lượng' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`vt-sort-tab-btn ${sortBy === item.id ? 'active' : ''}`}
                    onClick={() => setSortBy(item.id as SortOption)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* View Switch: Grid Bento (Default) ↔ Horizontal List */}
              <div className="view-toggle" role="group" aria-label="Chế độ xem">
                <button
                  type="button"
                  className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Xem dạng lưới"
                  title="Xem dạng thẻ lưới"
                >
                  <i className="fa-solid fa-grip" />
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Xem dạng danh sách"
                  title="Xem dạng danh sách (Chuẩn Vietravel)"
                >
                  <i className="fa-solid fa-list" />
                </button>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
             PHƯƠNG ÁN A: 2 KHỐI LỚN (NỘI ĐỊA & QUỐC TẾ) KHI CATEGORY === 'ALL'
             ════════════════════════════════════════════════════════════ */}
          {category === 'all' ? (
            <div className="vt-two-sections-container">
              {/* SECTION 1: CÁC TOUR TRỌN GÓI NỘI ĐỊA */}
              <section className="vt-region-block" aria-label="Tour trọn gói nội địa">
                <div className="vt-region-header-row">
                  <div className="vt-region-title-wrap">
                    <span className="vt-region-icon">🇻🇳</span>
                    <h3 className="vt-region-heading">Các tour trọn gói nội địa</h3>
                    <span className="vt-region-count">({domesticTours.length} tour)</span>
                  </div>
                  <button
                    type="button"
                    className="vt-region-more-btn"
                    onClick={() => { setCategory('domestic'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    aria-label="Xem thêm tour nội địa"
                  >
                    <span>Xem thêm ({domesticTours.length})</span>
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>

                {/* Subregion Pills Bar */}
                <div className="vt-region-pills-bar" role="tablist" aria-label="Điểm đến nội địa">
                  {DOMESTIC_SUBREGIONS.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      className={`vt-region-pill-btn ${selectedDomesticSubregion === sub.id ? 'active' : ''}`}
                      onClick={() => setSelectedDomesticSubregion(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Tours Grid/List */}
                {domesticTours.length > 0 ? (
                  <div className={viewMode === 'list' ? 'vt-tours-list-container' : 'vt-tours-grid-container'}>
                    {domesticTours.slice(0, 8).map((tour, index) => (
                      <TourCard
                        key={tour.id}
                        tour={tour}
                        layout={viewMode === 'list' ? 'horizontal' : 'grid'}
                        isHero={index === 0}
                        isCompared={comparedIds.includes(tour.id)}
                        onToggleCompare={handleToggleCompare}
                        isWishlisted={wishlistedTourIds.includes(tour.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="vt-region-empty">
                    <p>Chưa tìm thấy tour nội địa nào phù hợp tại khu vực này.</p>
                    <button
                      type="button"
                      className="vt-region-reset-pill"
                      onClick={() => setSelectedDomesticSubregion('all')}
                    >
                      Xem tất cả tour nội địa
                    </button>
                  </div>
                )}
              </section>

              {/* SECTION 2: CÁC TOUR TRỌN GÓI NƯỚC NGOÀI */}
              <section className="vt-region-block" aria-label="Tour trọn gói nước ngoài" style={{ marginTop: '3rem' }}>
                <div className="vt-region-header-row">
                  <div className="vt-region-title-wrap">
                    <span className="vt-region-icon">✈️</span>
                    <h3 className="vt-region-heading">Các tour trọn gói nước ngoài</h3>
                    <span className="vt-region-count">({internationalTours.length} tour)</span>
                  </div>
                  <button
                    type="button"
                    className="vt-region-more-btn"
                    onClick={() => { setCategory('international'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    aria-label="Xem thêm tour quốc tế"
                  >
                    <span>Xem thêm ({internationalTours.length})</span>
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>

                {/* Subregion Pills Bar */}
                <div className="vt-region-pills-bar" role="tablist" aria-label="Điểm đến quốc tế">
                  {INTERNATIONAL_SUBREGIONS.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      className={`vt-region-pill-btn ${selectedInternationalSubregion === sub.id ? 'active' : ''}`}
                      onClick={() => setSelectedInternationalSubregion(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Tours Grid/List */}
                {internationalTours.length > 0 ? (
                  <div className={viewMode === 'list' ? 'vt-tours-list-container' : 'vt-tours-grid-container'}>
                    {internationalTours.slice(0, 8).map((tour, index) => (
                      <TourCard
                        key={tour.id}
                        tour={tour}
                        layout={viewMode === 'list' ? 'horizontal' : 'grid'}
                        isHero={index === 0}
                        isCompared={comparedIds.includes(tour.id)}
                        onToggleCompare={handleToggleCompare}
                        isWishlisted={wishlistedTourIds.includes(tour.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="vt-region-empty">
                    <p>Chưa tìm thấy tour quốc tế nào phù hợp tại khu vực này.</p>
                    <button
                      type="button"
                      className="vt-region-reset-pill"
                      onClick={() => setSelectedInternationalSubregion('all')}
                    >
                      Xem tất cả tour quốc tế
                    </button>
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════
               SINGLE REGION FULL VIEW (DOMESTIC OR INTERNATIONAL)
               ════════════════════════════════════════════════════════════ */
            <div className="vt-single-region-view">
              {/* Region Heading & Breadcrumb */}
              <div className="vt-region-header-row">
                <div className="vt-region-title-wrap">
                  <span className="vt-region-icon">{category === 'domestic' ? '🇻🇳' : '✈️'}</span>
                  <h3 className="vt-region-heading">
                    {category === 'domestic' ? 'Các tour trọn gói nội địa' : 'Các tour trọn gói nước ngoài'}
                  </h3>
                  <span className="vt-region-count">({currentViewTours.length} tour)</span>
                </div>
                <button
                  type="button"
                  className="vt-region-back-btn"
                  onClick={() => setCategory('all')}
                >
                  <i className="fa-solid fa-rotate-left"></i> Xem tất cả phân vùng
                </button>
              </div>

              {/* Subregion Pills Bar */}
              <div className="vt-region-pills-bar" role="tablist">
                {(category === 'domestic' ? DOMESTIC_SUBREGIONS : INTERNATIONAL_SUBREGIONS).map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    className={`vt-region-pill-btn ${
                      (category === 'domestic' ? selectedDomesticSubregion : selectedInternationalSubregion) === sub.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (category === 'domestic') setSelectedDomesticSubregion(sub.id);
                      else setSelectedInternationalSubregion(sub.id);
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Tour List / Grid */}
              <div
                className={viewMode === 'list' ? 'vt-tours-list-container' : 'vt-tours-grid-container'}
                id="catalog-tour-grid"
                aria-live="polite"
                aria-label="Danh sách tour"
              >
                {paginatedTours.length > 0 ? (
                  paginatedTours.map((tour, index) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      layout={viewMode === 'list' ? 'horizontal' : 'grid'}
                      isHero={index === 0 && currentPage === 1}
                      isCompared={comparedIds.includes(tour.id)}
                      onToggleCompare={handleToggleCompare}
                      isWishlisted={wishlistedTourIds.includes(tour.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))
                ) : (
                  <div className="catalog-empty">
                    <span className="catalog-empty-icon">🔍</span>
                    <h3>Không tìm thấy tour phù hợp</h3>
                    <p>Thử điều chỉnh lại bộ lọc, nơi khởi hành hoặc chọn vùng miền khác</p>
                    <button
                      type="button"
                      className="catalog-empty-reset"
                      onClick={() => {
                        resetAllFilters();
                        setSelectedDomesticSubregion('all');
                        setSelectedInternationalSubregion('all');
                        setLocalPriceMin(0);
                        setLocalPriceMax(PRICE_MAX);
                      }}
                    >
                      <i className="fa-solid fa-rotate-left" /> Xóa tất cả bộ lọc
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="catalog-pagination" aria-label="Phân trang">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                      <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`pagination-btn${currentPage === page ? ' active' : ''}`}
                        onClick={() => setCurrentPage(Number(page))}
                        aria-label={`Trang ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </nav>
              )}

              {/* Per-page selector */}
              {currentViewTours.length > 12 && (
                <div className="per-page-select-wrap">
                  <span>Hiển thị</span>
                  <select
                    id="catalog-per-page"
                    className="per-page-select"
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    aria-label="Số tour mỗi trang"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map(n => (
                      <option key={n} value={n}>{n} tour / trang</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Compare Float Bar ── */}
      {comparedIds.length > 0 && (
        <div className="compare-float-bar" role="region" aria-label="So sánh tour">
          <span className="compare-bar-label">
            <i className="fa-solid fa-scale-balanced" /> So sánh ({comparedIds.length}/3):
          </span>
          <div className="compare-bar-tours">
            {comparedTours.map(t => (
              <div key={t.id} className="compare-bar-item">
                <span title={t.title}>{t.shortTitle || t.title}</span>
                <button
                  type="button"
                  className="compare-bar-remove"
                  onClick={() => handleToggleCompare(t.id)}
                  aria-label={`Xóa ${t.title} khỏi so sánh`}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
            {comparedIds.length < 3 && (
              Array.from({ length: 3 - comparedIds.length }).map((_, i) => (
                <div key={`slot-${i}`} className="compare-bar-slot">+ thêm tour</div>
              ))
            )}
          </div>
          <div className="compare-bar-actions">
            <button
              type="button"
              className="compare-btn-primary"
              disabled={comparedIds.length < 2}
              onClick={() => setCompareModalOpen(true)}
            >
              <i className="fa-solid fa-eye" /> So Sánh ({comparedIds.length})
            </button>
            <button
              type="button"
              className="compare-btn-clear"
              onClick={() => setComparedIds([])}
            >
              Bỏ tất cả
            </button>
          </div>
        </div>
      )}

      {/* ── Comparison Modal ── */}
      {compareModalOpen && (
        <TourComparisonModal
          tours={comparedTours}
          onClose={() => setCompareModalOpen(false)}
          onRemoveTour={(id) => handleToggleCompare(id)}
          onBookTour={(id) => { setCompareModalOpen(false); navigate(`/checkout/${id}`); }}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tour } from '../../../types/tour.types';
import { formatCurrencyVND } from '../../../utils/formatters';

const RECENT_SEARCHES_KEY = 'webtravel_recent_searches';
const TRENDING_KEYWORDS = [
  'Hạ Long 5★',
  'Sapa Fansipan',
  'Phú Quốc Resort',
  'Nhật Bản Mùa Thu',
  'Đà Nẵng Hội An',
  'Bangkok Thái Lan'
];

interface EcommerceSearchBarProps {
  allTours: Tour[];
  selectedCategory?: 'all' | 'domestic' | 'international';
  onCategoryChange?: (cat: 'all' | 'domestic' | 'international') => void;
  initialKeyword?: string;
  onSearchSubmit?: (keyword: string) => void;
  placeholder?: string;
}

export const EcommerceSearchBar: React.FC<EcommerceSearchBarProps> = ({
  allTours,
  selectedCategory = 'all',
  onCategoryChange,
  initialKeyword = '',
  onSearchSubmit,
  placeholder = 'Tìm kiếm điểm đến, tên tour, vịnh đảo, khách sạn 5 sao...'
}) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState<'all' | 'domestic' | 'international'>(selectedCategory);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync category prop if passed
  useEffect(() => {
    if (selectedCategory) {
      setCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToRecentSearches = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRemoveRecentItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  const handleCategorySwitch = (cat: 'all' | 'domestic' | 'international') => {
    setCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  const executeSearch = (searchTerm: string) => {
    saveToRecentSearches(searchTerm);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchTerm);
    } else {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (category !== 'all') params.set('category', category);
      navigate(`/tours?${params.toString()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(keyword);
  };

  const handleSelectKeyword = (term: string) => {
    setKeyword(term);
    executeSearch(term);
  };

  const handleSelectTour = (tour: Tour) => {
    saveToRecentSearches(tour.title);
    setIsOpen(false);
    navigate(`/tour/${tour.id}`);
  };

  // Instant tour suggestions filtering
  const matchingTours = React.useMemo(() => {
    if (!keyword.trim()) return [];
    const lower = keyword.toLowerCase().trim();
    return allTours
      .filter((t) => {
        const matchesCategory = category === 'all' || t.category === category;
        const matchesQuery =
          t.title.toLowerCase().includes(lower) ||
          t.destination.toLowerCase().includes(lower) ||
          t.code.toLowerCase().includes(lower) ||
          (t.type && t.type.toLowerCase().includes(lower));
        return matchesCategory && matchesQuery;
      })
      .slice(0, 4);
  }, [allTours, keyword, category]);

  return (
    <div className="ecommerce-search-wrapper" ref={containerRef}>
      {/* Category Scope Tabs */}
      <div className="ecommerce-search-tabs">
        <button
          type="button"
          className={`ecom-tab-btn ${category === 'all' ? 'active' : ''}`}
          onClick={() => handleCategorySwitch('all')}
        >
          <i className="fa-solid fa-globe" /> Tất Cả
        </button>
        <button
          type="button"
          className={`ecom-tab-btn ${category === 'domestic' ? 'active' : ''}`}
          onClick={() => handleCategorySwitch('domestic')}
        >
          <i className="fa-solid fa-mountain-sun" /> Trong Nước
        </button>
        <button
          type="button"
          className={`ecom-tab-btn ${category === 'international' ? 'active' : ''}`}
          onClick={() => handleCategorySwitch('international')}
        >
          <i className="fa-solid fa-plane-departure" /> Quốc Tế
        </button>
      </div>

      {/* Main Search Bar Form */}
      <form className="ecommerce-search-box" onSubmit={handleSubmit}>
        <i className="fa-solid fa-magnifying-glass ecom-search-icon" />

        <input
          ref={inputRef}
          type="text"
          className="ecom-search-input"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setIsOpen(true)}
          aria-label="Tìm kiếm tour du lịch"
          autoComplete="off"
        />

        {keyword && (
          <button
            type="button"
            className="ecom-clear-btn"
            onClick={() => {
              setKeyword('');
              inputRef.current?.focus();
            }}
            title="Xóa từ khóa"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}

        <button type="submit" className="ecom-submit-btn">
          <i className="fa-solid fa-magnifying-glass" />
          <span>Tìm Kiếm</span>
        </button>
      </form>

      {/* Smart Popover Dropdown */}
      {isOpen && (
        <div className="ecommerce-search-popover">
          {/* Case 1: Typing with instant matching tours */}
          {keyword.trim().length > 0 ? (
            <div className="ecom-popover-section">
              <div className="ecom-section-header">
                <span className="ecom-section-title">
                  <i className="fa-solid fa-bolt" style={{ color: '#047857' }} /> Gợi ý tour phù hợp
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {matchingTours.length} kết quả
                </span>
              </div>

              {matchingTours.length > 0 ? (
                <div className="ecom-tour-results-list">
                  {matchingTours.map((t) => (
                    <div
                      key={t.id}
                      className="ecom-tour-result-item"
                      onClick={() => handleSelectTour(t)}
                    >
                      <img src={t.image} alt={t.title} className="ecom-tour-thumb" />
                      <div className="ecom-tour-info">
                        <h4 className="ecom-tour-title">{t.title}</h4>
                        <div className="ecom-tour-meta">
                          <span>
                            <i className="fa-solid fa-location-dot" style={{ color: '#10b981' }} /> {t.destination}
                          </span>
                          <span>•</span>
                          <span>
                            <i className="fa-regular fa-clock" /> {t.durationDays}N{t.durationNights}Đ
                          </span>
                        </div>
                      </div>
                      <div className="ecom-tour-price">
                        {formatCurrencyVND(t.priceAdult)}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="ecom-view-all-link"
                    onClick={() => executeSearch(keyword)}
                  >
                    Xem tất cả tour cho từ khóa "<strong>{keyword}</strong>" <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              ) : (
                <div style={{ padding: '1.25rem 0', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }} />
                  Không tìm thấy tour nào khớp với từ khóa "{keyword}".
                  <button
                    type="button"
                    className="ecom-view-all-link"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => executeSearch(keyword)}
                  >
                    Xem danh mục tất cả tour <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Case 2: Input empty -> Show Recent Searches & Trending Tags */
            <>
              {recentSearches.length > 0 && (
                <div className="ecom-popover-section">
                  <div className="ecom-section-header">
                    <span className="ecom-section-title">
                      <i className="fa-regular fa-clock" style={{ color: '#64748b' }} /> Lịch sử tìm kiếm
                    </span>
                    <button
                      type="button"
                      className="ecom-clear-all-btn"
                      onClick={handleClearAllRecent}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="ecom-tags-cloud">
                    {recentSearches.map((s, idx) => (
                      <span
                        key={idx}
                        className="ecom-tag-chip"
                        onClick={() => handleSelectKeyword(s)}
                      >
                        {s}
                        <button
                          type="button"
                          className="ecom-remove-tag"
                          onClick={(e) => handleRemoveRecentItem(e, s)}
                          title="Xóa mục này"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="ecom-popover-section">
                <div className="ecom-section-header">
                  <span className="ecom-section-title">
                    <i className="fa-solid fa-fire" style={{ color: '#ea580c' }} /> Xu hướng tìm kiếm Hot
                  </span>
                </div>
                <div className="ecom-tags-cloud">
                  {TRENDING_KEYWORDS.map((item, idx) => (
                    <span
                      key={idx}
                      className="ecom-tag-chip trending"
                      onClick={() => handleSelectKeyword(item)}
                    >
                      <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: '0.72rem' }} /> {item}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

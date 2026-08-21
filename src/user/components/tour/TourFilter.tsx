import React from 'react';

interface TourFilterProps {
  keyword: string;
  onKeywordChange: (val: string) => void;
  departure: string;
  onDepartureChange: (val: string) => void;
  category: 'all' | 'domestic' | 'international';
  onCategoryChange: (val: 'all' | 'domestic' | 'international') => void;
  starTier: 'all' | 'budget' | 'standard' | 'luxury';
  onStarTierChange: (val: 'all' | 'budget' | 'standard' | 'luxury') => void;
}

export const TourFilter: React.FC<TourFilterProps> = ({
  keyword,
  onKeywordChange,
  departure,
  onDepartureChange,
  category,
  onCategoryChange,
  starTier,
  onStarTierChange
}) => {
  return (
    <div className="filter-wrapper" style={{ marginBottom: '2.5rem' }}>
      {/* Primary Search Controls */}
      <div className="search-box-editorial">
        <div className="search-group">
          <label htmlFor="search-input"><i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm</label>
          <input
            type="text"
            id="search-input"
            placeholder="Điểm đến, tên tour, mã tour..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
        </div>

        <div className="search-group">
          <label htmlFor="departure-select"><i className="fa-solid fa-plane-departure"></i> Nơi khởi hành</label>
          <select
            id="departure-select"
            value={departure}
            onChange={(e) => onDepartureChange(e.target.value)}
          >
            <option value="all">Tất cả điểm đi</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="TP.HCM">TP. Hồ Chí Minh</option>
          </select>
        </div>

        <div className="search-group">
          <label htmlFor="category-select"><i className="fa-solid fa-earth-americas"></i> Phân loại</label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as 'all' | 'domestic' | 'international')}
          >
            <option value="all">Tất cả hành trình</option>
            <option value="domestic">Tour Trong Nước</option>
            <option value="international">Tour Quốc Tế</option>
          </select>
        </div>

        <div className="search-group">
          <label htmlFor="product-tier-select"><i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i> Hạng sao</label>
          <select
            id="product-tier-select"
            value={starTier}
            onChange={(e) => onStarTierChange(e.target.value as 'all' | 'budget' | 'standard' | 'luxury')}
          >
            <option value="all">Tất cả phân khúc</option>
            <option value="luxury">5★ Dòng Cao Cấp</option>
            <option value="standard">4★ Dòng Tiêu Chuẩn</option>
            <option value="budget">3★ Dòng Tiết Kiệm</option>
          </select>
        </div>
      </div>

      {/* Bento Star Rating Filter Bar */}
      <div className="bento-star-filter-bar">
        <button
          type="button"
          className={`bento-star-btn ${starTier === 'all' ? 'active' : ''}`}
          onClick={() => onStarTierChange('all')}
        >
          <i className="fa-solid fa-layer-group"></i> Tất Cả Hạng Sao
        </button>
        <button
          type="button"
          className={`bento-star-btn ${starTier === 'luxury' ? 'active' : ''}`}
          onClick={() => onStarTierChange('luxury')}
        >
          <i className="fa-solid fa-crown" style={{ color: '#f59e0b' }}></i> 5★ Dòng Cao Cấp
        </button>
        <button
          type="button"
          className={`bento-star-btn ${starTier === 'standard' ? 'active' : ''}`}
          onClick={() => onStarTierChange('standard')}
        >
          <i className="fa-solid fa-medal" style={{ color: '#3b82f6' }}></i> 4★ Dòng Tiêu Chuẩn
        </button>
        <button
          type="button"
          className={`bento-star-btn ${starTier === 'budget' ? 'active' : ''}`}
          onClick={() => onStarTierChange('budget')}
        >
          <i className="fa-solid fa-tag" style={{ color: '#10b981' }}></i> 3★ Dòng Tiết Kiệm
        </button>
      </div>

      {/* Category Pills */}
      <div className="category-tabs" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button
          type="button"
          className={`category-pill ${category === 'all' ? 'active' : ''}`}
          onClick={() => onCategoryChange('all')}
        >
          Tất Cả
        </button>
        <button
          type="button"
          className={`category-pill ${category === 'domestic' ? 'active' : ''}`}
          onClick={() => onCategoryChange('domestic')}
        >
          🇻🇳 Trong Nước
        </button>
        <button
          type="button"
          className={`category-pill ${category === 'international' ? 'active' : ''}`}
          onClick={() => onCategoryChange('international')}
        >
          ✈️ Quốc Tế
        </button>
      </div>
    </div>
  );
};

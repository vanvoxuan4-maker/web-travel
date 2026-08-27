import React from 'react';
import { Link } from 'react-router-dom';
import { Tour } from '../../../types/tour.types';
import { formatCurrencyVND } from '../../../utils/formatters';

interface TourCardProps {
  tour: Tour;
  layout?: 'grid' | 'horizontal';
  isHero?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (tourId: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (tourId: string) => void;
  onQuickBook?: (tourId: string) => void;
  badgeType?: 'discount' | 'all-inclusive' | 'standard';
  discountPercent?: number;
  originalPrice?: number;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  layout = 'grid',
  isCompared,
  onToggleCompare,
  isWishlisted,
  onToggleWishlist,
  badgeType = 'standard',
  discountPercent,
  originalPrice
}) => {
  // Tier label & class
  const tierClass = tour.tier === 'luxury' 
    ? 'tier-luxury' 
    : tour.tier === 'budget' 
      ? 'tier-budget' 
      : 'tier-standard';

  const tierLabel = tour.tierName || (
    tour.tier === 'luxury' 
      ? 'Dòng Cao Cấp' 
      : tour.tier === 'budget' 
        ? 'Dòng Tiết Kiệm' 
        : 'Tiêu Chuẩn'
  );

  // Region / Type tag
  const regionTag = tour.type || (tour.category === 'domestic' ? 'Tour Trong Nước' : 'Tour Quốc Tế');

  // Departure summary
  const departureCity = tour.departureFrom.split('/')[0].trim();

  // Clean ESG & LEI scores
  const esgVal = tour.esgScore ? tour.esgScore.split('(')[0].replace('/100', '').trim() : '88';
  const leiVal = tour.leiScore ? tour.leiScore.split('(')[0].replace('/100', '').trim() : '84';

  const effectiveOriginalPrice = originalPrice || tour.originalPrice;
  const effectiveDiscountPercent = discountPercent || tour.discountPercent || (
    effectiveOriginalPrice && effectiveOriginalPrice > tour.priceAdult
      ? Math.round(((effectiveOriginalPrice - tour.priceAdult) / effectiveOriginalPrice) * 100)
      : undefined
  );
  const effectiveBadgeType = badgeType !== 'standard' 
    ? badgeType 
    : (effectiveDiscountPercent || tour.isFlashSale) 
      ? 'discount' 
      : tour.tier === 'luxury' 
        ? 'all-inclusive' 
        : 'standard';

  const holidayDep = tour.departureDates?.find(d => d.label && (d.label.includes('Lễ') || d.label.includes('Tết') || d.label.includes('Quốc Khánh') || d.label.includes('Giáng Sinh') || d.label.includes('Năm Mới')));
  const tourUrl = `/tour/${tour.slug || tour.id}`;

  // Next departure date
  const nextDate = tour.departureDates && tour.departureDates.length > 0
    ? tour.departureDates[0].date
    : tour.availableDates && tour.availableDates.length > 0
      ? tour.availableDates[0]
      : 'Khởi hành hàng ngày';

  /* ─────────────────────────────────────────────────────────────
     1. HORIZONTAL CARD LAYOUT (VIETRAVEL SIGNATURE DESKTOP STYLE)
     ───────────────────────────────────────────────────────────── */
  if (layout === 'horizontal') {
    return (
      <article className={`vietravel-tour-card-h ${isCompared ? 'is-compared' : ''}`} data-id={tour.id}>
        {/* Left Column: Image with Badges */}
        <div className="vt-card-img-wrap">
          <Link to={tourUrl} aria-label={`Xem chi tiết ${tour.title}`} style={{ display: 'block', height: '100%' }}>
            <img src={tour.image} alt={tour.title} loading="lazy" />
          </Link>

          {/* Tier Badge */}
          <span className={`card-tier-pill ${tierClass}`}>
            {tierLabel}
          </span>

          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              type="button"
              className="card-action-btn card-wishlist-btn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(tour.id); }}
              title={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
              aria-label={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
            >
              <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ color: isWishlisted ? '#e11d48' : '#64748b' }}></i>
            </button>
          )}

          {/* Bottom Badge Bar */}
          <div className="card-bottom-overlay">
            <div className="card-esg-lei-pill">
              <span className="esg-part">ESG: {esgVal}</span>
              <span className="divider-part">|</span>
              <span className="lei-part">LEI: {leiVal}</span>
            </div>

            {effectiveBadgeType === 'discount' ? (
              <div className="card-discount-badge-pill">
                <i className="fa-solid fa-bolt"></i> GIẢM {effectiveDiscountPercent || 25}%
              </div>
            ) : effectiveBadgeType === 'all-inclusive' ? (
              <div className="card-inclusive-badge-pill">
                <i className="fa-solid fa-crown"></i> TRỌN GÓI 5★
              </div>
            ) : (
              <div className="card-standard-badge-pill">
                <i className="fa-solid fa-star" style={{ color: '#fbbf24' }}></i> Nổi Bật
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Detailed Tour Specifications */}
        <div className="vt-card-info-col">
          {/* Header meta row: Code & Region tag */}
          <div className="vt-card-meta-header">
            <span className="vt-tour-code">
              <i className="fa-solid fa-barcode"></i> Mã tour: <strong>{tour.code || tour.id}</strong>
            </span>
            <span className="card-tag-pill">
              {regionTag}
            </span>
            {holidayDep && (
              <span className="vt-holiday-pill">
                <i className="fa-solid fa-fire"></i> {holidayDep.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="vt-card-title">
            <Link to={tourUrl} title={tour.title}>
              {tour.title}
            </Link>
          </h3>

          {/* Specifications Grid: Departure, Duration, Transport, Hotel */}
          <div className="vt-specs-grid">
            <div className="vt-spec-item">
              <i className="fa-solid fa-location-dot" style={{ color: '#059669' }}></i>
              <span>Nơi khởi hành: <strong>{departureCity}</strong></span>
            </div>
            <div className="vt-spec-item">
              <i className="fa-regular fa-clock" style={{ color: '#0284c7' }}></i>
              <span>Thời gian: <strong>{tour.durationDays}N{tour.durationNights}Đ</strong></span>
            </div>
            <div className="vt-spec-item">
              <i className="fa-solid fa-plane-departure" style={{ color: '#d97706' }}></i>
              <span>Phương tiện: <strong>Hàng không / Xe du lịch</strong></span>
            </div>
            <div className="vt-spec-item">
              <i className="fa-solid fa-hotel" style={{ color: '#8b5cf6' }}></i>
              <span>Khách sạn: <strong>{tour.hotelTier || `${tour.starRating || 4} Sao`}</strong></span>
            </div>
          </div>

          {/* Next departure dates badges & Seats left */}
          <div className="vt-card-dates-row">
            <div className="vt-departure-dates-wrap">
              <span className="vt-dates-label">Lịch khởi hành:</span>
              <span className="vt-date-badge active">
                <i className="fa-regular fa-calendar-check"></i> {nextDate}
              </span>
              {tour.departureDates && tour.departureDates.length > 1 && (
                <span className="vt-date-badge">
                  +{tour.departureDates.length - 1} ngày khác
                </span>
              )}
            </div>

            {tour.seatsLeft !== undefined && tour.seatsLeft > 0 && (
              <div className="vt-seats-badge">
                <i className="fa-solid fa-bolt"></i>
                <span>Còn <strong>{tour.seatsLeft} chỗ</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Action CTA */}
        <div className="vt-card-action-col">
          {/* Rating */}
          <div className="vt-rating-box">
            <div className="vt-stars">
              <i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i>
              <strong>{tour.rating || 4.9}</strong>
            </div>
            <span className="vt-review-count">({tour.reviewsCount || 48} đánh giá)</span>
          </div>

          {/* Price Box */}
          <div className="vt-price-box">
            {effectiveOriginalPrice && effectiveOriginalPrice > tour.priceAdult ? (
              <span className="vt-original-price">
                {formatCurrencyVND(effectiveOriginalPrice)}
              </span>
            ) : (
              <span className="vt-price-sub">Giá trọn gói từ:</span>
            )}
            <span className="vt-final-price" style={{ color: effectiveBadgeType === 'discount' ? '#dc2626' : '#047857' }}>
              {formatCurrencyVND(tour.priceAdult)}
            </span>
            <span className="vt-price-unit">/ khách</span>
          </div>

          {/* Action CTA */}
          <div className="vt-actions-group">
            <Link to={tourUrl} className="btn-vietravel-primary">
              Xem Chi Tiết <i className="fa-solid fa-arrow-right"></i>
            </Link>

            {onToggleCompare && (
              <button
                type="button"
                className={`btn-vietravel-compare ${isCompared ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(tour.id); }}
                title={isCompared ? 'Bỏ chọn so sánh' : 'Thêm vào bảng so sánh'}
              >
                <i className="fa-solid fa-scale-balanced"></i>
                <span>{isCompared ? 'Đã chọn so sánh' : 'So sánh'}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. GRID BENTO CARD LAYOUT (HOMEPAGE & GRID VIEW)
     ───────────────────────────────────────────────────────────── */
  return (
    <div className={`tour-card-bento ${isCompared ? 'is-compared' : ''}`} data-id={tour.id}>
      {/* 1. Image Area with Badges & Symmetrical Bottom Overlay */}
      <div className="card-img-wrap">
        <Link to={tourUrl} aria-label={`Xem chi tiết ${tour.title}`} style={{ display: 'block', height: '100%' }}>
          <img src={tour.image} alt={tour.title} loading="lazy" />
        </Link>

        {/* Top-Left Tier Pill Badge */}
        <span className={`card-tier-pill ${tierClass}`}>
          {tierLabel}
        </span>

        {/* Top-Right Action Controls (Wishlist & Compare) */}
        <div className="card-top-actions">
          {onToggleCompare && (
            <button
              type="button"
              className={`card-action-btn card-compare-btn ${isCompared ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(tour.id); }}
              title={isCompared ? 'Đang so sánh (Nhấp để bỏ)' : 'Thêm vào so sánh'}
              aria-label={isCompared ? 'Bỏ so sánh' : 'So sánh tour'}
            >
              <i className="fa-solid fa-scale-balanced" style={{ color: isCompared ? '#047857' : '#64748b' }}></i>
            </button>
          )}

          {onToggleWishlist && (
            <button
              type="button"
              className="card-action-btn card-wishlist-btn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(tour.id); }}
              title={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
              aria-label={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
            >
              <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ color: isWishlisted ? '#e11d48' : '#64748b' }}></i>
            </button>
          )}
        </div>

        {/* Symmetrical Bottom of Image Overlay Bar (ESG/LEI on Left, Dynamic Badge on Right) */}
        <div className="card-bottom-overlay">
          <div className="card-esg-lei-pill">
            <span className="esg-part">ESG: {esgVal}</span>
            <span className="divider-part">|</span>
            <span className="lei-part">LEI: {leiVal}</span>
          </div>

          {/* Badge Giảm Giá hoặc Badge Trọn Gói */}
          {effectiveBadgeType === 'discount' ? (
            <div className="card-discount-badge-pill">
              <i className="fa-solid fa-bolt"></i> GIẢM {effectiveDiscountPercent || 30}%
            </div>
          ) : effectiveBadgeType === 'all-inclusive' ? (
            <div className="card-inclusive-badge-pill">
              <i className="fa-solid fa-crown"></i> TRỌN GÓI 5★
            </div>
          ) : (
            <div className="card-standard-badge-pill">
              <i className="fa-solid fa-star" style={{ color: '#fbbf24' }}></i> Nổi Bật
            </div>
          )}
        </div>
      </div>

      {/* 2. Card Body Content (Compact & Clean) */}
      <div className="card-body">
        {/* Rating & Reviews row */}
        <div className="card-rating-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <i className="fa-solid fa-star" style={{ color: '#f59e0b', fontSize: '0.75rem' }}></i>
            <strong style={{ color: '#1e293b' }}>{tour.rating || 4.9}</strong>
            <span style={{ color: '#94a3b8' }}>({tour.reviewsCount || 48} đánh giá)</span>
          </div>

          {tour.seatsLeft !== undefined && tour.seatsLeft > 0 && tour.seatsLeft <= 8 && (
            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: '0.65rem' }}></i> Còn {tour.seatsLeft} chỗ
            </span>
          )}
        </div>

        {/* Title Row with Award Medal Icon & Interactive Hover Popover Tooltip */}
        <div className="card-title-wrap">
          <i className="fa-solid fa-award card-award-icon" title="Hành trình chuẩn chất lượng"></i>
          
          <h3 className="card-title-text">
            <Link to={tourUrl} title={tour.shortTitle || tour.title}>
              {tour.shortTitle || tour.title}
            </Link>
          </h3>

          {/* Full Title Floating Bubble on Hover */}
          <div className="title-hover-tooltip">
            {tour.title}
          </div>
        </div>

        {/* Location & Duration Row */}
        <div className="card-info-row">
          <span className="card-info-item">
            <i className="fa-solid fa-location-dot"></i> {departureCity}
          </span>
          <span className="card-info-item">
            <i className="fa-regular fa-clock"></i> {tour.durationDays}N{tour.durationNights}Đ
          </span>
        </div>

        {/* Category / Region Tag & Holiday Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
          <span className="card-tag-pill">
            {regionTag}
          </span>
          {holidayDep && (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e11d48', background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.15rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <i className="fa-solid fa-fire" style={{ fontSize: '0.65rem' }}></i> {holidayDep.label}
            </span>
          )}
        </div>

        {/* 3. Card Footer (Price & Capsule Detail Button) */}
        <div className="card-footer-redesigned">
          <div className="card-price-group">
            {effectiveOriginalPrice && effectiveOriginalPrice > tour.priceAdult ? (
              <span className="card-original-price">
                {formatCurrencyVND(effectiveOriginalPrice)}
              </span>
            ) : (
              <span className="card-price-label">Giá từ:</span>
            )}
            <span className="card-price-value" style={{ color: effectiveBadgeType === 'discount' ? '#dc2626' : undefined }}>
              {formatCurrencyVND(tour.priceAdult)}
            </span>
          </div>

          <Link to={tourUrl} className="btn-capsule-detail">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

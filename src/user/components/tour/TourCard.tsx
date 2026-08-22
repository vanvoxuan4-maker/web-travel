import React from 'react';
import { Link } from 'react-router-dom';
import { Tour } from '../../../types/tour.types';
import { formatCurrencyVND } from '../../../utils/formatters';

interface TourCardProps {
  tour: Tour;
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
        : 'Tiêu chuẩn'
  );

  // Region / Type tag
  const regionTag = tour.type || (tour.category === 'domestic' ? 'Tour Trong Nước' : 'Tour Quốc Tế');

  // Departure summary (extract first city if multiple)
  const departureCity = tour.departureFrom.split('/')[0].trim();

  // Format ESG & LEI to clean numeric scores only
  const esgVal = tour.esgScore ? tour.esgScore.split('(')[0].replace('/100', '').trim() : '84';
  const leiVal = tour.leiScore ? tour.leiScore.split('(')[0].replace('/100', '').trim() : '76';

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

  return (
    <div className="tour-card-bento" data-id={tour.id}>
      {/* 1. Image Area with Badges & Symmetrical Bottom Overlay */}
      <div className="card-img-wrap">
        <Link to={`/tour/${tour.id}`} aria-label={`Xem chi tiết ${tour.title}`} style={{ display: 'block', height: '100%' }}>
          <img src={tour.image} alt={tour.title} loading="lazy" />
        </Link>

        {/* Top-Left Tier Pill Badge */}
        <span className={`card-tier-pill ${tierClass}`}>
          {tierLabel}
        </span>

        {/* Top-Right Wishlist Button */}
        {onToggleWishlist && (
          <button
            type="button"
            className="card-wishlist-btn"
            onClick={() => onToggleWishlist(tour.id)}
            title={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
          >
            <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ color: isWishlisted ? '#e11d48' : '#64748b' }}></i>
          </button>
        )}

        {/* Symmetrical Bottom of Image Overlay Bar (ESG/LEI on Left, Dynamic Badge on Right) */}
        <div className="card-bottom-overlay">
          <div className="card-esg-lei-pill">
            <span className="esg-part">ESG: {esgVal}</span>
            <span className="divider-part">|</span>
            <span className="lei-part">LEI: {leiVal}</span>
          </div>

          {/* Badge Giảm Giá hoặc Badge Trọn Gói thay cho Xem Nhanh */}
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
        {/* Title Row with Award Medal Icon & Interactive Hover Popover Tooltip */}
        <div className="card-title-wrap">
          <i className="fa-solid fa-award card-award-icon" title="Hành trình chuẩn chất lượng"></i>
          
          <h3 className="card-title-text">
            <Link to={`/tour/${tour.id}`} title={tour.shortTitle || tour.title}>
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

        {/* Category / Region Tag Pill */}
        <span className="card-tag-pill">
          {regionTag}
        </span>

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

          <Link to={`/tour/${tour.id}`} className="btn-capsule-detail">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

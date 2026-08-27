import React, { useRef } from 'react';
import { TOURS_DATA } from '../../../data/toursData';
import { TourCard } from '../tour/TourCard';

import { Tour } from '../../../types/tour.types';

interface AllInclusiveSectionProps {
  tours?: Tour[];
  wishlistedTourIds?: string[];
  onToggleWishlist?: (tourId: string) => void;
  comparedTourIds?: string[];
  onToggleCompare?: (tourId: string) => void;
  onQuickBook?: (tourId: string) => void;
}

export const AllInclusiveSection: React.FC<AllInclusiveSectionProps> = ({
  tours,
  wishlistedTourIds = [],
  onToggleWishlist,
  comparedTourIds = [],
  onToggleCompare,
  onQuickBook
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Only display tours that are explicitly marked as All-Inclusive
  const allInclusiveTours = (tours ? tours : TOURS_DATA).filter(
    t => t.isActive !== false && Boolean(t.isAllInclusive)
  );

  if (allInclusiveTours.length === 0) return null;

  return (
    <section className="all-inclusive-section" style={{ background: '#f8fafc', padding: '2.5rem 0 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#047857', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.5rem', border: '1px solid #a7f3d0' }}>
            <i className="fa-solid fa-crown"></i> CHUẨN MỰC DỊCH VỤ 5 SAO
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.15rem', color: '#111827', margin: '0 0 0.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Hành Trình Tour Trọn Gói Cao Cấp
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.94rem', lineHeight: 1.55, margin: 0 }}>
            Tận hưởng kỳ nghỉ trọn vẹn không lo phát sinh chi phí: Đã bao gồm vé máy bay, khách sạn 5★, hướng dẫn viên tận tâm suốt tuyến và bảo hiểm du lịch quốc tế 1 tỷ đồng.
          </p>
        </div>

        {/* 4 Inclusions Pill Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-plane-circle-check"></i>
            </div>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#1e293b', display: 'block' }}>Vé Bay &amp; Xe Đưa Đón</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Hàng không chuẩn quốc gia</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-hotel"></i>
            </div>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#1e293b', display: 'block' }}>Khách Sạn &amp; Resort 5★</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Vị trí trung tâm đắc địa</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#1e293b', display: 'block' }}>Ẩm Thực Đặc Sản</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Buffet &amp; Set menu chọn lọc</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#1e293b', display: 'block' }}>Bảo Hiểm 1 Tỷ Đồng</strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>An tâm tuyệt đối trọn vẹn</span>
            </div>
          </div>
        </div>

        {/* Horizontal Smooth Carousel (Băng Chuyền Trượt Ngang) */}
        <div className="tour-carousel-wrapper">
          {/* Navigation Arrows */}
          <button 
            type="button" 
            className="carousel-nav-btn prev"
            onClick={() => handleScroll('left')}
            aria-label="Previous all-inclusive tours"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <div className="tour-carousel-track" ref={trackRef}>
            {allInclusiveTours.map((tour) => (
              <div className="tour-carousel-item" key={tour.id}>
                <TourCard 
                  tour={tour}
                  isCompared={comparedTourIds.includes(tour.id)}
                  onToggleCompare={onToggleCompare}
                  isWishlisted={wishlistedTourIds.includes(tour.id)}
                  onToggleWishlist={onToggleWishlist}
                  onQuickBook={onQuickBook}
                  badgeType="all-inclusive"
                />
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="carousel-nav-btn next"
            onClick={() => handleScroll('right')}
            aria-label="Next all-inclusive tours"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

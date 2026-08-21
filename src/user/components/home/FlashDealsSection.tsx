import React, { useState, useEffect, useRef } from 'react';
import { TOURS_DATA } from '../../../data/toursData';
import { TourCard } from '../tour/TourCard';

interface FlashDealsSectionProps {
  wishlistedTourIds?: string[];
  onToggleWishlist?: (tourId: string) => void;
  onQuickBook?: (tourId: string) => void;
}

export const FlashDealsSection: React.FC<FlashDealsSectionProps> = ({
  wishlistedTourIds = [],
  onToggleWishlist,
  onQuickBook
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Dynamic countdown timer for Flash Deals (Ends in 2 days)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 42
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Calculate discount percentage & original price for flash deal tours
  const dealTours = TOURS_DATA.map((tour, idx) => {
    const discountRate = idx % 3 === 0 ? 0.3 : idx % 3 === 1 ? 0.25 : 0.2;
    const originalPrice = Math.round(tour.priceAdult / (1 - discountRate));
    return {
      ...tour,
      discountPercent: Math.round(discountRate * 100),
      originalPrice
    };
  });

  if (dealTours.length === 0) return null;

  return (
    <section className="flash-deals-section" style={{ background: 'linear-gradient(180deg, #fef2f2 0%, #fff7ed 100%)', padding: '3.5rem 0 2.5rem', borderTop: '1px solid #fee2e2', borderBottom: '1px solid #fed7aa' }}>
      <div className="container">
        
        {/* Section Header with Countdown Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              <i className="fa-solid fa-fire-flame-curved"></i> SỐ LƯỢNG CÓ HẠN • SALE GIỜ CHÓT
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#991b1b', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Ưu Đãi Flash Sale 30% Trong Tuần
            </h2>
            <p style={{ color: '#7c2d12', fontSize: '0.92rem', margin: '0.35rem 0 0' }}>
              Các hành trình giữ giá tốt nhất, áp dụng cho khách hàng đăng ký sớm hôm nay
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.65rem 1.2rem', borderRadius: '14px', boxShadow: '0 8px 20px rgba(220,38,38,0.12)', border: '1.5px solid #fecaca' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginRight: '0.25rem' }}>
              <i className="fa-regular fa-clock"></i> Kết thúc sau:
            </span>
            
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', background: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', padding: '0.2rem 0.45rem', borderRadius: '6px', minWidth: '32px' }}>
                {timeLeft.days.toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: 700 }}>Ngày</span>
            </div>
            <span style={{ fontWeight: 800, color: '#dc2626' }}>:</span>

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', background: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', padding: '0.2rem 0.45rem', borderRadius: '6px', minWidth: '32px' }}>
                {timeLeft.hours.toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: 700 }}>Giờ</span>
            </div>
            <span style={{ fontWeight: 800, color: '#dc2626' }}>:</span>

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', background: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', padding: '0.2rem 0.45rem', borderRadius: '6px', minWidth: '32px' }}>
                {timeLeft.minutes.toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: 700 }}>Phút</span>
            </div>
            <span style={{ fontWeight: 800, color: '#dc2626' }}>:</span>

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', background: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', padding: '0.2rem 0.45rem', borderRadius: '6px', minWidth: '32px' }}>
                {timeLeft.seconds.toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: 700 }}>Giây</span>
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
            aria-label="Previous tours"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <div className="tour-carousel-track" ref={trackRef}>
            {dealTours.map((tour) => (
              <div className="tour-carousel-item" key={tour.id}>
                <TourCard 
                  tour={tour}
                  isWishlisted={wishlistedTourIds.includes(tour.id)}
                  onToggleWishlist={onToggleWishlist}
                  onQuickBook={onQuickBook}
                  badgeType="discount"
                  discountPercent={tour.discountPercent}
                  originalPrice={tour.originalPrice}
                />
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="carousel-nav-btn next"
            onClick={() => handleScroll('right')}
            aria-label="Next tours"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

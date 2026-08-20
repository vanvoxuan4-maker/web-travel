import React from 'react';

interface DestinationItem {
  id: string;
  name: string;
  region: string;
  image: string;
  tourCount: number;
  keyword: string;
  category?: 'domestic' | 'international';
  highlight: string;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: 'halong',
    name: 'Vịnh Hạ Long',
    region: 'Quảng Ninh, Việt Nam',
    image: '/images/banner_halong.png',
    tourCount: 15,
    keyword: 'Hạ Long',
    category: 'domestic',
    highlight: 'Kỳ quan thế giới & Du thuyền 5 sao'
  },
  {
    id: 'phuquoc',
    name: 'Đảo Ngọc Phú Quốc',
    region: 'Kiên Giang, Việt Nam',
    image: '/images/banner_phuquoc.png',
    tourCount: 22,
    keyword: 'Phú Quốc',
    category: 'domestic',
    highlight: 'Thiên đường biển nhiệt đới & Resort'
  },
  {
    id: 'japan',
    name: 'Tokyo & Núi Phú Sĩ',
    region: 'Nhật Bản',
    image: '/images/banner_japan.png',
    tourCount: 12,
    keyword: 'Nhật Bản',
    category: 'international',
    highlight: 'Cung đường vàng & Mùa hoa anh đào'
  },
  {
    id: 'sapa',
    name: 'Sapa & Fansipan',
    region: 'Lào Cai, Việt Nam',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    tourCount: 18,
    keyword: 'Sapa',
    category: 'domestic',
    highlight: 'Nóc nhà Đông Dương & Ruộng bậc thang'
  },
  {
    id: 'thailand',
    name: 'Bangkok & Pattaya',
    region: 'Thái Lan',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop&q=80',
    tourCount: 14,
    keyword: 'Thái Lan',
    category: 'international',
    highlight: 'Xứ sở chùa Vàng & Ẩm thực đường phố'
  },
  {
    id: 'danang',
    name: 'Đà Nẵng & Hội An',
    region: 'Miền Trung, Việt Nam',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80',
    tourCount: 20,
    keyword: 'Đà Nẵng',
    category: 'domestic',
    highlight: 'Cầu Vàng Bà Nà Hills & Phố cổ đèn lồng'
  }
];

interface TrendingDestinationsProps {
  onSelectDestination: (keyword: string, category?: 'all' | 'domestic' | 'international') => void;
}

export const TrendingDestinations: React.FC<TrendingDestinationsProps> = ({ onSelectDestination }) => {
  const handleClick = (dest: DestinationItem) => {
    onSelectDestination(dest.keyword, dest.category || 'all');
    const el = document.getElementById('tours-explorer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="trending-destinations-section container" style={{ padding: '3.5rem 1rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
            <i className="fa-solid fa-fire" style={{ marginRight: '0.35rem' }}></i> Xu Hướng Du Lịch 2026
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', color: '#111827', margin: '0.2rem 0' }}>
            Điểm Đến Được Yêu Thích Nhất
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Khám phá những vùng đất tuyệt đẹp được hàng triệu du khách bình chọn
          </p>
        </div>

        <div style={{ fontSize: '0.88rem', color: 'var(--accent-forest)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={() => onSelectDestination('', 'all')}>
          <span>Xem tất cả điểm đến</span>
          <i className="fa-solid fa-arrow-right"></i>
        </div>
      </div>

      {/* 6-Card Responsive Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {DESTINATIONS.map((dest) => (
          <div
            key={dest.id}
            onClick={() => handleClick(dest)}
            className="destination-card"
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '240px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
          >
            {/* Background Image Layer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${dest.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.5s ease'
              }}
              className="dest-bg-img"
            />

            {/* Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.45) 50%, rgba(15, 23, 42, 0.92) 100%)'
              }}
            />

            {/* Top Badge: Tour Count */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 2 }}>
              <span 
                style={{ 
                  background: 'rgba(5, 150, 105, 0.95)', 
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff', 
                  fontSize: '0.78rem', 
                  fontWeight: 700, 
                  padding: '0.3rem 0.75rem', 
                  borderRadius: '9999px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}
              >
                {dest.tourCount}+ Hành Trình
              </span>
            </div>

            {/* Bottom Content Info */}
            <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem', zIndex: 2 }}>
              <div className="dest-card-region">
                <i className="fa-solid fa-location-dot" style={{ color: '#34d399' }}></i> {dest.region}
              </div>
              <h3 className="dest-card-title">
                {dest.name}
              </h3>
              <p className="dest-card-desc">
                {dest.highlight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

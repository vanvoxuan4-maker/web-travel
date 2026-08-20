import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface ItineraryMapProps {
  tour: Tour;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ tour }) => {
  const [activeStop, setActiveStop] = useState<number>(0);

  // Derive geographical stops from destination and itinerary
  const stops = tour.itinerary.map((it, idx) => ({
    day: it.day,
    title: it.title,
    activity: it.activities || 'Tham quan và nghỉ dưỡng',
    highlight: idx === 0 ? 'Điểm xuất phát & Khởi hành' : idx === tour.itinerary.length - 1 ? 'Điểm kết thúc hành trình' : 'Điểm danh thắng nổi bật'
  }));

  return (
    <section className="detail-section" id="section-map">
      <div className="section-title-wrap">
        <h2 className="detail-section-title">
          <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--accent-forest)' }}></i> Bản Đồ Lộ Trình & Điểm Dừng Chân
        </h2>
        <p className="detail-section-desc">
          Tổng quan tuyến đường di chuyển từng ngày, các mốc tham quan và danh thắng tiêu biểu.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        {/* Interactive Stops Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#111827' }}>
            <i className="fa-solid fa-route" style={{ color: 'var(--accent-forest)' }}></i> Lộ trình {stops.length} ngày:
          </h4>
          {stops.map((stop, idx) => {
            const isActive = activeStop === idx;
            return (
              <button
                key={stop.day}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: isActive ? '#ffffff' : 'transparent',
                  border: isActive ? '2px solid var(--accent-forest)' : '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveStop(idx)}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--accent-forest)' : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {stop.day}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#111827', display: 'block' }}>{stop.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stop.highlight}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Map Simulation Panel */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <span className="badge badge-emerald">Chặng Ngày {stops[activeStop]?.day}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#ef4444' }}></i> {tour.destination}
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#111827', margin: '0 0 0.5rem' }}>
              {stops[activeStop]?.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {stops[activeStop]?.activity}
            </p>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginTop: '1rem', fontSize: '0.82rem', color: '#15803d' }}>
              <i className="fa-solid fa-circle-info"></i> Xe du lịch Limousine cao cấp & hướng dẫn viên theo đoàn suốt toàn bộ cung đường này.
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Khởi hành từ: <strong>{tour.departureFrom}</strong></span>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(stops[activeStop]?.title + ' ' + tour.destination)}`, '_blank')}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Mở Google Maps
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

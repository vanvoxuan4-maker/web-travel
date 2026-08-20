import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface ItineraryTimelineProps {
  tour: Tour;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ tour }) => {
  const [activeDayModal, setActiveDayModal] = useState<number | null>(null);

  const itinerary = tour.itinerary || [];

  return (
    <section className="detail-section" id="section-itinerary">
      <div className="section-title-wrap">
        <h2 className="detail-section-title">
          <i className="fa-solid fa-route" style={{ color: 'var(--accent-forest)' }}></i> Lịch Trình Từng Ngày Chi Tiết
        </h2>
        <p className="detail-section-desc">
          Hành trình được tối ưu hóa thời gian di chuyển, trải nghiệm văn hóa và nghỉ dưỡng đẳng cấp.
        </p>
      </div>

      <div className="itinerary-timeline-track">
        <div className="itinerary-timeline-line"></div>
        {itinerary.map(dayItem => (
          <div key={dayItem.day} className="itinerary-day-section-block">
            <div className="itinerary-pin-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>

            <div className="itinerary-day-top-box">
              <div className="itinerary-day-top-content">
                <div className="itinerary-day-highlight-title">Ngày {dayItem.day}</div>
                <div className="itinerary-day-route-text">{dayItem.title}</div>
                <div className="itinerary-row-meals">
                  <i className="fa-solid fa-utensils" style={{ color: '#0284c7' }}></i> Ăn sáng, trưa, tối
                </div>
              </div>
              <button 
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', alignSelf: 'flex-start' }}
                onClick={() => setActiveDayModal(dayItem.day)}
              >
                <i className="fa-solid fa-expand"></i> Xem ảnh & chi tiết
              </button>
            </div>

            <div className="itinerary-day-bottom-box">
              <div className="itinerary-main-activity-label">
                Hoạt động nổi bật: {dayItem.activities || 'Tham quan và khám phá'}
              </div>
              <ul className="itinerary-bullet-points-list">
                {dayItem.morning && <li><strong>Buổi sáng:</strong> {dayItem.morning}</li>}
                {dayItem.afternoon && <li><strong>Buổi chiều:</strong> {dayItem.afternoon}</li>}
                {dayItem.evening && <li><strong>Buổi tối:</strong> {dayItem.evening}</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Itinerary Day Modal Preview */}
      {activeDayModal !== null && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setActiveDayModal(null); }}>
          <div className="modal-container" style={{ maxWidth: '640px', width: '90%' }}>
            <button type="button" className="modal-close-btn" onClick={() => setActiveDayModal(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            {(() => {
              const dayObj = itinerary.find(d => d.day === activeDayModal);
              if (!dayObj) return null;
              return (
                <div style={{ padding: '1.5rem' }}>
                  <span className="badge badge-nature">Ngày {dayObj.day}</span>
                  <h3 style={{ margin: '0.4rem 0 1rem', fontSize: '1.25rem', color: '#111827' }}>{dayObj.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#374151' }}>
                    {dayObj.morning && <div><strong style={{ color: 'var(--accent-forest)' }}>Buổi sáng:</strong> {dayObj.morning}</div>}
                    {dayObj.afternoon && <div><strong style={{ color: 'var(--accent-forest)' }}>Buổi chiều:</strong> {dayObj.afternoon}</div>}
                    {dayObj.evening && <div><strong style={{ color: 'var(--accent-forest)' }}>Buổi tối:</strong> {dayObj.evening}</div>}
                  </div>
                  <button type="button" className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setActiveDayModal(null)}>
                    Đóng
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};

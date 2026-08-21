import React, { useState, useEffect } from 'react';
import { Tour } from '../../../types/tour.types';

interface ItineraryTimelineProps {
  tour: Tour;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ tour }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const itinerary = tour.itinerary || [];

  // Scroll to selected day inside modal when opened
  useEffect(() => {
    if (isModalOpen && selectedDay !== null) {
      setTimeout(() => {
        const el = document.getElementById(`modal-day-${selectedDay}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [isModalOpen, selectedDay]);

  const getDayImage = (idx: number, dayItem: any) => {
    if (dayItem.image) return dayItem.image;
    if (tour.gallery && tour.gallery[idx]?.url) {
      return tour.gallery[idx].url;
    }
    if (tour.image) return tour.image;
    return 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <section className="detail-section" id="section-itinerary">
      {/* ẢNH 1: GIAO DIỆN TRÊN TRANG (MẶC ĐỊNH KHI CHƯA MỞ POPUP) */}
      <div className="itinerary-preview-card">
        <div style={{ padding: '1.5rem 1.75rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Lịch trình
          </h2>
          <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.86rem', color: '#64748b' }}>
            Nhấp vào bất kỳ ngày nào để xem toàn bộ chi tiết hoạt động &amp; hình ảnh thực tế
          </p>
        </div>

        {/* Danh sách các dòng ngày */}
        <div>
          {itinerary.map((dayItem) => (
            <div
              key={dayItem.day}
              className="itinerary-preview-row"
              onClick={() => {
                setSelectedDay(dayItem.day);
                setIsModalOpen(true);
              }}
              title="Nhấn để xem chi tiết & hình ảnh ngày này"
            >
              <div>
                <div className="itinerary-row-title">
                  Ngày {dayItem.day}: {dayItem.title}
                </div>
                <div className="itinerary-row-meals">
                  <i className="fa-solid fa-utensils" style={{ color: '#0284c7', fontSize: '0.85rem' }}></i>
                  <span>{dayItem.meals || 'Ăn sáng, trưa, tối'}</span>
                  {dayItem.hotel && (
                    <span style={{ marginLeft: '0.5rem', color: '#047857', fontWeight: 600 }}>
                      • 🏨 {dayItem.hotel}
                    </span>
                  )}
                </div>
              </div>
              <div className="itinerary-preview-chevron">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ẢNH 2: POPUP MODAL TIMELINE CHI TIẾT (HIỂN THỊ KHI NHẤN XEM) */}
      {isModalOpen && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className="itinerary-modal-container"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '820px',
              width: '95%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div className="itinerary-modal-header" style={{ marginBottom: '1.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Lịch Trình Chi Tiết ({tour.durationDays || itinerary.length}N{tour.durationNights || (itinerary.length - 1)}Đ)
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  {tour.title}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Đóng cửa sổ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Vertical Timeline Track (ĐÚNG CHUẨN ẢNH 2) */}
            <div className="itinerary-timeline-track">
              <div className="itinerary-timeline-line"></div>

              {itinerary.map((dayItem, idx) => (
                <div
                  key={dayItem.day}
                  id={`modal-day-${dayItem.day}`}
                  className="itinerary-day-section-block"
                  style={{
                    marginBottom: '2rem',
                    scrollMarginTop: '1rem'
                  }}
                >
                  {/* Pin icon 📍 */}
                  <div className="itinerary-pin-icon">
                    <i className="fa-solid fa-location-dot" style={{ color: '#0f172a', fontSize: '1.25rem' }}></i>
                  </div>

                  {/* Top Blue Box (Ảnh 2 Header: Ngày X + Title + Meals + Photo) */}
                  <div className="itinerary-day-top-box" style={{ background: '#e0f2fe', borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="itinerary-day-top-content" style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="itinerary-day-highlight-title" style={{ color: '#0284c7', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                        Ngày {dayItem.day}
                      </div>
                      <div className="itinerary-day-route-text" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>
                        {dayItem.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div className="itinerary-row-meals" style={{ fontSize: '0.86rem', color: '#475569' }}>
                          <i className="fa-solid fa-utensils" style={{ color: '#0284c7' }}></i> {dayItem.meals || 'Ăn sáng, trưa, tối'}
                        </div>
                        {dayItem.hotel && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #bae6fd', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>
                            <i className="fa-solid fa-hotel"></i>
                            <span>{dayItem.hotel}</span>
                            {dayItem.hotelStar && dayItem.hotelStar > 0 ? (
                              <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>
                                {'★'.repeat(dayItem.hotelStar)}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Featured Photo for this Day */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '120px' }}>
                      <img
                        src={getDayImage(idx, dayItem)}
                        alt={`Hình ảnh Ngày ${dayItem.day}`}
                        className="itinerary-day-top-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>

                  {/* Bottom White Box (Ảnh 2: Hoạt Động Chính & Bullet points) */}
                  <div className="itinerary-day-bottom-box" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem', marginTop: '0.75rem' }}>
                    <div className="itinerary-main-activity-label" style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                      Hoạt động chính: {dayItem.activities || 'Tham quan và khám phá danh thắng địa phương'}
                    </div>
                    <ul className="itinerary-bullet-points-list" style={{ margin: 0, padding: 0 }}>
                      {dayItem.details && dayItem.details.length > 0 ? (
                        dayItem.details.map((bullet: string, bIdx: number) => (
                          <li key={bIdx}>{bullet}</li>
                        ))
                      ) : (
                        <>
                          {dayItem.morning && (
                            <li>
                              <strong>Buổi sáng:</strong> {dayItem.morning}
                            </li>
                          )}
                          {dayItem.afternoon && (
                            <li>
                              <strong>Buổi chiều:</strong> {dayItem.afternoon}
                            </li>
                          )}
                          {dayItem.evening && (
                            <li>
                              <strong>Buổi tối:</strong> {dayItem.evening}
                            </li>
                          )}
                          {dayItem.hotel && (
                            <li>
                              <strong>Nghỉ đêm tại:</strong> {dayItem.hotel}
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

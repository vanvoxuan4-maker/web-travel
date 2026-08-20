import React, { useState, useMemo } from 'react';
import { Tour, DepartureDate } from '../../types/tour.types';
import { formatCurrencyVND, getDayOfWeekVN } from '../../utils/formatters';
import { getRemainingSeats } from '../../utils/inventoryManager';

interface ScheduleCalendarProps {
  tour: Tour;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  tour,
  selectedDate,
  onSelectDate
}) => {
  const departureList = useMemo<DepartureDate[]>(() => {
    return tour.departureDates && tour.departureDates.length > 0
      ? tour.departureDates
      : (tour.availableDates || ['12/09/2026', '19/09/2026', '26/09/2026', '10/10/2026']).map(d => ({
          date: d,
          seats: 5,
          priceAdult: tour.priceAdult,
          monthLabel: 'Tháng 9 2026',
          label: null
        }));
  }, [tour]);

  const uniqueMonths = useMemo(() => {
    const months = Array.from(new Set(departureList.map(d => d.monthLabel || 'Tháng 9 2026')));
    return months.length > 0 ? months : ['Tháng 9 2026'];
  }, [departureList]);

  const [activeMonth, setActiveMonth] = useState<string>(uniqueMonths[0]);

  const depsToRender = useMemo(() => {
    const current = departureList.filter(d => (d.monthLabel || 'Tháng 9 2026') === activeMonth);
    return current.length > 0 ? current : departureList;
  }, [departureList, activeMonth]);

  return (
    <section className="schedule-section" id="section-schedule" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '1.5rem', scrollMarginTop: '140px' }}>
      
      {/* Title */}
      <h3 className="schedule-heading" style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '1.55rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        Lịch trình khởi hành
      </h3>

      {/* Month Filter Tabs (Brand Emerald Green) */}
      <div className="schedule-month-tabs" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {uniqueMonths.map(m => {
          const parts = m.split(' ');
          const monthText = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : m;
          const yearText = parts.length >= 3 ? parts[2] : '2026';
          const isActive = m === activeMonth;

          return (
            <button
              key={m}
              type="button"
              className={`month-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveMonth(m)}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: isActive ? '1.5px solid var(--accent-forest, #047857)' : '1.5px solid #e2e8f0',
                background: isActive ? 'var(--accent-forest, #047857)' : '#ffffff',
                color: isActive ? '#ffffff' : '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                minWidth: '105px',
                boxShadow: isActive ? '0 4px 14px rgba(4, 120, 87, 0.25)' : 'none'
              }}
            >
              <span style={{ color: isActive ? '#ffffff' : '#334155', fontWeight: 700 }}>{monthText}</span>
              <span style={{ fontSize: '0.78rem', opacity: isActive ? 0.9 : 0.75, color: isActive ? '#d1fae5' : '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                {yearText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Departure Rows List */}
      <div className="schedule-rows-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {depsToRender.map(dep => {
          const isSelected = dep.date === selectedDate;
          const seats = getRemainingSeats(tour.id, dep.date);
          const isSoldOut = seats <= 0;
          const dayOfWeek = dep.dayOfWeek || getDayOfWeekVN(dep.date);
          const sku = dep.sku || `${tour.sku || 'NDSGN102-059'}-${dep.date.replace(/\//g, '')}VU-D-1`;
          const priceAdult = dep.priceAdult || tour.priceAdult;
          const priceChild = dep.priceChild || Math.round(priceAdult * 0.75);
          const priceToddler = dep.priceToddler || Math.round(priceAdult * 0.5);
          const priceInfant = dep.priceInfant || 500000;
          const singleSurcharge = dep.singleRoomSurcharge || 4950000;

          // Outbound / Inbound dates & times
          const outbound = dep.transport?.outbound || {
            date: dep.date, time: '07:05', arriveTime: '09:05', flightNo: 'VU774', airline: 'Vietravel Airlines', from: 'SGN', to: 'HAN'
          };
          const inbound = dep.transport?.inbound || {
            date: dep.transport?.inbound?.date || dep.date, time: '20:00', arriveTime: '22:22', flightNo: 'VN263', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN'
          };

          if (isSelected) {
            /* EXPANDED ROW (Exact 2-Part Balanced Layout with Emerald Green Brand & Contact Info) */
            return (
              <div 
                key={dep.date} 
                className="schedule-row-expanded"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--accent-forest, #047857)',
                  borderRadius: '16px',
                  padding: '1.5rem 1.75rem',
                  boxShadow: '0 6px 24px rgba(4, 120, 87, 0.08)'
                }}
              >
                {/* 1. Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-forest, #047857)', background: '#ecfdf5', padding: '0.35rem 1rem', borderRadius: '9999px', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
                      {dayOfWeek}, {dep.date}
                    </span>
                    <span style={{ color: '#334155', fontSize: '0.92rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="fa-solid fa-ticket" style={{ color: '#94a3b8' }}></i> {sku}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectDate(null)}
                    style={{
                      background: 'var(--accent-forest, #047857)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 1.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Đang chọn
                  </button>
                </div>

                {/* 2. Part 1: Phương tiện di chuyển */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: '1.25rem' }}>
                    Phương tiện di chuyển
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Chặng Đi */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: '#475569' }}>Ngày đi: <strong style={{ color: '#111827' }}>{outbound.date || dep.date}</strong></span>
                        <span style={{ color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="fa-solid fa-plane"></i> {outbound.flightNo}
                        </span>
                      </div>

                      {/* Flight Times & Timeline Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                        <span>{outbound.time}</span>
                        <span>{outbound.arriveTime}</span>
                      </div>

                      {/* Dotted Line */}
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', margin: '0.2rem 0' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        <div style={{ flex: 1, borderBottom: '1.5px dashed #cbd5e1', margin: '0 4px' }}></div>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                      </div>

                      <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <i className="fa-solid fa-plane-departure" style={{ fontSize: '0.8rem' }}></i> {outbound.airline}
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div style={{ width: '1px', background: '#e2e8f0', height: '100%', minHeight: '90px' }}></div>

                    {/* Chặng Về */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: '#475569' }}>Ngày về: <strong style={{ color: '#111827' }}>{inbound.date || dep.date}</strong></span>
                        <span style={{ color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="fa-solid fa-plane"></i> {inbound.flightNo}
                        </span>
                      </div>

                      {/* Flight Times & Timeline Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                        <span>{inbound.time}</span>
                        <span>{inbound.arriveTime}</span>
                      </div>

                      {/* Dotted Line */}
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', margin: '0.2rem 0' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        <div style={{ flex: 1, borderBottom: '1.5px dashed #cbd5e1', margin: '0 4px' }}></div>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                      </div>

                      <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-forest, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <i className="fa-solid fa-plane-arrival" style={{ fontSize: '0.8rem' }}></i> {inbound.airline}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <div style={{ borderBottom: '1px solid #f1f5f9', margin: '1.5rem 0 1.25rem' }}></div>

                {/* 3. Part 2: Giá chuyến đi */}
                <div>
                  <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: '1.25rem' }}>
                    Giá chuyến đi
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 3rem' }}>
                    {/* Left Column (Người lớn, Trẻ em, Trẻ nhỏ) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Người lớn</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>(Từ 12 tuổi trở lên)</div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                          {formatCurrencyVND(priceAdult)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Trẻ em</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>(Từ 5 đến 11 tuổi)</div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                          {formatCurrencyVND(priceChild)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Trẻ nhỏ</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>(Từ 2 - 4 tuổi)</div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                          {formatCurrencyVND(priceToddler)}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Em bé, Phụ thu phòng đơn) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Em bé</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>(Dưới 2 tuổi)</div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                          {formatCurrencyVND(priceInfant)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Phụ thu phòng đơn</div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                          {formatCurrencyVND(singleSurcharge)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Consultation Contact Box */}
                <div style={{ background: '#f0fdf4', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '10px', padding: '0.85rem 1.15rem', fontSize: '0.85rem', color: '#065f46', lineHeight: 1.5, marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <i className="fa-solid fa-phone-volume" style={{ fontSize: '1.15rem', color: 'var(--accent-emerald, #059669)', flexShrink: 0 }}></i>
                  <div>
                    <strong>Tổng đài tư vấn: 1800 646 888 (Miễn phí 24/7).</strong> Tour không hoàn hủy sai tên, trẻ em cần giấy khai sinh bản gốc.
                  </div>
                </div>

              </div>
            );
          } else {
            /* COMPACT ROW */
            return (
              <div 
                key={dep.date} 
                className="schedule-row-compact" 
                onClick={() => onSelectDate(dep.date)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '0.85rem 1.35rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  gap: '1rem'
                }}
              >
                <div className="schedule-row-left" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'nowrap', minWidth: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#111827', whiteSpace: 'nowrap' }}>
                    {dayOfWeek}, {dep.date}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <i className="fa-solid fa-ticket" style={{ color: '#94a3b8' }}></i> {sku}
                  </span>
                </div>

                <div className="schedule-row-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                  <span 
                    className="schedule-compact-price" 
                    style={{ 
                      fontFamily: 'var(--font-body, "Montserrat", sans-serif)', 
                      fontSize: '1.35rem', 
                      fontWeight: 800, 
                      color: isSoldOut ? '#94a3b8' : '#111827', 
                      letterSpacing: '-0.01em',
                      fontVariantNumeric: 'lining-nums tabular-nums',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCurrencyVND(priceAdult)}
                  </span>
                  <button
                    type="button"
                    disabled={isSoldOut}
                    className="schedule-btn-choose"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(dep.date);
                    }}
                    style={{
                      background: isSoldOut ? '#f1f5f9' : '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: isSoldOut ? '#94a3b8' : '#334155',
                      padding: '0.45rem 1.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isSoldOut ? 'Hết chỗ' : 'Chọn'}
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    </section>
  );
};

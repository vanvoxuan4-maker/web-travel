import React, { useState, useMemo, useEffect } from 'react';
import { Tour, DepartureDate } from '../../../types/tour.types';
import { formatCurrencyVND, getDayOfWeekVN, formatDateVN, toIsoDate } from '../../../utils/formatters';
import { getRemainingSeats } from '../../../utils/inventoryManager';


interface ScheduleCalendarProps {
  tour: Tour;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

/**
 * Helper: dynamically extract Month & Year label and sortKey from any date format (YYYY-MM-DD or DD/MM/YYYY)
 */
function parseMonthYearFromDate(dateStr: string): { label: string; sortKey: number } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { label: 'Tháng 9 2026', sortKey: 202609 };
  }
  try {
    if (dateStr.includes('-')) {
      const [yStr, mStr] = dateStr.split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10);
      if (year && month) {
        return { label: `Tháng ${month} ${year}`, sortKey: year * 100 + month };
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (year && month) {
          return { label: `Tháng ${month} ${year}`, sortKey: year * 100 + month };
        }
      }
    }
  } catch {
    // fallback
  }
  return { label: 'Tháng 9 2026', sortKey: 202609 };
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  tour,
  selectedDate,
  onSelectDate
}) => {
  const departureList = useMemo<DepartureDate[]>(() => {
    const raw = tour.departureDates && tour.departureDates.length > 0
      ? tour.departureDates
      : (tour.availableDates || ['2026-09-15', '2026-09-22', '2026-09-29', '2026-10-05']).map(d => ({
          date: toIsoDate(d),
          seats: 12,
          priceAdult: tour.priceAdult,
          label: null
        }));

    return raw.map(dep => {
      const parsed = parseMonthYearFromDate(dep.date);
      return {
        ...dep,
        monthLabel: parsed.label
      };
    });
  }, [tour]);

  const uniqueMonths = useMemo(() => {
    const monthMap = new Map<string, number>();
    departureList.forEach(d => {
      const parsed = parseMonthYearFromDate(d.date);
      monthMap.set(parsed.label, parsed.sortKey);
    });

    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);

    return sortedMonths.length > 0 ? sortedMonths : ['Tháng 9 2026'];
  }, [departureList]);

  const [activeMonth, setActiveMonth] = useState<string>(uniqueMonths[0]);
  const [, setTick] = useState(0);

  // Re-render immediately on realtime seat updates
  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('webtravel:realtime_seats', handleUpdate);
    window.addEventListener('webtravel:inventory_synced', handleUpdate);
    return () => {
      window.removeEventListener('webtravel:realtime_seats', handleUpdate);
      window.removeEventListener('webtravel:inventory_synced', handleUpdate);
    };
  }, []);

  // Keep activeMonth in sync if uniqueMonths changes
  useEffect(() => {
    if (!uniqueMonths.includes(activeMonth)) {
      setActiveMonth(uniqueMonths[0] || 'Tháng 9 2026');
    }
  }, [uniqueMonths, activeMonth]);

  // Strictly filter departure dates that belong to the active month
  const depsToRender = useMemo(() => {
    return departureList.filter(d => parseMonthYearFromDate(d.date).label === activeMonth);
  }, [departureList, activeMonth]);

  return (
    <section className="schedule-section" id="section-schedule" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '1.5rem', scrollMarginTop: '140px' }}>
      
      {/* Title */}
      <h3 className="schedule-heading" style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '1.55rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        Lịch trình khởi hành
      </h3>

      {/* Month Filter Tabs (Brand Emerald Green) */}
      <div className="schedule-month-tabs" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
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
          const isSelected = toIsoDate(dep.date) === toIsoDate(selectedDate || '');
          const seats = getRemainingSeats(tour.id, dep.date, tour);
          const isSoldOut = seats <= 0;
          const dayOfWeek = dep.dayOfWeek || getDayOfWeekVN(dep.date);
          const sku = dep.sku || `${tour.sku || 'WT1001'}-${dep.date.replace(/[\/-]/g, '')}VU-D-1`;
          const priceAdult = dep.priceAdult || tour.priceAdult;
          const priceChild = dep.priceChild || Math.round(priceAdult * 0.75);
          const priceInfant = dep.priceInfant || 500000;
          const singleSurcharge = dep.singleRoomSurcharge || 1500000;

          // Outbound / Inbound dates & times
          const outbound = dep.transport?.outbound || {
            date: dep.date, time: '01:15', arriveTime: '05:30', flightNo: 'HO1330', airline: 'Vietravel Airlines', from: 'SGN', to: 'HAN'
          };
          const inbound = dep.transport?.inbound || {
            date: dep.transport?.inbound?.date || dep.date, time: '21:45', arriveTime: '00:15', flightNo: 'HO1329', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN'
          };

          if (isSelected) {
            /* COMPACT ELEGANT EXPANDED ROW (Y HỆT MẪU) */
            return (
              <div 
                key={dep.date} 
                className="schedule-row-expanded"
                style={{
                  background: '#ffffff',
                  border: isSoldOut ? '1.5px solid #cbd5e1' : '1.5px solid var(--accent-forest, #047857)',
                  borderRadius: '24px',
                  padding: '1.25rem 1.75rem',
                  boxShadow: isSoldOut ? 'none' : '0 8px 28px rgba(4, 120, 87, 0.1)',
                  opacity: isSoldOut ? 0.85 : 1
                }}
              >
                {/* 1. Header Bar: Badge Ngày + Mã SKU + Số chỗ còn + Nút Đang chọn / Đã hết */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* Badge Ngày */}
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isSoldOut ? '#64748b' : 'var(--accent-forest, #047857)', background: isSoldOut ? '#f1f5f9' : '#ecfdf5', padding: '0.35rem 1rem', borderRadius: '9999px', border: isSoldOut ? '1px solid #e2e8f0' : '1px solid rgba(5, 150, 105, 0.25)' }}>
                      {dayOfWeek}, {formatDateVN(dep.date)}
                    </span>
                    {/* Mã Tour SKU */}
                    <span style={{ color: '#334155', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="fa-solid fa-ticket" style={{ color: isSoldOut ? '#94a3b8' : 'var(--accent-forest, #047857)' }}></i> {sku}
                    </span>
                    {/* Huy hiệu số chỗ còn nhận */}
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSoldOut ? '#dc2626' : (seats <= 5 ? '#e11d48' : '#047857'), background: isSoldOut ? '#fee2e2' : (seats <= 5 ? '#fef2f2' : '#ecfdf5'), padding: '0.22rem 0.75rem', borderRadius: '9999px', border: isSoldOut ? '1px solid #fca5a5' : (seats <= 5 ? '1px solid #fecdd3' : '1px solid #a7f3d0') }}>
                      {isSoldOut ? 'Đã hết chỗ' : `Còn ${seats} chỗ`}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={isSoldOut ? undefined : () => onSelectDate(null)}
                    style={{
                      background: isSoldOut ? '#e2e8f0' : 'var(--accent-forest, #047857)',
                      color: isSoldOut ? '#94a3b8' : '#ffffff',
                      border: isSoldOut ? '1px solid #cbd5e1' : 'none',
                      padding: '0.42rem 1.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                      opacity: isSoldOut ? 0.7 : 1,
                      boxShadow: isSoldOut ? 'none' : '0 4px 14px rgba(4, 120, 87, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSoldOut ? 'Đã hết' : 'Đang chọn'}
                  </button>
                </div>

                {/* 2. Phương tiện di chuyển */}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#111827', margin: '0.65rem 0 0.85rem' }}>
                  Phương tiện di chuyển
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '1.5rem', alignItems: 'center', padding: '0 0.5rem' }}>
                  {/* Cột Trái: Ngày đi */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.88rem', color: '#4b5563', fontWeight: 600 }}>Ngày đi: <strong>{formatDateVN(dep.date)}</strong></span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--accent-forest, #047857)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="fa-solid fa-plane" style={{ transform: 'rotate(-45deg)', fontSize: '0.8rem' }}></i> {outbound.flightNo || 'HO1330'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#111827', fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                      <span>{outbound.time || '01:15'}</span>
                      <div style={{ flex: 1, margin: '0 1rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                        <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1', height: '1px' }}></div>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                      </div>
                      <span>{outbound.arriveTime || '05:30'}</span>
                    </div>
                  </div>

                  {/* Vạch kẻ ngăn giữa */}
                  <div style={{ background: '#e5e7eb', height: '70%', width: '1px' }}></div>

                  {/* Cột Phải: Ngày về */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.88rem', color: '#4b5563', fontWeight: 600 }}>Ngày về: <strong>{formatDateVN(inbound.date || dep.date)}</strong></span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--accent-forest, #047857)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="fa-solid fa-plane" style={{ transform: 'rotate(-45deg)', fontSize: '0.8rem' }}></i> {inbound.flightNo || 'HO1329'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#111827', fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                      <span>{inbound.time || '21:45'}</span>
                      <div style={{ flex: 1, margin: '0 1rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                        <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1', height: '1px' }}></div>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                      </div>
                      <span>{inbound.arriveTime || '00:15'}</span>
                    </div>
                  </div>
                </div>

                {/* Đường kẻ phân cách */}
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '1.15rem 0 0.85rem' }}></div>

                {/* 3. Giá chuyến đi */}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>
                  Giá chuyến đi
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem 3rem', padding: '0 0.5rem' }}>
                  {/* Người lớn */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>Người lớn</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>(Từ 12 tuổi trở lên)</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                      {formatCurrencyVND(priceAdult)}
                    </div>
                  </div>

                  {/* Em bé */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>Em bé</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>(Dưới 2 tuổi)</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                      {formatCurrencyVND(priceInfant)}
                    </div>
                  </div>

                  {/* Trẻ em */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>Trẻ em</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>(Từ 2 đến 11 tuổi)</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                      {formatCurrencyVND(priceChild)}
                    </div>
                  </div>

                  {/* Phụ thu phòng đơn */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>Phụ thu phòng đơn</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest, #047857)', fontFamily: 'var(--font-body, "Montserrat", sans-serif)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                      {formatCurrencyVND(singleSurcharge)}
                    </div>
                  </div>
                </div>

                {/* 4. Banner ghi chú chân trang */}
                <div style={{ background: '#f0fdf4', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '12px', padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: '#065f46', fontWeight: 600, marginTop: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-info" style={{ color: 'var(--accent-emerald, #059669)' }}></i>
                  <span>
                    {tour.category === 'international'
                      ? 'Thời gian xin visa đoàn tối thiểu trước ngày khởi hành 09 ngày làm việc.'
                      : 'Thời gian giữ chỗ và hoàn tất thủ tục tối thiểu trước ngày khởi hành 03 ngày làm việc.'}
                  </span>
                </div>
              </div>
            );
          } else {
            /* COMPACT ROW */
            return (
              <div 
                key={dep.date} 
                className="schedule-row-compact" 
                onClick={isSoldOut ? undefined : () => onSelectDate(toIsoDate(dep.date))}
                style={{
                  background: isSoldOut ? '#f8fafc' : '#ffffff',
                  border: isSoldOut ? '1.5px solid #e2e8f0' : '1.5px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '0.85rem 1.35rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  boxShadow: isSoldOut ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
                  opacity: isSoldOut ? 0.6 : 1,
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="schedule-row-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', minWidth: 0 }}>
                  {/* Ngày đi */}
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: isSoldOut ? '#94a3b8' : 'var(--accent-forest, #047857)', whiteSpace: 'nowrap' }}>
                    {dayOfWeek}, {formatDateVN(dep.date)}
                  </span>

                  {/* Huy hiệu trạng thái / khuyến mãi */}
                  {isSoldOut ? (
                    <span 
                      style={{ 
                        fontWeight: 800, 
                        fontSize: '0.74rem', 
                        color: '#dc2626', 
                        background: '#fee2e2', 
                        padding: '0.22rem 0.6rem', 
                        borderRadius: '6px', 
                        border: '1px solid #fca5a5',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Đã hết chỗ
                    </span>
                  ) : dep.label ? (
                    <span 
                      style={{ 
                        fontWeight: 800, 
                        fontSize: '0.74rem', 
                        color: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '#e11d48' : dep.label.includes('Cuối') ? '#1d4ed8' : '#047857', 
                        background: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '#fff1f2' : dep.label.includes('Cuối') ? '#eff6ff' : '#ecfdf5', 
                        padding: '0.22rem 0.6rem', 
                        borderRadius: '6px', 
                        border: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '1px solid #fecdd3' : dep.label.includes('Cuối') ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {dep.label}
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '0.76rem', 
                        color: seats <= 5 ? '#e11d48' : '#047857', 
                        background: seats <= 5 ? '#fef2f2' : '#ecfdf5', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '6px', 
                        border: seats <= 5 ? '1px solid #fecdd3' : '1px solid #a7f3d0',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Còn {seats} chỗ
                    </span>
                  )}

                  {/* Mã tour in đậm rõ nét */}
                  <span style={{ color: isSoldOut ? '#94a3b8' : '#1e293b', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <i className="fa-solid fa-ticket" style={{ color: isSoldOut ? '#94a3b8' : 'var(--accent-forest, #047857)' }}></i> {sku}
                  </span>
                </div>

                <div className="schedule-row-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                  {/* Giá tour */}
                  <span 
                    className="schedule-compact-price" 
                    style={{ 
                      fontFamily: 'var(--font-body, "Montserrat", sans-serif)', 
                      fontSize: '1.35rem', 
                      fontWeight: 800, 
                      color: isSoldOut ? '#94a3b8' : 'var(--accent-forest, #047857)', 
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
                      if (!isSoldOut) {
                        onSelectDate(toIsoDate(dep.date));
                      }
                    }}
                    style={{
                      background: isSoldOut ? '#f1f5f9' : '#ffffff',
                      border: isSoldOut ? '1.5px solid #cbd5e1' : '1.5px solid #e2e8f0',
                      color: isSoldOut ? '#94a3b8' : '#334155',
                      padding: '0.45rem 1.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                      opacity: isSoldOut ? 0.65 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: isSoldOut ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isSoldOut ? 'Đã hết' : 'Chọn'}
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

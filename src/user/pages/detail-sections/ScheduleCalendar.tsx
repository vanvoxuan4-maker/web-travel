import React, { useState, useMemo, useEffect } from 'react';
import { Tour, DepartureDate } from '../../../types/tour.types';
import { formatCurrencyVND, getDayOfWeekVN } from '../../../utils/formatters';
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
      : (tour.availableDates || ['15/09/2026', '22/09/2026', '29/09/2026', '05/10/2026']).map(d => ({
          date: d,
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
          const isSelected = dep.date === selectedDate;
          const seats = getRemainingSeats(tour.id, dep.date);
          const isSoldOut = seats <= 0;
          const dayOfWeek = dep.dayOfWeek || getDayOfWeekVN(dep.date);
          const sku = dep.sku || `${tour.sku || 'WT1001'}-${dep.date.replace(/[\/-]/g, '')}VU-D-1`;
          const priceAdult = dep.priceAdult || tour.priceAdult;
          const priceChild = dep.priceChild || Math.round(priceAdult * 0.75);
          const priceToddler = dep.priceToddler || Math.round(priceAdult * 0.5);
          const priceInfant = dep.priceInfant || 500000;
          const singleSurcharge = dep.singleRoomSurcharge || 1500000;

          // Outbound / Inbound dates & times
          const outbound = dep.transport?.outbound || {
            date: dep.date, time: '07:05', arriveTime: '09:05', flightNo: 'VU774', airline: 'Vietravel Airlines', from: 'SGN', to: 'HAN'
          };
          const inbound = dep.transport?.inbound || {
            date: dep.transport?.inbound?.date || dep.date, time: '20:00', arriveTime: '22:22', flightNo: 'VN263', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN'
          };

          if (isSelected) {
            /* EXPANDED ROW */
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* Ngày đi màu xanh ngọc bích */}
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-forest, #047857)', background: '#ecfdf5', padding: '0.35rem 1rem', borderRadius: '9999px', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
                      {dayOfWeek}, {dep.date}
                    </span>
                    {dep.label && (
                      <span 
                        style={{ 
                          fontWeight: 800, 
                          fontSize: '0.8rem', 
                          color: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '#e11d48' : dep.label.includes('Cuối') ? '#1d4ed8' : '#047857', 
                          background: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '#fff1f2' : dep.label.includes('Cuối') ? '#eff6ff' : '#ecfdf5', 
                          padding: '0.3rem 0.85rem', 
                          borderRadius: '9999px', 
                          border: dep.label.includes('Lễ') || dep.label.includes('Tết') || dep.label.includes('Quốc Khánh') || dep.label.includes('Giáng Sinh') || dep.label.includes('Năm Mới') ? '1px solid #fecdd3' : dep.label.includes('Cuối') ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {dep.label}
                      </span>
                    )}
                    {/* In đậm mã tour */}
                    <span style={{ color: '#1e293b', fontSize: '0.92rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="fa-solid fa-ticket" style={{ color: 'var(--accent-forest, #047857)' }}></i> {sku}
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
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
                    }}
                  >
                    Đóng
                  </button>
                </div>

                {/* 2. Main 2-Part Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                  
                  {/* LEFT PART: Flight / Transport Schedule Details */}
                  <div>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-plane-departure" style={{ color: 'var(--accent-emerald, #059669)' }}></i> Thông tin chuyến bay &amp; Di chuyển
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Outbound Box */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            🛫 Chuyến đi • {outbound.date}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{outbound.airline} ({outbound.flightNo})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{outbound.time}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{outbound.from} (Khởi hành)</div>
                          </div>
                          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                            <div>2h00m</div>
                            <i className="fa-solid fa-arrow-right-long" style={{ color: '#cbd5e1', fontSize: '1.1rem' }}></i>
                            <div>Bay thẳng</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{outbound.arriveTime}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{outbound.to} (Đến nơi)</div>
                          </div>
                        </div>
                      </div>

                      {/* Inbound Box */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            🛬 Chuyến về • {inbound.date}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{inbound.airline} ({inbound.flightNo})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{inbound.time}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{inbound.from} (Khởi hành)</div>
                          </div>
                          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                            <div>2h22m</div>
                            <i className="fa-solid fa-arrow-right-long" style={{ color: '#cbd5e1', fontSize: '1.1rem' }}></i>
                            <div>Bay thẳng</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{inbound.arriveTime}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{inbound.to} (Đến nơi)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PART: Gathering Point & Luggage Policy */}
                  <div>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-emerald, #059669)' }}></i> Địa điểm tập trung &amp; Hành lý
                    </h4>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', height: 'calc(100% - 2.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                      <div>
                        <div style={{ marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Điểm đón khách:</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginTop: '0.2rem' }}>
                            Cột 12 Ga Đi Trong Nước, Sân Bay Quốc Tế Tân Sơn Nhất / Nội Bài
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                            (Hướng dẫn viên WebTravel cầm bảng đón trước giờ bay 2 tiếng)
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tiêu chuẩn hành lý:</span>
                          <div style={{ fontSize: '0.92rem', color: '#1e293b', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div><i className="fa-solid fa-suitcase" style={{ color: 'var(--accent-emerald, #059669)', width: '20px' }}></i> <strong>20kg</strong> Hành lý ký gửi / khách</div>
                            <div><i className="fa-solid fa-briefcase" style={{ color: 'var(--accent-emerald, #059669)', width: '20px' }}></i> <strong>07kg</strong> Hành lý xách tay tiêu chuẩn</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tình trạng chỗ:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: seats <= 5 ? '#e11d48' : '#047857' }}>
                          {isSoldOut ? 'Đã hết chỗ' : `Còn ${seats} chỗ trống`}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. Detailed Price Breakdown Table */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-tags" style={{ color: 'var(--accent-emerald, #059669)' }}></i> Bảng giá tour chi tiết theo từng độ tuổi
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 3rem' }}>
                    {/* Left Column (Người lớn, Trẻ em, Trẻ nhỏ) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Người lớn</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>(Từ 12 tuổi trở lên)</div>
                        </div>
                        {/* Giá màu xanh */}
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
                <div className="schedule-row-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', minWidth: 0 }}>
                  {/* Ngày đi đổi thành màu xanh ngọc bích */}
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--accent-forest, #047857)', whiteSpace: 'nowrap' }}>
                    {dayOfWeek}, {dep.date}
                  </span>
                  {dep.label && (
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
                  )}
                  {/* Mã tour in đậm rõ nét */}
                  <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <i className="fa-solid fa-ticket" style={{ color: 'var(--accent-forest, #047857)' }}></i> {sku}
                  </span>
                </div>

                <div className="schedule-row-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                  {/* Giá tour đổi thành màu xanh ngọc bích */}
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

import { TOURS_DATA } from './data/toursData.js';
import { formatCurrencyVND, escapeHTML } from './utils/formatters.js';
import { openBookingModal } from './tools/bookingModal.js';
import { getRemainingSeats, getDatePrice, getDateDetails } from './utils/inventoryManager.js';
import { initGalleryManager } from './tour-detail/galleryManager.js';
import { initScheduleCalendar } from './tour-detail/scheduleCalendar.js';
import { initItineraryTimeline } from './tour-detail/itineraryTimeline.js';
import { initHotelAndPolicies } from './tour-detail/hotelAndPolicies.js';

/**
 * tourDetailApp.js (Orchestrator)
 * Thin controller: reads tour data, renders HTML template, delegates to sub-modules.
 * Architecture: Modular (split from 1364-line monolith for maintainability)
 */
function initTourDetailApp() {
  const urlParams = new URLSearchParams(window.location.search);
  const tourId = urlParams.get('id') || 'tour-halong-01';

  const tour = TOURS_DATA.find(t => t.id === tourId) || TOURS_DATA[0];

  // Update Page Meta Title
  document.title = `${tour.title} - WebTravel Editorial`;
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = `${tour.title} - WebTravel Editorial`;

  const root = document.getElementById('tour-detail-root');
  if (!root) return;

  const galleryImages = tour.gallery && tour.gallery.length > 0 ? tour.gallery : [
    { url: tour.image, title: tour.title }
  ];

  function formatMonthLabel(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `Tháng ${parseInt(parts[1], 10)} ${parts[2]}`;
    }
    return 'Tháng 9 2026';
  }

  function getDayOfWeekStr(dateStr) {
    const [d, m, y] = dateStr.split('/').map(Number);
    if (!d || !m || !y) return 'T5';
    const dateObj = new Date(y, m - 1, d);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[dateObj.getDay()] || 'T5';
  }

  const rawList = tour.departureDates && tour.departureDates.length > 0
    ? tour.departureDates
    : (tour.availableDates || ['10/09/2026', '24/09/2026', '08/10/2026', '22/10/2026']).map(d => ({ date: d, seats: 5, priceAdult: tour.priceAdult }));

  const departureList = rawList.map((d, idx) => {
    const price = d.priceAdult || tour.priceAdult || 12290000;
    const fromCity = (tour.departureFrom || 'TP. Hồ Chí Minh').includes('Hà Nội') ? 'HAN' : 'SGN';
    const toCity = fromCity === 'SGN' ? 'HAN' : 'SGN';
    return {
      date: d.date,
      dayOfWeek: d.dayOfWeek || getDayOfWeekStr(d.date),
      monthLabel: d.monthLabel || formatMonthLabel(d.date),
      sku: d.sku || `${tour.sku || 'NDSGN9919'}-00${idx + 1}-${d.date.replace(/\//g, '')}VN-D-7`,
      seats: d.seats !== undefined ? d.seats : 5,
      priceAdult: price,
      priceChild: d.priceChild || Math.round(price * 0.75),
      priceToddler: d.priceToddler || Math.round(price * 0.5),
      priceInfant: d.priceInfant || 500000,
      singleRoomSurcharge: d.singleRoomSurcharge || 3500000,
      label: d.label || null,
      transport: d.transport || {
        outbound: { date: d.date, time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: fromCity, to: toCity },
        inbound: { date: d.date, time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: toCity, to: fromCity }
      }
    };
  });

  const dates = departureList.map(d => d.date);
  let selectedDepartureDate = null; // Khách chưa chọn ngày khi mới tải trang

  const uniqueMonths = Array.from(new Set(departureList.map(d => d.monthLabel || 'Tháng 9 2026')));
  let activeMonth = uniqueMonths[0] || 'Tháng 9 2026';

  // Render Full Page Layout
  root.innerHTML = `
    <!-- Embedded Schedule Component Styles (Zero Cache Dependency) -->
    <style>
      .schedule-section {
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        margin-bottom: 1.5rem;
        scroll-margin-top: 140px;
      }
      .schedule-heading {
        font-family: var(--font-heading, serif);
        font-size: 1.55rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .schedule-month-tabs {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
      }
      .month-tab-btn {
        padding: 0.65rem 1.35rem;
        border-radius: 12px;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        border: 1.5px solid #e2e8f0;
        background: #ffffff;
        color: #4b5563;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.25s ease;
        min-width: 105px;
      }
      .month-tab-btn:hover {
        border-color: #059669;
        color: #065f46;
        background: #f0fdf4;
      }
      .month-tab-btn.active {
        background: #065f46 !important;
        color: #ffffff !important;
        border-color: #065f46 !important;
        box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
      }
      .schedule-rows-list {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
      }
      .schedule-row-compact {
        background: #ffffff;
        border: 1.5px solid #e5e7eb;
        border-radius: 9999px;
        padding: 0.65rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .schedule-row-compact:hover {
        border-color: #059669;
        background: #f0fdf4;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.08);
        transform: translateY(-1px);
      }
      .schedule-row-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
      .schedule-date-badge {
        background: #ecfdf5;
        color: #065f46;
        font-weight: 800;
        font-size: 0.92rem;
        padding: 0.4rem 1rem;
        border-radius: 9999px;
        border: 1px solid rgba(5, 150, 105, 0.2);
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .schedule-sku-badge {
        color: #4b5563;
        font-size: 0.88rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }
      .schedule-row-right {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .schedule-compact-price {
        font-family: var(--font-body, 'Montserrat', sans-serif);
        font-variant-numeric: lining-nums tabular-nums;
        font-feature-settings: "lnum" 1, "tnum" 1;
        font-size: 1.2rem;
        font-weight: 800;
        color: #065f46;
        vertical-align: baseline;
      }
      .schedule-btn-choose {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        color: #4b5563;
        padding: 0.45rem 1.35rem;
        border-radius: 9999px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .schedule-btn-choose:hover {
        background: #065f46;
        border-color: #065f46;
        color: #ffffff;
      }
      .schedule-btn-cancel {
        background: #fef2f2;
        border: 1.5px solid #fecaca;
        color: #dc2626;
        padding: 0.45rem 1.35rem;
        border-radius: 9999px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.2s ease;
      }
      .schedule-btn-cancel:hover {
        background: #dc2626;
        border-color: #dc2626;
        color: #ffffff;
      }
      .schedule-row-expanded {
        background: #ffffff;
        border: 2px solid #065f46;
        border-radius: 18px;
        padding: 1.5rem;
        box-shadow: 0 8px 30px rgba(5, 150, 105, 0.1);
        transition: all 0.3s ease;
      }
      .schedule-expanded-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1.15rem;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .schedule-btn-selected {
        background: #065f46;
        color: #ffffff;
        border: none;
        padding: 0.5rem 1.4rem;
        border-radius: 9999px;
        font-size: 0.92rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
      }
      .schedule-sub-block {
        margin-bottom: 1.35rem;
      }
      .schedule-sub-title {
        text-align: center;
        font-weight: 800;
        font-size: 0.98rem;
        color: #065f46;
        margin-bottom: 1rem;
        position: relative;
      }
      .schedule-sub-title::before,
      .schedule-sub-title::after {
        content: "";
        display: inline-block;
        width: 40px;
        height: 1px;
        background: #cbd5e1;
        vertical-align: middle;
        margin: 0 0.6rem;
      }
      .schedule-flights-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.15rem 1.5rem;
      }
      .flight-leg-card {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .flight-leg-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.84rem;
        color: #475569;
      }
      .flight-code-pill {
        color: #b45309;
        font-weight: 800;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .flight-timeline-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.35rem 0;
      }
      .flight-time-box {
        font-family: var(--font-body, 'Montserrat', sans-serif);
        font-variant-numeric: lining-nums tabular-nums;
        font-feature-settings: "lnum" 1, "tnum" 1;
        font-size: 1.15rem;
        font-weight: 800;
        color: #111827;
        vertical-align: baseline;
      }
      .flight-path-visual {
        flex: 1;
        margin: 0 0.85rem;
        display: flex;
        align-items: center;
        position: relative;
      }
      .flight-path-line {
        width: 100%;
        height: 1.5px;
        background: #cbd5e1;
        position: relative;
      }
      .flight-path-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: #059669;
        font-size: 0.8rem;
        background: #f8fafc;
        padding: 0 0.3rem;
      }
      .flight-airport-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.82rem;
        color: #64748b;
        font-weight: 700;
      }
      .airline-brand-tag {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        color: #065f46;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .schedule-pricing-table {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.85rem 2rem;
        background: #ffffff;
        padding: 0.75rem 0.25rem;
      }
      .price-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed #f1f5f9;
        padding-bottom: 0.5rem;
      }
      .price-item-label {
        display: flex;
        flex-direction: column;
      }
      .price-tier-name {
        font-weight: 800;
        font-size: 0.92rem;
        color: #111827;
      }
      .price-tier-age {
        font-size: 0.78rem;
        color: #64748b;
      }
      .price-tier-val {
        font-family: var(--font-body, 'Montserrat', sans-serif);
        font-variant-numeric: lining-nums tabular-nums;
        font-feature-settings: "lnum" 1, "tnum" 1;
        font-weight: 800;
        font-size: 1.15rem;
        color: #065f46;
        vertical-align: baseline;
      }
      .schedule-notice-box {
        background: #f0fdf4;
        border: 1px solid rgba(5, 150, 105, 0.25);
        border-radius: 10px;
        padding: 0.85rem 1.15rem;
        font-size: 0.83rem;
        color: #065f46;
        line-height: 1.5;
        margin-top: 1.15rem;
      }
      .schedule-notice-box strong {
        color: #065f46;
        font-weight: 800;
      }
      @media (max-width: 768px) {
        .schedule-flights-grid { grid-template-columns: 1fr; }
        .schedule-pricing-table { grid-template-columns: 1fr; }
        .schedule-row-compact {
          border-radius: 16px;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.6rem;
        }
        .schedule-row-right {
          width: 100%;
          justify-content: space-between;
        }
      }
    </style>

    <!-- 1. TOP BREADCRUMB & HEADER INFO -->
    <div class="container" style="padding-top: 1.5rem; padding-bottom: 0.5rem;">
      <div class="detail-breadcrumb" style="margin-bottom: 0.75rem;">
        <a href="index.html"><i class="fa-solid fa-house"></i> Trang Chủ</a> <i class="fa-solid fa-chevron-right"></i>
        <a href="index.html#tours-explorer">Hành Trình</a> <i class="fa-solid fa-chevron-right"></i>
        <a href="index.html#tours-explorer">${tour.category === 'domestic' ? 'Trong Nước' : 'Quốc Tế'}</a> <i class="fa-solid fa-chevron-right"></i>
        <span class="text-muted">${escapeHTML(tour.destination)}</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 320px;">
          <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
            <span class="badge ${tour.tier === 'luxury' ? 'badge-gold' : 'badge-emerald'}"><i class="fa-solid fa-crown"></i> ${tour.tierName || 'Dòng Cao Cấp (Signature)'}</span>
            <span class="badge badge-forest" style="background: #f8fafc !important; color: #111827 !important; border-color: var(--glass-border);">
              Mã Tour: <strong>${tour.code}</strong> ${tour.sku ? `(SKU: ${tour.sku})` : ''}
            </span>
            <span class="detail-rating-pill" style="background: #fffbeb; color: #b45309; padding: 0.25rem 0.65rem; border-radius: 6px; font-weight: 700; font-size: 0.85rem; border: 1px solid #fef3c7;">
              <i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${tour.rating} (${tour.reviewsCount || 128} đánh giá)
            </span>
          </div>

          <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #111827; line-height: 1.25; margin: 0.4rem 0;">
            ${escapeHTML(tour.title)}
          </h1>

          <p style="font-size: 0.95rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span><i class="fa-solid fa-location-dot" style="color: var(--accent-emerald);"></i> <strong>Điểm đến:</strong> ${escapeHTML(tour.destination)}</span>
            <span>•</span>
            <span><i class="fa-solid fa-plane-departure" style="color: var(--accent-emerald);"></i> <strong>Nơi khởi hành:</strong> ${escapeHTML(tour.departureFrom || 'Hà Nội / TP.HCM')}</span>
          </p>
        </div>
      </div>

      <!-- 2. MULTI-IMAGE GALLERY SHOWCASE -->
      <div class="detail-gallery-container">
        <div class="gallery-main-img-wrap" id="gallery-main-wrap">
          <img id="gallery-main-display" src="${galleryImages[0].url}" alt="${escapeHTML(galleryImages[0].title || tour.title)}">
          <div class="gallery-main-caption">
            <span id="gallery-caption-text">${escapeHTML(galleryImages[0].title || tour.title)}</span>
            <span style="font-size: 0.85rem; font-weight: 600; opacity: 0.9;"><i class="fa-solid fa-camera"></i> Bộ sưu tập 5 điểm danh thắng</span>
          </div>
        </div>

        ${galleryImages.length > 1 ? `
          <div class="gallery-thumbs-row">
            ${galleryImages.map((img, idx) => `
              <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" data-url="${img.url}" data-title="${escapeHTML(img.title || tour.title)}">
                <img src="${img.url}" alt="${escapeHTML(img.title || tour.title)}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- 3. QUICK SPECS BAR -->
      <div class="detail-quick-specs-bar" style="margin-top: 1.5rem;">
        <div class="spec-card">
          <i class="fa-regular fa-clock icon"></i>
          <div>
            <span class="label">Thời Gian</span>
            <span class="val">${tour.durationDays} Ngày ${tour.durationNights} Đêm</span>
          </div>
        </div>

        <div class="spec-card">
          <i class="fa-solid fa-plane-departure icon"></i>
          <div>
            <span class="label">Phương Tiện</span>
            <span class="val">${tour.category === 'international' ? 'Máy bay khứ hồi 5★' : 'Vé máy bay & Limousine'}</span>
          </div>
        </div>

        <div class="spec-card">
          <i class="fa-solid fa-hotel icon"></i>
          <div>
            <span class="label">Tiêu Chuẩn Lưu Trú</span>
            <span class="val">${escapeHTML(tour.hotelTier || `${tour.starRating}★ Hotel`)}</span>
          </div>
        </div>

        <div class="spec-card">
          <i class="fa-regular fa-calendar-check icon"></i>
          <div>
            <span class="label">Lịch Khởi Hành</span>
            <span class="val">${escapeHTML(tour.departureSchedule || 'Hàng tuần')}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. DETAIL STICKY NAVIGATION TABS -->
    <div class="detail-sticky-tabs-bar">
      <div class="container">
        <nav class="detail-tabs-list">
          <a href="#section-schedule" class="detail-tab-link active"><i class="fa-solid fa-calendar-days"></i> Lịch Khởi Hành</a>
          <a href="#section-highlights" class="detail-tab-link"><i class="fa-solid fa-sparkles"></i> Điểm Nhấn</a>
          <a href="#section-hotel" class="detail-tab-link"><i class="fa-solid fa-hotel"></i> Du Thuyền & Khách Sạn</a>
          <a href="#section-itinerary" class="detail-tab-link"><i class="fa-solid fa-route"></i> Lịch Trình Chi Tiết</a>
          <a href="#section-services" class="detail-tab-link"><i class="fa-solid fa-list-check"></i> Tiêu Chuẩn Dịch Vụ</a>
          <a href="#section-policy" class="detail-tab-link"><i class="fa-solid fa-shield-halved"></i> Chính Sách & Hoàn Hủy</a>
          <a href="#section-faqs" class="detail-tab-link"><i class="fa-solid fa-circle-question"></i> Hỏi Đáp FAQs</a>
        </nav>
      </div>
    </div>

    <!-- 5. MAIN 2-COLUMN LAYOUT -->
    <div class="container detail-main-layout">
      
      <!-- LEFT ARTICLE BODY (8 Cols) -->
      <article class="detail-article-body">
        
        <!-- SECTION 0: EXPANDABLE DEPARTURE SCHEDULE ("LỊCH TRÌNH KHỞI HÀNH") -->
        <section class="schedule-section" id="section-schedule">
          <h3 class="schedule-heading"><i class="fa-solid fa-calendar-days" style="color: #0056d2;"></i> Lịch trình khởi hành</h3>
          
          <!-- Month Filter Tabs -->
          <div class="schedule-month-tabs" id="schedule-month-tabs">
            ${uniqueMonths.map((m, mIdx) => `
              <button type="button" class="month-tab-btn ${m === activeMonth ? 'active' : ''}" data-month="${m}">
                <span>${m.split(' ')[0]} ${m.split(' ')[1]}</span>
                <span style="font-size: 0.75rem; opacity: 0.85;">${m.split(' ')[2] || '2026'}</span>
              </button>
            `).join('')}
          </div>

          <!-- Departure Rows List (Compact vs Expanded) -->
          <div class="schedule-rows-list" id="schedule-rows-container">
          </div>
        </section>
        
        <!-- SECTION: HIGHLIGHTS & ESG / LEI RATINGS -->
        <section class="detail-content-card" id="section-highlights">
          <h3 class="detail-section-heading"><i class="fa-solid fa-feather-pointed"></i> Điểm Nhấn Chương Trình & Trải Nghiệm Khác Biệt</h3>
          <p class="detail-intro-paragraph">
            ${escapeHTML(tour.overview || `Hành trình ${tour.title} được thiết kế tối ưu mang đến trải nghiệm trọn vẹn khám phá nét đẹp văn hóa, cảnh sắc thiên nhiên và dịch vụ cao cấp nhất tại ${tour.destination}.`)}
          </p>

          <!-- Highlights Pills Grid -->
          <div class="detail-highlights-wrap" style="margin: 1.25rem 0;">
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--accent-forest); margin-bottom: 0.85rem;">
              <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> Những Trải Nghiệm Đáng Giá Nhất:
            </h4>
            <div class="highlights-grid">
              ${(tour.highlights || []).map(hl => `
                <div class="highlight-item">
                  <i class="fa-solid fa-check"></i> <span>${escapeHTML(hl)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- ESG & LEI Sustainable Dimensions -->
          <div style="background: #f8fafc; border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 1.25rem; margin-top: 1.5rem;">
            <h4 style="font-family: var(--font-heading); font-size: 1.05rem; color: #111827; margin-bottom: 0.75rem;">
              <i class="fa-solid fa-award" style="color: var(--accent-emerald);"></i> Đánh Giá Chỉ Số Du Lịch Thế Hệ Mới:
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div style="background: #ffffff; border: 1px solid var(--glass-border); padding: 1rem; border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <span style="font-weight: 800; color: var(--accent-forest); font-size: 0.95rem;">🌿 Du lịch Bền vững (ESG)</span>
                  <span class="badge badge-emerald">${tour.esgScore ? tour.esgScore.split(' ')[0] : '84/100'}</span>
                </div>
                <p style="font-size: 0.82rem; color: #4b5563; margin: 0;">
                  ${escapeHTML(tour.esgDesc || 'Cam kết bảo tồn hệ sinh thái, giảm thiểu rác thải nhựa và hỗ trợ sinh kế cho cộng đồng địa phương.')}
                </p>
              </div>

              <div style="background: #ffffff; border: 1px solid var(--glass-border); padding: 1rem; border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <span style="font-weight: 800; color: var(--accent-emerald); font-size: 0.95rem;">🏛️ Trải nghiệm Bản địa (LEI)</span>
                  <span class="badge badge-emerald">${tour.leiScore ? tour.leiScore.split(' ')[0] : '76/100'}</span>
                </div>
                <p style="font-size: 0.82rem; color: #4b5563; margin: 0;">
                  ${escapeHTML(tour.leiDesc || 'Chạm sâu vào văn hóa truyền thống, thưởng thức ẩm thực bản địa tinh hoa và các hoạt động trải nghiệm đặc quyền.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION: HOTEL & CRUISE SPECIFICATIONS -->
        <section class="detail-content-card" id="section-hotel">
          <h3 class="detail-section-heading"><i class="fa-solid fa-hotel"></i> ${escapeHTML(tour.hotelTier ? `Tiêu Chuẩn Lưu Trú: ${tour.hotelTier}` : 'Tiêu Chuẩn Lưu Trú')}</h3>
          
          <div style="background: #f0fdf4; border: 1px solid rgba(5, 150, 105, 0.25); border-radius: var(--radius-md); padding: 1.5rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
              <div>
                <span class="badge badge-emerald" style="margin-bottom: 0.4rem;">👑 ${escapeHTML(tour.tierName || 'Dòng Tiêu Chuẩn')}</span>
                <h4 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--accent-forest); margin: 0.2rem 0;">
                  ${escapeHTML(tour.hotelSpecs ? tour.hotelSpecs.hotelName : 'Khách sạn cao cấp')}
                </h4>
                <p style="font-size: 0.9rem; color: #374151; margin: 0;">
                  🛏️ <strong>Tiêu chuẩn phòng:</strong> ${escapeHTML(tour.hotelSpecs ? tour.hotelSpecs.roomType : 'Phòng tiêu chuẩn 2 khách/phòng')}
                </p>
              </div>
            </div>

            <h5 style="font-size: 0.92rem; font-weight: 700; color: var(--accent-forest); margin-bottom: 0.6rem;">
              <i class="fa-solid fa-circle-check"></i> Đặc Quyền Lưu Trú Đã Bao Gồm Trong Tour:
            </h5>
            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem; color: #374151;">
              ${(tour.hotelSpecs && tour.hotelSpecs.inclusions ? tour.hotelSpecs.inclusions : [
                'Trọn gói 1 đêm ngủ trên Du thuyền 5 sao chuẩn quốc tế có ban công riêng',
                'Buffet hải sản cao cấp trên du thuyền & tiệc Sunset Party hoàng hôn',
                'Tập Thái Cực Quyền (Tai Chi) buổi sáng ngắm bình minh trên vịnh',
                'Khách sạn 4 sao trung tâm tại Hà Nội và Ninh Bình (2 người/phòng)'
              ]).map(inc => `
                <li style="display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fa-solid fa-check" style="color: var(--accent-emerald); font-size: 0.85rem;"></i>
                  <span>${escapeHTML(inc)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </section>

        <!-- SECTION: DAY-BY-DAY ITINERARY (SCREENSHOT 1) -->
        <section class="detail-content-card" id="section-itinerary">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 class="detail-section-heading" style="margin-bottom: 0;"><i class="fa-solid fa-route"></i> Lịch trình</h3>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-hand-pointer"></i> Nhấn vào ngày để xem chi tiết đầy đủ</span>
          </div>

          <div class="itinerary-preview-card">
            ${(tour.itinerary || []).map((dayItem) => `
              <div class="itinerary-preview-row" data-day="${dayItem.day}">
                <div class="itinerary-item-left">
                  <div class="itinerary-row-title">Ngày ${dayItem.day}: ${escapeHTML(dayItem.title)}</div>
                  <div class="itinerary-row-meals">
                    <i class="fa-solid fa-utensils"></i> ${escapeHTML(dayItem.meals || 'Ăn sáng, trưa, tối')}
                  </div>
                </div>
                <div class="itinerary-preview-chevron">
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- SECTION: SERVICES INCLUSIONS & EXCLUSIONS (ACCORDION STACKED) -->
        <section class="detail-content-card" id="section-services">
          <h3 class="detail-section-heading"><i class="fa-solid fa-list-check"></i> Tiêu Chuẩn Dịch Vụ Minh Bạch</h3>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 0.5rem;">
            Nhấp vào từng tiêu đề để xem chi tiết danh mục dịch vụ đã bao gồm trọn gói hoặc các khoản chi phí tự túc:
          </p>

          <div class="services-accordion-list">
            
            <!-- Accordion 1: Tour Đã Bao Gồm -->
            <div class="service-accordion-card open" id="card-service-inc">
              <button type="button" class="service-accordion-header header-yes" data-target="body-service-inc">
                <div class="service-header-left">
                  <i class="fa-solid fa-circle-check service-header-icon" style="color: var(--accent-emerald);"></i>
                  <div>
                    <h4 class="service-header-title">Giá Tour ĐÃ BAO GỒM (Trọn Gói)</h4>
                    <span style="font-size: 0.8rem; color: var(--accent-forest); font-weight: 600;">
                      Đã bao gồm ${(tour.inclusionsList || []).length} dịch vụ tiêu chuẩn
                    </span>
                  </div>
                </div>
                <i class="fa-solid fa-chevron-down service-accordion-chevron"></i>
              </button>
              <div class="service-accordion-body" id="body-service-inc">
                <ul class="inc-list">
                  ${(tour.inclusionsList || []).map(inc => `
                    <li>
                      <i class="fa-solid fa-check" style="color: var(--accent-emerald);"></i>
                      <span>${escapeHTML(inc)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>

            <!-- Accordion 2: Tour Chưa Bao Gồm -->
            <div class="service-accordion-card open" id="card-service-exc">
              <button type="button" class="service-accordion-header header-no" data-target="body-service-exc">
                <div class="service-header-left">
                  <i class="fa-solid fa-circle-xmark service-header-icon" style="color: #dc2626;"></i>
                  <div>
                    <h4 class="service-header-title">Giá Tour CHƯA BAO GỒM (Tùy Chọn / Tự Túc)</h4>
                    <span style="font-size: 0.8rem; color: #dc2626; font-weight: 600;">
                      ${(tour.exclusionsList || []).length} mục chi phí cá nhân ngoài chương trình
                    </span>
                  </div>
                </div>
                <i class="fa-solid fa-chevron-down service-accordion-chevron"></i>
              </button>
              <div class="service-accordion-body" id="body-service-exc">
                <ul class="inc-list">
                  ${(tour.exclusionsList || []).map(exc => `
                    <li>
                      <i class="fa-solid fa-xmark" style="color: #dc2626;"></i>
                      <span>${escapeHTML(exc)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>

          </div>
        </section>

        <!-- SECTION: POLICY & REFUNDS -->
        <section class="detail-content-card" id="section-policy">
          <h3 class="detail-section-heading"><i class="fa-solid fa-shield-halved"></i> Quy Định & Điều Kiện Hoàn Hủy Tour</h3>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 0.5rem;">
            Nhằm đảm bảo quyền lợi tối đa cho quý khách, chính sách hoàn hủy được áp dụng minh bạch theo khung thời gian sau:
          </p>

          <table class="policy-table">
            <thead>
              <tr>
                <th style="width: 55%;">Thời Điểm Thông Báo Hủy Tour</th>
                <th style="width: 45%;">Mức Phí Phạt Áp Dụng</th>
              </tr>
            </thead>
            <tbody>
              ${(tour.refundPolicy || [
                { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
                { condition: 'Hủy từ 08 đến 14 ngày trước khởi hành', fee: 'Phí hủy 30% giá tour' },
                { condition: 'Hủy từ 04 đến 07 ngày trước khởi hành', fee: 'Phí hủy 50% giá tour' },
                { condition: 'Hủy dưới 03 ngày hoặc vắng mặt', fee: 'Phí hủy 100% giá tour' }
              ]).map(p => `
                <tr>
                  <td><strong><i class="fa-regular fa-clock" style="color: var(--accent-emerald);"></i> ${escapeHTML(p.condition)}</strong></td>
                  <td style="color: ${p.fee.includes('100%') && !p.fee.includes('Phí') ? 'var(--accent-forest)' : '#b91c1c'}; font-weight: 700;">${escapeHTML(p.fee)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem; border-radius: var(--radius-sm); margin-top: 1.25rem; font-size: 0.85rem; color: #4b5563;">
            <i class="fa-solid fa-circle-info" style="color: var(--accent-emerald);"></i> <strong>Lưu ý giấy tờ tùy thân:</strong> Quý khách vui lòng mang theo Căn cước công dân (CCCD) hoặc Hộ chiếu còn hạn trên 6 tháng. Đối với trẻ em dưới 14 tuổi chưa có CCCD cần mang theo bản trích lục Giấy khai sinh có công chứng.
          </div>
        </section>

        <!-- SECTION: FAQS ACCORDION -->
        <section class="detail-content-card" id="section-faqs">
          <h3 class="detail-section-heading"><i class="fa-solid fa-circle-question"></i> Câu Hỏi Thường Gặp (FAQs)</h3>

          <div class="faq-accordion-list" style="margin-top: 1rem;">
            ${(tour.faqs || [
              { q: 'Tour đã bao gồm vé máy bay & bảo hiểm chưa?', a: 'Đã bao gồm trọn gói vé máy bay khứ hồi (đối với tour bay), xe du lịch máy lạnh và bảo hiểm du lịch theo quy định.' },
              { q: 'Tiêu chuẩn phòng nghỉ khách sạn như thế nào?', a: `Toàn bộ khách sạn đạt chuẩn ${tour.hotelTier || '3-5 sao'} được bố trí 2 khách/phòng đầy đủ tiện nghi.` },
              { q: 'Đi 1 mình có phải chịu thêm phụ thu phòng đơn không?', a: 'Mặc định hệ thống sẽ hỗ trợ ghép phòng Twin với khách cùng giới trong đoàn không tính phí. Nếu yêu cầu ở riêng 1 mình/phòng thì áp dụng phụ thu phòng đơn.' }
            ]).map((faq, fIdx) => `
              <div class="faq-card">
                <button class="faq-header-btn" data-faq="${fIdx}">
                  <span><i class="fa-regular fa-comments" style="color: var(--accent-emerald); margin-right: 0.5rem;"></i> ${escapeHTML(faq.q)}</span>
                  <i class="fa-solid fa-chevron-down faq-chevron"></i>
                </button>
                <div class="faq-body-content" id="faq-body-${fIdx}">
                  ${escapeHTML(faq.a)}
                </div>
              </div>
            `).join('')}
          </div>
        </section>

      </article>

      <!-- RIGHT SIDEBAR (4 Cols): Sticky Booking & Rate Card -->
      <aside class="detail-sidebar-col">
        <div class="detail-price-card" style="position: sticky; top: 140px; border: 1.5px solid rgba(5, 150, 105, 0.25); box-shadow: 0 10px 30px rgba(5, 150, 105, 0.06); padding: 1.5rem; border-radius: 16px; background: #ffffff;">
          
          <!-- Price Header & Date Pill -->
          <div style="border-bottom: 1px dashed var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.15rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: baseline; gap: 0.35rem; font-size: 0.95rem; color: #475569; font-weight: 700;">
                <span>Giá:</span>
                <span class="price-big" id="sidebar-price-display" style="color: var(--accent-forest); font-size: 1.85rem; font-weight: 800; font-family: var(--font-body, 'Montserrat', sans-serif); font-variant-numeric: lining-nums tabular-nums; font-feature-settings: 'lnum' 1, 'tnum' 1; vertical-align: baseline;">Từ ${formatCurrencyVND(tour.priceAdult)}</span>
              </div>
              <button type="button" class="badge" id="sidebar-date-badge-btn" style="background: #ecfdf5; color: var(--accent-forest); font-weight: 800; font-size: 0.85rem; padding: 0.4rem 0.85rem; border-radius: 9999px; border: 1px solid rgba(5, 150, 105, 0.25); cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: var(--transition-fast);">
                <span id="sidebar-date-display">Chưa chọn ngày <i class="fa-solid fa-calendar-days" style="font-size: 0.75rem;"></i></span>
              </button>
            </div>
          </div>

          <!-- Specs List -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b;"><i class="fa-solid fa-ticket" style="color: var(--accent-emerald); width: 18px;"></i> Mã tour:</span>
              <strong style="color: var(--accent-forest); font-family: monospace; font-size: 0.86rem;" id="sidebar-sku-display">${tour.sku || tour.code}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b;"><i class="fa-solid fa-location-dot" style="color: var(--accent-emerald); width: 18px;"></i> Khởi hành:</span>
              <strong style="color: #111827;">${escapeHTML(tour.departureFrom ? tour.departureFrom.split('/')[0].trim() : 'TP. Hồ Chí Minh')}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b;"><i class="fa-solid fa-clock" style="color: #d97706; width: 18px;"></i> Thời gian:</span>
              <strong style="color: #111827;">${tour.durationDays} ngày ${tour.durationNights} đêm</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b;"><i class="fa-solid fa-user-group" style="color: var(--accent-emerald); width: 18px;"></i> Số chỗ còn:</span>
              <strong style="color: var(--accent-forest);" id="sidebar-seats-display">Chọn ngày khởi hành</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748b;"><i class="fa-solid fa-award" style="color: var(--accent-emerald); width: 18px;"></i> Chỉ số:</span>
              <strong style="color: var(--accent-forest); font-size: 0.84rem;">LEI: ${tour.leiScore ? tour.leiScore.split('/')[0] : '72'}/100 | ESG: ${tour.esgScore ? tour.esgScore.split('/')[0] : '90'}/100</strong>
            </div>
          </div>

          <!-- CTA Button (Single Clean Full-Width Button: Dynamic State) -->
          <div style="margin-top: 1.25rem;">
            <button class="btn-primary w-full" id="btn-open-booking-modal" style="background: linear-gradient(135deg, #059669 0%, #047857 100%) !important; border: none !important; color: #ffffff !important; font-weight: 800; font-size: 1.15rem; padding: 0.95rem 1.5rem; border-radius: var(--radius-full); box-shadow: 0 8px 25px rgba(5, 150, 105, 0.35); cursor: pointer; transition: all 0.25s ease; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
              <i class="fa-solid fa-calendar-days"></i> Chọn ngày khởi hành
            </button>
          </div>

          <div style="text-align: center; margin-top: 1rem; font-size: 0.78rem; color: var(--text-muted);">
            Tổng đài hỗ trợ miễn phí: <strong>1800 646 888</strong> (24/7)
          </div>

        </div>
      </aside>

    </div>
  `;


  // --- DELEGATE TO FEATURE SUB-MODULES ---

  // 1. Gallery thumbnail switcher
  initGalleryManager();

  // 2. Departure schedule (compact/expanded rows, month tabs, sidebar sync)
  const sharedState = { selectedDepartureDate: null, activeMonth: uniqueMonths[0] || 'Thang 9 2026' };
  initScheduleCalendar(tour, departureList, uniqueMonths, sharedState, (selectedDate) => {
    selectedDepartureDate = selectedDate;
  });

  // 3. Booking CTA button
  const bookingBtn = document.getElementById('btn-open-booking-modal');
  if (bookingBtn) {
    bookingBtn.addEventListener('click', () => {
      if (!sharedState.selectedDepartureDate) {
        const scheduleEl = document.getElementById('section-schedule');
        if (scheduleEl) scheduleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        openBookingModal(tour.id, sharedState.selectedDepartureDate);
      }
    });
  }

  // 4. Itinerary timeline popup modal
  initItineraryTimeline(tour);

  // 5. FAQs accordion, service accordion, scroll-spy sticky tabs
  initHotelAndPolicies();

  // 6. Header CTA Button Handler (also verifies selected date)
  const headerCtaBtn = document.getElementById('header-cta-btn');
  if (headerCtaBtn) {
    headerCtaBtn.addEventListener('click', () => {
      if (!sharedState.selectedDepartureDate) {
        const scheduleEl = document.getElementById('section-schedule');
        if (scheduleEl) scheduleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        openBookingModal(tour.id, sharedState.selectedDepartureDate);
      }
    });
  }

  // 7. Booking Modal Close Handlers
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('tour-modal');
  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }
}

// Ensure execution whether DOM is loading or already parsed
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTourDetailApp);
  } else {
    initTourDetailApp();
  }
}

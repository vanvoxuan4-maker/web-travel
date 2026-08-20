/** scheduleCalendar.js - Departure schedule: month tabs, compact/expanded rows, sidebar sync. */
import { formatCurrencyVND, escapeHTML } from "../utils/formatters.js";
import { getRemainingSeats, getDatePrice, getDateDetails } from "../utils/inventoryManager.js";

export function initScheduleCalendar(tour, departureList, uniqueMonths, state, onDateSelect) {
  const sidebarPriceDisplay = document.getElementById("sidebar-price-display");
  const sidebarDateDisplay = document.getElementById("sidebar-date-display");
  const sidebarSkuDisplay = document.getElementById("sidebar-sku-display");
  const sidebarSeatsDisplay = document.getElementById("sidebar-seats-display");

  let selectedDepartureDate = state && state.selectedDepartureDate !== undefined ? state.selectedDepartureDate : null;
  let activeMonth = state && state.activeMonth ? state.activeMonth : (uniqueMonths[0] || 'Tháng 9 2026');

  function renderScheduleRows() {
    const container = document.getElementById('schedule-rows-container');
    if (!container) return;

    const currentMonthDeps = departureList.filter(d => (d.monthLabel || 'Tháng 9 2026') === activeMonth);
    const depsToRender = currentMonthDeps.length > 0 ? currentMonthDeps : departureList;

    container.innerHTML = depsToRender.map(dep => {
      const isSelected = dep.date === selectedDepartureDate;
      const s = getRemainingSeats(tour.id, dep.date);
      const isSoldOut = s === 0;
      const dayOfWeek = dep.dayOfWeek || 'T5';
      const sku = dep.sku || `NDSGN9919-001-${dep.date.replace(/\//g, '')}VN-D-7`;
      const price = dep.priceAdult || tour.priceAdult;
      const priceChild = dep.priceChild || Math.round(price * 0.75);
      const priceToddler = dep.priceToddler || Math.round(price * 0.5);
      const priceInfant = dep.priceInfant || 500000;
      const singleSurcharge = dep.singleRoomSurcharge || 3500000;

      const outbound = dep.transport && dep.transport.outbound ? dep.transport.outbound : {
        date: dep.date, time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN'
      };
      const inbound = dep.transport && dep.transport.inbound ? dep.transport.inbound : {
        date: dep.date, time: '19:00', arriveTime: '21:10', flightNo: 'VN219', airline: 'Vietnam Airlines', from: 'HAN', to: 'SGN'
      };

      if (isSelected) {
        // EXPANDED CARD (Ảnh 2: Khách đã chọn ngày - Nút đổi thành [ Hủy chọn ] ở đúng vị trí góc phải)
        return `
          <div class="schedule-row-expanded" data-date="${dep.date}">
            <!-- Header: Date, SKU (Left) & [ Hủy chọn ] Button (Top Right) -->
            <div class="schedule-expanded-header">
              <div class="schedule-row-left">
                <span class="schedule-date-badge">
                  <i class="fa-regular fa-calendar-check"></i> ${dayOfWeek}, ${dep.date}
                </span>
                <span class="schedule-sku-badge">
                  <i class="fa-solid fa-ticket" style="color: #94a3b8;"></i> ${escapeHTML(sku)}
                </span>
              </div>
              <button type="button" class="schedule-btn-cancel" data-date="${dep.date}" title="Nhấn để hủy chọn ngày này">
                <i class="fa-solid fa-xmark"></i> Hủy chọn
              </button>
            </div>

            <!-- Sub-block 1: Phương tiện di chuyển -->
            <div class="schedule-sub-block">
              <div class="schedule-sub-title">Phương tiện di chuyển</div>
              <div class="schedule-flights-grid">
                <!-- Outbound Leg -->
                <div class="flight-leg-card">
                  <div class="flight-leg-meta">
                    <span>Ngày đi: <strong>${outbound.date}</strong></span>
                    <span class="flight-code-pill"><i class="fa-solid fa-plane"></i> ${outbound.flightNo}</span>
                  </div>
                  <div class="flight-timeline-row">
                    <span class="flight-time-box">${outbound.time}</span>
                    <div class="flight-path-visual">
                      <div class="flight-path-line"></div>
                      <i class="fa-solid fa-plane flight-path-icon"></i>
                    </div>
                    <span class="flight-time-box">${outbound.arriveTime}</span>
                  </div>
                  <div class="flight-airport-row">
                    <span>${outbound.from}</span>
                    <span class="airline-brand-tag"><i class="fa-solid fa-gem" style="color: #d97706;"></i> ${outbound.airline}</span>
                    <span>${outbound.to}</span>
                  </div>
                </div>

                <!-- Inbound Leg -->
                <div class="flight-leg-card">
                  <div class="flight-leg-meta">
                    <span>Ngày về: <strong>${inbound.date}</strong></span>
                    <span class="flight-code-pill"><i class="fa-solid fa-plane"></i> ${inbound.flightNo}</span>
                  </div>
                  <div class="flight-timeline-row">
                    <span class="flight-time-box">${inbound.time}</span>
                    <div class="flight-path-visual">
                      <div class="flight-path-line"></div>
                      <i class="fa-solid fa-plane flight-path-icon"></i>
                    </div>
                    <span class="flight-time-box">${inbound.arriveTime}</span>
                  </div>
                  <div class="flight-airport-row">
                    <span>${inbound.from}</span>
                    <span class="airline-brand-tag"><i class="fa-solid fa-gem" style="color: #d97706;"></i> ${inbound.airline}</span>
                    <span>${inbound.to}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sub-block 2: Giá chuyến đi -->
            <div class="schedule-sub-block">
              <div class="schedule-sub-title">Giá chuyến đi</div>
              <div class="schedule-pricing-table">
                <div class="price-item-row">
                  <div class="price-item-label">
                    <span class="price-tier-name">Người lớn</span>
                    <span class="price-tier-age">(Từ 12 tuổi trở lên)</span>
                  </div>
                  <span class="price-tier-val">${formatCurrencyVND(price)}</span>
                </div>

                <div class="price-item-row">
                  <div class="price-item-label">
                    <span class="price-tier-name">Em bé</span>
                    <span class="price-tier-age">(Dưới 2 tuổi)</span>
                  </div>
                  <span class="price-tier-val">${formatCurrencyVND(priceInfant)}</span>
                </div>

                <div class="price-item-row">
                  <div class="price-item-label">
                    <span class="price-tier-name">Trẻ em</span>
                    <span class="price-tier-age">(Từ 5 đến 11 tuổi)</span>
                  </div>
                  <span class="price-tier-val">${formatCurrencyVND(priceChild)}</span>
                </div>

                <div class="price-item-row">
                  <div class="price-item-label">
                    <span class="price-tier-name">Phụ thu phòng đơn</span>
                    <span class="price-tier-age">(Yêu cầu ở riêng)</span>
                  </div>
                  <span class="price-tier-val">${formatCurrencyVND(singleSurcharge)}</span>
                </div>

                <div class="price-item-row">
                  <div class="price-item-label">
                    <span class="price-tier-name">Trẻ nhỏ</span>
                    <span class="price-tier-age">(Từ 2 - 4 tuổi)</span>
                  </div>
                  <span class="price-tier-val">${formatCurrencyVND(priceToddler)}</span>
                </div>
              </div>
            </div>

            <!-- Sub-block 3: Lưu ý tổng đài & vé -->
            <div class="schedule-notice-box">
              <i class="fa-solid fa-circle-info"></i> <strong>Liên hệ tổng đài tư vấn: 1800 646 888 (Miễn phí).</strong> Tour không hoàn, không đổi, không hủy, sai tên mất 100%. Vietnam Airlines không bay chặng đi sẽ tự động hủy chặng về.
            </div>
          </div>
        `;
      } else {
        // COMPACT ROW (Ảnh 1: Khách chưa chọn ngày - Nút [ Chọn ])
        return `
          <div class="schedule-row-compact" data-date="${dep.date}">
            <div class="schedule-row-left">
              <span class="schedule-date-badge">
                <i class="fa-regular fa-calendar-check"></i> ${dayOfWeek}, ${dep.date}
              </span>
              <span class="schedule-sku-badge">
                <i class="fa-solid fa-ticket" style="color: #94a3b8;"></i> ${escapeHTML(sku)}
              </span>
            </div>
            <div class="schedule-row-right">
              <span class="schedule-compact-price">${formatCurrencyVND(price)}</span>
              <button type="button" class="schedule-btn-choose" data-date="${dep.date}">
                Chọn
              </button>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  function toggleDate(dStr) {
    const ctaBtn = document.getElementById('btn-open-booking-modal');
    if (selectedDepartureDate === dStr) {
      // HỦY CHỌN (Deselect / Collapse back to compact state)
      selectedDepartureDate = null;
      if (state) state.selectedDepartureDate = null;
      if (onDateSelect) onDateSelect(null);
      if (sidebarPriceDisplay) sidebarPriceDisplay.textContent = `Từ ${formatCurrencyVND(tour.priceAdult || 12290000)}`;
      if (sidebarDateDisplay) sidebarDateDisplay.innerHTML = `Chưa chọn ngày <i class="fa-solid fa-calendar-days" style="font-size: 0.75rem;"></i>`;
      if (sidebarSkuDisplay) sidebarSkuDisplay.textContent = tour.sku || tour.code;
      if (sidebarSeatsDisplay) sidebarSeatsDisplay.textContent = `Chọn ngày khởi hành`;
      if (ctaBtn) {
        ctaBtn.innerHTML = `<i class="fa-solid fa-calendar-days"></i> Chọn ngày khởi hành`;
      }
    } else {
      // ĐÃ CHỌN NGÀY
      selectedDepartureDate = dStr;
      if (state) state.selectedDepartureDate = dStr;
      if (onDateSelect) onDateSelect(dStr);
      const details = getDateDetails(tour.id, selectedDepartureDate) || departureList.find(d => d.date === selectedDepartureDate);
      const seats = getRemainingSeats(tour.id, selectedDepartureDate);
      const price = getDatePrice(tour.id, selectedDepartureDate);

      // Update sticky sidebar
      if (sidebarPriceDisplay) sidebarPriceDisplay.textContent = formatCurrencyVND(price);
      if (sidebarDateDisplay) sidebarDateDisplay.innerHTML = `${details ? details.dayOfWeek || 'T5' : 'T5'}, ${selectedDepartureDate} <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>`;
      if (sidebarSkuDisplay) sidebarSkuDisplay.textContent = details ? details.sku || tour.sku || tour.code : tour.code;
      if (sidebarSeatsDisplay) sidebarSeatsDisplay.textContent = seats === 0 ? 'Đã hết chỗ' : `Còn ${seats} chỗ`;
      if (ctaBtn) {
        ctaBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Đặt tour`;
      }
    }

    // Re-render schedule list
    renderScheduleRows();
  }

  // Delegated click listener on schedule container (100% reliable for Choose, Cancel, and Re-choose)
  const scheduleContainer = document.getElementById('schedule-rows-container');
  if (scheduleContainer) {
    scheduleContainer.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('.schedule-btn-cancel');
      if (cancelBtn) {
        e.preventDefault();
        e.stopPropagation();
        const d = cancelBtn.getAttribute('data-date');
        if (d) toggleDate(d);
        return;
      }

      const chooseBtn = e.target.closest('.schedule-btn-choose');
      if (chooseBtn) {
        e.preventDefault();
        e.stopPropagation();
        const d = chooseBtn.getAttribute('data-date');
        if (d) toggleDate(d);
        return;
      }

      const compactRow = e.target.closest('.schedule-row-compact');
      if (compactRow) {
        e.preventDefault();
        const d = compactRow.getAttribute('data-date');
        if (d) toggleDate(d);
        return;
      }
    });
  }

  // Month tab click listeners
  document.querySelectorAll(".month-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".month-tab-btn").forEach(b => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      activeMonth = target.getAttribute("data-month");
      if (state) state.activeMonth = activeMonth;
      renderScheduleRows();
    });
  });

  const sidebarDateBadgeBtn = document.getElementById("sidebar-date-badge-btn");
  if (sidebarDateBadgeBtn) {
    sidebarDateBadgeBtn.addEventListener("click", () => {
      const el = document.getElementById("section-schedule");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  renderScheduleRows();
}

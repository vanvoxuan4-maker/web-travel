import { formatCurrencyVND, escapeHTML } from '../utils/formatters.js';
import { TOURS_DATA } from '../data/toursData.js';
import { getRemainingSeats, deductSeats, getDatePrice, getDateLabel, getDateDetails } from '../utils/inventoryManager.js';

/**
 * Smart Booking Engine & Realtime Pricing Controller - WebTravel Editorial
 * Features:
 * 1. Live Calendar Departure Dates & Seat Capacity Lock
 * 2. 3-Tier Passenger Age Pricing (Adults 100%, Children 75%, Infants 15%)
 * 3. Smart Single Room Supplement (Auto-detect odd adult count)
 * 4. Add-on services & Coupon Discount Engine
 * 5. Realtime Itemized Price Summary Sidebar
 * 6. 15-Minute Reservation Lock Countdown & Dynamic VietQR Napas247 Payment
 * 7. Realtime Inventory Deduction & Persistence
 */
export function openBookingModal(tourId, initialDate = null) {
  const tour = TOURS_DATA.find(t => t.id === tourId) || TOURS_DATA[0];
  const modalOverlay = document.getElementById('tour-modal');
  const modalContent = document.getElementById('modal-content');

  if (!modalOverlay || !modalContent) return;

  const departureList = tour.departureDates && tour.departureDates.length > 0
    ? tour.departureDates
    : (tour.availableDates || ['12/09/2026', '19/09/2026', '26/09/2026', '10/10/2026']).map(d => ({ date: d, seats: 5, priceAdult: tour.priceAdult, label: null }));
  const defaultDate = initialDate || (departureList.length > 0 ? departureList[0].date : '12/09/2026');
  const initialDetails = getDateDetails(tour.id, defaultDate);
  const initialAvailableSeats = initialDetails ? initialDetails.seats : getRemainingSeats(tour.id, defaultDate);
  const initialDatePrice = initialDetails ? initialDetails.priceAdult : getDatePrice(tour.id, defaultDate);
  const initialDateLabel = initialDetails ? initialDetails.label : getDateLabel(tour.id, defaultDate);
  const initialPriceChild = initialDetails ? initialDetails.priceChild : Math.round(initialDatePrice * 0.75);
  const initialPriceToddler = initialDetails ? initialDetails.priceToddler : Math.round(initialDatePrice * 0.5);
  const initialPriceInfant = initialDetails ? initialDetails.priceInfant : 500000;
  const singleRoomPrice = initialDetails ? initialDetails.singleRoomSurcharge : 800000;
  const insurancePrice = 150000;
  const pickupPrice = 250000;

  // Render Smart 2-Column Booking Engine Layout
  modalContent.innerHTML = `
    <div class="booking-modal-header">
      <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.4rem;">
        <span class="badge badge-emerald"><i class="fa-solid fa-shield-halved"></i> Đặt Chỗ Trực Tuyến An Toàn</span>
        <span class="badge badge-forest">Mã: ${escapeHTML(tour.code || 'WT-01')}</span>
      </div>
      <h2 style="font-family: var(--font-heading); font-size: 1.85rem; color: #111827; margin: 0.2rem 0;">${escapeHTML(tour.title)}</h2>
      <p class="text-muted" style="font-size: 0.9rem; margin: 0;">
        <i class="fa-solid fa-location-dot" style="color: var(--accent-emerald);"></i> ${escapeHTML(tour.destination)} 
        &nbsp;|&nbsp; <i class="fa-solid fa-clock" style="color: var(--accent-emerald);"></i> ${tour.durationDays}N${tour.durationNights}Đ 
        &nbsp;|&nbsp; <i class="fa-solid fa-hotel" style="color: #f59e0b;"></i> ${tour.starRating}★ ${escapeHTML(tour.hotelSpecs ? tour.hotelSpecs.hotelName : 'Khách sạn cao cấp')}
      </p>
    </div>

    <form id="smart-booking-form" onsubmit="return false;">
      <div class="booking-modal-grid">
        
        <!-- LEFT COLUMN: Step-by-Step Configuration -->
        <div class="booking-left-col">
          
          <!-- STEP 1: Confirmed Departure Date Display & Instant Lock -->
          <div class="booking-form-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <h4 class="booking-step-title" style="margin-bottom: 0;"><span class="step-num">1</span> Ngày Khởi Hành</h4>
              <button type="button" id="btn-toggle-change-date" style="background: none; border: none; color: #0284c7; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                <i class="fa-solid fa-pen-to-square"></i> Đổi ngày khác
              </button>
            </div>

            <!-- Confirmed Date Summary Banner -->
            <div id="confirmed-date-banner" style="background: #f0fdf4; border: 1.5px solid var(--accent-emerald); padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 36px; height: 36px; background: var(--accent-emerald); color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.05rem;">
                  <i class="fa-regular fa-calendar-check"></i>
                </div>
                <div>
                  <div style="font-size: 0.78rem; color: #047857; font-weight: 600; text-transform: uppercase;">Ngày khởi hành đã chọn từ trang chi tiết:</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 0.5rem;" id="confirmed-date-display-wrap">
                    <span id="confirmed-date-display">${defaultDate}</span>
                    <span style="font-size: 0.95rem; color: var(--accent-forest);" id="confirmed-date-price">(${formatCurrencyVND(initialDatePrice)}/khách)</span>
                    ${initialDateLabel ? `<span id="confirmed-date-label" style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; ${initialDateLabel.includes('Lễ') ? 'background: #fef2f2; color: #dc2626;' : 'background: #ecfdf5; color: #047857;'}">${initialDateLabel}</span>` : '<span id="confirmed-date-label"></span>'}
                  </div>
                </div>
              </div>
              <span class="badge badge-emerald" id="confirmed-seats-badge" style="padding: 0.35rem 0.75rem; font-size: 0.82rem; ${initialAvailableSeats === 0 ? 'background: #fef2f2; color: #dc2626; border-color: #fecaca;' : ''}">
                <i class="${initialAvailableSeats === 0 ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-user-check'}"></i> 
                ${initialAvailableSeats === 0 ? 'Đã hết chỗ' : `Còn ${initialAvailableSeats} chỗ trống`}
              </span>
            </div>

            <!-- Expandable Dates Grid (Hidden by default, opens if user wants to change date) -->
            <div class="booking-dates-grid" id="booking-dates-container" style="display: none; margin-top: 0.85rem;">
              ${departureList.map((dep) => {
                const dStr = dep.date;
                const isSelected = dStr === defaultDate;
                const s = getRemainingSeats(tour.id, dStr);
                const p = getDatePrice(tour.id, dStr);
                const lbl = dep.label;
                const isSoldOut = s === 0;
                return `
                  <button type="button" class="booking-date-card ${isSelected ? 'active' : ''}" data-date="${dStr}" data-price="${p}" data-seats="${s}" data-label="${lbl || ''}" style="${isSoldOut ? 'opacity: 0.55; cursor: not-allowed;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <span class="date-val"><i class="fa-regular fa-calendar-check"></i> ${dStr}</span>
                      ${lbl ? `<span style="font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; ${lbl.includes('Lễ') || lbl.includes('Hết') ? 'background: #fef2f2; color: #dc2626;' : 'background: #ecfdf5; color: #047857;'}">${lbl}</span>` : ''}
                    </div>
                    <span class="date-price">${formatCurrencyVND(p)}</span>
                    <span class="date-seat-badge" style="${isSoldOut ? 'background: #fef2f2; color: #dc2626;' : (s <= 2 ? 'background: #fffbeb; color: #b45309;' : '')}">
                      <i class="${isSoldOut ? 'fa-solid fa-ban' : 'fa-solid fa-user-check'}"></i> 
                      ${isSoldOut ? 'Hết chỗ' : `Còn ${s} chỗ`}
                    </span>
                  </button>
                `;
              }).join('')}
            </div>
            <input type="hidden" id="selected-departure-date" value="${defaultDate}">
          </div>

          <!-- STEP 2: Passenger Count by Age Tier -->
          <div class="booking-form-section">
            <h4 class="booking-step-title"><span class="step-num">2</span> Số Lượng Hành Khách</h4>
            
            <div class="passenger-tier-list">
              <!-- Tier 1: Adult -->
              <div class="passenger-tier-row">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: #111827;">Người Lớn (Từ 12 tuổi trở lên)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">100% giá tour - Tiêu chuẩn giường riêng đầy đủ</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-forest); margin-top: 0.2rem;" id="tier-price-adult">${formatCurrencyVND(initialDatePrice)} / người</div>
                </div>
                <div class="counter-input-wrap">
                  <button type="button" class="counter-btn" id="btn-dec-adults"><i class="fa-solid fa-minus"></i></button>
                  <input type="number" id="count-adults" class="counter-val" value="2" min="1" max="20" readonly>
                  <button type="button" class="counter-btn" id="btn-inc-adults"><i class="fa-solid fa-plus"></i></button>
                </div>
              </div>

              <!-- Tier 2: Child (5-11yo) -->
              <div class="passenger-tier-row">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: #111827;">Trẻ Em (Từ 5 - 11 tuổi)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">75% giá tour - Suất ăn riêng, ngủ chung bố mẹ</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-forest); margin-top: 0.2rem;" id="tier-price-child">${formatCurrencyVND(initialPriceChild)} / bé</div>
                </div>
                <div class="counter-input-wrap">
                  <button type="button" class="counter-btn" id="btn-dec-children"><i class="fa-solid fa-minus"></i></button>
                  <input type="number" id="count-children" class="counter-val" value="0" min="0" max="10" readonly>
                  <button type="button" class="counter-btn" id="btn-inc-children"><i class="fa-solid fa-plus"></i></button>
                </div>
              </div>

              <!-- Tier 3: Toddler (2-4yo) -->
              <div class="passenger-tier-row">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: #111827;">Trẻ Nhỏ (Từ 2 - 4 tuổi)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">50% giá tour - Ghế máy bay riêng, ăn ngủ cùng bố mẹ</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-forest); margin-top: 0.2rem;" id="tier-price-toddler">${formatCurrencyVND(initialPriceToddler)} / bé</div>
                </div>
                <div class="counter-input-wrap">
                  <button type="button" class="counter-btn" id="btn-dec-toddlers"><i class="fa-solid fa-minus"></i></button>
                  <input type="number" id="count-toddlers" class="counter-val" value="0" min="0" max="10" readonly>
                  <button type="button" class="counter-btn" id="btn-inc-toddlers"><i class="fa-solid fa-plus"></i></button>
                </div>
              </div>

              <!-- Tier 4: Infant (<2yo) -->
              <div class="passenger-tier-row">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: #111827;">Em Bé (Dưới 2 tuổi)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">500.000 ₫ - Phí bảo hiểm và phụ phí dịch vụ</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-forest); margin-top: 0.2rem;" id="tier-price-infant">${formatCurrencyVND(initialPriceInfant)} / bé</div>
                </div>
                <div class="counter-input-wrap">
                  <button type="button" class="counter-btn" id="btn-dec-infants"><i class="fa-solid fa-minus"></i></button>
                  <input type="number" id="count-infants" class="counter-val" value="0" min="0" max="5" readonly>
                  <button type="button" class="counter-btn" id="btn-inc-infants"><i class="fa-solid fa-plus"></i></button>
                </div>
              </div>
            </div>

            <!-- Capacity Alert Message -->
            <div id="capacity-warning-msg" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-top: 0.75rem;">
              <i class="fa-solid fa-triangle-exclamation"></i> <strong>Số lượng đã đạt giới hạn:</strong> Ngày khởi hành này chỉ còn nhận tối đa <span id="warning-seat-count">${tour.seatsLeft || 5}</span> chỗ trống.
            </div>
          </div>

          <!-- STEP 3: Single Supplement & Optional Add-ons -->
          <div class="booking-form-section">
            <h4 class="booking-step-title"><span class="step-num">3</span> Tùy Chọn Phòng & Dịch Vụ Mở Rộng</h4>
            
            <!-- Smart Room Arrangement Box -->
            <div id="single-room-block" style="background: #f8fafc; border: 1px solid var(--glass-border); padding: 1.15rem; border-radius: var(--radius-sm); margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-weight: 700; font-size: 0.92rem; color: #111827;">
                    <i class="fa-solid fa-bed" style="color: var(--accent-emerald);"></i> Sắp Xếp Phòng Khách Sạn
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;" id="single-room-hint">
                    Tiêu chuẩn: 2 khách/phòng đôi (Đã bao gồm trong giá tour).
                  </div>
                </div>
                <div id="room-status-badge" style="font-weight: 700; color: var(--accent-forest); font-size: 0.85rem; background: #d1fae5; padding: 0.2rem 0.6rem; border-radius: 12px;">
                  Đã bao gồm (0 ₫)
                </div>
              </div>

              <!-- Dynamic Options for Room Choices -->
              <div id="room-options-container" style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.88rem;">
                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                  <input type="radio" name="single-room-choice" id="opt-single-room-no" value="no" checked>
                  <span id="label-room-standard">Phòng đôi tiêu chuẩn / Ghép phòng Twin (Đã bao gồm - 0 ₫)</span>
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                  <input type="radio" name="single-room-choice" id="opt-single-room-yes" value="yes">
                  <span>Yêu cầu ở phòng đơn riêng (+800.000 ₫ / phòng)</span>
                </label>
              </div>
            </div>

            <!-- Optional Add-ons -->
            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              <label class="addon-checkbox-label">
                <input type="checkbox" id="addon-insurance">
                <div style="flex: 1;">
                  <span style="font-weight: 600; font-size: 0.88rem;">Bảo hiểm du lịch mở rộng quốc tế</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Bồi thường tối đa 1 tỷ đồng / người</span>
                </div>
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--accent-forest);">+${formatCurrencyVND(insurancePrice)} / người</span>
              </label>

              <label class="addon-checkbox-label">
                <input type="checkbox" id="addon-pickup">
                <div style="flex: 1;">
                  <span style="font-weight: 600; font-size: 0.88rem;">Xe Limousine đón tiễn tận nhà (Nội thành)</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Xe cao cấp đưa đón 2 chiều thuận tiện</span>
                </div>
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--accent-forest);">+${formatCurrencyVND(pickupPrice)} / người</span>
              </label>
            </div>
          </div>

          <!-- STEP 4: Passenger Contact Information -->
          <div class="booking-form-section">
            <h4 class="booking-step-title"><span class="step-num">4</span> Thông Tin Người Đại Diện Nhận Vé</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label><i class="fa-solid fa-user"></i> Họ và Tên *</label>
                <input type="text" id="book-name" placeholder="Nguyễn Văn A" required>
              </div>
              <div class="form-group" style="margin: 0;">
                <label><i class="fa-solid fa-phone"></i> Số Điện Thoại (Zalo) *</label>
                <input type="tel" id="book-phone" placeholder="0901 234 567" required>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem;">
              <div class="form-group" style="margin: 0;">
                <label><i class="fa-solid fa-envelope"></i> Email Nhận Vé & Hợp Đồng *</label>
                <input type="email" id="book-email" placeholder="khachhang@gmail.com" required>
              </div>
              <div class="form-group" style="margin: 0;">
                <label><i class="fa-solid fa-id-card"></i> Số CCCD / Hộ Chiếu</label>
                <input type="text" id="book-id-card" placeholder="12 chữ số CCCD hoặc Passport">
              </div>
            </div>

            <div class="form-group" style="margin-top: 0.75rem; margin-bottom: 0;">
              <label><i class="fa-solid fa-note-sticky"></i> Ghi chú đặc biệt (nếu có):</label>
              <input type="text" id="book-notes" placeholder="Ăn chay, phòng tầng cao, kỷ niệm ngày cưới...">
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Sticky Realtime Price Summary & Coupon Box -->
        <div class="booking-right-col">
          <div class="booking-summary-sticky-card">
            
            <!-- Reservation Lock Countdown Badge -->
            <div class="seat-lock-banner">
              <i class="fa-solid fa-stopwatch fa-spin-pulse"></i>
              <span>Giữ chỗ tạm thời trong: <strong id="lock-countdown">15:00</strong></span>
            </div>

            <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: #111827; margin: 1rem 0 0.5rem;">Chi Tiết Giá Tour</h3>
            <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 1rem;">Cập nhật tự động theo thời gian thực (Đã gồm VAT & Bảo hiểm)</p>

            <!-- Realtime Price Breakdown Rows -->
            <div class="price-breakdown-table">
              <div class="breakdown-row" id="row-adults">
                <span class="label">Người lớn (≥12t) (<span id="summary-adults-count">2</span>x):</span>
                <span class="val" id="summary-adults-total">${formatCurrencyVND(tour.priceAdult * 2)}</span>
              </div>
              <div class="breakdown-row" id="row-children" style="display: none;">
                <span class="label">Trẻ em (5-11t) (<span id="summary-children-count">0</span>x):</span>
                <span class="val" id="summary-children-total">0 ₫</span>
              </div>
              <div class="breakdown-row" id="row-toddlers" style="display: none;">
                <span class="label">Trẻ nhỏ (2-4t) (<span id="summary-toddlers-count">0</span>x):</span>
                <span class="val" id="summary-toddlers-total">0 ₫</span>
              </div>
              <div class="breakdown-row" id="row-infants" style="display: none;">
                <span class="label">Em bé (<2t) (<span id="summary-infants-count">0</span>x):</span>
                <span class="val" id="summary-infants-total">0 ₫</span>
              </div>
              <div class="breakdown-row" id="row-single-room" style="display: none;">
                <span class="label">Phụ thu phòng đơn:</span>
                <span class="val" id="summary-single-room-total">0 ₫</span>
              </div>
              <div class="breakdown-row" id="row-addons" style="display: none;">
                <span class="label">Dịch vụ mở rộng:</span>
                <span class="val" id="summary-addons-total">0 ₫</span>
              </div>
              <div class="breakdown-row discount-row" id="row-coupon" style="display: none;">
                <span class="label"><i class="fa-solid fa-tag"></i> Mã giảm giá:</span>
                <span class="val" id="summary-coupon-total">-0 ₫</span>
              </div>
            </div>

            <!-- Coupon Code Input Box -->
            <div class="coupon-box-wrap">
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="input-coupon-code" placeholder="Nhập mã (SUMMER2026, WELCOME)" style="text-transform: uppercase; font-weight: 700; font-size: 0.85rem; padding: 0.6rem 0.85rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                <button type="button" class="btn-secondary" id="btn-apply-coupon" style="padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">Áp Dụng</button>
              </div>
              <div id="coupon-feedback" style="font-size: 0.78rem; margin-top: 0.35rem; display: none;"></div>
            </div>

            <!-- Total Price Summary Box -->
            <div class="final-total-wrap">
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">TỔNG THANH TOÁN:</div>
              <div class="final-price-num" id="summary-final-total">${formatCurrencyVND(tour.priceAdult * 2)}</div>
              <div style="font-size: 0.78rem; color: var(--accent-forest); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Đã bao gồm 100% Thuế VAT & Phí tham quan</div>
            </div>

            <!-- Payment Type Option (Full vs Deposit) -->
            <div style="margin: 1.25rem 0 1.5rem; background: #f0fdf4; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid rgba(5,150,105,0.2);">
              <div style="font-size: 0.82rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Hình thức thanh toán:</div>
              <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem;">
                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-weight: 600;">
                  <input type="radio" name="pay-option" value="full" checked> Thanh toán 100% (Xác nhận vé ngay)
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-weight: 600;">
                  <input type="radio" name="pay-option" value="deposit"> Đặt cọc giữ chỗ 50% (<span id="deposit-amount-label">${formatCurrencyVND((tour.priceAdult * 2) * 0.5)}</span>)
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-primary w-full" id="btn-submit-booking" style="padding: 1rem; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-sm); box-shadow: 0 10px 25px rgba(5,150,105,0.35);">
              <i class="fa-solid fa-lock"></i> Tiến Hành Đặt Chỗ & Thanh Toán
            </button>

            <div style="text-align: center; margin-top: 0.85rem; font-size: 0.78rem; color: var(--text-muted);">
              <i class="fa-solid fa-shield-check" style="color: var(--accent-emerald);"></i> Cam kết hoàn tiền 100% nếu tour bị hủy do thời tiết
            </div>

          </div>
        </div>

      </div>
    </form>
  `;

  // --- LOGIC CONTROLLER & REALTIME CALCULATION ---
  const state = {
    selectedDate: defaultDate,
    adults: Math.min(2, Math.max(1, initialAvailableSeats)),
    children: 0,
    toddlers: 0,
    infants: 0,
    maxSeats: initialAvailableSeats,
    singleRoom: false,
    addonInsurance: false,
    addonPickup: false,
    couponDiscount: 0,
    couponCode: '',
    payOption: 'full'
  };

  const elements = {
    dateCards: modalContent.querySelectorAll('.booking-date-card'),
    selectedDateInput: document.getElementById('selected-departure-date'),
    countAdults: document.getElementById('count-adults'),
    countChildren: document.getElementById('count-children'),
    countToddlers: document.getElementById('count-toddlers'),
    countInfants: document.getElementById('count-infants'),
    btnIncAdults: document.getElementById('btn-inc-adults'),
    btnDecAdults: document.getElementById('btn-dec-adults'),
    btnIncChildren: document.getElementById('btn-inc-children'),
    btnDecChildren: document.getElementById('btn-dec-children'),
    btnIncToddlers: document.getElementById('btn-inc-toddlers'),
    btnDecToddlers: document.getElementById('btn-dec-toddlers'),
    btnIncInfants: document.getElementById('btn-inc-infants'),
    btnDecInfants: document.getElementById('btn-dec-infants'),
    capacityWarning: document.getElementById('capacity-warning-msg'),
    optSingleYes: document.getElementById('opt-single-room-yes'),
    optSingleNo: document.getElementById('opt-single-room-no'),
    addonInsurance: document.getElementById('addon-insurance'),
    addonPickup: document.getElementById('addon-pickup'),
    inputCoupon: document.getElementById('input-coupon-code'),
    btnApplyCoupon: document.getElementById('btn-apply-coupon'),
    couponFeedback: document.getElementById('coupon-feedback'),
    summaryAdultsCount: document.getElementById('summary-adults-count'),
    summaryAdultsTotal: document.getElementById('summary-adults-total'),
    rowChildren: document.getElementById('row-children'),
    summaryChildrenCount: document.getElementById('summary-children-count'),
    summaryChildrenTotal: document.getElementById('summary-children-total'),
    rowToddlers: document.getElementById('row-toddlers'),
    summaryToddlersCount: document.getElementById('summary-toddlers-count'),
    summaryToddlersTotal: document.getElementById('summary-toddlers-total'),
    rowInfants: document.getElementById('row-infants'),
    summaryInfantsCount: document.getElementById('summary-infants-count'),
    summaryInfantsTotal: document.getElementById('summary-infants-total'),
    rowSingleRoom: document.getElementById('row-single-room'),
    summarySingleRoomTotal: document.getElementById('summary-single-room-total'),
    rowAddons: document.getElementById('row-addons'),
    summaryAddonsTotal: document.getElementById('summary-addons-total'),
    rowCoupon: document.getElementById('row-coupon'),
    summaryCouponTotal: document.getElementById('summary-coupon-total'),
    summaryFinalTotal: document.getElementById('summary-final-total'),
    depositLabel: document.getElementById('deposit-amount-label'),
    payRadios: modalContent.querySelectorAll('input[name="pay-option"]')
  };

  function calculateAndRender() {
    // Capacity Warning Feedback
    const totalBookedSeats = state.adults + state.children + state.toddlers;
    if (totalBookedSeats >= state.maxSeats) {
      elements.capacityWarning.style.display = 'block';
      elements.capacityWarning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Đã chọn tối đa số chỗ còn nhận cho chuyến này (Tối đa ${state.maxSeats} chỗ)`;
    } else {
      elements.capacityWarning.style.display = 'none';
    }

    // Price Calculations dynamically based on selected departure date
    const currentDetails = getDateDetails(tour.id, state.selectedDate);
    const priceAdultUnit = currentDetails ? currentDetails.priceAdult : getDatePrice(tour.id, state.selectedDate);
    const priceChildUnit = currentDetails ? currentDetails.priceChild : Math.round(priceAdultUnit * 0.75);
    const priceToddlerUnit = currentDetails ? currentDetails.priceToddler : Math.round(priceAdultUnit * 0.5);
    const priceInfantUnit = currentDetails ? currentDetails.priceInfant : 500000;

    // Update Step 2 Unit Price Display
    const tierElAdult = document.getElementById('tier-price-adult');
    const tierElChild = document.getElementById('tier-price-child');
    const tierElToddler = document.getElementById('tier-price-toddler');
    const tierElInfant = document.getElementById('tier-price-infant');
    if (tierElAdult) tierElAdult.textContent = `${formatCurrencyVND(priceAdultUnit)} / người`;
    if (tierElChild) tierElChild.textContent = `${formatCurrencyVND(priceChildUnit)} / bé`;
    if (tierElToddler) tierElToddler.textContent = `${formatCurrencyVND(priceToddlerUnit)} / bé`;
    if (tierElInfant) tierElInfant.textContent = `${formatCurrencyVND(priceInfantUnit)} / bé`;

    const totalAdults = state.adults * priceAdultUnit;
    const totalChildren = state.children * priceChildUnit;
    const totalToddlers = state.toddlers * priceToddlerUnit;
    const totalInfants = state.infants * priceInfantUnit;

    const totalSingleRoom = state.singleRoom ? singleRoomPrice : 0;
    
    let totalAddons = 0;
    if (state.addonInsurance) totalAddons += insurancePrice * (state.adults + state.children + state.toddlers);
    if (state.addonPickup) totalAddons += pickupPrice * (state.adults + state.children + state.toddlers);

    const rawTotal = totalAdults + totalChildren + totalToddlers + totalInfants + totalSingleRoom + totalAddons;
    const finalTotal = Math.max(0, rawTotal - state.couponDiscount);

    // Update Summary Sidebar
    elements.summaryAdultsCount.textContent = state.adults;
    elements.summaryAdultsTotal.textContent = formatCurrencyVND(totalAdults);

    if (state.children > 0) {
      elements.rowChildren.style.display = 'flex';
      elements.summaryChildrenCount.textContent = state.children;
      elements.summaryChildrenTotal.textContent = formatCurrencyVND(totalChildren);
    } else {
      elements.rowChildren.style.display = 'none';
    }

    if (state.toddlers > 0) {
      elements.rowToddlers.style.display = 'flex';
      elements.summaryToddlersCount.textContent = state.toddlers;
      elements.summaryToddlersTotal.textContent = formatCurrencyVND(totalToddlers);
    } else {
      elements.rowToddlers.style.display = 'none';
    }

    if (state.infants > 0) {
      elements.rowInfants.style.display = 'flex';
      elements.summaryInfantsCount.textContent = state.infants;
      elements.summaryInfantsTotal.textContent = formatCurrencyVND(totalInfants);
    } else {
      elements.rowInfants.style.display = 'none';
    }

    if (state.singleRoom) {
      elements.rowSingleRoom.style.display = 'flex';
      elements.summarySingleRoomTotal.textContent = formatCurrencyVND(singleRoomPrice);
    } else {
      elements.rowSingleRoom.style.display = 'none';
    }

    if (totalAddons > 0) {
      elements.rowAddons.style.display = 'flex';
      elements.summaryAddonsTotal.textContent = formatCurrencyVND(totalAddons);
    } else {
      elements.rowAddons.style.display = 'none';
    }

    if (state.couponDiscount > 0) {
      elements.rowCoupon.style.display = 'flex';
      elements.summaryCouponTotal.textContent = '-' + formatCurrencyVND(state.couponDiscount);
    } else {
      elements.rowCoupon.style.display = 'none';
    }

    elements.summaryFinalTotal.textContent = formatCurrencyVND(finalTotal);
    elements.depositLabel.textContent = formatCurrencyVND(Math.round(finalTotal * 0.5));
  }

  // --- EVENT ATTACHMENTS ---
  
  // Toggle Expandable Date Selector
  const btnToggleChangeDate = document.getElementById('btn-toggle-change-date');
  const bookingDatesContainer = document.getElementById('booking-dates-container');
  const confirmedDateDisplay = document.getElementById('confirmed-date-display');
  const confirmedDatePrice = document.getElementById('confirmed-date-price');
  const confirmedDateLabel = document.getElementById('confirmed-date-label');

  if (btnToggleChangeDate && bookingDatesContainer) {
    btnToggleChangeDate.addEventListener('click', () => {
      const isHidden = bookingDatesContainer.style.display === 'none';
      bookingDatesContainer.style.display = isHidden ? 'grid' : 'none';
      btnToggleChangeDate.innerHTML = isHidden 
        ? '<i class="fa-solid fa-check"></i> Đóng chọn lịch' 
        : '<i class="fa-solid fa-pen-to-square"></i> Đổi ngày khác';
    });
  }

  // Date Selector
  elements.dateCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const s = parseInt(e.currentTarget.getAttribute('data-seats') || '5', 10);
      if (s === 0) return; // Prevent selecting sold out dates

      elements.dateCards.forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.selectedDate = e.currentTarget.getAttribute('data-date');
      elements.selectedDateInput.value = state.selectedDate;
      state.maxSeats = s;

      const datePrice = getDatePrice(tour.id, state.selectedDate);
      const dateLabel = getDateLabel(tour.id, state.selectedDate);

      if (confirmedDateDisplay) confirmedDateDisplay.textContent = state.selectedDate;
      if (confirmedDatePrice) confirmedDatePrice.textContent = `(${formatCurrencyVND(datePrice)}/khách)`;
      if (confirmedDateLabel) {
        if (dateLabel) {
          confirmedDateLabel.style.display = 'inline-block';
          confirmedDateLabel.textContent = dateLabel;
          confirmedDateLabel.style.cssText = `font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; ${dateLabel.includes('Lễ') ? 'background: #fef2f2; color: #dc2626;' : 'background: #ecfdf5; color: #047857;'}`;
        } else {
          confirmedDateLabel.style.display = 'none';
        }
      }

      const confirmedBadge = document.getElementById('confirmed-seats-badge');
      if (confirmedBadge) {
        if (s === 0) {
          confirmedBadge.style.background = '#fef2f2';
          confirmedBadge.style.color = '#dc2626';
          confirmedBadge.style.borderColor = '#fecaca';
          confirmedBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Đã hết chỗ';
        } else {
          confirmedBadge.style.background = '#f0fdf4';
          confirmedBadge.style.color = '#047857';
          confirmedBadge.style.borderColor = 'var(--accent-emerald)';
          confirmedBadge.innerHTML = `<i class="fa-solid fa-user-check"></i> Còn ${s} chỗ trống`;
        }
      }

      // Clamp passengers if exceeds new maxSeats
      if (state.adults + state.children + state.toddlers > state.maxSeats) {
        state.adults = Math.max(1, Math.min(2, state.maxSeats));
        state.children = 0;
        state.toddlers = 0;
        elements.countAdults.value = state.adults;
        elements.countChildren.value = state.children;
        elements.countToddlers.value = state.toddlers;
      }
      calculateAndRender();
    });
  });

  // Adult Counter
  elements.btnIncAdults.addEventListener('click', () => {
    if (state.adults + state.children + state.toddlers < state.maxSeats) {
      state.adults += 1;
      elements.countAdults.value = state.adults;
      calculateAndRender();
    }
  });
  elements.btnDecAdults.addEventListener('click', () => {
    if (state.adults > 1) {
      state.adults -= 1;
      elements.countAdults.value = state.adults;
      calculateAndRender();
    }
  });

  // Children Counter (5-11yo)
  elements.btnIncChildren.addEventListener('click', () => {
    if (state.adults + state.children + state.toddlers < state.maxSeats) {
      state.children += 1;
      elements.countChildren.value = state.children;
      calculateAndRender();
    }
  });
  elements.btnDecChildren.addEventListener('click', () => {
    if (state.children > 0) {
      state.children -= 1;
      elements.countChildren.value = state.children;
      calculateAndRender();
    }
  });

  // Toddlers Counter (2-4yo)
  elements.btnIncToddlers.addEventListener('click', () => {
    if (state.adults + state.children + state.toddlers < state.maxSeats) {
      state.toddlers += 1;
      elements.countToddlers.value = state.toddlers;
      calculateAndRender();
    }
  });
  elements.btnDecToddlers.addEventListener('click', () => {
    if (state.toddlers > 0) {
      state.toddlers -= 1;
      elements.countToddlers.value = state.toddlers;
      calculateAndRender();
    }
  });

  // Infants Counter (<2yo)
  elements.btnIncInfants.addEventListener('click', () => {
    if (state.infants < 5) {
      state.infants += 1;
      elements.countInfants.value = state.infants;
      calculateAndRender();
    }
  });
  elements.btnDecInfants.addEventListener('click', () => {
    if (state.infants > 0) {
      state.infants -= 1;
      elements.countInfants.value = state.infants;
      calculateAndRender();
    }
  });

  // Single room radio
  elements.optSingleYes.addEventListener('change', () => {
    state.singleRoom = true;
    calculateAndRender();
  });
  elements.optSingleNo.addEventListener('change', () => {
    state.singleRoom = false;
    calculateAndRender();
  });

  // Add-ons checkboxes
  elements.addonInsurance.addEventListener('change', (e) => {
    state.addonInsurance = e.target.checked;
    calculateAndRender();
  });
  elements.addonPickup.addEventListener('change', (e) => {
    state.addonPickup = e.target.checked;
    calculateAndRender();
  });

  // Payment Option Radios
  elements.payRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      state.payOption = e.target.value;
    });
  });

  // Coupon Engine
  elements.btnApplyCoupon.addEventListener('click', () => {
    const code = elements.inputCoupon.value.trim().toUpperCase();
    if (!code) return;

    if (code === 'SUMMER2026') {
      state.couponDiscount = 500000;
      state.couponCode = code;
      elements.couponFeedback.style.display = 'block';
      elements.couponFeedback.style.color = 'var(--accent-forest)';
      elements.couponFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã áp dụng mã SUMMER2026 (-500.000 ₫)';
    } else if (code === 'WELCOME') {
      state.couponDiscount = 200000;
      state.couponCode = code;
      elements.couponFeedback.style.display = 'block';
      elements.couponFeedback.style.color = 'var(--accent-forest)';
      elements.couponFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã áp dụng mã WELCOME (-200.000 ₫)';
    } else if (code === 'LUXURY') {
      state.couponDiscount = 1000000;
      state.couponCode = code;
      elements.couponFeedback.style.display = 'block';
      elements.couponFeedback.style.color = 'var(--accent-forest)';
      elements.couponFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã áp dụng mã VIP LUXURY (-1.000.000 ₫)';
    } else {
      state.couponDiscount = 0;
      elements.couponFeedback.style.display = 'block';
      elements.couponFeedback.style.color = '#dc2626';
      elements.couponFeedback.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Mã không hợp lệ hoặc đã hết hạn!';
    }
    calculateAndRender();
  });

  // 15-Minute Seat Lock Timer
  let secondsRemaining = 15 * 60;
  const countdownEl = document.getElementById('lock-countdown');
  const timerInterval = setInterval(() => {
    if (!document.getElementById('lock-countdown')) {
      clearInterval(timerInterval);
      return;
    }
    secondsRemaining--;
    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      if (countdownEl) countdownEl.textContent = '00:00 (Hết hạn)';
      return;
    }
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    if (countdownEl) {
      countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);

  // --- SUBMIT FORM & RENDER VIETQR PAYMENT CONFIRMATION ---
  const bookingForm = document.getElementById('smart-booking-form');
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = escapeHTML(document.getElementById('book-name').value);
    const phone = escapeHTML(document.getElementById('book-phone').value);
    const email = escapeHTML(document.getElementById('book-email').value);
    const idCard = escapeHTML(document.getElementById('book-id-card').value || 'Chưa cung cấp');
    const notes = escapeHTML(document.getElementById('book-notes').value || 'Không có');

    const bookingRef = 'WT-' + Math.floor(100000 + Math.random() * 900000);
    
    // Deduct seats in inventory store
    const bookedPax = state.adults + state.children + state.toddlers;
    deductSeats(tour.id, state.selectedDate, bookedPax);

    // Calculate final due amount for VietQR
    const currentDetails = getDateDetails(tour.id, state.selectedDate);
    const priceAdultUnit = currentDetails ? currentDetails.priceAdult : tour.priceAdult;
    const priceChildUnit = currentDetails ? currentDetails.priceChild : Math.round(priceAdultUnit * 0.75);
    const priceToddlerUnit = currentDetails ? currentDetails.priceToddler : Math.round(priceAdultUnit * 0.5);
    const priceInfantUnit = currentDetails ? currentDetails.priceInfant : 500000;
    const totalRaw = (state.adults * priceAdultUnit) + (state.children * priceChildUnit) + (state.toddlers * priceToddlerUnit) + (state.infants * priceInfantUnit) + (state.singleRoom ? singleRoomPrice : 0) + (state.addonInsurance ? insurancePrice * (state.adults + state.children + state.toddlers) : 0) + (state.addonPickup ? pickupPrice * (state.adults + state.children + state.toddlers) : 0);
    const totalFinal = Math.max(0, totalRaw - state.couponDiscount);
    const dueAmount = state.payOption === 'deposit' ? Math.round(totalFinal * 0.5) : totalFinal;

    // Generate Dynamic VietQR Image URL (MBBank Napas247 Standard)
    const vietQrUrl = `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${dueAmount}&addInfo=BOOKING%20${bookingRef}&accountName=CONG%20TY%20DU%20LICH%20WEBTRAVEL`;

    // Render Step 2: Payment & E-Ticket Voucher Screen
    modalContent.innerHTML = `
      <div class="booking-success-wrap">
        <div class="success-icon-badge">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <span class="badge badge-emerald" style="font-size: 0.9rem; padding: 0.4rem 1.2rem;">Mã Đơn Tour: ${bookingRef}</span>
        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0.75rem 0 0.3rem;">Đặt Chỗ & Khóa Ghế Thành Công!</h2>
        <p class="text-muted" style="max-width: 600px; margin: 0 auto 0.75rem;">
          Cảm ơn quý khách <strong>${name}</strong>! Chỗ của bạn trên hành trình <strong>${escapeHTML(tour.title)}</strong> đã được giữ chính thức.
        </p>

        <div style="background: #f0fdf4; border: 1px solid var(--accent-emerald); padding: 0.65rem 1.25rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: #047857; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
          <i class="fa-solid fa-user-check"></i>
          <span>Hệ thống đã tự động trừ <strong>${bookedPax} chỗ</strong> cho ngày khởi hành <strong>${state.selectedDate}</strong>.</span>
        </div>

        <!-- Payment Details & Dynamic VietQR Grid -->
        <div class="vietqr-payment-card">
          <div class="vietqr-image-box">
            <img src="${vietQrUrl}" alt="Mã VietQR thanh toán tự động" style="width: 100%; max-width: 240px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; text-align: center;">
              <i class="fa-solid fa-qrcode"></i> Mở app ngân hàng quét mã QR để chuyển khoản tức thì
            </div>
          </div>

          <div class="vietqr-info-box">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; color: #111827; margin-bottom: 0.85rem;">
              <i class="fa-solid fa-building-columns" style="color: var(--accent-emerald);"></i> Thông Tin Chuyển Khoản Ngân Hàng
            </h4>
            <div class="transfer-info-row">
              <span class="t-label">Ngân Hàng Thụ Hưởng:</span>
              <span class="t-val"><strong>MBBank (Ngân Hàng Quân Đội)</strong></span>
            </div>
            <div class="transfer-info-row">
              <span class="t-label">Số Tài Khoản:</span>
              <span class="t-val" style="font-family: monospace; font-size: 1.1rem; color: var(--accent-forest);"><strong>0901 234 567</strong></span>
            </div>
            <div class="transfer-info-row">
              <span class="t-label">Chủ Tài Khoản:</span>
              <span class="t-val"><strong>CONG TY DU LICH WEBTRAVEL</strong></span>
            </div>
            <div class="transfer-info-row">
              <span class="t-label">Số Tiền Thanh Toán:</span>
              <span class="t-val" style="font-size: 1.25rem; font-weight: 800; color: var(--accent-forest);">${formatCurrencyVND(dueAmount)} ${state.payOption === 'deposit' ? '(Đặt cọc 50%)' : '(Trọn gói 100%)'}</span>
            </div>
            <div class="transfer-info-row">
              <span class="t-label">Nội Dung Chuyển Khoản:</span>
              <span class="t-val" style="background: #fef3c7; color: #b45309; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; font-family: monospace;">BOOKING ${bookingRef}</span>
            </div>
          </div>
        </div>

        <!-- E-Ticket Summary Box -->
        <div class="eticket-summary-box">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 0.88rem; text-align: left;">
            <div><strong>Khách hàng:</strong> ${name}</div>
            <div><strong>SĐT / Zalo:</strong> ${phone}</div>
            <div><strong>Ngày khởi hành:</strong> ${state.selectedDate}</div>
            <div><strong>Email nhận vé:</strong> ${email}</div>
            <div><strong>Số khách:</strong> ${state.adults} Người lớn ${state.children > 0 ? `, ${state.children} Trẻ em (5-11t)` : ''} ${state.toddlers > 0 ? `, ${state.toddlers} Trẻ nhỏ (2-4t)` : ''} ${state.infants > 0 ? `, ${state.infants} Em bé (<2t)` : ''}</div>
            <div><strong>Phòng:</strong> ${state.singleRoom ? 'Phòng đơn riêng' : 'Ghép phòng tiêu chuẩn'}</div>
          </div>
        </div>

        <!-- Actions: Print/Download E-Ticket & Back Home -->
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
          <button class="btn-secondary" onclick="window.print()" style="font-weight: 700;">
            <i class="fa-solid fa-print"></i> In Phiếu Xác Nhận / Vé Điện Tử
          </button>
          <button class="btn-primary" onclick="document.getElementById('tour-modal').classList.remove('active')">
            <i class="fa-solid fa-arrow-left"></i> Hoàn Tất & Về Trang Chủ
          </button>
        </div>

      </div>
    `;
  });

  modalOverlay.classList.add('active');
}

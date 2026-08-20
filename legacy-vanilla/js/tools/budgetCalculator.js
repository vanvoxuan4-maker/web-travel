import { formatCurrencyVND, escapeHTML } from '../utils/formatters.js';
import { TOURS_DATA } from '../data/toursData.js';
import { openBookingModal } from './bookingModal.js';

/**
 * Trip Budget Estimator Pro (International Standard Controller)
 * Standards based on Wanderlog, Klook, GetYourGuide & Quanto Custa Viajar
 * 
 * Features:
 * 1. 6 Itemized Cost Categories (Tour, Lodging, Flights, Dining, Shopping/Activities, Contingency)
 * 2. 4-Tier Passenger Calculations (Adults, Children 5-11, Toddlers 2-4, Infants <2)
 * 3. Multi-Currency Instant Converter (VND, USD, JPY, EUR)
 * 4. Interactive Live Stacked Bar Chart with Percentages & Legend
 * 5. Spending Style Quick Presets (Backpacker, Comfort, Luxury)
 * 6. Interactive Range Slider for Shopping & Free-time experiences
 * 7. 10% Risk Contingency Buffer Toggle
 * 8. Copy-to-Clipboard Markdown Summary & Print-friendly Invoice Generator
 */
export function initBudgetCalculator() {
  const tourSelect = document.getElementById('budget-tour-select');
  const hotelSelect = document.getElementById('budget-hotel-select');
  const flightSelect = document.getElementById('budget-flight-select');
  const diningSelect = document.getElementById('budget-dining-select');
  const shoppingRange = document.getElementById('budget-shopping-range');
  const shoppingDisplay = document.getElementById('budget-shopping-display');

  const adultsInput = document.getElementById('budget-adults');
  const childrenInput = document.getElementById('budget-children');
  const toddlersInput = document.getElementById('budget-toddlers');
  const infantsInput = document.getElementById('budget-infants');

  const bufferToggle = document.getElementById('budget-buffer-toggle');
  const singleRoomCheck = document.getElementById('budget-single-room');
  const insuranceCheck = document.getElementById('budget-insurance');
  const tipsCheck = document.getElementById('budget-tips');

  const totalDisplay = document.getElementById('budget-total-price');
  const perPersonDisplay = document.getElementById('budget-per-person');

  const stackedBar = document.getElementById('budget-stacked-bar');
  const chartLegend = document.getElementById('budget-chart-legend');
  const breakdownList = document.getElementById('budget-breakdown-details');
  const contingencyBox = document.getElementById('budget-contingency-box');
  const contingencyAmount = document.getElementById('budget-contingency-amount');
  const totalItemsCount = document.getElementById('budget-total-items-count');

  const copyBtn = document.getElementById('btn-budget-copy');
  const printBtn = document.getElementById('btn-budget-print');
  const bookBtn = document.getElementById('btn-budget-book-now');
  const presetButtons = document.querySelectorAll('.budget-preset-btn');

  if (!tourSelect || !totalDisplay) return;

  // Populate Tour Selector with Rich Meta
  tourSelect.innerHTML = TOURS_DATA.map(t => {
    return `<option value="${t.id}">${escapeHTML(t.shortTitle || t.title)} (${t.durationDays}N${t.durationNights}Đ) - Từ ${formatCurrencyVND(t.priceAdult)}</option>`;
  }).join('');

  // Live Calculation State for Copy/Share
  let currentEstimateSummary = null;

  function calculate() {
    const selectedTourId = tourSelect.value;
    const tour = TOURS_DATA.find(t => t.id === selectedTourId) || TOURS_DATA[0];

    const adults = Math.max(1, parseInt(adultsInput.value) || 1);
    const children = Math.max(0, parseInt(childrenInput.value) || 0);
    const toddlers = Math.max(0, parseInt(toddlersInput ? toddlersInput.value : 0) || 0);
    const infants = Math.max(0, parseInt(infantsInput ? infantsInput.value : 0) || 0);
    const totalPeople = adults + children + toddlers + infants;

    // Pricing formulas for 4 passenger tiers
    const priceAdult = tour.priceAdult || 12290000;
    const priceChild = tour.priceChild || Math.round(priceAdult * 0.75);
    const priceToddler = Math.round(priceAdult * 0.5);
    const priceInfant = 500000;

    // 1. Base Tour Cost
    const costAdults = adults * priceAdult;
    const costChildren = children * priceChild;
    const costToddlers = toddlers * priceToddler;
    const costInfants = infants * priceInfant;
    const baseTourCost = costAdults + costChildren + costToddlers + costInfants;

    // 2. Hotel Upgrade Cost (per night per paying person)
    const star = hotelSelect ? hotelSelect.value : '3';
    let hotelSurchargePerNight = 0;
    if (star === '4') hotelSurchargePerNight = 350000;
    if (star === '5') hotelSurchargePerNight = 850000;
    const nights = tour.durationNights || 3;
    const days = tour.durationDays || (nights + 1);
    const payingPax = adults + children; // Toddlers & Infants share bed
    const hotelUpgradeCost = nights * hotelSurchargePerNight * (payingPax || 1);

    // 3. Flight Surcharge / Discount
    const flightMode = flightSelect ? flightSelect.value : 'standard';
    let flightUnitAdjustment = 0;
    if (flightMode === 'business') flightUnitAdjustment = 4500000;
    if (flightMode === 'none') flightUnitAdjustment = -2500000;
    const flightCost = (flightUnitAdjustment * payingPax);

    // 4. Dining & Street Food Budget
    const diningPerDay = parseInt(diningSelect ? diningSelect.value : 150000) || 0;
    const diningCost = diningPerDay * days * (adults + children);

    // 5. Shopping & Free-time Activities
    const shoppingVal = parseInt(shoppingRange ? shoppingRange.value : 2000000) || 0;
    if (shoppingDisplay) {
      shoppingDisplay.textContent = formatCurrencyVND(shoppingVal);
    }

    // 6. Add-on Services (Single Room, Insurance, Tips)
    const singleRoomCost = (singleRoomCheck && singleRoomCheck.checked) ? (nights * 800000) : 0;
    const insuranceCost = (insuranceCheck && insuranceCheck.checked) ? (totalPeople * 150000) : 0;
    const tipsCost = (tipsCheck && tipsCheck.checked) ? (days * totalPeople * 50000) : 0;
    const addOnsCost = singleRoomCost + insuranceCost + tipsCost;

    // Subtotal before Risk Contingency
    const subtotal = Math.max(0, baseTourCost + hotelUpgradeCost + flightCost + diningCost + shoppingVal + addOnsCost);

    // 7. Contingency Risk Buffer (+10%)
    const hasBuffer = bufferToggle ? bufferToggle.checked : true;
    const contingencyCost = hasBuffer ? Math.round(subtotal * 0.10) : 0;

    // Grand Total
    const grandTotal = subtotal + contingencyCost;
    const avgPerPerson = totalPeople > 0 ? Math.round(grandTotal / totalPeople) : grandTotal;

    // Update KPI Numbers
    totalDisplay.textContent = formatCurrencyVND(grandTotal);
    if (perPersonDisplay) {
      perPersonDisplay.innerHTML = `<i class="fa-solid fa-user-check"></i> Trung bình: ~ <strong>${formatCurrencyVND(avgPerPerson)}</strong> / khách (${totalPeople} người)`;
    }

    // Contingency Box Banner
    if (contingencyBox && contingencyAmount) {
      if (hasBuffer && contingencyCost > 0) {
        contingencyBox.style.display = 'flex';
        contingencyAmount.textContent = formatCurrencyVND(contingencyCost);
      } else {
        contingencyBox.style.display = 'none';
      }
    }

    // 8. Prepare Visual Cost Categories for Chart & Breakdown
    const categories = [
      { id: 'tour', name: 'Vé tour gốc trọn gói', amount: baseTourCost, color: '#059669', icon: 'fa-ticket' },
      { id: 'hotel', name: `Lưu trú (${star}★)`, amount: hotelUpgradeCost, color: '#3b82f6', icon: 'fa-hotel' },
      { id: 'flight', name: 'Vé máy bay & Nâng hạng', amount: Math.max(0, flightCost), color: '#8b5cf6', icon: 'fa-plane-departure' },
      { id: 'dining', name: 'Ẩm thực & Cafe tự do', amount: diningCost, color: '#f59e0b', icon: 'fa-utensils' },
      { id: 'shopping', name: 'Quỹ mua sắm & Trải nghiệm', amount: shoppingVal, color: '#ec4899', icon: 'fa-bag-shopping' },
      { id: 'addons', name: 'Dịch vụ thêm & Bảo hiểm', amount: addOnsCost, color: '#06b6d4', icon: 'fa-shield-halved' },
      { id: 'buffer', name: 'Quỹ dự phòng an toàn (10%)', amount: contingencyCost, color: '#d97706', icon: 'fa-umbrella' }
    ].filter(c => c.amount > 0);

    if (totalItemsCount) {
      totalItemsCount.textContent = `${categories.length} danh mục chi phí`;
    }

    // Render Stacked Bar Chart Segments
    if (stackedBar) {
      stackedBar.innerHTML = categories.map(cat => {
        const pct = ((cat.amount / grandTotal) * 100).toFixed(1);
        return `<div class="budget-bar-segment" style="width: ${pct}%; background-color: ${cat.color};" title="${cat.name}: ${formatCurrencyVND(cat.amount)} (${pct}%)"></div>`;
      }).join('');
    }

    // Render Chart Legend
    if (chartLegend) {
      chartLegend.innerHTML = categories.map(cat => {
        const pct = ((cat.amount / grandTotal) * 100).toFixed(1);
        return `
          <div class="legend-item">
            <span class="legend-color-tag">
              <span class="legend-dot" style="background-color: ${cat.color};"></span>
              ${escapeHTML(cat.name)}
            </span>
            <span class="legend-percent">${pct}%</span>
          </div>
        `;
      }).join('');
    }

    // Render Itemized Breakdown List
    if (breakdownList) {
      const rows = [];

      rows.push(`
        <div class="breakdown-row">
          <span class="breakdown-left"><i class="fa-solid fa-users"></i> Tour gốc (${adults}NL${children ? ` + ${children}TE` : ''}${toddlers ? ` + ${toddlers}TN` : ''}${infants ? ` + ${infants}EB` : ''}):</span>
          <span class="breakdown-val">${formatCurrencyVND(baseTourCost)}</span>
        </div>
      `);

      if (hotelUpgradeCost > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-hotel"></i> Nâng cấp khách sạn ${star}★ (${nights} đêm):</span>
            <span class="breakdown-val">${formatCurrencyVND(hotelUpgradeCost)}</span>
          </div>
        `);
      }

      if (flightCost !== 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-plane"></i> ${flightMode === 'business' ? 'Nâng hạng bay Thương gia VIP' : 'Tự túc vé máy bay'}:</span>
            <span class="breakdown-val">${flightCost > 0 ? '+' : ''}${formatCurrencyVND(flightCost)}</span>
          </div>
        `);
      }

      if (diningCost > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-utensils"></i> Ẩm thực tự do (${days} ngày):</span>
            <span class="breakdown-val">${formatCurrencyVND(diningCost)}</span>
          </div>
        `);
      }

      if (shoppingVal > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-bag-shopping"></i> Quỹ mua sắm đặc sản:</span>
            <span class="breakdown-val">${formatCurrencyVND(shoppingVal)}</span>
          </div>
        `);
      }

      if (singleRoomCost > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-bed"></i> Phụ thu phòng đơn riêng:</span>
            <span class="breakdown-val">${formatCurrencyVND(singleRoomCost)}</span>
          </div>
        `);
      }

      if (insuranceCost > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-shield"></i> Bảo hiểm du lịch (${totalPeople} khách):</span>
            <span class="breakdown-val">${formatCurrencyVND(insuranceCost)}</span>
          </div>
        `);
      }

      if (tipsCost > 0) {
        rows.push(`
          <div class="breakdown-row">
            <span class="breakdown-left"><i class="fa-solid fa-hand-holding-dollar"></i> Tiền tip HDV & Tài xế:</span>
            <span class="breakdown-val">${formatCurrencyVND(tipsCost)}</span>
          </div>
        `);
      }

      if (contingencyCost > 0) {
        rows.push(`
          <div class="breakdown-row" style="color: #b45309; font-weight: 700;">
            <span class="breakdown-left"><i class="fa-solid fa-umbrella" style="color: #d97706;"></i> Quỹ đệm an toàn rủi ro (10%):</span>
            <span class="breakdown-val" style="color: #b45309;">${formatCurrencyVND(contingencyCost)}</span>
          </div>
        `);
      }

      breakdownList.innerHTML = rows.join('');
    }

    // Save summary object for Export / Share
    currentEstimateSummary = {
      tourTitle: tour.title,
      tourCode: tour.code || tour.sku,
      duration: `${tour.durationDays}N${tour.durationNights}Đ`,
      totalPeople,
      adults,
      children,
      toddlers,
      infants,
      grandTotal: formatCurrencyVND(grandTotal),
      avgPerPerson: formatCurrencyVND(avgPerPerson),
      categories
    };
  }

  // Preset Handlers
  presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      presetButtons.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const preset = target.getAttribute('data-preset');

      if (preset === 'budget') {
        if (hotelSelect) hotelSelect.value = '3';
        if (flightSelect) flightSelect.value = 'standard';
        if (diningSelect) diningSelect.value = '0';
        if (shoppingRange) shoppingRange.value = '1000000';
        if (bufferToggle) bufferToggle.checked = false;
        if (singleRoomCheck) singleRoomCheck.checked = false;
        if (insuranceCheck) insuranceCheck.checked = true;
        if (tipsCheck) tipsCheck.checked = false;
      } else if (preset === 'standard') {
        if (hotelSelect) hotelSelect.value = '4';
        if (flightSelect) flightSelect.value = 'standard';
        if (diningSelect) diningSelect.value = '150000';
        if (shoppingRange) shoppingRange.value = '2000000';
        if (bufferToggle) bufferToggle.checked = true;
        if (singleRoomCheck) singleRoomCheck.checked = false;
        if (insuranceCheck) insuranceCheck.checked = true;
        if (tipsCheck) tipsCheck.checked = true;
      } else if (preset === 'luxury') {
        if (hotelSelect) hotelSelect.value = '5';
        if (flightSelect) flightSelect.value = 'business';
        if (diningSelect) diningSelect.value = '350000';
        if (shoppingRange) shoppingRange.value = '6000000';
        if (bufferToggle) bufferToggle.checked = true;
        if (singleRoomCheck) singleRoomCheck.checked = false;
        if (insuranceCheck) insuranceCheck.checked = true;
        if (tipsCheck) tipsCheck.checked = true;
      }

      calculate();
    });
  });

  // Action: Copy Markdown Report to Clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!currentEstimateSummary) return;

      const reportText = `📋 BẢNG DỰ TOÁN CHI PHÍ DU LỊCH - WEBTRAVEL PRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Hành trình: ${currentEstimateSummary.tourTitle}
⏳ Thời lượng: ${currentEstimateSummary.duration}
👥 Số lượng khách: ${currentEstimateSummary.totalPeople} người (${currentEstimateSummary.adults} Lớn, ${currentEstimateSummary.children} Trẻ em, ${currentEstimateSummary.toddlers} Trẻ nhỏ, ${currentEstimateSummary.infants} Em bé)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 TỔNG CHI PHÍ DỰ KIẾN: ${currentEstimateSummary.grandTotal}
👤 Chi phí trung bình: ~ ${currentEstimateSummary.avgPerPerson} / khách

📊 CHI TIẾT TỪNG HẠNG MỤC:
${currentEstimateSummary.categories.map(c => `• ${c.name}: ${formatCurrencyVND(c.amount)}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Bảng dự toán được tạo tự động bởi WebTravel Editorial System.`;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(reportText);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = reportText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #059669;"></i> Đã Sao Chép!';
        copyBtn.style.borderColor = '#059669';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.borderColor = '';
        }, 2200);
      } catch (err) {
        console.error('Copy failed:', err);
        alert('Không thể tự động sao chép. Bạn có thể in bản dự toán này thay thế.');
      }
    });
  }

  // Action: Print Invoice
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Action: Book Now from Estimate
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      const selectedTourId = tourSelect.value;
      if (typeof openBookingModal === 'function') {
        openBookingModal(selectedTourId);
      } else {
        window.location.href = `tour-detail.html?id=${encodeURIComponent(selectedTourId)}`;
      }
    });
  }

  // Attach Event Listeners on all interactive inputs
  const allInputs = [
    tourSelect, hotelSelect, flightSelect, diningSelect, shoppingRange,
    adultsInput, childrenInput, toddlersInput, infantsInput,
    bufferToggle, singleRoomCheck, insuranceCheck, tipsCheck
  ];

  allInputs.forEach(el => {
    if (el) {
      el.addEventListener('change', calculate);
      el.addEventListener('input', calculate);
    }
  });

  // Initial Calculation on load
  calculate();
}

import { TOURS_DATA } from './data/toursData.js';
import { formatCurrencyVND, debounce, escapeHTML } from './utils/formatters.js';
import { initBudgetCalculator } from './tools/budgetCalculator.js';
import { initCustomBuilder } from './tools/customBuilder.js';
import { initCurrencyConverter } from './tools/currencyConverter.js';
import { initPackingList } from './tools/packingList.js';
import { openBookingModal } from './tools/bookingModal.js';
import { initHeroSlider } from './components/heroSlider.js';

/**
 * Main Application Controller - Emerald Green & Pure White Theme
 * Professional Travel Metadata, Star Rating Filters, LEI/ESG Ratings & Inclusions Transparency
 */
function initMainApp() {
  const toursContainer = document.getElementById('tours-container');
  const searchInput = document.getElementById('search-keyword');
  const departureSelect = document.getElementById('search-departure');
  const categorySelect = document.getElementById('search-category');
  const productTierSelect = document.getElementById('search-product-tier');
  const btnSearch = document.getElementById('btn-search');
  
  const filterTabs = document.getElementById('filter-tabs');
  const savedCountBadge = document.getElementById('saved-count');

  const tourModal = document.getElementById('tour-modal');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalContent = document.getElementById('modal-content');

  let currentCategoryFilter = 'all';
  let currentTierFilter = 'all';
  let savedTours = JSON.parse(localStorage.getItem('webtravel_saved_tours') || '[]');

  updateSavedCount();

  // --- RENDER BENTO GRID CARDS (VIETRAVEL-STYLE METADATA) ---
  function renderTours(tours) {
    if (!toursContainer) return;

    if (tours.length === 0) {
      toursContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: var(--text-muted);">
          <i class="fa-solid fa-compass" style="font-size: 3rem; margin-bottom: 1rem; color: var(--glass-border-hover);"></i>
          <h3 style="font-family: var(--font-heading);">Không tìm thấy tour phù hợp</h3>
          <p>Rất tiếc, không có kết quả phù hợp với bộ lọc của bạn. Hãy thử chọn lại tiêu chí tìm kiếm khác!</p>
        </div>
      `;
      return;
    }

    toursContainer.innerHTML = tours.map((tour, index) => {
      const isHero = index === 0;
      const isLowSeat = tour.seatsLeft <= 3;

      return `
        <div class="tour-card-bento ${isHero ? 'bento-hero' : ''}" data-id="${tour.id}">
          <a href="tour-detail.html?id=${tour.id}" class="card-img-wrap" style="display: block; text-decoration: none;" title="Xem chi tiết hành trình ${escapeHTML(tour.title)}">
            <div style="position: absolute; top: 1rem; left: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; z-index: 2;">
              <span class="badge ${tour.tier === 'luxury' ? 'badge-gold' : 'badge-emerald'}">
                <i class="fa-solid fa-crown"></i> ${tour.tierName || (tour.category === 'domestic' ? 'Dòng Tiêu Chuẩn' : 'Quốc Tế')}
              </span>
              <span class="badge" style="background: rgba(17, 24, 39, 0.82); color: #ffffff; backdrop-filter: blur(4px);">
                <i class="fa-solid fa-hotel" style="color: #f59e0b;"></i> ${tour.hotelTier || `${tour.starRating}★ Hotel`}
              </span>
            </div>

            ${isLowSeat ? `
              <span class="badge" style="position: absolute; bottom: 1rem; left: 1rem; background: #ef4444; color: #ffffff; font-weight: 700; z-index: 2;">
                🔥 Chỉ còn ${tour.seatsLeft} chỗ
              </span>
            ` : ''}

            <img src="${tour.image}" alt="${escapeHTML(tour.title)}" loading="lazy">
          </a>

          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">
              <span><i class="fa-solid fa-barcode"></i> Mã: <strong>${tour.code}</strong></span>
              <span><i class="fa-solid fa-plane-departure" style="color: var(--accent-emerald);"></i> Đi từ: <strong>${tour.departureFrom}</strong></span>
            </div>

            <div class="tour-dest"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(tour.destination)}</div>
            <h3 class="tour-title">
              <a href="tour-detail.html?id=${tour.id}" style="color: inherit; text-decoration: none;" title="${escapeHTML(tour.title)}">
                ${escapeHTML(tour.title)}
              </a>
            </h3>

            <div class="tour-meta" style="margin: 0.6rem 0 1rem;">
              <span><i class="fa-regular fa-clock"></i> ${tour.durationDays}N${tour.durationNights}Đ</span>
              <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${tour.rating} (${tour.reviewsCount} đánh giá)</span>
              <span><i class="fa-regular fa-calendar-check"></i> ${tour.departureSchedule}</span>
            </div>

            <div class="card-footer">
              <div class="tour-price-box">
                <span class="unit">Giá trọn gói / người</span>
                <span class="price">${formatCurrencyVND(tour.priceAdult)}</span>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <a href="tour-detail.html?id=${tour.id}" class="btn-secondary btn-detail" title="Xem Chi Tiết Hành Trình">
                  <i class="fa-solid fa-book-open"></i> Chi Tiết
                </a>
                <button class="btn-primary btn-book-quick" data-id="${tour.id}">
                  Đặt Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    attachCardEvents();
  }

  // --- ATTACH CARD BUTTON EVENTS ---
  function attachCardEvents() {
    document.querySelectorAll('.btn-book-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openBookingModal(id);
      });
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => tourModal.classList.remove('active'));
  }
  if (tourModal) {
    tourModal.addEventListener('click', (e) => {
      if (e.target === tourModal) tourModal.classList.remove('active');
    });
  }

  // --- MULTI-FIELD SEARCH & PRODUCT TIER FILTER ENGINE ---
  function filterTours() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const departure = departureSelect ? departureSelect.value : 'all';
    const cat = categorySelect ? categorySelect.value : 'all';
    const tierVal = productTierSelect ? productTierSelect.value : 'all';

    const filtered = TOURS_DATA.filter(t => {
      const matchKeyword = !keyword || t.title.toLowerCase().includes(keyword) || t.destination.toLowerCase().includes(keyword);
      const matchDeparture = (departure === 'all') || (t.departureFrom.includes(departure));
      const matchCategory = (currentCategoryFilter === 'all' && cat === 'all') ||
                            (currentCategoryFilter !== 'all' && t.category === currentCategoryFilter) ||
                            (cat !== 'all' && t.category === cat);
      const matchTier = (currentTierFilter === 'all' && tierVal === 'all') ||
                        (currentTierFilter !== 'all' && t.tier === currentTierFilter) ||
                        (tierVal !== 'all' && t.tier === tierVal);

      return matchKeyword && matchDeparture && matchCategory && matchTier;
    });

    renderTours(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', debounce(filterTours, 300));
  if (departureSelect) departureSelect.addEventListener('change', filterTours);
  if (categorySelect) categorySelect.addEventListener('change', filterTours);
  if (productTierSelect) productTierSelect.addEventListener('change', filterTours);
  if (btnSearch) btnSearch.addEventListener('click', filterTours);

  // Filter Tabs (Domestic / International)
  if (filterTabs) {
    filterTabs.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterTabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategoryFilter = e.target.getAttribute('data-filter');
        filterTours();
      });
    });
  }

  // Product Tier Filter Pills Bar
  document.querySelectorAll('.filter-star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-star-btn').forEach(b => {
        b.classList.remove('active');
      });
      e.currentTarget.classList.add('active');

      currentTierFilter = e.currentTarget.getAttribute('data-tier') || 'all';
      if (productTierSelect) productTierSelect.value = currentTierFilter;
      filterTours();
    });
  });

  // --- TOOL TABS SWAPPER ---
  const toolTabs = document.getElementById('tool-tabs');
  if (toolTabs) {
    toolTabs.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        toolTabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const targetTool = e.currentTarget.getAttribute('data-tool');

        document.querySelectorAll('.tool-content-panel').forEach(panel => panel.style.display = 'none');
        const activePanel = document.getElementById(`tool-panel-${targetTool}`);
        if (activePanel) activePanel.style.display = 'block';
      });
    });
  }

  function updateSavedCount() {
    if (savedCountBadge) savedCountBadge.textContent = savedTours.length;
  }

  // Initial Render & Initialize Tools
  renderTours(TOURS_DATA);
  initHeroSlider();
  initBudgetCalculator();
  initCustomBuilder();
  initCurrencyConverter();
  initPackingList();
}

// Ensure execution whether DOM is loading or already parsed
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMainApp);
  } else {
    initMainApp();
  }
}

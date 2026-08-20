/** itineraryTimeline.js - Itinerary timeline popup modal. */
import { escapeHTML } from "../utils/formatters.js";
export function initItineraryTimeline(tour) {
  // 6. Render & Bind Itinerary Detail Popup Modal (Screenshot 2)
  const itineraryModal = document.getElementById('itinerary-modal');
  const itineraryModalContent = document.getElementById('itinerary-modal-content');
  const itineraryModalClose = document.getElementById('itinerary-modal-close');
  const itineraryModalContainer = document.getElementById('itinerary-modal-container');

  if (itineraryModalContent) {
    itineraryModalContent.innerHTML = `
      <div class="itinerary-timeline-track">
        <div class="itinerary-timeline-line"></div>
        ${(tour.itinerary || []).map((dayItem) => `
          <div class="itinerary-day-section-block" id="itinerary-modal-day-${dayItem.day}">
            <div class="itinerary-pin-icon">
              <i class="fa-solid fa-location-dot"></i>
            </div>

            <!-- Top Box with Day, Title, Meals, and Right Thumbnail Image -->
            <div class="itinerary-day-top-box">
              <div class="itinerary-day-top-content">
                <div class="itinerary-day-highlight-title">Ngày ${dayItem.day}</div>
                <div class="itinerary-day-route-text">${escapeHTML(dayItem.title)}</div>
                <div class="itinerary-row-meals">
                  <i class="fa-solid fa-utensils" style="color: #0284c7;"></i> ${escapeHTML(dayItem.meals || 'Ăn sáng, trưa, tối')}
                </div>
              </div>
              ${dayItem.image ? `
                <img class="itinerary-day-top-img" src="${dayItem.image}" alt="${escapeHTML(dayItem.title)}">
              ` : ''}
            </div>

            <!-- Bottom Box with Main Activity & Detailed Bullet Points -->
            <div class="itinerary-day-bottom-box">
              <div class="itinerary-main-activity-label">
                Hoạt động chính: ${escapeHTML(dayItem.mainActivity || 'Tham quan và khám phá')}
              </div>
              <ul class="itinerary-bullet-points-list">
                ${(dayItem.bulletPoints || [
                  dayItem.morning || '',
                  dayItem.afternoon || '',
                  dayItem.evening || ''
                ].filter(Boolean)).map(bp => `
                  <li>${bp}</li>
                `).join('')}
              </ul>

              ${dayItem.photos && dayItem.photos.length > 0 ? `
                <div style="margin-top: 1rem; border-top: 1px dashed #e2e8f0; padding-top: 0.85rem;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem;">
                    <i class="fa-solid fa-camera" style="color: var(--accent-emerald);"></i> Hình ảnh thực tế các điểm đến trong ngày:
                  </div>
                  <div class="itinerary-day-photos-grid">
                    ${dayItem.photos.map(photo => `
                      <div class="itinerary-day-photo-item">
                        <img src="${photo.url}" alt="${escapeHTML(photo.caption || dayItem.title)}">
                        <div class="itinerary-day-photo-caption">${escapeHTML(photo.caption || dayItem.title)}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Bind Itinerary Preview Row Click Handlers
  document.querySelectorAll('.itinerary-preview-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const day = e.currentTarget.getAttribute('data-day');
      if (itineraryModal) {
        itineraryModal.classList.add('active');
        const targetDayEl = document.getElementById(`itinerary-modal-day-${day}`);
        if (targetDayEl && itineraryModalContainer) {
          setTimeout(() => {
            targetDayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    });
  });
}

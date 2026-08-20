import { formatCurrencyVND } from '../utils/formatters.js';

/**
 * Custom Tour Builder Wizard Controller
 */
export function initCustomBuilder() {
  const wizardForm = document.getElementById('custom-builder-form');
  const resultContainer = document.getElementById('custom-builder-result');

  if (!wizardForm || !resultContainer) return;

  wizardForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const destination = document.getElementById('builder-dest').value;
    const days = parseInt(document.getElementById('builder-days').value) || 3;
    const style = document.getElementById('builder-style').value;
    const budgetTier = document.getElementById('builder-budget').value;

    let estimatedPrice = days * (budgetTier === 'luxury' ? 2500000 : budgetTier === 'standard' ? 1200000 : 700000);

    const generatedItinerary = [];
    for (let i = 1; i <= days; i++) {
      if (i === 1) {
        generatedItinerary.push({ day: 1, title: `Khởi hành & Check-in tại ${destination}`, desc: `Đón khách tại điểm hẹn, di chuyển đến ${destination}. Nhận phòng khách sạn, tự do dạo phố và thưởng thức ẩm thực địa phương.` });
      } else if (i === days) {
        generatedItinerary.push({ day: days, title: `Mua sắm đặc sản & Khởi hành về`, desc: `Thưởng thức cà phê sáng, mua quà lưu niệm đặc sản. Trả phòng khách sạn và khởi hành trở về.` });
      } else {
        generatedItinerary.push({ day: i, title: `Khám phá các điểm đến nổi tiếng (${style})`, desc: `Tham quan các danh lam thắng cảnh tiêu biểu theo phong cách ${style}, trải nghiệm ẩm thực địa phương và chụp ảnh lưu niệm.` });
      }
    }

    resultContainer.innerHTML = `
      <div class="custom-tour-card glass-panel">
        <div class="custom-header">
          <div>
            <span class="badge badge-gold">Tour Cá Nhân Hóa</span>
            <h3>Hành trình ${destination} (${days} Ngày ${days - 1} Đêm)</h3>
            <p class="text-muted">Phong cách: <strong>${style}</strong> | Phân khúc: <strong>${budgetTier.toUpperCase()}</strong></p>
          </div>
          <div class="custom-price">
            <span class="price-val">${formatCurrencyVND(estimatedPrice)}</span>
            <small>/ người (Dự kiến)</small>
          </div>
        </div>

        <div class="custom-itinerary-preview">
          <h4><i class="fa-solid fa-list-check"></i> Lịch trình gợi ý tự động:</h4>
          ${generatedItinerary.map(item => `
            <div class="itinerary-step">
              <span class="step-day">Ngày ${item.day}</span>
              <div class="step-desc">
                <strong>${item.title}</strong>
                <p>${item.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn-primary w-full mt-4" onclick="alert('Đã gửi yêu cầu tư vấn tour thiết kế riêng thành công!')">
          <i class="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu Tư Vấn Tour Này
        </button>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth' });
  });
}

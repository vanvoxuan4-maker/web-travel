/**
 * Smart Packing Checklist Tool Controller
 * Features full suggestions for Domestic Beach, Mountain Trekking, International Travel & Family Trips
 */

import { escapeHTML } from '../utils/formatters.js';

const DEFAULT_PACKING_ITEMS = {
  general: [
    { id: 'g1', text: 'CCCD / Hộ chiếu (Passport) bản gốc', category: 'Giấy tờ', checked: true },
    { id: 'g2', text: 'Sạc dự phòng & Dây cáp điện thoại', category: 'Thiết bị', checked: true },
    { id: 'g3', text: 'Tiền mặt & Thẻ ngân hàng (Visa/Mastercard)', category: 'Giấy tờ', checked: true },
    { id: 'g4', text: 'Bàn chải, kem đánh răng & Đồ vệ sinh cá nhân', category: 'Vệ sinh', checked: false },
    { id: 'g5', text: 'Bình nước cá nhân & Khẩu trang y tế', category: 'Y tế & Tiện ích', checked: false }
  ],
  beach: [
    { id: 'b1', text: 'Đồ bơi (Bikini / Quần bơi) & Khăn tắm biển', category: 'Trang phục', checked: true },
    { id: 'b2', text: 'Kem chống nắng toàn thân SPF 50+ & Xịt khoáng', category: 'Mỹ phẩm', checked: true },
    { id: 'b3', text: 'Kính râm chống tia UV & Mũ nón rộng vành', category: 'Phụ kiện', checked: false },
    { id: 'b4', text: 'Túi chống nước điện thoại & Túi khô đi biển', category: 'Thiết bị', checked: true },
    { id: 'b5', text: 'Dép xỏ ngón / Sandal đi biển chống trượt', category: 'Trang phục', checked: false },
    { id: 'b6', text: 'Váy maxi / Áo hoa biển chụp hình check-in', category: 'Trang phục', checked: false },
    { id: 'b7', text: 'Gel nha đam dưỡng dịu da sau khi tắm nắng', category: 'Mỹ phẩm', checked: false }
  ],
  mountain: [
    { id: 'm1', text: 'Giày trekking / Thể thao có độ bám chống trượt tốt', category: 'Trang phục', checked: true },
    { id: 'm2', text: 'Áo khoác gió chống nước (Gore-Tex) & Áo ấm', category: 'Trang phục', checked: true },
    { id: 'm3', text: 'Xịt chống côn trùng, muỗi & Vắt rừng', category: 'Y tế', checked: true },
    { id: 'm4', text: 'Băng cá nhân, gạc y tế & Thuốc cảm hạ sốt', category: 'Y tế', checked: true },
    { id: 'm5', text: 'Bình giữ nhiệt nước nóng & Đèn pin du lịch', category: 'Phụ kiện', checked: false },
    { id: 'm6', text: 'Găng tay giữ ấm & Khăn choàng cổ', category: 'Trang phục', checked: false },
    { id: 'm7', text: 'Balo chống nước có đai trợ lực', category: 'Phụ kiện', checked: false }
  ],
  international: [
    { id: 'i1', text: 'Hộ chiếu còn hạn > 6 tháng & Bản in Visa / e-Visa', category: 'Giấy tờ', checked: true },
    { id: 'i2', text: 'SIM 4G du lịch quốc tế / eSIM hoặc Bộ phát Wifi', category: 'Thiết bị', checked: true },
    { id: 'i3', text: 'Củ sạc chuyển đổi chân cắm đa năng (Universal Adapter)', category: 'Thiết bị', checked: true },
    { id: 'i4', text: 'Tiền mặt ngoại tệ (USD/JPY/THB/EUR) đã đổi sẵn', category: 'Giấy tờ', checked: true },
    { id: 'i5', text: 'Vé máy bay khứ hồi & Booking phòng khách sạn (in giấy)', category: 'Giấy tờ', checked: true },
    { id: 'i6', text: 'Bút mực mang theo để điền tờ khai hải quan trên máy bay', category: 'Tiện ích', checked: false },
    { id: 'i7', text: 'Túi đeo ngực bảo mật chống móc túi & Khóa vali TSA', category: 'Phụ kiện', checked: true },
    { id: 'i8', text: 'Thuốc tiêu hóa, say xe & Đơn thuốc điều trị cá nhân', category: 'Y tế', checked: false }
  ],
  family: [
    { id: 'f1', text: 'Sữa công thức, bình sữa & Khăn ướt tiệt trùng cho bé', category: 'Trẻ em', checked: true },
    { id: 'f2', text: 'Xe đẩy du lịch siêu nhẹ gấp gọn mang lên cabin máy bay', category: 'Trẻ em', checked: true },
    { id: 'f3', text: 'Nhiệt kế điện tử, siro hạ sốt & Thuốc dị ứng trẻ em', category: 'Y tế', checked: true },
    { id: 'f4', text: 'Bộ quần áo dự phòng cho bé trong balo xách tay', category: 'Trẻ em', checked: true },
    { id: 'f5', text: 'Đồ chơi gặm nướu / Truyện tranh dỗ bé trên máy bay', category: 'Trẻ em', checked: false },
    { id: 'f6', text: 'Thuốc huyết áp & Đơn thuốc quen thuộc của người cao tuổi', category: 'Y tế', checked: true },
    { id: 'f7', text: 'Ô/dù che nắng mưa gấp gọn & Áo mưa tiện lợi', category: 'Phụ kiện', checked: false }
  ]
};

export function initPackingList() {
  const container = document.getElementById('packing-items-list');
  const progressBar = document.getElementById('packing-progress-bar');
  const progressText = document.getElementById('packing-progress-text');
  const typeSelect = document.getElementById('packing-type-select');
  const resetBtn = document.getElementById('btn-reset-packing');

  if (!container || !progressBar) return;

  let currentCategory = typeSelect ? typeSelect.value : 'beach';
  let items = loadState(currentCategory);

  function loadState(cat) {
    const saved = localStorage.getItem(`webtravel_packing_v3_${cat}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return getDefaultItems(cat);
  }

  function getDefaultItems(cat) {
    const specific = DEFAULT_PACKING_ITEMS[cat] || DEFAULT_PACKING_ITEMS.beach;
    return [...DEFAULT_PACKING_ITEMS.general, ...specific];
  }

  function saveState() {
    localStorage.setItem(`webtravel_packing_v3_${currentCategory}`, JSON.stringify(items));
  }

  function render() {
    const total = items.length;
    const checkedCount = items.filter(i => i.checked).length;
    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${checkedCount}/${total} món (${percent}%)`;

    container.innerHTML = items.map(item => `
      <label class="packing-item-label ${item.checked ? 'checked' : ''}">
        <input type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
        <span class="custom-checkbox"><i class="fa-solid fa-check"></i></span>
        <span class="item-text">${escapeHTML(item.text)}</span>
        <span class="item-tag">${escapeHTML(item.category)}</span>
      </label>
    `).join('');

    // Attach Event Listeners to Checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const targetItem = items.find(i => i.id === id);
        if (targetItem) {
          targetItem.checked = e.target.checked;
          saveState();
          render();
        }
      });
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      items = loadState(currentCategory);
      render();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(`webtravel_packing_${currentCategory}`);
      items = getDefaultItems(currentCategory);
      saveState();
      render();

      const originalHTML = resetBtn.innerHTML;
      resetBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #059669;"></i> Đã Khôi Phục!';
      setTimeout(() => {
        resetBtn.innerHTML = originalHTML;
      }, 1500);
    });
  }

  render();
}

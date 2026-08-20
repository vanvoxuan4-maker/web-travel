import React, { useState, useMemo } from 'react';

interface PackingItem {
  id: string;
  text: string;
  category: string;
  checked: boolean;
}

const DEFAULT_PACKING_ITEMS: Record<string, PackingItem[]> = {
  beach: [
    // --- THIẾT YẾU BẮT BUỘC (Pre-checked) ---
    { id: 'b1', text: 'CCCD / Hộ chiếu (Passport) bản gốc', category: 'Giấy tờ', checked: true },
    { id: 'b2', text: 'Tiền mặt & Thẻ ATM / Thẻ tín dụng', category: 'Tài chính', checked: true },
    { id: 'b3', text: 'Đồ bơi / Bikini & Khăn tắm biển lớn', category: 'Trang phục', checked: true },
    { id: 'b4', text: 'Kem chống nắng SPF 50+ chống trôi nước', category: 'Mỹ phẩm', checked: true },
    { id: 'b5', text: 'Điện thoại, Củ sạc & Cáp sạc pin', category: 'Thiết bị', checked: true },
    { id: 'b6', text: 'Thuốc say tàu xe, say sóng & Men tiêu hóa', category: 'Y tế', checked: true },
    { id: 'b7', text: 'Bàn chải, kem đánh răng & Đồ vệ sinh cá nhân', category: 'Cá nhân', checked: true },

    // --- GỢI Ý BỔ SUNG (Unchecked) ---
    { id: 'b8', text: 'Túi chống nước điện thoại khi tắm biển', category: 'Thiết bị', checked: false },
    { id: 'b9', text: 'Kính râm chống tia UV & Mũ nón rộng vành', category: 'Phụ kiện', checked: false },
    { id: 'b10', text: 'Dép sandal / Dép xỏ ngón đi biển chống trượt', category: 'Trang phục', checked: false },
    { id: 'b11', text: 'Xịt khoáng & Gel lô hội làm dịu da cháy nắng', category: 'Mỹ phẩm', checked: false },
    { id: 'b12', text: 'Sạc dự phòng dung lượng lớn', category: 'Thiết bị', checked: false },
    { id: 'b13', text: 'Kính bơi / Kính lặn ống thở cá nhân', category: 'Phụ kiện', checked: false },
    { id: 'b14', text: 'Túi khô chống ướt / Túi tote đi biển', category: 'Phụ kiện', checked: false },
    { id: 'b15', text: 'Băng dán cá nhân & Nước muối sinh lý nhỏ mắt', category: 'Y tế', checked: false }
  ],

  mountain: [
    // --- THIẾT YẾU BẮT BUỘC (Pre-checked) ---
    { id: 'm1', text: 'CCCD / Hộ chiếu (Passport) bản gốc', category: 'Giấy tờ', checked: true },
    { id: 'm2', text: 'Tiền mặt & Thẻ ATM', category: 'Tài chính', checked: true },
    { id: 'm3', text: 'Giày trekking / thể thao chuyên dụng đế bám gai', category: 'Trang phục', checked: true },
    { id: 'm4', text: 'Áo khoác gió chống thấm nước & Áo giữ nhiệt', category: 'Trang phục', checked: true },
    { id: 'm5', text: 'Xịt chống muỗi, côn trùng & Vắt rừng', category: 'Y tế', checked: true },
    { id: 'm6', text: 'Hộp y tế: Băng gạc, salonpas & Thuốc cảm sốt', category: 'Y tế', checked: true },
    { id: 'm7', text: 'Điện thoại, Củ sạc & Cáp sạc pin', category: 'Thiết bị', checked: true },
    { id: 'm8', text: 'Bàn chải, khăn mặt & Đồ vệ sinh cá nhân', category: 'Cá nhân', checked: true },

    // --- GỢI Ý BỔ SUNG (Unchecked) ---
    { id: 'm9', text: 'Áo mưa bộ chuyên dụng chống rách khi đi rừng', category: 'Trang phục', checked: false },
    { id: 'm10', text: 'Gậy leo núi (Trekking Pole) trợ lực dốc', category: 'Phụ kiện', checked: false },
    { id: 'm11', text: 'Balo trợ lực chống nước 20L - 30L', category: 'Phụ kiện', checked: false },
    { id: 'm12', text: 'Bình giữ nhiệt nước nóng & Đèn pin chiếu sáng', category: 'Thiết bị', checked: false },
    { id: 'm13', text: 'Tất thể thao dày cao cổ & Găng tay giữ ấm', category: 'Trang phục', checked: false },
    { id: 'm14', text: 'Lương khô, thanh socola năng lượng & Kẹo gừng', category: 'Thực phẩm', checked: false },
    { id: 'm15', text: 'Miếng dán giữ nhiệt & Son dưỡng môi chống nẻ', category: 'Cá nhân', checked: false },
    { id: 'm16', text: 'Sạc dự phòng dung lượng cao', category: 'Thiết bị', checked: false }
  ],

  international: [
    // --- THIẾT YẾU BẮT BUỘC (Pre-checked) ---
    { id: 'i1', text: 'Hộ chiếu (Passport) bản gốc còn hạn trên 6 tháng', category: 'Giấy tờ', checked: true },
    { id: 'i2', text: 'Visa / E-visa bản in & Giấy xác nhận nhập cảnh', category: 'Giấy tờ', checked: true },
    { id: 'i3', text: 'Tiền mặt ngoại tệ (USD/JPY/EUR...) & Thẻ Visa/Mastercard', category: 'Tài chính', checked: true },
    { id: 'i4', text: 'Vé máy bay khứ hồi & Xác nhận đặt phòng khách sạn', category: 'Giấy tờ', checked: true },
    { id: 'i5', text: 'SIM 4G du lịch quốc tế / eSIM đã kích hoạt', category: 'Thiết bị', checked: true },
    { id: 'i6', text: 'Củ sạc chuyển đổi chân cắm Universal Adapter đa năng', category: 'Thiết bị', checked: true },
    { id: 'i7', text: 'Điện thoại, Củ sạc & Cáp sạc pin', category: 'Thiết bị', checked: true },
    { id: 'i8', text: 'Đơn thuốc đặc trị cá nhân & Thuốc cảm cúm, tiêu chảy', category: 'Y tế', checked: true },
    { id: 'i9', text: 'Bộ chiết mỹ phẩm du lịch (Dung tích dưới 100ml)', category: 'Cá nhân', checked: true },

    // --- GỢI Ý BỔ SUNG (Unchecked) ---
    { id: 'i10', text: 'Cân hành lý điện tử mini chống quá cước cân ký', category: 'Thiết bị', checked: false },
    { id: 'i11', text: 'Gối chữ U đỡ cổ & Bịt mắt khi bay chặng dài', category: 'Phụ kiện', checked: false },
    { id: 'i12', text: 'Túi đeo ngực / thắt lưng chống trộm hộ chiếu & tiền', category: 'Phụ kiện', checked: false },
    { id: 'i13', text: 'Bút bi để điền tờ khai xuất nhập cảnh trên máy bay', category: 'Cá nhân', checked: false },
    { id: 'i14', text: 'Bình xịt cồn khử khuẩn & Khăn ướt kháng khuẩn', category: 'Y tế', checked: false },
    { id: 'i15', text: 'Khóa vali số chuẩn an ninh quốc tế TSA', category: 'Phụ kiện', checked: false },
    { id: 'i16', text: 'Sạc dự phòng (Lưu ý để trong hành lý xách tay)', category: 'Thiết bị', checked: false }
  ],

  family: [
    // --- THIẾT YẾU BẮT BUỘC (Pre-checked) ---
    { id: 'f1', text: 'CCCD người lớn & Giấy khai sinh bản gốc / trích lục cho trẻ em', category: 'Giấy tờ', checked: true },
    { id: 'f2', text: 'Tiền mặt & Thẻ thanh toán', category: 'Tài chính', checked: true },
    { id: 'f3', text: 'Thuốc đặc trị người cao tuổi (Huyết áp, tim mạch, khớp)', category: 'Y tế', checked: true },
    { id: 'f4', text: 'Nhiệt kế điện tử, Siro hạ sốt & Men vi sinh cho bé', category: 'Y tế', checked: true },
    { id: 'f5', text: 'Sữa bột / sữa tươi, bình sữa & Nước rửa bình cho bé', category: 'Trẻ em', checked: true },
    { id: 'f6', text: 'Điện thoại, Củ sạc & Cáp sạc pin cho gia đình', category: 'Thiết bị', checked: true },
    { id: 'f7', text: 'Đồ vệ sinh cá nhân cho cả gia đình', category: 'Cá nhân', checked: true },

    // --- GỢI Ý BỔ SUNG (Unchecked) ---
    { id: 'f8', text: 'Xe đẩy du lịch siêu nhẹ gấp gọn mang lên cabin máy bay', category: 'Trẻ em', checked: false },
    { id: 'f9', text: 'Bỉm / Tã dán & 3-4 bộ quần áo dự phòng cho bé', category: 'Trẻ em', checked: false },
    { id: 'f10', text: 'Bình giữ nhiệt pha sữa di động & Hộp ủ cháo', category: 'Trẻ em', checked: false },
    { id: 'f11', text: 'Dầu gió, cao xoa bóp giảm đau nhức cho ông bà', category: 'Y tế', checked: false },
    { id: 'f12', text: 'Đồ chơi nhỏ yêu thích hoặc máy tính bảng/sách tranh dỗ bé', category: 'Trẻ em', checked: false },
    { id: 'f13', text: 'Khăn choàng cổ mỏng chống lạnh điều hòa xe/máy bay', category: 'Trang phục', checked: false },
    { id: 'f14', text: 'Khăn ướt tiệt trùng & Nước muối sinh lý nhỏ mắt/mũi', category: 'Y tế', checked: false },
    { id: 'f15', text: 'Xịt chống muỗi hữu cơ dịu nhẹ an toàn cho da em bé', category: 'Y tế', checked: false }
  ]
};

export const PackingList: React.FC = () => {
  const [tripType, setTripType] = useState('beach');
  const [items, setItems] = useState<PackingItem[]>(DEFAULT_PACKING_ITEMS.beach);

  const handleTypeChange = (type: string) => {
    setTripType(type);
    setItems(DEFAULT_PACKING_ITEMS[type] || DEFAULT_PACKING_ITEMS.beach);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(it => it.id === id ? { ...it, checked: !it.checked } : it));
  };

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const checkedCount = items.filter(it => it.checked).length;
    return Math.round((checkedCount / items.length) * 100);
  }, [items]);

  return (
    <div className="tool-content-panel" id="tool-panel-packing" style={{ display: 'block' }}>
      {/* Header Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#111827', margin: '0 0 0.2rem' }}>
            <i className="fa-solid fa-suitcase-rolling" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Gợi Ý Checklist Hành Lý Du Lịch
          </h3>
          <p className="text-muted" style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Tự động lọc danh mục vật phẩm thông minh theo đặc thù từng loại hình chuyến đi
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            id="packing-type-select"
            value={tripType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{ fontWeight: 700, color: 'var(--accent-forest)', background: '#f0fdf4', border: '1.5px solid rgba(5, 150, 105, 0.3)', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.92rem' }}
          >
            <option value="beach">🏖️ Du Lịch Biển & Đảo (Phú Quốc, Nha Trang, Hạ Long)</option>
            <option value="mountain">🏔️ Leo Núi & Khám Phá (Sapa, Fansipan, Tây Bắc)</option>
            <option value="international">✈️ Du Lịch Quốc Tế (Nhật Bản, Thái Lan, Châu Âu)</option>
            <option value="family">👨‍👩‍👧‍👦 Du Lịch Nghỉ Dưỡng Gia Đình (Trẻ Nhỏ & Người Lớn Tuổi)</option>
          </select>

          <button
            type="button"
            className="btn-secondary"
            id="btn-reset-packing"
            onClick={() => handleTypeChange(tripType)}
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: 700, borderRadius: '10px' }}
            title="Khôi phục danh mục gợi ý mặc định"
          >
            <i className="fa-solid fa-rotate-left"></i> Đặt lại
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.45rem' }}>
          <span style={{ fontWeight: 700, color: '#334155' }}>
            <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--accent-emerald)', marginRight: '0.35rem' }}></i> Tiến độ chuẩn bị hành lý:
          </span>
          <strong style={{ color: 'var(--accent-forest)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
            {progress}% hoàn tất ({items.filter(i => i.checked).length}/{items.length} món)
          </strong>
        </div>
        <div className="progress-bar-wrap" style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div className="progress-bar-inner" style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* Checklist Items Grid (Comprehensive & Responsive) */}
      <div className="packing-items-grid" id="packing-items-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '0.85rem' }}>
        {items.map(item => (
          <label
            key={item.id}
            className={`packing-item-label ${item.checked ? 'checked' : ''}`}
            onClick={() => toggleItem(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: item.checked ? '1.5px solid var(--accent-forest)' : '1px solid #e2e8f0',
              background: item.checked ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: item.checked ? '0 2px 8px rgba(4, 120, 87, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: item.checked ? 'none' : '1.5px solid #cbd5e1',
                  background: item.checked ? 'var(--accent-forest)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {item.checked && <i className="fa-solid fa-check"></i>}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: item.checked ? 700 : 500, color: item.checked ? '#065f46' : '#1e293b', lineHeight: 1.35 }}>
                {item.text}
              </span>
            </div>

            <span 
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: item.checked ? '#d1fae5' : '#f1f5f9',
                color: item.checked ? '#047857' : '#64748b',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {item.category}
            </span>
          </label>
        ))}
      </div>

    </div>
  );
};

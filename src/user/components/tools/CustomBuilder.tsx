import React, { useState } from 'react';
import { formatCurrencyVND } from '../../../utils/formatters';

interface GeneratedStep {
  day: number;
  title: string;
  desc: string;
}

export const CustomBuilder: React.FC = () => {
  const [destination, setDestination] = useState('Đà Nẵng - Hội An');
  const [days, setDays] = useState(4);
  const [style, setStyle] = useState('Nghỉ dưỡng & Biển');
  const [budgetTier, setBudgetTier] = useState('standard');
  const [submitted, setSubmitted] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  const estimatedPrice = days * (budgetTier === 'luxury' ? 2500000 : budgetTier === 'standard' ? 1200000 : 700000);

  const generatedItinerary: GeneratedStep[] = [];
  for (let i = 1; i <= days; i++) {
    if (i === 1) {
      generatedItinerary.push({
        day: 1,
        title: `Khởi hành & Check-in tại ${destination}`,
        desc: `Đón khách tại điểm hẹn, di chuyển đến ${destination}. Nhận phòng khách sạn, tự do dạo phố và thưởng thức ẩm thực địa phương.`
      });
    } else if (i === days) {
      generatedItinerary.push({
        day: days,
        title: 'Mua sắm đặc sản & Khởi hành về',
        desc: 'Thưởng thức cà phê sáng, mua quà lưu niệm đặc sản. Trả phòng khách sạn và khởi hành trở về.'
      });
    } else {
      generatedItinerary.push({
        day: i,
        title: `Khám phá các danh thắng nổi tiếng (${style})`,
        desc: `Tham quan các điểm đến tiêu biểu theo phong cách ${style}, trải nghiệm các hoạt động văn hóa bản địa độc đáo và thưởng thức ẩm thực.`
      });
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSentNotice(false);
  };

  return (
    <div className="tool-content-panel" id="tool-panel-builder" style={{ display: 'block' }}>
      <form id="custom-builder-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Điểm Đến Mong Muốn:</label>
            <input
              type="text"
              id="builder-dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Số Ngày Hành Trình:</label>
            <input
              type="number"
              id="builder-days"
              min="1"
              max="10"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="form-group">
            <label>Phong Cách Du Lịch:</label>
            <select
              id="builder-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="Nghỉ dưỡng & Biển">Nghỉ dưỡng & Biển</option>
              <option value="Văn hóa & Ẩm thực">Văn hóa & Ẩm thực</option>
              <option value="Mạo hiểm & Khám phá">Mạo hiểm & Khám phá</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mức Ngân Sách Dự Kiến:</label>
            <select
              id="builder-budget"
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
            >
              <option value="saver">Tiết Kiệm (Trải nghiệm)</option>
              <option value="standard">Tiêu Chuẩn (3-4 Sao)</option>
              <option value="luxury">Cao Cấp Luxury (5 Sao)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i> Thiết Kế Lộ Trình Tự Động
        </button>
      </form>

      {/* Custom Tour Card Generated Result */}
      {submitted && (
        <div className="custom-tour-card" id="custom-builder-result">
          <div className="custom-header">
            <div>
              <span className="badge badge-forest">Lộ Trình Đề Xuất Tự Động</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginTop: '0.4rem', color: '#111827' }}>
                Hành Trình Tự Do: {destination} ({days}N{days - 1}Đ)
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Phong cách: <strong>{style}</strong> • Tiêu chuẩn: <strong>{budgetTier === 'luxury' ? '5★ Luxury' : budgetTier === 'standard' ? '3-4★ Tiêu Chuẩn' : 'Tiết Kiệm'}</strong>
              </p>
            </div>
            <div className="custom-price" style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ước tính ngân sách / người:</span>
              <div className="price-val">{formatCurrencyVND(estimatedPrice)}</div>
            </div>
          </div>

          <div style={{ margin: '1.5rem 0' }}>
            {generatedItinerary.map(step => (
              <div key={step.day} className="itinerary-step">
                <div className="step-day">Ngày {step.day}</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#111827' }}>{step.title}</h4>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(5, 150, 105, 0.15)', paddingTop: '1rem' }}>
            {sentNotice ? (
              <div style={{ background: '#d1fae5', color: '#047857', padding: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 700 }}>
                <i className="fa-solid fa-circle-check"></i> Đã gửi yêu cầu tư vấn thành công! Chuyên viên sẽ liên hệ lại bạn trong 15 phút.
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setSentNotice(true)}
              >
                <i className="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu Chuyên Viên Tư Vấn Lịch Trình Này
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

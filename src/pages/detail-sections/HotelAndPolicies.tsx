import React, { useState } from 'react';
import { Tour } from '../../types/tour.types';

interface SectionProps {
  tour: Tour;
}

/** 1. Highlights & Hotel Sections */
export const HighlightsAndHotel: React.FC<SectionProps> = ({ tour }) => {
  const esgVal = tour.esgScore ? tour.esgScore.split(' ')[0] : '84/100';
  const leiVal = tour.leiScore ? tour.leiScore.split(' ')[0] : '76/100';

  return (
    <>
      {/* SECTION: HIGHLIGHTS & ESG / LEI RATINGS */}
      <section className="detail-content-card" id="section-highlights">
        <h3 className="detail-section-heading">
          <i className="fa-solid fa-feather-pointed" style={{ color: 'var(--accent-emerald)' }}></i> Điểm Nhấn Chương Trình & Trải Nghiệm Khác Biệt
        </h3>
        <p className="detail-intro-paragraph">
          {tour.overview || `Hành trình ${tour.title} được thiết kế tối ưu mang đến trải nghiệm trọn vẹn khám phá nét đẹp văn hóa, cảnh sắc thiên nhiên và dịch vụ cao cấp nhất tại ${tour.destination}.`}
        </p>

        {/* Highlights Pills Grid */}
        <div className="detail-highlights-wrap" style={{ margin: '1.25rem 0' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: '0.85rem' }}>
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Những Trải Nghiệm Đáng Giá Nhất:
          </h4>
          <div className="highlights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {(tour.highlights || []).map((hl, idx) => (
              <div key={idx} className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>
                <i className="fa-solid fa-check" style={{ color: 'var(--accent-emerald)' }}></i>
                <span>{hl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ESG & LEI Sustainable Dimensions */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginTop: '1.5rem' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#111827', marginBottom: '0.75rem' }}>
            <i className="fa-solid fa-award" style={{ color: 'var(--accent-emerald)', marginRight: '0.4rem' }}></i> Đánh Giá Chỉ Số Du Lịch Thế Hệ Mới:
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-forest)', fontSize: '0.95rem' }}>🌿 Du lịch Bền vững (ESG)</span>
                <span className="badge badge-emerald">{esgVal}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: 0, lineHeight: 1.45 }}>
                {tour.esgDesc || 'Cam kết bảo tồn hệ sinh thái, giảm thiểu rác thải nhựa và hỗ trợ sinh kế cho cộng đồng địa phương.'}
              </p>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>🏛️ Trải nghiệm Bản địa (LEI)</span>
                <span className="badge badge-emerald">{leiVal}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: 0, lineHeight: 1.45 }}>
                {tour.leiDesc || 'Chạm sâu vào văn hóa truyền thống, thưởng thức ẩm thực bản địa tinh hoa và các hoạt động trải nghiệm đặc quyền.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: HOTEL & CRUISE SPECIFICATIONS */}
      <section className="detail-content-card" id="section-hotel">
        <h3 className="detail-section-heading">
          <i className="fa-solid fa-hotel" style={{ color: 'var(--accent-emerald)' }}></i> {tour.hotelTier ? `Tiêu Chuẩn Lưu Trú: ${tour.hotelTier}` : 'Tiêu Chuẩn Lưu Trú'}
        </h3>
        
        <div style={{ background: '#f0fdf4', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                👑 {tour.tierName || 'Dòng Tiêu Chuẩn'}
              </span>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest)', margin: '0.2rem 0' }}>
                {tour.hotelSpecs?.hotelName || 'Khách sạn cao cấp tiêu chuẩn quốc tế'}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0 }}>
                🛏️ <strong>Tiêu chuẩn phòng:</strong> {tour.hotelSpecs?.roomType || 'Phòng tiêu chuẩn 2 khách/phòng'}
              </p>
            </div>
          </div>

          <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: '0.6rem' }}>
            <i className="fa-solid fa-circle-check" style={{ marginRight: '0.4rem' }}></i> Đặc Quyền Lưu Trú Đã Bao Gồm Trong Tour:
          </h5>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: '#374151' }}>
            {(tour.hotelSpecs?.inclusions || [
              'Buffet sáng quốc tế trọn gói hàng ngày',
              'Miễn phí sử dụng hồ bơi vô cực & phòng tập Gym',
              'Trà, cà phê & nước khoáng tiêu chuẩn trong phòng'
            ]).map((inc, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-check" style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}></i>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

/** 2. Services, Policies & FAQs Sections */
export const ServicesAndPolicies: React.FC<SectionProps> = ({ tour }) => {
  const [openInc, setOpenInc] = useState<boolean>(true);
  const [openExc, setOpenExc] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      {/* SECTION: SERVICES INCLUSIONS & EXCLUSIONS (ACCORDION STACKED) */}
      <section className="detail-content-card" id="section-services">
        <h3 className="detail-section-heading">
          <i className="fa-solid fa-list-check" style={{ color: 'var(--accent-emerald)' }}></i> Tiêu Chuẩn Dịch Vụ Minh Bạch
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
          Nhấp vào từng tiêu đề để xem chi tiết danh mục dịch vụ đã bao gồm trọn gói hoặc các khoản chi phí tự túc:
        </p>

        <div className="services-accordion-list">
          {/* Accordion 1: Tour Đã Bao Gồm */}
          <div className={`service-accordion-card ${openInc ? 'open' : ''}`}>
            <button 
              type="button" 
              className="service-accordion-header header-yes" 
              onClick={() => setOpenInc(!openInc)}
            >
              <div className="service-header-left">
                <i className="fa-solid fa-circle-check service-header-icon" style={{ color: 'var(--accent-emerald)' }}></i>
                <div>
                  <h4 className="service-header-title">Giá Tour ĐÃ BAO GỒM (Trọn Gói)</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-forest)', fontWeight: 600 }}>
                    Đã bao gồm {(tour.inclusionsList || []).length} dịch vụ tiêu chuẩn
                  </span>
                </div>
              </div>
              <i className="fa-solid fa-chevron-down service-accordion-chevron"></i>
            </button>
            {openInc && (
              <div className="service-accordion-body">
                <ul className="inc-list">
                  {(tour.inclusionsList || []).map((inc, idx) => (
                    <li key={idx}>
                      <i className="fa-solid fa-check" style={{ color: 'var(--accent-emerald)' }}></i>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Accordion 2: Tour Chưa Bao Gồm */}
          <div className={`service-accordion-card ${openExc ? 'open' : ''}`}>
            <button 
              type="button" 
              className="service-accordion-header header-no" 
              onClick={() => setOpenExc(!openExc)}
            >
              <div className="service-header-left">
                <i className="fa-solid fa-circle-xmark service-header-icon" style={{ color: '#dc2626' }}></i>
                <div>
                  <h4 className="service-header-title">Giá Tour CHƯA BAO GỒM (Tùy Chọn / Tự Túc)</h4>
                  <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                    {(tour.exclusionsList || []).length} mục chi phí cá nhân ngoài chương trình
                  </span>
                </div>
              </div>
              <i className="fa-solid fa-chevron-down service-accordion-chevron"></i>
            </button>
            {openExc && (
              <div className="service-accordion-body">
                <ul className="inc-list">
                  {(tour.exclusionsList || []).map((exc, idx) => (
                    <li key={idx}>
                      <i className="fa-solid fa-xmark" style={{ color: '#dc2626' }}></i>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION: POLICY & REFUNDS */}
      <section className="detail-content-card" id="section-policy">
        <h3 className="detail-section-heading">
          <i className="fa-solid fa-shield-halved" style={{ color: 'var(--accent-emerald)' }}></i> Quy Định & Điều Kiện Hoàn Hủy Tour
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.75rem' }}>
          Nhằm đảm bảo quyền lợi tối đa cho quý khách, chính sách hoàn hủy được áp dụng minh bạch theo khung thời gian sau:
        </p>

        <table className="policy-table">
          <thead>
            <tr>
              <th style={{ width: '55%' }}>Thời Điểm Thông Báo Hủy Tour</th>
              <th style={{ width: '45%' }}>Mức Phí Phạt Áp Dụng</th>
            </tr>
          </thead>
          <tbody>
            {(tour.refundPolicy || [
              { condition: 'Hủy trước 15 ngày khởi hành', fee: 'Miễn phí hoàn tiền 100%' },
              { condition: 'Hủy từ 08 đến 14 ngày trước khởi hành', fee: 'Phí hủy 30% giá tour' },
              { condition: 'Hủy từ 04 đến 07 ngày trước khởi hành', fee: 'Phí hủy 50% giá tour' },
              { condition: 'Hủy dưới 03 ngày hoặc vắng mặt', fee: 'Phí hủy 100% giá tour' }
            ]).map((p, idx) => (
              <tr key={idx}>
                <td><strong><i className="fa-regular fa-clock" style={{ color: 'var(--accent-emerald)', marginRight: '0.35rem' }}></i> {p.condition}</strong></td>
                <td style={{ color: p.fee.includes('100%') && !p.fee.includes('Phí') ? 'var(--accent-forest)' : '#b91c1c', fontWeight: 700 }}>{p.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1.25rem', fontSize: '0.85rem', color: '#4b5563' }}>
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--accent-emerald)', marginRight: '0.35rem' }}></i> <strong>Lưu ý giấy tờ tùy thân:</strong> Quý khách vui lòng mang theo Căn cước công dân (CCCD) hoặc Hộ chiếu còn hạn trên 6 tháng. Đối với trẻ em dưới 14 tuổi chưa có CCCD cần mang theo bản trích lục Giấy khai sinh có công chứng.
        </div>
      </section>

      {/* SECTION: FAQS ACCORDION */}
      {tour.faqs && tour.faqs.length > 0 && (
        <section className="detail-content-card" id="section-faqs">
          <h3 className="detail-section-heading">
            <i className="fa-solid fa-circle-question" style={{ color: 'var(--accent-emerald)' }}></i> Câu Hỏi Thường Gặp (FAQs)
          </h3>

          <div className="faq-accordion-list" style={{ marginTop: '1rem' }}>
            {tour.faqs.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx;
              return (
                <div key={fIdx} className="faq-card">
                  <button 
                    type="button" 
                    className="faq-header-btn" 
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                  >
                    <span>
                      <i className="fa-regular fa-comments" style={{ color: 'var(--accent-emerald)', marginRight: '0.5rem' }}></i>
                      {faq.q}
                    </span>
                    <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} faq-chevron`}></i>
                  </button>
                  {isOpen && (
                    <div className="faq-body-content">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
};

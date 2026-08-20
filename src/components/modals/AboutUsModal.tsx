import React, { useEffect } from 'react';

interface AboutUsModalProps {
  isOpen: boolean;
  initialTab?: 'about' | 'contact' | 'license';
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  initialTab = 'about',
  onClose
}) => {
  const [activeTab, setActiveTab] = React.useState<'about' | 'contact' | 'license'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 2600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '840px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '1.35rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              <i className="fa-solid fa-building-circle-check"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Về Thương Hiệu WebTravel Editorial
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                Hệ Thống Lữ Hành Quốc Tế &amp; Trải Nghiệm Du Lịch Tuyển Chọn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1.5px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 1.25rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'about' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'about' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'about' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-compass"></i> Giới Thiệu &amp; Sứ Mệnh
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('license')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'license' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'license' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'license' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-certificate"></i> Pháp Lý &amp; Giấy Phép
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'contact' ? '3px solid var(--accent-emerald)' : '3px solid transparent',
              color: activeTab === 'contact' ? 'var(--accent-forest)' : '#64748b',
              fontWeight: activeTab === 'contact' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-map-location-dot"></i> Hệ Thống Văn Phòng &amp; Hotline
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: 'calc(90vh - 160px)' }}>
          
          {/* TAB 1: ABOUT */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.6rem', color: '#0f172a', fontSize: '1.15rem' }}>
                  Hành Trình Kiến Tạo Trải Nghiệm Khác Biệt
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                  <strong>WebTravel Editorial</strong> được thành lập với sứ mệnh định hình lại chuẩn mực du lịch lữ hành chất lượng cao. Chúng tôi không chỉ bán những chuyến đi, mà thiết kế những câu chuyện khám phá đầy cảm xúc, kết hợp giữa sự chỉn chu trong dịch vụ và tinh hoa văn hóa bản địa.
                </p>
              </div>

              {/* 3 Core Values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.6rem' }}>
                    <i className="fa-solid fa-hotel"></i>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', color: '#1e293b' }}>Tuyển Chọn 4★ - 5★</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                    100% khách sạn và du thuyền đạt tiêu chuẩn quốc tế tại vị trí trung tâm đắc địa.
                  </p>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.6rem' }}>
                    <i className="fa-solid fa-user-tie"></i>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', color: '#1e293b' }}>Hướng Dẫn Viên Tinh Hoa</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                    Đội ngũ HDV chuyên nghiệp, am hiểu sâu sắc lịch sử, tận tâm và chu đáo suốt tuyến.
                  </p>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.6rem' }}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', color: '#1e293b' }}>Bảo Hiểm 1 Tỷ Đồng</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                    Bảo hiểm du lịch quốc tế và nội địa mức cao nhất cho mọi hành khách.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LICENSE */}
          {activeTab === 'license' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', borderRadius: '14px', padding: '1.25rem', border: '1.5px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-award" style={{ color: '#059669', fontSize: '1.3rem' }}></i>
                  <h3 style={{ margin: 0, color: '#064e3b', fontSize: '1.1rem' }}>
                    Giấy Phép Kinh Doanh Dịch Vụ Lữ Hành Quốc Tế
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: '#047857', lineHeight: 1.5 }}>
                  Do <strong>Cục Du Lịch Quốc Gia Việt Nam - Bộ Văn Hóa, Thể Thao &amp; Du Lịch</strong> cấp phép hoạt động theo luật Du lịch Việt Nam.
                </p>

                <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1rem', border: '1px solid #d1fae5', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Số Giấy Phép:</span>
                    <strong style={{ color: '#1e293b' }}>GP-79-0128/2024/TCDL-GPLHQT</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Mã Số Doanh Nghiệp / MST:</span>
                    <strong style={{ color: '#1e293b' }}>0318889999</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Tiền Ký Quỹ Lữ Hành Quốc Tế:</span>
                    <strong style={{ color: '#059669' }}>500.000.000 VNĐ (Tại MBBank)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Phạm Vi Hoạt Động:</span>
                    <strong style={{ color: '#1e293b' }}>Inbound &amp; Outbound Toàn Cầu</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & OFFICES */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                
                {/* Office 1 */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem', color: '#047857', fontSize: '0.95rem' }}>
                    🏢 Trụ Sở Chính (TP. Hồ Chí Minh)
                  </h4>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: '#334155' }}>
                    190 Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tel: (028) 3822 8899</span>
                </div>

                {/* Office 2 */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem', color: '#047857', fontSize: '0.95rem' }}>
                    🏢 Chi Nhánh Hà Nội
                  </h4>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: '#334155' }}>
                    55 Phan Chu Trinh, Quận Hoàn Kiếm, Hà Nội
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tel: (024) 3933 6688</span>
                </div>

                {/* Office 3 */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.1rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem', color: '#047857', fontSize: '0.95rem' }}>
                    🏢 Chi Nhánh Đà Nẵng
                  </h4>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: '#334155' }}>
                    58 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tel: (0236) 388 9988</span>
                </div>

              </div>

              <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '1rem', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <strong style={{ color: '#1e40af', fontSize: '0.9rem', display: 'block' }}>Tổng Đài Chăm Sóc &amp; Đặt Tour 24/7</strong>
                  <span style={{ fontSize: '0.82rem', color: '#3b82f6' }}>Miễn phí cước gọi toàn quốc từ 07:00 - 22:00</span>
                </div>
                <a href="tel:1800646888" style={{ background: '#2563eb', color: '#ffffff', padding: '0.5rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-phone"></i> 1800 646 888
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

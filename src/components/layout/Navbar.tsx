import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TravelGuideModal, TravelGuideTab } from '../modals/TravelGuideModal';
import { AboutUsModal } from '../modals/AboutUsModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lookupCode, setLookupCode] = useState('');
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);

  // Travel Guide Modal state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState<TravelGuideTab>('visa');

  // About Us & Credibility Modal state
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<'about' | 'contact' | 'license'>('about');

  const handleOpenGuideModal = (tab: TravelGuideTab) => {
    setGuideModalTab(tab);
    setIsGuideModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleOpenAboutModal = (tab: 'about' | 'contact' | 'license') => {
    setAboutModalTab(tab);
    setIsAboutModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    alert(`Đang tra cứu hồ sơ đặt tour mã: ${lookupCode.trim().toUpperCase()}\nTrạng thái: Đã xác nhận giữ chỗ & vé điện tử đang được xử lý.`);
    setIsLookupModalOpen(false);
    setLookupCode('');
  };

  const handleNavigateDestination = (keyword: string, category?: 'domestic' | 'international') => {
    const catQuery = category ? `&category=${category}` : '';
    navigate(`/?keyword=${encodeURIComponent(keyword)}${catQuery}#tours-explorer`);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateType = (typeKeyword: string) => {
    navigate(`/?keyword=${encodeURIComponent(typeKeyword)}#tours-explorer`);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateTool = (_toolId?: string) => {
    navigate('/#tools-section');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="header-wrapper has-topbar">
      
      {/* 1. TOP UTILITY BAR (Tier 1: Uy Tín & Tra Cứu) */}
      <div className="top-utility-bar">
        <div className="container top-utility-container">
          <div className="top-utility-left">
            <a href="tel:1800646888" className="top-utility-item">
              <i className="fa-solid fa-phone-volume" style={{ color: '#34d399' }}></i>
              <span>Tổng đài 24/7: <strong>1800 646 888</strong> (Miễn phí)</span>
            </a>
            <button 
              type="button"
              onClick={() => handleOpenAboutModal('license')}
              className="top-utility-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-certificate" style={{ color: '#6ee7b7' }}></i>
              <span>GP Lữ Hành QT: <strong>GP-79-0128/TCDL</strong></span>
            </button>
          </div>

          <div className="top-utility-right">
            <button 
              type="button"
              onClick={() => setIsLookupModalOpen(true)}
              className="top-utility-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-receipt" style={{ color: '#fcd34d' }}></i>
              <span>Tra cứu Booking (WT-xxxx)</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAboutModal('about')}
              className="top-utility-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-circle-info" style={{ color: '#a7f3d0' }}></i>
              <span>Về Chúng Tôi</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAboutModal('contact')}
              className="top-utility-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-map-location-dot" style={{ color: '#6ee7b7' }}></i>
              <span>Văn Phòng</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR (Tier 2: Điều Hướng Sản Phẩm & Trải Nghiệm) */}
      <header className="navbar" id="main-header">
        <div className="container navbar-container">
          
          {/* Brand Logo (Góc trái ngoài cùng, click luôn quay về Trang chủ) */}
          <Link to="/" className="brand-logo">
            <i className="fa-solid fa-compass brand-icon"></i>
            <span>WebTravel <span className="highlight">Editorial</span></span>
          </Link>

          {/* Navigation Links (Single horizontal line, zero wrapping) */}
          <nav className="nav-links">
            
            {/* 1. Danh Mục Tour (Mega Menu 3 Cột: Địa Lý Trong Nước - Quốc Tế - Loại Hình) */}
            <div className="nav-item-dropdown nav-item-mega">
              <span className="nav-link">
                Danh Mục Tour <i className="fa-solid fa-chevron-down dropdown-caret"></i>
              </span>
              <div className="mega-dropdown-panel" style={{ width: '820px' }}>
                <div className="mega-grid">
                  
                  {/* Cột 1: Địa Lý Trong Nước */}
                  <div>
                    <div className="mega-col-title">
                      <i className="fa-solid fa-mountain"></i> Tour Trong Nước
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Hạ Long', 'domestic')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-ship"></i></div>
                        <div>
                          <strong>Vịnh Hạ Long &amp; Miền Bắc</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Du thuyền 5★, Sapa, Tràng An</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Đà Nẵng', 'domestic')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-bridge-water"></i></div>
                        <div>
                          <strong>Đà Nẵng &amp; Miền Trung</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Bà Nà Hills, Phố cổ Hội An, Huế</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Phú Quốc', 'domestic')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-umbrella-beach"></i></div>
                        <div>
                          <strong>Phú Quốc &amp; Biển Đảo</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Resort 5★ biển, Sunset Town</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Địa Lý Quốc Tế */}
                  <div>
                    <div className="mega-col-title">
                      <i className="fa-solid fa-earth-asia"></i> Tour Quốc Tế
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Nhật Bản', 'international')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-fan"></i></div>
                        <div>
                          <strong>Đông Bắc Á (Nhật - Hàn)</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Tokyo, Núi Phú Sĩ, Seoul, Nami</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Thái Lan', 'international')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-spa"></i></div>
                        <div>
                          <strong>Đông Nam Á (Thái - Sing)</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Bangkok, Pattaya, Marina Bay</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateDestination('Châu Âu', 'international')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon"><i className="fa-solid fa-landmark"></i></div>
                        <div>
                          <strong>Châu Âu - Úc - Mỹ</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Pháp, Thụy Sĩ, Ý, Sydney, Bờ Tây</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột 3: Phân Loại Theo Trải Nghiệm */}
                  <div>
                    <div className="mega-col-title">
                      <i className="fa-solid fa-compass"></i> Loại Hình Du Lịch
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div className="dropdown-item" onClick={() => handleNavigateType('Gia Đình')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon" style={{ background: '#ecfdf5', color: '#047857' }}><i className="fa-solid fa-people-roof"></i></div>
                        <div>
                          <strong>Tour Gia Đình &amp; Trẻ Nhỏ</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Lịch trình thảnh thơi, KS trung tâm</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateType('Nghỉ Dưỡng')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fa-solid fa-water"></i></div>
                        <div>
                          <strong>Nghỉ Dưỡng Resort 5★</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Thư giãn, spa, ẩm thực cao cấp</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateType('Khám Phá')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fa-solid fa-person-hiking"></i></div>
                        <div>
                          <strong>Trekking &amp; Mạo Hiểm</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Chinh phục đỉnh cao &amp; văn hóa</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => handleNavigateTool('builder')} style={{ cursor: 'pointer' }}>
                        <div className="dropdown-item-icon" style={{ background: '#fdf2f8', color: '#db2777' }}><i className="fa-solid fa-crown"></i></div>
                        <div>
                          <strong>Tour May Đo / VIP MICE</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Thiết kế riêng cho doanh nghiệp</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Footer Bar */}
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1rem', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748b' }}>
                    🔥 Cam kết khởi hành đúng lịch 100% • Khách sạn trung tâm tiêu chuẩn
                  </span>
                  <span 
                    onClick={() => handleNavigateDestination('')}
                    style={{ color: 'var(--accent-forest)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Xem tất cả tour đang mở bán <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Ưu Đãi / Khuyến Mãi Hot (Badge SALE 30% nổi bật) */}
            <div 
              className="nav-link" 
              onClick={() => handleNavigateType('Giá Tốt')}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Ưu Đãi Hot</span>
              <span style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '0.12rem 0.45rem',
                borderRadius: '20px',
                letterSpacing: '0.03em',
                boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
                animation: 'pulse 2s infinite'
              }}>
                SALE 30%
              </span>
            </div>

            {/* 4. Dịch Vụ Đi Kèm (Dropdown) */}
            <div className="nav-item-dropdown">
              <span className="nav-link">
                Dịch Vụ Đi Kèm <i className="fa-solid fa-chevron-down dropdown-caret"></i>
              </span>
              <div className="dropdown-menu" style={{ width: '290px' }}>
                <div 
                  className="dropdown-item" 
                  onClick={() => handleOpenGuideModal('visa')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fa-solid fa-passport"></i></div>
                  <div>
                    <strong>Dịch Vụ Làm Visa Quốc Tế</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Hồ sơ đậu 99.2% Nhật, Hàn, Âu, Mỹ</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateDestination('Combo')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fa-solid fa-plane-departure"></i></div>
                  <div>
                    <strong>Combo Vé Bay + Khách Sạn</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Vé khứ hồi &amp; Resort 4-5★ tự do</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleOpenGuideModal('policies')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#ecfdf5', color: '#047857' }}><i className="fa-solid fa-shield-halved"></i></div>
                  <div>
                    <strong>Bảo Hiểm Du Lịch 1 Tỷ</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Bảo hiểm Bảo Việt / MSIG toàn cầu</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateTool('builder')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fa-solid fa-car-side"></i></div>
                  <div>
                    <strong>Thuê Xe &amp; Đưa Đón Sân Bay</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Xe đời mới 7 - 45 chỗ tài xế kinh nghiệm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Cẩm Nang Du Lịch (Dropdown) */}
            <div className="nav-item-dropdown">
              <span className="nav-link">
                Cẩm Nang <i className="fa-solid fa-chevron-down dropdown-caret"></i>
              </span>
              <div className="dropdown-menu" style={{ width: '290px' }}>
                <div 
                  className="dropdown-item" 
                  onClick={() => handleOpenGuideModal('luggage')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#fef3c7', color: '#b45309' }}><i className="fa-solid fa-suitcase-rolling"></i></div>
                  <div>
                    <strong>Quy Định Hành Lý Bay</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Quy chuẩn xách tay &amp; ký gửi chuẩn IATA</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleOpenGuideModal('visa')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fa-solid fa-book-open"></i></div>
                  <div>
                    <strong>Kinh Nghiệm Xin Visa</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Mẹo chuẩn bị hồ sơ chứng minh tài chính</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateTool('packing')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon" style={{ background: '#ecfdf5', color: '#047857' }}><i className="fa-solid fa-clipboard-check"></i></div>
                  <div>
                    <strong>Checklist Đồ Cần Chuẩn Bị</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Gợi ý đồ dùng theo từng loại hình du lịch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Sổ Tay Tiện Ích */}
            <div className="nav-item-dropdown">
              <span className="nav-link">
                Sổ Tay Tiện Ích <i className="fa-solid fa-chevron-down dropdown-caret"></i>
              </span>
              <div className="dropdown-menu" style={{ width: '280px' }}>
                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateTool('budget')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon"><i className="fa-solid fa-calculator"></i></div>
                  <div>
                    <strong>Dự Toán Ngân Sách Pro</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Bảng tính chi phí tự động 6 hạng mục</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateTool('currency')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon"><i className="fa-solid fa-money-bill-transfer"></i></div>
                  <div>
                    <strong>Đổi Tỷ Giá &amp; Múi Giờ Live</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Thời gian thực liên ngân hàng</span>
                  </div>
                </div>

                <div 
                  className="dropdown-item" 
                  onClick={() => handleNavigateTool('builder')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-item-icon"><i className="fa-solid fa-compass-drafting"></i></div>
                  <div>
                    <strong>Tự Thiết Kế Lộ Trình Tour</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>May đo theo ngân sách &amp; sở thích</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Trang Quản Trị */}
            <Link to="/admin" className={`nav-link ${path === '/admin' ? 'active' : ''}`} style={{ color: '#d97706' }}>
              <i className="fa-solid fa-gauge"></i> Quản Trị
            </Link>

          </nav>

          {/* Right Header Actions */}
          <div className="header-actions">
            
            {/* CTA Đặt Tour Ngay */}
            <Link to="/checkout" className="btn-primary">
              <i className="fa-solid fa-calendar-check"></i> Đặt Chỗ Ngay
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button 
              type="button" 
              className="mobile-nav-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <i className={isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
            </button>

          </div>
        </div>
      </header>

      {/* Travel Guide & Policies Fast Modal */}
      <TravelGuideModal 
        isOpen={isGuideModalOpen}
        initialTab={guideModalTab}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* About Us & Legal License Modal */}
      <AboutUsModal 
        isOpen={isAboutModalOpen}
        initialTab={aboutModalTab}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Lookup Booking Code Modal */}
      {isLookupModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 2600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setIsLookupModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '50px', height: '50px', background: '#ecfdf5', color: '#047857', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 0.75rem' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#111827', margin: 0 }}>Tra Cứu Hồ Sơ Đặt Tour</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.35rem 0 0' }}>Nhập mã đơn hàng hoặc số điện thoại đăng ký đặt tour</p>
            </div>
            <form onSubmit={handleLookupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Mã đặt chỗ (Ví dụ: WT-849201)</label>
                <input 
                  type="text" 
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  placeholder="Nhập mã WT-..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '0.85rem' }}>
                <i className="fa-solid fa-magnifying-glass"></i> Kiểm Tra Trạng Thái
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AboutUsModal } from '../modals/AboutUsModal';
import { TravelGuideModal, TravelGuideTab } from '../modals/TravelGuideModal';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideInitialTab, setGuideInitialTab] = useState<TravelGuideTab>('visa');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const openGuide = (tab: TravelGuideTab) => {
    setGuideInitialTab(tab);
    setIsGuideModalOpen(true);
  };

  return (
    <>
      <footer className="site-footer">
        
        {/* 1. Value Proposition & Trust Guarantee Bar */}
        <div className="footer-trust-bar">
          <div className="container">
            <div className="footer-trust-grid">
              
              <div className="footer-trust-item">
                <div className="footer-trust-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="footer-trust-text">
                  <strong>Bảo Hiểm 1 Tỷ Đồng</strong>
                  <span>Bảo vệ y tế &amp; rủi ro chuyến bay toàn cầu</span>
                </div>
              </div>

              <div className="footer-trust-item">
                <div className="footer-trust-icon">
                  <i className="fa-solid fa-award"></i>
                </div>
                <div className="footer-trust-text">
                  <strong>Giấy Phép Quốc Tế</strong>
                  <span>GP-79-0128/TCDL &amp; Ký quỹ 500Tr MBBank</span>
                </div>
              </div>

              <div className="footer-trust-item">
                <div className="footer-trust-icon">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div className="footer-trust-text">
                  <strong>Thanh Toán Đa Kênh</strong>
                  <span>VietQR 24/7, Visa/Mastercard 3D Secure</span>
                </div>
              </div>

              <div className="footer-trust-item">
                <div className="footer-trust-icon">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div className="footer-trust-text">
                  <strong>Hỗ Trợ Khách Hàng 24/7</strong>
                  <span>Hotline khẩn cấp &amp; tư vấn tận tâm 1900 8888</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. Main 4-Column Mega Footer Content */}
        <div className="footer-main-content">
          <div className="container">
            <div className="footer-columns-grid">
              
              {/* Column 1: Company & Legal Credentials */}
              <div>
                <Link to="/" className="footer-brand-logo">
                  <i className="fa-solid fa-compass" style={{ color: 'var(--accent-emerald, #059669)' }}></i>
                  <span>WebTravel <span style={{ color: 'var(--accent-emerald, #059669)', fontStyle: 'italic' }}>Editorial</span></span>
                </Link>
                <p className="footer-brand-desc">
                  Thương hiệu du lịch lữ hành trải nghiệm cao cấp hàng đầu Việt Nam. Cam kết minh bạch lịch trình, chuẩn mực dịch vụ 5 sao và trải nghiệm văn hóa bản địa sâu sắc.
                </p>

                <ul className="footer-contact-list">
                  <li>
                    <i className="fa-solid fa-phone-volume"></i>
                    <span>Tổng đài CSKH: <strong>1900 8888</strong> (08:00 - 22:00)</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-envelope"></i>
                    <span>Email: <strong>booking@webtravel.vn</strong></span>
                  </li>
                </ul>
              </div>

              {/* Column 2: Branches Network */}
              <div>
                <h4 className="footer-col-title">Hệ Thống Văn Phòng</h4>
                
                <div className="footer-branch-card">
                  <strong><i className="fa-solid fa-building" style={{ color: '#34d399' }}></i> Trụ Sở Hà Nội</strong>
                  <p>Tầng 8, Tòa nhà Lotte Center, 54 Liễu Giai, Q. Ba Đình, Hà Nội</p>
                  <p style={{ marginTop: '0.2rem', color: '#64748b', fontSize: '0.74rem' }}>Hotline: 024.3988.8888</p>
                </div>

                <div className="footer-branch-card">
                  <strong><i className="fa-solid fa-building" style={{ color: '#34d399' }}></i> Chi Nhánh Đà Nẵng</strong>
                  <p>128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng</p>
                  <p style={{ marginTop: '0.2rem', color: '#64748b', fontSize: '0.74rem' }}>Hotline: 0236.388.8888</p>
                </div>

                <div className="footer-branch-card">
                  <strong><i className="fa-solid fa-building" style={{ color: '#34d399' }}></i> Chi Nhánh TP. Hồ Chí Minh</strong>
                  <p>Tầng 15, Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1</p>
                  <p style={{ marginTop: '0.2rem', color: '#64748b', fontSize: '0.74rem' }}>Hotline: 028.3888.8888</p>
                </div>
              </div>

              {/* Column 3: Travel Ecosystem & Guides */}
              <div>
                <h4 className="footer-col-title">Hệ Sinh Thái Du Lịch</h4>
                <ul className="footer-nav-list">
                  <li>
                    <Link to="/#tours-explorer"><i className="fa-solid fa-chevron-right"></i> Tour Du Lịch Trong Nước</Link>
                  </li>
                  <li>
                    <Link to="/#tours-explorer"><i className="fa-solid fa-chevron-right"></i> Tour Du Lịch Quốc Tế</Link>
                  </li>
                  <li>
                    <Link to="/#all-inclusive"><i className="fa-solid fa-chevron-right"></i> Hành Trình Trọn Gói 5★</Link>
                  </li>
                  <li>
                    <button type="button" onClick={() => openGuide('visa')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: '#475569' }}></i> Cẩm Nang Thủ Tục Visa
                      </span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => openGuide('luggage')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: '#475569' }}></i> Quy Định Hành Lý Hàng Không
                      </span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => openGuide('policies')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: '#475569' }}></i> Quyền Lợi Bảo Hiểm Quốc Tế
                      </span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setIsAboutModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: '#475569' }}></i> Về Chúng Tôi &amp; Pháp Lý
                      </span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 4: Newsletter & Connect */}
              <div>
                <h4 className="footer-col-title">Bản Tin &amp; Ưu Đãi</h4>
                
                <div className="footer-newsletter-box">
                  <p>Đăng ký email để nhận voucher <strong>500.000 VNĐ</strong> và thông báo tour flash sale sớm nhất.</p>
                  
                  <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                    <input 
                      type="email" 
                      placeholder="Nhập email của bạn..." 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="footer-newsletter-input"
                    />
                    <button type="submit" className="footer-newsletter-btn" aria-label="Đăng ký nhận tin">
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </form>

                  {subscribed && (
                    <div style={{ marginTop: '0.6rem', color: '#34d399', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <i className="fa-solid fa-circle-check"></i> Đăng ký thành công! Mã ưu đãi đã gửi qua email.
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Kết Nối Cùng WebTravel:
                </div>
                <div className="footer-social-row">
                  <a href="#facebook" className="footer-social-btn" aria-label="Facebook" title="Facebook WebTravel">
                    <i className="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="#youtube" className="footer-social-btn" aria-label="YouTube" title="YouTube Channel">
                    <i className="fa-brands fa-youtube"></i>
                  </a>
                  <a href="#tiktok" className="footer-social-btn" aria-label="TikTok" title="TikTok Travel">
                    <i className="fa-brands fa-tiktok"></i>
                  </a>
                  <a href="#instagram" className="footer-social-btn" aria-label="Instagram" title="Instagram Official">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href="#zalo" className="footer-social-btn" aria-label="Zalo" title="Zalo Official Account">
                    <i className="fa-solid fa-comment-dots"></i>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 3. Bottom Bar (Copyright & Policy & Payment) */}
        <div className="footer-bottom-bar">
          <div className="container">
            <div className="footer-bottom-flex">
              
              <p className="footer-copyright">
                © 2026 <strong>WebTravel Editorial Co., Ltd</strong>. Giữ toàn quyền sở hữu trí tuệ &amp; bảo lưu tác quyền.
              </p>

              <div className="footer-policy-links">
                <button type="button" onClick={() => setIsAboutModalOpen(true)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Điều Khoản Dịch Vụ
                </button>
                <span style={{ color: '#334155' }}>•</span>
                <button type="button" onClick={() => openGuide('policies')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Chính Sách Bảo Mật
                </button>
                <span style={{ color: '#334155' }}>•</span>
                <button type="button" onClick={() => setIsAboutModalOpen(true)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Quy Chế Hoàn Hủy
                </button>
              </div>

              <div className="footer-payment-methods">
                <span className="footer-payment-pill"><i className="fa-solid fa-qrcode" style={{ color: '#34d399' }}></i> VietQR</span>
                <span className="footer-payment-pill"><i className="fa-brands fa-cc-visa" style={{ color: '#60a5fa' }}></i> Visa</span>
                <span className="footer-payment-pill"><i className="fa-brands fa-cc-mastercard" style={{ color: '#f87171' }}></i> Master</span>
                <span className="footer-payment-pill"><i className="fa-solid fa-building-columns" style={{ color: '#fbbf24' }}></i> MBBank</span>
              </div>

            </div>
          </div>
        </div>

      </footer>

      {/* Interactive Modals from Footer Links */}
      <AboutUsModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <TravelGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} initialTab={guideInitialTab} />
    </>
  );
};

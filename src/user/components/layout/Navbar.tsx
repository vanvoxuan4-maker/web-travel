import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { TravelGuideModal, TravelGuideTab } from '../modals/TravelGuideModal';
import { AboutUsModal } from '../modals/AboutUsModal';
import { WishlistModal } from '../modals/WishlistModal';
import { CartModal } from '../modals/CartModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lookupCode, setLookupCode] = useState('');
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
    setIsLookupModalOpen(false);
    navigate('/profile');
    setLookupCode('');
  };

  const handleNavigateDestination = (keyword: string, category?: 'domestic' | 'international') => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (category) params.set('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/tours${queryString}`);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateType = (typeKeyword: string) => {
    navigate(`/tours?q=${encodeURIComponent(typeKeyword)}`);
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
            
            {/* 1. Danh Mục Tour (Link trực tiếp, không dropdown) */}
            <Link 
              to="/tours" 
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Danh Mục Tour
            </Link>

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

          </nav>

          {/* Right Header Actions */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* User Auth Section */}
            {isAuthenticated && user ? (
              <div className="nav-user-dropdown-wrapper" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '30px',
                    padding: '0.35rem 0.85rem 0.35rem 0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: (user.role === 'admin' || user.role === 'super_admin') ? '#d97706' : '#059669', fontWeight: 600 }}>
                      {user.role === 'super_admin' ? '⚡ Super Admin' : user.role === 'admin' ? '👑 Admin' : `⭐ ${user.loyaltyPoints || 0} điểm`}
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '0.2rem' }}></i>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '230px',
                      background: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: '0.5rem',
                      zIndex: 1000,
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                      {user.phone && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {user.phone}</div>}
                    </div>

                    <div style={{ padding: '0.35rem 0' }}>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.55rem 0.8rem',
                          color: '#047857',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          textDecoration: 'none',
                          background: '#ecfdf5',
                          marginBottom: '0.25rem'
                        }}
                      >
                        <i className="fa-solid fa-receipt"></i> Đơn Hàng &amp; Vé Điện Tử
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.5rem 0.8rem',
                            color: '#d97706',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="fa-solid fa-gauge"></i> Trang Quản Trị Admin
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsLookupModalOpen(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.8rem',
                          background: 'none',
                          border: 'none',
                          color: '#334155',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass" style={{ color: '#059669' }}></i> Tra cứu nhanh mã booking
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.8rem',
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <i className="fa-solid fa-right-from-bracket"></i> Đăng Xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '30px',
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fa-solid fa-user"></i> Đăng Nhập
              </Link>
            )}

            {/* 1. Wishlist Button */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              aria-label="Danh sách tour yêu thích"
              title="Danh sách tour yêu thích"
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.12)'
              }}
            >
              <i className="fa-solid fa-heart"></i>
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                2
              </span>
            </button>

            {/* 2. Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Giỏ hàng tour"
              title="Giỏ hàng tour"
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.12)'
              }}
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                1
              </span>
            </button>

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

        {/* Mobile Navigation Menu Dropdown */}
        {isMobileMenuOpen && (
          <div 
            style={{
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              padding: '1rem 1.5rem 1.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto'
            }}
          >
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', borderRadius: '8px', background: '#f8fafc' }}
            >
              <i className="fa-solid fa-house" style={{ color: '#059669' }}></i> Trang Chủ
            </Link>

            <Link
              to="/tours"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#047857', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', borderRadius: '8px', background: '#ecfdf5' }}
            >
              <i className="fa-solid fa-compass" style={{ color: '#059669' }}></i> Danh Mục Tour (Tất Cả)
            </Link>

            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Điểm Đến &amp; Loại Hình
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleNavigateDestination('', 'domestic')}
                style={{ textAlign: 'left', padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                🇻🇳 Tour Trong Nước
              </button>
              <button
                type="button"
                onClick={() => handleNavigateDestination('', 'international')}
                style={{ textAlign: 'left', padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                ✈️ Tour Quốc Tế
              </button>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div
                onClick={() => { handleOpenAboutModal('about'); }}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.86rem', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fa-solid fa-circle-info" style={{ color: '#059669' }}></i> Về Chúng Tôi
              </div>
              <div
                onClick={() => { setIsLookupModalOpen(true); setIsMobileMenuOpen(false); }}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.86rem', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className="fa-solid fa-receipt" style={{ color: '#d97706' }}></i> Tra Cứu Booking (WT-xxxx)
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

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

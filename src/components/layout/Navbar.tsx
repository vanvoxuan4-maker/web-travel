import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <header className="navbar" id="main-header">
      <div className="container navbar-container">
        <Link to="/home" className="brand-logo">
          <i className="fa-solid fa-compass brand-icon"></i>
          <span>WebTravel <span className="highlight">Editorial</span></span>
        </Link>

        <nav className="nav-links">
          <Link to="/home" className={`nav-link ${path === '/home' || path === '/' ? 'active' : ''}`}>
            Hành Trình
          </Link>
          <Link to="/home#tools-section" className="nav-link">
            Sổ Tay Tiện Ích
          </Link>
          <Link to="/checkout" className={`nav-link ${path.startsWith('/checkout') ? 'active' : ''}`}>
            <i className="fa-solid fa-cart-shopping"></i> Đặt Tour (Checkout)
          </Link>
          <Link to="/admin" className={`nav-link ${path === '/admin' ? 'active' : ''}`} style={{ color: '#f59e0b' }}>
            <i className="fa-solid fa-gauge"></i> Quản Trị
          </Link>
        </nav>

        <div className="header-actions">
          <a href="tel:19001234" className="btn-secondary">
            <i className="fa-solid fa-phone-volume"></i> Hotline: 1900 1234
          </a>
          <Link to="/checkout" className="btn-primary">
            <i className="fa-solid fa-calendar-check"></i> Đặt Tour Ngay
          </Link>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOURS_DATA } from '../../../data/toursData';
import { formatCurrencyVND } from '../../../utils/formatters';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  // Active sample draft tour in cart
  const cartTour = TOURS_DATA.length > 0 ? TOURS_DATA[0] : null;

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            padding: '1.5rem 1.75rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.2)',
                border: '1.5px solid rgba(52, 211, 153, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Giỏ Hàng Tour Của Bạn
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0' }}>
                Hồ sơ chuyến đi đang chuẩn bị thanh toán
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {cartTour ? (
            <>
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <img
                  src={cartTour.image}
                  alt={cartTour.title}
                  style={{
                    width: '90px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '6px', background: '#ecfdf5', color: '#047857', display: 'inline-block', marginBottom: '0.25rem' }}>
                    Tour 5 Sao • {cartTour.durationDays}N{cartTour.durationNights}Đ
                  </span>
                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                    {cartTour.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>2 Khách người lớn</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857' }}>
                      {formatCurrencyVND(cartTour.priceAdult * 2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing summary */}
              <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569', marginBottom: '0.4rem' }}>
                  <span>Tạm tính (2 khách):</span>
                  <span>{formatCurrencyVND(cartTour.priceAdult * 2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#059669', marginBottom: '0.4rem' }}>
                  <span>Bảo hiểm du lịch 1 Tỷ ₫:</span>
                  <span style={{ fontWeight: 700 }}>Miễn Phí</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                  <span>Tổng thanh toán:</span>
                  <span style={{ color: '#047857' }}>{formatCurrencyVND(cartTour.priceAdult * 2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  navigate(`/checkout/${cartTour.id}`);
                }}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Tiến Hành Đặt Chỗ Ngay</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <i className="fa-solid fa-cart-shopping" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
              <h4 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>Giỏ hàng đang trống</h4>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.86rem' }}>Hãy chọn tour du lịch yêu thích để bắt đầu hành trình!</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem', borderRadius: '10px' }}
              >
                Khám Phá Các Tour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

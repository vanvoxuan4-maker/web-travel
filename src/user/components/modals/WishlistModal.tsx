import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TOURS_DATA } from '../../../data/toursData';
import { formatCurrencyVND } from '../../../utils/formatters';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WISHLIST_STORAGE_KEY = 'webtravel_user_wishlist';

export const WishlistModal: React.FC<WishlistModalProps> = ({ isOpen, onClose }) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['tour-01', 'tour-04']; // Default sample favorites
    } catch {
      return ['tour-01', 'tour-04'];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) setWishlistIds(JSON.parse(saved));
    } catch {}
  }, [isOpen]);

  const handleRemove = (tourId: string) => {
    const updated = wishlistIds.filter(id => id !== tourId);
    setWishlistIds(updated);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  if (!isOpen) return null;

  const wishlistedTours = TOURS_DATA.filter(t => wishlistIds.includes(t.id));

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
          maxWidth: '620px',
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
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171'
              }}
            >
              <i className="fa-solid fa-heart"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Danh Sách Yêu Thích ({wishlistedTours.length})
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0' }}>
                Các tour du lịch nghỉ dưỡng bạn đã lưu lại
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

        {/* Tour List Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {wishlistedTours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', color: '#94a3b8' }}>
                <i className="fa-regular fa-heart"></i>
              </div>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                Chưa có tour nào trong danh sách yêu thích
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Hãy bấm vào biểu tượng trái tim ở các tour để lưu lại nhé!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wishlistedTours.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.85rem',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={t.image}
                    alt={t.title}
                    style={{
                      width: '85px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '6px', background: '#ecfdf5', color: '#047857' }}>
                        {t.durationDays}N{t.durationNights}Đ
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Khởi hành: {t.departureFrom}
                      </span>
                    </div>

                    <h4
                      style={{
                        margin: '0 0 0.35rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857' }}>
                        {formatCurrencyVND(t.priceAdult)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ khách</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                    <Link
                      to={`/tour/${t.slug || t.id}`}
                      onClick={onClose}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#047857',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      Đặt Ngay <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(t.id)}
                      style={{
                        padding: '0.35rem',
                        background: '#fee2e2',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Tự động lưu vào hồ sơ cá nhân
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

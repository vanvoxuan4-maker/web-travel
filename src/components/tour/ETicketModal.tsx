import React from 'react';
import { Tour } from '../../types/tour.types';
import { formatCurrencyVND } from '../../utils/formatters';

interface ETicketModalProps {
  tour: Tour;
  departureDate: string;
  onClose: () => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({ tour, departureDate, onClose }) => {
  const bookingRef = 'WT-' + Math.floor(100000 + Math.random() * 900000);
  const matchedDep = tour.departureDates?.find(d => d.date === departureDate);
  const outbound = matchedDep?.transport?.outbound || {
    date: departureDate, time: '07:00', arriveTime: '09:10', flightNo: 'VN240', airline: 'Vietnam Airlines', from: 'SGN', to: 'HAN'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ padding: '2rem 1.5rem' }}>
          {/* E-Ticket Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="brand-logo" style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                <i className="fa-solid fa-compass" style={{ color: 'var(--accent-emerald)' }}></i>
                <span>WebTravel <span className="highlight">Editorial</span></span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VÉ ĐIỆN TỬ & XÁC NHẬN GIỮ CHỖ CHÍNH THỨC</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MÃ ĐẶT CHỖ (PNR)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-forest)', letterSpacing: '1px' }}>{bookingRef}</div>
            </div>
          </div>

          {/* Tour & Flight Info Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#111827', margin: '0 0 0.5rem' }}>{tour.title}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span><i className="fa-regular fa-clock"></i> {tour.durationDays}N{tour.durationNights}Đ</span>
              <span><i className="fa-solid fa-plane"></i> {outbound.airline} ({outbound.flightNo})</span>
              <span><i className="fa-solid fa-hotel"></i> {tour.hotelTier}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>NGÀY KHỞI HÀNH</span>
                <strong>{departureDate}</strong> ({outbound.time} Cất cánh)
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>HẠNG DỊCH VỤ</span>
                <strong style={{ color: 'var(--accent-forest)' }}>Trọn gói Tiêu chuẩn VIP</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>TỔNG CHI PHÍ</span>
                <strong>{formatCurrencyVND(tour.priceAdult)} / khách</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>TRẠNG THÁI</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>● Đã Xác Nhận</span>
              </div>
            </div>
          </div>

          {/* QR Code Scan & Barcode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Mã QR Check-in Nhanh</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Xuất trình mã này cho Trưởng đoàn tại Sân bay để nhận phòng và thẻ hành khách.
              </p>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent('WEBTRAVEL-' + bookingRef + '-' + departureDate)}`}
                alt="QR Code"
                style={{ width: '80px', height: '80px', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> In / Xuất PDF Vé Này
            </button>
            <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={onClose}>
              <i className="fa-solid fa-check"></i> Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

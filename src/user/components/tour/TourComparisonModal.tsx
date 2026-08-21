import React from 'react';
import { Tour } from '../../../types/tour.types';
import { formatCurrencyVND } from '../../../utils/formatters';

interface TourComparisonModalProps {
  tours: Tour[];
  onRemoveTour: (tourId: string) => void;
  onBookTour: (tourId: string) => void;
  onClose: () => void;
}

export const TourComparisonModal: React.FC<TourComparisonModalProps> = ({
  tours,
  onRemoveTour,
  onBookTour,
  onClose
}) => {
  if (tours.length === 0) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '980px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ padding: '1.75rem 1.5rem' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <span className="badge badge-emerald">Bảng So Sánh Đối Chiếu</span>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', margin: '0.3rem 0 0.2rem' }}>
              So Sánh Chi Tiết {tours.length} Hành Trình
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Đối chiếu trực quan mức giá trọn gói, tiêu chuẩn khách sạn và quyền lợi dịch vụ.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', width: '180px', textAlign: 'left' }}>Tiêu Chí</th>
                  {tours.map(t => (
                    <th key={t.id} style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span className="badge badge-nature">{t.code}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveTour(t.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Bỏ khỏi so sánh"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      <img src={t.image} alt={t.title} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} />
                      <strong style={{ fontSize: '0.92rem', color: '#111827', display: 'block', lineHeight: 1.4 }}>{t.shortTitle || t.title}</strong>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Giá trọn gói</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 800, color: 'var(--accent-forest)', fontSize: '1.1rem' }}>
                      {formatCurrencyVND(t.priceAdult)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Thời lượng</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {t.durationDays} Ngày {t.durationNights} Đêm
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Hạng sao & Khách sạn</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'var(--accent-forest)', color: '#fff' }}>
                        {t.hotelTier || `${t.starRating}★`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Điểm đến</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {t.destination}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Điểm nổi bật</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', textAlign: 'left' }}>
                      <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                        {t.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}>Thao tác</td>
                  {tours.map(t => (
                    <td key={t.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          onClose();
                          onBookTour(t.id);
                        }}
                      >
                        Đặt Tour Này
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

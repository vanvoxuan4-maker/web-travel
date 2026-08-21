import React, { useState } from 'react';
import { Tour, TourTier } from '../../types/tour.types';

interface EditTourModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTour: (updatedTour: Tour) => Promise<void>;
}

export const EditTourModal: React.FC<EditTourModalProps> = ({
  tour,
  isOpen,
  onClose,
  onSaveTour
}) => {
  if (!isOpen || !tour) return null;

  const [title, setTitle] = useState(tour.title);
  const [code, setCode] = useState(tour.code);
  const [destination, setDestination] = useState(tour.destination);
  const [departureFrom, setDepartureFrom] = useState(tour.departureFrom || 'Hà Nội / TP.HCM');
  const [category, setCategory] = useState<'domestic' | 'international'>(tour.category || 'domestic');
  const [tier, setTier] = useState<TourTier>(tour.tier || 'standard');
  const [durationDays, setDurationDays] = useState(tour.durationDays || 4);
  const [durationNights, setDurationNights] = useState(tour.durationNights || 3);
  const [priceAdult, setPriceAdult] = useState(tour.priceAdult);
  const [priceChild, setPriceChild] = useState(tour.priceChild || Math.round(tour.priceAdult * 0.75));
  const [priceInfant, setPriceInfant] = useState(tour.priceInfant || 500000);
  const [seatsLeft, setSeatsLeft] = useState(tour.seatsLeft || 8);
  const [image, setImage] = useState(tour.image || '');
  const [badge, setBadge] = useState(tour.badge || 'Bán Chạy');
  const [hotelName, setHotelName] = useState(tour.hotelSpecs?.hotelName || 'Khách sạn 4★ tiêu chuẩn');
  const [roomType, setRoomType] = useState(tour.hotelSpecs?.roomType || 'Phòng Deluxe (2 khách/phòng)');
  const [highlightsStr, setHighlightsStr] = useState(tour.highlights ? tour.highlights.join('\n') : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const starRating = tier === 'luxury' ? 5 : tier === 'standard' ? 4 : 3;
      const hotelTier = tier === 'luxury' ? 'Resort 5★' : tier === 'standard' ? 'Khách Sạn 4★' : 'Khách Sạn 3★';
      const tierName = tier === 'luxury' ? 'Dòng Luxury' : tier === 'standard' ? 'Dòng Tiêu Chuẩn' : 'Dòng Tiết Kiệm';

      const updatedHighlights = highlightsStr
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updatedTourObj: Tour = {
        ...tour,
        title: title.trim(),
        shortTitle: title.trim(),
        code: code.trim().toUpperCase(),
        destination: destination.trim(),
        departureFrom: departureFrom.trim(),
        category,
        tier,
        starCategory: tier,
        starRating,
        hotelTier,
        tierName,
        durationDays: Number(durationDays),
        durationNights: Number(durationNights),
        priceAdult: Number(priceAdult),
        priceChild: Number(priceChild),
        priceInfant: Number(priceInfant),
        seatsLeft: Number(seatsLeft),
        image: image.trim() || tour.image,
        badge: badge.trim(),
        hotelSpecs: {
          hotelName: hotelName.trim(),
          roomType: roomType.trim(),
          inclusions: tour.hotelSpecs?.inclusions || ['Buffet sáng', 'Wifi miễn phí']
        },
        highlights: updatedHighlights.length > 0 ? updatedHighlights : tour.highlights
      };

      await onSaveTour(updatedTourObj);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                MÃ: {tour.code}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Chỉnh Sửa Chi Tiết Tour Lữ Hành
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
              Cập nhật toàn bộ thông tin giá vé, khách sạn, điểm đến và lịch trình
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
            {/* Title & Code */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Tên Tour Lữ Hành *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Grid 3 cols: Code, Destination, DepartureFrom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mã Tour (Code)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Điểm Đến
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Khởi Hành Từ
                </label>
                <input
                  type="text"
                  value={departureFrom}
                  onChange={(e) => setDepartureFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Grid 4 cols: Category, Hotel Tier, Duration Days, Duration Nights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Phân Loại Tour
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="domestic">Trong Nước</option>
                  <option value="international">Quốc Tế</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Hạng Khách Sạn
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as TourTier)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="luxury">5★ Luxury Resort</option>
                  <option value="standard">4★ Phổ Thông</option>
                  <option value="budget">3★ Tiết Kiệm</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Số Ngày
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Số Đêm
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={durationNights}
                  onChange={(e) => setDurationNights(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Grid 4 cols: Price Adult, Price Child, Price Infant, Seats Left */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Giá Người Lớn (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  step={100000}
                  value={priceAdult}
                  onChange={(e) => setPriceAdult(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#047857',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Giá Trẻ Em (VNĐ)
                </label>
                <input
                  type="number"
                  step={100000}
                  value={priceChild}
                  onChange={(e) => setPriceChild(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Giá Em Bé &lt;2 tuổi
                </label>
                <input
                  type="number"
                  step={100000}
                  value={priceInfant}
                  onChange={(e) => setPriceInfant(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Số Chỗ Còn Lại
                </label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={seatsLeft}
                  onChange={(e) => setSeatsLeft(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Grid 2 cols: Image URL, Badge */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Link Ảnh Bìa (Image URL)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Huy Hiệu (Badge)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Bán Chạy / Mới"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Grid 2 cols: Hotel Name & Room Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Tên Khách Sạn Dự Kiến
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Tiêu Chuẩn Phòng
                </label>
                <input
                  type="text"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Highlights */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Điểm Nổi Bật Chuyến Đi (Mỗi dòng 1 điểm nhấn)
              </label>
              <textarea
                rows={3}
                value={highlightsStr}
                onChange={(e) => setHighlightsStr(e.target.value)}
                placeholder="Ví dụ:
Trải nghiệm du thuyền 5 sao đẳng cấp
Thưởng thức hải sản tươi sống tại vịnh
Xe Limousine đưa đón tận nơi"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.4,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.5rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang lưu thay đổi...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Lưu Toàn Bộ Thay Đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

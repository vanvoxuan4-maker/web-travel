import React, { useState, useMemo } from 'react';
import { Tour, TourCategory, TourTier, DepartureDate } from '../../types/tour.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { EditTourModal } from '../modals/EditTourModal';
import { ManageScheduleModal } from '../modals/ManageScheduleModal';
import { DeleteTourModal } from '../modals/DeleteTourModal';

interface ToursModuleProps {
  tours: Tour[];
  onOpenAddTour: () => void;
  onOpenEditPrice: (tour: Tour) => void;
  onSaveTour: (updatedTour: Tour) => Promise<void>;
  onUpdateSchedule: (tourId: string, updatedDates: DepartureDate[]) => Promise<void>;
  onToggleTourActive: (tourId: string, currentStatus: boolean) => Promise<void>;
  onDeleteTour: (tourId: string) => Promise<void>;
}

export const ToursModule: React.FC<ToursModuleProps> = ({
  tours,
  onOpenAddTour,
  onOpenEditPrice,
  onSaveTour,
  onUpdateSchedule,
  onToggleTourActive,
  onDeleteTour
}) => {
  // Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<TourCategory>('all');
  const [filterTier, setFilterTier] = useState<TourTier | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [schedulingTour, setSchedulingTour] = useState<Tour | null>(null);
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);

  // Filtered Tours List
  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      // 1. Keyword search
      const matchesKeyword =
        !searchKeyword ||
        t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.code.toLowerCase().includes(searchKeyword.toLowerCase());

      // 2. Category
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

      // 3. Tier
      const matchesTier = filterTier === 'all' || t.tier === filterTier || t.starCategory === filterTier;

      // 4. Status
      const isActive = t.isActive !== false;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && isActive) ||
        (filterStatus === 'inactive' && !isActive);

      return matchesKeyword && matchesCategory && matchesTier && matchesStatus;
    });
  }, [tours, searchKeyword, filterCategory, filterTier, filterStatus]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Kho Tour Lữ Hành &amp; Bảng Giá
            </h3>
            <span
              style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '20px'
              }}
            >
              {filteredTours.length} / {tours.length} Hành Trình
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý toàn diện sản phẩm: Sửa chi tiết, cập nhật lịch khởi hành từng ngày, ẩn/mở bán và bảng giá
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddTour}
          style={{
            padding: '0.65rem 1.25rem',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
          }}
        >
          <i className="fa-solid fa-plus"></i> Thêm Tour Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}
          ></i>
          <input
            type="text"
            placeholder="Tìm theo tên tour, mã tour hoặc điểm đến..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              background: '#ffffff',
              color: '#334155',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">🌍 Tất cả phân loại</option>
            <option value="domestic">🇻🇳 Trong Nước</option>
            <option value="international">✈️ Quốc Tế</option>
          </select>
        </div>

        {/* Star Tier Filter */}
        <div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              background: '#ffffff',
              color: '#334155',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">⭐ Tất cả hạng sao</option>
            <option value="luxury">5★ Luxury Resort</option>
            <option value="standard">4★ Phổ Thông</option>
            <option value="budget">3★ Tiết Kiệm</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              background: '#ffffff',
              color: '#334155',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">🔘 Tất cả trạng thái</option>
            <option value="active">🟢 Đang Mở Bán</option>
            <option value="inactive">⚪ Tạm Dừng / Ẩn</option>
          </select>
        </div>
      </div>

      {/* Tours Table */}
      {filteredTours.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="fa-solid fa-map-location-dot" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
          <p style={{ fontWeight: 600 }}>Không tìm thấy tour du lịch nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Hình Ảnh</th>
                <th style={{ padding: '0.75rem 1rem' }}>Thông Tin Tour</th>
                <th style={{ padding: '0.75rem 1rem' }}>Điểm Đến</th>
                <th style={{ padding: '0.75rem 1rem' }}>Hạng Sao</th>
                <th style={{ padding: '0.75rem 1rem' }}>Giá Người Lớn</th>
                <th style={{ padding: '0.75rem 1rem' }}>Lịch Khởi Hành</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trạng Thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody>
              {filteredTours.map((t) => {
                const isActive = t.isActive !== false;
                const departureCount = t.departureDates?.length || t.availableDates?.length || 0;

                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      opacity: isActive ? 1 : 0.65,
                      background: isActive ? 'transparent' : '#f8fafc'
                    }}
                  >
                    {/* Image */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <img
                        src={t.image}
                        alt={t.title}
                        style={{ width: '65px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                    </td>

                    {/* Title & Code */}
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{t.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {t.code}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {t.durationDays}N{t.durationNights}Đ • Đi từ {t.departureFrom || 'Hà Nội / HCM'}
                        </span>
                      </div>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>
                      <div>{t.destination}</div>
                      <span style={{ fontSize: '0.72rem', color: t.category === 'domestic' ? '#047857' : '#2563eb', fontWeight: 700 }}>
                        {t.category === 'domestic' ? 'Trong Nước' : 'Quốc Tế'}
                      </span>
                    </td>

                    {/* Star Tier */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: t.tier === 'luxury' ? '#fef3c7' : t.tier === 'standard' ? '#ecfdf5' : '#f1f5f9',
                          color: t.tier === 'luxury' ? '#b45309' : t.tier === 'standard' ? '#047857' : '#475569',
                          border: t.tier === 'luxury' ? '1px solid #fde68a' : t.tier === 'standard' ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                        }}
                      >
                        {t.hotelTier || (t.tier === 'luxury' ? 'Resort 5★' : t.tier === 'standard' ? 'Khách Sạn 4★' : 'Khách Sạn 3★')}
                      </span>
                    </td>

                    {/* Price Adult */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.95rem' }}>
                        {formatCurrencyVND(t.priceAdult)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenEditPrice(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.74rem',
                          color: '#64748b',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          marginTop: '0.15rem'
                        }}
                      >
                        Đổi giá nhanh
                      </button>
                    </td>

                    {/* Departure Dates & Seats Manager */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        onClick={() => setSchedulingTour(t)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <i className="fa-solid fa-calendar-days"></i>
                        <span>{departureCount} Ngày Khởi Hành</span>
                      </button>
                    </td>

                    {/* Active Status Toggle */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        onClick={() => onToggleTourActive(t.id, isActive)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isActive ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#047857' : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isActive ? '#10b981' : '#94a3b8'
                          }}
                        />
                        <span>{isActive ? 'Mở Bán' : 'Tạm Ẩn'}</span>
                      </button>
                    </td>

                    {/* Actions: Edit Full, Schedule, Delete */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Full Edit */}
                        <button
                          type="button"
                          onClick={() => setEditingTour(t)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            background: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Chỉnh sửa toàn bộ thông tin tour"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          <span>Sửa</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingTour(t)}
                          style={{
                            padding: '0.35rem 0.55rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Xóa tour khỏi hệ thống"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {editingTour && (
        <EditTourModal
          key={editingTour.id}
          tour={editingTour}
          isOpen={!!editingTour}
          onClose={() => setEditingTour(null)}
          onSaveTour={onSaveTour}
        />
      )}

      {schedulingTour && (
        <ManageScheduleModal
          tour={schedulingTour}
          isOpen={!!schedulingTour}
          onClose={() => setSchedulingTour(null)}
          onUpdateSchedule={onUpdateSchedule}
        />
      )}

      {deletingTour && (
        <DeleteTourModal
          tour={deletingTour}
          isOpen={!!deletingTour}
          onClose={() => setDeletingTour(null)}
          onConfirmDelete={onDeleteTour}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Tour, TourCategory, TourTier, DepartureDate } from '../../types/tour.types';
import { formatCurrencyVND } from '../../utils/formatters';
import { removeVietnameseTones } from '../../utils/formatters';
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
      // 1. Keyword search (Hỗ trợ tiếng Việt không dấu)
      if (searchKeyword.trim()) {
        const cleanKw = removeVietnameseTones(searchKeyword.toLowerCase().trim());
        const cleanTitle = removeVietnameseTones((t.title || '').toLowerCase());
        const cleanDest = removeVietnameseTones((t.destination || '').toLowerCase());
        const cleanCode = removeVietnameseTones((t.code || '').toLowerCase());

        const matches = cleanTitle.includes(cleanKw) || cleanDest.includes(cleanKw) || cleanCode.includes(cleanKw);
        if (!matches) return false;
      }

      // 2. Category
      if (filterCategory !== 'all' && t.category !== filterCategory) {
        return false;
      }

      // 3. Tier
      if (filterTier !== 'all' && t.tier !== filterTier && t.starCategory !== filterTier) {
        return false;
      }

      // 4. Status
      const isActive = t.isActive !== false;
      if (filterStatus === 'active' && !isActive) return false;
      if (filterStatus === 'inactive' && isActive) return false;

      return true;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Kho Tour Lữ Hành &amp; Bảng Giá
            </h3>
            <span
              style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: '20px'
              }}
            >
              {filteredTours.length} / {tours.length} Tour
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
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
          }}
        >
          <i className="fa-solid fa-plus" /> Thêm Tour Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
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
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.82rem' }}
          />
          <input
            type="text"
            placeholder="Tìm theo tên tour, mã tour hoặc điểm đến..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.3rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
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
          <i className="fa-solid fa-map-location-dot" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Không tìm thấy tour du lịch nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Tour &amp; Lộ Trình</th>
                <th style={{ padding: '0.85rem 1rem' }}>Phân Loại</th>
                <th style={{ padding: '0.85rem 1rem' }}>Giá Người Lớn</th>
                <th style={{ padding: '0.85rem 1rem' }}>Lịch Khởi Hành</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Thao Tác</th>
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
                      borderBottom: '1px solid #f1f5f9',
                      opacity: isActive ? 1 : 0.65,
                      background: isActive ? 'transparent' : '#f8fafc',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Cột 1: Hình Ảnh + Tên Tour + Mã Tour */}
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '320px' }}>
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        <img
                          src={t.image}
                          alt={t.title}
                          style={{
                            width: '68px',
                            height: '52px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#0f172a',
                              lineHeight: 1.35,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, background: '#ecfdf5', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                              {t.code}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {t.durationDays}N{t.durationNights}Đ • {t.destination}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Phân Loại & Tiêu Chuẩn */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: t.category === 'domestic' ? '#f0fdf4' : '#eff6ff',
                            color: t.category === 'domestic' ? '#047857' : '#1d4ed8',
                            border: t.category === 'domestic' ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                          }}
                        >
                          {t.category === 'domestic' ? '🇻🇳 Trong Nước' : '✈️ Quốc Tế'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: t.tier === 'luxury' ? '#fef3c7' : '#f8fafc',
                            color: t.tier === 'luxury' ? '#b45309' : '#475569',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {t.hotelTier || (t.tier === 'luxury' ? '⭐ 5★ Luxury' : t.tier === 'standard' ? '4★ Phổ Thông' : '3★ Tiết Kiệm')}
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Giá Người Lớn */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 900, color: '#047857', fontSize: '1rem' }}>
                        {formatCurrencyVND(t.priceAdult)}
                      </div>
                      {t.priceChild && t.priceChild > 0 ? (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
                          Trẻ em: {formatCurrencyVND(t.priceChild)}
                        </div>
                      ) : null}
                    </td>

                    {/* Cột 4: Lịch Khởi Hành */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        onClick={() => setSchedulingTour(t)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s'
                        }}
                        title="Bấm để xem và quản lý ngày khởi hành"
                      >
                        <i className="fa-regular fa-calendar-days" style={{ color: '#047857' }} />
                        <span>{departureCount} Ngày Đi</span>
                      </button>
                    </td>

                    {/* Cột 5: Trạng Thái Toggle */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onToggleTourActive(t.id, isActive)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: isActive ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#047857' : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                        title={isActive ? 'Bấm để Tạm Ẩn tour' : 'Bấm để Mở Bán lại'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isActive ? '#10b981' : '#94a3b8'
                          }}
                        />
                        <span>{isActive ? 'MỞ BÁN' : 'TẠM ẨN'}</span>
                      </button>
                    </td>

                    {/* Cột 6: Thao Tác Gọn Gàng (Icon Action Group) */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                        
                        {/* 1. Sửa Toàn Bộ Thông Tin */}
                        <button
                          type="button"
                          onClick={() => setEditingTour(t)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#047857',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          title="Chỉnh sửa toàn bộ thông tin tour"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                        </button>

                        {/* 2. Quản Lý Lịch Khởi Hành */}
                        <button
                          type="button"
                          onClick={() => setSchedulingTour(t)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          title="Quản lý lịch khởi hành & số chỗ còn nhận"
                        >
                          <i className="fa-solid fa-calendar-plus" />
                        </button>

                        {/* 3. Đổi Giá Nhanh */}
                        <button
                          type="button"
                          onClick={() => onOpenEditPrice(t)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#d97706',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          title="Cập nhật nhanh giá người lớn, trẻ em & phụ thu"
                        >
                          <i className="fa-solid fa-tags" />
                        </button>

                        {/* 4. Xóa Tour */}
                        <button
                          type="button"
                          onClick={() => setDeletingTour(t)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          title="Xóa tour khỏi hệ thống"
                        >
                          <i className="fa-solid fa-trash-can" />
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
          key={schedulingTour.id}
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

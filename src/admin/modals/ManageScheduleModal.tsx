import React, { useState } from 'react';
import { Tour, DepartureDate } from '../../types/tour.types';

interface ManageScheduleModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSchedule: (tourId: string, updatedDates: DepartureDate[]) => Promise<void>;
}

export const ManageScheduleModal: React.FC<ManageScheduleModalProps> = ({
  tour,
  isOpen,
  onClose,
  onUpdateSchedule
}) => {
  if (!isOpen || !tour) return null;

  const [datesList, setDatesList] = useState<DepartureDate[]>(() => {
    if (tour.departureDates && tour.departureDates.length > 0) {
      return [...tour.departureDates];
    }
    return (tour.availableDates || ['15/09/2026', '22/09/2026', '29/09/2026']).map((d) => ({
      date: d,
      seats: tour.seatsLeft || 8,
      priceAdult: tour.priceAdult,
      label: null
    }));
  });

  // New departure date form state
  const [newDate, setNewDate] = useState('');
  const [newSeats, setNewSeats] = useState(10);
  const [newPrice, setNewPrice] = useState(tour.priceAdult);
  const [newLabel, setNewLabel] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddDate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedDate = newDate.trim();
    if (!trimmedDate) {
      setFormError('Vui lòng nhập ngày khởi hành.');
      return;
    }

    // Check duplicate date
    if (datesList.some((d) => d.date === trimmedDate)) {
      setFormError(`Ngày khởi hành ${trimmedDate} đã tồn tại trong danh sách.`);
      return;
    }

    const newEntry: DepartureDate = {
      date: trimmedDate,
      seats: Number(newSeats) || 10,
      priceAdult: Number(newPrice) || tour.priceAdult,
      label: newLabel.trim() || null
    };

    setDatesList([...datesList, newEntry]);
    setNewDate('');
    setNewLabel('');
  };

  const handleRemoveDate = (indexToRemove: number) => {
    setDatesList(datesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSeatsChange = (index: number, val: number) => {
    const updated = [...datesList];
    updated[index].seats = Math.max(0, val);
    setDatesList(updated);
  };

  const handlePriceChange = (index: number, val: number) => {
    const updated = [...datesList];
    updated[index].priceAdult = Math.max(0, val);
    setDatesList(updated);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onUpdateSchedule(tour.id, datesList);
      onClose();
    } finally {
      setIsSaving(false);
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
          maxWidth: '680px',
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
                Quản Lý Lịch Khởi Hành &amp; Tồn Chỗ
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '520px' }}>
              {tour.title}
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {/* Add New Date Form */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-calendar-plus" style={{ color: '#047857' }}></i>
              <span>Mở Thêm Ngày Khởi Hành Mới</span>
            </div>

            <form onSubmit={handleAddDate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr auto', gap: '0.6rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Ngày Đi (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 15/10/2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Số Chỗ Nhận
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={newSeats}
                    onChange={(e) => setNewSeats(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Giá Vé Ngày Đó (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    step={100000}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      outline: 'none',
                      fontWeight: 700,
                      color: '#047857',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Nhãn Tag
                  </label>
                  <input
                    type="text"
                    placeholder="Hot / Mới"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    height: '35px'
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Thêm
                </button>
              </div>

              {formError && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-exclamation"></i> {formError}
                </div>
              )}
            </form>
          </div>

          {/* Current Dates Schedule Table */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                Danh Sách Ngày Khởi Hành Hiện Có ({datesList.length} Ngày)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                * Thay đổi số chỗ hoặc giá trực tiếp trong bảng
              </span>
            </div>

            {datesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                Chưa có ngày khởi hành nào được thiết lập. Hãy thêm ngày ở trên.
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.9rem' }}>Ngày Đi</th>
                      <th style={{ padding: '0.65rem 0.9rem' }}>Số Chỗ Còn</th>
                      <th style={{ padding: '0.65rem 0.9rem' }}>Giá Người Lớn</th>
                      <th style={{ padding: '0.65rem 0.9rem' }}>Nhãn Tag</th>
                      <th style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datesList.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0f172a' }}>
                          <i className="fa-solid fa-calendar-day" style={{ color: '#059669', marginRight: '0.4rem' }}></i>
                          {item.date}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.seats}
                            onChange={(e) => handleSeatsChange(idx, Number(e.target.value))}
                            style={{
                              width: '70px',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: item.seats <= 3 ? '#dc2626' : '#0f172a',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <input
                            type="number"
                            step={100000}
                            value={item.priceAdult}
                            onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                            style={{
                              width: '120px',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: '#047857',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          {item.label ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {item.label}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveDate(idx)}
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: 'none',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Xóa ngày này"
                          >
                            <i className="fa-solid fa-trash-can" style={{ fontSize: '0.75rem' }}></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            disabled={isSaving}
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
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
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
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Đang lưu lịch trình...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Lưu &amp; Cập Nhật Lịch Trình</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

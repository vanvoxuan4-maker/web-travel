import React, { useState, useMemo } from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND, removeVietnameseTones } from '../../utils/formatters';

interface DebtDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  onConfirmFullPayment?: (bookingId: string) => Promise<void>;
  onNavigateToBooking?: (bookingCode: string) => void;
}

export const DebtDetailModal: React.FC<DebtDetailModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onConfirmFullPayment,
  onNavigateToBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'unpaid'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Lọc các đơn còn công nợ (status khác cancelled và tổng tiền > tiền đã trả)
  const debtList = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.status === 'cancelled') return false;
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.paidAmount) || 0;
        const remaining = total - paid;
        return remaining > 0;
      })
      .map((b) => {
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.paidAmount) || 0;
        const remaining = total - paid;
        const isDeposit = b.status === 'deposit' || (paid > 0 && paid < total);

        // Tính khoảng cách ngày khởi hành nếu có
        let daysUntilDeparture: number | null = null;
        if (b.departureDate) {
          try {
            // Hỗ trợ dạng YYYY-MM-DD hoặc DD/MM/YYYY
            let depDate: Date | null = null;
            if (b.departureDate.includes('-')) {
              depDate = new Date(b.departureDate);
            } else if (b.departureDate.includes('/')) {
              const parts = b.departureDate.split('/');
              if (parts.length === 3) {
                depDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              }
            }
            if (depDate && !isNaN(depDate.getTime())) {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const diffMs = depDate.getTime() - now.getTime();
              daysUntilDeparture = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }
          } catch {
            daysUntilDeparture = null;
          }
        }

        return {
          ...b,
          remainingAmount: remaining,
          isDeposit,
          daysUntilDeparture
        };
      })
      // Sắp xếp đơn có ngày khởi hành gần nhất lên đầu
      .sort((a, b) => {
        if (a.daysUntilDeparture !== null && b.daysUntilDeparture !== null) {
          return a.daysUntilDeparture - b.daysUntilDeparture;
        }
        return b.remainingAmount - a.remainingAmount;
      });
  }, [bookings]);

  // 2. Tìm kiếm & Lọc
  const filteredList = useMemo(() => {
    return debtList.filter((item) => {
      // Filter type
      if (filterType === 'deposit' && !item.isDeposit) return false;
      if (filterType === 'unpaid' && item.isDeposit) return false;

      // Search Query
      if (searchQuery.trim()) {
        const cleanQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
        const code = removeVietnameseTones((item.bookingCode || item.id || '').toLowerCase());
        const name = removeVietnameseTones((item.customerName || '').toLowerCase());
        const phone = (item.phone || '').toLowerCase();
        const tour = removeVietnameseTones((item.tourTitle || '').toLowerCase());

        const matches =
          code.includes(cleanQuery) ||
          name.includes(cleanQuery) ||
          phone.includes(cleanQuery) ||
          tour.includes(cleanQuery);

        if (!matches) return false;
      }

      return true;
    });
  }, [debtList, searchQuery, filterType]);

  // Thống kê tổng quan
  const totalRemainingSum = useMemo(() => {
    return debtList.reduce((sum, item) => sum + item.remainingAmount, 0);
  }, [debtList]);

  const urgentCount = useMemo(() => {
    return debtList.filter((item) => item.daysUntilDeparture !== null && item.daysUntilDeparture >= 0 && item.daysUntilDeparture <= 7).length;
  }, [debtList]);

  if (!isOpen) return null;

  const handleFullPay = async (bookingId: string) => {
    if (!onConfirmFullPayment) return;
    if (window.confirm('Xác nhận khách hàng đã nộp đủ 100% số tiền còn lại cho đơn này?')) {
      setProcessingId(bookingId);
      try {
        await onConfirmFullPayment(bookingId);
      } finally {
        setProcessingId(null);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1180px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                border: '1.5px solid #fecaca'
              }}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                  Sổ Theo Dõi Công Nợ Khách Hàng
                </h2>
                <span
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '20px'
                  }}
                >
                  {debtList.length} đơn cần thu
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Danh sách chi tiết các đơn đặt tour chưa thanh toán đủ, hỗ trợ gọi điện &amp; nhắn Zalo nhắc nợ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: 'none',
              background: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* SUMMARY STATS STRIP */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            padding: '1rem 2rem',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #fee2e2' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tổng Tiền Công Nợ Cần Thu
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem' }}>
              {formatCurrencyVND(totalRemainingSum)}
            </div>
          </div>

          <div style={{ background: '#fffbeb', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Khởi Hành Trong 7 Ngày Tới
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#d97706', marginTop: '0.2rem' }}>
              {urgentCount} Đơn <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>(Cần giục thu gấp)</span>
            </div>
          </div>

          <div style={{ background: '#eff6ff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Đã Đặt Cọc 50%
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2563eb', marginTop: '0.2rem' }}>
              {debtList.filter((d) => d.isDeposit).length} Đơn <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6' }}>(Còn nợ nửa tiền)</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div
          style={{
            padding: '1rem 2rem',
            background: '#fafafa',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            ></i>
            <input
              type="text"
              placeholder="Tìm theo tên khách, số điện thoại, mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: filterType === 'all' ? '#0f172a' : '#e2e8f0',
                color: filterType === 'all' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Tất cả ({debtList.length})
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: filterType === 'deposit' ? '#d97706' : '#e2e8f0',
                color: filterType === 'deposit' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đã cọc 50% ({debtList.filter((d) => d.isDeposit).length})
            </button>
            <button
              onClick={() => setFilterType('unpaid')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: filterType === 'unpaid' ? '#dc2626' : '#e2e8f0',
                color: filterType === 'unpaid' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Chưa trả đồng nào ({debtList.filter((d) => !d.isDeposit).length})
            </button>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem' }}>
          {filteredList.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem' }}>
                Không có công nợ nào cần thu!
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Tất cả khách hàng đã thanh toán đủ 100% hoặc không tìm thấy kết quả phù hợp.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.9rem 0.75rem' }}>Mã Đơn / Khách</th>
                  <th style={{ padding: '0.9rem 0.75rem' }}>Liên Hệ Nhắc Nợ</th>
                  <th style={{ padding: '0.9rem 0.75rem' }}>Tour &amp; Ngày Đi</th>
                  <th style={{ padding: '0.9rem 0.75rem', textAlign: 'right' }}>Tổng Tiền</th>
                  <th style={{ padding: '0.9rem 0.75rem', textAlign: 'right' }}>Đã Trả</th>
                  <th style={{ padding: '0.9rem 0.75rem', textAlign: 'right' }}>CÒN THIẾU</th>
                  <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const cleanPhone = item.phone.replace(/\D/g, '');
                  const isUrgent = item.daysUntilDeparture !== null && item.daysUntilDeparture >= 0 && item.daysUntilDeparture <= 7;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                        background: isUrgent ? 'rgba(254, 243, 199, 0.25)' : 'transparent'
                      }}
                    >
                      {/* CỘT 1: MÃ ĐƠN & KHÁCH HÀNG */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                            {item.bookingCode}
                          </span>
                          {item.isDeposit ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.66rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '6px' }}>
                              ĐÃ CỌC 50%
                            </span>
                          ) : (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.66rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '6px' }}>
                              CHƯA TRẢ
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
                          {item.customerName}
                        </div>
                        {item.email && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {item.email}
                          </div>
                        )}
                      </td>

                      {/* CỘT 2: LIÊN HỆ & NÚT GỌI / ZALO */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.phone || 'Chưa có SĐT'}
                        </div>
                        {cleanPhone && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                            <a
                              href={`tel:${cleanPhone}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              <i className="fa-solid fa-phone"></i> Gọi
                            </a>
                            <a
                              href={`https://zalo.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              <i className="fa-solid fa-comment-dots"></i> Zalo
                            </a>
                          </div>
                        )}
                      </td>

                      {/* CỘT 3: TOUR & HẠN KHỞI HÀNH */}
                      <td style={{ padding: '1rem 0.75rem', maxWidth: '240px' }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={item.tourTitle}
                        >
                          {item.tourTitle}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.76rem', color: '#475569' }}>
                            📅 {item.departureDate}
                          </span>
                          {item.daysUntilDeparture !== null && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                background: item.daysUntilDeparture <= 3 ? '#fee2e2' : item.daysUntilDeparture <= 7 ? '#fef3c7' : '#f1f5f9',
                                color: item.daysUntilDeparture <= 3 ? '#dc2626' : item.daysUntilDeparture <= 7 ? '#d97706' : '#64748b'
                              }}
                            >
                              {item.daysUntilDeparture < 0
                                ? 'Đã khởi hành'
                                : item.daysUntilDeparture === 0
                                ? 'Hôm nay đi'
                                : `Còn ${item.daysUntilDeparture} ngày`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CỘT 4: TỔNG TIỀN */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '0.88rem' }}>
                        {formatCurrencyVND(item.totalAmount)}
                      </td>

                      {/* CỘT 5: ĐÃ TRẢ */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>
                        {formatCurrencyVND(item.paidAmount || 0)}
                      </td>

                      {/* CỘT 6: CÒN THIẾU CẦN THU */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                          {formatCurrencyVND(item.remainingAmount)}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 600 }}>
                          Cần thu trước ngày đi
                        </span>
                      </td>

                      {/* CỘT 7: NÚT THAO TÁC */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                          {onConfirmFullPayment && (
                            <button
                              onClick={() => handleFullPay(item.id)}
                              disabled={processingId === item.id}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
                              }}
                            >
                              <i className="fa-solid fa-check"></i> Thu Đủ 100%
                            </button>
                          )}
                          {onNavigateToBooking && (
                            <button
                              onClick={() => {
                                onClose();
                                onNavigateToBooking(item.bookingCode);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Chi tiết đơn
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Hiển thị <strong>{filteredList.length}</strong> / <strong>{debtList.length}</strong> đơn còn nợ
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};

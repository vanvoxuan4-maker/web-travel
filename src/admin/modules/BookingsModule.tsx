import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND, removeVietnameseTones } from '../../utils/formatters';
import { ETicketModal } from '../../user/components/profile/ETicketModal';
import { DeleteBookingModal } from '../modals/DeleteBookingModal';
import { BookingPayload } from '../../services/bookingService';
import { exportBookingsToCSV } from '../../utils/exportUtils';

interface BookingsModuleProps {
  bookings: BookingRecord[];
  onStatusChange: (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => Promise<void>;
  onDeleteBookings?: (bookingIds: string[]) => Promise<{ success: boolean; error?: string } | void>;
  canDelete?: boolean;
}

type FilterTab = 'all' | 'pending' | 'deposit' | 'confirmed' | 'cancelled';

export const BookingsModule: React.FC<BookingsModuleProps> = ({
  bookings,
  onStatusChange,
  onDeleteBookings,
  canDelete = true
}) => {
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookingForETicket, setActiveBookingForETicket] = useState<BookingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    bookings: BookingRecord[];
  }>({ isOpen: false, bookings: [] });

  // 1. Calculate KPI Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let confirmedCount = 0;
    let depositCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    bookings.forEach((b) => {
      if (b.status === 'confirmed') {
        totalRevenue += b.totalAmount;
        confirmedCount++;
      } else if (b.status === 'deposit') {
        totalRevenue += (b.paidAmount || Math.round(b.totalAmount * 0.5));
        depositCount++;
      } else if (b.status === 'pending') {
        pendingCount++;
      } else if (b.status === 'cancelled') {
        cancelledCount++;
      }
    });

    return {
      totalRevenue,
      confirmedCount,
      depositCount,
      pendingCount,
      cancelledCount,
      totalCount: bookings.length
    };
  }, [bookings]);

  // 2. Filter & Search Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (selectedTab !== 'all' && b.status !== selectedTab) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const cleanQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
        const code = removeVietnameseTones((b.bookingCode || b.id || '').toLowerCase());
        const name = removeVietnameseTones((b.customerName || '').toLowerCase());
        const phone = (b.phone || '').toLowerCase();
        const email = (b.email || '').toLowerCase();
        const tour = removeVietnameseTones((b.tourTitle || '').toLowerCase());

        const matches =
          code.includes(cleanQuery) ||
          name.includes(cleanQuery) ||
          phone.includes(cleanQuery) ||
          email.includes(cleanQuery) ||
          tour.includes(cleanQuery);

        if (!matches) return false;
      }

      return true;
    });
  }, [bookings, selectedTab, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert for ETicket modal
  const getETicketPayload = (b: BookingRecord): BookingPayload => {
    const isDep = b.status === 'deposit' || b.paymentStatus === 'partially_paid';
    const isConf = b.status === 'confirmed' || b.paymentStatus === 'paid';
    const paidAmt = b.paidAmount || (isConf ? b.totalAmount : isDep ? Math.round(b.totalAmount * 0.5) : 0);

    return {
      bookingCode: b.bookingCode || b.id,
      tourId: b.tourId || 'tour-01',
      tourTitle: b.tourTitle,
      departureDate: b.departureDate,
      customerName: b.customerName,
      customerPhone: b.phone,
      customerEmail: b.email || 'customer@webtravel.vn',
      customerAddress: b.customerAddress || '',
      customerNotes: b.customerNotes || '',
      adultsCount: b.adultsCount || 1,
      childrenCount: b.childrenCount || 0,
      toddlersCount: b.toddlersCount || 0,
      infantsCount: b.infantsCount || 0,
      singleRoomsCount: b.singleRoomsCount || 0,
      totalAmount: b.totalAmount,
      paidAmount: paidAmt,
      couponCode: b.couponCode,
      couponDiscount: b.couponDiscount,
      paymentMethod: (b.paymentMethod as any) || 'vietqr',
      paymentStatus: isDep ? 'partially_paid' : isConf ? 'paid' : (b.paymentStatus || 'pending'),
      bookingStatus: b.bookingStatus || (isConf ? 'confirmed' : 'pending'),
      createdAt: b.createdAt
    };
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    exportBookingsToCSV(filteredBookings);
  };

  // Selection & Batch Delete Helpers
  const isAllSelected = filteredBookings.length > 0 && filteredBookings.every((b) => selectedIds.includes(b.id || b.bookingCode));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map((b) => b.id || b.bookingCode));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBatchDelete = () => {
    const toDelete = bookings.filter((b) => selectedIds.includes(b.id || b.bookingCode));
    if (toDelete.length > 0) {
      setDeleteModalState({ isOpen: true, bookings: toDelete });
    }
  };

  const handleOpenSingleDelete = (booking: BookingRecord) => {
    setDeleteModalState({ isOpen: true, bookings: [booking] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── 1. KPI Metric Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* Doanh thu thực tế */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Doanh Thu Thực Thu</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-wallet" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857' }}>
            {formatCurrencyVND(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
            Từ {stats.confirmedCount + stats.depositCount} đơn thanh toán / cọc
          </div>
        </div>

        {/* Đơn Chờ Xử Lý (Cần đối soát) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Chờ Đối Soát VietQR</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2563eb' }}>
            {stats.pendingCount} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>đơn</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
            Khách đã quét mã hoặc đặt giữ chỗ
          </div>
        </div>

        {/* Đơn Đã Cọc 50% */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Đã Đặt Cọc 50%</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-coins" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#d97706' }}>
            {stats.depositCount} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>đơn</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
            Cần thu nốt trước ngày khởi hành
          </div>
        </div>

        {/* Đã Thanh Toán 100% */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Đã Xong 100%</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              <i className="fa-solid fa-circle-check" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857' }}>
            {stats.confirmedCount} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>đơn</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
            Đã phát hành vé E-Ticket
          </div>
        </div>
      </div>

      {/* ── 2. Table Container & Filter Toolbar ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}
      >
        {/* Header & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Quản Lý Đơn Đặt Tour &amp; Đối Soát VietQR
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
              Theo dõi đối soát thanh toán chuyển khoản, cọc tiền và xuất vé điện tử E-Ticket trực tiếp
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-file-csv" style={{ color: '#047857' }} /> Xuất File Excel / CSV
            </button>
          </div>
        </div>

        {/* Toolbar: Search input + Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất Cả', count: stats.totalCount },
              { id: 'pending', label: 'Chờ Thanh Toán', count: stats.pendingCount },
              { id: 'deposit', label: 'Đã Cọc 50%', count: stats.depositCount },
              { id: 'confirmed', label: 'Đã Thanh Toán 100%', count: stats.confirmedCount },
              { id: 'cancelled', label: 'Đã Hủy', count: stats.cancelledCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id as FilterTab)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: selectedTab === tab.id ? '#ffffff' : 'transparent',
                  color: selectedTab === tab.id ? '#047857' : '#64748b',
                  boxShadow: selectedTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.88rem' }} />
            <input
              type="text"
              placeholder="Tìm mã WT, tên khách, SĐT, tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.4rem',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.86rem',
                outline: 'none',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {/* ── Bulk Actions Banner (Khi có đơn được tick chọn) ── */}
        {selectedIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 1.15rem',
              marginBottom: '1rem',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: '12px',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#dc2626' }} />
                Đã chọn {selectedIds.length} / {filteredBookings.length} đơn hàng
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0 0.25rem'
                }}
              >
                Bỏ chọn tất cả
              </button>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={handleOpenBatchDelete}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
              >
                <i className="fa-solid fa-trash-can" />
                Xóa Cứng ({selectedIds.length} Đơn)
              </button>
            )}
          </div>
        )}

        {/* ── 3. Bookings Table (Compact Pro) ── */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', minWidth: '960px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {canDelete && (
                  <th style={{ padding: '0.65rem 0.65rem', width: '38px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#dc2626' }}
                      title="Chọn tất cả các đơn đang hiển thị"
                    />
                  </th>
                )}
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '160px', whiteSpace: 'nowrap' }}>Mã Đơn / Ngày Tạo</th>
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '170px' }}>Khách Hàng</th>
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '200px' }}>Tour &amp; Ngày Đi</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', minWidth: '85px', whiteSpace: 'nowrap' }}>Số Khách</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>Tổng Tiền</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', minWidth: '125px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', minWidth: '185px', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.5 }} />
                    Không tìm thấy đơn đặt tour nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isChecked = selectedIds.includes(b.id || b.bookingCode);
                  return (
                    <tr
                      key={b.id || b.bookingCode}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                        background: isChecked ? '#fef2f2' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isChecked ? '#fef2f2' : 'transparent';
                      }}
                    >
                      {/* Cột Checkbox chọn đơn */}
                      {canDelete && (
                        <td style={{ padding: '0.65rem 0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(b.id || b.bookingCode)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#dc2626' }}
                            title="Chọn đơn này"
                          />
                        </td>
                      )}
                      
                      {/* Cột 1: Mã Đơn & Ngày tạo (Cố định 1 dòng, chống ngắt gãy chữ) */}
                      <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Link
                            to={`/admin/bookings/${b.bookingCode || b.id}`}
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: '#047857',
                              textDecoration: 'none',
                              letterSpacing: '0.01em'
                            }}
                            title="Bấm để mở trang chi tiết đơn"
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {b.bookingCode || b.id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(b.bookingCode || b.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedId === (b.bookingCode || b.id) ? '#059669' : '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={copiedId === (b.bookingCode || b.id) ? 'Đã sao chép!' : 'Sao chép mã đơn'}
                          >
                            <i className={copiedId === (b.bookingCode || b.id) ? 'fa-solid fa-check text-emerald-600' : 'fa-regular fa-copy'} />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="fa-regular fa-clock" style={{ fontSize: '0.68rem', color: '#94a3b8' }} />
                          {b.createdAt}
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng (Tên + SĐT rõ nét, Email rút gọn chống bung cột) */}
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>{b.customerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem', flexWrap: 'nowrap' }}>
                          <span style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                            <i className="fa-solid fa-phone" style={{ fontSize: '0.65rem' }} />{b.phone}
                          </span>
                          {b.email && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#64748b',
                                maxWidth: '125px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}
                              title={b.email}
                            >
                              • {b.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Tour & Ngày Khởi Hành */}
                      <td style={{ padding: '0.65rem 0.85rem', maxWidth: '230px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.84rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={b.tourTitle}
                        >
                          {b.tourTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <i className="fa-regular fa-calendar" style={{ color: '#047857', fontSize: '0.72rem' }} />
                          <strong>{b.departureDate}</strong>
                        </div>
                      </td>

                      {/* Cột 4: Số khách (Pill nhỏ gọn) */}
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#334155',
                            background: '#f1f5f9',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <i className="fa-solid fa-user-group" style={{ fontSize: '0.65rem', color: '#64748b' }} />
                          {b.paxCount} khách
                        </span>
                      </td>

                      {/* Cột 5: Tổng tiền & Phương thức */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.92rem' }}>
                          {formatCurrencyVND(b.totalAmount)}
                        </div>
                        <div style={{ marginTop: '0.15rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#64748b',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}
                          >
                            {b.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Trạng thái thanh toán (Pill dot tinh tế) */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.22rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background:
                              b.status === 'confirmed'
                                ? '#ecfdf5'
                                : b.status === 'deposit'
                                ? '#fffbeb'
                                : b.status === 'pending'
                                ? '#eff6ff'
                                : '#fef2f2',
                            color:
                              b.status === 'confirmed'
                                ? '#047857'
                                : b.status === 'deposit'
                                ? '#b45309'
                                : b.status === 'pending'
                                ? '#1d4ed8'
                                : '#b91c1c',
                            border:
                              b.status === 'confirmed'
                                ? '1px solid #a7f3d0'
                                : b.status === 'deposit'
                                ? '1px solid #fde68a'
                                : b.status === 'pending'
                                ? '1px solid #bfdbfe'
                                : '1px solid #fecaca'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background:
                                b.status === 'confirmed'
                                  ? '#10b981'
                                  : b.status === 'deposit'
                                  ? '#f59e0b'
                                  : b.status === 'pending'
                                  ? '#3b82f6'
                                  : '#ef4444'
                            }}
                          />
                          {b.status === 'confirmed'
                            ? 'Đã Xong 100%'
                            : b.status === 'deposit'
                            ? 'Đã Cọc 50%'
                            : b.status === 'pending'
                            ? 'Chờ Duyệt'
                            : 'Đã Hủy'}
                        </span>
                      </td>

                      {/* Cột 7: Thao tác (Gọn gàng, không tràn mép bảng) */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Dropdown đổi trạng thái nhanh */}
                          <select
                            value={b.status}
                            onChange={(e) => onStatusChange(b.id, e.target.value as any)}
                            style={{
                              padding: '0.28rem 0.45rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              outline: 'none',
                              cursor: 'pointer',
                              background: '#ffffff',
                              color: '#334155'
                            }}
                            title="Chuyển trạng thái đơn"
                          >
                            <option value="pending">Chờ Duyệt</option>
                            <option value="deposit">Cọc 50%</option>
                            <option value="confirmed">100% Xong</option>
                            <option value="cancelled">Hủy Đơn</option>
                          </select>

                          {/* Nút Xem chi tiết hồ sơ đơn */}
                          <Link
                            to={`/admin/bookings/${b.bookingCode || b.id}`}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#047857',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xem chi tiết hồ sơ & thanh toán"
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dcfce7')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                          </Link>

                          {/* Nút In vé E-Ticket */}
                          <button
                            type="button"
                            onClick={() => setActiveBookingForETicket(b)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xuất vé điện tử E-Ticket QR"
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          >
                            <i className="fa-solid fa-qrcode" style={{ color: '#047857' }} />
                          </button>

                          {/* Nút Xóa Cứng Đơn Hàng */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleOpenSingleDelete(b)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              title="Xóa cứng đơn hàng này vĩnh viễn"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* E-Ticket Printable Modal */}
      {activeBookingForETicket && (
        <ETicketModal
          booking={getETicketPayload(activeBookingForETicket)}
          onClose={() => setActiveBookingForETicket(null)}
        />
      )}

      {/* Hard Delete Confirmation Modal */}
      <DeleteBookingModal
        isOpen={deleteModalState.isOpen}
        bookings={deleteModalState.bookings}
        onClose={() => setDeleteModalState({ isOpen: false, bookings: [] })}
        onConfirmDelete={async (ids) => {
          if (onDeleteBookings) {
            await onDeleteBookings(ids);
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
          }
        }}
      />

    </div>
  );
};

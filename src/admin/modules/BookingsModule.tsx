import React, { useState, useMemo } from 'react';
import { BookingRecord } from '../admin.types';
import { formatCurrencyVND, removeVietnameseTones } from '../../utils/formatters';
import { BookingDetailModal } from '../modals/BookingDetailModal';
import { DeleteBookingModal } from '../modals/DeleteBookingModal';
import { ETicketModal } from '../../user/components/profile/ETicketModal';
import { BookingPayload } from '../../services/bookingService';

interface BookingsModuleProps {
  bookings: BookingRecord[];
  onStatusChange: (bookingId: string, newStatus: 'confirmed' | 'deposit' | 'pending' | 'cancelled') => Promise<void>;
  onDeleteBooking?: (bookingId: string) => Promise<void>;
}

type FilterTab = 'all' | 'pending' | 'deposit' | 'confirmed' | 'cancelled';

export const BookingsModule: React.FC<BookingsModuleProps> = ({
  bookings,
  onStatusChange,
  onDeleteBooking
}) => {
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookingForDetail, setActiveBookingForDetail] = useState<BookingRecord | null>(null);
  const [activeBookingForETicket, setActiveBookingForETicket] = useState<BookingRecord | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<BookingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (filteredBookings.length === 0) {
      alert('Không có dữ liệu để xuất file!');
      return;
    }

    const headers = ['Mã Đơn', 'Khách Hàng', 'Số Điện Thoại', 'Email', 'Tour', 'Ngày Khởi Hành', 'Số Khách', 'Tổng Tiền (VNĐ)', 'Đã Thu (VNĐ)', 'Trạng Thái', 'Ngày Tạo'];
    const rows = filteredBookings.map((b) => [
      `"${b.bookingCode || b.id}"`,
      `"${b.customerName}"`,
      `"${b.phone}"`,
      `"${b.email || ''}"`,
      `"${b.tourTitle.replace(/"/g, '""')}"`,
      `"${b.departureDate}"`,
      b.paxCount,
      b.totalAmount,
      b.paidAmount || (b.status === 'confirmed' ? b.totalAmount : b.status === 'deposit' ? Math.round(b.totalAmount * 0.5) : 0),
      `"${b.status === 'confirmed' ? 'Đã thanh toán 100%' : b.status === 'deposit' ? 'Đã cọc 50%' : b.status === 'pending' ? 'Chờ thanh toán' : 'Đã hủy'}"`,
      `"${b.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WebTravel_DonDatTour_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* ── 3. Bookings Table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Mã Đơn / Ngày Tạo</th>
                <th style={{ padding: '0.85rem 1rem' }}>Khách Hàng</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tour &amp; Ngày Đi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Số Khách</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tổng Tiền</th>
                <th style={{ padding: '0.85rem 1rem' }}>Trạng Thái</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.5 }} />
                    Không tìm thấy đơn đặt tour nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    
                    {/* Mã Đơn & Ngày tạo */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          onClick={() => setActiveBookingForDetail(b)}
                          style={{ fontWeight: 800, color: '#047857', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                          title="Bấm để xem chi tiết đơn"
                        >
                          {b.bookingCode || b.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b.bookingCode || b.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontSize: '0.78rem' }}
                          title="Sao chép mã đơn"
                        >
                          <i className={copiedId === (b.bookingCode || b.id) ? 'fa-solid fa-check text-emerald-600' : 'fa-regular fa-copy'} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {b.createdAt}
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, marginTop: '0.15rem' }}>
                        <i className="fa-solid fa-phone" style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />{b.phone}
                      </div>
                      {b.email && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{b.email}</div>
                      )}
                    </td>

                    {/* Tour & Ngày Khởi Hành */}
                    <td style={{ padding: '1rem', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.tourTitle}>
                        {b.tourTitle}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="fa-regular fa-calendar" style={{ color: '#047857' }} />
                        <strong>{b.departureDate}</strong>
                      </div>
                    </td>

                    {/* Số khách */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', background: '#f8fafc', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                        {b.paxCount} Khách
                      </span>
                    </td>

                    {/* Tổng tiền */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 900, color: '#047857', fontSize: '0.98rem' }}>
                        {formatCurrencyVND(b.totalAmount)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {b.paymentMethod.toUpperCase()}
                      </div>
                    </td>

                    {/* Trạng thái thanh toán */}
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background:
                            b.status === 'confirmed'
                              ? '#ecfdf5'
                              : b.status === 'deposit'
                              ? '#fef3c7'
                              : b.status === 'pending'
                              ? '#eff6ff'
                              : '#fee2e2',
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
                        {b.status === 'confirmed'
                          ? 'ĐÃ XONG 100%'
                          : b.status === 'deposit'
                          ? 'ĐÃ CỌC 50%'
                          : b.status === 'pending'
                          ? 'CHỜ DUYỆT'
                          : 'ĐÃ HỦY'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Chi tiết */}
                        <button
                          type="button"
                          onClick={() => setActiveBookingForDetail(b)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#047857',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Xem hồ sơ & đối soát tiền"
                        >
                          <i className="fa-solid fa-eye" /> Chi Tiết
                        </button>

                        {/* Xuất vé E-Ticket */}
                        <button
                          type="button"
                          onClick={() => setActiveBookingForETicket(b)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="In vé điện tử E-Ticket QR"
                        >
                          <i className="fa-solid fa-qrcode" style={{ color: '#047857' }} /> Vé
                        </button>

                        {/* Quick Select Status */}
                        <select
                          value={b.status}
                          onChange={(e) => onStatusChange(b.id, e.target.value as any)}
                          style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            outline: 'none',
                            cursor: 'pointer',
                            background: '#ffffff'
                          }}
                          title="Chuyển trạng thái nhanh"
                        >
                          <option value="pending">Chờ Duyệt</option>
                          <option value="deposit">Cọc 50%</option>
                          <option value="confirmed">100% Xong</option>
                          <option value="cancelled">Hủy Đơn</option>
                        </select>

                        {/* Xóa Cứng Vĩnh Viễn */}
                        {onDeleteBooking && (
                          <button
                            type="button"
                            onClick={() => setBookingToDelete(b)}
                            style={{
                              padding: '0.35rem 0.55rem',
                              borderRadius: '8px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title="Xóa cứng vĩnh viễn đơn hàng này"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {activeBookingForDetail && (
        <BookingDetailModal
          booking={activeBookingForDetail}
          onClose={() => setActiveBookingForDetail(null)}
          onUpdateStatus={async (id, newSt) => {
            await onStatusChange(id, newSt);
            setActiveBookingForDetail((prev) => (prev && prev.id === id ? { ...prev, status: newSt } : prev));
          }}
          onRequestDelete={(b) => {
            setActiveBookingForDetail(null);
            setBookingToDelete(b);
          }}
        />
      )}

      {/* E-Ticket Printable Modal */}
      {activeBookingForETicket && (
        <ETicketModal
          booking={getETicketPayload(activeBookingForETicket)}
          onClose={() => setActiveBookingForETicket(null)}
        />
      )}

      {/* Delete Booking Confirmation Modal */}
      {bookingToDelete && (
        <DeleteBookingModal
          booking={bookingToDelete}
          isOpen={!!bookingToDelete}
          onClose={() => setBookingToDelete(null)}
          onConfirmDelete={async (id) => {
            if (onDeleteBooking) {
              await onDeleteBooking(id);
            }
            setBookingToDelete(null);
          }}
        />
      )}

    </div>
  );
};

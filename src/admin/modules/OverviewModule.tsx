import React, { useState, useMemo } from 'react';
import { BookingRecord } from '../admin.types';
import { Tour } from '../../types/tour.types';
import { MetricCard } from '../components/MetricCard';
import { formatCurrencyVND } from '../../utils/formatters';
import {
  TimeGranularity,
  getRevenueAndBookingTrends,
  getBookingStatusBreakdown,
  getTopTours,
  getPaymentMethodBreakdown
} from '../utils/chartDataHelpers';
import {
  RevenueLineChart,
  BookingStatusDonut,
  BookingBarChart,
  TopToursBarChart,
  PaymentMethodDonut
} from '../components/charts';
import { DebtDetailModal } from '../modals/DebtDetailModal';

interface OverviewModuleProps {
  bookings: BookingRecord[];
  tours: Tour[];
  customersCount: number;
  onNavigateToBookings: () => void;
  onApproveBooking: (bookingId: string) => Promise<void>;
  onConfirmFullPayment?: (bookingId: string) => Promise<void>;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  bookings,
  tours,
  customersCount,
  onNavigateToBookings,
  onApproveBooking,
  onConfirmFullPayment
}) => {
  // Time granularity filter for trends (day, week, month)
  const [granularity, setGranularity] = useState<TimeGranularity>('month');

  // Computed financial & operational metrics
  const totalOrderValue = useMemo(
    () => bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + (Number(b.totalAmount) || 0) : sum), 0),
    [bookings]
  );

  const totalFullPaid = useMemo(
    () =>
      bookings.reduce(
        (sum, b) => (b.status === 'confirmed' ? sum + (Number(b.totalAmount) || Number(b.paidAmount) || 0) : sum),
        0
      ),
    [bookings]
  );

  const totalDeposit = useMemo(
    () =>
      bookings.reduce(
        (sum, b) => (b.status === 'deposit' ? sum + (Number(b.paidAmount) || 0) : sum),
        0
      ),
    [bookings]
  );

  const totalRemaining = useMemo(
    () =>
      bookings.reduce((sum, b) => {
        if (b.status === 'cancelled') return sum;
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.paidAmount) || 0;
        return sum + Math.max(0, total - paid);
      }, 0),
    [bookings]
  );

  const totalCollected = totalFullPaid + totalDeposit;

  const totalPax = useMemo(
    () => bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + (b.paxCount || 0) : sum), 0),
    [bookings]
  );

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings]
  );

  const activeToursCount = useMemo(
    () => tours.filter((t) => t.isActive !== false).length,
    [tours]
  );

  // Computed chart data
  const trendData = useMemo(
    () => getRevenueAndBookingTrends(bookings, granularity),
    [bookings, granularity]
  );

  const statusData = useMemo(
    () => getBookingStatusBreakdown(bookings),
    [bookings]
  );

  const topToursData = useMemo(
    () => getTopTours(bookings, 5),
    [bookings]
  );

  const paymentData = useMemo(
    () => getPaymentMethodBreakdown(bookings),
    [bookings]
  );

  // Modal Sổ chi tiết công nợ
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  const debtBookingsCount = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled' && ((Number(b.totalAmount) || 0) - (Number(b.paidAmount) || 0)) > 0).length,
    [bookings]
  );

  const granularityLabel =
    granularity === 'day' ? '30 Ngày Qua' : granularity === 'week' ? '12 Tuần Qua' : '12 Tháng Qua';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }}>
      {/* 1. TOP 4 CORE KPI METRIC CARDS (Bố cục 1 hàng x 4 cột cân xứng chuẩn điều hành) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* THẺ 1: DOANH THU THỰC THU (TIỀN VỀ TÀI KHOẢN) */}
        <MetricCard
          title="Doanh Thu Thực Thu"
          value={formatCurrencyVND(totalCollected)}
          subtitle={`Đã thu: ${formatCurrencyVND(totalFullPaid)} (đủ) + ${formatCurrencyVND(totalDeposit)} (cọc)`}
          trendText={`Tổng giá trị đơn: ${formatCurrencyVND(totalOrderValue)}`}
          icon="fa-solid fa-vault"
          iconBg="#ecfdf5"
          iconColor="#047857"
          valueColor="#047857"
          badgeText="TIỀN VỀ"
          badgeBg="#d1fae5"
          badgeColor="#065f46"
        />

        {/* THẺ 2: CÔNG NỢ CẦN THU (CLICKABLE ĐỂ XEM DANH SÁCH THU AI & SĐT ZALO) */}
        <MetricCard
          title="Công Nợ Cần Thu"
          value={formatCurrencyVND(totalRemaining)}
          subtitle="👉 Nhấp xem danh sách thu ai & Zalo"
          trendText={debtBookingsCount > 0 ? `${debtBookingsCount} đơn cần thu nợ` : undefined}
          icon="fa-solid fa-file-invoice-dollar"
          iconBg="#fef2f2"
          iconColor="#dc2626"
          valueColor="#dc2626"
          badgeText={debtBookingsCount > 0 ? `${debtBookingsCount} ĐƠN NỢ` : 'ĐÃ THU ĐỦ'}
          badgeBg={debtBookingsCount > 0 ? '#fee2e2' : '#f0fdf4'}
          badgeColor={debtBookingsCount > 0 ? '#b91c1c' : '#15803d'}
          onClick={() => setIsDebtModalOpen(true)}
          tooltip="Nhấp chuột để mở Sổ Chi Tiết Công Nợ Khách Hàng"
        />

        {/* THẺ 3: ĐƠN CHỜ DUYỆT (CLICKABLE SANG TAB BOOKINGS ĐỂ XỬ LÝ) */}
        <MetricCard
          title="Đơn Chờ Duyệt"
          value={`${pendingCount} Đơn`}
          subtitle={pendingCount > 0 ? 'Cần nhân viên xác nhận giữ chỗ' : 'Hệ thống đã đồng bộ'}
          trendText={pendingCount > 0 ? 'Ưu tiên duyệt' : undefined}
          icon="fa-solid fa-clock-rotate-left"
          iconBg="#fdf4ff"
          iconColor="#9333ea"
          valueColor={pendingCount > 0 ? '#9333ea' : '#0f172a'}
          badgeText={pendingCount > 0 ? 'CẦN XỬ LÝ' : 'ĐÃ XỬ LÝ'}
          badgeBg={pendingCount > 0 ? '#f3e8ff' : '#f1f5f9'}
          badgeColor={pendingCount > 0 ? '#7e22ce' : '#475569'}
          onClick={onNavigateToBookings}
          tooltip="Bấm để chuyển tới trang Quản Lý Đơn Tour"
        />

        {/* THẺ 4: LƯỢT KHÁCH ĐI TOUR (PAX) */}
        <MetricCard
          title="Lượt Khách Đi Tour"
          value={`${totalPax} Pax`}
          subtitle={`${customersCount} tài khoản · ${activeToursCount} tour đang mở`}
          icon="fa-solid fa-person-walking-luggage"
          iconBg="#eff6ff"
          iconColor="#2563eb"
          valueColor="#1e40af"
          badgeText="HOẠT ĐỘNG"
          badgeBg="#dbeafe"
          badgeColor="#1e40af"
        />
      </div>

      {/* 2. ROW 2: REVENUE LINE CHART (68%) + BOOKING STATUS DONUT (32%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        <RevenueLineChart
          data={trendData}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />
        <BookingStatusDonut data={statusData} totalBookings={bookings.length} />
      </div>

      {/* 3. ROW 3: BOOKING COUNT BAR CHART (55%) + TOP TOURS BAR CHART (45%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        <BookingBarChart data={trendData} granularityLabel={granularityLabel} />
        <TopToursBarChart data={topToursData} />
      </div>

      {/* 4. ROW 4: PAYMENT METHODS (35%) + RECENT BOOKINGS TABLE (65%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        <PaymentMethodDonut data={paymentData} />

        {/* Recent Bookings Table Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Đơn Đặt Tour Mới Nhất
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Theo dõi nhanh các giao dịch gần đây
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToBookings}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#047857',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                Xem tất cả ({bookings.length}) <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Mã Đơn</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Khách Hàng</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Tên Tour</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Tổng Tiền</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Trạng Thái</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#047857' }}>
                        {b.id}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{b.phone}</div>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.75rem',
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#334155'
                        }}
                        title={b.tourTitle}
                      >
                        {b.tourTitle}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrencyVND(b.totalAmount)}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        {(() => {
                          const badge =
                            b.status === 'confirmed'
                              ? { bg: '#ecfdf5', color: '#047857', label: 'Đã Thanh Toán' }
                              : b.status === 'deposit'
                              ? { bg: '#fef3c7', color: '#b45309', label: 'Đã Cọc 50%' }
                              : b.status === 'pending'
                              ? { bg: '#eff6ff', color: '#1d4ed8', label: 'Chờ Xử Lý' }
                              : { bg: '#fee2e2', color: '#b91c1c', label: 'Đã Hủy' };
                          return (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '20px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: badge.bg,
                                color: badge.color
                              }}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onApproveBooking(b.id)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Duyệt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SỔ THEO DÕI CÔNG NỢ KHÁCH HÀNG (POPUP DRILLDOWN) */}
      <DebtDetailModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        bookings={bookings}
        onConfirmFullPayment={onConfirmFullPayment}
        onNavigateToBooking={() => {
          setIsDebtModalOpen(false);
          onNavigateToBookings();
        }}
      />
    </div>
  );
};

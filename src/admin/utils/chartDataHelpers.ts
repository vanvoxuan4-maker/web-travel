import { BookingRecord } from '../admin.types';

export type TimeGranularity = 'day' | 'week' | 'month';

export interface TrendDataPoint {
  key: string;
  label: string;
  revenue: number;
  count: number;
  fullPaidAmount: number;
  depositAmount: number;
  remainingAmount: number;
  totalCollected: number;
  paidAmount: number;
}

export interface StatusSlice {
  name: string;
  status: 'confirmed' | 'deposit' | 'pending' | 'cancelled';
  count: number;
  percentage: number;
  color: string;
}

export interface TopTourDataPoint {
  tourTitle: string;
  shortTitle: string;
  bookingsCount: number;
  revenue: number;
}

export interface PaymentMethodSlice {
  name: string;
  method: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Safely parse booking creation date from ISO string, rawCreatedAt, or DD/MM/YYYY
 */
export function parseBookingDate(booking: BookingRecord): Date {
  if (booking.rawCreatedAt) {
    const d = new Date(booking.rawCreatedAt);
    if (!isNaN(d.getTime())) return d;
  }

  const raw = booking.createdAt;
  if (!raw || raw.toLowerCase().includes('hôm nay') || raw.toLowerCase().includes('mới')) {
    return new Date();
  }

  // Handle DD/MM/YYYY format
  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Handle ISO string or YYYY-MM-DD
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Helper to get start of day
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Helper to accumulate booking amounts to a trend point
 */
function accumulateBooking(point: TrendDataPoint, b: BookingRecord) {
  point.count += 1;
  if (b.status === 'cancelled') return;

  const total = Number(b.totalAmount) || 0;
  const paid = Number(b.paidAmount) || 0;

  point.revenue += total;

  if (b.status === 'confirmed') {
    point.fullPaidAmount += total;
    point.totalCollected += total;
  } else if (b.status === 'deposit') {
    point.depositAmount += paid;
    point.remainingAmount += Math.max(0, total - paid);
    point.totalCollected += paid;
  } else if (b.status === 'pending') {
    point.remainingAmount += total;
  }
  point.paidAmount = point.totalCollected;
}

/**
 * Generate trend data points for Day (30 days), Week (12 weeks), or Month (12 months)
 */
export function getRevenueAndBookingTrends(
  bookings: BookingRecord[],
  granularity: TimeGranularity
): TrendDataPoint[] {
  const now = new Date();

  const createEmptyPoint = (key: string, label: string): TrendDataPoint => ({
    key,
    label,
    revenue: 0,
    count: 0,
    fullPaidAmount: 0,
    depositAmount: 0,
    remainingAmount: 0,
    totalCollected: 0,
    paidAmount: 0
  });

  if (granularity === 'day') {
    // Last 30 days
    const days: TrendDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = startOfDay(d);
      const dayKey = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
      const label = `${String(dayStart.getDate()).padStart(2, '0')}/${String(dayStart.getMonth() + 1).padStart(2, '0')}`;

      days.push(createEmptyPoint(dayKey, label));
    }

    const dayMap = new Map(days.map((item) => [item.key, item]));

    bookings.forEach((b) => {
      const date = parseBookingDate(b);
      const dStart = startOfDay(date);
      const key = `${dStart.getFullYear()}-${String(dStart.getMonth() + 1).padStart(2, '0')}-${String(dStart.getDate()).padStart(2, '0')}`;

      const point = dayMap.get(key);
      if (point) {
        accumulateBooking(point, b);
      }
    });

    return days;
  }

  if (granularity === 'week') {
    // Last 12 weeks
    const weeks: TrendDataPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      const key = `w-${11 - i}`;
      const label = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;

      weeks.push(createEmptyPoint(key, label));
    }

    // Determine week buckets
    bookings.forEach((b) => {
      const date = parseBookingDate(b);
      const time = date.getTime();

      for (let i = 0; i < 12; i++) {
        const idx = 11 - i;
        const end = new Date(now);
        end.setDate(end.getDate() - idx * 7);
        end.setHours(23, 59, 59, 999);

        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        if (time >= start.getTime() && time <= end.getTime()) {
          accumulateBooking(weeks[i], b);
          break;
        }
      }
    });

    return weeks;
  }

  // Month (Last 12 months)
  const months: TrendDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `Th${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;

    months.push(createEmptyPoint(key, label));
  }

  const monthMap = new Map(months.map((m) => [m.key, m]));

  bookings.forEach((b) => {
    const date = parseBookingDate(b);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const point = monthMap.get(key);
    if (point) {
      accumulateBooking(point, b);
    }
  });

  return months;
}

/**
 * Status distribution breakdown
 */
export function getBookingStatusBreakdown(bookings: BookingRecord[]): StatusSlice[] {
  const counts = {
    confirmed: 0,
    deposit: 0,
    pending: 0,
    cancelled: 0
  };

  bookings.forEach((b) => {
    if (b.status in counts) {
      counts[b.status as keyof typeof counts]++;
    } else {
      counts.pending++;
    }
  });

  const total = bookings.length || 1;

  return [
    {
      name: 'Đã thanh toán',
      status: 'confirmed',
      count: counts.confirmed,
      percentage: Math.round((counts.confirmed / total) * 100),
      color: '#10b981'
    },
    {
      name: 'Đã đặt cọc 50%',
      status: 'deposit',
      count: counts.deposit,
      percentage: Math.round((counts.deposit / total) * 100),
      color: '#f59e0b'
    },
    {
      name: 'Chờ duyệt / thanh toán',
      status: 'pending',
      count: counts.pending,
      percentage: Math.round((counts.pending / total) * 100),
      color: '#3b82f6'
    },
    {
      name: 'Đã hủy',
      status: 'cancelled',
      count: counts.cancelled,
      percentage: Math.round((counts.cancelled / total) * 100),
      color: '#ef4444'
    }
  ];
}

/**
 * Top 5 tours by booking counts
 */
export function getTopTours(bookings: BookingRecord[], limit = 5): TopTourDataPoint[] {
  const map = new Map<string, { bookingsCount: number; revenue: number }>();

  bookings.forEach((b) => {
    const title = b.tourTitle || 'Tour chưa đặt tên';
    const current = map.get(title) || { bookingsCount: 0, revenue: 0 };
    current.bookingsCount += 1;
    if (b.status !== 'cancelled') {
      current.revenue += Number(b.totalAmount) || 0;
    }
    map.set(title, current);
  });

  const sorted = Array.from(map.entries())
    .map(([tourTitle, data]) => ({
      tourTitle,
      shortTitle: tourTitle.length > 25 ? `${tourTitle.slice(0, 23)}...` : tourTitle,
      bookingsCount: data.bookingsCount,
      revenue: data.revenue
    }))
    .sort((a, b) => b.bookingsCount - a.bookingsCount || b.revenue - a.revenue)
    .slice(0, limit);

  return sorted;
}

/**
 * Payment method breakdown
 */
export function getPaymentMethodBreakdown(bookings: BookingRecord[]): PaymentMethodSlice[] {
  const counts: Record<string, number> = {};

  bookings.forEach((b) => {
    const raw = (b.paymentMethod || 'vietqr').toLowerCase();
    counts[raw] = (counts[raw] || 0) + 1;
  });

  const total = bookings.length || 1;

  const methodMeta: Record<string, { name: string; color: string }> = {
    vietqr: { name: 'VietQR / Ngân Hàng', color: '#059669' },
    momo: { name: 'Ví MoMo', color: '#d946ef' },
    credit_card: { name: 'Thẻ Quốc Tế (Visa/Master)', color: '#3b82f6' },
    bank_transfer: { name: 'Chuyển Khoản Trực Tiếp', color: '#6366f1' },
    cash: { name: 'Tiền Mặt Tại Quầy', color: '#f59e0b' }
  };

  const results: PaymentMethodSlice[] = Object.entries(counts).map(([method, count]) => {
    const meta = methodMeta[method] || { name: `Khác (${method})`, color: '#64748b' };
    return {
      name: meta.name,
      method,
      count,
      percentage: Math.round((count / total) * 100),
      color: meta.color
    };
  });

  // Sort descending by count
  return results.sort((a, b) => b.count - a.count);
}

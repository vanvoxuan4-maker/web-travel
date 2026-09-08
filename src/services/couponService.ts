import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface CouponData {
  id?: string;
  code: string;
  description?: string;
  discount_amount?: number;
  discount_percent?: number;
  min_order_value?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  message: string;
  couponData?: CouponData;
}

export interface CouponUsageRecord {
  id?: string;
  coupon_code: string;
  user_id?: string | null;
  booking_id?: string | null;
  booking_code?: string;
  discount_applied: number;
  used_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

const LOCAL_COUPON_USAGES_KEY = 'webtravel_coupon_usages';
const LOCAL_BOOKINGS_KEY = 'webtravel_local_bookings';

// Fallback hardcoded coupons when database is offline or not configured
const FALLBACK_COUPONS: Record<string, { desc: string; amount?: number; percent?: number; minOrder?: number }> = {
  'SUMMER2026': { desc: 'Khuyến mãi Hè Rực Rỡ 2026', amount: 500000, minOrder: 2000000 },
  'VIETRAVEL500': { desc: 'Ưu đãi Tri Ân Khách Hàng', amount: 500000, minOrder: 1000000 },
  'VIP1000': { desc: 'Đặc Quyền Thành Viên VIP', amount: 1000000, minOrder: 5000000 },
  'WEBTRAVEL10': { desc: 'Giảm 10% Tổng Hóa Đơn', percent: 10, minOrder: 3000000 }
};

export const couponService = {
  /**
   * Fetch all coupons for admin management
   */
  async getAllCoupons(): Promise<CouponData[]> {
    if (!isSupabaseConfigured || !supabase) {
      return Object.entries(FALLBACK_COUPONS).map(([code, val]) => ({
        code,
        description: val.desc,
        discount_amount: val.amount || 0,
        discount_percent: val.percent || 0,
        min_order_value: val.minOrder || 0,
        usage_limit: 100,
        used_count: 0,
        is_active: true
      }));
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching coupons:', error);
        return [];
      }

      return data as CouponData[];
    } catch (err) {
      console.error('Unexpected error fetching coupons:', err);
      return [];
    }
  },

  /**
   * Validate a coupon code against Supabase database or fallback store,
   * including strict per-user usage limits (1 use per member).
   */
  async validateCoupon(code: string, orderTotal: number, userId?: string): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        valid: false,
        code: '',
        discountAmount: 0,
        message: 'Vui lòng nhập mã giảm giá.'
      };
    }

    // 0. Strict check: Has this specific user already applied this coupon?
    if (userId) {
      // 0.1 Check Supabase database
      if (isSupabaseConfigured && supabase) {
        try {
          // Check coupon_usages table
          const { data: usageRows } = await supabase
            .from('coupon_usages')
            .select('id, booking_id')
            .eq('coupon_code', cleanCode)
            .eq('user_id', userId)
            .limit(1);

          if (usageRows && usageRows.length > 0) {
            return {
              valid: false,
              code: cleanCode,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${cleanCode}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }

          // Dual-check: check bookings table directly (in case trigger hadn't fired)
          const { data: bookingRows } = await supabase
            .from('bookings')
            .select('id, booking_code, booking_status')
            .eq('user_id', userId)
            .eq('coupon_code', cleanCode)
            .neq('booking_status', 'cancelled')
            .limit(1);

          if (bookingRows && bookingRows.length > 0) {
            return {
              valid: false,
              code: cleanCode,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${cleanCode}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }
        } catch (err) {
          console.warn('Error checking user coupon history in Supabase:', err);
        }
      }

      // 0.2 Check LocalStorage / Fallback
      try {
        const localUsagesRaw = localStorage.getItem(LOCAL_COUPON_USAGES_KEY);
        if (localUsagesRaw) {
          const localUsages: CouponUsageRecord[] = JSON.parse(localUsagesRaw);
          const hasUsed = localUsages.some(
            u => u.coupon_code === cleanCode && u.user_id === userId
          );
          if (hasUsed) {
            return {
              valid: false,
              code: cleanCode,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${cleanCode}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }
        }

        const localBookingsRaw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
        if (localBookingsRaw) {
          const localBookings = JSON.parse(localBookingsRaw);
          const hasBookingWithCoupon = localBookings.some(
            (b: any) =>
              b.userId === userId &&
              b.couponCode?.toUpperCase() === cleanCode &&
              b.bookingStatus !== 'cancelled'
          );
          if (hasBookingWithCoupon) {
            return {
              valid: false,
              code: cleanCode,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${cleanCode}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }
        }
      } catch (err) {
        console.warn('Error checking local coupon usage:', err);
      }
    }

    // 1. Try querying Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', cleanCode)
          .single();

        if (error || !data) {
          // If not found in DB, check fallback
          return this.validateFallbackCoupon(cleanCode, orderTotal, userId);
        }

        const coupon = data as CouponData;

        // Check active
        if (!coupon.is_active) {
          return {
            valid: false,
            code: cleanCode,
            discountAmount: 0,
            message: 'Mã giảm giá này đã tạm dừng áp dụng.'
          };
        }

        // Check expiry
        if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
          return {
            valid: false,
            code: cleanCode,
            discountAmount: 0,
            message: 'Mã giảm giá đã hết hạn sử dụng.'
          };
        }

        // Check usage limit
        if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
          return {
            valid: false,
            code: cleanCode,
            discountAmount: 0,
            message: 'Mã giảm giá đã hết lượt sử dụng.'
          };
        }

        // Check min order value
        const minOrder = Number(coupon.min_order_value) || 0;
        if (minOrder > 0 && orderTotal < minOrder) {
          return {
            valid: false,
            code: cleanCode,
            discountAmount: 0,
            message: `Đơn hàng tối thiểu phải từ ${minOrder.toLocaleString('vi-VN')} ₫ để áp dụng mã này.`
          };
        }

        // Calculate discount amount
        let discount = 0;
        if (coupon.discount_amount && Number(coupon.discount_amount) > 0) {
          discount = Math.min(orderTotal, Number(coupon.discount_amount));
        } else if (coupon.discount_percent && Number(coupon.discount_percent) > 0) {
          discount = Math.min(orderTotal, Math.round((orderTotal * Number(coupon.discount_percent)) / 100));
        }

        return {
          valid: true,
          code: cleanCode,
          discountAmount: discount,
          message: `Áp dụng thành công mã "${cleanCode}": Giảm ${discount.toLocaleString('vi-VN')} ₫ (${coupon.description || 'Ưu đãi'})`,
          couponData: coupon
        };
      } catch (err) {
        console.warn('Supabase coupon check failed, falling back to local:', err);
      }
    }

    // 2. Fallback local validation
    return this.validateFallbackCoupon(cleanCode, orderTotal, userId);
  },

  /**
   * Internal helper for fallback verification
   */
  validateFallbackCoupon(code: string, orderTotal: number, userId?: string): CouponValidationResult {
    const found = FALLBACK_COUPONS[code];
    if (!found) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'
      };
    }

    // Check user already used in local fallback
    if (userId) {
      try {
        const localUsagesRaw = localStorage.getItem(LOCAL_COUPON_USAGES_KEY);
        if (localUsagesRaw) {
          const localUsages: CouponUsageRecord[] = JSON.parse(localUsagesRaw);
          if (localUsages.some(u => u.coupon_code === code && u.user_id === userId)) {
            return {
              valid: false,
              code,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${code}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }
        }

        const localBookingsRaw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
        if (localBookingsRaw) {
          const localBookings = JSON.parse(localBookingsRaw);
          if (localBookings.some((b: any) => b.userId === userId && b.couponCode?.toUpperCase() === code && b.bookingStatus !== 'cancelled')) {
            return {
              valid: false,
              code,
              discountAmount: 0,
              message: `Tài khoản của bạn đã sử dụng mã ưu đãi "${code}". Mỗi tài khoản chỉ được áp dụng 1 lần duy nhất.`
            };
          }
        }
      } catch (e) {
        console.warn('Error reading local fallback usage:', e);
      }
    }

    if (found.minOrder && orderTotal < found.minOrder) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: `Đơn hàng tối thiểu từ ${found.minOrder.toLocaleString('vi-VN')} ₫ để áp dụng mã này.`
      };
    }

    let discount = 0;
    if (found.amount) {
      discount = Math.min(orderTotal, found.amount);
    } else if (found.percent) {
      discount = Math.min(orderTotal, Math.round((orderTotal * found.percent) / 100));
    }

    return {
      valid: true,
      code,
      discountAmount: discount,
      message: `Áp dụng thành công mã "${code}": Giảm ${discount.toLocaleString('vi-VN')} ₫ (${found.desc})`,
      couponData: {
        code,
        description: found.desc,
        discount_amount: found.amount || 0,
        discount_percent: found.percent || 0,
        is_active: true
      }
    };
  },

  /**
   * Record coupon usage both in Supabase (if available) and LocalStorage
   */
  async recordCouponUsage(params: {
    couponCode: string;
    userId?: string | null;
    bookingId?: string | null;
    bookingCode?: string;
    discountApplied: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<boolean> {
    const cleanCode = params.couponCode.trim().toUpperCase();
    const timestamp = new Date().toISOString();

    const usageRecord: CouponUsageRecord = {
      id: 'cu-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      coupon_code: cleanCode,
      user_id: params.userId || null,
      booking_id: params.bookingId || null,
      booking_code: params.bookingCode || '',
      discount_applied: params.discountApplied || 0,
      used_at: timestamp,
      customer_name: params.customerName || '',
      customer_email: params.customerEmail || '',
      customer_phone: params.customerPhone || ''
    };

    // 1. Save to LocalStorage
    try {
      const existingRaw = localStorage.getItem(LOCAL_COUPON_USAGES_KEY);
      const existing: CouponUsageRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      // avoid duplicates for same booking_id + coupon_code
      const filtered = existing.filter(
        item => !(item.booking_id && params.bookingId && item.booking_id === params.bookingId && item.coupon_code === cleanCode)
      );
      filtered.unshift(usageRecord);
      localStorage.setItem(LOCAL_COUPON_USAGES_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Could not write to local coupon usages:', e);
    }

    // 2. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('coupon_usages')
          .insert([
            {
              coupon_code: cleanCode,
              user_id: params.userId || null,
              booking_id: params.bookingId || null,
              discount_applied: params.discountApplied || 0,
              used_at: timestamp
            }
          ]);

        if (error) {
          console.warn('Failed to insert into coupon_usages in Supabase:', error.message);
        }

        // Also increment used_count in coupons table
        const { data: currentCoupon } = await supabase
          .from('coupons')
          .select('used_count')
          .eq('code', cleanCode)
          .single();

        if (currentCoupon) {
          await supabase
            .from('coupons')
            .update({ used_count: (currentCoupon.used_count || 0) + 1 })
            .eq('code', cleanCode);
        }
      } catch (err) {
        console.warn('Unexpected error in recordCouponUsage:', err);
      }
    }

    return true;
  },

  /**
   * Refund coupon usage when a booking is cancelled
   */
  async refundCouponUsage(couponCode: string, bookingId: string): Promise<boolean> {
    const cleanCode = couponCode.trim().toUpperCase();

    // 1. Remove from LocalStorage
    try {
      const existingRaw = localStorage.getItem(LOCAL_COUPON_USAGES_KEY);
      if (existingRaw) {
        const existing: CouponUsageRecord[] = JSON.parse(existingRaw);
        const updated = existing.filter(
          item => !(item.coupon_code === cleanCode && item.booking_id === bookingId)
        );
        localStorage.setItem(LOCAL_COUPON_USAGES_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Could not refund local coupon usage:', e);
    }

    // 2. Remove from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('coupon_usages')
          .delete()
          .eq('coupon_code', cleanCode)
          .eq('booking_id', bookingId);

        const { data: currentCoupon } = await supabase
          .from('coupons')
          .select('used_count')
          .eq('code', cleanCode)
          .single();

        if (currentCoupon && currentCoupon.used_count > 0) {
          await supabase
            .from('coupons')
            .update({ used_count: currentCoupon.used_count - 1 })
            .eq('code', cleanCode);
        }
      } catch (err) {
        console.warn('Unexpected error in refundCouponUsage:', err);
      }
    }

    return true;
  },

  /**
   * Get all coupon usages for Admin inspection
   */
  async getCouponUsageHistory(): Promise<CouponUsageRecord[]> {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('coupon_usages')
          .select(`
            id,
            coupon_code,
            user_id,
            booking_id,
            discount_applied,
            used_at,
            bookings (
              booking_code,
              customer_name,
              customer_email,
              customer_phone
            )
          `)
          .order('used_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            coupon_code: item.coupon_code,
            user_id: item.user_id,
            booking_id: item.booking_id,
            booking_code: item.bookings?.booking_code || '',
            discount_applied: item.discount_applied || 0,
            used_at: item.used_at,
            customer_name: item.bookings?.customer_name || 'Khách hàng',
            customer_email: item.bookings?.customer_email || '',
            customer_phone: item.bookings?.customer_phone || ''
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch coupon usages from Supabase, checking local:', err);
      }
    }

    // 2. Fallback to LocalStorage
    try {
      const localUsagesRaw = localStorage.getItem(LOCAL_COUPON_USAGES_KEY);
      if (localUsagesRaw) {
        return JSON.parse(localUsagesRaw);
      }
    } catch (e) {
      console.warn('Failed to parse local coupon usages:', e);
    }

    return [];
  },

  /**
   * Create a new coupon
   */
  async createCoupon(coupon: {
    code: string;
    description?: string;
    discount_amount?: number;
    discount_percent?: number;
    min_order_value?: number;
    usage_limit?: number;
    expires_at?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: coupon.code.toUpperCase().trim(),
          description: coupon.description || 'Ưu đãi WebTravel',
          discount_amount: coupon.discount_amount || 0,
          discount_percent: coupon.discount_percent || 0,
          min_order_value: coupon.min_order_value || 0,
          usage_limit: coupon.usage_limit || 100,
          used_count: 0,
          expires_at: coupon.expires_at || null,
          is_active: true
        });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create coupon' };
    }
  }
};

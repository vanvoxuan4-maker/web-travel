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
        used_count: 5,
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
   * Validate a coupon code against Supabase database or fallback store
   */
  async validateCoupon(code: string, orderTotal: number): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        valid: false,
        code: '',
        discountAmount: 0,
        message: 'Vui lòng nhập mã giảm giá.'
      };
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
          return this.validateFallbackCoupon(cleanCode, orderTotal);
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
    return this.validateFallbackCoupon(cleanCode, orderTotal);
  },

  /**
   * Internal helper for fallback verification
   */
  validateFallbackCoupon(code: string, orderTotal: number): CouponValidationResult {
    const found = FALLBACK_COUPONS[code];
    if (!found) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'
      };
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

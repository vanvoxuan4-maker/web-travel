import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface CouponData {
  id?: string;
  code: string;
  description?: string;
  discount_amount?: number;
  discount_percent?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string;
  is_active: boolean;
  created_at?: string;
}

export const couponService = {
  /**
   * Fetch all coupons
   */
  async getAllCoupons(): Promise<CouponData[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
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
   * Create a new coupon
   */
  async createCoupon(coupon: {
    code: string;
    description?: string;
    discount_amount?: number;
    discount_percent?: number;
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

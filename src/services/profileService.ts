import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserRole, UserStatus } from '../auth/auth.types';

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  role: UserRole;
  loyalty_points: number;
  address?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  /**
   * Fetch all user profiles (Admin)
   */
  async getAllProfiles(): Promise<ProfileRecord[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return data as ProfileRecord[];
    } catch (err) {
      console.error('Unexpected error fetching profiles:', err);
      return [];
    }
  },

  /**
   * Update profile info for a user (Self / Customer)
   */
  async updateUserProfile(
    userId: string,
    updates: {
      fullName?: string;
      phone?: string;
      address?: string;
      avatarUrl?: string;
      loyaltyPoints?: number;
      status?: UserStatus;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const dbPayload: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
      if (updates.phone !== undefined) dbPayload.phone = updates.phone;
      if (updates.address !== undefined) dbPayload.address = updates.address;
      if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
      if (updates.loyaltyPoints !== undefined) dbPayload.loyalty_points = updates.loyaltyPoints;
      if (updates.status !== undefined) dbPayload.status = updates.status;

      const { error } = await supabase
        .from('profiles')
        .update(dbPayload)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update profile' };
    }
  },

  /**
   * Update role for a user (Super Admin operation)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update role' };
    }
  },

  /**
   * Update account status (active/banned)
   */
  async updateUserStatus(userId: string, newStatus: UserStatus): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update status' };
    }
  },

  /**
   * Gửi email đặt lại mật khẩu cho khách hàng (Supabase Auth reset email)
   */
  async sendCustomerPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Không thể gửi email đặt lại mật khẩu' };
    }
  },

  /**
   * Đặt lại mật khẩu trực tiếp cho khách hàng (gọi RPC admin_reset_user_password nếu có)
   */
  async adminResetCustomerPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }
    try {
      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) {
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Hàm admin_reset_user_password chưa được tạo trong database Supabase. Quý khách vui lòng chọn "Gửi Link Reset Mật Khẩu Qua Email" hoặc chạy file supabase_admin_reset_password.sql trong Supabase SQL Editor.'
          };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu' };
    }
  }
};

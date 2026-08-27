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
  }
};

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

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserProfile, UserRole } from './auth.types';
import { translateAuthError } from '../utils/formValidation';

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  signUp: (data: { email: string; password: string; fullName: string; phone?: string; address?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const LOCAL_USER_KEY = 'webtravel_auth_user';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Helper to fetch user profile from Supabase profiles table
  const fetchUserProfile = async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      // 1. First attempt: Query by User ID
      let profileRow: any = null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        profileRow = data;
      } else if (userEmail) {
        // 2. Second attempt: Query by Email if ID mismatch or created manually
        const { data: emailData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim())
          .maybeSingle();

        if (emailData) {
          profileRow = emailData;
        }
      }

      if (!profileRow) {
        console.warn('Profile not found in Supabase, using baseline customer profile:', error?.message);
        const fallbackProfile: UserProfile = {
          id: userId,
          email: userEmail,
          fullName: userEmail.split('@')[0],
          phone: '',
          role: 'customer',
          loyaltyPoints: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return fallbackProfile;
      }

      return {
        id: profileRow.id,
        email: profileRow.email || userEmail,
        fullName: profileRow.full_name || (profileRow.email || userEmail).split('@')[0],
        phone: profileRow.phone || '',
        avatarUrl: profileRow.avatar_url,
        role: (profileRow.role as UserRole) || 'customer',
        loyaltyPoints: profileRow.loyalty_points || 0,
        address: profileRow.address || '',
        status: profileRow.status || 'active',
        createdAt: profileRow.created_at || new Date().toISOString(),
        updatedAt: profileRow.updated_at || new Date().toISOString()
      };
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;

    // Use onAuthStateChange as the SINGLE source of truth for session state.
    // It fires 'INITIAL_SESSION' immediately on mount (replacing the need for a separate checkSession call),
    // preventing the race condition where two concurrent fetchUserProfile calls both call setUser,
    // causing double renders and visual flickering.
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const profile = await fetchUserProfile(session.user.id, session.user.email || '');
        if (profile) {
          setUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(LOCAL_USER_KEY);
      }
      // Always mark loading done after any auth event resolves
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Real-time listener: Watch for account status / role changes while the user is actively logged in
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.id) return;

    const channel = supabase
      .channel(`profile-status-watch-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new) {
            setUser((prev) => {
              if (!prev) return null;
              const updated: UserProfile = {
                ...prev,
                role: payload.new.role || prev.role,
                status: payload.new.status || prev.status,
                fullName: payload.new.full_name || prev.fullName,
                phone: payload.new.phone || prev.phone,
                avatarUrl: payload.new.avatar_url ?? prev.avatarUrl,
                address: payload.new.address || prev.address,
                loyaltyPoints: payload.new.loyalty_points ?? prev.loyaltyPoints,
                updatedAt: payload.new.updated_at || new Date().toISOString()
              };
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      const mockProfile: UserProfile = {
        id: 'mock-user-01',
        email,
        fullName: email.split('@')[0],
        phone: '0901234567',
        role: email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'customer',
        loyaltyPoints: 150,
        address: 'Hà Nội, Việt Nam',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockProfile));
      closeAuthModal();
      return { success: true, user: mockProfile };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      let authenticatedProfile: UserProfile | null = null;
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, data.user.email || email);
        if (profile) {
          if (profile.status === 'banned' || profile.status === 'deleted') {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem(LOCAL_USER_KEY);
            const isStaffOrAdmin =
              profile.role === 'staff' || profile.role === 'admin' || profile.role === 'super_admin';
            return {
              success: false,
              error:
                profile.status === 'banned'
                  ? isStaffOrAdmin
                    ? 'Tài khoản nhân viên / quản trị viên của bạn đã bị tạm đình chỉ quyền truy cập hệ thống WebTravel. Vui lòng liên hệ Quản trị viên cấp cao (Super Admin) hoặc bộ phận Kỹ thuật nội bộ.'
                    : 'Tài khoản của bạn đã bị tạm khóa do vi phạm Điều khoản dịch vụ & Quy định an toàn WebTravel. Vui lòng liên hệ Hotline: 1900 1234 hoặc Email: hotro@webtravel.vn để được kiểm tra và hỗ trợ.'
                  : isStaffOrAdmin
                    ? 'Tài khoản nhân sự này đã bị vô hiệu hóa hoặc xóa khỏi hệ thống WebTravel.'
                    : 'Tài khoản này đã bị xóa hoặc ngừng hoạt động trên hệ thống WebTravel.'
            };
          }
          authenticatedProfile = profile;
          setUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
      }

      closeAuthModal();
      return { success: true, user: authenticatedProfile || undefined };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Đăng nhập không thành công' };
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      const mockProfile: UserProfile = {
        id: 'mock-user-' + Date.now(),
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        address: data.address || '',
        role: 'customer',
        loyaltyPoints: 50,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockProfile));
      closeAuthModal();
      return { success: true };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || '',
            address: data.address || '',
            role: 'customer'
          }
        }
      });

      if (authError) {
        return { success: false, error: translateAuthError(authError.message) };
      }

      if (authData.user) {
        if (data.phone || data.address) {
          await supabase
            .from('profiles')
            .update({
              phone: data.phone || '',
              address: data.address || '',
              full_name: data.fullName
            })
            .eq('id', authData.user.id);
        }

        const profile = await fetchUserProfile(authData.user.id, authData.user.email || data.email);
        if (profile) {
          setUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
      }

      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Đăng ký tài khoản thất bại' };
    }
  };

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const refreshProfile = async () => {
    if (user && supabase && isSupabaseConfigured) {
      const profile = await fetchUserProfile(user.id, user.email);
      if (profile) {
        setUser(profile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      }
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Bạn chưa đăng nhập.' };
    }

    if (!currentPassword) {
      return { success: false, error: 'Vui lòng nhập mật khẩu hiện tại.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      // Mock mode fallback
      return { success: true };
    }

    try {
      // 1. Re-authenticate with current password to ensure user is rightful owner
      if (user.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });

        if (verifyError) {
          return {
            success: false,
            error: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.'
          };
        }
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return {
          success: false,
          error: translateAuthError(updateError.message)
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại sau.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        isStaff: user?.role === 'staff' || user?.role === 'admin' || user?.role === 'super_admin',
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

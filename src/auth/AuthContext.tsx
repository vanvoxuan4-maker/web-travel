import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserProfile, UserRole } from './auth.types';

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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: { email: string; password: string; fullName: string; phone?: string; address?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

    const checkSession = async () => {
      try {
        const { data: sessionData } = await client.auth.getSession();
        const session = sessionData?.session;
        if (session && session.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (profile) {
            setUser(profile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          }
        }
      } catch (e) {
        console.error('Error checking session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

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
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      const mockProfile: UserProfile = {
        id: 'mock-user-01',
        email,
        fullName: email.split('@')[0],
        phone: '0901234567',
        role: email.includes('admin') ? 'admin' : 'customer',
        loyaltyPoints: 150,
        address: 'Hà Nội, Việt Nam',
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, data.user.email || email);
        if (profile) {
          if (profile.status === 'banned') {
            await supabase.auth.signOut();
            return { success: false, error: 'Tài khoản của bạn đã bị tạm khóa do vi phạm quy định.' };
          }
          setUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
      }

      closeAuthModal();
      return { success: true };
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
            role: 'customer'
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
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
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

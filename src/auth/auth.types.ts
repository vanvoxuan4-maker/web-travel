export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'banned' | 'deleted';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  loyaltyPoints: number;
  address?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

import { UserRole } from './auth.types';
import { AdminTab } from '../admin/admin.types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  staff: 2,
  admin: 3,
  super_admin: 4,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Khách Hàng',
  staff: 'Nhân Viên Vận Hành',
  admin: 'Quản Trị Viên',
  super_admin: 'Tổng Quản Trị (Super Admin)',
};

export const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; color: string; border: string }> = {
  customer: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  staff: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  admin: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  super_admin: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
};

/**
 * Tab-level RBAC Permissions
 * - Staff: Only operational modules (bookings, payments, tours, customers)
 * - Admin & Super Admin: All management modules including revenue overview, staff & coupons
 */
export const TAB_PERMISSIONS: Record<AdminTab, readonly UserRole[]> = {
  overview: ['admin', 'super_admin'],
  bookings: ['staff', 'admin', 'super_admin'],
  payments: ['staff', 'admin', 'super_admin'],
  tours: ['staff', 'admin', 'super_admin'],
  customers: ['staff', 'admin', 'super_admin'],
  staff: ['admin', 'super_admin'],
  coupons: ['admin', 'super_admin'],
  profile: ['staff', 'admin', 'super_admin'],
};

/**
 * Check whether a user role is allowed to view and access an Admin Tab
 */
export function isTabAllowed(role: UserRole | undefined | null, tab: AdminTab): boolean {
  if (!role) return false;
  const allowedRoles = TAB_PERMISSIONS[tab];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

export const PERMISSIONS = {
  // Admin Portal Access
  'admin:access': ['staff', 'admin', 'super_admin'],
  'admin:overview': ['admin', 'super_admin'],

  // Bookings Management
  'booking:view': ['staff', 'admin', 'super_admin'],
  'booking:approve': ['staff', 'admin', 'super_admin'],
  'booking:delete': ['admin', 'super_admin'],

  // Tours Management
  'tour:view': ['staff', 'admin', 'super_admin'],
  'tour:create': ['admin', 'super_admin'],
  'tour:edit': ['admin', 'super_admin'],
  'tour:edit_price': ['admin', 'super_admin'],
  'tour:manage_schedule': ['admin', 'super_admin'],
  'tour:toggle_active': ['admin', 'super_admin'],
  'tour:delete': ['super_admin'],

  // Customer & Staff Accounts
  'customer:view': ['staff', 'admin', 'super_admin'],
  'customer:ban': ['admin', 'super_admin'],
  'customer:promote_staff': ['admin', 'super_admin'],
  'customer:promote_admin': ['super_admin'],
  'customer:promote_super_admin': ['super_admin'],
  'staff:view': ['admin', 'super_admin'],
  'staff:manage': ['admin', 'super_admin'],

  // Promotions & Coupons
  'coupon:view': ['admin', 'super_admin'],
  'coupon:create': ['admin', 'super_admin'],
  'coupon:edit': ['admin', 'super_admin'],
  'coupon:toggle_active': ['admin', 'super_admin'],
  'coupon:delete': ['super_admin'],

  // User-facing features
  'booking:create': ['customer', 'staff', 'admin', 'super_admin'],
  'profile:edit_own': ['customer', 'staff', 'admin', 'super_admin'],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Checks if a given role has a specific permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: PermissionKey): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(role);
}

/**
 * Checks if a user's role meets the minimum required role based on hierarchy.
 */
export function hasRoleAtLeast(userRole: UserRole | undefined | null, targetRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Validates whether an actor with actorRole can assign targetRole to another user.
 * - staff cannot assign any role
 * - admin can only promote to staff or demote to customer (cannot touch admin or super_admin)
 * - super_admin can assign any role
 */
export function canAssignRole(actorRole: UserRole | undefined | null, targetRole: UserRole): boolean {
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') {
    return targetRole === 'customer' || targetRole === 'staff';
  }
  return false;
}

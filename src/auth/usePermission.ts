import { useAuth } from './useAuth';
import { PermissionKey, hasPermission, hasRoleAtLeast, canAssignRole } from './permissions';
import { UserRole } from './auth.types';

export function usePermission() {
  const { user, isSuperAdmin, isAdmin, isStaff } = useAuth();
  const userRole = user?.role || null;

  /**
   * Check if current user has the specified permission
   */
  const can = (permission: PermissionKey): boolean => {
    return hasPermission(userRole, permission);
  };

  /**
   * Check if current user has at least the target role level in hierarchy
   */
  const meetsRole = (targetRole: UserRole): boolean => {
    return hasRoleAtLeast(userRole, targetRole);
  };

  /**
   * Check if current user can assign a role to another user
   */
  const canAssign = (targetRole: UserRole): boolean => {
    return canAssignRole(userRole, targetRole);
  };

  return {
    userRole,
    can,
    meetsRole,
    canAssign,
    isSuperAdmin,
    isAdmin,
    isStaff,
  };
}

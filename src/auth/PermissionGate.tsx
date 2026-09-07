import React from 'react';
import { usePermission } from './usePermission';
import { PermissionKey } from './permissions';
import { UserRole } from './auth.types';

export interface PermissionGateProps {
  permission?: PermissionKey;
  roles?: UserRole[];
  minRole?: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGate conditionally renders its children based on permissions or roles.
 * If user does not meet the requirements, renders fallback (default: null).
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  roles,
  minRole,
  fallback = null,
  children,
}) => {
  const { can, userRole, meetsRole } = usePermission();

  if (!userRole) {
    return <>{fallback}</>;
  }

  // 1. Permission check
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // 2. Specific roles list check
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // 3. Minimum role hierarchy check
  if (minRole && !meetsRole(minRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

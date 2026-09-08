import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { UserRole } from './auth.types';
import { PermissionKey, hasPermission, hasRoleAtLeast } from './permissions';
import { AccountSuspendedScreen } from './AccountSuspendedScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Legacy support: requires admin or super_admin */
  requireAdmin?: boolean;
  /** Explicit whitelist of roles allowed to access */
  allowedRoles?: UserRole[];
  /** Minimum role in hierarchy required (e.g., 'staff' allows staff, admin, super_admin) */
  requiredRole?: UserRole;
  /** Specific granular permission required to access */
  requiredPermission?: PermissionKey;
  /** Fallback path to navigate when unauthorized (defaults to '/home') */
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedRoles,
  requiredRole,
  requiredPermission,
  redirectTo = '/home',
}) => {
  const { user, isLoading, isAuthenticated, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#042f2c',
          color: '#ffffff',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ marginTop: '1.25rem', fontSize: '0.95rem', fontWeight: 600, color: '#a7f3d0' }}>
          Đang xác thực bảo mật WebTravel...
        </p>
      </div>
    );
  }

  // 1. Not logged in -> Navigate to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Account is banned or deleted -> Show clear notification screen instead of flickering redirect
  if (user.status === 'banned' || user.status === 'deleted') {
    return <AccountSuspendedScreen user={user} onSignOut={signOut} />;
  }

  const role = user.role;

  // 1. Permission-based check
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Allowed roles list check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // 3. Minimum role hierarchy check
  if (requiredRole && !hasRoleAtLeast(role, requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  // 4. Backwards compatibility: requireAdmin
  if (requireAdmin && !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

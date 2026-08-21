import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

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
          fontFamily: 'var(--font-body)'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ marginTop: '1.25rem', fontSize: '0.95rem', fontWeight: 600, color: '#a7f3d0' }}>
          Đang xác thực bảo mật WebTravel...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

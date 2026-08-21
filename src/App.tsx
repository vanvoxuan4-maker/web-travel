import React, { useEffect, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './auth';
import { Navbar, Footer, HomePage, TourDetailPage, CheckoutPage, LoginPage, AIAssistantModal } from './user';
import { AdminPortal } from './admin/AdminPortal';

// === Error Boundary to catch React runtime crashes ===
interface EBState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WebTravel] App crash caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#1e293b', color: '#f87171', minHeight: '100vh' }}>
          <h2 style={{ color: '#fbbf24' }}>⚠️ Runtime Error – Hệ thống tự phục hồi</h2>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#e2e8f0' }}>{this.state.error?.stack}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Scroll to top on route change or hash navigation
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

// Main Layout with Route Guards & Standalone Admin/Login Mode
const AppContent: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isStandalonePage = isLoginPage || isAdminPage;

  return (
    <>
      <ScrollToTop />
      <div className="app-layout">
        {!isStandalonePage && <Navbar />}
        <main className={isStandalonePage ? 'standalone-main-content' : 'main-content'}>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Customer Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tour/:id"
              element={
                <ProtectedRoute>
                  <TourDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours/:id"
              element={
                <ProtectedRoute>
                  <TourDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:tourId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Standalone Enterprise Admin Portal (Admin Guard) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        {!isStandalonePage && <Footer />}
        {!isStandalonePage && <AIAssistantModal />}
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

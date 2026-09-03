import React, { useEffect, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './auth';
import { Navbar, Footer, HomePage, TourDetailPage, CheckoutPage, LoginPage, ProfilePage, TourCatalogPage, AIAssistantModal, NotFoundPage } from './user';
import { AdminPortal } from './admin/AdminPortal';
import { AppLogger } from './utils/logger';

// === Luxury User-Friendly Error Boundary ===
interface EBState {
  hasError: boolean;
  error: Error | null;
  traceId?: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    const traceId = AppLogger.generateTraceId('WT-CRASH');
    return { hasError: true, error, traceId };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    AppLogger.error('Màn hình gặp sự cố hiển thị (Caught by ErrorBoundary)', error, {
      traceId: this.state.traceId,
      componentStack: info.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: 'var(--font-body, "Montserrat", sans-serif)',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#ffffff',
            padding: '3rem 2.5rem',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#e11d48',
              fontSize: '2rem'
            }}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
              Đã Xảy Ra Sự Cố Hiển Thị
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Hệ thống đã tự động ghi nhận báo cáo sự cố để khắc phục. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              color: '#334155',
              marginBottom: '1.75rem',
              fontFamily: 'monospace'
            }}>
              Mã tra cứu sự cố: <strong style={{ color: '#047857' }}>{this.state.traceId || 'WT-ERR'}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '0.75rem 1.6rem',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)'
                }}
              >
                <i className="fa-solid fa-rotate-right" style={{ marginRight: '0.4rem' }} />
                Tải lại trang
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{
                  padding: '0.75rem 1.6rem',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-house" style={{ marginRight: '0.4rem' }} />
                Về Trang Chủ
              </button>
            </div>
          </div>
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
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours"
              element={
                <ProtectedRoute>
                  <TourCatalogPage />
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

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
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

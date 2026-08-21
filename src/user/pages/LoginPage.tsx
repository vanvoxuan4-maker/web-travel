import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

// Destination slides for left hero visual
const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=85',
    title: 'Hành Trình Di Sản Vịnh Hạ Long',
    subtitle: 'Nghỉ dưỡng thượng lưu trên du thuyền 5 sao chuẩn quốc tế',
    location: 'Vịnh Hạ Long, Quảng Ninh',
    rating: '4.98 ★ (2.400+ đánh giá)'
  },
  {
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=85',
    title: 'Cung Đường Vàng Tokyo - Núi Phú Sĩ',
    subtitle: 'Trải nghiệm mùa hoa anh đào & văn hóa Onsen truyền thống Nhật Bản',
    location: 'Tokyo & Phú Sĩ, Nhật Bản',
    rating: '4.95 ★ (1.850+ đánh giá)'
  },
  {
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1600&q=85',
    title: 'Chinh Phục Đỉnh Fansipan Sapa',
    subtitle: 'Hòa mình vào biển mây ngút ngàn và ruộng bậc thang Tây Bắc',
    location: 'Sapa, Lào Cai',
    rating: '4.92 ★ (3.100+ đánh giá)'
  }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/home';
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { signIn, signUp, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-rotate left hero visual slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // If user is already authenticated, redirect straight to target page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'login') {
        const res = await signIn(cleanEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Email hoặc mật khẩu không chính xác.');
        } else {
          setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng vào hệ thống...');
          setTimeout(() => {
            navigate(redirectUrl, { replace: true });
          }, 500);
        }
      } else {
        if (password.length < 6) {
          setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp({
          email: cleanEmail,
          password,
          fullName: fullName.trim() || cleanEmail.split('@')[0],
          phone: phone.trim(),
          address: address.trim()
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
        } else {
          setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
          setTimeout(() => {
            navigate(redirectUrl, { replace: true });
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: '#0f172a',
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* ========================================================================= */}
      {/* LEFT COLUMN: 50% IMMERSIVE EDITORIAL VISUAL HERO (DESKTOP)               */}
      {/* ========================================================================= */}
      <div
        className="login-hero-col"
        style={{
          flex: '1 1 52%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem 3.5rem',
          color: '#ffffff',
          overflow: 'hidden',
          background: '#022c22'
        }}
      >
        {/* Background Slide Image with Crossfade */}
        {HERO_SLIDES.map((s, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${s.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentSlide ? 1 : 0,
              transform: index === currentSlide ? 'scale(1.03)' : 'scale(1)',
              transition: 'opacity 1.2s ease-in-out, transform 8s ease-out',
              zIndex: 1
            }}
          />
        ))}

        {/* Gradient Scrim Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(6, 78, 59, 0.65) 0%, rgba(2, 44, 34, 0.4) 40%, rgba(15, 23, 42, 0.9) 100%)',
            zIndex: 2
          }}
        />

        {/* Top Left: WebTravel Luxury Brand Badge */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              fontSize: '1.25rem',
              color: '#ffffff'
            }}
          >
            <i className="fa-solid fa-compass"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff' }}>WebTravel</span>
              <span style={{ background: '#f59e0b', color: '#111827', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '8px' }}>
                EDITORIAL
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Hành Trình Nghỉ Dưỡng & Trải Nghiệm 5★
            </span>
          </div>
        </div>

        {/* Bottom Left: Captivating Glassmorphism Story Card */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '580px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '1.75rem 2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
              marginBottom: '1.5rem'
            }}
          >
            {/* Live Location Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(5, 150, 105, 0.4)', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '0.3rem 0.75rem', borderRadius: '30px', fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7', marginBottom: '0.85rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              <i className="fa-solid fa-location-dot"></i> {slide.location}
            </div>

            <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {slide.title}
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {slide.subtitle}
            </p>

            {/* Credibility / Rating Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{slide.rating}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Bảo hiểm toàn cầu 1 Tỷ ₫</span>
            </div>
          </div>

          {/* Carousel Slide Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                style={{
                  width: i === currentSlide ? '32px' : '9px',
                  height: '9px',
                  borderRadius: '10px',
                  background: i === currentSlide ? '#34d399' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: 48% LUXURY AUTHENTICATION CARD                             */}
      {/* ========================================================================= */}
      <div
        className="login-form-col"
        style={{
          flex: '1 1 48%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 3rem',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Header Title */}
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem', letterSpacing: '-0.03em' }}>
              {mode === 'login' ? 'Đăng Nhập Khám Phá' : 'Tạo Tài Khoản Mới'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
              {mode === 'login'
                ? 'Nhập tài khoản để tiếp tục trải nghiệm & đặt tour'
                : 'Đăng ký thành viên để nhận ưu đãi tour lên tới 500.000 ₫'}
            </p>
          </div>

          {/* Segmented Pill Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.35rem',
              borderRadius: '14px',
              marginBottom: '1.75rem',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode('login');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0',
                border: 'none',
                borderRadius: '10px',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#047857' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 4px 10px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode('register');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0',
                border: 'none',
                borderRadius: '10px',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#047857' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: mode === 'register' ? '0 4px 10px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fa-solid fa-user-plus"></i> Đăng Ký
            </button>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeIn 0.2s'
              }}
            >
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1rem' }}></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMsg && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeIn 0.2s'
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1rem' }}></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* REGISTER FIELDS */}
            {mode === 'register' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Họ và tên của bạn *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa-solid fa-user" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0901234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Địa chỉ liên hệ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Hà Nội, TP.HCM..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* EMAIL */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Địa chỉ Email *
              </label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-envelope" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="email"
                  required
                  placeholder="khachhang@webtravel.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: mode === 'register' ? '1rem' : '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                  Mật khẩu *
                </label>
                {mode === 'login' && (
                  <span style={{ fontSize: '0.78rem', color: '#047857', cursor: 'pointer', fontWeight: 600 }}>
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu của bạn'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD (ONLY IN REGISTER MODE) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Xác nhận lại mật khẩu *
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-shield-halved" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu giống ở trên"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                      borderRadius: '12px',
                      border: password && confirmPassword && password !== confirmPassword ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    <i className="fa-solid fa-circle-xmark"></i> Mật khẩu xác nhận chưa khớp
                  </span>
                )}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(4, 120, 87, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginTop: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Đang xác thực...
                </>
              ) : mode === 'login' ? (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Vào Hệ Thống
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus"></i> Hoàn Tất Đăng Ký Tài Khoản
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee Footnote */}
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.76rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#059669' }}></i>
              <span>Bảo mật chuẩn SSL 256-bit • Mã hóa tài khoản Supabase Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

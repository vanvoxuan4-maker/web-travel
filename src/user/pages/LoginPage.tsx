import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { UserProfile } from '../../auth/auth.types';
import { useModalPopup } from '../../context/ModalPopupContext';
import { sanitizePhone, validatePhone, validateEmail, translateAuthError } from '../../utils/formValidation';
import { TravelMascot, MascotMode } from '../components/auth/TravelMascot';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { MagneticButton } from '../components/common/MagneticButton';

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

// Helper to render letter-by-letter jumping wave floating label
const renderWavyLabel = (text: string) => {
  return text.split('').map((char, index) => (
    <span
      key={index}
      className="wt-wavy-char"
      style={{
        transitionDelay: `${index * 22}ms`
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const fromState = (location.state as any)?.from?.pathname;
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { signIn, signUp, isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

  // Helper to determine destination based on role: staff/admin -> /admin, customer -> /home
  const getDestination = (targetUser: UserProfile | null | undefined): string => {
    if (!targetUser) return '/home';
    const isStaffOrAdmin =
      targetUser.role === 'staff' || targetUser.role === 'admin' || targetUser.role === 'super_admin';

    if (isStaffOrAdmin) {
      // Staff and admin accounts must navigate into the enterprise admin portal
      if (redirectParam && redirectParam.startsWith('/admin')) return redirectParam;
      if (fromState && fromState.startsWith('/admin')) return fromState;
      return '/admin';
    }

    // Customer accounts enter the public travel storefront
    if (redirectParam && !redirectParam.startsWith('/admin')) return redirectParam;
    if (fromState && !fromState.startsWith('/admin')) return fromState;
    return '/home';
  };

  const { showSuccess, showError } = useModalPopup();
  const isSubmittingLoginRef = React.useRef(false);

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

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Real-time validation derivations
  const phoneValidation = validatePhone(phone);
  const emailValidation = validateEmail(email);
  const isPasswordValid = password.length >= 6;

  // Interactive Mascot state
  const [mascotMode, setMascotMode] = useState<MascotMode>('idle');
  const [activeField, setActiveField] = useState<
    'fullname' | 'phone' | 'address' | 'email' | 'password' | 'confirmPassword' | null
  >(null);

  const { lookProgress, mascotLabel } = React.useMemo(() => {
    switch (activeField) {
      case 'fullname': {
        const trimmed = fullName.trim();
        const msg = trimmed.length >= 2
          ? `Whoa, ${trimmed} nghe hay và ấn tượng quá! ✨`
          : 'Whoa, tên bạn nghe hay quá! Nhập đầy đủ nhé ✨';
        return {
          lookProgress: Math.min(fullName.length / 18, 1),
          mascotLabel: msg
        };
      }
      case 'phone': {
        const clean = sanitizePhone(phone);
        const msg = clean.length === 10
          ? 'Số điện thoại chuẩn rồi! Hướng dẫn viên sẽ liên hệ đón bạn 📞'
          : 'Nhớ nhập đúng số điện thoại để nhận thông báo đón tour nhé! 📱';
        return {
          lookProgress: Math.min(phone.length / 10, 1),
          mascotLabel: msg
        };
      }
      case 'address': {
        const msg = address.trim().length >= 5
          ? 'Địa chỉ tuyệt vời! WebTravel sẽ chuẩn bị quà lưu niệm chu đáo 🏡'
          : 'Nhập địa chỉ liên hệ để tiện nhận vé và hỗ trợ tour nhé! 📍';
        return {
          lookProgress: Math.min(address.length / 22, 1),
          mascotLabel: msg
        };
      }
      case 'email': {
        const isEmailValid = validateEmail(email).isValid;
        let msg = '';
        if (mode === 'login') {
          msg = isEmailValid
            ? 'Email chuẩn rồi, tiếp tục nhập mật khẩu nhé! ✨'
            : 'Nhập email tài khoản WebTravel của bạn nhé! 💌';
        } else {
          msg = isEmailValid
            ? 'Email chuẩn xịn rồi! Vé tour & lịch trình sẽ bay về hòm thư này ✈️'
            : 'Nhớ nhập đúng email của bạn để nhận thông báo khi đặt tour nhé! 💌';
        }
        return {
          lookProgress: Math.min(email.length / 22, 1),
          mascotLabel: msg
        };
      }
      case 'password': {
        if (showPassword) {
          return {
            lookProgress: 0.5,
            mascotLabel: 'Mochi hé mắt xem thử... Nhớ giữ kín mật khẩu nhé! 🤫'
          };
        }
        if (mode === 'login') {
          return {
            lookProgress: 0.5,
            mascotLabel: 'Mochi che mắt rồi! Nhập mật khẩu để bắt đầu hành trình nhé 🙈'
          };
        }
        const hasLength = password.length >= 8;
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const msg = (hasLength && hasNumber && hasSpecial)
          ? 'Mật khẩu chuẩn VIP cực kỳ kiên cố, an tâm vi vu rồi nhé! 🚀'
          : 'Mochi che mắt rồi! Nhớ nhập pass gồm các điều kiện để bảo mật tốt hơn nhé 🛡️';
        return {
          lookProgress: 0.5,
          mascotLabel: msg
        };
      }
      case 'confirmPassword': {
        if (showConfirmPassword) {
          return {
            lookProgress: 0.5,
            mascotLabel: 'Mochi hé mắt xem thử... Hãy chắc chắn mật khẩu khớp nhau nhé! 🤫'
          };
        }
        const isMatching = confirmPassword.length > 0 && password === confirmPassword;
        const msg = isMatching
          ? 'Trùng khớp hoàn hảo rồi! Tài khoản đã sẵn sàng cất cánh 🎉'
          : 'Nhập lại mật khẩu thật chính xác để bảo vệ chuyến đi của bạn nhé! 🔐';
        return {
          lookProgress: 0.5,
          mascotLabel: msg
        };
      }
      default:
        return {
          lookProgress: 0.5,
          mascotLabel: undefined
        };
    }
  }, [
    activeField,
    mode,
    fullName,
    phone,
    address,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword
  ]);

  // Auto-rotate left hero visual slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // CRITICAL: Wait for auth to finish loading before redirecting.
  // Without this check, stale localStorage data (e.g., cached status='active' for a now-banned user)
  // would trigger an immediate redirect, causing a brief flicker
  // before ProtectedRoute detects the banned status and switches to AccountSuspendedScreen.
  useEffect(() => {
    if (isSubmittingLoginRef.current) return;
    if (!isAuthLoading && isAuthenticated && user && user.status !== 'banned' && user.status !== 'deleted') {
      const targetDestination = getDestination(user);
      navigate(targetDestination, { replace: true });
    }
    // Do NOT redirect if user is banned/deleted — let them see the notice on the login page
  }, [isAuthLoading, isAuthenticated, user, navigate, redirectParam, fromState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'login') {
      if (!cleanEmail) {
        setErrorMsg('Vui lòng nhập địa chỉ email.');
        return;
      }
      if (!password) {
        setErrorMsg('Vui lòng nhập mật khẩu.');
        return;
      }
    } else {
      // REGISTER VALIDATIONS
      if (!fullName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên của bạn.');
        return;
      }

      setPhoneTouched(true);
      if (!phoneValidation.isValid) {
        setErrorMsg(phoneValidation.error || 'Số điện thoại không hợp lệ.');
        return;
      }

      setEmailTouched(true);
      if (!emailValidation.isValid) {
        setErrorMsg(emailValidation.error || 'Địa chỉ email không đúng định dạng.');
        return;
      }

      setPasswordTouched(true);
      if (password.length < 6) {
        setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
        return;
      }

      setConfirmPasswordTouched(true);
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        isSubmittingLoginRef.current = true;
        const res = await signIn(cleanEmail, password);
        if (!res.success) {
          isSubmittingLoginRef.current = false;
          const translated = translateAuthError(res.error || 'Email hoặc mật khẩu không chính xác.');
          setErrorMsg(translated);
          showError('Đăng Nhập Thất Bại', translated);
        } else {
          const loggedInUser = res.user || user;
          const isStaffOrAdmin =
            loggedInUser?.role === 'staff' || loggedInUser?.role === 'admin' || loggedInUser?.role === 'super_admin';
          const targetDestination = getDestination(loggedInUser);

          showSuccess(
            isStaffOrAdmin ? 'Đăng Nhập Quản Trị Thành Công!' : 'Đăng Nhập Thành Công!',
            isStaffOrAdmin
              ? 'Chào mừng bạn đã đăng nhập quyền Quản trị vào Cổng điều hành WebTravel.'
              : 'Chào mừng bạn đã quay trở lại với hệ sinh thái du lịch WebTravel.',
            {
              hideConfirmButton: true,
              userBadge: {
                name: loggedInUser?.fullName || cleanEmail.split('@')[0],
                email: loggedInUser?.email || cleanEmail,
                role: loggedInUser?.role,
                avatarUrl: loggedInUser?.avatarUrl
              },
              onConfirm: () => {
                navigate(targetDestination, { replace: true });
              },
              autoCloseMs: 1800
            }
          );
        }
      } else {
        isSubmittingLoginRef.current = true;
        const res = await signUp({
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim()
        });

        if (!res.success) {
          isSubmittingLoginRef.current = false;
          const translated = translateAuthError(res.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
          setErrorMsg(translated);
          showError('Đăng Ký Thất Bại', translated);
        } else {
          showSuccess(
            'Đăng Ký Tài Khoản Thành Công!',
            'Chào mừng bạn đã trở thành Thành Viên của WebTravel. Hãy cùng khám phá những hành trình tuyệt vời!',
            {
              hideConfirmButton: true,
              userBadge: {
                name: fullName.trim(),
                email: cleanEmail,
                role: 'customer'
              },
              onConfirm: () => {
                navigate(getDestination(null), { replace: true });
              },
              autoCloseMs: 1800
            }
          );
        }
      }
    } catch (err: any) {
      isSubmittingLoginRef.current = false;
      const translated = translateAuthError(err?.message || 'Có lỗi xảy ra trong quá trình xử lý.');
      setErrorMsg(translated);
      showError('Có Lỗi Xảy Ra', translated);
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
      <style>{`
        /* Floating Label styles for WebTravel Auth */
        .wt-floating-group {
          position: relative;
          margin-bottom: 1rem;
        }

        .wt-floating-input {
          width: 100%;
          height: 52px;
          padding: 0 1rem 0 2.75rem;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.93rem;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }

        .wt-floating-input.has-eye {
          padding-right: 2.75rem;
        }

        .wt-floating-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 0.95rem;
          pointer-events: none;
          transition: color 0.22s ease;
          z-index: 2;
        }

        .wt-floating-label {
          position: absolute;
          left: 2.75rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          user-select: none;
        }

        /* Solid white notch plate that cleanly cuts and hides the top border line */
        .wt-floating-label::before {
          content: '';
          position: absolute;
          left: -6px;
          right: -6px;
          top: 50%;
          height: 16px;
          background-color: #ffffff;
          border-radius: 4px;
          z-index: -1;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-50%) scale(0.85);
          transition: transform 0.26s cubic-bezier(0.5, 0, 0.5, 1.4), opacity 0.2s ease;
        }

        .wt-floating-group:hover .wt-floating-label::before,
        .wt-floating-input:focus ~ .wt-floating-label::before,
        .wt-floating-group.is-floating .wt-floating-label::before,
        .wt-floating-input:-webkit-autofill ~ .wt-floating-label::before,
        .wt-floating-input:autofill ~ .wt-floating-label::before {
          opacity: 1;
          transform: translateY(-26px) scale(1);
        }

        .wt-wavy-char {
          display: inline-block;
          color: #64748b;
          font-size: 0.92rem;
          font-weight: 500;
          background-color: transparent;
          padding: 2px 0.5px;
          transition: transform 0.28s cubic-bezier(0.5, 0, 0.5, 1.4), color 0.2s ease, font-weight 0.2s ease, background-color 0.2s ease;
          transform-origin: center bottom;
          position: relative;
          z-index: 2;
        }

        .wt-floating-eye {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          z-index: 4;
          transition: color 0.2s ease;
        }

        .wt-floating-eye:hover {
          color: #059669;
        }

        /* 1. HOVER over group: Border turns emerald, Icon turns emerald, Each letter waves / jumps up */
        .wt-floating-group:hover .wt-floating-input {
          border-color: #059669;
        }

        .wt-floating-group:hover .wt-floating-icon {
          color: #059669;
        }

        .wt-floating-group:hover .wt-wavy-char {
          transform: translateY(-26px) scale(0.85);
          color: #059669;
          font-weight: 700;
          background-color: #ffffff;
        }

        /* 2. FOCUS inside input: Border glow emerald, Icon emerald, Each letter waves / jumps up */
        .wt-floating-input:focus {
          border-color: #059669 !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14) !important;
        }

        .wt-floating-input:focus ~ .wt-floating-icon {
          color: #059669;
        }

        .wt-floating-input:focus ~ .wt-floating-label .wt-wavy-char {
          transform: translateY(-26px) scale(0.85);
          color: #059669 !important;
          font-weight: 700;
          background-color: #ffffff;
        }

        /* 3. HAS VALUE (is-floating): Keep letters floating on top */
          color: #0f172a;
        }

        .wt-floating-label {
          position: absolute;
          left: 2.75rem;
          top: 15px;
          color: #64748b;
          font-size: 0.93rem;
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          user-select: none;
        }

        .wt-wavy-char {
          display: inline-block;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1.3),
                      color 0.22s ease,
                      font-size 0.22s ease;
        }

        .wt-floating-group:focus-within .wt-floating-label .wt-wavy-char,
        .wt-floating-group.is-floating .wt-floating-label .wt-wavy-char {
          transform: translateY(-24px);
          font-size: 0.76rem;
          font-weight: 700;
          color: #059669;
          background: #ffffff;
          padding: 0 2px;
        }

        .wt-floating-group.is-floating:not(:focus-within) .wt-floating-label .wt-wavy-char {
          color: #64748b;
        }

        .wt-floating-group.has-error .wt-floating-input {
          border-color: #ef4444 !important;
        }

        .wt-floating-group.has-error .wt-floating-icon,
        .wt-floating-group.has-error .wt-wavy-char {
          color: #dc2626 !important;
        }

        .wt-floating-group.has-success .wt-floating-input {
          border-color: #10b981 !important;
        }

        .wt-floating-group.has-success .wt-floating-icon,
        .wt-floating-group.has-success .wt-wavy-char {
          color: #059669 !important;
          background-color: #ffffff;
        }

        /* Custom Sleek Scrollbar */
        .login-scroll-viewport::-webkit-scrollbar {
          width: 6px;
        }
        .login-scroll-viewport::-webkit-scrollbar-track {
          background: transparent;
        }
        .login-scroll-viewport::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 999px;
        }
        .login-scroll-viewport::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.45);
        }

        @media (max-width: 640px) {
          .login-top-bar {
            padding: 1rem 1.25rem !important;
          }
          .login-island-card {
            padding: 1.5rem 1.25rem !important;
            border-radius: 22px !important;
          }
          .login-ambient-footer {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Fullscreen Background Panorama Crossfade with Ken Burns Effect */}
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
            transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1), transform 9s ease-out',
            zIndex: 1
          }}
        />
      ))}

      {/* 2. Frosted Ambient Scrim with Deep Cinematic Emerald & Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(6, 78, 59, 0.48) 0%, rgba(2, 44, 34, 0.76) 55%, rgba(15, 23, 42, 0.92) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 2
        }}
      />

      {/* 3. Top Navigation Bar: Brand & Back to Home */}
      <header
        className="login-top-bar"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 3rem',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Badge */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}
          >
            <i className="fa-solid fa-compass" style={{ color: '#ffffff', fontSize: '1.2rem' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                WebTravel
              </span>
              <span style={{ background: '#f59e0b', color: '#111827', fontSize: '0.62rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '6px', letterSpacing: '0.04em' }}>
                EDITORIAL 5★
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#a7f3d0', letterSpacing: '0.04em', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              Hành Trình Nghỉ Dưỡng & Trải Nghiệm Thượng Lưu
            </span>
          </div>
        </div>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.55rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.8rem' }} />
          <span>Về Trang Chủ</span>
        </button>
      </header>

      {/* 4. Central Scrollable Viewport: Floating Island Card */}
      <main
        className="login-scroll-viewport"
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem 1.5rem 2rem',
          boxSizing: 'border-box'
        }}
      >
        {/* The Floating Island Luxury Card */}
        <div
          className="login-island-card"
          style={{
            width: '100%',
            maxWidth: mode === 'register' ? '540px' : '460px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            borderRadius: '28px',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.6)',
            padding: mode === 'register' ? '1.75rem 2.25rem 2rem' : '2.25rem 2.5rem',
            margin: 'auto 0',
            position: 'relative',
            transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
            boxSizing: 'border-box'
          }}
        >
          {/* Crest: Mochi Mascot integrated seamlessly right at top */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: mode === 'register' ? '-0.25rem' : '0',
              marginBottom: '0.85rem',
              position: 'relative'
            }}
          >
            {/* Subtle Ambient Halo behind Mochi */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '100px',
                background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <TravelMascot
                mode={mascotMode}
                lookProgress={lookProgress}
                label={mascotLabel}
              />
            </div>
          </div>

          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: mode === 'register' ? '0.85rem' : '1.35rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: mode === 'register' ? '1.7rem' : '1.85rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 0.3rem',
                letterSpacing: '-0.025em'
              }}
            >
              {mode === 'login' ? 'Đăng Nhập Khám Phá' : 'Tạo Tài Khoản Mới'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
              {mode === 'login'
                ? 'Nhập tài khoản để tiếp tục trải nghiệm & đặt tour 5★'
                : 'Đăng ký thành viên để nhận ưu đãi tour lên tới 500.000 ₫'}
            </p>
          </div>

          {/* Segmented Pill Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.3rem',
              borderRadius: '14px',
              marginBottom: mode === 'register' ? '1rem' : '1.4rem',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveField(null);
                setMascotMode('idle');
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
                boxShadow: mode === 'login' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem'
              }}
            >
              <i className="fa-solid fa-right-to-bracket" style={{ color: mode === 'login' ? '#059669' : '#94a3b8' }}></i> Đăng Nhập
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveField(null);
                setMascotMode('idle');
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
                boxShadow: mode === 'register' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem'
              }}
            >
              <i className="fa-solid fa-user-plus" style={{ color: mode === 'register' ? '#059669' : '#94a3b8' }}></i> Đăng Ký
            </button>
          </div>

          {/* Error Message Box — handles both regular errors and locked account notices */}
          {errorMsg && (() => {
            const isSuspendedNotice =
              errorMsg.includes('bị tạm khóa') ||
              errorMsg.includes('bị xóa') ||
              errorMsg.includes('ngưng hoạt động') ||
              errorMsg.includes('tạm đình chỉ') ||
              errorMsg.includes('vô hiệu hóa');

            if (isSuspendedNotice) {
              const isStaffAdmin = errorMsg.includes('nhân viên') || errorMsg.includes('quản trị');
              return (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1.5px solid #fca5a5',
                    borderRadius: '14px',
                    padding: '1.1rem 1.25rem',
                    marginBottom: '1.25rem',
                    animation: 'fadeIn 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.9rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                    <i className={isStaffAdmin ? 'fa-solid fa-shield-halved' : 'fa-solid fa-lock'} style={{ color: '#dc2626', fontSize: '1rem' }} />
                    <span>{isStaffAdmin ? 'Quyền Quản Trị / Nhân Viên Bị Đình Chỉ' : 'Tài Khoản Tạm Thời Bị Khóa'}</span>
                  </div>
                  <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.83rem', lineHeight: 1.55, color: '#7f1d1d' }}>
                    {errorMsg}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: '#991b1b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-phone" style={{ color: '#dc2626', width: '14px' }} />
                      <span>
                        {isStaffAdmin ? 'Hotline IT Support / Nội Bộ: ' : 'Hotline hỗ trợ: '}
                        <a href={isStaffAdmin ? 'tel:02438889999' : 'tel:19001234'} style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'none' }}>
                          {isStaffAdmin ? '024 3888 9999 (Máy lẻ 101)' : '1900 1234'}
                        </a>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-envelope" style={{ color: '#dc2626', width: '14px' }} />
                      <span>
                        {isStaffAdmin ? 'Email An Ninh Nội Bộ: ' : 'Email: '}
                        <a href={isStaffAdmin ? 'mailto:admin-security@webtravel.vn' : 'mailto:hotro@webtravel.vn'} style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'none' }}>
                          {isStaffAdmin ? 'admin-security@webtravel.vn' : 'hotro@webtravel.vn'}
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
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
            );
          })()}

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
                <div className={`wt-floating-group ${fullName.trim().length > 0 ? 'is-floating' : ''}`}>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    className="wt-floating-input"
                    value={fullName}
                    onFocus={() => {
                      setActiveField('fullname');
                      setMascotMode('watching');
                    }}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => {
                      setActiveField(null);
                      setMascotMode('idle');
                    }}
                    placeholder=" "
                  />
                  <i className="fa-solid fa-user wt-floating-icon" />
                  <label htmlFor="reg-fullname" className="wt-floating-label">
                    {renderWavyLabel('Họ và tên của bạn *')}
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div className={`wt-floating-group ${phone.length > 0 ? 'is-floating' : ''} ${phoneTouched && phone.length > 0 ? (phoneValidation.isValid ? 'has-success' : 'has-error') : ''}`} style={{ marginBottom: 0 }}>
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        maxLength={10}
                        className="wt-floating-input"
                        value={phone}
                        onFocus={() => {
                          setActiveField('phone');
                          setMascotMode('watching');
                        }}
                        onChange={(e) => {
                          const clean = sanitizePhone(e.target.value);
                          setPhone(clean);
                          setPhoneTouched(true);
                        }}
                        onBlur={() => {
                          setPhoneTouched(true);
                          setActiveField(null);
                          setMascotMode('idle');
                        }}
                        placeholder=" "
                      />
                      <i className="fa-solid fa-phone wt-floating-icon" />
                      <label htmlFor="reg-phone" className="wt-floating-label">
                        {renderWavyLabel('Số điện thoại *')}
                      </label>
                    </div>
                    {phoneTouched && phone.length > 0 && (
                      <div style={{
                        fontSize: '0.74rem',
                        marginTop: '0.35rem',
                        color: phoneValidation.isValid ? '#059669' : '#dc2626',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <i className={`fa-solid ${phoneValidation.isValid ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
                        <span>{phoneValidation.isValid ? 'SĐT hợp lệ' : phoneValidation.error}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className={`wt-floating-group ${address.trim().length > 0 ? 'is-floating' : ''}`} style={{ marginBottom: 0 }}>
                      <input
                        id="reg-address"
                        type="text"
                        required
                        className="wt-floating-input"
                        value={address}
                        onFocus={() => {
                          setActiveField('address');
                          setMascotMode('watching');
                        }}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={() => {
                          setActiveField(null);
                          setMascotMode('idle');
                        }}
                        placeholder=" "
                      />
                      <i className="fa-solid fa-location-dot wt-floating-icon" />
                      <label htmlFor="reg-address" className="wt-floating-label">
                        {renderWavyLabel('Địa chỉ liên hệ *')}
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className={`wt-floating-group ${email.length > 0 ? 'is-floating' : ''} ${mode === 'register' && emailTouched && email.length > 0 ? (emailValidation.isValid ? 'has-success' : 'has-error') : ''}`}>
              <input
                id="login-email"
                type="email"
                required
                className="wt-floating-input"
                value={email}
                onFocus={() => {
                  setActiveField('email');
                  setMascotMode('watching');
                }}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (mode === 'register') setEmailTouched(true);
                }}
                onBlur={() => {
                  if (mode === 'register') setEmailTouched(true);
                  setActiveField(null);
                  setMascotMode('idle');
                }}
                placeholder=" "
              />
              <i className="fa-solid fa-envelope wt-floating-icon" />
              <label htmlFor="login-email" className="wt-floating-label">
                {renderWavyLabel('Địa chỉ Email *')}
              </label>
            </div>
            {mode === 'register' && emailTouched && email.length > 0 && !emailValidation.isValid && (
              <div style={{ fontSize: '0.74rem', marginTop: '-0.85rem', marginBottom: '0.85rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="fa-solid fa-triangle-exclamation" />
                <span>{emailValidation.error}</span>
              </div>
            )}

            {/* PASSWORD */}
            <div className={`wt-floating-group ${password.length > 0 ? 'is-floating' : ''} ${mode === 'register' && passwordTouched && password.length > 0 ? (isPasswordValid ? 'has-success' : 'has-error') : ''}`}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="wt-floating-input has-eye"
                value={password}
                onFocus={() => {
                  setActiveField('password');
                  setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                }}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (mode === 'register') setPasswordTouched(true);
                  setActiveField('password');
                  setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                }}
                onBlur={() => {
                  if (mode === 'register') setPasswordTouched(true);
                  setActiveField(null);
                  setMascotMode('idle');
                }}
                placeholder=" "
              />
              <i className="fa-solid fa-lock wt-floating-icon" />
              <label htmlFor="login-password" className="wt-floating-label">
                {renderWavyLabel('Mật khẩu *')}
              </label>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const next = !showPassword;
                  setShowPassword(next);
                  setActiveField('password');
                  setMascotMode(next ? 'peeking' : 'blindfolded');
                }}
                className="wt-floating-eye"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {/* Password Strength Meter (Register Mode) */}
            {mode === 'register' && (
              <PasswordStrengthMeter password={password} />
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
                <span
                  style={{ fontSize: '0.82rem', color: '#047857', cursor: 'pointer', fontWeight: 600 }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Quên mật khẩu?
                </span>
              </div>
            )}

            {/* CONFIRM PASSWORD (ONLY IN REGISTER MODE) */}
            {mode === 'register' && (
              <>
                <div className={`wt-floating-group ${confirmPassword.length > 0 ? 'is-floating' : ''} ${confirmPasswordTouched && confirmPassword.length > 0 ? (password === confirmPassword ? 'has-success' : 'has-error') : ''}`}>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="wt-floating-input has-eye"
                    value={confirmPassword}
                    onFocus={() => {
                      setActiveField('confirmPassword');
                      setMascotMode(showConfirmPassword ? 'peeking' : 'blindfolded');
                    }}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordTouched(true);
                      setActiveField('confirmPassword');
                      setMascotMode(showConfirmPassword ? 'peeking' : 'blindfolded');
                    }}
                    onBlur={() => {
                      setConfirmPasswordTouched(true);
                      setActiveField(null);
                      setMascotMode('idle');
                    }}
                    placeholder=" "
                  />
                  <i className="fa-solid fa-shield-halved wt-floating-icon" />
                  <label htmlFor="reg-confirm-password" className="wt-floating-label">
                    {renderWavyLabel('Xác nhận lại mật khẩu *')}
                  </label>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const next = !showConfirmPassword;
                      setShowConfirmPassword(next);
                      setActiveField('confirmPassword');
                      setMascotMode(next ? 'peeking' : 'blindfolded');
                    }}
                    className="wt-floating-eye"
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
                {confirmPasswordTouched && confirmPassword.length > 0 && (
                  <div style={{
                    fontSize: '0.74rem',
                    marginTop: '-0.85rem',
                    marginBottom: '0.85rem',
                    color: password === confirmPassword ? '#059669' : '#dc2626',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <i className={`fa-solid ${password === confirmPassword ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
                    <span>{password === confirmPassword ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận không khớp'}</span>
                  </div>
                )}
              </>
            )}

            {/* MAGNETIC SUBMIT BUTTON WITH LIQUID RIPPLE */}
            <MagneticButton
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
            </MagneticButton>
          </form>

          {/* Security Guarantee Footnote */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.76rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#059669' }}></i>
              <span>Bảo mật chuẩn SSL 256-bit • Mã hóa tài khoản Supabase Cloud</span>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Bottom Ambient Live Location Badge & Destination Switcher */}
      <footer
        className="login-ambient-footer"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 3rem',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Destination Info Capsule */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.35rem 0.95rem',
            borderRadius: '30px',
            color: '#ffffff',
            fontSize: '0.78rem'
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
          <i className="fa-solid fa-location-dot" style={{ color: '#6ee7b7' }} />
          <span style={{ fontWeight: 600 }}>{slide.location}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ color: '#fde047', fontWeight: 700 }}>{slide.rating}</span>
        </div>

        {/* Carousel Slide Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              style={{
                width: i === currentSlide ? '28px' : '8px',
                height: '8px',
                borderRadius: '10px',
                background: i === currentSlide ? '#34d399' : 'rgba(255, 255, 255, 0.35)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

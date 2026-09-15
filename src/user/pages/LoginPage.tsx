import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { UserProfile } from '../../auth/auth.types';
import { useModalPopup } from '../../context/ModalPopupContext';
import { sanitizePhone, validatePhone, validateEmail, translateAuthError } from '../../utils/formValidation';
import { TravelMascot, MascotMode } from '../components/auth/TravelMascot';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { MagneticButton } from '../components/common/MagneticButton';

// Destination slides for the visual hero overlay
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
  const { showSuccess, showError } = useModalPopup();
  const isSubmittingLoginRef = useRef(false);

  // Core mode: 'login' (Sign In) or 'register' (Sign Up)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation touch trackers
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

  // Helper to determine destination based on role: staff/admin -> /admin, customer -> /home
  const getDestination = (targetUser: UserProfile | null | undefined): string => {
    if (!targetUser) return '/home';
    const isStaffOrAdmin =
      targetUser.role === 'staff' || targetUser.role === 'admin' || targetUser.role === 'super_admin';

    if (isStaffOrAdmin) {
      if (redirectParam && redirectParam.startsWith('/admin')) return redirectParam;
      if (fromState && fromState.startsWith('/admin')) return fromState;
      return '/admin';
    }

    if (redirectParam && !redirectParam.startsWith('/admin')) return redirectParam;
    if (fromState && !fromState.startsWith('/admin')) return fromState;
    return '/home';
  };

  const { lookProgress, mascotLabel } = useMemo(() => {
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

  // Auto-rotate hero visual slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Ensure inputs always start completely empty on page visit (prevent browser autofill)
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setAddress('');
  }, []);

  // CRITICAL: Wait for auth to finish loading before redirecting.
  useEffect(() => {
    if (isSubmittingLoginRef.current) return;
    if (!isAuthLoading && isAuthenticated && user && user.status !== 'banned' && user.status !== 'deleted') {
      const targetDestination = getDestination(user);
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, redirectParam, fromState]);

  // Handle Sign In submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
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
    } catch (err: any) {
      isSubmittingLoginRef.current = false;
      const translated = translateAuthError(err?.message || 'Có lỗi xảy ra trong quá trình xử lý.');
      setErrorMsg(translated);
      showError('Có Lỗi Xảy Ra', translated);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
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

    setIsSubmitting(true);
    try {
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

  // Helper for rendering error box
  const renderErrorNotice = () => {
    if (!errorMsg) return null;
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
            padding: '1rem 1.15rem',
            marginBottom: '1rem',
            animation: 'fadeIn 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.88rem', color: '#991b1b', marginBottom: '0.4rem' }}>
            <i className={isStaffAdmin ? 'fa-solid fa-shield-halved' : 'fa-solid fa-lock'} style={{ color: '#dc2626', fontSize: '1rem' }} />
            <span>{isStaffAdmin ? 'Quyền Quản Trị / Nhân Viên Bị Đình Chỉ' : 'Tài Khoản Tạm Thời Bị Khóa'}</span>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5, color: '#7f1d1d' }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem', color: '#991b1b' }}>
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
          padding: '0.7rem 0.9rem',
          borderRadius: '12px',
          fontSize: '0.82rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s'
        }}
      >
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.95rem' }}></i>
        <span>{errorMsg}</span>
      </div>
    );
  };

  return (
    <div className="wt-auth-page-wrapper">
      <style>{`
        /* Root Wrapper */
        .wt-auth-page-wrapper {
          position: fixed;
          inset: 0;
          width: 100vw;
          min-height: 100vh;
          background: #022c22;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          overflow: hidden;
          padding: 1.5rem;
          box-sizing: border-box;
        }

        /* Ambient Scenery Blur Background */
        .wt-ambient-backdrop {
          position: absolute;
          inset: -30px;
          background-size: cover;
          background-position: center;
          filter: blur(28px) brightness(0.42);
          transform: scale(1.08);
          transition: background-image 1.2s ease-in-out;
          z-index: 1;
        }

        .wt-ambient-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(6, 78, 59, 0.4) 0%, rgba(2, 44, 34, 0.88) 75%, rgba(15, 23, 42, 0.96) 100%);
          z-index: 2;
        }

        /* ========================================================= */
        /* MAIN SLIDING AUTH CONTAINER CARD                          */
        /* ========================================================= */
        .wt-auth-card {
          position: relative;
          width: 1060px;
          max-width: 95vw;
          height: 680px;
          max-height: 90vh;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15);
          overflow: hidden;
          display: flex;
          z-index: 10;
        }

        /* Form Sub-Panels */
        .wt-form-container {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          transition: all 0.65s cubic-bezier(0.65, 0, 0.35, 1);
          overflow-y: auto;
          padding: 2.25rem 2.8rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        /* Hide scrollbars cleanly but allow scroll if small monitor */
        .wt-form-container::-webkit-scrollbar {
          width: 6px;
        }
        .wt-form-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        /* Sign In Container (Sits on the Left initially) */
        .wt-sign-in-container {
          left: 0;
          z-index: 2;
          opacity: 1;
          transform: translateX(0);
        }

        .wt-auth-card.right-panel-active .wt-sign-in-container {
          transform: translateX(100%);
          opacity: 0;
          pointer-events: none;
          z-index: 1;
        }

        /* Sign Up Container (Sits hidden on the Left initially, slides right) */
        .wt-sign-up-container {
          left: 0;
          opacity: 0;
          z-index: 1;
          pointer-events: none;
          transform: translateX(0);
        }

        .wt-auth-card.right-panel-active .wt-sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          pointer-events: all;
          animation: showSignUpForm 0.65s cubic-bezier(0.65, 0, 0.35, 1);
        }

        @keyframes showSignUpForm {
          0%, 49.99% {
            opacity: 0;
            z-index: 1;
          }
          50%, 100% {
            opacity: 1;
            z-index: 5;
          }
        }

        /* ========================================================= */
        /* SLIDING OVERLAY CONTAINER (THE TRAVEL CURTAIN)             */
        /* ========================================================= */
        .wt-overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1),
                      border-radius 0.7s cubic-bezier(0.65, 0, 0.35, 1),
                      box-shadow 0.7s cubic-bezier(0.65, 0, 0.35, 1);
          z-index: 100;
          border-radius: 48px 0 0 48px;
          box-shadow: -20px 0 50px rgba(0, 0, 0, 0.28);
        }

        .wt-auth-card.right-panel-active .wt-overlay-container {
          transform: translateX(-100%);
          border-radius: 0 48px 48px 0;
          box-shadow: 20px 0 50px rgba(0, 0, 0, 0.28);
        }

        .wt-overlay {
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          background: #022c22;
          transform: translateX(0);
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1);
          overflow: hidden;
        }

        .wt-auth-card.right-panel-active .wt-overlay {
          transform: translateX(50%);
        }

        /* Overlay Scenery Background Slides */
        .wt-overlay-bg-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: opacity 1.2s ease-in-out, transform 8s ease-out;
          z-index: 1;
        }

        .wt-overlay-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(6, 78, 59, 0.72) 0%, rgba(2, 44, 34, 0.5) 45%, rgba(15, 23, 42, 0.94) 100%);
          z-index: 2;
        }

        /* Overlay Child Panels (Left & Right) */
        .wt-overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: column;
          padding: 3rem 2.8rem;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1);
          color: #ffffff;
          box-sizing: border-box;
          z-index: 3;
        }

        .wt-overlay-left {
          transform: translateX(-20%);
          left: 0;
        }

        .wt-auth-card.right-panel-active .wt-overlay-left {
          transform: translateX(0);
        }

        .wt-overlay-right {
          right: 0;
          transform: translateX(0);
        }

        .wt-auth-card.right-panel-active .wt-overlay-right {
          transform: translateX(20%);
        }

        /* Staggered Content Animation for Overlay Panels (Inspired by JunaidShamnad) */
        .wt-overlay-badge,
        .wt-overlay-content,
        .wt-overlay-card,
        .wt-ghost-slider-btn {
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.5s ease;
        }

        /* Left Panel elements in default mode */
        .wt-overlay-left .wt-overlay-badge {
          transform: translateX(-40px);
          opacity: 0;
          transition-delay: 0.08s;
        }
        .wt-overlay-left .wt-overlay-content {
          transform: translateX(-50px);
          opacity: 0;
          transition-delay: 0.16s;
        }
        .wt-overlay-left .wt-overlay-card {
          transform: translateX(-40px);
          opacity: 0;
          transition-delay: 0.22s;
        }
        .wt-overlay-left .wt-ghost-slider-btn {
          transform: translateX(-40px);
          opacity: 0;
          transition-delay: 0.28s;
        }

        /* When Right Panel Active (Left Panel sliding in) */
        .wt-auth-card.right-panel-active .wt-overlay-left .wt-overlay-badge,
        .wt-auth-card.right-panel-active .wt-overlay-left .wt-overlay-content,
        .wt-auth-card.right-panel-active .wt-overlay-left .wt-overlay-card,
        .wt-auth-card.right-panel-active .wt-overlay-left .wt-ghost-slider-btn {
          transform: translateX(0);
          opacity: 1;
        }

        /* Right Panel elements in default mode */
        .wt-overlay-right .wt-overlay-badge {
          transform: translateX(0);
          opacity: 1;
          transition-delay: 0.08s;
        }
        .wt-overlay-right .wt-overlay-content {
          transform: translateX(0);
          opacity: 1;
          transition-delay: 0.16s;
        }
        .wt-overlay-right .wt-overlay-card {
          transform: translateX(0);
          opacity: 1;
          transition-delay: 0.22s;
        }
        .wt-overlay-right .wt-ghost-slider-btn {
          transform: translateX(0);
          opacity: 1;
          transition-delay: 0.28s;
        }

        /* When Right Panel Active (Right Panel sliding out) */
        .wt-auth-card.right-panel-active .wt-overlay-right .wt-overlay-badge {
          transform: translateX(40px);
          opacity: 0;
        }
        .wt-auth-card.right-panel-active .wt-overlay-right .wt-overlay-content {
          transform: translateX(50px);
          opacity: 0;
        }
        .wt-auth-card.right-panel-active .wt-overlay-right .wt-overlay-card {
          transform: translateX(40px);
          opacity: 0;
        }
        .wt-auth-card.right-panel-active .wt-overlay-right .wt-ghost-slider-btn {
          transform: translateX(40px);
          opacity: 0;
        }

        /* Ghost Pill Button on the Overlay */
        .wt-ghost-slider-btn {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 2px solid rgba(255, 255, 255, 0.9);
          color: #ffffff;
          padding: 0.85rem 2.2rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          margin-top: 1.25rem;
          outline: none;
        }

        .wt-ghost-slider-btn:hover {
          background: #ffffff;
          color: #047857;
          border-color: #ffffff;
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 15px 32px rgba(0, 0, 0, 0.45);
        }

        .wt-ghost-slider-btn:active {
          transform: translateY(0) scale(0.98);
        }

        /* ========================================================= */
        /* FLOATING LABELS & PILL-SHAPED INPUT STYLING               */
        /* ========================================================= */
        .wt-floating-group {
          position: relative;
          margin-bottom: 0.95rem;
        }

        .wt-floating-input {
          width: 100%;
          height: 52px;
          padding: 0 1.25rem 0 3.1rem;
          border-radius: 50px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-size: 0.92rem;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }

        .wt-floating-input.has-eye {
          padding-right: 3.1rem;
        }

        .wt-floating-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1rem;
          pointer-events: none;
          transition: color 0.22s ease;
          z-index: 2;
        }

        .wt-floating-label {
          position: absolute;
          left: 3.1rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          user-select: none;
        }

        .wt-floating-label::before {
          content: '';
          position: absolute;
          left: -8px;
          right: -8px;
          top: 50%;
          height: 16px;
          background-color: #ffffff;
          border-radius: 6px;
          z-index: -1;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-50%) scale(0.85);
          transition: transform 0.26s cubic-bezier(0.5, 0, 0.5, 1.4), opacity 0.2s ease;
        }

        .wt-wavy-char {
          display: inline-block;
          font-size: 0.88rem;
          color: #64748b;
          font-weight: 500;
          position: relative;
          z-index: 2;
          transition: transform 0.26s cubic-bezier(0.5, 0, 0.5, 1.4),
                      color 0.22s ease,
                      font-size 0.22s ease,
                      font-weight 0.22s ease,
                      background-color 0.18s ease;
          padding: 0 1px;
          border-radius: 2px;
        }

        .wt-floating-group:hover .wt-floating-input {
          border-color: #10b981;
          background: #ffffff;
        }

        .wt-floating-group:hover .wt-floating-label::before,
        .wt-floating-input:focus ~ .wt-floating-label::before,
        .wt-floating-group.is-floating .wt-floating-label::before,
        .wt-floating-group:focus-within .wt-floating-label::before,
        .wt-floating-input:-webkit-autofill ~ .wt-floating-label::before,
        .wt-floating-input:autofill ~ .wt-floating-label::before {
          opacity: 1;
          transform: translateY(-27px) scale(1);
        }

        .wt-floating-group:hover .wt-floating-icon {
          color: #059669;
        }

        .wt-floating-group:hover .wt-wavy-char {
          transform: translateY(-27px) scale(0.85);
          color: #059669;
          font-weight: 700;
          background-color: #ffffff;
        }

        .wt-floating-input:focus {
          border-color: #059669 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14) !important;
        }

        .wt-floating-input:focus ~ .wt-floating-icon {
          color: #059669;
        }

        .wt-floating-input:focus ~ .wt-floating-label .wt-wavy-char {
          transform: translateY(-27px) scale(0.85);
          color: #059669 !important;
          font-weight: 700;
          background-color: #ffffff;
        }

        .wt-floating-group.is-floating .wt-wavy-char {
          transform: translateY(-27px) scale(0.85);
          font-weight: 700;
          color: #475569;
          background-color: #ffffff;
        }

        .wt-floating-group.is-floating:hover .wt-wavy-char,
        .wt-floating-group.is-floating:focus-within .wt-wavy-char {
          color: #059669;
          background-color: #ffffff;
        }

        .wt-floating-input:-webkit-autofill ~ .wt-floating-label .wt-wavy-char,
        .wt-floating-input:autofill ~ .wt-floating-label .wt-wavy-char {
          transform: translateY(-27px) scale(0.85);
          font-weight: 700;
          color: #059669;
          background-color: #ffffff;
        }

        .wt-floating-group.has-error .wt-floating-input {
          border-color: #ef4444 !important;
          background: #fef2f2 !important;
        }

        .wt-floating-group.has-error .wt-floating-icon,
        .wt-floating-group.has-error .wt-wavy-char {
          color: #dc2626 !important;
          background-color: #ffffff;
        }

        .wt-floating-group.has-success .wt-floating-input {
          border-color: #10b981 !important;
        }

        .wt-floating-group.has-success .wt-floating-icon,
        .wt-floating-group.has-success .wt-wavy-char {
          color: #059669 !important;
          background-color: #ffffff;
        }

        .wt-floating-eye {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.95rem;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          z-index: 6;
        }

        .wt-floating-eye:hover {
          color: #059669;
        }

        /* ========================================================= */
        /* RESPONSIVE: MOBILE & TABLET FALLBACK (< 880px)            */
        /* ========================================================= */
        @media (max-width: 880px) {
          .wt-auth-page-wrapper {
            padding: 0;
            overflow-y: auto;
            align-items: stretch;
            justify-content: flex-start;
          }
          .wt-auth-card {
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: 100vh;
            border-radius: 0;
            box-shadow: none;
            display: block;
          }
          .wt-overlay-container {
            display: none !important;
          }
          .wt-form-container {
            position: relative;
            width: 100%;
            height: auto;
            transform: none !important;
            padding: 1.5rem;
          }
          .wt-sign-in-container {
            display: ${mode === 'login' ? 'flex' : 'none'};
            opacity: 1 !important;
            pointer-events: all !important;
          }
          .wt-sign-up-container {
            display: ${mode === 'register' ? 'flex' : 'none'};
            opacity: 1 !important;
            pointer-events: all !important;
          }
          .wt-mobile-tab-switch {
            display: flex !important;
          }
        }
      `}</style>

      {/* Atmospheric Scenery Ambient Backdrop */}
      <div
        className="wt-ambient-backdrop"
        style={{ backgroundImage: `url('${slide.image}')` }}
      />
      <div className="wt-ambient-vignette" />

      {/* ========================================================================= */}
      {/* MAIN DOUBLE-SLIDER CARD CONTAINER                                         */}
      {/* ========================================================================= */}
      <div className={`wt-auth-card ${mode === 'register' ? 'right-panel-active' : ''}`}>
        
        {/* ===================================================================== */}
        {/* 1. SIGN IN FORM PANEL (LEFT HALF WHEN ACTIVE)                         */}
        {/* ===================================================================== */}
        <div className="wt-form-container wt-sign-in-container">
          <div style={{ width: '100%', maxWidth: '410px', margin: 'auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem', letterSpacing: '-0.03em' }}>
                Đăng Nhập Khám Phá
              </h1>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                Nhập tài khoản để tiếp tục trải nghiệm & đặt tour
              </p>
            </div>

            {/* Interactive Mascot */}
            <TravelMascot
              mode={mascotMode}
              lookProgress={lookProgress}
              label={mascotLabel}
              style={{ marginBottom: '1.15rem' }}
            />

            {/* Mobile Tab Switcher (Visible only on < 880px) */}
            <div
              className="wt-mobile-tab-switch"
              style={{
                display: 'none',
                background: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}
            >
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  border: 'none',
                  borderRadius: '10px',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#047857' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: mode === 'login' ? '0 3px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  border: 'none',
                  borderRadius: '10px',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#047857' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: mode === 'register' ? '0 3px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-user-plus"></i> Đăng Ký
              </button>
            </div>

            {/* Error Message Box */}
            {mode === 'login' && renderErrorNotice()}

            {/* Success Message Box */}
            {mode === 'login' && successMsg && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.2s'
                }}
              >
                <i className="fa-solid fa-circle-check" style={{ fontSize: '0.95rem' }}></i>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} autoComplete="off">
              {/* EMAIL */}
              <div className={`wt-floating-group ${email.length > 0 ? 'is-floating' : ''}`}>
                <input
                  id="sign-in-email"
                  type="email"
                  required
                  autoComplete="off"
                  className="wt-floating-input"
                  value={email}
                  onFocus={() => {
                    setActiveField('email');
                    setMascotMode('watching');
                  }}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    setActiveField(null);
                    setMascotMode('idle');
                  }}
                  placeholder=" "
                />
                <i className="fa-solid fa-envelope wt-floating-icon" />
                <label htmlFor="sign-in-email" className="wt-floating-label">
                  {renderWavyLabel('Địa chỉ Email *')}
                </label>
              </div>

              {/* PASSWORD */}
              <div className={`wt-floating-group ${password.length > 0 ? 'is-floating' : ''}`}>
                <input
                  id="sign-in-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="wt-floating-input has-eye"
                  value={password}
                  onFocus={() => {
                    setActiveField('password');
                    setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveField('password');
                    setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                  }}
                  onBlur={() => {
                    setActiveField(null);
                    setMascotMode('idle');
                  }}
                  placeholder=" "
                />
                <i className="fa-solid fa-lock wt-floating-icon" />
                <label htmlFor="sign-in-password" className="wt-floating-label">
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

              {/* FORGOT PASSWORD LINK */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.4rem', marginBottom: '1.15rem' }}>
                <span
                  style={{ fontSize: '0.82rem', color: '#047857', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    showError(
                      'Khôi Phục Mật Khẩu',
                      'Hệ thống tự động cấp lại mật khẩu qua email đang được bảo trì. Quý khách vui lòng liên hệ Hotline 1900 1234 hoặc email hotro@webtravel.vn để được hỗ trợ cấp lại ngay.'
                    );
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Quên mật khẩu?
                </span>
              </div>

              {/* SUBMIT BUTTON */}
              <MagneticButton
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.88rem',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(4, 120, 87, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang xác thực...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Vào Hệ Thống
                  </>
                )}
              </MagneticButton>

              {/* Switch link for small screens */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Chưa có tài khoản?{' '}
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
                      background: 'none',
                      border: 'none',
                      color: '#047857',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem'
                    }}
                  >
                    Đăng ký thành viên ngay
                  </button>
                </span>
              </div>
            </form>

            {/* Security Guarantee Footnote */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.74rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#059669' }}></i>
                <span>Bảo mật chuẩn SSL 256-bit • Mã hóa tài khoản Supabase Cloud</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. SIGN UP FORM PANEL (RIGHT HALF WHEN ACTIVE)                        */}
        {/* ===================================================================== */}
        <div className="wt-form-container wt-sign-up-container">
          <div style={{ width: '100%', maxWidth: '420px', margin: 'auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.03em' }}>
                Tạo Tài Khoản Mới
              </h1>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Đăng ký để nhận voucher ưu đãi du lịch lên tới 500.000 ₫
              </p>
            </div>

            {/* Interactive Mascot */}
            <TravelMascot
              mode={mascotMode}
              lookProgress={lookProgress}
              label={mascotLabel}
              style={{ marginBottom: '0.85rem' }}
            />

            {/* Mobile Tab Switcher (Visible only on < 880px) */}
            <div
              className="wt-mobile-tab-switch"
              style={{
                display: 'none',
                background: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}
            >
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  border: 'none',
                  borderRadius: '10px',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#047857' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: mode === 'login' ? '0 3px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  border: 'none',
                  borderRadius: '10px',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#047857' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: mode === 'register' ? '0 3px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-user-plus"></i> Đăng Ký
              </button>
            </div>

            {/* Error Message Box */}
            {mode === 'register' && renderErrorNotice()}

            {/* Success Message Box */}
            {mode === 'register' && successMsg && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.2s'
                }}
              >
                <i className="fa-solid fa-circle-check" style={{ fontSize: '0.95rem' }}></i>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleRegisterSubmit} autoComplete="off">
              {/* FULL NAME */}
              <div className={`wt-floating-group ${fullName.trim().length > 0 ? 'is-floating' : ''}`}>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  autoComplete="off"
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

              {/* 2-COL: PHONE & ADDRESS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.95rem' }}>
                <div>
                  <div className={`wt-floating-group ${phone.length > 0 ? 'is-floating' : ''} ${phoneTouched && phone.length > 0 ? (phoneValidation.isValid ? 'has-success' : 'has-error') : ''}`} style={{ marginBottom: 0 }}>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      maxLength={10}
                      autoComplete="off"
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
                  {phoneTouched && phone.length > 0 && !phoneValidation.isValid && (
                    <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fa-solid fa-triangle-exclamation" />
                      <span>{phoneValidation.error}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className={`wt-floating-group ${address.trim().length > 0 ? 'is-floating' : ''}`} style={{ marginBottom: 0 }}>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      autoComplete="off"
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

              {/* EMAIL */}
              <div className={`wt-floating-group ${email.length > 0 ? 'is-floating' : ''} ${emailTouched && email.length > 0 ? (emailValidation.isValid ? 'has-success' : 'has-error') : ''}`}>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="off"
                  className="wt-floating-input"
                  value={email}
                  onFocus={() => {
                    setActiveField('email');
                    setMascotMode('watching');
                  }}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(true);
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    setActiveField(null);
                    setMascotMode('idle');
                  }}
                  placeholder=" "
                />
                <i className="fa-solid fa-envelope wt-floating-icon" />
                <label htmlFor="reg-email" className="wt-floating-label">
                  {renderWavyLabel('Địa chỉ Email *')}
                </label>
              </div>
              {emailTouched && email.length > 0 && !emailValidation.isValid && (
                <div style={{ fontSize: '0.72rem', marginTop: '-0.7rem', marginBottom: '0.75rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <i className="fa-solid fa-triangle-exclamation" />
                  <span>{emailValidation.error}</span>
                </div>
              )}

              {/* PASSWORD */}
              <div className={`wt-floating-group ${password.length > 0 ? 'is-floating' : ''} ${passwordTouched && password.length > 0 ? (isPasswordValid ? 'has-success' : 'has-error') : ''}`}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="wt-floating-input has-eye"
                  value={password}
                  onFocus={() => {
                    setActiveField('password');
                    setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTouched(true);
                    setActiveField('password');
                    setMascotMode(showPassword ? 'peeking' : 'blindfolded');
                  }}
                  onBlur={() => {
                    setPasswordTouched(true);
                    setActiveField(null);
                    setMascotMode('idle');
                  }}
                  placeholder=" "
                />
                <i className="fa-solid fa-lock wt-floating-icon" />
                <label htmlFor="reg-password" className="wt-floating-label">
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

              {/* Password Strength Meter */}
              <PasswordStrengthMeter password={password} />

              {/* CONFIRM PASSWORD */}
              <div className={`wt-floating-group ${confirmPassword.length > 0 ? 'is-floating' : ''} ${confirmPasswordTouched && confirmPassword.length > 0 ? (password === confirmPassword ? 'has-success' : 'has-error') : ''}`} style={{ marginTop: '0.85rem' }}>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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
                  fontSize: '0.72rem',
                  marginTop: '-0.7rem',
                  marginBottom: '0.85rem',
                  color: password === confirmPassword ? '#059669' : '#dc2626',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <i className={`fa-solid ${password === confirmPassword ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
                  <span>{password === confirmPassword ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận không khớp'}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <MagneticButton
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.88rem',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(4, 120, 87, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginTop: '0.4rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus"></i> Hoàn Tất Đăng Ký Tài Khoản
                  </>
                )}
              </MagneticButton>

              {/* Switch link for small screens */}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Đã có tài khoản?{' '}
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
                      background: 'none',
                      border: 'none',
                      color: '#047857',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem'
                    }}
                  >
                    Đăng nhập ngay
                  </button>
                </span>
              </div>
            </form>

            {/* Security Guarantee Footnote */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.74rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#059669' }}></i>
                <span>Bảo mật chuẩn SSL 256-bit • Mã hóa tài khoản Supabase Cloud</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. SLIDING OVERLAY CONTAINER (THE DOUBLE SLIDER CURTAIN)              */}
        {/* ===================================================================== */}
        <div className="wt-overlay-container">
          <div className="wt-overlay">
            {/* Background Slides with Crossfade */}
            {HERO_SLIDES.map((s, index) => (
              <div
                key={index}
                className="wt-overlay-bg-slide"
                style={{
                  backgroundImage: `url('${s.image}')`,
                  opacity: index === currentSlide ? 1 : 0,
                  transform: index === currentSlide ? 'scale(1.04)' : 'scale(1)'
                }}
              />
            ))}

            {/* Dark Scrim Gradient */}
            <div className="wt-overlay-scrim" />

            {/* ----------------------------------------------------------------- */}
            {/* OVERLAY LEFT: SHOWN WHEN IN REGISTER MODE (SITS ON LEFT HALF)     */}
            {/* ----------------------------------------------------------------- */}
            <div className="wt-overlay-panel wt-overlay-left">
              {/* Top: Location Badge */}
              <div className="wt-overlay-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(5, 150, 105, 0.45)', border: '1px solid rgba(52, 211, 153, 0.45)', padding: '0.35rem 0.85rem', borderRadius: '30px', fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                <i className="fa-solid fa-location-dot"></i> {slide.location}
              </div>

              {/* Center: Welcome Back Invitation */}
              <div className="wt-overlay-content" style={{ maxWidth: '380px' }}>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.75rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  Chào Mừng Trở Lại!
                </h2>
                <p style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '0.94rem', lineHeight: 1.6 }}>
                  Bạn đã có tài khoản thành viên WebTravel? Hãy đăng nhập ngay để tiếp tục hành trình khám phá và quản lý chuyến đi của bạn.
                </p>

                {/* Rating card capsule */}
                <div className="wt-overlay-card" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.75rem 1rem', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★★★★★</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>{slide.rating}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>Bảo hiểm du lịch toàn cầu chuẩn 1 Tỷ ₫</div>
                </div>

                {/* THE GHOST TRIGGER BUTTON */}
                <button
                  type="button"
                  className="wt-ghost-slider-btn"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setActiveField(null);
                    setMascotMode('idle');
                    setMode('login');
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> ĐĂNG NHẬP NGAY
                </button>
              </div>

              {/* Bottom: Carousel Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      width: i === currentSlide ? '28px' : '8px',
                      height: '8px',
                      borderRadius: '8px',
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
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* OVERLAY RIGHT: SHOWN WHEN IN LOGIN MODE (SITS ON RIGHT HALF)      */}
            {/* ----------------------------------------------------------------- */}
            <div className="wt-overlay-panel wt-overlay-right">
              {/* Top: Location Badge */}
              <div className="wt-overlay-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(5, 150, 105, 0.45)', border: '1px solid rgba(52, 211, 153, 0.45)', padding: '0.35rem 0.85rem', borderRadius: '30px', fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                <i className="fa-solid fa-location-dot"></i> {slide.location}
              </div>

              {/* Center: Welcome New Member Invitation */}
              <div className="wt-overlay-content" style={{ maxWidth: '380px' }}>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.75rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  Chào Bạn Mới!
                </h2>
                <p style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '0.94rem', lineHeight: 1.6 }}>
                  Chưa có tài khoản WebTravel? Hãy gia nhập cộng đồng hơn 50.000+ du khách để nhận ngay ưu đãi chào mừng trị giá 500.000 ₫!
                </p>

                {/* Rating card capsule */}
                <div className="wt-overlay-card" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.75rem 1rem', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★★★★★</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>{slide.rating}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>Bảo hiểm du lịch toàn cầu chuẩn 1 Tỷ ₫</div>
                </div>

                {/* THE GHOST TRIGGER BUTTON */}
                <button
                  type="button"
                  className="wt-ghost-slider-btn"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setActiveField(null);
                    setMascotMode('idle');
                    setMode('register');
                  }}
                >
                  ĐĂNG KÝ TÀI KHOẢN <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              {/* Bottom: Carousel Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      width: i === currentSlide ? '28px' : '8px',
                      height: '8px',
                      borderRadius: '8px',
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
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

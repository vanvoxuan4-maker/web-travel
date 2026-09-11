import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

interface IdleWarningModalProps {
  /** Current countdown value in seconds */
  countdown: number;
  /** Inactivity threshold in minutes (default: 30) */
  idleMinutes?: number;
  /** Admin email — needed to re-authenticate */
  userEmail: string;
  /** Called when password is verified successfully */
  onExtend: () => void;
  /** Called when user clicks "Sign Out Now" */
  onSignOut: () => void;
}

/**
 * IdleWarningModal
 *
 * Khi Admin không thao tác quá `idleMinutes` phút, màn hình bị khóa và
 * yêu cầu nhập lại MẬT KHẨU để mở khóa — không chỉ nhấn nút "Tiếp tục".
 * Điều này ngăn người lạ ngồi vào máy và bypass bảo mật bằng cách bấm nút.
 *
 * Luồng:
 * 1. Admin nhập mật khẩu → supabase.auth.signInWithPassword (xác thực lại)
 * 2. Thành công → gọi onExtend() để reset timer.
 * 3. Sai mật khẩu → hiện lỗi, đếm số lần thử (tối đa 3 lần).
 * 4. Sai 3 lần → tự động đăng xuất ngay lập tức.
 * 5. Hết countdown → tự động đăng xuất.
 */
export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({
  countdown,
  idleMinutes = 30,
  userEmail,
  onExtend,
  onSignOut,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus ô mật khẩu khi modal xuất hiện
  useEffect(() => {
    const timer = setTimeout(() => passwordInputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []);

  // Mức độ gấp gáp theo thời gian còn lại
  const isUrgent = countdown <= 20;
  const isCritical = countdown <= 10;

  // Vòng tròn SVG countdown
  const MAX_COUNTDOWN = 60;
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference * (1 - Math.max(0, countdown / MAX_COUNTDOWN));

  const handleVerify = useCallback(async () => {
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      // Xác thực lại bằng Supabase — không tạo session mới, chỉ kiểm tra credentials
      if (!isSupabaseConfigured || !supabase) {
        // Môi trường dev / mock: cho qua luôn
        onExtend();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPassword('');

        if (newAttempts >= MAX_ATTEMPTS) {
          // Sai 3 lần → đăng xuất tức thì
          onSignOut();
          return;
        }

        setErrorMsg(
          `Mật khẩu không đúng. Còn ${MAX_ATTEMPTS - newAttempts} lần thử. ` +
          (newAttempts === MAX_ATTEMPTS - 1 ? 'Lần sau sai sẽ tự động đăng xuất!' : '')
        );
      } else {
        // Đúng mật khẩu → mở khóa và reset timer
        onExtend();
      }
    } catch {
      setErrorMsg('Không thể kết nối để xác thực. Vui lòng thử lại.');
    } finally {
      setIsVerifying(false);
    }
  }, [password, userEmail, attempts, onExtend, onSignOut]);

  // Nhấn Enter trong ô mật khẩu để xác nhận
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <>
      <style>{`
        @keyframes idle-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes idle-pop-in {
          0%   { opacity: 0; transform: translateY(-28px) scale(0.94); }
          70%  { transform: translateY(3px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes idle-shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes idle-shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes idle-pulse-amber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
        }
        @keyframes idle-pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          50%       { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
        }

        .idle-overlay {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(15, 23, 42, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: idle-fade-in 0.25s ease-out;
          padding: 16px;
        }
        .idle-card {
          position: relative;
          background: radial-gradient(circle at 50% 0%, #fffbeb 0%, #ffffff 55%);
          border: 1.5px solid ${isCritical ? '#f87171' : isUrgent ? '#fbbf24' : '#fed7aa'};
          border-radius: 24px;
          padding: 36px 32px 28px;
          width: min(440px, 100%);
          text-align: center;
          box-shadow: 0 0 0 1px rgba(245,158,11,0.12), 0 24px 65px -12px rgba(220,38,38,0.22), 0 12px 30px -8px rgba(0,0,0,0.12);
          animation: idle-pop-in 0.35s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        .idle-top-stripe {
          position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #f59e0b, #ef4444, #dc2626, #f59e0b);
          background-size: 250% 250%;
          animation: idle-shimmer 3s ease infinite;
        }
        .idle-icon {
          width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 14px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          display: flex; align-items: center; justify-content: center; font-size: 26px;
          box-shadow: 0 8px 20px -4px rgba(239,68,68,0.4);
          animation: ${isCritical ? 'idle-pulse-red 1s infinite' : 'idle-pulse-amber 2s infinite'};
        }
        .idle-ring-wrapper {
          position: relative; width: 96px; height: 96px; margin: 0 auto 16px;
        }
        .idle-ring-svg { transform: rotate(-90deg); }
        .idle-ring-track { fill: none; stroke: #fee2e2; stroke-width: 7; }
        .idle-ring-progress {
          fill: none; stroke-width: 7; stroke-linecap: round;
          transition: stroke-dashoffset 0.9s linear, stroke 0.4s ease;
        }
        .idle-ring-center {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .idle-countdown-num {
          font-size: 30px; font-weight: 900; line-height: 1;
          font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
          color: ${isCritical ? '#dc2626' : isUrgent ? '#ea580c' : '#1e293b'};
        }
        .idle-countdown-unit {
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${isCritical ? '#dc2626' : '#b45309'}; margin-top: 2px;
        }
        .idle-title {
          font-size: 18px; font-weight: 800; color: #0f172a;
          margin: 0 0 6px; letter-spacing: -0.02em;
        }
        .idle-subtitle {
          font-size: 13px; line-height: 1.55; color: #475569; margin: 0 0 20px;
        }
        .idle-badge {
          display: inline-block; padding: 2px 8px; border-radius: 6px;
          font-weight: 700; white-space: nowrap;
        }
        .idle-badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .idle-badge-red { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }

        /* --- Password Section --- */
        .idle-lock-section {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: left;
        }
        .idle-lock-label {
          font-size: 12px; font-weight: 700; color: #374151;
          text-transform: uppercase; letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
        }
        .idle-password-wrapper {
          position: relative;
        }
        .idle-password-input {
          width: 100%; padding: 11px 44px 11px 14px;
          border-radius: 10px; border: 1.5px solid #cbd5e1;
          font-size: 14px; font-weight: 500; color: #0f172a;
          background: #ffffff; outline: none; box-sizing: border-box;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .idle-password-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }
        .idle-password-input.error {
          border-color: #f87171;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.15);
          animation: idle-shake 0.35s ease;
        }
        .idle-toggle-pw {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 14px; padding: 0;
          display: flex; align-items: center;
        }
        .idle-toggle-pw:hover { color: #475569; }
        .idle-error-msg {
          font-size: 12px; color: #dc2626; font-weight: 600;
          margin-top: 8px; display: flex; align-items: flex-start; gap: 5px;
        }
        .idle-attempts-bar {
          display: flex; gap: 4px; margin-top: 10px;
        }
        .idle-attempt-dot {
          flex: 1; height: 4px; border-radius: 4px;
          transition: background 0.3s ease;
        }

        /* --- Buttons --- */
        .idle-btn-unlock {
          width: 100%; padding: 13px 20px; border-radius: 14px; border: none;
          cursor: pointer; font-size: 14px; font-weight: 800;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #ffffff;
          box-shadow: 0 6px 18px -4px rgba(239,68,68,0.4);
          transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 10px;
        }
        .idle-btn-unlock:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .idle-btn-unlock:active:not(:disabled) { transform: translateY(0); }
        .idle-btn-unlock:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .idle-btn-signout {
          width: 100%; padding: 11px 20px; border-radius: 14px;
          border: 1.5px solid #e2e8f0; cursor: pointer; font-size: 13px; font-weight: 700;
          background: #f8fafc; color: #64748b; transition: all 0.2s ease; outline: none;
        }
        .idle-btn-signout:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .idle-footer {
          margin-top: 18px; padding-top: 14px; border-top: 1px solid #f1f5f9;
          font-size: 11.5px; font-weight: 600; color: #94a3b8;
          display: flex; align-items: center; justify-content: center; gap: 5px;
        }
      `}</style>

      <div
        className="idle-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-lock-title"
      >
        <div className="idle-card" onClick={(e) => e.stopPropagation()}>
          <div className="idle-top-stripe" />

          {/* Icon */}
          <div className="idle-icon">
            {isCritical ? '🚨' : '🔐'}
          </div>

          {/* Countdown ring */}
          <div className="idle-ring-wrapper" aria-hidden="true">
            <svg className="idle-ring-svg" width="96" height="96" viewBox="0 0 92 92">
              <defs>
                <linearGradient id="idleLockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <circle className="idle-ring-track" cx="46" cy="46" r="38" />
              <circle
                className="idle-ring-progress"
                cx="46" cy="46" r="38"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                stroke="url(#idleLockGrad)"
              />
            </svg>
            <div className="idle-ring-center">
              <span className="idle-countdown-num">{countdown}</span>
              <span className="idle-countdown-unit">GIÂY</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="idle-title" id="idle-lock-title">
            Màn Hình Quản Trị Đã Khóa
          </h2>
          <p className="idle-subtitle">
            Không có thao tác trong{' '}
            <span className="idle-badge idle-badge-amber">{idleMinutes} phút</span>.
            Nhập mật khẩu để tiếp tục, hoặc phiên sẽ đóng sau{' '}
            <span className="idle-badge idle-badge-red">{countdown} giây</span>.
          </p>

          {/* Password section */}
          <div className="idle-lock-section">
            <div className="idle-lock-label">
              <i className="fa-solid fa-key" style={{ color: '#d97706' }}></i>
              <span>Xác nhận danh tính — {userEmail}</span>
            </div>

            <div className="idle-password-wrapper">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                className={`idle-password-input${errorMsg ? ' error' : ''}`}
                placeholder="Nhập mật khẩu của bạn..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                onKeyDown={handleKeyDown}
                disabled={isVerifying}
                autoComplete="current-password"
                id="idle-password-input"
              />
              <button
                type="button"
                className="idle-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="idle-error-msg" role="alert">
                <i className="fa-solid fa-circle-exclamation" style={{ marginTop: '1px', flexShrink: 0 }}></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Attempts indicator dots */}
            {attempts > 0 && (
              <div className="idle-attempts-bar" aria-hidden="true">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className="idle-attempt-dot"
                    style={{
                      background: i < attempts ? '#ef4444' : '#e2e8f0'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button
            className="idle-btn-unlock"
            onClick={handleVerify}
            disabled={isVerifying || !password.trim()}
            id="idle-btn-unlock"
          >
            {isVerifying
              ? <><i className="fa-solid fa-spinner fa-spin"></i><span>Đang xác thực...</span></>
              : <><i className="fa-solid fa-lock-open"></i><span>Mở Khóa Phiên Làm Việc</span></>
            }
          </button>

          <button
            className="idle-btn-signout"
            onClick={onSignOut}
            id="idle-btn-signout"
          >
            Đăng xuất & Về màn hình đăng nhập
          </button>

          {/* Footer */}
          <div className="idle-footer">
            <span>🛡️</span>
            <span>WebTravel Admin Security — Yêu cầu xác thực lại</span>
          </div>
        </div>
      </div>
    </>
  );
};

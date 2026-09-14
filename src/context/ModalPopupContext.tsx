import React, { createContext, useContext, useState, useRef } from 'react';

export type ModalPopupType = 'success' | 'confirm' | 'warning' | 'error' | 'info';

export interface UserBadgeInfo {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface ModalPopupOptions {
  type?: ModalPopupType;
  title: string;
  message: string | React.ReactNode;
  userBadge?: UserBadgeInfo;
  confirmText?: string;
  cancelText?: string;
  hideConfirmButton?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  autoCloseMs?: number;
}

export interface ModalPopupContextType {
  showPopup: (options: ModalPopupOptions) => void;
  closePopup: () => void;
  showSuccess: (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => void;
  showConfirm: (title: string, message: string | React.ReactNode, onConfirm: () => void | Promise<void>, options?: Partial<ModalPopupOptions>) => void;
  showError: (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => void;
  showInfo: (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => void;
}

const ModalPopupContext = createContext<ModalPopupContextType | undefined>(undefined);

export const ModalPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popupData, setPopupData] = useState<ModalPopupOptions | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const closePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setPopupData(null);
      setIsClosing(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, 200);
  };

  const showPopup = (options: ModalPopupOptions) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setPopupData(options);
    setIsClosing(false);

    if (options.autoCloseMs && options.autoCloseMs > 0) {
      timerRef.current = setTimeout(async () => {
        if (options.onConfirm && options.type !== 'confirm') {
          await options.onConfirm();
        }
        closePopup();
      }, options.autoCloseMs);
    }
  };

  const showSuccess = (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => {
    showPopup({
      type: 'success',
      title,
      message,
      confirmText: 'Xác Nhận ➔',
      ...options
    });
  };

  const showConfirm = (
    title: string,
    message: string | React.ReactNode,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ModalPopupOptions>
  ) => {
    showPopup({
      type: 'confirm',
      title,
      message,
      confirmText: 'Xác Nhận',
      cancelText: 'Hủy Bỏ',
      onConfirm,
      ...options
    });
  };

  const showError = (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => {
    showPopup({
      type: 'error',
      title,
      message,
      confirmText: 'Đóng',
      ...options
    });
  };

  const showInfo = (title: string, message: string | React.ReactNode, options?: Partial<ModalPopupOptions>) => {
    showPopup({
      type: 'info',
      title,
      message,
      confirmText: 'Đã Hiểu',
      ...options
    });
  };

  const handleConfirm = async () => {
    if (popupData?.onConfirm) {
      await popupData.onConfirm();
    }
    closePopup();
  };

  const handleCancel = () => {
    if (popupData?.onCancel) {
      popupData.onCancel();
    }
    closePopup();
  };

  const type = popupData?.type || 'info';

  const typeConfig: Record<ModalPopupType, {
    accentGradient: string;
    iconBg: string;
    iconColor: string;
    icon: string;
    shadowColor: string;
    defaultConfirmText: string;
    buttonGradient: string;
  }> = {
    success: {
      accentGradient: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #34d399 100%)',
      iconBg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      iconColor: '#059669',
      icon: 'fa-circle-check',
      shadowColor: 'rgba(16, 185, 129, 0.35)',
      defaultConfirmText: 'Tiếp Tục ➔',
      buttonGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    confirm: {
      accentGradient: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #f97316 100%)',
      iconBg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      iconColor: '#dc2626',
      icon: 'fa-arrow-right-from-bracket',
      shadowColor: 'rgba(220, 38, 38, 0.35)',
      defaultConfirmText: 'Đồng Ý',
      buttonGradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    },
    warning: {
      accentGradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
      iconBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      iconColor: '#d97706',
      icon: 'fa-triangle-exclamation',
      shadowColor: 'rgba(217, 119, 6, 0.35)',
      defaultConfirmText: 'Xác Nhận',
      buttonGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    error: {
      accentGradient: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
      iconBg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      iconColor: '#dc2626',
      icon: 'fa-circle-xmark',
      shadowColor: 'rgba(220, 38, 38, 0.35)',
      defaultConfirmText: 'Đóng',
      buttonGradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
    },
    info: {
      accentGradient: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
      iconBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      iconColor: '#2563eb',
      icon: 'fa-circle-info',
      shadowColor: 'rgba(37, 99, 235, 0.35)',
      defaultConfirmText: 'Đã Hiểu',
      buttonGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }
  };

  const currentConfig = typeConfig[type];

  return (
    <ModalPopupContext.Provider
      value={{
        showPopup,
        closePopup,
        showSuccess,
        showConfirm,
        showError,
        showInfo
      }}
    >
      {children}

      {/* Global Center Modal Dialog */}
      {popupData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1.25rem',
            opacity: isClosing ? 0 : 1,
            transition: 'opacity 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && popupData.type !== 'confirm') {
              closePopup();
            }
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '26px',
              padding: '2.25rem 2rem 1.85rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              transform: isClosing ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.2s ease-out'
            }}
          >
            {/* Top Accent Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: currentConfig.accentGradient
              }}
            />

            {/* Icon Squircle Badge */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: currentConfig.iconBg,
                color: currentConfig.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.35rem',
                fontSize: '2rem',
                boxShadow: `0 8px 24px -4px ${currentConfig.shadowColor}`,
                border: '1.5px solid rgba(255, 255, 255, 0.8)'
              }}
            >
              <i className={`fa-solid ${currentConfig.icon}`} />
            </div>

            {/* Title */}
            <h3
              style={{
                margin: '0 0 0.55rem',
                fontSize: '1.38rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: 1.25
              }}
            >
              {popupData.title}
            </h3>

            {/* Message */}
            <div
              style={{
                fontSize: '0.92rem',
                color: '#475569',
                lineHeight: 1.55,
                margin: '0 0 1.35rem',
                wordBreak: 'break-word'
              }}
            >
              {popupData.message}
            </div>

            {/* User Profile Preview Card (Optional) */}
            {popupData.userBadge && (
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                      color: '#ffffff',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      overflow: 'hidden',
                      border: '1.5px solid rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {popupData.userBadge.avatarUrl ? (
                      <img
                        src={popupData.userBadge.avatarUrl}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      (popupData.userBadge.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '1.5px solid #ffffff'
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {popupData.userBadge.name}
                  </div>
                  {popupData.userBadge.email && (
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {popupData.userBadge.email}
                    </div>
                  )}
                </div>

                {popupData.userBadge.role && (
                  <span
                    style={{
                      background:
                        popupData.userBadge.role === 'super_admin'
                          ? '#fef3c7'
                          : popupData.userBadge.role === 'admin'
                          ? '#eff6ff'
                          : '#ecfdf5',
                      color:
                        popupData.userBadge.role === 'super_admin'
                          ? '#b45309'
                          : popupData.userBadge.role === 'admin'
                          ? '#1d4ed8'
                          : '#047857',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {popupData.userBadge.role === 'super_admin'
                      ? '👑 Super Admin'
                      : popupData.userBadge.role === 'admin'
                      ? '🛡️ Quản Trị'
                      : popupData.userBadge.role === 'staff'
                      ? '🧑‍💼 Nhân Viên'
                      : 'Thành Viên'}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {popupData.type === 'confirm' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {popupData.cancelText || 'Ở Lại'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: currentConfig.buttonGradient,
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${currentConfig.shadowColor}`,
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {popupData.confirmText || currentConfig.defaultConfirmText}
                </button>
              </div>
            ) : popupData.hideConfirmButton ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  color: currentConfig.iconColor,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  padding: '0.35rem 0 0.15rem'
                }}
              >
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.05rem' }} />
                <span>Đang tự động chuyển hướng...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  width: '100%',
                  padding: '0.82rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: currentConfig.buttonGradient,
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${currentConfig.shadowColor}`,
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {popupData.confirmText || currentConfig.defaultConfirmText}
              </button>
            )}

            {/* Auto Close Countdown indicator */}
            {popupData.autoCloseMs && popupData.autoCloseMs > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  background: currentConfig.iconColor,
                  width: '100%',
                  animation: `progressShrink ${popupData.autoCloseMs}ms linear forwards`
                }}
              />
            )}
          </div>
        </div>
      )}
    </ModalPopupContext.Provider>
  );
};

export const useModalPopup = (): ModalPopupContextType => {
  const context = useContext(ModalPopupContext);
  if (!context) {
    throw new Error('useModalPopup must be used within a ModalPopupProvider');
  }
  return context;
};

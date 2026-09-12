import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { profileService } from '../../services/profileService';
import { sanitizePhone, validatePhone } from '../../utils/formValidation';

export const AccountModule: React.FC = () => {
  const { user, changePassword, refreshProfile } = useAuth();

  // Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Password Strength Meter
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) return { score, label: 'Mật khẩu yếu', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Mật khẩu trung bình', color: '#f59e0b' };
    return { score, label: 'Mật khẩu mạnh & an toàn', color: '#10b981' };
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!fullName.trim()) {
      setProfileErrorMsg('Vui lòng nhập họ và tên.');
      setIsSavingProfile(false);
      return;
    }

    if (phone.trim()) {
      const phoneCheck = validatePhone(phone.trim());
      if (!phoneCheck.isValid) {
        setProfileErrorMsg(phoneCheck.error || 'Số điện thoại không hợp lệ.');
        setIsSavingProfile(false);
        return;
      }
    }

    try {
      const res = await profileService.updateUserProfile(user.id, {
        fullName: fullName.trim(),
        phone: sanitizePhone(phone.trim()),
        address: address.trim(),
        avatarUrl: avatarUrl.trim()
      });

      if (res.success) {
        setProfileSuccessMsg('Cập nhật hồ sơ tài khoản thành công!');
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => setProfileSuccessMsg(''), 5000);
      } else {
        setProfileErrorMsg(res.error || 'Không thể lưu thông tin, vui lòng thử lại.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccessMsg('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới để đăng nhập các lần sau.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 6000);
      } else {
        setPasswordErrorMsg(res.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format role label & badge
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Tổng Quản Trị Hệ Thống',
          badge: '👑 Super Admin',
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a'
        };
      case 'admin':
        return {
          label: 'Quản Trị Viên Phân Hệ',
          badge: '🛡️ Quản Trị Viên',
          bg: '#dcfce7',
          color: '#166534',
          border: '#bbf7d0'
        };
      default:
        return {
          label: 'Nhân Viên Vận Hành',
          badge: '🧑‍💼 Điều Hành Viên',
          bg: '#e0f2fe',
          color: '#075985',
          border: '#bae6fd'
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ================= HERO CARD: HỒ SƠ TỔNG QUAN ================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '2rem 2.5rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          {/* Large Avatar */}
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
              background: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              flexShrink: 0
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              (fullName || 'A').charAt(0).toUpperCase()
            )}
          </div>

          {/* User Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {user?.fullName || 'Quản Trị Viên'}
              </h2>
              <span
                style={{
                  background: roleInfo.bg,
                  color: roleInfo.color,
                  border: `1px solid ${roleInfo.border}`,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {roleInfo.badge}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#38bdf8' }}></i>
                {user?.email || 'Chưa liên kết email'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-phone" style={{ color: '#34d399' }}></i>
                {user?.phone || 'Chưa cập nhật số điện thoại'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
                Trạng thái: <strong>Đang Hoạt Động</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Security badge pill */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '0.75rem 1.25rem',
            textAlign: 'right',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Phân Quyền Thao Tác
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
            {roleInfo.label}
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN MAIN CONTENT ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }} className="admin-account-grid">
        
        {/* ================= COLUMN 1: CẬP NHẬT THÔNG TIN CÁ NHÂN ================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-user-pen" style={{ color: '#047857' }}></i>
              Thông Tin Cá Nhân &amp; Hồ Sơ
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem' }}>
              Quản lý tên hiển thị, số điện thoại liên hệ công tác và ảnh đại diện trên hệ thống
            </p>
          </div>

          {/* Feedback alerts */}
          {profileSuccessMsg && (
            <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Họ và Tên */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Họ và Tên Quản Trị Viên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Võ Xuân Văn"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Địa Chỉ Email Đăng Nhập (Cố Định)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.9rem',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box'
                  }}
                />
                <i className="fa-solid fa-lock" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                Email được định danh theo tài khoản Supabase Auth, không thể tự chỉnh sửa.
              </span>
            </div>

            {/* Số Điện Thoại */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Số Điện Thoại Liên Hệ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Avatar URL & Live Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Link Ảnh Đại Diện (Avatar URL)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {avatarUrl && (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1.5px solid #e2e8f0',
                      flexShrink: 0
                    }}
                    title="Xem trước ảnh"
                  >
                    <img
                      src={avatarUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Địa Chỉ */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Địa Chỉ Văn Phòng / Nơi Làm Việc
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Trụ sở WebTravel Hồ Chí Minh"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit button */}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSavingProfile}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.25)',
                  transition: 'background 0.2s'
                }}
              >
                {isSavingProfile ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang Lưu Thay Đổi...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi Hồ Sơ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ================= COLUMN 2: ĐỔI MẬT KHẨU BẢO MẬT ================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#0f172a' }}></i>
                Đổi Mật Khẩu &amp; An Ninh Tài Khoản
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem' }}>
                Định kỳ đổi mật khẩu tối thiểu 6 ký tự để bảo vệ dữ liệu nghiệp vụ và quyền hạn quản trị
              </p>
            </div>

            {/* Password Feedback alerts */}
            {passwordSuccessMsg && (
              <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div style={{ padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mật Khẩu Hiện Tại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng để xác thực"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.75rem 0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                    title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự (kết hợp chữ hoa, số)"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.75rem 0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                {/* Dynamic Strength Meter */}
                {newPassword && (
                  <div style={{ marginTop: '0.45rem' }}>
                    {(() => {
                      const strength = getPasswordStrength(newPassword);
                      return (
                        <div>
                          <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.3rem' }}>
                            <div style={{ flex: 1, background: strength.score >= 1 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                            <div style={{ flex: 1, background: strength.score >= 2 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                            <div style={{ flex: 1, background: strength.score >= 3 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                            <div style={{ flex: 1, background: strength.score >= 4 ? strength.color : '#e2e8f0', borderRadius: '2px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color }}>
                            {strength.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Xác Nhận Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại chính xác mật khẩu mới"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.75rem 0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                    Mật khẩu xác nhận chưa trùng khớp.
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.25)',
                    transition: 'background 0.2s'
                  }}
                >
                  {isChangingPassword ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Đang Cập Nhật Mật Khẩu...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-key"></i> Cập Nhật Mật Khẩu Mới
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Policy Information Note */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.78rem',
              color: '#475569',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#f59e0b' }}></i>
              Chính Sách An Toàn Phiên Làm Việc (Idle Timeout)
            </div>
            Hệ thống tự động kích hoạt khóa bảo vệ sau <strong>30 phút</strong> không có thao tác chuột hoặc bàn phím. Bạn sẽ cần nhập lại mật khẩu hiện tại để mở khóa tiếp tục làm việc nhằm chống rò rỉ dữ liệu khi rời bàn làm việc.
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .admin-account-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};
